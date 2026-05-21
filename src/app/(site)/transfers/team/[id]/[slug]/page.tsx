import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import AdBanner from '@/shared/components/AdBanner';
import TrackPageVisit from '@/domains/layout/components/TrackPageVisit';
import { Container, ContainerHeader } from '@/shared/components/ui';
import { buildMetadata } from '@/shared/utils/metadataNew';
import DaumWebmasterHints from '@/shared/components/DaumWebmasterHints';
import { getLeagueById, getTeamById } from '@/domains/livescore/actions/teamLeagueData';
import { fetchTransfersFullData } from '@/domains/livescore/actions/transfers';
import { getPlayersKoreanNames } from '@/domains/livescore/actions/player/getKoreanName';
import { getPlayerPhotoUrls, getTeamLogoUrls } from '@/domains/livescore/actions/images';
import TransfersPageContent from '@/domains/livescore/components/football/transfers/TransfersPageContent';
import { getTeamLinkSlug, getTransferTeamHref } from '@/domains/livescore/utils/entityLinks';
import { buildBreadcrumbJsonLd, jsonLdScriptProps } from '@/shared/utils/jsonLd';
import { getTransferLeagueTeamGroups } from '@/domains/livescore/actions/transfers/transferTeams';
import { normalizeRouteSlug } from '@/shared/utils/nextNavigationErrors';
import { buildFootballOgImageUrl } from '@/shared/utils/footballOgImage';

interface TeamTransfersPageProps {
  params: Promise<{ id: string; slug: string }>;
  searchParams: Promise<{
    type?: 'in' | 'out' | 'all';
    page?: string;
  }>;
}

async function getTeamContext(id: string, slug?: string) {
  const teamId = parseInt(id, 10);
  if (!Number.isFinite(teamId)) return null;

  const team = await getTeamById(teamId);
  if (!team) return null;

  const expectedSlug = getTeamLinkSlug(team);
  const league = team.league_id ? await getLeagueById(team.league_id) : null;

  return {
    teamId,
    team,
    league,
    expectedSlug,
    shouldRedirect: Boolean(slug && normalizeRouteSlug(slug) !== normalizeRouteSlug(expectedSlug)),
  };
}

function buildTeamTransfersDescription({
  countryName,
  leagueName,
  playerNames = [],
  teamName,
  totalCount,
}: {
  countryName?: string | null;
  leagueName: string;
  playerNames?: string[];
  teamName: string;
  totalCount?: number;
}) {
  const leagueContext = countryName ? `${countryName} ${leagueName}` : leagueName;
  const playerContext = playerNames.length ? ` 최근 이적 선수: ${playerNames.join(', ')}.` : '';
  const countContext = typeof totalCount === 'number' && totalCount > 0 ? ` 총 ${totalCount}건의 이적 기록을 제공합니다.` : '';
  return `${leagueContext} ${teamName}의 최신 영입, 방출, 임대 이적과 이적료 정보입니다.${playerContext}${countContext} 4590 Football에서 팀별 이적 현황을 확인하세요.`;
}

export async function generateMetadata({ params, searchParams }: TeamTransfersPageProps): Promise<Metadata> {
  const [{ id, slug }, query] = await Promise.all([params, searchParams]);
  const context = await getTeamContext(id, slug);

  if (!context) {
    return buildMetadata({
      title: '이적시장 정보를 찾을 수 없습니다',
      description: '요청하신 팀 이적시장 정보를 찾을 수 없습니다.',
      path: '/transfers',
      noindex: true,
    });
  }

  const teamName = context.team.name_ko || context.team.name_en;
  const leagueName = context.league?.name_ko || context.league?.name || '축구 리그';
  const countryName = context.league?.country_ko || context.league?.country || context.team.country_ko || context.team.country_en;
  const hasQueryState = Boolean(query.type || query.page);
  const transfersData = await fetchTransfersFullData({
    league: context.team.league_id || undefined,
    team: context.teamId,
    type: query.type !== 'all' ? query.type : undefined,
  }, 1, 5);
  const playerIds = transfersData.transfers.map((transfer) => transfer.player.id).filter(Boolean);
  const koreanNames = playerIds.length > 0 ? await getPlayersKoreanNames(playerIds) : {};
  const playerNames = transfersData.transfers
    .map((transfer) => koreanNames[transfer.player.id] || transfer.player.name)
    .filter(Boolean)
    .slice(0, 4);
  const description = buildTeamTransfersDescription({
    countryName,
    leagueName,
    playerNames,
    teamName,
    totalCount: transfersData.totalCount,
  });
  const ogImage = buildFootballOgImageUrl({
    title: `${teamName} 이적시장`,
    subtitle: playerNames.length
      ? `최근 이적 선수: ${playerNames.join(', ')}`
      : `${leagueName} · 팀별 이적 현황`,
    label: '팀 이적시장',
  });

  return buildMetadata({
    title: `${teamName} 이적시장`,
    description,
    path: getTransferTeamHref(context.team),
    image: ogImage,
    imageWidth: 1200,
    imageHeight: 630,
    keywords: [`${teamName} 이적`, `${teamName} 영입`, `${teamName} 방출`, `${teamName} 이적시장`, `${leagueName} 이적`, ...playerNames, '축구 이적시장', '4590', '4590football'],
    includeSiteKeywords: false,
    includeDefaultOgFallbacks: false,
    noindex: hasQueryState,
  });
}

export default async function TeamTransfersPage({ params, searchParams }: TeamTransfersPageProps) {
  const [{ id, slug }, query] = await Promise.all([params, searchParams]);
  const context = await getTeamContext(id, slug);

  if (!context) notFound();

  if (context.shouldRedirect) {
    const redirectQuery = new URLSearchParams();
    if (query.type && query.type !== 'all') redirectQuery.set('type', query.type);
    if (query.page) redirectQuery.set('page', query.page);
    const queryString = redirectQuery.toString();
    permanentRedirect(`${getTransferTeamHref(context.team)}${queryString ? `?${queryString}` : ''}`);
  }

  const currentPage = parseInt(query.page || '1', 10);
  const filters = {
    league: context.team.league_id || undefined,
    team: context.teamId,
    type: query.type !== 'all' ? query.type : undefined,
  };

  const transfersData = await fetchTransfersFullData(filters, Number.isFinite(currentPage) ? currentPage : 1, 20);
  const transferLeagueTeamGroups = await getTransferLeagueTeamGroups();
  const filterLeagueTeamGroups = transferLeagueTeamGroups.map((group) => ({
    leagueId: group.league.id,
    teams: group.teams.map((team) => ({
      id: team.id,
      name_ko: team.name_ko,
      name_en: team.name_en,
      slug: team.slug,
    })),
  }));
  const playerIds = transfersData.transfers.map((transfer) => transfer.player.id).filter(Boolean);
  const teamIds = transfersData.transfers
    .flatMap((transfer) => [
      transfer.transfers[0]?.teams?.in?.id,
      transfer.transfers[0]?.teams?.out?.id,
    ])
    .filter((teamId): teamId is number => Boolean(teamId && teamId > 0));

  const [playerKoreanNames, playerPhotoUrls, teamLogoUrls] = await Promise.all([
    playerIds.length > 0 ? getPlayersKoreanNames(playerIds) : {},
    playerIds.length > 0 ? getPlayerPhotoUrls(playerIds) : {},
    teamIds.length > 0 ? getTeamLogoUrls([...new Set(teamIds)]) : {},
  ]);

  const teamName = context.team.name_ko || context.team.name_en;
  const leagueName = context.league?.name_ko || context.league?.name || '축구 리그';
  const countryName = context.league?.country_ko || context.league?.country || context.team.country_ko || context.team.country_en;
  const teamUrl = getTransferTeamHref(context.team);
  const description = buildTeamTransfersDescription({ countryName, leagueName, teamName, totalCount: transfersData.totalCount });
  const breadcrumbSchema = buildBreadcrumbJsonLd({
    items: [
      { name: '홈', url: '/' },
      { name: '이적시장', url: '/transfers' },
      { name: teamName, url: teamUrl },
    ],
  });
  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `https://4590football.com${teamUrl}#webpage`,
    url: `https://4590football.com${teamUrl}`,
    name: `${teamName} 이적시장`,
    description,
    inLanguage: 'ko-KR',
    isPartOf: {
      '@type': 'WebSite',
      '@id': 'https://4590football.com#website',
      name: '4590 Football',
    },
  };

  return (
    <div className="min-h-screen">
      <DaumWebmasterHints
        title={`${teamName} 이적시장`}
        content={description}
      />
      <script type="application/ld+json" {...jsonLdScriptProps(breadcrumbSchema)} />
      <script type="application/ld+json" {...jsonLdScriptProps(webPageSchema)} />
      <TrackPageVisit id={`transfers-team-${context.teamId}`} slug={context.expectedSlug} name={`${teamName} 이적시장`} />

      <Container>
        <ContainerHeader>
          <div className="flex items-center justify-between w-full">
            <Link
              href="/transfers"
              className="flex items-center space-x-2 text-[13px] text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors group px-2 py-1 rounded outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            prefetch={false}
            >
              <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-bold">이적시장 허브로 돌아가기</span>
            </Link>
            <h1 className="daum-wm-title text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0]">{teamName} 이적시장</h1>
          </div>
        </ContainerHeader>
        <div className="px-4 py-3 bg-white dark:bg-[#1D1D1D]">
          <p className="daum-wm-content text-[13px] text-gray-700 dark:text-gray-300">
            {description}
          </p>
        </div>
      </Container>

      <div className="mt-4">
        <TransfersPageContent
          initialData={transfersData}
          playerKoreanNames={playerKoreanNames}
          playerPhotoUrls={playerPhotoUrls}
          teamLogoUrls={teamLogoUrls}
          currentFilters={filters}
          leagueTeamGroups={filterLeagueTeamGroups}
        />
      </div>

      <div className="mt-4">
        <AdBanner />
      </div>
    </div>
  );
}
