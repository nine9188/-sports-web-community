'use client';
import AdBanner from '@/shared/components/AdBanner';
import { MatchFullDataResponse } from '@/domains/livescore/actions/match/matchData';
import type { SidebarData } from '@/domains/livescore/actions/match/sidebarData';
import { HeadToHeadTestData } from '@/domains/livescore/actions/match/headtohead';
import { AllPlayerStatsResponse } from '@/domains/livescore/types/lineup';
import type { RelatedPost } from '@/domains/livescore/actions/match/relatedPosts';
import type { MatchHighlight } from '@/domains/livescore/types/highlight';
import MatchHeader, { type HeaderGoalEvent } from './MatchHeader';
import MatchSidebar from './sidebar/MatchSidebar';
import TabContent from './TabContent';
import TabNavigation from './TabNavigation';

export type MatchTabType = 'power' | 'events' | 'lineups' | 'stats' | 'standings' | 'support';

export type PlayerKoreanNames = Record<number, string | null>;

interface MatchPageClientProps {
  matchId: string;
  initialTab: MatchTabType;
  initialData: MatchFullDataResponse;
  initialPowerData?: HeadToHeadTestData;
  powerMode?: 'all' | 'summary' | 'comparison' | 'recent' | 'comparisonRecent' | 'h2h' | 'topPlayers';
  allPlayerStats?: AllPlayerStatsResponse | null;
  playerKoreanNames?: PlayerKoreanNames;
  headerGoalEvents?: HeaderGoalEvent[];
  lineupPlayerPhotoUrls?: Record<number, string>;
  cupRoundsData?: import('@/domains/livescore/actions/match/cupFixtures').CupRound[];
  relatedPosts?: RelatedPost[];
  initialSidebarData?: SidebarData | null;
  homeBoardSlug?: string | null;
  awayBoardSlug?: string | null;
  highlight?: MatchHighlight | null;
}

export default function MatchPageClient({
  matchId,
  initialTab,
  initialData,
  initialPowerData,
  powerMode = 'all',
  allPlayerStats,
  playerKoreanNames = {},
  headerGoalEvents,
  lineupPlayerPhotoUrls,
  cupRoundsData,
  relatedPosts,
  initialSidebarData,
  homeBoardSlug,
  awayBoardSlug,
  highlight,
}: MatchPageClientProps) {
  const currentTab = initialTab;
  const sidebarData = initialSidebarData ?? null;

  return (
    <div className="container">
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <MatchHeader
            matchId={matchId}
            initialData={initialData}
            playerKoreanNames={playerKoreanNames}
            goalEvents={headerGoalEvents}
            teamLogoUrls={initialData.teamLogoUrls}
            leagueLogoUrl={initialData.leagueLogoUrl}
            leagueLogoDarkUrl={initialData.leagueLogoDarkUrl}
          />

          <div className="mb-4">
            <AdBanner />
          </div>

          <TabNavigation
            activeTab={currentTab}
          />

          <TabContent
            matchId={matchId}
            currentTab={currentTab}
            initialData={initialData}
            initialPowerData={initialPowerData}
            powerMode={powerMode}
            allPlayerStats={allPlayerStats}
            relatedPosts={relatedPosts ?? sidebarData?.relatedPosts}
            sidebarData={sidebarData}
            sidebarLoading={false}
            highlight={highlight}
            homeBoardSlug={homeBoardSlug ?? sidebarData?.homeBoardSlug}
            awayBoardSlug={awayBoardSlug ?? sidebarData?.awayBoardSlug}
            playerKoreanNames={playerKoreanNames}
            lineupPlayerPhotoUrls={lineupPlayerPhotoUrls}
            cupRoundsData={cupRoundsData}
          />
        </div>

        <aside className="hidden xl:block w-[300px] shrink-0">
          <MatchSidebar
            matchId={matchId}
            initialData={initialData.matchData}
            sidebarData={sidebarData}
            teamLogoUrls={initialData.teamLogoUrls}
            highlight={highlight}
          />
        </aside>
      </div>
    </div>
  );
}
