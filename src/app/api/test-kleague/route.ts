import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'teams'; // teams, standings, fixtures
  const season = searchParams.get('season') || '2026';
  const leagueId = 292; // K리그1

  try {
    let endpoint = '';

    switch (type) {
      case 'teams':
        endpoint = `https://v3.football.api-sports.io/teams?league=${leagueId}&season=${season}`;
        break;
      case 'standings':
        endpoint = `https://v3.football.api-sports.io/standings?league=${leagueId}&season=${season}`;
        break;
      case 'fixtures':
        endpoint = `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=${season}`;
        break;
      case 'leagues':
        endpoint = `https://v3.football.api-sports.io/leagues?id=${leagueId}`;
        break;
      default:
        endpoint = `https://v3.football.api-sports.io/teams?league=${leagueId}&season=${season}`;
    }

    const response = await fetch(endpoint, {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      type,
      leagueId,
      season: Number(season),
      endpoint,
      results: data.results,
      data: data.response,
    });
  } catch (error) {
    console.error('K리그 데이터 조회 오류:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        type,
        season,
      },
      { status: 500 }
    );
  }
}
