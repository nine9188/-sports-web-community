'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePathname, useSearchParams } from 'next/navigation';
import AdBanner from '@/shared/components/AdBanner';
import { MatchFullDataResponse } from '@/domains/livescore/actions/match/matchData';
import { getCachedSidebarExtrasData } from '@/domains/livescore/actions/match/sidebarData';
import { HeadToHeadTestData } from '@/domains/livescore/actions/match/headtohead';
import { AllPlayerStatsResponse } from '@/domains/livescore/types/lineup';
import type { RelatedPost } from '@/domains/livescore/actions/match/relatedPosts';
import type { MatchHighlight } from '@/domains/livescore/types/highlight';
import { matchKeys } from '@/shared/constants/queryKeys';
import { scrollToTop } from '@/shared/utils/scroll';
import MatchHeader from './MatchHeader';
import MatchSidebar from './sidebar/MatchSidebar';
import TabContent from './TabContent';
import TabNavigation from './TabNavigation';

export type MatchTabType = 'power' | 'events' | 'lineups' | 'stats' | 'standings' | 'support';

const VALID_TABS: MatchTabType[] = ['power', 'events', 'lineups', 'stats', 'standings', 'support'];
const DEFAULT_TAB: MatchTabType = 'power';

export type PlayerKoreanNames = Record<number, string | null>;

interface MatchPageClientProps {
  matchId: string;
  initialTab: MatchTabType;
  initialData: MatchFullDataResponse;
  initialPowerData?: HeadToHeadTestData;
  powerMode?: 'all' | 'summary' | 'comparison' | 'recent' | 'comparisonRecent' | 'h2h' | 'topPlayers';
  allPlayerStats?: AllPlayerStatsResponse | null;
  playerKoreanNames?: PlayerKoreanNames;
  cupRoundsData?: import('@/domains/livescore/actions/match/cupFixtures').CupRound[];
  relatedPosts?: RelatedPost[];
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
  cupRoundsData,
  relatedPosts,
  homeBoardSlug,
  awayBoardSlug,
  highlight,
}: MatchPageClientProps) {
  const [currentTab, setCurrentTab] = useState<MatchTabType>(initialTab);
  const [hasDesktopSidebar, setHasDesktopSidebar] = useState(false);  const pathname = usePathname();
  const searchParams = useSearchParams();
  const homeTeamId = initialData.homeTeam?.id;
  const awayTeamId = initialData.awayTeam?.id;
  const sidebarQueryKey = useMemo(() => [...matchKeys.detail(matchId), 'sidebar-extras'], [matchId]);
  const fetchSidebarExtras = useCallback(() => getCachedSidebarExtrasData(
    matchId,
    homeTeamId,
    awayTeamId,
    initialData.matchData as Record<string, unknown> | undefined
  ), [matchId, homeTeamId, awayTeamId, initialData.matchData]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1280px)');
    const update = () => setHasDesktopSidebar(mediaQuery.matches);

    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  const sidebarQuery = useQuery({
    queryKey: sidebarQueryKey,
    queryFn: fetchSidebarExtras,
    enabled: Boolean(matchId) && (hasDesktopSidebar || currentTab === 'support'),
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
  });
  const sidebarData = sidebarQuery.data?.success ? sidebarQuery.data.data : null;

  const handleTabChange = useCallback((tabId: string) => {
    const newTab = tabId as MatchTabType;

    if (!VALID_TABS.includes(newTab) || newTab === currentTab) return;

    setCurrentTab(newTab);

    const params = new URLSearchParams(searchParams?.toString() || '');
    if (newTab === DEFAULT_TAB) {
      params.delete('tab');
    } else {
      params.set('tab', newTab);
    }

    window.history.replaceState(
      null,
      '',
      `${pathname}${params.toString() ? `?${params.toString()}` : ''}`
    );
  }, [currentTab, pathname, searchParams]);

  useEffect(() => {
    scrollToTop('auto');
  }, [currentTab]);

  return (
    <div className="container">
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <MatchHeader
            matchId={matchId}
            initialData={initialData}
            teamLogoUrls={initialData.teamLogoUrls}
            leagueLogoUrl={initialData.leagueLogoUrl}
            leagueLogoDarkUrl={initialData.leagueLogoDarkUrl}
          />

          <div className="mb-4">
            <AdBanner />
          </div>

          <TabNavigation
            activeTab={currentTab}
            onTabChange={handleTabChange}
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
            sidebarLoading={sidebarQuery.isPending}
            highlight={highlight}
            homeBoardSlug={homeBoardSlug ?? sidebarData?.homeBoardSlug}
            awayBoardSlug={awayBoardSlug ?? sidebarData?.awayBoardSlug}
            playerKoreanNames={playerKoreanNames}
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
