import { fetchCachedMatchFullData } from '@/domains/livescore/actions/match/matchData';
import { getCachedPowerData } from '@/domains/livescore/actions/match/headtohead';
import { fetchPlayerRatingsAndCaptains } from '@/domains/livescore/actions/match/playerStats';
import { fetchMatchPlayerStats } from '@/domains/livescore/actions/match/matchPlayerStats';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/shared/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('id') || '1208735'; // 기본: 종료된 경기

  const startTime = Date.now();

  // 1. 경기 전체 데이터 (L2 캐시 내장)
  const matchData = await fetchCachedMatchFullData(matchId, {
    fetchEvents: true,
    fetchLineups: true,
    fetchStats: true,
    fetchStandings: true,
  });

  const elapsed1 = Date.now() - startTime;

  // 2. 헤드투헤드 + 선수 평점 + 선수 통계
  let powerData = null;
  let playerRatings = null;
  let matchPlayerStats = null;

  if (matchData.success && matchData.homeTeam && matchData.awayTeam) {
    const [p, r, s] = await Promise.all([
      getCachedPowerData(matchData.homeTeam.id, matchData.awayTeam.id, 5),
      fetchPlayerRatingsAndCaptains(matchId),
      fetchMatchPlayerStats(matchId),
    ]);
    powerData = p;
    playerRatings = r;
    matchPlayerStats = s;
  }

  const totalElapsed = Date.now() - startTime;

  // Supabase 캐시 행 확인
  const supabase = getSupabaseAdmin();
  const { data: cacheRows } = await supabase
    .from('match_cache')
    .select('match_id, data_type, match_status, updated_at')
    .eq('match_id', parseInt(matchId, 10))
    .order('data_type');

  return NextResponse.json({
    matchId,
    status: matchData.match?.status?.code || 'unknown',
    elapsed_ms: { matchFullData: elapsed1, total: totalElapsed },
    success: matchData.success,
    cache_rows: cacheRows,
    sizes: {
      match_basic: JSON.stringify(matchData.match || {}).length,
      events: JSON.stringify(matchData.events || []).length,
      lineups: JSON.stringify(matchData.lineups || {}).length,
      stats: JSON.stringify(matchData.stats || []).length,
      standings: JSON.stringify(matchData.standings || {}).length,
      power: JSON.stringify(powerData || {}).length,
      playerRatings: JSON.stringify(playerRatings || {}).length,
      matchPlayerStats: JSON.stringify(matchPlayerStats || {}).length,
    },
    teams: matchData.match ? `${matchData.match.teams.home.name} vs ${matchData.match.teams.away.name}` : null,
  });
}
