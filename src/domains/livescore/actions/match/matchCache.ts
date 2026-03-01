'use server';

import { getSupabaseAdmin } from '@/shared/lib/supabase/server';

/**
 * 경기 데이터 Supabase 캐시 헬퍼
 *
 * 테이블: match_cache
 * - match_id: 경기 ID
 * - data_type: 'full' | 'events' | 'lineups' | 'stats' | 'power' | 'playerRatings' | 'matchPlayerStats'
 * - data: JSONB 데이터
 * - match_status: 경기 상태 (FT만 저장)
 * - updated_at: 마지막 갱신 시각
 *
 * 종료된 경기(FT)만 캐시합니다.
 * 경기 직후 데이터(events, stats 등)가 불완전할 수 있으므로
 * data_type별 soft TTL을 적용하여 재검증 기회를 제공합니다.
 */

type MatchDataType = 'full' | 'events' | 'lineups' | 'stats' | 'power' | 'playerRatings' | 'matchPlayerStats';

// data_type별 soft TTL (밀리초). 없으면 영구 캐시.
const SOFT_TTL_MS: Partial<Record<MatchDataType, number>> = {
  full:             6 * 60 * 60 * 1000,  // 6시간
  events:           6 * 60 * 60 * 1000,
  lineups:          6 * 60 * 60 * 1000,
  stats:            6 * 60 * 60 * 1000,
  playerRatings:    6 * 60 * 60 * 1000,
  matchPlayerStats: 6 * 60 * 60 * 1000,
  // power: TTL 없음 (계산 결과, 불변)
};

function isExpired(updatedAt: string, dataType: MatchDataType): boolean {
  const ttl = SOFT_TTL_MS[dataType];
  if (!ttl) return false; // TTL 없으면 만료 안 됨
  return Date.now() - new Date(updatedAt).getTime() > ttl;
}

/**
 * 캐시에서 데이터 읽기
 * @returns data (없으면 null)
 */
export async function getMatchCache(
  matchId: number,
  dataType: MatchDataType
): Promise<unknown | null> {
  try {
    const supabase = getSupabaseAdmin();

    const { data: row, error } = await supabase
      .from('match_cache')
      .select('data, updated_at')
      .eq('match_id', matchId)
      .eq('data_type', dataType)
      .maybeSingle();

    if (error || !row) {
      return null;
    }

    if (isExpired(row.updated_at, dataType)) return null;
    return row.data;
  } catch {
    return null;
  }
}

/**
 * 여러 데이터 타입을 한번에 읽기 (1회 쿼리)
 */
export async function getMatchCacheBulk(
  matchId: number,
  dataTypes: MatchDataType[]
): Promise<Record<string, unknown>> {
  try {
    const supabase = getSupabaseAdmin();

    const { data: rows, error } = await supabase
      .from('match_cache')
      .select('data_type, data, updated_at')
      .eq('match_id', matchId)
      .in('data_type', dataTypes);

    if (error || !rows) {
      return {};
    }

    const result: Record<string, unknown> = {};
    for (const row of rows) {
      if (!isExpired(row.updated_at, row.data_type as MatchDataType)) {
        result[row.data_type] = row.data;
      }
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * 캐시에 데이터 저장 (upsert) — FT 경기만
 */
export async function setMatchCache(
  matchId: number,
  dataType: MatchDataType,
  data: unknown
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();

    await supabase
      .from('match_cache')
      .upsert(
        {
          match_id: matchId,
          data_type: dataType,
          data: data as Record<string, unknown>,
          match_status: 'FT',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'match_id,data_type' }
      );
  } catch {
    // 캐시 저장 실패는 무시
  }
}

/**
 * 여러 데이터를 한번에 저장
 */
export async function setMatchCacheBulk(
  matchId: number,
  entries: { dataType: MatchDataType; data: unknown }[]
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();

    const rows = entries.map(e => ({
      match_id: matchId,
      data_type: e.dataType,
      data: e.data as Record<string, unknown>,
      match_status: 'FT',
      updated_at: new Date().toISOString(),
    }));

    await supabase
      .from('match_cache')
      .upsert(rows, { onConflict: 'match_id,data_type' });
  } catch {
    // 캐시 저장 실패는 무시
  }
}
