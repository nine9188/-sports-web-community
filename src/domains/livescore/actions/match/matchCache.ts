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
  power: 6 * 60 * 60 * 1000, // 6시간 (최근 경기, 맞대결, 득점순위 등 변동)
  // events: 영구 (종료 경기 이벤트 불변)
  // lineups: 영구 (종료 경기 라인업 불변)
  // stats: 영구 (종료 경기 통계 불변)
  // playerRatings: 영구 (종료 경기 평점 불변)
  // matchPlayerStats: 영구 (종료 경기 선수 통계 불변)
  // full: 영구 (종료 경기 기본 데이터 불변)
};

function isExpired(updatedAt: string, dataType: MatchDataType): boolean {
  const ttl = SOFT_TTL_MS[dataType];
  if (!ttl) return false; // TTL 없으면 만료 안 됨
  return Date.now() - new Date(updatedAt).getTime() > ttl;
}

/**
 * 캐시 데이터 저장 전 유효성 검증
 *
 * 영구 캐시(TTL 없음)는 잘못된 데이터가 영원히 남으므로 반드시 검증 필요.
 * 검증 실패 시 false → 저장하지 않음 → 다음 요청에서 API 재호출.
 */
function validateCacheData(dataType: MatchDataType, data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;

  const d = data as Record<string, unknown>;

  switch (dataType) {
    case 'full': {
      // success=true, match 존재, lineups·events·stats 있어야 유효
      if (!d.success) return false;
      if (!d.match) return false;
      const lineups = d.lineups as Record<string, unknown> | undefined;
      if (!lineups?.response) return false;
      if (!Array.isArray(d.events) || d.events.length === 0) return false;
      if (!Array.isArray(d.stats) || d.stats.length === 0) return false;
      return true;
    }

    case 'power': {
      // success=true, data 내부 구조 + 정합성 검증
      // API 9개 호출(h2h, recentA/B, topPlayersA/B(각 stats+squad))이므로
      // 부분 실패 시 불완전한 데이터가 영구 캐시되는 것을 방지
      if (!d.success) return false;
      const pd = d.data as Record<string, unknown> | undefined;
      if (!pd) return false;

      // 팀 ID 존재
      if (!pd.teamA || !pd.teamB) return false;

      // --- h2h 검증 ---
      const h2h = pd.h2h as Record<string, unknown> | undefined;
      if (!h2h || !h2h.resultSummary) return false;
      const h2hItems = h2h.items;
      if (!Array.isArray(h2hItems)) return false;
      // 정합성: items가 있으면 resultSummary 합계가 items 수와 일치해야 함
      if (h2hItems.length > 0) {
        const rs = h2h.resultSummary as Record<string, Record<string, number>> | undefined;
        if (!rs?.teamA || !rs?.teamB) return false;
        const sumA = (rs.teamA.win || 0) + (rs.teamA.draw || 0) + (rs.teamA.loss || 0);
        const sumB = (rs.teamB.win || 0) + (rs.teamB.draw || 0) + (rs.teamB.loss || 0);
        if (sumA !== h2hItems.length || sumB !== h2hItems.length) return false;
      }

      // --- recent 검증 ---
      const recent = pd.recent as Record<string, unknown> | undefined;
      if (!recent) return false;
      const recentA = recent.teamA as Record<string, unknown> | undefined;
      const recentB = recent.teamB as Record<string, unknown> | undefined;
      if (!recentA || !recentB) return false;
      // 모든 팀은 최근 경기가 있어야 함
      if (!Array.isArray(recentA.items) || recentA.items.length === 0) return false;
      if (!Array.isArray(recentB.items) || recentB.items.length === 0) return false;
      // 정합성: summary 합계가 items 수와 일치
      const sumRA = recentA.summary as Record<string, number> | undefined;
      const sumRB = recentB.summary as Record<string, number> | undefined;
      if (sumRA) {
        const total = (sumRA.win || 0) + (sumRA.draw || 0) + (sumRA.loss || 0);
        if (total !== (recentA.items as unknown[]).length) return false;
      }
      if (sumRB) {
        const total = (sumRB.win || 0) + (sumRB.draw || 0) + (sumRB.loss || 0);
        if (total !== (recentB.items as unknown[]).length) return false;
      }

      // --- topPlayers 검증 ---
      const topPlayers = pd.topPlayers as Record<string, unknown> | undefined;
      if (!topPlayers) return false;
      const tpA = topPlayers.teamA as Record<string, unknown> | undefined;
      const tpB = topPlayers.teamB as Record<string, unknown> | undefined;
      if (!tpA || !Array.isArray(tpA.topScorers) || !Array.isArray(tpA.topAssist)) return false;
      if (!tpB || !Array.isArray(tpB.topScorers) || !Array.isArray(tpB.topAssist)) return false;

      return true;
    }

    case 'matchPlayerStats': {
      // success=true, allPlayersData 비어있지 않아야 함
      if (!d.success) return false;
      if (!Array.isArray(d.allPlayersData) || d.allPlayersData.length === 0) return false;
      if (!d.ratings || typeof d.ratings !== 'object') return false;
      return true;
    }

    case 'playerRatings': {
      // ratings 객체가 비어있지 않아야 함
      if (!d.success) return false;
      const ratings = d.ratings;
      if (!ratings || typeof ratings !== 'object' || Object.keys(ratings).length === 0) return false;
      return true;
    }

    case 'events': {
      // 이벤트 배열이 존재해야 함
      if (!Array.isArray(d.data) || d.data.length === 0) {
        // 직접 배열인 경우도 허용
        if (!Array.isArray(data)) return false;
        return (data as unknown[]).length > 0;
      }
      return true;
    }

    case 'lineups': {
      // response 객체(home/away)가 존재
      const resp = d.response as Record<string, unknown> | undefined;
      if (!resp) return false;
      if (!resp.home || !resp.away) return false;
      return true;
    }

    case 'stats': {
      // 팀 통계 배열이 존재
      if (Array.isArray(data)) return (data as unknown[]).length > 0;
      if (Array.isArray(d.response)) return (d.response as unknown[]).length > 0;
      return false;
    }

    default:
      return true;
  }
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
    // 저장 전 데이터 검증
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

/**
 * 여러 데이터를 한번에 저장 (검증 통과한 것만)
 */
export async function setMatchCacheBulk(
  matchId: number,
  entries: { dataType: MatchDataType; data: unknown }[],
  matchStatus: string = 'FT'
): Promise<void> {
  try {
    // 검증 통과한 항목만 필터링
    const validEntries = entries.filter(e => {
      const valid = validateCacheData(e.dataType, e.data);
      if (!valid) {
        console.log(`[MatchCache] 검증 실패, 캐시 스킵: match=${matchId} type=${e.dataType}`);
      }
      return valid;
    });

    if (validEntries.length === 0) return;

    const supabase = getSupabaseAdmin();

    const rows = validEntries.map(e => ({
      match_id: matchId,
      data_type: e.dataType,
      data: e.data as Record<string, unknown>,
      match_status: matchStatus,
      updated_at: new Date().toISOString(),
    }));

    await supabase
      .from('match_cache')
      .upsert(rows, { onConflict: 'match_id,data_type' });
  } catch {
    // 캐시 저장 실패는 무시
  }
}
