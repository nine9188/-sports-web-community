import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const leagueId = searchParams.get('leagueId');
  const season = searchParams.get('season') || '2025';

  if (!leagueId) {
    return NextResponse.json(
      { error: 'leagueId is required' },
      { status: 400 }
    );
  }

  try {
    // teams 엔드포인트로 리그 소속 팀 직접 조회
    const response = await fetch(
      `https://v3.football.api-sports.io/teams?league=${leagueId}&season=${season}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }

    const data = await response.json();

    // 응답에서 팀 목록 추출
    const teams = (data.response || []).map((item: {
      team: { id: number; name: string; logo: string };
    }, index: number) => ({
      id: item.team.id,
      name: item.team.name,
      logo: item.team.logo,
      rank: index + 1,
    }));

    return NextResponse.json({
      success: true,
      leagueId: Number(leagueId),
      season: Number(season),
      teams,
      totalTeams: teams.length,
    });
  } catch (error) {
    console.error('팀 데이터 조회 오류:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        leagueId,
        season,
      },
      { status: 500 }
    );
  }
}
