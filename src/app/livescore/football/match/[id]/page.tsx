import { headers } from 'next/headers';
import TabContent from '../components/TabContent';
import MatchHeader from '../components/MatchHeader';
import styles from '../styles/mobile.module.css';

// 선수 정보 인터페이스
interface Player {
  id: number;
  player?: {
    id: number;
  };
}

// 라인업 정보 인터페이스
interface Lineup {
  response: {
    home: {
      startXI: Player[];
      substitutes: Player[];
    };
    away: {
      startXI: Player[];
      substitutes: Player[];
    };
  };
}

// API 호출 함수들
async function fetchMatchData(id: string) {
  const headersList = await headers();
  const host = headersList.get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  
  const response = await fetch(`${protocol}://${host}/api/livescore/football/matches/${id}`, {
    cache: 'no-store'
  });
  
  if (!response.ok) {
    throw new Error('데이터를 가져오는데 실패했습니다');
  }
  return response.json();
}

async function fetchMatchEvents(id: string) {
  const headersList = await headers();
  const host = headersList.get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  
  try {
    const response = await fetch(`${protocol}://${host}/api/livescore/football/matches/${id}/events`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return { events: [] }; // 에러 발생 시 빈 배열 반환
    }
    return response.json();
  } catch {
    return { events: [] };
  }
}

async function fetchMatchLineups(id: string) {
  const headersList = await headers();
  const host = headersList.get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  
  try {
    const response = await fetch(`${protocol}://${host}/api/livescore/football/matches/${id}/lineups`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return { response: null }; // 에러 발생 시 null 반환
    }
    
    const data = await response.json();
    
    return data; // API 응답을 그대로 반환
  } catch {
    return { response: null };
  }
}

async function fetchMatchStats(id: string) {
  const headersList = await headers();
  const host = headersList.get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  
  try {
    const response = await fetch(`${protocol}://${host}/api/livescore/football/matches/${id}/stats`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return { response: [] }; // 에러 발생 시 빈 배열 반환
    }
    return response.json();
  } catch {
    return { response: [] };
  }
}

async function fetchMatchStandings(id: string) {
  const headersList = await headers();
  const host = headersList.get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  
  try {
    const response = await fetch(`${protocol}://${host}/api/livescore/football/matches/${id}/standings`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return null; // 에러 발생 시 null 반환
    }
    
    return response.json(); // API 응답을 그대로 반환
  } catch {
    console.error('Standings fetch error');
    return null;
  }
}

// 선수 통계 데이터를 한 번에 가져오는 함수
async function fetchPlayersStats(id: string, lineups: Lineup) {
  const headersList = await headers();
  const host = headersList.get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  
  try {
    // 라인업 데이터가 없으면 빈 객체 반환
    if (!lineups?.response?.home?.startXI || !lineups?.response?.away?.startXI) {
      return {};
    }
    
    // 모든 선수 ID 추출 (선발 + 교체)
    const playerIds = [
      ...lineups.response.home.startXI.map((item) => item.player?.id || item.id),
      ...lineups.response.home.substitutes.map((item) => item.player?.id || item.id),
      ...lineups.response.away.startXI.map((item) => item.player?.id || item.id),
      ...lineups.response.away.substitutes.map((item) => item.player?.id || item.id)
    ].filter(Boolean); // null/undefined 제거
    
    // 기존 API 경로 사용 (player-stats)
    const response = await fetch(
      `${protocol}://${host}/api/livescore/football/matches/${id}/player-stats?playerIds=${playerIds.join(',')}`,
      { cache: 'no-store' }
    );
    
    if (!response.ok) {
      return {};
    }
    
    return response.json();
  } catch {
    return {};
  }
}

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: matchId } = await params;
    
    // 먼저 기본 경기 데이터 가져오기
    const matchData = await fetchMatchData(matchId);
    
    if (!matchData?.response?.[0]) {
      throw new Error('경기 데이터를 찾을 수 없습니다');
    }
    
    const data = matchData.response[0];
    
    // 라인업 데이터 먼저 가져오기 (선수 통계를 위해)
    const lineupsData = await fetchMatchLineups(matchId);
    
    // 나머지 데이터 병렬로 가져오기
    const [eventsData, statsData, standingsData, playersStatsData] = await Promise.all([
      fetchMatchEvents(matchId),
      fetchMatchStats(matchId),
      fetchMatchStandings(matchId),
      fetchPlayersStats(matchId, lineupsData)
    ]);
    
    // 날짜 및 시간 포맷팅
    const matchDate = new Date(data.fixture.date);
    const formattedDate = matchDate.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = matchDate.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    // 데이터 구조 확인 및 변환
    const formattedData = {
      league: {
        id: data.league.id,
        name: data.league.name,
        logo: data.league.logo || '/placeholder-league.png'
      },
      status: {
        long: data.fixture.status.long,
        short: data.fixture.status.short,
        elapsed: data.fixture.status.elapsed,
      },
      fixture: {
        id: data.fixture.id,
        date: formattedDate,
        time: formattedTime,
        timestamp: data.fixture.timestamp,
      },
      teams: {
        home: {
          id: data.teams.home.id,
          name: data.teams.home.name,
          logo: data.teams.home.logo || '/placeholder-team.png',
          formation: data.lineups?.[0]?.formation || '',
        },
        away: {
          id: data.teams.away.id,
          name: data.teams.away.name,
          logo: data.teams.away.logo || '/placeholder-team.png',
          formation: data.lineups?.[1]?.formation || '',
        },
      },
      score: {
        halftime: {
          home: data.score.halftime.home,
          away: data.score.halftime.away,
        },
        fulltime: {
          home: data.score.fulltime.home,
          away: data.score.fulltime.away,
        },
      },
      goals: {
        home: data.goals.home,
        away: data.goals.away,
      },
    };

    // 로고 확인 - 기본값 설정
    if (!formattedData.teams.home.logo || formattedData.teams.home.logo === 'null') {
      formattedData.teams.home.logo = '/placeholder-team.png';
    }
    if (!formattedData.teams.away.logo || formattedData.teams.away.logo === 'null') {
      formattedData.teams.away.logo = '/placeholder-team.png';
    }

    return (
      <div className={styles.mobileContainer}>
        <MatchHeader 
          league={formattedData.league}
          status={formattedData.status}
          fixture={formattedData.fixture}
          teams={formattedData.teams}
          score={formattedData.score}
          goals={formattedData.goals}
          events={eventsData.events || []}
        />
        <TabContent 
          matchData={data} 
          eventsData={eventsData.events || []}
          lineupsData={lineupsData}
          statsData={statsData.response || []}
          standingsData={standingsData}
          playersStatsData={playersStatsData}
        />
      </div>
    );
  } catch {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">오류 발생</h2>
          <p className="text-gray-700 mb-4">경기 정보를 불러오는데 실패했습니다.</p>
          <p className="text-gray-600">API 서버에 연결할 수 없거나 요청한 데이터가 존재하지 않습니다.</p>
          <div className="flex justify-center gap-4 mt-6">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              다시 시도
            </button>
            <a 
              href="/livescore/football"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
            >
              라이브스코어 홈으로
            </a>
          </div>
        </div>
      </div>
    );
  }
}