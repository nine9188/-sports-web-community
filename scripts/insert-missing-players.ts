/**
 * DB에 없는 선수 추가 스크립트
 * 매핑 파일에는 있지만 DB에 없는 선수들을 INSERT
 *
 * 실행: npx tsx scripts/insert-missing-players.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

import { ALL_PLAYERS } from '../src/domains/livescore/constants/players';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function insertMissingPlayers() {
  console.log('🚀 누락된 선수 추가 시작...\n');

  // 1. DB에 있는 선수 ID 목록 가져오기
  console.log('📊 DB 선수 목록 조회 중...');
  const { data: existingPlayers, error: fetchError } = await supabase
    .from('football_players')
    .select('player_id');

  if (fetchError) {
    console.error('❌ DB 조회 실패:', fetchError.message);
    process.exit(1);
  }

  const existingIds = new Set(existingPlayers?.map(p => p.player_id) || []);
  console.log(`✓ DB에 ${existingIds.size}명의 선수가 있습니다.\n`);

  // 2. 매핑 파일에서 DB에 없는 선수 찾기
  const missingPlayers = ALL_PLAYERS.filter(p => !existingIds.has(p.id));

  // 중복 제거 (같은 선수가 여러 리그에 있을 수 있음)
  const uniqueMissing = Array.from(
    new Map(missingPlayers.map(p => [p.id, p])).values()
  );

  console.log(`📊 매핑 파일 선수: ${ALL_PLAYERS.length}명`);
  console.log(`📊 DB에 없는 선수: ${uniqueMissing.length}명\n`);

  if (uniqueMissing.length === 0) {
    console.log('✅ 모든 선수가 이미 DB에 있습니다!');
    return;
  }

  // 3. 누락된 선수 INSERT
  let inserted = 0;
  let errors = 0;

  const batchSize = 50;
  const batches = Math.ceil(uniqueMissing.length / batchSize);

  for (let i = 0; i < batches; i++) {
    const batch = uniqueMissing.slice(i * batchSize, (i + 1) * batchSize);
    console.log(`⏳ 배치 ${i + 1}/${batches} 처리 중... (${batch.length}명)`);

    const playersToInsert = batch.map(player => ({
      player_id: player.id,
      name: player.name,
      korean_name: player.korean_name,
      display_name: player.korean_name || player.name,
      team_id: player.team_id || 0,
      position: player.position || null,
      number: player.number || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('football_players')
      .insert(playersToInsert)
      .select('player_id');

    if (error) {
      console.error(`  ❌ 배치 에러: ${error.message}`);
      errors += batch.length;
    } else {
      inserted += data?.length || 0;
    }

    const progress = ((i + 1) / batches * 100).toFixed(1);
    console.log(`  ✓ 완료 (${progress}%) - 추가: ${inserted}, 에러: ${errors}\n`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 결과');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ 추가 성공: ${inserted}명`);
  console.log(`❌ 에러: ${errors}건`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 최종 확인
  const { data: finalCount } = await supabase
    .from('football_players')
    .select('player_id', { count: 'exact', head: true });

  const { count } = await supabase
    .from('football_players')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 최종 DB 선수 수: ${count}명`);
}

insertMissingPlayers()
  .then(() => {
    console.log('\n✨ 완료!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n💥 실패:', err);
    process.exit(1);
  });
