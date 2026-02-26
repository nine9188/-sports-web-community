import { Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui';
import AdBanner from '@/shared/components/AdBanner';
import TrackPageVisit from '@/domains/layout/components/TrackPageVisit';
import { buildMetadata } from '@/shared/utils/metadataNew';
import { fetchTransfersFullData } from '@/domains/livescore/actions/transfers';
import { getPlayersKoreanNames } from '@/domains/livescore/actions/player/getKoreanName';
import { getPlayerPhotoUrls } from '@/domains/livescore/actions/images';
import { ensureAssetsCached } from '@/domains/livescore/actions/images';
import TransfersPageContent from '@/domains/livescore/components/football/transfers/TransfersPageContent';

export async function generateMetadata() {
  return buildMetadata({
    title: '이적시장',
    description: '최신 축구 이적 소식, 영입 정보, 방출 소식을 실시간으로 확인하세요.',
    path: '/transfers',
  });
}

interface TransfersPageProps {
  searchParams: Promise<{
    league?: string;
    team?: string;
    season?: string;
    type?: 'in' | 'out' | 'all';
    page?: string;
  }>;
}

export default async function TransfersPage({ searchParams }: TransfersPageProps) {
  const params = await searchParams;

  // URL 파라미터를 필터 객체로 변환
  const filters = {
    league: params.league ? parseInt(params.league) : undefined,
    team: params.team ? parseInt(params.team) : undefined,
    season: params.season ? parseInt(params.season) : undefined,
    type: params.type !== 'all' ? params.type : undefined
  };

  const currentPage = parseInt(params.page || '1');

  // 서버에서 데이터 로드 (캐시 적용됨)
  const transfersData = await fetchTransfersFullData(filters, currentPage, 20);

  // 선수/팀 ID 수집
  const playerIds = transfersData.transfers.map(t => t.player.id).filter(Boolean);
  const teamIds = transfersData.transfers.flatMap(t => [
    t.transfers[0]?.teams?.in?.id,
    t.transfers[0]?.teams?.out?.id
  ]).filter((id): id is number => Boolean(id && id > 0));

  // 4590 표준: 선수 한글명 + 이미지 URL 일괄 조회
  const [playerKoreanNames, playerPhotoUrls, teamLogoUrls] = await Promise.all([
    playerIds.length > 0 ? getPlayersKoreanNames(playerIds) : {},
    playerIds.length > 0 ? getPlayerPhotoUrls(playerIds) : {},
    teamIds.length > 0 ? ensureAssetsCached('team_logo', [...new Set(teamIds)]) : {},
  ]);

  return (
    <div className="min-h-screen">
      <TrackPageVisit id="transfers" slug="transfers" name="이적시장" />
      {/* 헤더 섹션 */}
      <Container>
        <ContainerHeader>
          <div className="flex items-center justify-between w-full">
            <ContainerTitle>이적시장</ContainerTitle>
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-700 dark:text-gray-300">실시간 업데이트</span>
            </div>
          </div>
        </ContainerHeader>

        {/* 설명 섹션 */}
        <div className="px-4 py-3 bg-white dark:bg-[#1D1D1D]">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            최신 축구 이적 소식과 선수 영입 정보를 확인하세요
          </p>
        </div>
      </Container>

      {/* 배너 광고 */}
      <div className="mt-4">
        <AdBanner />
      </div>

      {/* 메인 콘텐츠 */}
      <div className="mt-4">
        <TransfersPageContent
          initialData={transfersData}
          playerKoreanNames={playerKoreanNames}
          playerPhotoUrls={playerPhotoUrls}
          teamLogoUrls={teamLogoUrls}
          currentFilters={filters}
        />
      </div>
    </div>
  );
}
