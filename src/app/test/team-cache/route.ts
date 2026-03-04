import { fetchTeamFullData } from '@/domains/livescore/actions/teams/team';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const teamId = '33'; // Manchester United
  const startTime = Date.now();

  const data = await fetchTeamFullData(teamId, {
    fetchMatches: true,
    fetchSquad: true,
    fetchPlayerStats: true,
    fetchStandings: true,
  });

  const elapsed = Date.now() - startTime;

  return NextResponse.json({
    elapsed_ms: elapsed,
    success: data.success,
    sizes: {
      teamData: JSON.stringify(data.teamData).length,
      matches: JSON.stringify(data.matches).length,
      squad: JSON.stringify(data.squad).length,
      playerStats: JSON.stringify(data.playerStats).length,
      standings: JSON.stringify(data.standings).length,
    },
  });
}
