import PlayerHeader from '../components/PlayerHeader';
import PlayerTabs from '../components/PlayerTabs';
import { headers } from 'next/headers';

// 동적 렌더링 강제 설정 추가
export const dynamic = 'force-dynamic';
export const fetchCache = 'default-no-store'; // 캐싱 방지
export const revalidate = 0; // 항상 새로운 데이터 요청

// URL 생성에 필요한 호스트 정보를 가져오는 함수
async function getApiBaseUrl() {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  return { host, protocol, baseUrl: `${protocol}://${host}` };
}

// API 호출 함수들
async function fetchPlayerData(id: string) {
  const { protocol, host } = await getApiBaseUrl();

  try {
    const response = await fetch(`${protocol}://${host}/api/livescore/football/players/${id}`, { 
      cache: 'no-store' 
    });
    
    if (!response.ok) {
      console.error(`API 응답 오류: ${response.status} ${response.statusText}`);
      throw new Error('선수 데이터를 불러오는데 실패했습니다');
    }
    
    return response.json();
  } catch (error) {
    console.error('Player data fetch error:', error);
    throw error;
  }
}

async function fetchPlayerStats(id: string, season: number) {
  const { protocol, host } = await getApiBaseUrl();
  
  try {
    const response = await fetch(`${protocol}://${host}/api/livescore/football/players/${id}/stats?season=${season}`, { 
      cache: 'no-store' 
    });
    
    if (!response.ok) {
      return { statistics: [] }; // 에러 발생 시 빈 배열 반환
    }
    
    return response.json();
  } catch (error) {
    console.error('Player stats fetch error:', error);
    return { statistics: [] };
  }
}

async function fetchPlayerSeasons(id: string) {
  const { protocol, host } = await getApiBaseUrl();
  
  try {
    const response = await fetch(`${protocol}://${host}/api/livescore/football/players/${id}/seasons`, { 
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return { seasons: [] }; // 에러 발생 시 빈 배열 반환
    }
    
    return response.json();
  } catch (error) {
    console.error('Player seasons fetch error:', error);
    return { seasons: [] };
  }
}

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // 현재 시즌 계산 (7월 1일 기준으로 새 시즌 시작)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JavaScript에서 월은 0부터 시작하므로 +1 
    // 7월 이후면 현재 연도가 시즌의 시작 연도, 6월 이전이면 이전 연도가 시즌의 시작 연도
    const defaultSeason = currentMonth >= 7 ? currentYear : currentYear - 1;
    
    // 헤더 정보 가져오기 (baseUrl 계산용)
    const { baseUrl } = await getApiBaseUrl();
    
    // 필수 선수 데이터 먼저 가져오기
    const playerData = await fetchPlayerData(id);
    
    // 리그 ID 가져오기
    const currentLeagueId = playerData.statistics?.league?.id || 
                          (playerData.stats && playerData.stats[0]?.league?.id);
    
    // 나머지 데이터 병렬로 가져오기
    const [statsData, seasonsData] = await Promise.all([
      fetchPlayerStats(id, defaultSeason),
      fetchPlayerSeasons(id)
    ]);

    // 클라이언트 컴포넌트에 데이터 전달
    return (
      <div className="container">
        <PlayerHeader player={playerData} />
        <PlayerTabs 
          player={playerData}
          statsData={statsData.statistics || []}
          seasons={seasonsData.seasons || []}
          playerId={Number(id)}
          currentLeagueId={currentLeagueId}
          defaultSeason={defaultSeason}
          baseUrl={baseUrl}
        />
      </div>
    );
  } catch (error) {
    console.error('Player page error:', error);
    return (
      <div className="container">
        <div className="bg-white rounded-lg shadow-sm text-center p-4">
          <h2 className="text-xl font-semibold text-red-600">오류 발생</h2>
          <p className="text-gray-700 my-2">선수 정보를 불러오는데 실패했습니다.</p>
          <p className="text-gray-600">API 서버에 연결할 수 없거나 요청한 데이터가 존재하지 않습니다.</p>
          <div className="mt-4 flex justify-center gap-3">
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