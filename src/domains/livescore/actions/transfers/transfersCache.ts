'use server';

import { getSupabaseAdmin } from '@/shared/lib/supabase/server';

/**
 * 이적 데이터 Supabase 캐시 헬퍼
 *
 * 테이블: team_cache (기존 테이블 활용)
 * - team_id: league_id로 사용 (리그별 캐시)
 * - data_type: 'league_transfers'
 * - season: 시즌
 * - data: JSONB 이적 데이터 배열
 * - updated_at: 마지막 갱신 시각
 */

// 갱신 주기: 24시간 (이적은 자주 안변함)
const TRANSFERS_TTL = 24 * 60 * 60 * 1000;

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
 * 리그별 이적 캐시에서 데이터 읽기
 */
export async function getTransfersCache(
  leagueId: number,
  season?: number
): Promise<{ data: unknown | null; fresh: boolean }> {
  try {
    const supabase = getSupabaseAdmin();
    const seasonKey = season ?? getCurrentSeason();

    const { data: row, error } = await supabase
      .from('team_cache')
      .select('data, updated_at, season')
      .eq('team_id', leagueId) // league_id로 사용
      .eq('data_type', 'league_transfers')
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
    const fresh = elapsed < TRANSFERS_TTL;

    return { data: cacheRow.data, fresh };
  } catch {
    return { data: null, fresh: false };
  }
}

/**
 * 리그별 이적 캐시에 데이터 저장 (upsert)
 */
export async function setTransfersCache(
  leagueId: number,
  data: unknown,
  season?: number
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const seasonKey = season ?? getCurrentSeason();

    await supabase
      .from('team_cache')
      .upsert(
        {
          team_id: leagueId, // league_id로 사용
          data_type: 'league_transfers',
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

/**
 * 팀별 이적 캐시에서 데이터 읽기
 */
export async function getTeamTransfersCache(
  teamId: number
): Promise<{ data: unknown | null; fresh: boolean }> {
  try {
    const supabase = getSupabaseAdmin();

    const { data: row, error } = await supabase
      .from('team_cache')
      .select('data, updated_at, season')
      .eq('team_id', teamId)
      .eq('data_type', 'transfers')
      .eq('season', 0) // 팀 이적은 시즌 무관
      .maybeSingle();

    if (error || !row) {
      return { data: null, fresh: false };
    }

    const cacheRow = row as CacheRow;

    // TTL 체크 (24시간)
    const elapsed = Date.now() - new Date(cacheRow.updated_at).getTime();
    const fresh = elapsed < TRANSFERS_TTL;

    return { data: cacheRow.data, fresh };
  } catch {
    return { data: null, fresh: false };
  }
}

/**
 * 팀별 이적 캐시에 데이터 저장 (upsert)
 */
export async function setTeamTransfersCache(
  teamId: number,
  data: unknown
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();

    await supabase
      .from('team_cache')
      .upsert(
        {
          team_id: teamId,
          data_type: 'transfers',
          season: 0, // 팀 이적은 시즌 무관
          data: data as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'team_id,data_type,season' }
      );
  } catch {
    // 캐시 저장 실패는 무시
  }
}
