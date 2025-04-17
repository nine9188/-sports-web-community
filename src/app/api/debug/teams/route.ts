import { NextResponse } from 'next/server';

interface TeamItem {
  team: {
    id: number;
    name: string;
    code: string | null;
    country: string;
    logo: string;
  };
  venue: Record<string, unknown>;
}

interface TeamInfo {
  id: number;
  name: string;
  code: string | null;
  country: string;
  logo: string;
  league_id: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const season = searchParams.get('season') || '2024'; // 시즌
    
    // 우리가 매핑할 13개 리그 ID
    const leagueIds = [
      848  //    
    ];

    // API 키 확인
    const apiKey = process.env.NEXT_PUBLIC_RAPIDAPI_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // 모든 리그 데이터를 가져오는 Promise 배열
    const allLeaguePromises = leagueIds.map(leagueId => {
      const apiUrl = `https://v3.football.api-sports.io/teams?league=${leagueId}&season=${season}`;
      
      return fetch(apiUrl, {
        headers: {
          'x-apisports-key': apiKey
        }
      })
      .then(res => {
        if (!res.ok) {
          return { leagueId, success: false, data: [] };
        }
        return res.json().then(data => ({ leagueId, success: true, data }));
      })
      .catch(() => {
        return { leagueId, success: false, data: [] };
      });
    });

    // 모든 리그 데이터 요청을 병렬로 처리
    const results = await Promise.all(allLeaguePromises);
    
    // 리그별 팀 정보 수집
    const teamsByLeague: Record<number, TeamInfo[]> = {};
    const allTeams: TeamInfo[] = [];
    
    results.forEach(result => {
      if (!result.success || !result.data.response) {
        teamsByLeague[result.leagueId] = [];
        return;
      }
      
      // 팀 정보 간소화
      const teams = result.data.response.map((item: TeamItem) => ({
        id: item.team.id,
        name: item.team.name,
        code: item.team.code,
        country: item.team.country,
        logo: item.team.logo,
        league_id: result.leagueId
      }));
      
      teamsByLeague[result.leagueId] = teams;
      allTeams.push(...teams);
    });

    // 리그별 팀 매핑 템플릿 생성
    const mappingTemplates: Record<number, string> = {};
    
    Object.entries(teamsByLeague).forEach(([leagueId, teams]) => {
      if (teams.length === 0) return;
      
      mappingTemplates[Number(leagueId)] = teams.map((team) => `  {
    id: ${team.id},
    name_ko: '${team.name}', // 한글 이름 추가 필요
    name_en: '${team.name}',
    country_ko: '${team.country}', // 한글 국가명 추가 필요
    country_en: '${team.country}',
    code: '${team.code || team.name.substring(0, 3).toUpperCase()}'
  },`).join('\n');
    });
    
    // 리그별 팀 개수 정보
    const leagueCounts = Object.entries(teamsByLeague).reduce((acc, [leagueId, teams]) => {
      acc[leagueId] = teams.length;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      season,
      total_teams: allTeams.length,
      league_team_counts: leagueCounts,
      teams_by_league: teamsByLeague,
      mapping_templates: mappingTemplates
    });

  } catch {
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 