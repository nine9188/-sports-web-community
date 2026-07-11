import PlayerHeader from './PlayerHeader';
import PlayerTabNavigation from './TabNavigation';
import TabContent from './TabContent';
import { PlayerFullDataResponse } from '@/domains/livescore/actions/player/data';
import AdBanner from '@/shared/components/AdBanner';
import type { PlayerTabType } from '@/domains/livescore/hooks';
import type { RelatedPost } from '@/domains/livescore/actions/match/relatedPosts';
import SeoSummaryCallout from '@/shared/components/SeoSummaryCallout';

interface PlayerPageClientProps {
  playerId: string;
  initialTab: PlayerTabType;
  initialData: PlayerFullDataResponse;
  playerKoreanName?: string | null;
  rankingsKoreanNames?: Record<number, string | null>;
  initialPage?: number;
  relatedPosts?: RelatedPost[];
  seoSummary?: string;
}

export default function PlayerPageClient({
  playerId,
  initialTab,
  initialData,
  playerKoreanName,
  rankingsKoreanNames = {},
  initialPage = 1,
  relatedPosts = [],
  seoSummary,
}: PlayerPageClientProps) {
  const currentTab = initialTab;

  return (
    <>
      {/* PlayerHeader - playerId와 초기 데이터 전달 */}
      <PlayerHeader
        playerId={playerId}
        initialData={initialData.playerData}
        playerKoreanName={playerKoreanName}
        playerPhotoUrl={initialData.playerPhotoUrl}
        teamLogoUrl={initialData.teamLogoUrl}
        currentTeamLeague={initialData.currentTeamLeague}
      />

      {seoSummary && (
        <div className="mt-4">
          <SeoSummaryCallout summary={seoSummary} />
        </div>
      )}

      {/* 배너 광고 */}
      <div className="mb-4 mt-4">
        <AdBanner />
      </div>

      {/* 탭 네비게이션 - onTabChange 콜백 전달 */}
      <PlayerTabNavigation
        activeTab={currentTab}
      />

      {/* 탭 컨텐츠 - initialData가 서버에서 이미 로드됨 */}
      <TabContent
        playerId={playerId}
        currentTab={currentTab}
        initialData={initialData}
        playerKoreanName={playerKoreanName}
        rankingsKoreanNames={rankingsKoreanNames}
        initialPage={initialPage}
        relatedPosts={relatedPosts}
      />
    </>
  );
}
