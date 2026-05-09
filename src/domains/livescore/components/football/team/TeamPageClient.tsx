'use client';

import TeamHeader from './TeamHeader';
import TabNavigation from './TabNavigation';
import TabContent from './TabContent';
import { TeamFullDataResponse } from '@/domains/livescore/actions/teams/team';
import AdBanner from '@/shared/components/AdBanner';

export type TeamTabType = 'overview' | 'fixtures' | 'standings' | 'squad' | 'transfers' | 'stats';

export type PlayerKoreanNames = Record<number, string | null>;

interface TeamPageClientProps {
  teamId: string;
  initialTab: TeamTabType;
  initialData: TeamFullDataResponse;
  playerKoreanNames?: PlayerKoreanNames;
}

export default function TeamPageClient({
  teamId,
  initialTab,
  initialData,
  playerKoreanNames = {},
}: TeamPageClientProps) {
  const currentTab = initialTab;

  return (
    <>
      <TeamHeader
        initialData={initialData.teamData}
        teamLogoUrl={initialData.teamLogoUrls?.[parseInt(teamId, 10)]}
        venueImageUrl={initialData.venueImageUrl}
      />

      <div className="mb-4">
        <AdBanner />
      </div>

      <TabNavigation
        teamId={teamId}
        activeTab={currentTab}
      />

      <TabContent
        teamId={teamId}
        tab={currentTab}
        initialData={initialData}
        playerKoreanNames={playerKoreanNames}
      />
    </>
  );
}
