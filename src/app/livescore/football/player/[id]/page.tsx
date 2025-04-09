import { headers } from 'next/headers';
import PlayerHeader from '../components/PlayerHeader';
import PlayerTabs from '../components/PlayerTabs';

// 동적 렌더링 강제 설정 추가
export const dynamic = 'force-dynamic';

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // 동적으로 호스트와 프로토콜 가져오기
    const headersList = await headers();
    const host = headersList.get('host');
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    
    // 현재 연도 계산
    const currentYear = new Date().getFullYear();
    const defaultSeason = currentYear > 2024 ? 2024 : currentYear;
    
    // 필수 API 요청만 서버에서 실행 (초기 렌더링에 필요한 데이터만)
    const playerRes = await fetch(`${baseUrl}/api/livescore/football/players/${id}`, { cache: 'no-store' });

    // 응답 확인
    if (!playerRes.ok) {
      throw new Error('선수 정보를 불러오는데 실패했습니다.');
    }

    // 데이터 파싱
    const playerData = await playerRes.json();
    
    // 리그 ID 가져오기
    const currentLeagueId = playerData.statistics?.league?.id || 
                           (playerData.stats && playerData.stats[0]?.league?.id);
    
    // 기본적인 통계 데이터만 서버에서 가져옴 (나머지는 클라이언트에서 요청)
    const statsRes = await fetch(`${baseUrl}/api/livescore/football/players/${id}/stats?season=${defaultSeason}`, { cache: 'no-store' });
    const statsData = statsRes.ok ? await statsRes.json() : { statistics: [] };
    
    // 시즌 정보 가져오기 (사용 가능한 시즌 목록 표시를 위해)
    const seasonsRes = await fetch(`${baseUrl}/api/livescore/football/players/${id}/seasons`, { cache: 'no-store' });
    const seasonsData = seasonsRes.ok ? await seasonsRes.json() : { seasons: [] };

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
      <div className="p-4">
        <h1 className="text-red-500">
          Error: {error instanceof Error ? error.message : '선수 정보를 불러오는데 실패했습니다'}
        </h1>
      </div>
    );
  }
} 