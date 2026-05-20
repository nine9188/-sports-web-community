/**
 * 선수 한글명 마이그레이션 스크립트
 * 매핑 파일의 korean_name을 DB의 football_players 테이블로 이전
 *
 * 실행: npx tsx scripts/migrate-korean-names.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// .env.local 파일 로드
dotenv.config({ path: '.env.local' });

// 매핑 파일에서 선수 데이터 import
import { ALL_PLAYERS } from '../src/domains/livescore/constants/players';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateKoreanNames() {
  console.log('🚀 선수 한글명 마이그레이션 시작...\n');

  // 한글명이 있는 선수만 필터링
  const playersWithKoreanName = ALL_PLAYERS.filter(p => p.korean_name);
  console.log(`📊 매핑 파일 선수 수: ${ALL_PLAYERS.length}명`);
  console.log(`📊 한글명 있는 선수: ${playersWithKoreanName.length}명\n`);

  let updated = 0;
  let notFound = 0;
  let errors = 0;

  // 배치 처리 (100명씩)
  const batchSize = 100;
  const batches = Math.ceil(playersWithKoreanName.length / batchSize);

  for (let i = 0; i < batches; i++) {
    const batch = playersWithKoreanName.slice(i * batchSize, (i + 1) * batchSize);

    console.log(`⏳ 배치 ${i + 1}/${batches} 처리 중... (${batch.length}명)`);

    for (const player of batch) {
      try {
        const { data, error } = await supabase
          .from('football_players')
          .update({ korean_name: player.korean_name })
          .eq('player_id', player.id)
          .select('player_id');

        if (error) {
          console.error(`  ❌ 에러 (ID: ${player.id}): ${error.message}`);
          errors++;
        } else if (data && data.length > 0) {
          updated++;
        } else {
          // DB에 해당 player_id가 없음
          notFound++;
        }
      } catch (err) {
        console.error(`  ❌ 예외 (ID: ${player.id}):`, err);
        errors++;
      }
    }

    // 진행률 표시
    const progress = ((i + 1) / batches * 100).toFixed(1);
    console.log(`  ✓ 완료 (${progress}%) - 업데이트: ${updated}, 미발견: ${notFound}, 에러: ${errors}\n`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 마이그레이션 결과');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ 업데이트 성공: ${updated}명`);
  console.log(`⚠️  DB에 없음: ${notFound}명`);
  console.log(`❌ 에러: ${errors}건`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 결과 확인
  const { data: checkData } = await supabase
    .from('football_players')
    .select('player_id, korean_name')
    .not('korean_name', 'is', null)
    .limit(5);

  if (checkData && checkData.length > 0) {
    console.log('🔍 샘플 확인 (한글명이 업데이트된 선수):');
    checkData.forEach(p => {
      console.log(`  - ID ${p.player_id}: ${p.korean_name}`);
    });
  }
}

migrateKoreanNames()
  .then(() => {
    console.log('\n✨ 마이그레이션 완료!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n💥 마이그레이션 실패:', err);
    process.exit(1);
  });
