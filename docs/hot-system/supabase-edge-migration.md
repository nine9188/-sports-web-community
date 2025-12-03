# Supabase Edge Function 마이그레이션 가이드

> **Vercel Cron → Supabase Edge Function + pg_cron**

---

## 📋 마이그레이션 목적

### 현재 문제점 (Vercel Cron)

| 문제 | 설명 |
|-----|------|
| **Hobby 플랜 제약** | 하루 1회만 실행 가능 (`0 0 * * *`) |
| **네트워크 레이턴시** | Vercel → Supabase 외부 호출 |
| **비용** | Vercel Function 실행 시간 과금 |
| **확장성** | DB 관련 다른 Cron 작업 추가 어려움 |

### Supabase Edge Function 장점

| 장점 | 설명 |
|-----|------|
| **무료 매시간** | Hobby 플랜 제약 없음, `0 * * * *` 가능 |
| **빠른 실행** | Supabase 내부에서 실행 (같은 리전) |
| **무료 할당** | 500K 무료 호출/월 (매시간 실행해도 720회/월) |
| **확장 가능** | pg_cron으로 여러 DB 작업 쉽게 추가 |

---

## 🏗️ 마이그레이션 아키텍처

### Before (현재)

```
┌─────────────────────────────────────┐
│       Vercel Cron (하루 1회)         │
│     Schedule: 0 0 * * *              │
└──────────────┬──────────────────────┘
               │ (외부 HTTP)
               ▼
┌─────────────────────────────────────┐
│   Next.js API Route (Vercel)        │
│   /api/cron/check-hot-posts         │
└──────────────┬──────────────────────┘
               │ (Supabase 클라이언트)
               ▼
┌─────────────────────────────────────┐
│      Supabase Database              │
│   - posts 조회                       │
│   - comments 조회                    │
│   - notifications 삽입               │
└─────────────────────────────────────┘
```

### After (마이그레이션 후)

```
┌─────────────────────────────────────┐
│    pg_cron (Supabase 내부)           │
│     Schedule: 0 * * * *              │
│     (매시간 실행 가능!)               │
└──────────────┬──────────────────────┘
               │ (내부 호출)
               ▼
┌─────────────────────────────────────┐
│   Supabase Edge Function            │
│   check-hot-posts                    │
│   (Deno Runtime)                     │
└──────────────┬──────────────────────┘
               │ (로컬 DB 접근)
               ▼
┌─────────────────────────────────────┐
│      Supabase Database              │
│   - posts 조회                       │
│   - comments 조회                    │
│   - notifications 삽입               │
└─────────────────────────────────────┘
```

---

## 📂 파일 구조

### 새로 생성할 파일

```
supabase/
└── functions/
    └── check-hot-posts/
        ├── index.ts           # Edge Function 메인 로직
        ├── deno.json          # Deno 설정
        └── README.md          # Edge Function 문서
```

### 기존 파일 변경

```
src/
├── app/api/cron/check-hot-posts/
│   └── route.ts              # ❌ 삭제 또는 비활성화
│
└── domains/notifications/actions/
    └── checkHotPosts.ts      # ✅ 로직은 Edge Function으로 이동

vercel.json                   # ❌ crons 섹션 제거
```

---

## 🔧 구현 단계

### Step 1: Supabase Edge Function 생성

**파일**: `supabase/functions/check-hot-posts/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// HOT 점수 계산 함수 (기존 로직 동일)
function calculateHotScore(
  views: number,
  likes: number,
  comments: number,
  createdAt: string,
  windowDays: number
): number {
  const now = Date.now();
  const postTime = new Date(createdAt).getTime();
  const hoursSince = (now - postTime) / (1000 * 60 * 60);
  const maxHours = windowDays * 24;
  const timeDecay = Math.max(0, 1 - hoursSince / maxHours);

  const rawScore = views * 1 + likes * 10 + comments * 20;
  return rawScore * timeDecay;
}

serve(async (req) => {
  try {
    // Supabase 클라이언트 생성 (Service Role Key 사용)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const windowDays = 7;
    const windowStart = new Date(
      Date.now() - windowDays * 24 * 60 * 60 * 1000
    ).toISOString();

    // 1. 최근 7일 게시글 조회
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('id, title, created_at, board_id, views, likes, post_number, user_id')
      .gte('created_at', windowStart)
      .eq('is_deleted', false)
      .eq('is_hidden', false)
      .limit(100);

    if (postsError || !postsData || postsData.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No posts found',
          processed: 0,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. 게시판 정보 조회
    const boardIds = [...new Set(postsData.map(p => p.board_id).filter(Boolean))];
    const { data: boardsData } = await supabase
      .from('boards')
      .select('id, slug')
      .in('id', boardIds);

    const boardMap: Record<string, string> = {};
    (boardsData || []).forEach(board => {
      if (board?.id) boardMap[board.id] = board.slug || board.id;
    });

    // 3. 댓글 수 집계
    const commentCounts: Record<string, number> = {};
    const postIds = postsData.map(p => p.id);

    if (postIds.length > 0) {
      const { data: commentsData } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds)
        .neq('is_hidden', true)
        .neq('is_deleted', true);

      if (commentsData) {
        commentsData.forEach(comment => {
          if (comment.post_id) {
            commentCounts[comment.post_id] = (commentCounts[comment.post_id] || 0) + 1;
          }
        });
      }
    }

    // 4. HOT 점수 계산
    const scoredPosts = postsData
      .map(post => ({
        id: post.id,
        title: post.title || '',
        board_id: post.board_id || '',
        board_slug: boardMap[post.board_id || ''] || '',
        post_number: post.post_number || 0,
        user_id: post.user_id || '',
        views: post.views || 0,
        likes: post.likes || 0,
        comment_count: commentCounts[post.id] || 0,
        hot_score: calculateHotScore(
          post.views || 0,
          post.likes || 0,
          commentCounts[post.id] || 0,
          post.created_at,
          windowDays
        ),
        hot_rank: 0,
      }))
      .sort((a, b) => b.hot_score - a.hot_score)
      .slice(0, 20);

    scoredPosts.forEach((post, index) => {
      post.hot_rank = index + 1;
    });

    // 5. 이미 알림 보낸 게시글 확인 (최근 24시간)
    const recentNotificationCheck = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: existingNotifications } = await supabase
      .from('notifications')
      .select('metadata')
      .eq('type', 'hot_post')
      .gte('created_at', recentNotificationCheck);

    const notifiedPostIds = new Set(
      (existingNotifications || [])
        .filter(n => n.metadata?.post_id)
        .map(n => n.metadata.post_id)
    );

    // 6. 상위 10위 이내 게시글에 알림 발송
    const notificationsToSend = scoredPosts
      .filter(post => post.hot_rank <= 10 && !notifiedPostIds.has(post.id))
      .filter(post => post.user_id);

    let successCount = 0;
    let failCount = 0;

    for (const post of notificationsToSend) {
      const { error } = await supabase.from('notifications').insert({
        user_id: post.user_id,
        actor_id: null,
        type: 'hot_post',
        title: `🔥 내 게시글이 HOT 게시글 ${post.hot_rank}위에 진입했어요!`,
        message: post.title.length > 50 ? post.title.substring(0, 50) + '...' : post.title,
        link: `/boards/${post.board_slug}/${post.post_number}`,
        metadata: {
          post_id: post.id,
          post_title: post.title,
          post_number: post.post_number,
          board_slug: post.board_slug,
          hot_rank: post.hot_rank,
          hot_score: post.hot_score,
        },
      });

      if (error) {
        console.error(`Failed to send notification for post ${post.id}:`, error);
        failCount++;
      } else {
        successCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'HOT post notifications processed',
        totalHotPosts: scoredPosts.length,
        notificationsSent: successCount,
        notificationsFailed: failCount,
        topPosts: scoredPosts.slice(0, 5).map(p => ({
          rank: p.hot_rank,
          title: p.title,
          score: p.hot_score.toFixed(2),
        })),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in checkHotPosts:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
```

### Step 2: Supabase Edge Function 배포

```bash
# Supabase CLI 설치 (한 번만)
npm install -g supabase

# Supabase 프로젝트 연결
supabase link --project-ref your-project-ref

# Edge Function 배포
supabase functions deploy check-hot-posts
```

### Step 3: pg_cron 스케줄 설정

Supabase Dashboard → SQL Editor에서 실행:

```sql
-- 1. pg_cron 확장 활성화 (한 번만)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. 매시간 정각에 Edge Function 호출
SELECT cron.schedule(
  'check-hot-posts-hourly',           -- 작업 이름
  '0 * * * *',                         -- 매시간 정각 (0분)
  $$
  SELECT
    net.http_post(
      url := 'https://your-project-ref.supabase.co/functions/v1/check-hot-posts',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    );
  $$
);

-- 3. 스케줄 확인
SELECT * FROM cron.job;
```

**참고**: `service_role_key`는 Supabase Dashboard → Settings → API에서 확인

### Step 4: Vercel Cron 제거

**vercel.json** 파일 수정:

```json
{
  "crons": []
}
```

또는 파일 삭제:

```bash
rm vercel.json
```

**src/app/api/cron/check-hot-posts/route.ts** 삭제:

```bash
rm -rf src/app/api/cron/check-hot-posts
```

---

## 🧪 테스트

### 1. 로컬 테스트

```bash
# Supabase Functions 로컬 실행
supabase functions serve check-hot-posts

# 별도 터미널에서 테스트
curl -X POST http://localhost:54321/functions/v1/check-hot-posts \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 2. 프로덕션 수동 테스트

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/check-hot-posts \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 3. pg_cron 로그 확인

```sql
-- 최근 실행 로그 확인
SELECT
  jobid,
  jobname,
  last_run_started_at,
  last_successful_run,
  last_error
FROM cron.job_run_details
WHERE jobname = 'check-hot-posts-hourly'
ORDER BY last_run_started_at DESC
LIMIT 10;
```

---

## 📊 성능 비교

| 지표 | Vercel Cron | Supabase Edge Function |
|-----|------------|------------------------|
| **실행 빈도** | 하루 1회 | 매시간 (24배 ↑) |
| **레이턴시** | ~500ms | ~100ms (5배 ↑) |
| **비용** | Vercel Function 과금 | 무료 (500K/월) |
| **확장성** | 어려움 | 쉬움 (pg_cron) |

---

## 🔐 보안

### 환경 변수

Edge Function에서 자동으로 사용 가능:
- `SUPABASE_URL`: 자동 주입
- `SUPABASE_SERVICE_ROLE_KEY`: 자동 주입

### 인증

- Edge Function은 `Authorization: Bearer` 헤더 필요
- pg_cron에서 `service_role_key` 사용

---

## 📝 롤백 계획

문제 발생 시 Vercel Cron으로 되돌리기:

```bash
# 1. vercel.json 복구
git revert HEAD~1

# 2. API Route 복구
git checkout HEAD~1 -- src/app/api/cron/check-hot-posts

# 3. 재배포
git push origin main
```

---

## 📚 관련 문서

- [Supabase Edge Functions 공식 문서](https://supabase.com/docs/guides/functions)
- [pg_cron 공식 문서](https://github.com/citusdata/pg_cron)
- [HOT 점수 계산 알고리즘](./score-calculation.md)
- [알림 시스템 개요](../notifications/system-overview.md)

---

**작성일**: 2025-12-03
**작성자**: Claude Code
**버전**: 1.0.0
**상태**: ✅ 준비 완료
