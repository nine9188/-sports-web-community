import { fetchPlayerFullData } from '@/domains/livescore/actions/player/data';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/shared/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const playerId = '162511';
  const startTime = Date.now();

  const data = await fetchPlayerFullData(playerId, {
    fetchSeasons: true,
    fetchStats: true,
    fetchFixtures: true,
    fetchTrophies: true,
    fetchTransfers: true,
    fetchInjuries: true,
    fetchRankings: false,
  });

  const elapsed = Date.now() - startTime;

  // Supabase 캐시 확인
  const supabase = getSupabaseAdmin();
  const { data: cacheRows } = await supabase
    .from('player_cache')
    .select('player_id, data_type, season, updated_at')
    .eq('player_id', 162511)
    .order('data_type');

  return NextResponse.json({
    elapsed_ms: elapsed,
    success: data.success,
    cache_rows: cacheRows,
    sizes: {
      playerInfo: JSON.stringify(data.playerData?.info).length,
      statistics: JSON.stringify(data.playerData?.statistics).length,
      seasons: JSON.stringify(data.seasons).length,
      fixtures: JSON.stringify(data.fixtures?.data).length,
      trophies: JSON.stringify(data.trophies).length,
      transfers: JSON.stringify(data.transfers).length,
      injuries: JSON.stringify(data.injuries).length,
    },
  });
}
