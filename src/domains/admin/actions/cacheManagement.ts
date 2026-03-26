'use server';

import { getSupabaseAdmin } from '@/shared/lib/supabase/server';
import { getMatchCacheStats, deleteMatchCache } from '@/domains/livescore/actions/match/matchCache';
import { forceRefreshAsset } from '@/domains/livescore/actions/images/ensureAssetCached';

// ── 경기 캐시 ──

export { getMatchCacheStats, deleteMatchCache };

/**
 * 불완전 캐시 목록 조회
 */
export async function getIncompleteCacheEntries(limit: number = 50) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('match_cache')
      .select('match_id, data_type, match_status, is_complete, updated_at, created_at')
      .eq('is_complete', false)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) return { success: false, data: [], error: error.message };
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, data: [], error: err instanceof Error ? err.message : '알 수 없는 오류' };
  }
}

/**
 * 경기 ID로 캐시 검색
 */
export async function searchMatchCache(matchId: number) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('match_cache')
      .select('match_id, data_type, match_status, is_complete, updated_at, created_at')
      .eq('match_id', matchId);

    if (error) return { success: false, data: [], error: error.message };
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, data: [], error: err instanceof Error ? err.message : '알 수 없는 오류' };
  }
}

/**
 * cleanup_expired_data() DB 함수 호출
 */
export async function runCleanup() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc('cleanup_expired_data');
    if (error) return { success: false, result: null, error: error.message };
    return { success: true, result: data };
  } catch (err) {
    return { success: false, result: null, error: err instanceof Error ? err.message : '알 수 없는 오류' };
  }
}

// ── 이미지 캐시 ──

export { forceRefreshAsset };

/**
 * 이미지 캐시 통계
 */
export async function getAssetCacheStats() {
  try {
    const supabase = getSupabaseAdmin();

    // DB에서 직접 COUNT (PostgREST 1000행 제한 회피)
    const statusTypes = ['ready', 'pending', 'error'] as const;
    const assetTypes = ['team_logo', 'league_logo', 'player_photo', 'coach_photo', 'venue_photo'] as const;

    const [totalResult, ...statusResults] = await Promise.all([
      supabase.from('asset_cache').select('*', { count: 'exact', head: true }),
      ...statusTypes.map(s => supabase.from('asset_cache').select('*', { count: 'exact', head: true }).eq('status', s)),
    ]);

    const typeResults = await Promise.all(
      assetTypes.map(t => supabase.from('asset_cache').select('*', { count: 'exact', head: true }).eq('type', t))
    );

    const byStatus: Record<string, number> = {};
    statusTypes.forEach((s, i) => {
      if (statusResults[i].count) byStatus[s] = statusResults[i].count!;
    });

    const byType: Record<string, number> = {};
    assetTypes.forEach((t, i) => {
      if (typeResults[i].count) byType[t] = typeResults[i].count!;
    });

    return { total: totalResult.count || 0, byStatus, byType };
  } catch {
    return { total: 0, byStatus: {} as Record<string, number>, byType: {} as Record<string, number> };
  }
}

/**
 * 에러 상태 이미지 목록
 */
export async function getAssetErrors(limit: number = 50) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('asset_cache')
      .select('type, entity_id, error_message, checked_at')
      .eq('status', 'error')
      .order('checked_at', { ascending: false })
      .limit(limit);

    if (error) return { success: false, data: [], error: error.message };
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, data: [], error: err instanceof Error ? err.message : '알 수 없는 오류' };
  }
}

// ── API 사용량 ──

/**
 * 오늘 API 사용량 요약
 */
export async function getApiUsageSummary() {
  try {
    const supabase = getSupabaseAdmin();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('api_usage_log')
      .select('endpoint, status_code, remaining_daily, response_has_error, response_time_ms')
      .gte('created_at', todayStart.toISOString());

    if (error || !data) {
      return { totalCalls: 0, errors: 0, avgResponseMs: 0, remainingDaily: null, byEndpoint: {} as Record<string, number> };
    }

    const byEndpoint: Record<string, number> = {};
    let errors = 0;
    let totalMs = 0;
    let latestRemaining: number | null = null;

    for (const row of data) {
      byEndpoint[row.endpoint] = (byEndpoint[row.endpoint] || 0) + 1;
      if (row.response_has_error) errors++;
      totalMs += row.response_time_ms || 0;
      if (row.remaining_daily !== null) latestRemaining = row.remaining_daily;
    }

    return {
      totalCalls: data.length,
      errors,
      avgResponseMs: data.length > 0 ? Math.round(totalMs / data.length) : 0,
      remainingDaily: latestRemaining,
      byEndpoint,
    };
  } catch {
    return { totalCalls: 0, errors: 0, avgResponseMs: 0, remainingDaily: null, byEndpoint: {} as Record<string, number> };
  }
}

/**
 * 최근 API 호출 로그
 */
export async function getRecentApiLogs(limit: number = 30, errorsOnly: boolean = false) {
  try {
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('api_usage_log')
      .select('endpoint, params, status_code, remaining_daily, response_has_error, response_results, error_details, response_time_ms, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (errorsOnly) {
      query = query.eq('response_has_error', true);
    }

    const { data, error } = await query;
    if (error) return { success: false, data: [], error: error.message };
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, data: [], error: err instanceof Error ? err.message : '알 수 없는 오류' };
  }
}
