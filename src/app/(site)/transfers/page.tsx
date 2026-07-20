import { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { Container, ContainerHeader } from '@/shared/components/ui';
import AdBanner from '@/shared/components/AdBanner';
import TrackPageVisit from '@/domains/layout/components/TrackPageVisit';
import { buildMetadata } from '@/shared/utils/metadataNew';
import DaumWebmasterHints from '@/shared/components/DaumWebmasterHints';
import SeoSummaryCallout from '@/shared/components/SeoSummaryCallout';
import { getTeamById } from '@/domains/livescore/actions/teamLeagueData';
import { TRANSFER_LEAGUE_IDS } from '@/domains/livescore/constants/transferLeagues';
import { getTransferTeamHref } from '@/domains/livescore/utils/entityLinks';
import { buildBreadcrumbJsonLd, jsonLdScriptProps } from '@/shared/utils/jsonLd';
import { TransferFilters, TransferLeagueGroups } from '@/domains/livescore/components/football/transfers';
import { getTransferLeagueTeamGroups } from '@/domains/livescore/actions/transfers/transferTeams';
import { buildFootballOgImageUrl } from '@/shared/utils/footballOgImage';

type TransfersSearchParams = {
  team?: string;
  type?: 'in' | 'out' | 'all';
  page?: string;
};

interface TransfersPageProps {
  searchParams: Promise<TransfersSearchParams>;
}

export async function generateMetadata({ searchParams }: TransfersPageProps): Promise<Metadata> {
  const params = await searchParams;
  const hasQueryState = Boolean(params.team || params.type || params.page);
  const groupedTeams = await getTransferLeagueTeamGroups();
  const leagueNames = groupedTeams
    .map((group) => group.league.name_ko || group.league.name)
    .filter(Boolean)
    .slice(0, 6);
  const teamCount = groupedTeams.reduce((sum, group) => sum + group.teams.length, 0);
  const description = `${leagueNames.join(', ')} 등 ${groupedTeams.length}개 리그 ${teamCount}개 팀의 축구 이적시장 정보입니다. 최신 영입, 방출, 임대 이적과 팀별 이적 현황을 4590 Football에서 확인하세요.`;
  const ogImage = buildFootballOgImageUrl({
    title: '축구 이적시장',
    subtitle: `${groupedTeams.length}개 리그 · ${teamCount}개 팀 이적 현황`,
    label: '이적시장',
  });

  return buildMetadata({
    title: '축구 이적시장 & 소식',
    ogTitle: '실시간 축구 이적 현황 - 4590',
    description: 'EPL, 라리가, K리그 등 주요 리그 및 구단별 선수 이적 현황, 영입, 임대 소식을 확인하세요.',
    path: '/transfers',
    image: ogImage,
    imageWidth: 1200,
    imageHeight: 630,
    keywords: ['4590', '축구 이적시장', '이적 루머', '선수 이적', '4590football'],
    includeSiteKeywords: false,
    includeDefaultOgFallbacks: false,
    robots: {
      index: !hasQueryState,
      follow: true,
      googleBot: {
        index: false,
        follow: true,
      },
    },
  });
}

export default async function TransfersPage({ searchParams }: TransfersPageProps) {
  const params = await searchParams;

  if (params.team) {
    const teamId = parseInt(params.team, 10);
    const team = Number.isFinite(teamId) ? await getTeamById(teamId) : null;
    if (team) {
      const query = new URLSearchParams();
      if (params.type && params.type !== 'all') query.set('type', params.type);
      if (params.page) query.set('page', params.page);
      const queryString = query.toString();
      if (team.is_active === true && team.slug && team.league_id && TRANSFER_LEAGUE_IDS.includes(team.league_id)) {
        permanentRedirect(`${getTransferTeamHref(team)}${queryString ? `?${queryString}` : ''}`);
      }
    }
  }

  const groupedTeams = await getTransferLeagueTeamGroups();
  const supportedTeams = groupedTeams.flatMap((group) => group.teams);
  const filterLeagueTeamGroups = groupedTeams.map((group) => ({
    leagueId: group.league.id,
    teams: group.teams.map((team) => ({
      id: team.id,
      name_ko: team.name_ko,
      name_en: team.name_en,
      slug: team.slug,
    })),
  }));

  const leagueNames = groupedTeams
    .map((group) => group.league.name_ko || group.league.name)
    .filter(Boolean)
    .slice(0, 6);
  const teamCount = supportedTeams.length;
  const seoSummary = `${leagueNames.join(', ')} 등 ${groupedTeams.length}개 리그 ${teamCount}개 팀의 축구 이적시장 정보입니다. 4590 Football에서 각 팀별 영입, 방출, 임대 이적 현황과 실시간 이적료 정보를 편리하게 확인해 보세요.`;

  const breadcrumbSchema = buildBreadcrumbJsonLd({
    items: [
      { name: '홈', url: '/' },
      { name: '이적시장', url: '/transfers' },
    ],
  });

  return (
    <div className="min-h-screen">
      <DaumWebmasterHints
        title="이적시장 - 축구 이적 정보"
        content="프리미어리그, 라리가, 분데스리가, 세리에A, 리그앙, K리그 등 주요 리그의 축구 이적시장 정보를 확인하세요."
      />
      <script type="application/ld+json" {...jsonLdScriptProps(breadcrumbSchema)} />
      <TrackPageVisit id="transfers" slug="transfers" name="이적시장" />

      <Container>
        <ContainerHeader>
          <div className="flex items-center justify-between w-full">
            <h1 className="text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0]">이적시장</h1>
            <span className="hidden md:inline text-xs text-gray-500 dark:text-gray-400">해외/국내 이적 정보</span>
          </div>
        </ContainerHeader>
        <div className="px-4 pb-4 bg-white dark:bg-[#1D1D1D]">
          <div className="mt-4">
            <SeoSummaryCallout summary={seoSummary} plain />
          </div>
        </div>
      </Container>

      <div className="mt-4">
        <AdBanner />
      </div>

      <div className="mt-4">
        <TransferFilters currentFilters={{}} leagueTeamGroups={filterLeagueTeamGroups} />
      </div>

      <TransferLeagueGroups groupedTeams={groupedTeams} />
    </div>
  );
}
