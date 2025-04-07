import { NextResponse } from 'next/server';

// 리그 인터페이스 정의
interface League {
  league: {
    id: number;
    name: string;
    type: string;
    logo: string;
  };
  country: {
    name: string;
    code: string;
    flag: string;
  };
  seasons: Array<{
    year: number;
    start: string;
    end: string;
    current: boolean;
  }>;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // 현재 날짜가 7월 이전이면 이전 연도, 이후면 현재 연도를 시즌으로 사용
    const currentDate = new Date();
    const season = currentDate.getMonth() < 6 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();

    // 팀의 리그 정보를 가져옵니다
    const leaguesResponse = await fetch(
      `https://v3.football.api-sports.io/leagues?team=${id}&season=${season}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'
      }
    );

    const leaguesData = await leaguesResponse.json();

    // 모든 관련 리그 찾기
    const relevantLeagues = leaguesData.response?.filter((league: League) => {
      // 리그 타입이나 이름으로 필터링
      const isRelevant = (
        league.league.type === 'League' || // 정규 리그
        league.league.type === 'Cup' ||    // 국내 컵 대회
        league.league.name.includes('Champions') || // 챔피언스리그
        league.league.name.includes('Europa') ||    // 유로파리그
        league.league.name.includes('League Cup') || // 리그컵(카라바오컵)
        league.league.name.includes('FA Cup')       // FA컵
      ) && 
      !league.league.name.includes('Qualification') && // 예선 제외
      !league.league.name.includes('Friendlies');     // 친선경기 제외

      return isRelevant;
    }) || [];

    // 각 리그의 순위 정보를 가져옵니다
    const standingsPromises = relevantLeagues.map(async (league: League) => {
      const standingsResponse = await fetch(
        `https://v3.football.api-sports.io/standings?league=${league.league.id}&season=${season}`,
        {
          headers: {
            'x-rapidapi-host': 'v3.football.api-sports.io',
            'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
          },
          cache: 'no-store'
        }
      );

      if (!standingsResponse.ok) {
        return null;
      }

      const standingsData = await standingsResponse.json();
      
      // 유효한 순위 데이터가 있는 경우만 반환
      if (standingsData.response?.[0]?.league?.standings?.[0]) {
        return {
          standings: standingsData.response[0].league.standings[0],
          league: league.league
        };
      }
      return null;
    });

    const allStandings = (await Promise.all(standingsPromises))
      .filter(standing => standing !== null);

    // 메인 리그를 먼저 정렬하고, 그 다음에 컵 대회 순으로 정렬
    allStandings.sort((a, b) => {
      const aIsMainLeague = a.league.type === 'League' && 
        !a.league.name.includes('Champions') && 
        !a.league.name.includes('Europa');
      const bIsMainLeague = b.league.type === 'League' && 
        !b.league.name.includes('Champions') && 
        !b.league.name.includes('Europa');

      if (aIsMainLeague && !bIsMainLeague) return -1;
      if (!aIsMainLeague && bIsMainLeague) return 1;
      return 0;
    });

    return NextResponse.json({ data: allStandings });
    
  } catch (error: unknown) {
    console.error('Error fetching standings:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch standings data',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
      }, 
      { status: 500 }
    );
  }
}
