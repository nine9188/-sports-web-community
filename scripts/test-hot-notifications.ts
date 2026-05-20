/**
 * HOT 알림 테스트 스크립트
 *
 * 사용법:
 * 1. 환경 변수 설정: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * 2. 실행: npx tsx scripts/test-hot-notifications.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 .env.local에 설정하세요.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * HOT 점수 계산
 */
function calculateHotScore(
  views: number,
  likes: number,
  comments: number,
  createdAt: string,
  windowDays: number = 7
): number {
  const now = Date.now();
  const postTime = new Date(createdAt).getTime();
  const hoursSince = (now - postTime) / (1000 * 60 * 60);
  const maxHours = windowDays * 24;
  const timeDecay = Math.max(0, 1 - (hoursSince / maxHours));

  const rawScore = (views * 1) + (likes * 10) + (comments * 20);
  const hotScore = rawScore * timeDecay;

  return hotScore;
}

/**
 * 테스트용 게시글 생성
 */
async function createTestPosts() {
  console.log('📝 테스트용 게시글 생성 중...\n');

  // 첫 번째 게시판과 사용자 가져오기
  const { data: board } = await supabase.from('boards').select('id, slug').limit(1).single();
  const { data: user } = await supabase.from('profiles').select('id').limit(1).single();

  if (!board || !user) {
    console.error('❌ 게시판 또는 사용자를 찾을 수 없습니다.');
    return;
  }

  console.log(`✅ 게시판: ${board.slug}, 사용자: ${user.id}\n`);

  // 테스트 게시글 3개 생성
  const testPosts = [
    {
      title: '[테스트] HOT 1위 예상 게시글 - 높은 점수',
      views: 150,
      likes: 30,
      hours_ago: 2,
    },
    {
      title: '[테스트] HOT 2위 예상 게시글 - 중간 점수',
      views: 80,
      likes: 15,
      hours_ago: 12,
    },
    {
      title: '[테스트] HOT 3위 예상 게시글 - 낮은 점수',
      views: 50,
      likes: 8,
      hours_ago: 48,
    },
  ];

  const createdPosts = [];

  for (let i = 0; i < testPosts.length; i++) {
    const testPost = testPosts[i];
    const createdAt = new Date(Date.now() - testPost.hours_ago * 60 * 60 * 1000).toISOString();

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        board_id: board.id,
        user_id: user.id,
        title: testPost.title,
        content: '<p>테스트 내용입니다.</p>',
        views: testPost.views,
        likes: testPost.likes,
        created_at: createdAt,
      })
      .select()
      .single();

    if (error) {
      console.error(`❌ 게시글 ${i + 1} 생성 실패:`, error);
      continue;
    }

    // 댓글 몇 개 추가 (첫 번째 게시글에만)
    if (i === 0) {
      const comments = [];
      for (let j = 0; j < 10; j++) {
        comments.push({
          post_id: post.id,
          user_id: user.id,
          content: `테스트 댓글 ${j + 1}`,
          created_at: createdAt,
        });
      }
      await supabase.from('comments').insert(comments);
    }

    const commentCount = i === 0 ? 10 : 0;
    const hotScore = calculateHotScore(
      testPost.views,
      testPost.likes,
      commentCount,
      createdAt
    );

    createdPosts.push({
      ...post,
      comment_count: commentCount,
      hot_score: hotScore,
    });

    console.log(`✅ 게시글 ${i + 1} 생성 완료:`);
    console.log(`   제목: ${post.title}`);
    console.log(`   조회수: ${testPost.views}, 좋아요: ${testPost.likes}, 댓글: ${commentCount}`);
    console.log(`   HOT 점수: ${hotScore.toFixed(2)}`);
    console.log(`   게시글 ID: ${post.id}\n`);
  }

  return createdPosts;
}

/**
 * HOT 알림 수동 발송 테스트
 */
async function testHotNotifications() {
  console.log('\n🔥 HOT 알림 발송 테스트 시작...\n');

  // Edge Function 호출 (로컬 또는 프로덕션)
  const isLocal = process.argv.includes('--local');
  const functionUrl = isLocal
    ? 'http://localhost:54321/functions/v1/check-hot-posts'
    : `${SUPABASE_URL}/functions/v1/check-hot-posts`;

  console.log(`📡 Edge Function 호출: ${functionUrl}\n`);

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    console.log('✅ Edge Function 실행 완료:\n');
    console.log(`   전체 HOT 게시글: ${result.totalHotPosts}개`);
    console.log(`   알림 발송 성공: ${result.notificationsSent}개`);
    console.log(`   알림 발송 실패: ${result.notificationsFailed}개`);

    if (result.topPosts && result.topPosts.length > 0) {
      console.log('\n📊 상위 5개 HOT 게시글:');
      result.topPosts.forEach((post: { rank: number; title: string; score: string }) => {
        console.log(`   ${post.rank}위. ${post.title} (점수: ${post.score})`);
      });
    }
  } catch (error) {
    console.error('❌ Edge Function 실행 실패:', error);
  }
}

/**
 * 생성된 알림 확인
 */
async function checkNotifications() {
  console.log('\n📬 발송된 알림 확인 중...\n');

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('type', 'hot_post')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ 알림 조회 실패:', error);
    return;
  }

  if (!notifications || notifications.length === 0) {
    console.log('⚠️  발송된 HOT 알림이 없습니다.\n');
    return;
  }

  console.log(`✅ ${notifications.length}개의 HOT 알림 발견:\n`);

  notifications.forEach((notif: {
    title: string;
    message: string;
    user_id: string;
    is_read: boolean;
    created_at: string;
    metadata?: { hot_rank?: number; hot_score?: number };
  }, index: number) => {
    console.log(`${index + 1}. ${notif.title}`);
    console.log(`   메시지: ${notif.message}`);
    console.log(`   수신자: ${notif.user_id}`);
    console.log(`   HOT 순위: ${notif.metadata?.hot_rank || 'N/A'}위`);
    console.log(`   HOT 점수: ${notif.metadata?.hot_score?.toFixed(2) || 'N/A'}`);
    console.log(`   읽음 여부: ${notif.is_read ? '읽음' : '안읽음'}`);
    console.log(`   생성 시간: ${new Date(notif.created_at).toLocaleString('ko-KR')}\n`);
  });
}

/**
 * 테스트 데이터 정리
 */
async function cleanup() {
  console.log('🧹 테스트 데이터 정리 중...\n');

  // 테스트 게시글 삭제
  const { error: postsError } = await supabase
    .from('posts')
    .delete()
    .like('title', '%[테스트]%');

  if (postsError) {
    console.error('❌ 게시글 삭제 실패:', postsError);
  } else {
    console.log('✅ 테스트 게시글 삭제 완료');
  }

  // 테스트 알림 삭제
  const { error: notifsError } = await supabase
    .from('notifications')
    .delete()
    .eq('type', 'hot_post')
    .like('message', '%[테스트]%');

  if (notifsError) {
    console.error('❌ 알림 삭제 실패:', notifsError);
  } else {
    console.log('✅ 테스트 알림 삭제 완료');
  }

  console.log('\n✨ 정리 완료!\n');
}

/**
 * 메인 실행
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    console.log(`
HOT 알림 테스트 스크립트

사용법:
  npx tsx scripts/test-hot-notifications.ts [옵션]

옵션:
  --local       로컬 Edge Function 호출 (기본: 프로덕션)
  --cleanup     테스트 데이터만 정리하고 종료
  --check-only  알림 확인만 실행
  --help        도움말 표시

예시:
  npx tsx scripts/test-hot-notifications.ts
  npx tsx scripts/test-hot-notifications.ts --local
  npx tsx scripts/test-hot-notifications.ts --cleanup
    `);
    return;
  }

  if (args.includes('--cleanup')) {
    await cleanup();
    return;
  }

  if (args.includes('--check-only')) {
    await checkNotifications();
    return;
  }

  console.log('🚀 HOT 알림 시스템 테스트 시작\n');
  console.log('=' .repeat(60) + '\n');

  // 1. 테스트 게시글 생성
  await createTestPosts();

  // 2. HOT 알림 발송
  await testHotNotifications();

  // 3. 발송된 알림 확인
  await checkNotifications();

  console.log('=' .repeat(60) + '\n');
  console.log('✅ 테스트 완료!\n');
  console.log('💡 테스트 데이터를 정리하려면:');
  console.log('   npx tsx scripts/test-hot-notifications.ts --cleanup\n');
}

main().catch(console.error);
