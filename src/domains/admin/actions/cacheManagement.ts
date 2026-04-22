'use server';

import { getSupabaseAdmin } from '@/shared/lib/supabase/server';
import { revalidateTag } from 'next/cache';
import { forceRefreshAsset } from '@/domains/livescore/actions/images/ensureAssetCached';

// ── 경기 캐시 (DB 직접 조회) ──

export async function getMatchCacheStats() {
  try {
    const supabase = getSupabaseAdmin();
    const { count: totalEntries } = await supabase
      .from('match_cache')
      .select('*', { count: 'exact', head: true });

    const { count: completeEntries } = await supabase
      .from('match_cache')
      .select('*', { count: 'exact', head: true })
      .eq('is_complete', true);

    const dataTypes = ['full', 'matchPlayerStats', 'power'] as const;
    const byDataType: Record<string, number> = {};
    for (const dt of dataTypes) {
      const { count } = await supabase
        .from('match_cache')
        .select('*', { count: 'exact', head: true })
        .eq('data_type', dt);
      byDataType[dt] = count || 0;
    }

    return {
      totalEntries: totalEntries || 0,
      completeEntries: completeEntries || 0,
      incompleteEntries: (totalEntries || 0) - (completeEntries || 0),
      byDataType,
    };
  } catch {
    return { totalEntries: 0, completeEntries: 0, incompleteEntries: 0, byDataType: {} };
  }
}

export async function deleteMatchCache(
  matchId: number,
  dataType?: string
) {
  try {
    const supabase = getSupabaseAdmin();
    let query = supabase.from('match_cache').delete().eq('match_id', matchId);
    if (dataType) query = query.eq('data_type', dataType);
    const { error } = await query;
    if (error) return { success: false, error: error.message };
    revalidateTag(`match-${matchId}`, 'default');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : '알 수 없는 오류' };
  }
}

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

