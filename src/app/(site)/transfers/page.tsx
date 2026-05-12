import { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { Container, ContainerHeader } from '@/shared/components/ui';
import AdBanner from '@/shared/components/AdBanner';
import TrackPageVisit from '@/domains/layout/components/TrackPageVisit';
import { buildMetadata } from '@/shared/utils/metadataNew';
import DaumWebmasterHints from '@/shared/components/DaumWebmasterHints';
import { getTeamById } from '@/domains/livescore/actions/teamLeagueData';
import { TRANSFER_LEAGUE_IDS } from '@/domains/livescore/constants/transferLeagues';
import { getTransferTeamHref } from '@/domains/livescore/utils/entityLinks';
import { buildBreadcrumbJsonLd, jsonLdScriptProps } from '@/shared/utils/jsonLd';
import { TransferFilters, TransferLeagueGroups } from '@/domains/livescore/components/football/transfers';
import { getTransferLeagueTeamGroups } from '@/domains/livescore/actions/transfers/transferTeams';

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

  return buildMetadata({
    title: '이적시장 - 해외/국내 이적 정보',
    description: '프리미어리그, 라리가, 분데스리가, 세리에A, 리그앙, K리그 등 주요 리그의 이적시장 정보를 확인하세요.',
    path: '/transfers',
    keywords: ['이적시장', '이적 정보', '선수 이적', '해외 이적', 'K리그 이적', '4590football'],
    noindex: hasQueryState,
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
        <div className="px-4 py-4 bg-white dark:bg-[#1D1D1D] space-y-2">
          <p className="text-[13px] text-gray-700 dark:text-gray-300">
            프리미어리그, 라리가, 분데스리가, 세리에A, 리그앙, K리그 등 주요 리그의 이적시장 정보를 확인하세요.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {groupedTeams.length}개 리그, {supportedTeams.length}개 팀의 이적시장 페이지를 제공합니다.
          </p>
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
