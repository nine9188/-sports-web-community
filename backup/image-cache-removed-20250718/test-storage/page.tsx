import { getCachedImageFromStorage } from '@/shared/actions/image-storage-actions';
import { batchCacheTeamLogos, batchCachePlayerImages } from '@/shared/actions/batch-image-cache';
import { ImageType } from '@/shared/utils/image-proxy';
import ApiSportsImage from '@/shared/components/ApiSportsImage';

async function TestStoragePage() {
  // 테스트용 팀 ID들 (프리미어리그 주요 팀들)
  const testTeamIds = [40, 42, 49, 50]; // Liverpool, Arsenal, Chelsea, Manchester City
  const testPlayerIds = [276, 882, 1100]; // 유명 선수들

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Supabase Storage 이미지 캐싱 테스트</h1>
      
      <div className="grid gap-8">
        {/* 팀 로고 테스트 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">팀 로고 테스트</h2>
          <div className="grid grid-cols-4 gap-4">
            {testTeamIds.map(teamId => (
              <div key={teamId} className="text-center">
                <ApiSportsImage
                  src={`https://media.api-sports.io/football/teams/${teamId}.png`}
                  alt={`Team ${teamId}`}
                  width={80}
                  height={80}
                  imageId={teamId}
                  imageType={ImageType.Teams}
                  className="mx-auto mb-2"
                />
                <p className="text-sm text-gray-600">Team ID: {teamId}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-4">
            <BatchCacheTeamsButton teamIds={testTeamIds} />
          </div>
        </section>

        {/* 선수 이미지 테스트 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">선수 이미지 테스트</h2>
          <div className="grid grid-cols-3 gap-4">
            {testPlayerIds.map(playerId => (
              <div key={playerId} className="text-center">
                <ApiSportsImage
                  src={`https://media.api-sports.io/football/players/${playerId}.png`}
                  alt={`Player ${playerId}`}
                  width={80}
                  height={80}
                  imageId={playerId}
                  imageType={ImageType.Players}
                  className="mx-auto mb-2"
                />
                <p className="text-sm text-gray-600">Player ID: {playerId}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-4">
            <BatchCachePlayersButton playerIds={testPlayerIds} />
          </div>
        </section>

        {/* 캐시 상태 확인 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">캐시 상태 확인</h2>
          <CacheStatusChecker />
        </section>
      </div>
    </div>
  );
}

// 팀 로고 배치 캐시 버튼 컴포넌트
function BatchCacheTeamsButton({ teamIds }: { teamIds: number[] }) {
  const handleBatchCache = async () => {
    'use server';
    const result = await batchCacheTeamLogos(teamIds);
    console.log('Batch cache teams result:', result);
  };

  return (
    <form action={handleBatchCache}>
      <button
        type="submit"
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
      >
        팀 로고 배치 캐시 ({teamIds.length}개)
      </button>
    </form>
  );
}

// 선수 이미지 배치 캐시 버튼 컴포넌트
function BatchCachePlayersButton({ playerIds }: { playerIds: number[] }) {
  const handleBatchCache = async () => {
    'use server';
    const result = await batchCachePlayerImages(playerIds);
    console.log('Batch cache players result:', result);
  };

  return (
    <form action={handleBatchCache}>
      <button
        type="submit"
        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
      >
        선수 이미지 배치 캐시 ({playerIds.length}개)
      </button>
    </form>
  );
}

// 캐시 상태 확인 컴포넌트
async function CacheStatusChecker() {
  const testTeamId = 40; // Liverpool
  const testPlayerId = 276; // 테스트 선수

  try {
    const teamResult = await getCachedImageFromStorage(ImageType.Teams, testTeamId);
    const playerResult = await getCachedImageFromStorage(ImageType.Players, testPlayerId);

    return (
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-semibold mb-2">캐시 상태</h3>
        <div className="space-y-2">
          <div>
            <strong>팀 {testTeamId}:</strong> 
            <span className={`ml-2 px-2 py-1 rounded text-sm ${
              teamResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {teamResult.success ? 
                (teamResult.cached ? '캐시됨' : '새로 캐시됨') : 
                '실패'
              }
            </span>
            {teamResult.url && (
              <div className="text-xs text-gray-600 mt-1">
                URL: {teamResult.url}
              </div>
            )}
          </div>
          
          <div>
            <strong>선수 {testPlayerId}:</strong> 
            <span className={`ml-2 px-2 py-1 rounded text-sm ${
              playerResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {playerResult.success ? 
                (playerResult.cached ? '캐시됨' : '새로 캐시됨') : 
                '실패'
              }
            </span>
            {playerResult.url && (
              <div className="text-xs text-gray-600 mt-1">
                URL: {playerResult.url}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="bg-red-100 p-4 rounded">
        <h3 className="font-semibold mb-2 text-red-800">캐시 상태 확인 오류</h3>
        <p className="text-red-600">{error instanceof Error ? error.message : '알 수 없는 오류'}</p>
      </div>
    );
  }
}

export default TestStoragePage; 