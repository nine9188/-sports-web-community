import { NextResponse } from 'next/server';

// 리그 타입 정의
interface LeagueInfo {
  league: {
    id: number;
    name: string;
    type: string;
    logo: string;
  };
}

// 리그 우선순위 정의
const LEAGUE_PRIORITY: Record<string, number> = {
  'Ligue 1': 1,
  'Premier League': 1,
  'Serie A': 1,
  'Bundesliga': 1,
  'La Liga': 1,
  'Eredivisie': 1,
  'Primeira Liga': 1,
  'UEFA Champions League': 2,
  'UEFA Europa League': 3,
  'UEFA Europa Conference League': 4
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentSeason = 2024;
    
    // 팀 정보 가져오기
    const teamResponse = await fetch(
      `https://v3.football.api-sports.io/teams?id=${id}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'
      }
    );

    // 팀의 리그 찾기
    const leaguesResponse = await fetch(
      `https://v3.football.api-sports.io/leagues?team=${id}&season=${currentSeason}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'
      }
    );

    const teamData = await teamResponse.json();
    const leaguesData = await leaguesResponse.json();

    // 우선순위에 따라 리그 선택
    const validLeagues = leaguesData.response?.filter((league: LeagueInfo) => 
      !league.league.name.includes('Friendlies') && 
      !league.league.name.includes('Club World Cup')
    ) || [];

    // 우선순위에 따라 정렬
    const sortedLeagues = validLeagues.sort((a: LeagueInfo, b: LeagueInfo) => {
      const priorityA = LEAGUE_PRIORITY[a.league.name] || 999;
      const priorityB = LEAGUE_PRIORITY[b.league.name] || 999;
      return priorityA - priorityB;
    });

    const mainLeague = sortedLeagues[0];

    if (!mainLeague) {
      throw new Error('No valid league found for this team');
    }

    // 팀의 실제 리그 정보로 통계 가져오기
    const statsResponse = await fetch(
      `https://v3.football.api-sports.io/teams/statistics?team=${id}&league=${mainLeague.league.id}&season=${currentSeason}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'
      }
    );

    const statsData = await statsResponse.json();

    // BunnyCDN URL로 변환
    if (teamData.response?.[0]) {
      const team = teamData.response[0];
      team.team.logo = team.team.logo;  // 원본 URL 사용
      
      // 경기장 이미지도 BunnyCDN으로 변경
      if (team.venue) {
        team.venue.image = team.venue.image;  // 원본 URL 사용
      }
    }

    // 리그 정보가 있는 경우에만 리그 로고 변경
    if (statsData.response?.league) {
      statsData.response.league.logo = statsData.response.league.logo;  // 원본 URL 사용
    }

    return NextResponse.json({
      success: true,
      team: teamData.response?.[0] || null,
      stats: statsData.response || null,
      league: mainLeague.league || null
    });

  } catch (error: unknown) {
    console.error('Error fetching team data:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : '팀 정보를 가져오는데 실패했습니다',
        team: null,
        stats: null,
        league: null
      },
      { status: 500 }
    );
  }
} 