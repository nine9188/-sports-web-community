'use server';

import { getSupabaseAdmin } from '@/shared/lib/supabase/server';

/**
 * 팀 데이터 Supabase 캐시 헬퍼
 *
 * 테이블: team_cache
 * - team_id: 팀 ID
 * - data_type: 'info' | 'stats' | 'matches' | 'squad' | 'playerStats' | 'standings'
 * - season: 시즌 (0 = 시즌 무관)
 * - data: JSONB 데이터
 * - updated_at: 마지막 갱신 시각
 */

type DataType = 'info' | 'stats' | 'matches' | 'squad' | 'playerStats' | 'standings' | 'transfers';

// 갱신 주기 (ms)
const REFRESH_TTL: Record<DataType, number> = {
  info: 24 * 60 * 60 * 1000,         // 24시간
  stats: 4 * 60 * 60 * 1000,          // 4시간
  matches: 4 * 60 * 60 * 1000,        // 4시간
  squad: 24 * 60 * 60 * 1000,         // 24시간
  playerStats: 4 * 60 * 60 * 1000,    // 4시간
  standings: 4 * 60 * 60 * 1000,      // 4시간
  transfers: 24 * 60 * 60 * 1000,     // 24시간 (이적은 자주 안변함)
};

function getCurrentSeason(): number {
  const now = new Date();
  return now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
}

function isPastSeason(season: number): boolean {
  return season > 0 && season < getCurrentSeason();
}

interface CacheRow {
  data: unknown;
  updated_at: string;
  season: number;
}

/**
 * 캐시에서 데이터 읽기
 * @returns { data, fresh } — data: 캐시 데이터 (없으면 null), fresh: 갱신 불필요 여부
 */
export async function getTeamCache(
  teamId: number,
  dataType: DataType,
  season?: number
): Promise<{ data: unknown | null; fresh: boolean }> {
  try {
    const supabase = getSupabaseAdmin();
    const seasonKey = season ?? 0;

    const { data: row, error } = await supabase
      .from('team_cache')
      .select('data, updated_at, season')
      .eq('team_id', teamId)
      .eq('data_type', dataType)
      .eq('season', seasonKey)
      .maybeSingle();

    if (error || !row) {
      return { data: null, fresh: false };
    }

    const cacheRow = row as CacheRow;

    // 지난 시즌 → 영구 유효
    if (isPastSeason(cacheRow.season)) {
      return { data: cacheRow.data, fresh: true };
    }

    // TTL 체크
    const elapsed = Date.now() - new Date(cacheRow.updated_at).getTime();
    const ttl = REFRESH_TTL[dataType];
    const fresh = elapsed < ttl;

    return { data: cacheRow.data, fresh };
  } catch {
    return { data: null, fresh: false };
  }
}

/**
 * 캐시에 데이터 저장 (upsert)
 */
export async function setTeamCache(
  teamId: number,
  dataType: DataType,
  data: unknown,
  season?: number
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const seasonKey = season ?? 0;

    await supabase
      .from('team_cache')
      .upsert(
        {
          team_id: teamId,
          data_type: dataType,
          season: seasonKey,
          data: data as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'team_id,data_type,season' }
      );
  } catch {
    // 캐시 저장 실패는 무시
  }
}
