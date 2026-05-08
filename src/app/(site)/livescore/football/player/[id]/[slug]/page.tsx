import { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import PlayerPageClient from '@/domains/livescore/components/football/player/PlayerPageClient';
import { fetchPlayerFullData } from '@/domains/livescore/actions/player/data';
import { resolvePlayerCanonicalSlug } from '@/domains/livescore/actions/player/slug';
import { buildMetadata } from '@/shared/utils/metadataNew';
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
import { getPlayerKoreanName, getPlayersKoreanNames } from '@/domains/livescore/actions/player/getKoreanName';
import type { PlayerTabType } from '@/domains/livescore/hooks';
import { getTeamSlugFromName, slugify } from '@/domains/livescore/utils/slugs';
import { getPlayerSeoQuality } from '@/domains/livescore/utils/playerSeoQuality';

/**
 * ============================================
 * 선수 페이지 (서버 컴포넌트)
 * ============================================
 *
 * 클라이언트 사이드 탭 전환 패턴을 사용합니다.
 */

// 선수 메타데이터 생성
export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string; slug: string }>
}): Promise<Metadata> {
  const { id, slug } = await params;

  if (isFallbackPlayerSlug(id, slug)) {
    return buildMissingPlayerMetadata(id);
  }

  // 선수 데이터 조회 (최소한의 옵션으로)
  const playerData = await fetchPlayerFullData(id, {
    fetchSeasons: false,
    fetchStats: false,
    fetchFixtures: false,
    fetchTrophies: false,
    fetchTransfers: false,
    fetchInjuries: false,
    fetchRankings: false,
  });

  if (!playerData.success || !playerData.playerData?.info) {
    return buildMissingPlayerMetadata(id);
  }

  if (getPlayerSeoQuality(playerData.playerData) === 'worthless') {
    return buildMissingPlayerMetadata(id);
  }

  const player = playerData.playerData.info;
  const statistics = playerData.playerData.statistics;

  // 한글 매핑 (서버 액션으로 DB 조회)
  const playerName = await getSafePlayerKoreanName(player.id) || player.name;
  const teamId = statistics?.[0]?.team?.id;
  const teamMapping = teamId ? await getSafeTeamById(teamId) : null;
  const currentTeam = teamMapping?.name_ko || statistics?.[0]?.team?.name || '';
  const position = statistics?.[0]?.games?.position || '';
  const playerPhotoUrl = playerData.playerPhotoUrl || player.photo;
  const ogImage = playerPhotoUrl && !playerPhotoUrl.includes('placeholder') ? playerPhotoUrl : undefined;

  const description = `${playerName}${player.nationality ? ` (${player.nationality})` : ''}${currentTeam ? ` - ${currentTeam}` : ''}${position ? ` ${position}` : ''}. 시즌 통계, 경기 기록, 이적 정보를 확인하세요. 축구 커뮤니티 4590 Football.`;

  return buildMetadata({
    title: `${playerName} - 통계·기록·프로필`,
    description,
    path: `/livescore/football/player/${id}/${slug || slugify(player.name) || 'player'}`,
    image: ogImage,
    imageWidth: ogImage ? 128 : undefined,
    imageHeight: ogImage ? 128 : undefined,
    keywords: [`${playerName} 평점`, `${playerName} 통계`, `${playerName} 골`, `${playerName} 이적`, ...(currentTeam ? [`${currentTeam} 선수`] : []), '축구 커뮤니티', '4590', '4590football'],
  });
}

// 유효한 탭 목록
const VALID_TABS: PlayerTabType[] = ['stats', 'fixtures', 'trophies', 'transfers', 'injuries', 'rankings'];

function isFallbackPlayerSlug(id: string, slug?: string | null): boolean {
  const normalizedSlug = String(slug ?? '').trim().toLowerCase();
  const normalizedId = String(id ?? '').trim().toLowerCase();

  return (
    !normalizedSlug ||
    normalizedSlug === 'player' ||
    normalizedSlug === normalizedId ||
    normalizedSlug === `player-${normalizedId}`
  );
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
async function PlayerPageContent({ playerId, slug, tab }: { playerId: string; slug: string; tab: string }) {
  try {
    if (isFallbackPlayerSlug(playerId, slug)) {
      const canonicalSlug = await resolvePlayerCanonicalSlug(playerId);
      if (canonicalSlug) {
        const tabParam = tab && tab !== 'stats' ? `?tab=${tab}` : '';
        permanentRedirect(`/livescore/football/player/${playerId}/${canonicalSlug}${tabParam}`);
      }

      return notFound();
    }

    // 유효한 탭인지 확인
    const initialTab = VALID_TABS.includes(tab as PlayerTabType)
      ? (tab as PlayerTabType)
      : 'stats';

    // 현재 탭 데이터만 SSR (나머지 탭은 클라이언트에서 on-demand 로드)
    const initialData = await fetchPlayerFullData(playerId, {
      fetchSeasons: false,
      fetchStats: initialTab === 'stats',
      fetchFixtures: initialTab === 'fixtures',
      fixtureLimit: 15,
      fixtureOffset: 0,
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
    const currentTeamMapping = currentTeam?.id
      ? await getSafeTeamById(currentTeam.id)
      : null;
    const playerDisplayName = playerKoreanName || playerInfo?.name || '';
    const playerSlug = slug || (playerInfo?.name ? slugify(playerInfo.name) : '') || 'player';
    const playerUrl = `${siteConfig.url}/livescore/football/player/${playerId}/${playerSlug}`;
    const teamDisplayName = currentTeamMapping?.name_ko || currentTeam?.name || '';
    const teamSlugSource = currentTeamMapping?.name_en || currentTeam?.name || '';
    const teamUrl = currentTeam?.id && currentTeam?.name
      ? `${siteConfig.url}/livescore/football/team/${currentTeam.id}/${getTeamSlugFromName(teamSlugSource) || 'team'}`
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
          prefetchEnabled
        />
      </>
    );
  } catch (error) {
    if (isNextNotFoundError(error)) {
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
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id: playerId, slug } = await params;
  const { tab = 'stats' } = await searchParams;

  return await PlayerPageContent({ playerId, slug, tab });
}
