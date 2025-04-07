import { NextResponse } from 'next/server';

// 선수 데이터 인터페이스 정의
interface PlayerStatistics {
  goals: {
    total: number;
    assists: number;
  };
  games: {
    appearences: number;
    minutes: number;
  };
  cards: {
    yellow: number;
    red: number;
  };
}

interface Player {
  player: {
    id: number;
    name: string;
    photo: string;
  };
  statistics: PlayerStatistics[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const league = searchParams.get('league');
    const rankingType = searchParams.get('type') || 'topscorers';
    
    if (!league) {
      throw new Error('League parameter is required');
    }

    const season = searchParams.get('season') || '2024';

    // rankingType에 따른 엔드포인트 선택
    const endpoint = (() => {
      switch(rankingType) {
        case 'topYellowCards':
          return 'players/topyellowcards';
        case 'topRedCards':
          return 'players/topredcards';
        default:
          return 'players/topscorers';
      }
    })();

    // API-Football 데이터 가져오기
    const response = await fetch(
      `https://v3.football.api-sports.io/${endpoint}?league=${league}&season=${season}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch player rankings');
    }

    const data = await response.json();
    const players = data.response || [];

    // 랭킹 타입에 따른 정렬 및 필터링
    const rankings = {
      topScorers: players
        .sort((a: Player, b: Player) => b.statistics[0].goals.total - a.statistics[0].goals.total)
        .slice(0, 10),
      
      topAssists: players
        .sort((a: Player, b: Player) => b.statistics[0].goals.assists - a.statistics[0].goals.assists)
        .slice(0, 10),
      
      mostGamesScored: players
        .sort((a: Player, b: Player) => b.statistics[0].games.appearences - a.statistics[0].games.appearences)
        .slice(0, 10),
      
      leastPlayTime: players
        .sort((a: Player, b: Player) => a.statistics[0].games.minutes - b.statistics[0].games.minutes)
        .filter((p: Player) => p.statistics[0].games.minutes > 0)
        .slice(0, 10),
      
      topRedCards: players
        .sort((a: Player, b: Player) => b.statistics[0].cards.red - a.statistics[0].cards.red)
        .slice(0, 10),
      
      topYellowCards: players
        .sort((a: Player, b: Player) => b.statistics[0].cards.yellow - a.statistics[0].cards.yellow)
        .slice(0, 10),
    };

    return NextResponse.json(rankings);

  } catch (error) {
    console.error('Rankings API Error:', error);
    return NextResponse.json(
      { 
        error: '선수 랭킹 데이터를 가져오는데 실패했습니다.',
        message: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}