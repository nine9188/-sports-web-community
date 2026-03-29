'use server';

import { getSupabaseAdmin } from '@/shared/lib/supabase/server';
import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi';
import { getCurrentSeasonForLeague } from '@/domains/livescore/constants/league-mappings';

// Tier 1~3 리그 (cron으로 주 1회 갱신)
const CACHED_LEAGUES = [
  // Tier 1: 5대 리그
  39, 140, 135, 78, 61,
  // Tier 2: K리그, 챔피언십, 에레디비시, 포르투갈리가
  292, 40, 88, 94,
  // Tier 3: J리그, MLS, 사우디, 브라질레이랑
  98, 253, 307, 71,
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface TransferRecord {
  player_id: number;
  player_name: string;
  player_photo: string;
  player_age: number;
  player_nationality: string;
  league_id: number;
  team_in_id: number;
  team_in_name: string;
  team_in_logo: string;
  team_out_id: number;
  team_out_name: string;
  team_out_logo: string;
  transfer_date: string;
  transfer_type: string;
  fetched_at: string;
}

function isValidDate(dateString: string): boolean {
  if (!dateString) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;
  const year = date.getFullYear();
  return year >= 2020 && year <= 2030;
}

async function fetchTeamTransferRecords(
  teamId: number,
  leagueId: number,
  fetchedAt: string
): Promise<TransferRecord[]> {
  try {
    const data = await fetchFromFootballApi('transfers', { team: teamId });
    if (!data.response || !Array.isArray(data.response)) return [];

    const records: TransferRecord[] = [];

    for (const item of data.response) {
      if (!item.player?.id || !item.transfers) continue;

      for (const t of item.transfers) {
        if (!isValidDate(t.date)) continue;
        if (!t.teams?.in?.id || !t.teams?.out?.id) continue;
        if (!t.teams.in.name || !t.teams.out.name) continue;
        if (t.teams.in.name.trim().length < 2 || t.teams.out.name.trim().length < 2) continue;

        records.push({
          player_id: item.player.id,
          player_name: item.player.name || '',
          player_photo: item.player.photo || '',
          player_age: item.player.age || 0,
          player_nationality: item.player.nationality || '',
          league_id: leagueId,
          team_in_id: t.teams.in.id,
          team_in_name: t.teams.in.name,
          team_in_logo: t.teams.in.logo || '',
          team_out_id: t.teams.out.id,
          team_out_name: t.teams.out.name,
          team_out_logo: t.teams.out.logo || '',
          transfer_date: t.date,
          transfer_type: t.type || '',
          fetched_at: fetchedAt,
        });
      }
    }

    return records;
  } catch (error) {
    console.error(`팀 ${teamId} 이적 데이터 fetch 실패:`, error);
    return [];
  }
}

/**
 * 단일 리그의 이적 캐시 갱신
 * - 1개 리그만 처리 → ~20팀 × 2.2초 = 약 45초 (타임아웃 안전)
 * - API rate limit 준수: 2.2초 간격
 */
export async function refreshLeagueTransferCache(leagueId: number): Promise<{
  success: boolean;
  leagueId: number;
  teams: number;
  transfers: number;
  errors: number;
  durationMs: number;
}> {
  const startTime = Date.now();
  const fetchedAt = new Date().toISOString();
  const supabase = getSupabaseAdmin();

  let teams = 0;
  let transfers = 0;
  let errors = 0;

  try {
    // 1. 팀 목록
    const season = getCurrentSeasonForLeague(leagueId);
    const teamsData = await fetchFromFootballApi('teams', { league: leagueId, season });

    if (!teamsData.response || teamsData.response.length === 0) {
      return { success: true, leagueId, teams: 0, transfers: 0, errors: 0, durationMs: Date.now() - startTime };
    }

    const teamIds = teamsData.response.map((t: { team: { id: number } }) => t.team.id);

    // 2. 기존 캐시 삭제
    await supabase.from('transfer_cache').delete().eq('league_id', leagueId);

    // 3. 팀별 순차 처리 (2.2초 간격)
    const allRecords: TransferRecord[] = [];

    for (let i = 0; i < teamIds.length; i++) {
      if (i > 0) await delay(2200);

      const records = await fetchTeamTransferRecords(teamIds[i], leagueId, fetchedAt);
      allRecords.push(...records);
      teams++;

      if (records.length === 0) errors++;
    }

    // 4. 배치 upsert
    for (let i = 0; i < allRecords.length; i += 1000) {
      const batch = allRecords.slice(i, i + 1000);
      const { error } = await supabase
        .from('transfer_cache')
        .upsert(batch, {
          onConflict: 'player_id,transfer_date,team_in_id,team_out_id',
          ignoreDuplicates: true,
        });

      if (error) {
        console.error(`[Transfer Cache] 리그 ${leagueId} upsert 오류:`, error);
        errors++;
      } else {
        transfers += batch.length;
      }
    }

    console.log(`[Transfer Cache] 리그 ${leagueId} 완료: ${teams}팀, ${transfers}건`);

    return { success: true, leagueId, teams, transfers, errors, durationMs: Date.now() - startTime };
  } catch (error) {
    console.error(`[Transfer Cache] 리그 ${leagueId} 실패:`, error);
    return { success: false, leagueId, teams, transfers, errors: errors + 1, durationMs: Date.now() - startTime };
  }
}

/**
 * 전체 리그 이적 캐시 갱신 (Tier 1~3)
 * cron route에서 리그별로 순차 호출
 */
export async function refreshAllTransferCache(): Promise<{
  success: boolean;
  message: string;
  results: Array<{ leagueId: number; teams: number; transfers: number; errors: number; durationMs: number }>;
}> {
  const results = [];

  for (const leagueId of CACHED_LEAGUES) {
    const result = await refreshLeagueTransferCache(leagueId);
    results.push(result);

    // 리그 간 3초 대기
    await delay(3000);
  }

  const totalTransfers = results.reduce((sum, r) => sum + r.transfers, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);

  return {
    success: totalErrors === 0,
    message: `${CACHED_LEAGUES.length}개 리그 갱신 완료: ${totalTransfers}건`,
    results,
  };
}
