import { fetchCachedTeamData } from '@/app/actions/livescore/teams/team';
import Stats from '../../components/tabs/Stats';

export default async function StatsPage({ params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    
    // 팀 정보와 통계 가져오기
    const teamResponse = await fetchCachedTeamData(id);
    
    if (!teamResponse.success || !teamResponse.team) {
      throw new Error('팀 정보를 불러오는데 실패했습니다.');
    }
    
    // 기본 통계 데이터 준비
    const defaultStats = {
      league: {
        id: 0,
        name: '정보 없음',
        country: '',
        logo: '',
        flag: '',
        season: new Date().getFullYear()
      },
      form: '',
      fixtures: {
        played: { home: 0, away: 0, total: 0 },
        wins: { home: 0, away: 0, total: 0 },
        draws: { home: 0, away: 0, total: 0 },
        loses: { home: 0, away: 0, total: 0 }
      },
      goals: {
        for: {
          total: { home: 0, away: 0, total: 0 },
          average: { home: '0', away: '0', total: '0' }
        },
        against: {
          total: { home: 0, away: 0, total: 0 },
          average: { home: '0', away: '0', total: '0' }
        }
      },
      clean_sheet: {
        home: 0,
        away: 0,
        total: 0
      },
      lineups: [],
      cards: {
        yellow: {},
        red: {}
      }
    };
    
    // 실제 데이터와 기본값 병합
    const combinedStats = {
      ...defaultStats,
      ...teamResponse.stats
    };
    
    return (
      <Stats
        stats={combinedStats}
      />
    );
    
  } catch (error) {
    console.error('Stats 탭 오류:', error);
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        통계 정보를 불러오는데 실패했습니다.
      </div>
    );
  }
} 