import { Suspense } from 'react';
import { Metadata } from 'next';
import { fetchCachedMatchFullData, MatchFullDataResponse } from '@/domains/livescore/actions/match/matchData';
import { getCachedSidebarData } from '@/domains/livescore/actions/match/sidebarData';
import { getCachedPowerData } from '@/domains/livescore/actions/match/headtohead';
import { fetchAllPlayerStats } from '@/domains/livescore/actions/match/playerStats';
import type { AllPlayerStatsResponse } from '@/domains/livescore/types/lineup';
import { getMatchCache, getMatchCacheBulk, setMatchCache } from '@/domains/livescore/actions/match/matchCache';
import MatchPageClient, { MatchTabType } from '@/domains/livescore/components/football/match/MatchPageClient';
import { notFound } from 'next/navigation';
import { buildMetadata } from '@/shared/utils/metadataNew';
import { siteConfig } from '@/shared/config';
import { getTeamById } from '@/domains/livescore/constants/teams';
import { getLeagueById } from '@/domains/livescore/constants/league-mappings';
import { getPlayersKoreanNames } from '@/domains/livescore/actions/player/getKoreanName';
import { getMatchHighlight } from '@/domains/livescore/actions/highlights/getMatchHighlight';
import type { HeadToHeadTestData } from '@/domains/livescore/actions/match/headtohead';

// matchData에서 모든 선수 ID 추출
function extractPlayerIds(matchData: MatchFullDataResponse): number[] {
  const playerIds: Set<number> = new Set();

  // lineups에서 선수 ID 추출
  if (matchData.lineups?.response) {
    const { home, away } = matchData.lineups.response;

    // 홈팀 선발 + 교체
    home?.startXI?.forEach(p => p.player?.id && playerIds.add(p.player.id));
    home?.substitutes?.forEach(p => p.player?.id && playerIds.add(p.player.id));

    // 원정팀 선발 + 교체
    away?.startXI?.forEach(p => p.player?.id && playerIds.add(p.player.id));
    away?.substitutes?.forEach(p => p.player?.id && playerIds.add(p.player.id));
  }

  // events에서 선수 ID 추출
  if (matchData.events) {
    matchData.events.forEach(event => {
      if (event.player?.id) playerIds.add(event.player.id);
      if (event.assist?.id) playerIds.add(event.assist.id);
    });
  }

  // match 정보에서 득점자 ID 추출
  if (matchData.match?.goals) {
    // goals 객체에 선수 정보가 있을 수 있음
  }

  return Array.from(playerIds);
}

// 유효한 탭 목록
const VALID_TABS: MatchTabType[] = ['power', 'events', 'lineups', 'stats', 'standings', 'support'];
const DEFAULT_TAB: MatchTabType = 'power';

// 경기 메타데이터 생성
export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params;

  // 경기 데이터 조회 (최소한의 옵션으로)
  const matchData = await fetchCachedMatchFullData(id, {
    fetchEvents: false,
    fetchLineups: false,
    fetchStats: false,
    fetchStandings: false,
  });

  if (!matchData.success || !matchData.match) {
    return buildMetadata({
      title: '경기 정보를 찾을 수 없습니다',
      description: '요청하신 경기 정보가 존재하지 않습니다.',
      path: `/livescore/football/match/${id}`,
      noindex: true,
    });
  }

  const { match } = matchData;

  // 매핑 파일에서 한글 이름 조회
  const homeTeamMapping = getTeamById(match.teams.home.id);
  const awayTeamMapping = getTeamById(match.teams.away.id);
  const leagueMapping = getLeagueById(match.league.id);
  const homeTeam = homeTeamMapping?.name_ko || match.teams.home.name;
  const awayTeam = awayTeamMapping?.name_ko || match.teams.away.name;
  const leagueName = leagueMapping?.nameKo || match.league.name;

  // 스코어 표시 (경기 시작 전이면 'vs', 아니면 실제 스코어)
  const isNotStarted = ['TBD', 'NS'].includes(match.status.code);
  const score = isNotStarted ? 'vs' : `${match.goals.home} - ${match.goals.away}`;

  const title = `${homeTeam} ${score} ${awayTeam} - ${leagueName}`;
  const description = `${leagueName} ${homeTeam} vs ${awayTeam} 경기 라인업, 통계, 하이라이트를 확인하세요. 축구 커뮤니티 4590 Football.`;

  return buildMetadata({
    title,
    description,
    path: `/livescore/football/match/${id}`,
    keywords: [`${homeTeam} ${awayTeam}`, `${homeTeam} 라인업`, `${awayTeam} 라인업`, `${leagueName} 경기결과`, '실시간 스코어', '축구 커뮤니티'],
  });
}


/**
 * ============================================
 * Suspense 스트리밍 패턴 (메인 페이지와 동일)
 * ============================================
 *
 * 1. page.tsx에서 matchData만 await (헤더 + JSON-LD용)
 * 2. 나머지(sidebar, power, playerStats, 한글명, 하이라이트)는
 *    별도 async 서버 컴포넌트(MatchContentLoader)에서 병렬 처리
 * 3. Suspense fallback으로 스켈레톤 즉시 표시
 * 4. MatchContentLoader 준비되면 스트리밍으로 교체
 */

// 매치 컨텐츠 스켈레톤 (Suspense fallback)
function MatchContentSkeleton() {
  return (
    <div className="flex gap-4">
      <div className="flex-1 min-w-0">
        {/* 탭 네비게이션 스켈레톤 */}
        <div className="bg-white dark:bg-[#1D1D1D] rounded-lg shadow-sm mb-4 animate-pulse">
          <div className="flex gap-1 p-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 flex-1 bg-[#F5F5F5] dark:bg-[#262626] rounded" />
            ))}
          </div>
        </div>
        {/* 콘텐츠 영역 스켈레톤 */}
        <div className="bg-white dark:bg-[#1D1D1D] rounded-lg shadow-sm p-4 animate-pulse">
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 bg-[#F5F5F5] dark:bg-[#262626] rounded" />
            ))}
          </div>
        </div>
      </div>
      {/* 사이드바 스켈레톤 */}
      <aside className="hidden xl:block w-[300px] shrink-0 space-y-4">
        <div className="bg-white dark:bg-[#1D1D1D] rounded-lg shadow-sm p-4 animate-pulse">
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 bg-[#F5F5F5] dark:bg-[#262626] rounded" />
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

/**
 * 별도 async 서버 컴포넌트 — Suspense 스트리밍용
 * 무거운 데이터(sidebar, power, playerStats, 한글명, 하이라이트)를 병렬로 로드
 * page.tsx와 분리되어 있으므로 쿠키 충돌 없음
 */
async function MatchContentLoader({
  matchId,
  matchData,
  initialTab,
}: {
  matchId: string;
  matchData: MatchFullDataResponse;
  initialTab: MatchTabType;
}) {
  const homeTeamId = matchData.homeTeam?.id;
  const awayTeamId = matchData.awayTeam?.id;
  const numericMatchId = parseInt(matchId, 10);
  const statusCode = matchData.match?.status?.code ?? '';
  const finishedCodes = ['FT', 'AET', 'PEN'];
  const isFinished = finishedCodes.includes(statusCode);
  const playerIds = extractPlayerIds(matchData);
  const leagueId = matchData.match?.league?.id;

  // 종료 경기: matchPlayerStats + power DB 캐시 먼저 확인
  let cachedPlayerStats: AllPlayerStatsResponse | null = null;
  let cachedPower: HeadToHeadTestData | null = null;

  if (isFinished) {
    const [cachedExtra, cachedPowerData] = await Promise.all([
      getMatchCacheBulk(numericMatchId, ['matchPlayerStats']),
      getMatchCache(numericMatchId, 'power'),
    ]);

    if (cachedExtra['matchPlayerStats']) {
      const cached = cachedExtra['matchPlayerStats'] as Record<string, unknown>;
      if ('allPlayersData' in cached && Array.isArray(cached.allPlayersData)) {
        cachedPlayerStats = cached as AllPlayerStatsResponse;
      }
    }

    if (cachedPowerData) {
      cachedPower = cachedPowerData as HeadToHeadTestData;
    }
  }

  // 나머지 전부 병렬 호출
  const [sidebarDataResult, powerDataResult, playerStatsResult, playerKoreanNames, highlightData] = await Promise.all([
    getCachedSidebarData(matchId),
    cachedPower
      ? Promise.resolve({ success: true, data: cachedPower })
      : (homeTeamId && awayTeamId)
        ? getCachedPowerData(homeTeamId, awayTeamId, 5)
        : Promise.resolve({ success: false, data: undefined }),
    cachedPlayerStats
      ? Promise.resolve(cachedPlayerStats)
      : fetchAllPlayerStats(matchId, matchData.match?.status?.code).then(r => {
          if (isFinished) setMatchCache(numericMatchId, 'matchPlayerStats', r, statusCode).catch(() => {});
          return r;
        }),
    getPlayersKoreanNames(playerIds),
    isFinished && homeTeamId && awayTeamId && leagueId
      ? getMatchHighlight(numericMatchId, homeTeamId, awayTeamId, leagueId, matchData.match?.fixture?.date).catch(() => null)
      : Promise.resolve(null),
  ]);

  const sidebarData = sidebarDataResult.success ? sidebarDataResult.data : null;
  const powerResult = powerDataResult as { success?: boolean; data?: unknown };
  const powerData = powerResult.success ? powerResult.data : undefined;

  // 종료 경기: 전력 데이터 캐시 저장 (DB 캐시 미스였을 때만)
  if (isFinished && !cachedPower && powerResult.success && powerResult.data) {
    setMatchCache(numericMatchId, 'power', powerResult.data, statusCode).catch(() => {});
  }

  return (
    <MatchPageClient
      matchId={matchId}
      initialTab={initialTab}
      playerKoreanNames={playerKoreanNames}
      initialData={matchData}
      initialPowerData={powerData}
      allPlayerStats={playerStatsResult}
      sidebarData={sidebarData}
      highlightData={highlightData}
    />
  );
}

export default async function MatchPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>,
  searchParams: Promise<{ tab?: string }>
}) {
  try {
    const { id: matchId } = await params;
    const { tab } = await searchParams;

    const initialTab: MatchTabType = tab && VALID_TABS.includes(tab as MatchTabType)
      ? (tab as MatchTabType)
      : DEFAULT_TAB;

    // Stage 1: 경기 기본 데이터만 await (헤더 + JSON-LD 표시용)
    const matchData = await fetchCachedMatchFullData(matchId, {
      fetchEvents: true,
      fetchLineups: true,
      fetchStats: true,
      fetchStandings: true,
    });

    if (!matchData.success) {
      return notFound();
    }

    // JSON-LD 생성 (SEO)
    const match = matchData.match;
    const rawData = matchData.matchData as Record<string, unknown> | undefined;
    const rawFixture = rawData?.fixture as { venue?: { name?: string; city?: string } } | undefined;
    const venueName = rawFixture?.venue?.name;
    const venueCity = rawFixture?.venue?.city;
    const statusCode = match?.status?.code ?? '';

    const homeTeamMapping = match ? getTeamById(match.teams.home.id) : null;
    const awayTeamMapping = match ? getTeamById(match.teams.away.id) : null;
    const leagueMapping = match ? getLeagueById(match.league.id) : null;
    const homeTeamName = homeTeamMapping?.name_ko || match?.teams.home.name || '';
    const awayTeamName = awayTeamMapping?.name_ko || match?.teams.away.name || '';
    const leagueName = leagueMapping?.nameKo || match?.league.name || '';

    const eventStatus = ['CANC', 'ABD'].includes(statusCode)
        ? 'https://schema.org/EventCancelled'
        : ['PST', 'SUSP'].includes(statusCode)
          ? 'https://schema.org/EventPostponed'
          : 'https://schema.org/EventScheduled';

    const matchStartDate = match?.time?.date;
    const matchEndDate = matchStartDate
      ? new Date(new Date(matchStartDate).getTime() + 2 * 60 * 60 * 1000).toISOString()
      : undefined;
    const matchUrl = `${siteConfig.url}/livescore/football/match/${matchId}`;

    const sportsEventSchema = match ? {
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      name: `${homeTeamName} vs ${awayTeamName}`,
      url: matchUrl,
      startDate: matchStartDate,
      ...(matchEndDate && { endDate: matchEndDate }),
      description: `${leagueName} - ${homeTeamName} vs ${awayTeamName}`,
      image: `${siteConfig.url}/og-image.png`,
      eventStatus,
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: {
        '@type': 'Place',
        name: venueName || homeTeamName + ' 홈구장',
        ...(venueCity && {
          address: {
            '@type': 'PostalAddress',
            addressLocality: venueCity,
          },
        }),
      },
      performer: [
        { '@type': 'SportsTeam', name: homeTeamName },
        { '@type': 'SportsTeam', name: awayTeamName },
      ],
      homeTeam: { '@type': 'SportsTeam', name: homeTeamName },
      awayTeam: { '@type': 'SportsTeam', name: awayTeamName },
      organizer: {
        '@type': 'SportsOrganization',
        name: leagueName,
        ...(match.league?.id && {
          url: `${siteConfig.url}/livescore/football/leagues/${match.league.id}`,
        }),
      },
      offers: {
        '@type': 'Offer',
        url: matchUrl,
        price: '0',
        priceCurrency: 'KRW',
        availability: 'https://schema.org/InStock',
        validFrom: matchStartDate,
      },
    } : null;

    return (
      <div className="container">
        {sportsEventSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(sportsEventSchema) }}
          />
        )}
        {/* Suspense 스트리밍: matchData 즉시 전달, 나머지는 MatchContentLoader에서 병렬 로드 */}
        <Suspense fallback={<MatchContentSkeleton />}>
          <MatchContentLoader
            matchId={matchId}
            matchData={matchData}
            initialTab={initialTab}
          />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error('매치 페이지 로딩 오류:', error);
    return (
      <div className="container py-8">
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-red-500">경기 정보를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }
}
