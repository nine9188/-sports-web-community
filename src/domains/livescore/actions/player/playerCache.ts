'use server';

import { getSupabaseAdmin } from '@/shared/lib/supabase/server';

/**
 * 선수 데이터 Supabase 캐시 헬퍼
 *
 * 테이블: player_cache
 * - player_id: 선수 ID
 * - data_type: 'info' | 'stats' | 'fixtures' | 'trophies' | 'transfers' | 'injuries' | 'seasons'
 * - season: 시즌 (stats, fixtures만 사용, 나머지 NULL)
 * - data: JSONB 데이터
 * - updated_at: 마지막 갱신 시각
 */

type DataType = 'info' | 'stats' | 'fixtures' | 'trophies' | 'transfers' | 'injuries' | 'seasons';

// 갱신 주기 (ms)
const REFRESH_TTL: Record<DataType, number> = {
  info: 24 * 60 * 60 * 1000,      // 24시간
  stats: 4 * 60 * 60 * 1000,       // 4시간
  fixtures: 4 * 60 * 60 * 1000,    // 4시간
  trophies: 24 * 60 * 60 * 1000,   // 24시간
  transfers: 24 * 60 * 60 * 1000,  // 24시간
  injuries: 4 * 60 * 60 * 1000,    // 4시간
  seasons: 24 * 60 * 60 * 1000,    // 24시간
};

/** 현재 시즌 계산 (7월 기준) */
function getCurrentSeason(): number {
  const now = new Date();
  return now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
}

/** 지난 시즌 여부 판단 */
function isPastSeason(season: number | null): boolean {
  if (season === null) return false;
  return season < getCurrentSeason();
}

interface CacheRow {
  data: unknown;
  updated_at: string;
  season: number | null;
}

/**
 * 캐시에서 데이터 읽기
 * - 지난 시즌: 무조건 유효 (영구 캐시)
 * - 현재 시즌/비시즌: TTL 체크 후 유효 여부 반환
 *
 * @returns { data, fresh } — data: 캐시 데이터 (없으면 null), fresh: 갱신 불필요 여부
 */
export async function getPlayerCache(
  playerId: number,
  dataType: DataType,
  season?: number
): Promise<{ data: unknown | null; fresh: boolean }> {
  try {
    const supabase = getSupabaseAdmin();

    const seasonKey = season ?? 0; // 0 = 시즌 무관 데이터

    const { data: row, error } = await supabase
      .from('player_cache')
      .select('data, updated_at, season')
      .eq('player_id', playerId)
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
export async function setPlayerCache(
  playerId: number,
  dataType: DataType,
  data: unknown,
  season?: number
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();

    const seasonKey = season ?? 0; // 0 = 시즌 무관 데이터

    await supabase
      .from('player_cache')
      .upsert(
        {
          player_id: playerId,
          data_type: dataType,
          season: seasonKey,
          data: data as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'player_id,data_type,season' }
      );
  } catch {
    // 캐시 저장 실패는 무시 (API 동작에 영향 없음)
  }
}
