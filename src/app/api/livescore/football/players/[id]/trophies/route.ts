import { NextResponse } from 'next/server';

// 수상 결과 한글 매핑
const placeMap: { [key: string]: string } = {
  Winner: '우승',
  '2nd Place': '준우승',
  '3rd Place': '3위',
  'Runner-up': '준우승',
  'Semi-finals': '4강',
  'Quarter-finals': '8강',
  'Group Stage': '조별리그',
};

// 인터페이스 정의
interface Trophy {
  league: string;
  country: string;
  place: string;
  season: string;
}

interface FormattedTrophy {
  league: string;
  country: string;
  place: string;
  season: string;
  leagueLogo: string | null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 1. 트로피 데이터 가져오기
    const trophiesResponse = await fetch(
      `https://v3.football.api-sports.io/trophies?player=${id}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'
      }
    );

    if (!trophiesResponse.ok) {
      throw new Error('트로피 데이터를 가져오는데 실패했습니다.');
    }

    const trophiesData = await trophiesResponse.json();

    if (!trophiesData.response || trophiesData.response.length === 0) {
      return NextResponse.json([]);
    }

    // 2. 리그 정보를 저장할 Map 생성
    const leagueLogosMap = new Map();

    // 3. 고유한 리그 목록 생성
    const uniqueLeagues = [...new Set(trophiesData.response.map((trophy: Trophy) => trophy.league))];
    
    // 4. 각 리그의 로고 정보를 가져옵니다
    for (const leagueName of uniqueLeagues) {
      if (typeof leagueName === 'string') {
        const leagueResponse = await fetch(
          `https://v3.football.api-sports.io/leagues?name=${encodeURIComponent(leagueName)}`,
          {
            headers: {
              'x-rapidapi-host': 'v3.football.api-sports.io',
              'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
            },
            cache: 'no-store'
          }
        );

        if (leagueResponse.ok) {
          const leagueData = await leagueResponse.json();
          if (leagueData.response && leagueData.response.length > 0) {
            const logo = leagueData.response[0].league.logo;
            leagueLogosMap.set(leagueName, logo);
          }
        }
      }
    }

    // 5. 트로피 데이터 포맷팅
    const formattedTrophies = trophiesData.response.map((trophy: Trophy) => ({
      league: trophy.league,
      country: trophy.country,
      place: placeMap[trophy.place] || trophy.place,
      season: trophy.season,
      leagueLogo: leagueLogosMap.get(trophy.league) || null
    }));

    // 시즌 기준 내림차순 정렬
    const sortedTrophies = formattedTrophies.sort((a: FormattedTrophy, b: FormattedTrophy) => 
      b.season.localeCompare(a.season)
    );

    return NextResponse.json(sortedTrophies);

  } catch (error) {
    console.error('트로피 API 오류:', error);
    return NextResponse.json(
      { 
        error: '트로피 데이터를 가져오는데 실패했습니다.',
        message: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
} 