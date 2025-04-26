import { fetchCachedTeamData } from '@/app/actions/livescore/teams/team';
import Stats from '../../components/tabs/Stats';

export default async function StatsPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    // params를 비동기적으로 처리
    const { id } = await params;
    
    // 디버깅 로그
    
    // 팀 기본 정보 가져오기
    const teamResponse = await fetchCachedTeamData(id);
    
    if (!teamResponse.success || !teamResponse.team) {
      throw new Error('팀 정보를 불러오는데 실패했습니다.');
    }
    
    // 통계 데이터 구성 - 필수 필드 추가
    const stats = teamResponse.stats ? {
      league: teamResponse.stats.league || {
        id: 0,
        name: '',
        country: '',
        logo: '',
        flag: '',
        season: 0
      },
      form: teamResponse.stats.form || '', // 필수 필드 추가
      fixtures: teamResponse.stats.fixtures || {
        played: { home: 0, away: 0, total: 0 },
        wins: { home: 0, away: 0, total: 0 },
        draws: { home: 0, away: 0, total: 0 },
        loses: { home: 0, away: 0, total: 0 }
      },
      goals: teamResponse.stats.goals || {
        for: { 
          total: { home: 0, away: 0, total: 0 } 
        },
        against: { 
          total: { home: 0, away: 0, total: 0 } 
        }
      },
      clean_sheet: teamResponse.stats.clean_sheet || { home: 0, away: 0, total: 0 },
      lineups: teamResponse.stats.lineups || [],
      cards: teamResponse.stats.cards || {
        yellow: {},
        red: {}
      },
      penalty: teamResponse.stats.penalty || {
        total: 0,
        scored: { total: 0, percentage: '0%' },
        missed: { total: 0, percentage: '0%' }
      },
      failed_to_score: teamResponse.stats.failed_to_score || {
        home: 0,
        away: 0,
        total: 0
      },
      biggest: teamResponse.stats.biggest
    } : undefined;
    
    return (
      <Stats 
        stats={stats}
        team={{
          team: teamResponse.team.team,
          venue: teamResponse.team.venue || {}
        }}
      />
    );
  } catch (error) {
    console.error('통계 탭 오류:', error);
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        통계 데이터를 불러오는데 실패했습니다.
      </div>
    );
  }
} 