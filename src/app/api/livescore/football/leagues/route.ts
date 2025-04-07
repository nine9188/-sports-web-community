import { NextResponse } from 'next/server';

// 주요 리그 ID 목록
const MAJOR_LEAGUE_IDS = [
  39,  // Premier League (잉글랜드)
  140, // La Liga (스페인)
  78,  // Bundesliga (독일)
  61,  // Ligue 1 (프랑스)
  135, // Serie A (이탈리아)
  88,  // Eredivisie (네덜란드)
  94,  // Primeira Liga (포르투갈)
  203, // K League 1 (한국)
];

export async function GET() {
  try {
    const leaguePromises = MAJOR_LEAGUE_IDS.map(id => 
      fetch(`https://v3.football.api-sports.io/leagues?id=${id}`, {
        headers: {
          'x-apisports-key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY as string
        }
      })
    );

    const responses = await Promise.all(leaguePromises);
    const dataPromises = responses.map(response => response.json());
    const results = await Promise.all(dataPromises);

    const leagues = results.map(result => {
      const league = result.response[0];
      return {
        id: league.league.id,
        name: league.league.name,
        country: league.country.name,
        logo: league.league.logo,
        flag: league.country.flag
      };
    });

    return NextResponse.json({
      success: true,
      data: leagues
    });

  } catch (error) {
    console.error('API 에러:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : '리그 데이터를 가져오는데 실패했습니다' },
      { status: 500 }
    );
  }
} 