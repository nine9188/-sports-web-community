import { NextRequest, NextResponse } from 'next/server';

// API 응답 관련 인터페이스 정의
interface Team {
  id: number;
  name: string;
}

interface Player {
  id: number;
  captain?: boolean;
}

interface PlayerStatistics {
  statistics: Array<{
    games?: {
      captain?: boolean;
    };
  }>;
  player?: {
    id: number;
  };
}

interface LineupPlayer {
  player: Player;
}

interface TeamLineup {
  team: Team;
  startXI: LineupPlayer[];
}

interface MatchPlayers {
  team: Team;
  players: PlayerStatistics[];
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await context.params;

  try {
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?id=${matchId}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store',
        next: { revalidate: 0 }
      }
    );

    const data = await response.json();

    if (data.response?.[0]) {
      const matchData = data.response[0];

      // captain 정보 추가
      if (matchData.lineups) {
        matchData.lineups.forEach((lineup: TeamLineup) => {
          const teamCaptainId = matchData.players
            ?.find((p: MatchPlayers) => p.team.id === lineup.team.id)
            ?.players
            ?.find((p: PlayerStatistics) => p.statistics?.[0]?.games?.captain)
            ?.player?.id;

          lineup.startXI.forEach((item: LineupPlayer) => {
            item.player.captain = item.player.id === teamCaptainId;
          });
        });
      }
    }

    return new NextResponse(JSON.stringify(data), {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error fetching match data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch match data' },
      { status: 500 }
    );
  }
}