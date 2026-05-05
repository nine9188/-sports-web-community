'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import AdBanner from '@/shared/components/AdBanner';
import { MatchFullDataResponse } from '@/domains/livescore/actions/match/matchData';
import { HeadToHeadTestData } from '@/domains/livescore/actions/match/headtohead';
import { AllPlayerStatsResponse } from '@/domains/livescore/types/lineup';
import type { RelatedPost } from '@/domains/livescore/actions/match/relatedPosts';
import { scrollToTop } from '@/shared/utils/scroll';
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
}: MatchPageClientProps) {
  const [currentTab, setCurrentTab] = useState<MatchTabType>(initialTab);
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
    <>
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
        relatedPosts={relatedPosts}
        homeBoardSlug={homeBoardSlug}
        awayBoardSlug={awayBoardSlug}
        playerKoreanNames={playerKoreanNames}
        cupRoundsData={cupRoundsData}
      />
    </>
  );
}
