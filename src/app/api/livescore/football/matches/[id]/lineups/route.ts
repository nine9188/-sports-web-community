import { NextResponse } from 'next/server';

// API 응답 타입 정의
interface Team {
  id: number;
  name: string;
  logo: string;
}

interface Player {
  id: number;
  name: string;
  number: number;
  pos: string;
  grid?: string;
}

interface Coach {
  id: number;
  name: string;
  photo?: string;
}

interface LineupPlayer {
  player: Player;
}

interface TeamLineup {
  team: Team;
  formation: string;
  startXI: LineupPlayer[];
  substitutes: LineupPlayer[];
  coach: Coach;
}

interface TeamStats {
  team: Team;
  players: PlayerStats[];
}

interface PlayerStats {
  player: {
    id: number;
  };
  statistics: [{
    games: {
      captain: boolean;
      rating: string | null;
    }
  }];
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await params;
  
  try {
    // 라인업과 선수 통계 데이터를 동시에 가져오기
    const [lineupsResponse, statsResponse] = await Promise.all([
      fetch(
        `https://v3.football.api-sports.io/fixtures/lineups?fixture=${matchId}`,
        {
          headers: {
            'x-rapidapi-host': 'v3.football.api-sports.io',
            'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
          },
          cache: 'no-store'
        }
      ),
      fetch(
        `https://v3.football.api-sports.io/fixtures/players?fixture=${matchId}`,
        {
          headers: {
            'x-rapidapi-host': 'v3.football.api-sports.io',
            'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
          },
          cache: 'no-store'
        }
      )
    ]);

    const [lineupsData, statsData] = await Promise.all([
      lineupsResponse.json(),
      statsResponse.json()
    ]);

    // 선수 통계에서 주장 정보 찾는 함수
    const findPlayerStats = (playerId: number, teamId: number) => {
      const teamStats = statsData.response?.find((team: TeamStats) => team.team.id === teamId);
      if (!teamStats) return null;
      return teamStats.players?.find((player: PlayerStats) => player.player.id === playerId);
    };

    if (lineupsData.response && lineupsData.response.length === 2) {
      const homeTeam = lineupsData.response[0] as TeamLineup;
      const awayTeam = lineupsData.response[1] as TeamLineup;

      const formattedLineups = {
        home: {
          team: {
            id: homeTeam.team.id,
            name: homeTeam.team.name,
            logo: homeTeam.team.logo,
          },
          formation: homeTeam.formation,
          startXI: homeTeam.startXI.map((player: LineupPlayer) => {
            const playerStats = findPlayerStats(player.player.id, homeTeam.team.id);
            return {
              id: player.player.id,
              name: player.player.name,
              number: player.player.number,
              pos: player.player.pos,
              grid: player.player.grid,
              photo: `https://media.api-sports.io/football/players/${player.player.id}.png`,
              captain: playerStats?.statistics?.[0]?.games?.captain || false,
              rating: playerStats?.statistics?.[0]?.games?.rating || null
            };
          }),
          substitutes: homeTeam.substitutes.map((player: LineupPlayer) => {
            const playerStats = findPlayerStats(player.player.id, homeTeam.team.id);
            return {
              id: player.player.id,
              name: player.player.name,
              number: player.player.number,
              pos: player.player.pos,
              photo: `https://media.api-sports.io/football/players/${player.player.id}.png`,
              captain: playerStats?.statistics?.[0]?.games?.captain || false,
              rating: playerStats?.statistics?.[0]?.games?.rating || null
            };
          }),
          coach: {
            id: homeTeam.coach.id,
            name: homeTeam.coach.name,
            photo: `https://media.api-sports.io/football/coachs/${homeTeam.coach.id}.png`
          }
        },
        away: {
          team: {
            id: awayTeam.team.id,
            name: awayTeam.team.name,
            logo: awayTeam.team.logo,
          },
          formation: awayTeam.formation,
          startXI: awayTeam.startXI.map((player: LineupPlayer) => {
            const playerStats = findPlayerStats(player.player.id, awayTeam.team.id);
            return {
              id: player.player.id,
              name: player.player.name,
              number: player.player.number,
              pos: player.player.pos,
              grid: player.player.grid,
              photo: `https://media.api-sports.io/football/players/${player.player.id}.png`,
              captain: playerStats?.statistics?.[0]?.games?.captain || false,
              rating: playerStats?.statistics?.[0]?.games?.rating || null
            };
          }),
          substitutes: awayTeam.substitutes.map((player: LineupPlayer) => {
            const playerStats = findPlayerStats(player.player.id, awayTeam.team.id);
            return {
              id: player.player.id,
              name: player.player.name,
              number: player.player.number,
              pos: player.player.pos,
              photo: `https://media.api-sports.io/football/players/${player.player.id}.png`,
              captain: playerStats?.statistics?.[0]?.games?.captain || false,
              rating: playerStats?.statistics?.[0]?.games?.rating || null
            };
          }),
          coach: {
            id: awayTeam.coach.id,
            name: awayTeam.coach.name,
            photo: `https://media.api-sports.io/football/coachs/${awayTeam.coach.id}.png`
          }
        }
      };

      return NextResponse.json({ response: formattedLineups });
    }

    return NextResponse.json({ response: null });
  } catch (error) {
    console.error('Error fetching lineups:', error);
    return NextResponse.json({ error: 'Failed to fetch lineups' }, { status: 500 });
  }
} 