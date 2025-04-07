import PlayerHeader from '../components/PlayerHeader';
import PlayerTabs from '../components/PlayerTabs';

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // API 기본 URL 설정 - 환경 변수가 없을 경우 기본값 사용
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    // 현재 연도 계산
    const currentYear = new Date().getFullYear();
    const defaultSeason = currentYear > 2024 ? 2024 : currentYear;
    
    // 모든 API 요청을 서버에서 병렬로 실행 (fixtures 포함)
    const [
      playerRes, 
      trophiesRes, 
      transfersRes, 
      injuriesRes, 
      seasonsRes, 
      statsRes,
      fixturesRes
    ] = await Promise.all([
      fetch(`${apiBaseUrl}/api/livescore/football/players/${id}`, { cache: 'no-store' }),
      fetch(`${apiBaseUrl}/api/livescore/football/players/${id}/trophies`, { cache: 'no-store' }),
      fetch(`${apiBaseUrl}/api/livescore/football/players/${id}/transfers`, { cache: 'no-store' }),
      fetch(`${apiBaseUrl}/api/livescore/football/players/${id}/injuries`, { cache: 'no-store' }),
      fetch(`${apiBaseUrl}/api/livescore/football/players/${id}/seasons`, { cache: 'no-store' }),
      fetch(`${apiBaseUrl}/api/livescore/football/players/${id}/stats?season=${defaultSeason}`, { cache: 'no-store' }),
      fetch(`${apiBaseUrl}/api/livescore/football/players/${id}/fixtures?season=${defaultSeason}`, { cache: 'no-store' })
    ]);

    // 응답 확인
    if (!playerRes.ok) {
      throw new Error('선수 정보를 불러오는데 실패했습니다.');
    }

    // 데이터 파싱
    const playerData = await playerRes.json();
    
    // 리그 ID 가져오기
    const currentLeagueId = playerData.statistics?.league?.id || 
                           (playerData.stats && playerData.stats[0]?.league?.id);
    
    // 랭킹 데이터 가져오기 (리그 ID가 있는 경우에만)
    let rankingsData = {};
    
    if (currentLeagueId) {
      try {
        const rankingsRes = await fetch(`${apiBaseUrl}/api/livescore/football/players/${id}/rankings?league=${currentLeagueId}`, { cache: 'no-store' });
        
        // rankings 데이터 파싱
        if (rankingsRes.ok) {
          rankingsData = await rankingsRes.json();
        }
      } catch (error) {
        console.error('Failed to fetch rankings:', error);
      }
    }

    // 나머지 데이터 파싱
    const [trophiesData, transfersData, injuriesData, seasonsData, statsData, fixturesData] = await Promise.all([
      trophiesRes.ok ? trophiesRes.json() : [],
      transfersRes.ok ? transfersRes.json() : [],
      injuriesRes.ok ? injuriesRes.json() : [],
      seasonsRes.ok ? seasonsRes.json() : { seasons: [] },
      statsRes.ok ? statsRes.json() : { statistics: [] },
      fixturesRes.ok ? fixturesRes.json() : { data: [] }
    ]);

    // 클라이언트 컴포넌트에 데이터 전달
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <PlayerHeader player={playerData} />
        <PlayerTabs 
          player={playerData}
          trophies={trophiesData}
          transfers={transfersData}
          injuries={injuriesData}
          seasons={seasonsData.seasons || []}
          fixtures={fixturesData}
          rankings={rankingsData}
          statsData={statsData.statistics || []}
        />
      </div>
    );
  } catch (error) {
    console.error('Player page error:', error);
    return (
      <div className="p-4">
        <h1 className="text-red-500">
          Error: {error instanceof Error ? error.message : '선수 정보를 불러오는데 실패했습니다'}
        </h1>
      </div>
    );
  }
} 