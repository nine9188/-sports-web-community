// 서버 컴포넌트 (use client 지시어 없음)
import { fetchStandingsData } from '@/app/actions/footballStandings';
import LeagueStandings from './LeagueStandings';

interface ServerLeagueStandingsProps {
  initialLeague?: string;
}

// 서버 컴포넌트에서 비동기 작업 수행
export default async function ServerLeagueStandings({
  initialLeague = 'premier',
}: ServerLeagueStandingsProps) {
  try {
    // 서버에서 데이터 가져오기
    const standingsData = await fetchStandingsData(initialLeague);
    
    // LeagueStandings 클라이언트 컴포넌트에 데이터 전달
    return (
      <LeagueStandings 
        initialLeague={initialLeague} 
        initialStandings={standingsData} 
      />
    );
  } catch (error) {
    console.error('리그 순위 데이터 로딩 오류:', error);
    
    // 에러가 발생해도 클라이언트 컴포넌트에 전달
    // 클라이언트 컴포넌트에서 로컬 캐시 확인 또는 재요청 처리
    return (
      <LeagueStandings 
        initialLeague={initialLeague} 
        initialStandings={null} 
      />
    );
  }
} 