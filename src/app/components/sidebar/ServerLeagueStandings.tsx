// API 라우트 핸들러 경로를 명시적으로 사용 (예시)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
import ClientLeagueStandings from './LeagueStandings';

// 타입 정의 (ClientLeagueStandings와 동일하게 유지)
interface League {
  id: number;
  name: string;
  logo: string;
  country: string;
}

interface Team {
  id: number;
  name: string;
  logo: string;
}

interface Standing {
  rank: number;
  team: Team;
  points: number;
  goalsDiff: number;
  form: string;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
  };
}

interface StandingsData {
  league: League;
  standings: Standing[];
}

export const revalidate = 300; // 5분마다 데이터 갱신
export const dynamic = 'force-dynamic';

// 초기 데이터 페칭 함수
async function fetchInitialStandings(leagueId: string): Promise<StandingsData | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/livescore/football/leagues/standings?league=${leagueId}`, {
      cache: 'no-store' // 항상 최신 데이터 요청
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error(`초기 순위 데이터 로딩 오류 (${leagueId}):`, error);
    return null; // 오류 발생 시 null 반환
  }
}

export default async function ServerLeagueStandings() {
  const initialLeague = 'premier';
  const initialStandings = await fetchInitialStandings(initialLeague);

  // 클라이언트 컴포넌트에 초기 데이터 전달
  return (
    <ClientLeagueStandings 
      initialLeague={initialLeague} 
      initialStandings={initialStandings} 
    />
  );
} 