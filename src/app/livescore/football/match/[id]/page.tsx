import { Metadata } from 'next';
import { fetchCachedMatchFullData, MatchFullDataResponse } from '@/domains/livescore/actions/match/matchData';
import { getCachedSidebarData } from '@/domains/livescore/actions/match/sidebarData';
import { getCachedPowerData } from '@/domains/livescore/actions/match/headtohead';
import { fetchPlayerRatingsAndCaptains } from '@/domains/livescore/actions/match/playerStats';
import { fetchMatchPlayerStats } from '@/domains/livescore/actions/match/matchPlayerStats';
import { getMatchCacheBulk, setMatchCache } from '@/domains/livescore/actions/match/matchCache';
import MatchPageClient, { MatchTabType } from '@/domains/livescore/components/football/match/MatchPageClient';
import { notFound } from 'next/navigation';
import { buildMetadata } from '@/shared/utils/metadataNew';
import { getTeamById } from '@/domains/livescore/constants/teams';
import { getLeagueById } from '@/domains/livescore/constants/league-mappings';

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

// 캐시 항목 인터페이스
interface CacheEntry {
  data: MatchFullDataResponse;
  timestamp: number;
}

// 글로벌 데이터 캐시 (서버 재시작될 때까지 유지)
const dataCache = new Map<string, CacheEntry>();

// 캐시 유효 시간 (5분)
const CACHE_TTL = 5 * 60 * 1000;

// 캐시 유효성 체크 함수
const isCacheValid = (cacheEntry: CacheEntry | undefined): boolean => {
  if (!cacheEntry) return false;
  return Date.now() - cacheEntry.timestamp < CACHE_TTL;
};

// NOTE: Team/Player 페이지와 동일하게 export 설정 없음
// 탭 전환 시 불필요한 서버 호출 방지
// in-memory 캐시(dataCache)로 데이터 신선도 관리

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

    // 캐시 키 생성 (모든 탭 데이터 로드하므로 탭 파라미터 불필요)
    const cacheKey = `match-${matchId}-all`;

    // 캐시된 데이터 확인
    let matchData;
    const cacheEntry = dataCache.get(cacheKey);

    if (cacheEntry && isCacheValid(cacheEntry)) {
      matchData = cacheEntry.data;
    } else {
      // 모든 탭 데이터를 서버에서 프리로드
      const options = {
        fetchEvents: true,     // events, lineups, 헤더에서 사용
        fetchLineups: true,    // lineups 탭
        fetchStats: true,      // stats 탭
        fetchStandings: true,  // standings, power 탭
      };

      matchData = await fetchCachedMatchFullData(matchId, options);

      // 결과를 캐시에 저장
      dataCache.set(cacheKey, {
        data: matchData,
        timestamp: Date.now()
      });
    }

    // 기본 데이터 로드 실패 시 404 페이지
    if (!matchData.success) {
      return notFound();
    }

    // 사이드바 데이터와 power 데이터를 병렬로 미리 로드
    const homeTeamId = matchData.homeTeam?.id;
    const awayTeamId = matchData.awayTeam?.id;
    const numericMatchId = parseInt(matchId, 10);
    const isFinished = matchData.match?.status?.code === 'FT';

    // FT 경기: L2 캐시에서 power, playerRatings, matchPlayerStats 조회
    let powerDataResult: { success: boolean; data?: unknown } = { success: false };
    let playerRatingsResult: unknown = null;
    let matchPlayerStatsResult: unknown = null;
    let sidebarDataResult: { success: boolean; data?: unknown } = { success: false };

    if (isFinished) {
      // 캐시 벌크 조회 (1회 쿼리)
      const [cachedExtra, sidebarResult] = await Promise.all([
        getMatchCacheBulk(numericMatchId, ['power', 'playerRatings', 'matchPlayerStats']),
        getCachedSidebarData(matchId),
      ]);
      sidebarDataResult = sidebarResult;

      const hasPower = !!cachedExtra['power'];
      const hasRatings = !!cachedExtra['playerRatings'];
      const hasStats = !!cachedExtra['matchPlayerStats'];

      if (hasPower) {
        powerDataResult = cachedExtra['power'] as { success: boolean; data?: unknown };
      }
      if (hasRatings) {
        playerRatingsResult = cachedExtra['playerRatings'];
      }
      if (hasStats) {
        matchPlayerStatsResult = cachedExtra['matchPlayerStats'];
      }

      // 캐시에 없는 것만 API에서 가져옴
      const apiPromises: Promise<void>[] = [];

      if (!hasPower && homeTeamId && awayTeamId) {
        apiPromises.push(
          getCachedPowerData(homeTeamId, awayTeamId, 5).then(r => {
            powerDataResult = r;
            setMatchCache(numericMatchId, 'power', r).catch(() => {});
          })
        );
      }
      if (!hasRatings) {
        apiPromises.push(
          fetchPlayerRatingsAndCaptains(matchId).then(r => {
            playerRatingsResult = r;
            setMatchCache(numericMatchId, 'playerRatings', r).catch(() => {});
          })
        );
      }
      if (!hasStats) {
        apiPromises.push(
          fetchMatchPlayerStats(matchId).then(r => {
            matchPlayerStatsResult = r;
            setMatchCache(numericMatchId, 'matchPlayerStats', r).catch(() => {});
          })
        );
      }

      if (apiPromises.length > 0) await Promise.all(apiPromises);
    } else {
      // 비종료 경기: 기존대로 모든 API 병렬 호출
      const [sResult, pResult, rResult, stsResult] = await Promise.all([
        getCachedSidebarData(matchId),
        (homeTeamId && awayTeamId)
          ? getCachedPowerData(homeTeamId, awayTeamId, 5)
          : Promise.resolve({ success: false, data: undefined }),
        fetchPlayerRatingsAndCaptains(matchId),
        fetchMatchPlayerStats(matchId)
      ]);
      sidebarDataResult = sResult;
      powerDataResult = pResult;
      playerRatingsResult = rResult;
      matchPlayerStatsResult = stsResult;
    }

    const sidebarData = sidebarDataResult.success ? sidebarDataResult.data : null;
    const powerData = (powerDataResult as { success?: boolean; data?: unknown }).success
      ? (powerDataResult as { data?: unknown }).data
      : undefined;

    return (
      <div className="container">
        <MatchPageClient
          matchId={matchId}
          initialTab={initialTab}
          initialData={matchData}
          initialPowerData={powerData}
          initialPlayerRatings={playerRatingsResult}
          initialMatchPlayerStats={matchPlayerStatsResult}
          sidebarData={sidebarData}
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
