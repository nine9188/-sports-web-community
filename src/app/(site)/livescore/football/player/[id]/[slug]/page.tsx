import { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import PlayerPageClient from '@/domains/livescore/components/football/player/PlayerPageClient';
import { fetchPlayerFullData } from '@/domains/livescore/actions/player/data';
import { isUsablePlayerSlug, resolvePlayerCanonicalSlug } from '@/domains/livescore/actions/player/slug';
import { fetchCachedPlayerShell } from '@/domains/livescore/actions/player/playerShell';
import { buildMetadata } from '@/shared/utils/metadataNew';
import DaumWebmasterHints from '@/shared/components/DaumWebmasterHints';
import { siteConfig } from '@/shared/config';
import {
  SITE_ORGANIZATION_ID,
  SITE_WEBSITE_ID,
  absoluteSiteUrl,
  buildBreadcrumbJsonLd,
  buildJsonLdId,
  isUsableJsonLdImage,
  jsonLdScriptProps,
} from '@/shared/utils/jsonLd';
import { getTeamById } from '@/domains/livescore/actions/teamLeagueData';
import { resolveTeamIndexability } from '@/domains/livescore/actions/seoIndexability';
import { getPlayerKoreanName, getPlayersKoreanNames } from '@/domains/livescore/actions/player/getKoreanName';
import type { PlayerTabType } from '@/domains/livescore/hooks';
import { slugify } from '@/domains/livescore/utils/slugs';
import { getTeamHref } from '@/domains/livescore/utils/entityLinks';
import { getPlayerSeoQuality } from '@/domains/livescore/utils/playerSeoQuality';
import { isNextRedirectError, normalizeRouteSlug } from '@/shared/utils/nextNavigationErrors';
import { buildFootballOgImageUrl } from '@/shared/utils/footballOgImage';
import { getRelatedPosts } from '@/domains/livescore/actions/match/relatedPosts';

/**
 * ============================================
 * 선수 페이지 (서버 컴포넌트)
 * ============================================
 *
 * 클라이언트 사이드 탭 전환 패턴을 사용합니다.
 */

// 선수 메타데이터 생성
export async function generateMetadata({
  params,
  searchParams
}: {
  params: Promise<{ id: string; slug: string }>;
  searchParams: Promise<{ tab?: string; page?: string }>;
}): Promise<Metadata> {
  const [{ id, slug }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const hasQueryState = Boolean(resolvedSearchParams?.tab || resolvedSearchParams?.page);

  if (!isUsablePlayerSlug(slug)) {
    return buildMissingPlayerMetadata(id);
  }

  // metadata는 전체 탭 로더가 아니라 선수 기본 데이터만 조회한다.
  const shellResult = await fetchCachedPlayerShell(id);

  if (shellResult.status !== 'found') {
    return buildMissingPlayerMetadata(id);
  }

  const player = shellResult.shell;

  // 한글 매핑 (서버 액션으로 DB 조회)
  const playerName = player.name_ko || player.name;
  const mappedTeam = player.team?.id ? await getSafeTeamById(player.team.id) : null;
  const currentTeam = mappedTeam?.name_ko || player.team?.name_ko || player.team?.name || '';
  const currentTeamEn = mappedTeam?.name_en || player.team?.name_en || '';
  const position = getKoreanPosition(player.position);
  const leagueName = player.league?.name || '';
  const playerEnglishName = player.name_en && player.name_en !== playerName ? player.name_en : '';
  const playerPhotoUrl = player.photo || '';
  const playerImage = playerPhotoUrl && !playerPhotoUrl.includes('placeholder') ? playerPhotoUrl : undefined;
  const profileParts = [
    player.nationality,
    currentTeam,
    leagueName,
    position,
    player.age ? `${player.age}세` : '',
    player.number ? `등번호 ${player.number}` : '',
  ].filter(Boolean);
  const description = `${playerName}${profileParts.length ? ` (${profileParts.join(', ')})` : ''} 선수 프로필입니다. 시즌 출전 기록, 득점, 도움, 평점, 순위, 부상, 트로피, 경기 일정과 이적 정보를 4590 Football에서 확인하세요.`;
  const ogImage = buildFootballOgImageUrl({
    title: playerName,
    subtitle: profileParts.slice(0, 4).join(' · '),
    label: leagueName || '선수 정보',
    leftImage: playerImage,
  });
  const { shouldNoindex } = await resolveTeamIndexability({
    teamId: player.team?.id || null,
    leagueId: mappedTeam?.league_id || player.league?.id || null,
    hasQueryState,
  });

  return buildMetadata({
    title: `${playerName} 통계·기록·순위·부상·트로피·이적${currentTeam ? ` - ${currentTeam}` : ''}`,
    description,
    path: `/livescore/football/player/${id}/${slug || slugify(player.name) || 'player'}`,
    image: ogImage,
    imageWidth: 1200,
    imageHeight: 630,
    keywords: [
      `${playerName} 프로필`,
      `${playerName} 통계`,
      `${playerName} 기록`,
      `${playerName} 순위`,
      `${playerName} 평점`,
      `${playerName} 골`,
      `${playerName} 도움`,
      `${playerName} 경기 일정`,
      `${playerName} 부상`,
      `${playerName} 트로피`,
      `${playerName} 이적`,
      `${playerName} 소속팀`,
      ...(position ? [`${playerName} ${position}`] : []),
      ...(currentTeam ? [
        `${currentTeam} ${playerName}`,
        `${currentTeam} ${playerName} 통계`,
        `${currentTeam} ${playerName} 기록`,
        `${currentTeam} ${playerName} 이적`,
      ] : []),
      ...(currentTeamEn && currentTeamEn !== currentTeam ? [`${currentTeamEn} ${playerName}`] : []),
      ...(playerEnglishName ? [
        playerEnglishName,
        `${playerEnglishName} stats`,
        `${playerEnglishName} transfer`,
        ...(currentTeamEn ? [`${currentTeamEn} ${playerEnglishName}`] : []),
      ] : []),
      '축구 선수 통계',
      '축구 선수 기록',
      '축구 선수 이적',
      '4590',
      '4590football',
    ],
    includeSiteKeywords: false,
    includeDefaultOgFallbacks: false,
    ...(shouldNoindex ? { robots: { index: false, follow: true } } : {}),
  });
}

function getKoreanPosition(position?: string | null): string {
  if (!position) return '';
  const normalized = position.toLowerCase();
  if (normalized.includes('goalkeeper')) return '골키퍼';
  if (normalized.includes('defender')) return '수비수';
  if (normalized.includes('midfielder')) return '미드필더';
  if (normalized.includes('attacker')) return '공격수';
  return position;
}

// 유효한 탭 목록
const VALID_TABS: PlayerTabType[] = ['stats', 'fixtures', 'trophies', 'transfers', 'injuries', 'rankings'];

function buildPlayerDetailQuery(tab: PlayerTabType, page?: string): string {
  const params = new URLSearchParams();
  if (tab !== 'stats') params.set('tab', tab);

  const pageNumber = Number.parseInt(page || '1', 10);
  if (tab === 'fixtures' && Number.isFinite(pageNumber) && pageNumber > 1) {
    params.set('page', String(pageNumber));
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

function buildMissingPlayerMetadata(id: string): Promise<Metadata> {
  return buildMetadata({
    title: '선수 정보를 찾을 수 없습니다',
    description: '요청하신 선수 정보가 존재하지 않습니다.',
    path: `/livescore/football/player/${id}`,
    noindex: true,
  });
}

async function getSafePlayerKoreanName(playerId: number): Promise<string | null> {
  try {
    return await getPlayerKoreanName(playerId);
  } catch (error) {
    console.error(`[PlayerPage] Korean name lookup failed - playerId: ${playerId}`, error);
    return null;
  }
}

async function getSafePlayersKoreanNames(playerIds: number[]): Promise<Record<number, string | null>> {
  try {
    return await getPlayersKoreanNames(playerIds);
  } catch (error) {
    console.error('[PlayerPage] Ranking Korean names lookup failed:', error);
    return {};
  }
}

async function getSafeTeamById(teamId: number) {
  try {
    return await getTeamById(teamId);
  } catch (error) {
    console.error(`[PlayerPage] Team lookup failed - teamId: ${teamId}`, error);
    return null;
  }
}

function isNextNotFoundError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'digest' in error &&
    typeof error.digest === 'string' &&
    error.digest.includes('NEXT_HTTP_ERROR_FALLBACK;404')
  );
}

/** 선수 데이터 로딩 + 렌더링 async 서버 컴포넌트 */
async function PlayerPageContent({ playerId, slug, tab, page }: { playerId: string; slug: string; tab: string; page?: string }) {
  try {
    const canonicalSlug = await resolvePlayerCanonicalSlug(playerId);

    const initialTab: PlayerTabType = VALID_TABS.includes(tab as PlayerTabType)
      ? (tab as PlayerTabType)
      : 'stats';

    if (canonicalSlug && normalizeRouteSlug(slug) !== normalizeRouteSlug(canonicalSlug)) {
      permanentRedirect(
        `/livescore/football/player/${playerId}/${encodeURIComponent(canonicalSlug)}${buildPlayerDetailQuery(initialTab, page)}`
      );
    }

    const fixturePage = initialTab === 'fixtures'
      ? Math.max(1, Number.parseInt(page || '1', 10) || 1)
      : 1;

    // 현재 URL 탭에 필요한 데이터만 서버에서 준비합니다.
    // 탭 이동은 App Router navigation으로 다시 서버를 실행합니다.
    const initialData = await fetchPlayerFullData(playerId, {
      fetchSeasons: false,
      fetchStats: initialTab === 'stats',
      fetchFixtures: initialTab === 'fixtures',
      fixtureLimit: 15,
      fixtureOffset: (fixturePage - 1) * 15,
      fetchTrophies: initialTab === 'trophies',
      fetchTransfers: initialTab === 'transfers',
      fetchInjuries: initialTab === 'injuries',
      fetchRankings: initialTab === 'rankings',
    });

    // 데이터 로드 실패 시 에러 페이지 표시 (404 대신)
    if (!initialData.success) {
      console.error(`[PlayerPage] Player data load failed - playerId: ${playerId}, message: ${initialData.message}`);
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              선수 정보를 불러올 수 없습니다
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {initialData.message || '잠시 후 다시 시도해주세요.'}
            </p>
            <a
              href="/livescore/football"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              라이브스코어로 돌아가기
            </a>
          </div>
        </div>
      );
    }

    if (getPlayerSeoQuality(initialData.playerData) === 'worthless') {
      return notFound();
    }

    // 선수 한글명 조회 (DB)
    const playerNumericId = parseInt(playerId, 10);
    const initialPlayerName = initialData.playerData?.info?.name || null;
    const playerKoreanName = !isNaN(playerNumericId)
      ? await getSafePlayerKoreanName(playerNumericId)
      : initialPlayerName;

    // Rankings 데이터에서 선수 ID 추출 및 한글명 일괄 조회
    const rankingsPlayerIds: Set<number> = new Set();
    const rankings = initialData.rankings;
    if (rankings) {
      const rankingLists = [
        rankings.topScorers,
        rankings.topAssists,
        rankings.mostGamesScored,
        rankings.leastPlayTime,
        rankings.topRedCards,
        rankings.topYellowCards,
      ];
      rankingLists.forEach(list => {
        list?.forEach((p: { player?: { id?: number } }) => {
          if (p.player?.id) rankingsPlayerIds.add(p.player.id);
        });
      });
    }
    const rankingsKoreanNames = rankingsPlayerIds.size > 0
      ? await getSafePlayersKoreanNames(Array.from(rankingsPlayerIds))
      : {};

    // Person JSON-LD 생성
    const playerInfo = initialData.playerData?.info;
    const playerStats = initialData.playerData?.statistics;
    const currentTeam = playerStats?.[0]?.team;
    const relatedPosts = !Number.isNaN(playerNumericId)
      ? await getRelatedPosts({
          playerIds: [playerNumericId],
          teamIds: currentTeam?.id ? [currentTeam.id] : [],
          limit: 30,
        })
      : [];
    const currentTeamMapping = currentTeam?.id
      ? await getSafeTeamById(currentTeam.id)
      : null;
    const playerDisplayName = playerKoreanName || playerInfo?.name || '';
    const playerSlug = canonicalSlug || slug;
    const playerUrl = `${siteConfig.url}/livescore/football/player/${playerId}/${playerSlug}`;
    const teamDisplayName = currentTeamMapping?.name_ko || currentTeam?.name || '';
    const teamUrl = currentTeam?.id && currentTeam?.name
      ? `${siteConfig.url}${getTeamHref({
          ...currentTeam,
          slug: currentTeamMapping?.slug,
          name_en: currentTeamMapping?.name_en,
          name_ko: currentTeamMapping?.name_ko,
        })}`
      : undefined;
    const playerPhotoUrl = initialData.playerPhotoUrl || playerInfo?.photo;
    const playerPhotoJsonLdUrl = isUsableJsonLdImage(playerPhotoUrl)
      ? absoluteSiteUrl(playerPhotoUrl)
      : undefined;
    const teamLogoUrl = currentTeam?.id
      ? initialData.teamLogoUrl || initialData.statisticsTeamLogoUrls?.[currentTeam.id] || currentTeam.logo
      : undefined;
    const teamLogoJsonLdUrl = isUsableJsonLdImage(teamLogoUrl)
      ? absoluteSiteUrl(teamLogoUrl)
      : undefined;
    const currentPosition = playerStats?.[0]?.games?.position;
    const daumContent = [
      `${playerDisplayName || playerInfo?.name || '선수'} 축구 선수 프로필`,
      teamDisplayName ? `소속팀 ${teamDisplayName}` : '',
      currentPosition ? `포지션 ${currentPosition}` : '',
      playerInfo?.nationality ? `국적 ${playerInfo.nationality}` : '',
      '시즌 통계, 경기 기록, 이적, 부상, 트로피 정보를 확인하세요.',
    ].filter(Boolean).join('. ');
    const personSchema = playerInfo ? {
      '@context': 'https://schema.org',
      '@type': 'Person',
      '@id': buildJsonLdId(playerUrl, 'person'),
      name: playerDisplayName || playerInfo.name,
      url: playerUrl,
      isPartOf: { '@id': SITE_WEBSITE_ID },
      publisher: { '@id': SITE_ORGANIZATION_ID },
      ...(playerInfo.nationality ? { nationality: { '@type': 'Country', name: playerInfo.nationality } } : {}),
      ...(playerInfo.birth?.date ? { birthDate: playerInfo.birth.date } : {}),
      ...(playerInfo.height ? { height: playerInfo.height } : {}),
      ...(playerInfo.weight ? { weight: playerInfo.weight } : {}),
      ...(playerPhotoJsonLdUrl ? { image: playerPhotoJsonLdUrl } : {}),
      jobTitle: '축구 선수',
      ...(currentPosition ? { athletePosition: currentPosition } : {}),
      ...(currentTeam && teamUrl ? {
        memberOf: {
          '@type': 'SportsTeam',
          '@id': buildJsonLdId(teamUrl, 'sports-team'),
          name: teamDisplayName || currentTeam.name,
          url: teamUrl,
          sport: 'Football',
          ...(teamLogoJsonLdUrl ? { logo: teamLogoJsonLdUrl } : {}),
        },
        affiliation: {
          '@type': 'SportsTeam',
          '@id': buildJsonLdId(teamUrl, 'sports-team'),
          name: teamDisplayName || currentTeam.name,
          url: teamUrl,
        },
      } : {}),
    } : null;

    // BreadcrumbList JSON-LD
    const breadcrumbSchema = buildBreadcrumbJsonLd({
      items: [
        { name: '홈', url: '/' },
        { name: '라이브스코어', url: '/livescore/football' },
        ...(currentTeam?.id && teamDisplayName && teamUrl ? [{ name: teamDisplayName, url: teamUrl }] : []),
        { name: playerDisplayName, url: playerUrl },
      ],
    });

    // 클라이언트 컴포넌트에 데이터 전달
    return (
      <>
        <DaumWebmasterHints
          title={`${playerDisplayName || playerInfo?.name || '선수'} - 선수 프로필`}
          content={daumContent}
        />
        {personSchema && (
          <script
            type="application/ld+json"
            {...jsonLdScriptProps(personSchema)}
          />
        )}
        <script
          type="application/ld+json"
          {...jsonLdScriptProps(breadcrumbSchema)}
        />
        <PlayerPageClient
          playerId={playerId}
          initialTab={initialTab}
          initialData={initialData}
          playerKoreanName={playerKoreanName}
          rankingsKoreanNames={rankingsKoreanNames}
          initialPage={fixturePage}
          relatedPosts={relatedPosts}
        />
      </>
    );
  } catch (error) {
    if (isNextRedirectError(error) || isNextNotFoundError(error)) {
      throw error;
    }

    console.error('플레이어 페이지 로딩 오류:', error);
    throw error;
  }
}

export default async function PlayerPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string; slug: string }>;
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const { id: playerId, slug } = await params;
  const { tab = 'stats', page } = await searchParams;

  return await PlayerPageContent({ playerId, slug, tab, page });
}
