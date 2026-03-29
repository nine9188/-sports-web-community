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
    description: '17개 리그 축구 이적 소식, 영입 정보, 방출 소식을 확인하세요. 매주 업데이트.',
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
            <h1 className="text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0]">이적시장</h1>
            <div className="hidden md:flex items-center space-x-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">매주 업데이트</span>
            </div>
          </div>
        </ContainerHeader>

        {/* 설명 섹션 */}
        <div className="px-4 py-3 bg-white dark:bg-[#1D1D1D] space-y-2">
          <p className="text-[13px] text-gray-700 dark:text-gray-300">
            17개 리그 이적 소식과 선수 영입 정보를 확인하세요
          </p>
          <div className="flex items-center gap-1.5 mt-1 mb-1">
            <span className="text-amber-500 text-xs">&#9733;</span>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">이적 정보는 1주일에 한 번 업데이트됩니다</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>
              <span className="font-medium text-gray-700 dark:text-gray-300">자동 업데이트 (13개 리그)</span>
              {' '}프리미어리그 · 라리가 · 세리에A · 분데스리가 · 리그1 · K리그1 · 챔피언십 · 에레디비시 · 프리메이라리가 · J1리그 · MLS · 사우디 프로리그 · 브라질레이랑
            </p>
            <p>
              <span className="font-medium text-gray-700 dark:text-gray-300">리그 선택 시 조회 (4개 리그)</span>
              {' '}덴마크 수페르리가 · 중국 슈퍼리그 · 리가MX · 스코틀랜드 프리미어십
            </p>
          </div>
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
