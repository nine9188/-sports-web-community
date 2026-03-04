'use server';

import { getSupabaseAdmin } from '@/shared/lib/supabase/server';

/**
 * 경기 데이터 Supabase 캐시 헬퍼
 *
 * 테이블: match_cache
 * - match_id: 경기 ID
 * - data_type: 'full' | 'matchPlayerStats'
 * - data: JSONB 데이터
 * - match_status: 경기 상태 (FT/AET/PEN)
 * - updated_at: 마지막 갱신 시각
 *
 * 종료된 경기(FT/AET/PEN)만 캐시합니다.
 * 모든 데이터는 영구 캐시 (종료 경기 데이터는 불변).
 */

type MatchDataType = 'full' | 'matchPlayerStats';

/**
 * 캐시 데이터 저장 전 유효성 검증
 *
 * 영구 캐시이므로 잘못된 데이터가 영원히 남지 않도록 반드시 검증.
 * 검증 실패 → 저장 안 함 → 다음 요청에서 API 재호출.
 */
function validateCacheData(dataType: MatchDataType, data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;

  const d = data as Record<string, unknown>;

  switch (dataType) {
    case 'full': {
      // success + match + lineups·events·stats 모두 있어야 유효
      if (!d.success || !d.match) return false;
      const lineups = d.lineups as Record<string, unknown> | undefined;
      if (!lineups?.response) return false;
      if (!Array.isArray(d.events) || d.events.length === 0) return false;
      if (!Array.isArray(d.stats) || d.stats.length === 0) return false;
      return true;
    }

    case 'matchPlayerStats': {
      // success + allPlayersData 비어있지 않음 + ratings 존재
      if (!d.success) return false;
      if (!Array.isArray(d.allPlayersData) || d.allPlayersData.length === 0) return false;
      if (!d.ratings || typeof d.ratings !== 'object') return false;
      return true;
    }

    default:
      return false;
  }
}

/**
 * 캐시에서 데이터 읽기
 */
export async function getMatchCache(
  matchId: number,
  dataType: MatchDataType
): Promise<unknown | null> {
  try {
    const supabase = getSupabaseAdmin();

    const { data: row, error } = await supabase
      .from('match_cache')
      .select('data')
      .eq('match_id', matchId)
      .eq('data_type', dataType)
      .maybeSingle();

    if (error || !row) return null;
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
      .select('data_type, data')
      .eq('match_id', matchId)
      .in('data_type', dataTypes);

    if (error || !rows) return {};

    const result: Record<string, unknown> = {};
    for (const row of rows) {
      result[row.data_type] = row.data;
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * 캐시에 데이터 저장 (upsert) — 종료 경기만
 * 저장 전 데이터 유효성을 검증하여 불완전한 데이터가 영구 캐시되는 것을 방지.
 */
export async function setMatchCache(
  matchId: number,
  dataType: MatchDataType,
  data: unknown,
  matchStatus: string = 'FT'
): Promise<void> {
  try {
    if (!validateCacheData(dataType, data)) {
      console.log(`[MatchCache] 검증 실패, 캐시 스킵: match=${matchId} type=${dataType}`);
      return;
    }

    const supabase = getSupabaseAdmin();

    await supabase
      .from('match_cache')
      .upsert(
        {
          match_id: matchId,
          data_type: dataType,
          data: data as Record<string, unknown>,
          match_status: matchStatus,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'match_id,data_type' }
      );
  } catch {
    // 캐시 저장 실패는 무시
  }
}
