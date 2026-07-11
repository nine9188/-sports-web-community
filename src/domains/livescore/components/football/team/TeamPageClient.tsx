import TeamHeader from './TeamHeader';
import TabNavigation from './TabNavigation';
import TabContent from './TabContent';
import { TeamFullDataResponse } from '@/domains/livescore/actions/teams/team';
import type { TeamDailyBriefingData } from '@/domains/livescore/actions/teams/dailyBriefing';
import AdBanner from '@/shared/components/AdBanner';
import SeoSummaryCallout from '@/shared/components/SeoSummaryCallout';

export type TeamTabType = 'overview' | 'fixtures' | 'standings' | 'squad' | 'transfers' | 'stats';

export type PlayerKoreanNames = Record<number, string | null>;

interface TeamPageClientProps {
  teamId: string;
  initialTab: TeamTabType;
  initialData: TeamFullDataResponse;
  playerKoreanNames?: PlayerKoreanNames;
  dailyBriefing?: TeamDailyBriefingData | null;
  seoSummary?: string;
}

export default function TeamPageClient({
  teamId,
  initialTab,
  initialData,
  playerKoreanNames = {},
  dailyBriefing = null,
  seoSummary,
}: TeamPageClientProps) {
  const currentTab = initialTab;

  return (
    <>
      <TeamHeader
        initialData={initialData.teamData}
        teamLogoUrl={initialData.teamLogoUrls?.[parseInt(teamId, 10)]}
        venueImageUrl={initialData.venueImageUrl}
      />

      {seoSummary && (
        <div className="mt-4">
          <SeoSummaryCallout summary={seoSummary} />
        </div>
      )}

      <div className="mb-4 mt-4">
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
        dailyBriefing={dailyBriefing}
      />
    </>
  );
}
