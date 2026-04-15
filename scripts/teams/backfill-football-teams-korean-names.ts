/**
 * football_teams 테이블의 name_ko / country_ko 백필 스크립트
 *
 * 목적: src/domains/livescore/constants/teams/* 의 한글 매핑을
 *       football_teams 테이블로 옮긴다 (단일 소스화 1단계).
 *
 * 동작:
 *   1) constants/teams/index.ts의 ALL_TEAMS를 읽음
 *   2) football_teams.team_id 매칭
 *   3) name_ko가 NULL이면 UPDATE
 *      name_ko가 이미 있고 다르면 SKIP (덮어쓰지 않음)
 *      DB에 없는 팀은 missing 리스트에 기록
 *   4) DRY_RUN=1 환경변수면 실제 UPDATE 없이 시뮬레이션만
 *
 * 실행:
 *   DRY_RUN=1 npx tsx scripts/teams/backfill-football-teams-korean-names.ts
 *   npx tsx scripts/teams/backfill-football-teams-korean-names.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { ALL_TEAMS } from '../../src/domains/livescore/constants/teams';

dotenv.config({ path: '.env.local' });

async function main() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Supabase 환경변수가 없습니다 (.env.local 확인)');
    process.exit(1);
  }

  const DRY_RUN = process.env.DRY_RUN === '1';
  console.log(DRY_RUN ? '🧪 DRY RUN 모드 (실제 UPDATE 안 함)' : '🚀 실제 UPDATE 실행');
  console.log(`📊 상수 팀 수: ${ALL_TEAMS.length}`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const teamIds: number[] = ALL_TEAMS.map((t) => t.id);

  // .in() 한 번에 1000개 제한 → 청크
  const chunkSize = 500;
  const existing: Array<{
    team_id: number;
    name: string | null;
    name_ko: string | null;
    country: string | null;
    country_ko: string | null;
  }> = [];

  for (let i = 0; i < teamIds.length; i += chunkSize) {
    const slice = teamIds.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from('football_teams')
      .select('team_id, name, name_ko, country, country_ko')
      .in('team_id', slice);
    if (error) {
      console.error('❌ DB 조회 실패:', error);
      process.exit(1);
    }
    if (data) existing.push(...data);
  }

  const dbMap = new Map<number, { name_ko: string | null; country_ko: string | null }>(
    existing.map((row) => [row.team_id, { name_ko: row.name_ko, country_ko: row.country_ko }])
  );

  const toUpdate: Array<{ team_id: number; name_ko: string; country_ko?: string }> = [];
  const conflicts: Array<{ team_id: number; db: string; const: string }> = [];
  const missingInDb: Array<{ team_id: number; name_ko: string; name_en: string }> = [];
  const alreadyOk: number[] = [];

  for (const team of ALL_TEAMS) {
    const db = dbMap.get(team.id);
    if (!db) {
      missingInDb.push({ team_id: team.id, name_ko: team.name_ko, name_en: team.name_en });
      continue;
    }
    if (db.name_ko === null) {
      toUpdate.push({
        team_id: team.id,
        name_ko: team.name_ko,
        country_ko: team.country_ko,
      });
    } else if (db.name_ko !== team.name_ko) {
      conflicts.push({ team_id: team.id, db: db.name_ko, const: team.name_ko });
    } else {
      alreadyOk.push(team.id);
    }
  }

  console.log('\n=== 분석 결과 ===');
  console.log(`✅ 이미 일치: ${alreadyOk.length}`);
  console.log(`📝 UPDATE 대상: ${toUpdate.length}`);
  console.log(`⚠️  이름 충돌 (SKIP): ${conflicts.length}`);
  console.log(`🚫 DB에 없음 (footballTeamsSync로 INSERT 필요): ${missingInDb.length}`);

  if (conflicts.length > 0) {
    console.log('\n--- 충돌 목록 (DB 우선, 덮어쓰지 않음) ---');
    conflicts.slice(0, 30).forEach((c) =>
      console.log(`  team_id=${c.team_id}: DB="${c.db}" vs 상수="${c.const}"`)
    );
    if (conflicts.length > 30) console.log(`  ... 외 ${conflicts.length - 30}개`);
  }

  if (missingInDb.length > 0) {
    console.log('\n--- DB에 없는 팀 (상위 30개) ---');
    missingInDb
      .slice(0, 30)
      .forEach((m) => console.log(`  team_id=${m.team_id}: ${m.name_ko} (${m.name_en})`));
    if (missingInDb.length > 30) console.log(`  ... 외 ${missingInDb.length - 30}개`);
  }

  if (DRY_RUN) {
    console.log('\n🧪 DRY RUN 종료. 실제 적용하려면 DRY_RUN 환경변수 빼고 재실행.');
    return;
  }

  if (toUpdate.length === 0) {
    console.log('\n✅ UPDATE할 항목 없음. 종료.');
    return;
  }

  console.log(`\n🚀 ${toUpdate.length}개 UPDATE 시작...`);
  let success = 0;
  let failed = 0;

  for (const u of toUpdate) {
    const updatePayload: Record<string, string> = { name_ko: u.name_ko };
    if (u.country_ko) updatePayload.country_ko = u.country_ko;

    const { error } = await supabase
      .from('football_teams')
      .update(updatePayload)
      .eq('team_id', u.team_id);

    if (error) {
      console.error(`  ❌ team_id=${u.team_id}: ${error.message}`);
      failed++;
    } else {
      success++;
    }
  }

  console.log(`\n=== 완료 ===`);
  console.log(`✅ 성공: ${success}`);
  console.log(`❌ 실패: ${failed}`);
}

main().catch((err) => {
  console.error('💥 스크립트 실행 오류:', err);
  process.exit(1);
});
