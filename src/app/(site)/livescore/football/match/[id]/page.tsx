import { Metadata } from 'next';
import { fetchCachedMatchFullData, MatchFullDataResponse } from '@/domains/livescore/actions/match/matchData';
import { getCachedSidebarData } from '@/domains/livescore/actions/match/sidebarData';
import { getCachedPowerData } from '@/domains/livescore/actions/match/headtohead';
import { fetchAllPlayerStats } from '@/domains/livescore/actions/match/playerStats';
import type { AllPlayerStatsResponse } from '@/domains/livescore/types/lineup';
import { getMatchCacheBulk, setMatchCache } from '@/domains/livescore/actions/match/matchCache';
import MatchPageClient, { MatchTabType } from '@/domains/livescore/components/football/match/MatchPageClient';
import { notFound } from 'next/navigation';
import { buildMetadata } from '@/shared/utils/metadataNew';
import { siteConfig } from '@/shared/config';
import { getTeamById } from '@/domains/livescore/constants/teams';
import { getLeagueById } from '@/domains/livescore/constants/league-mappings';
import { getPlayersKoreanNames } from '@/domains/livescore/actions/player/getKoreanName';
import { getMatchHighlight } from '@/domains/livescore/actions/highlights/getMatchHighlight';

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
  const description = `${leagueName} - ${homeTeam} vs ${awayTeam} 경기 정보, 라인업, 통계, 하이라이트를 확인하세요.`;

  return buildMetadata({
    title,
    description,
    path: `/livescore/football/match/${id}`,
  });
}


/**
 * ============================================
 * 서버 컴포넌트 + 클라이언트 탭 전환 패턴
 * ============================================
 *
 * Player, Team 페이지와 동일한 패턴 적용
 *
 * ## 핵심 원리
 *
 * 1. **서버 컴포넌트 (이 파일)**
 *    - 모든 탭 데이터를 미리 로드
 *    - URL에서 초기 탭 결정
 *    - 클라이언트 컴포넌트에 데이터 전달
 *
 * 2. **클라이언트 래퍼 (MatchPageClient)**
 *    - useState로 현재 탭 상태 관리
 *    - 탭 변경 시 shallow URL 업데이트 (페이지 리로드 없음)
 *    - 초기 데이터로 즉시 렌더링
 */
export default async function MatchPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>,
  searchParams: Promise<{ tab?: string }>
}) {
  try {
    // URL에서 ID 및 탭 가져오기
    const { id: matchId } = await params;
    const { tab } = await searchParams;

    // 탭 유효성 검증 후 초기 탭 결정
    const initialTab: MatchTabType = tab && VALID_TABS.includes(tab as MatchTabType)
      ? (tab as MatchTabType)
      : DEFAULT_TAB;

    // 모든 탭 데이터를 서버에서 프리로드
    const matchData = await fetchCachedMatchFullData(matchId, {
      fetchEvents: true,
      fetchLineups: true,
      fetchStats: true,
      fetchStandings: true,
    });

    // 기본 데이터 로드 실패 시 404 페이지
    if (!matchData.success) {
      return notFound();
    }

    // 사이드바 데이터와 power 데이터를 병렬로 미리 로드
    const homeTeamId = matchData.homeTeam?.id;
    const awayTeamId = matchData.awayTeam?.id;
    const numericMatchId = parseInt(matchId, 10);
    const statusCode = matchData.match?.status?.code ?? '';
    const finishedCodes = ['FT', 'AET', 'PEN'];
    const isFinished = finishedCodes.includes(statusCode);

    // 종료 경기: matchPlayerStats만 DB 캐시, power는 fetch cache에 의존
    let powerDataResult: { success: boolean; data?: unknown } = { success: false };
    let allPlayerStatsResult: AllPlayerStatsResponse | null = null;
    let sidebarDataResult: { success: boolean; data?: unknown } = { success: false };

    if (isFinished) {
      // matchPlayerStats DB 캐시 조회 + 사이드바 병렬
      const [cachedExtra, sidebarResult] = await Promise.all([
        getMatchCacheBulk(numericMatchId, ['matchPlayerStats']),
        getCachedSidebarData(matchId),
      ]);
      sidebarDataResult = sidebarResult;

      const hasPlayerStats = !!cachedExtra['matchPlayerStats'];

      if (hasPlayerStats) {
        const cached = cachedExtra['matchPlayerStats'] as Record<string, unknown>;
        if ('allPlayersData' in cached && Array.isArray(cached.allPlayersData)) {
          allPlayerStatsResult = cached as AllPlayerStatsResponse;
        }
      }

      // power(fetch cache) + 캐시 미스 항목 병렬 조회
      const apiPromises: Promise<void>[] = [];

      if (homeTeamId && awayTeamId) {
        apiPromises.push(
          getCachedPowerData(homeTeamId, awayTeamId, 5).then(r => {
            powerDataResult = r;
          })
        );
      }
      if (!allPlayerStatsResult) {
        apiPromises.push(
          fetchAllPlayerStats(matchId, matchData.match?.status?.code).then(r => {
            allPlayerStatsResult = r;
            setMatchCache(numericMatchId, 'matchPlayerStats', r, statusCode).catch(() => {});
          })
        );
      }

      if (apiPromises.length > 0) await Promise.all(apiPromises);
    } else {
      // 비종료 경기: 병렬 호출
      const [sResult, pResult, playerStatsResult] = await Promise.all([
        getCachedSidebarData(matchId),
        (homeTeamId && awayTeamId)
          ? getCachedPowerData(homeTeamId, awayTeamId, 5)
          : Promise.resolve({ success: false, data: undefined }),
        fetchAllPlayerStats(matchId, matchData.match?.status?.code)
      ]);
      sidebarDataResult = sResult;
      powerDataResult = pResult;
      allPlayerStatsResult = playerStatsResult;
    }

    const sidebarData = sidebarDataResult.success ? sidebarDataResult.data : null;
    const powerData = (powerDataResult as { success?: boolean; data?: unknown }).success
      ? (powerDataResult as { data?: unknown }).data
      : undefined;

    // 선수 한글명 일괄 조회 (DB) + 하이라이트 병렬 조회
    const playerIds = extractPlayerIds(matchData);
    const leagueId = matchData.match?.league?.id;

    const [playerKoreanNames, highlightData] = await Promise.all([
      getPlayersKoreanNames(playerIds),
      isFinished && homeTeamId && awayTeamId && leagueId
        ? getMatchHighlight(numericMatchId, homeTeamId, awayTeamId, leagueId, matchData.match?.fixture?.date).catch(() => null)
        : Promise.resolve(null),
    ]);

    // SportsEvent JSON-LD 생성
    const match = matchData.match;
    // matchData.matchData에 원본 API 데이터가 있음 (fixture.venue 포함)
    const rawData = matchData.matchData as Record<string, unknown> | undefined;
    const rawFixture = rawData?.fixture as { venue?: { name?: string; city?: string } } | undefined;
    const venueName = rawFixture?.venue?.name;
    const venueCity = rawFixture?.venue?.city;

    const homeTeamMapping = match ? getTeamById(match.teams.home.id) : null;
    const awayTeamMapping = match ? getTeamById(match.teams.away.id) : null;
    const leagueMapping = match ? getLeagueById(match.league.id) : null;
    const homeTeamName = homeTeamMapping?.name_ko || match?.teams.home.name || '';
    const awayTeamName = awayTeamMapping?.name_ko || match?.teams.away.name || '';
    const leagueName = leagueMapping?.nameKo || match?.league.name || '';

    // eventStatus 결정 (구글은 EventCompleted를 지원하지 않음)
    const eventStatus = ['CANC', 'ABD'].includes(statusCode)
        ? 'https://schema.org/EventCancelled'
        : ['PST', 'SUSP'].includes(statusCode)
          ? 'https://schema.org/EventPostponed'
          : 'https://schema.org/EventScheduled';

    const matchStartDate = match?.time?.date;
    // endDate: startDate + 2시간 (축구 경기 평균 소요 시간)
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
      homeTeam: {
        '@type': 'SportsTeam',
        name: homeTeamName,
      },
      awayTeam: {
        '@type': 'SportsTeam',
        name: awayTeamName,
      },
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
        <MatchPageClient
          matchId={matchId}
          initialTab={initialTab}
          playerKoreanNames={playerKoreanNames}
          initialData={matchData}
          initialPowerData={powerData}
          allPlayerStats={allPlayerStatsResult}
          sidebarData={sidebarData}
          highlightData={highlightData}
        />
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
