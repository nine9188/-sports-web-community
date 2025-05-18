import { Suspense } from 'react';
import { fetchStandingsData } from '../../actions/football';
import LeagueStandings from './LeagueStandings';

// 로딩 중 표시할 스켈레톤 UI
function LeagueStandingsSkeleton() {
  return (
    <div className="border rounded-md overflow-hidden animate-pulse">
      <div className="bg-slate-800 text-white py-2 px-3 text-sm font-medium">
        축구 팀순위
      </div>
      <div className="flex border-b">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-1 h-7 bg-gray-200"></div>
        ))}
      </div>
      <div className="p-3 space-y-2">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-5 w-full bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  );
}

interface ServerLeagueStandingsProps {
  initialLeague?: string;
}

// 서버 컴포넌트 - async 사용 가능
export default async function ServerLeagueStandings({ 
  initialLeague = 'premier' 
}: ServerLeagueStandingsProps) {
  try {
    // 서버 컴포넌트에서 직접 서버 액션 호출
    const initialStandings = await fetchStandingsData(initialLeague);
    
    return (
      <Suspense fallback={<LeagueStandingsSkeleton />}>
        <LeagueStandings 
          initialLeague={initialLeague} 
          initialStandings={initialStandings} 
        />
      </Suspense>
    );
  } catch {
    // 에러 발생 시 클라이언트 컴포넌트를 빈 데이터로 렌더링
    return (
      <LeagueStandings 
        initialLeague={initialLeague} 
        initialStandings={null} 
      />
    );
  }
} 