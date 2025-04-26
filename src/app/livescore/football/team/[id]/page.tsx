import { fetchCachedTeamData } from '@/app/actions/livescore/teams/team';
import { fetchCachedTeamMatches } from '@/app/actions/livescore/teams/matches';
import { fetchCachedTeamStandings } from '@/app/actions/livescore/teams/standings';
import Overview from '../components/tabs/Overview';

export const dynamic = 'force-dynamic';
export const fetchCache = 'default-no-store';
export const revalidate = 0;

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // 디버깅 로그
    
    // 팀 기본 정보 가져오기
    const teamResponse = await fetchCachedTeamData(id);
    
    if (!teamResponse.success || !teamResponse.team) {
      throw new Error('팀 정보를 불러오는데 실패했습니다.');
    }
    
    // 경기 정보와 스탠딩 정보 병렬로 가져오기
    const [matchesResponse, standingsResponse] = await Promise.all([
      fetchCachedTeamMatches(id),
      fetchCachedTeamStandings(id)
    ]);
    
    // 데이터 변환
    const matches = matchesResponse.success && matchesResponse.data ? matchesResponse.data : [];
    
    // 스탠딩 데이터 가공
    const standings = standingsResponse.success && standingsResponse.data 
      ? standingsResponse.data.map(standing => ({
          league: {
            id: standing.league.id,
            name: standing.league.name,
            logo: standing.league.logo
          },
          standings: standing.league.standings[0] || []
        }))
      : [];
    
    // 팀 ID 숫자로 변환
    const numericTeamId = parseInt(id, 10);
    
    // Stats 객체를 Overview 컴포넌트에 맞게 변환
    const adaptedStats = {
      league: teamResponse.stats?.league,
      fixtures: teamResponse.stats?.fixtures ? {
        wins: { total: teamResponse.stats.fixtures.wins.total },
        draws: { total: teamResponse.stats.fixtures.draws.total },
        loses: { total: teamResponse.stats.fixtures.loses.total }
      } : undefined,
      // goals 타입을 Overview에 필요한 형식으로 명시적 변환
      goals: teamResponse.stats?.goals ? {
        for: {
          total: {
            home: teamResponse.stats.goals.for.total?.home || 0,
            away: teamResponse.stats.goals.for.total?.away || 0,
            total: teamResponse.stats.goals.for.total?.total || 0
          },
          average: teamResponse.stats.goals.for.average,
          // minute 필드는 명시적으로 안전하게 변환
          minute: teamResponse.stats.goals.for.minute ? 
            Object.entries(teamResponse.stats.goals.for.minute).reduce((acc, [key, value]) => {
              acc[key] = {
                total: value.total || 0,
                percentage: value.percentage || '0%'
              };
              return acc;
            }, {} as Record<string, { total: number; percentage: string }>) 
            : undefined
        },
        against: {
          total: {
            home: teamResponse.stats.goals.against.total?.home || 0,
            away: teamResponse.stats.goals.against.total?.away || 0,
            total: teamResponse.stats.goals.against.total?.total || 0
          },
          average: teamResponse.stats.goals.against.average,
          // minute 필드는 명시적으로 안전하게 변환
          minute: teamResponse.stats.goals.against.minute ? 
            Object.entries(teamResponse.stats.goals.against.minute).reduce((acc, [key, value]) => {
              acc[key] = {
                total: value.total || 0,
                percentage: value.percentage || '0%'
              };
              return acc;
            }, {} as Record<string, { total: number; percentage: string }>) 
            : undefined
        }
      } : undefined,
      clean_sheet: teamResponse.stats?.clean_sheet ? {
        total: teamResponse.stats.clean_sheet.total
      } : undefined,
      form: teamResponse.stats?.form
    };
    
    return (
      <Overview 
        team={{
          team: teamResponse.team.team,
          venue: teamResponse.team.venue || undefined
        }}
        stats={adaptedStats}
        matches={matches}
        standings={standings}
        teamId={numericTeamId}
      />
    );
  } catch (error) {
    console.error('팀 페이지 오류:', error);
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        팀 데이터를 불러오는데 실패했습니다.
      </div>
    );
  }
} 