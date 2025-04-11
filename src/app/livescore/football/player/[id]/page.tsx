import PlayerHeader from '../components/PlayerHeader';
import PlayerTabs from '../components/PlayerTabs';
import { getAPIURL } from '@/app/lib/utils';

// 동적 렌더링 강제 설정 추가
export const dynamic = 'force-dynamic';
export const fetchCache = 'default-no-store'; // 캐싱 방지
export const revalidate = 0; // 항상 새로운 데이터 요청

// API 호출 함수들
async function fetchPlayerData(id: string, baseUrl: string) {
  try {
    const response = await fetch(`${baseUrl}/api/livescore/football/players/${id}`, { 
      cache: 'no-store' 
    });
    
    if (!response.ok) {
      console.error(`API 응답 오류: ${response.status} ${response.statusText}`);
      return null;
    }
    
    return response.json();
  } catch (error) {
    console.error('Player data fetch error:', error);
    return null;
  }
}

async function fetchPlayerStats(id: string, season: number, baseUrl: string) {
  try {
    const response = await fetch(`${baseUrl}/api/livescore/football/players/${id}/stats?season=${season}`, { 
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

async function fetchPlayerSeasons(id: string, baseUrl: string) {
  try {
    const response = await fetch(`${baseUrl}/api/livescore/football/players/${id}/seasons`, { 
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
    
    // getAPIURL 함수 사용하여 baseUrl 설정
    const baseUrl = getAPIURL();
    
    // 현재 연도 계산
    const currentYear = new Date().getFullYear();
    const defaultSeason = currentYear > 2023 ? 2023 : currentYear;
    
    // 필수 데이터 먼저 가져오기 (기본 선수 정보)
    const playerData = await fetchPlayerData(id, baseUrl);
    
    // 선수 데이터가 없으면 오류 화면 표시
    if (!playerData) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-4">오류 발생</h2>
            <p className="text-gray-700 mb-4">선수 정보를 불러오는데 실패했습니다.</p>
            <p className="text-gray-600">API 서버에 연결할 수 없거나 요청한 데이터가 존재하지 않습니다.</p>
            <div className="mt-6">
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
    
    // 리그 ID 가져오기
    const currentLeagueId = playerData.statistics?.league?.id || 
                          (playerData.stats && playerData.stats[0]?.league?.id);
    
    // 나머지 데이터 병렬로 가져오기 (match 패턴과 동일)
    const [statsData, seasonsData] = await Promise.all([
      fetchPlayerStats(id, defaultSeason, baseUrl),
      fetchPlayerSeasons(id, baseUrl)
    ]);

    // 클라이언트 컴포넌트에 데이터 전달
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
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
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">오류 발생</h2>
          <p className="text-gray-700 mb-4">선수 정보를 불러오는데 실패했습니다.</p>
          <p className="text-gray-600">API 서버에 연결할 수 없거나 요청한 데이터가 존재하지 않습니다.</p>
          <div className="mt-6">
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