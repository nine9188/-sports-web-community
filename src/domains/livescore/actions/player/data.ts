'use server';

import { cache } from 'react';
import { PlayerData, PlayerStatistic, FixtureData, TransferData, InjuryData, TrophyData, RankingsData } from '@/domains/livescore/types/player';
import { fetchPlayerData } from './player';
import { fetchPlayerSeasons, fetchPlayerStats } from './stats';
import { fetchPlayerFixtures } from './fixtures';
import { fetchPlayerTrophies } from './trophies';
import { fetchPlayerTransfers } from './transfers';
import { fetchPlayerInjuries } from './injuries';
import { fetchPlayerRankings } from './rankings';
import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi';
import { getPlayerPhotoUrl, getTeamLogoUrl, getTeamLogoUrls, getLeagueLogoUrls } from '@/domains/livescore/actions/images';

/**
 * player.ts에서 구현된 fetchPlayerData 함수를 사용하여 
 * 선수 데이터를 가져오는 캐싱된 함수입니다.
 * 
 * 이 함수는 기존 API 호출 로직을 중복하지 않고 재사용하여
 * 코드 일관성과 유지보수성을 높입니다.
 * 
 * @param id 선수 ID
 * @returns 선수 데이터
 */
export const fetchCachedPlayerData = cache(fetchPlayerData);

/**
 * 통합 데이터 응답 인터페이스
 */
export interface PlayerFullDataResponse {
  success: boolean;
  message: string;
  playerData?: PlayerData;
  seasons?: number[];
  allSeasons?: number[]; // 전체 사용 가능한 시즌 목록(내부 처리용)
  statistics?: PlayerStatistic[];
  // 4590 표준: statistics 이미지 URL
  statisticsTeamLogoUrls?: Record<number, string>;
  statisticsLeagueLogoUrls?: Record<number, string>;
  statisticsLeagueLogoDarkUrls?: Record<number, string>;
  fixtures?: {
    data: FixtureData[];
    status?: string;
    message?: string;
    // 4590 표준: 이미지 Storage URL
    teamLogoUrls?: Record<number, string>;
    leagueLogoUrls?: Record<number, string>;
    leagueLogoDarkUrls?: Record<number, string>;
  };
  trophies?: TrophyData[];
  // 4590 표준: trophies 이미지 URL
  trophiesLeagueLogoUrls?: Record<number, string>;
  trophiesLeagueLogoDarkUrls?: Record<number, string>;
  transfers?: TransferData[];
  // 4590 표준: transfers 이미지 URL
  transfersTeamLogoUrls?: Record<number, string>;
  injuries?: InjuryData[];
  // 4590 표준: injuries 이미지 URL
  injuriesTeamLogoUrls?: Record<number, string>;
  rankings?: RankingsData;
  cachedAt?: number; // 캐시 타임스탬프 추가
  // 4590 표준: 이미지 Storage URL
  playerPhotoUrl?: string;
  teamLogoUrl?: string;
}

/**
 * 데이터 로드 옵션 인터페이스
 */
interface FetchOptions {
  fetchSeasons?: boolean;
  fetchStats?: boolean;
  fetchFixtures?: boolean;
  fetchTrophies?: boolean;
  fetchTransfers?: boolean;
  fetchInjuries?: boolean;
  fetchRankings?: boolean;
  season?: number; // 조회할 특정 시즌
}

/**
 * 현재 시즌 계산 함수
 */
function getCurrentSeason(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // 현재 시즌이 API에서 아직 데이터를 제공하지 않을 수 있으므로
  // 항상 이전 시즌을 기본으로 사용
  // 7월 이후면 해당 연도, 아니면 이전 연도를 시즌으로 사용
  return month >= 6 ? year : year - 1;
}

/**
 * 시즌 데이터를 API에서 직접 가져오는 함수
 * API Football의 시즌 목록 API를 호출합니다.
 * @returns 사용 가능한 모든 시즌 목록
 */
export const fetchAvailableSeasons = async (): Promise<number[]> => {
  try {
    const seasonsData = await fetchFromFootballApi('leagues/seasons', {});
    const seasons = seasonsData.response || [];
    return seasons.sort((a: number, b: number) => b - a);
  } catch {
    const currentYear = new Date().getFullYear();
    const fallbackSeasons = Array.from({ length: 10 }, (_, i) => currentYear - i);
    return fallbackSeasons;
  }
};

// React cache로 래핑 (동일 렌더링 사이클 내 중복 호출 방지)
export const getCachedSeasons = cache(fetchAvailableSeasons);
export const getCachedSeasonsForReact = getCachedSeasons;

/**
 * 선수의 모든 데이터를 한 번에 가져오는 통합 함수
 * 필요한 데이터만 선택적으로 로드하여 성능 최적화
 * 
 * @param playerId 선수 ID
 * @param options 가져올 데이터 옵션
 * @returns 통합된 선수 데이터
 */
export const fetchPlayerFullData = async (
  playerId: string,
  options: FetchOptions = {}
): Promise<PlayerFullDataResponse> => {
  try {
    const playerIdNum = parseInt(playerId, 10);
    if (isNaN(playerIdNum)) {
      return {
        success: false,
        message: '유효하지 않은 선수 ID입니다.'
      };
    }
    
    // 기본 옵션 설정
    const loadOptions = {
      fetchSeasons: options.fetchSeasons !== undefined ? options.fetchSeasons : true,
      fetchStats: options.fetchStats !== undefined ? options.fetchStats : true,
      fetchFixtures: options.fetchFixtures ?? false,
      fetchTrophies: options.fetchTrophies ?? false,
      fetchTransfers: options.fetchTransfers ?? false,
      fetchInjuries: options.fetchInjuries ?? false,
      fetchRankings: options.fetchRankings ?? false,
      season: options.season
    };

    // 현재 시즌 계산
    const currentSeason = getCurrentSeason();

    // 병렬로 처리할 API 호출 준비
    const apiPromises: {
      playerData?: Promise<PlayerData>;
      seasons?: Promise<number[]>;
      allSeasons?: Promise<number[]>;
      statistics?: Promise<PlayerStatistic[]>;
      fixtures?: Promise<{ data: FixtureData[] }>;
      trophies?: Promise<TrophyData[]>;
      transfers?: Promise<TransferData[]>;
      injuries?: Promise<InjuryData[]>;
      rankings?: Promise<RankingsData>;
    } = {};

    // 기본 선수 데이터는 항상 가져옴
    apiPromises.playerData = fetchCachedPlayerData(playerId);

    // 모든 사용 가능한 시즌 목록 가져오기 (필요한 경우)
    if (loadOptions.fetchSeasons || loadOptions.fetchFixtures) {
      apiPromises.allSeasons = getCachedSeasons();
    }

    // 선택적으로 다른 데이터 로드
    if (loadOptions.fetchSeasons) {
      apiPromises.seasons = fetchPlayerSeasons(playerIdNum);
    }

    if (loadOptions.fetchStats) {
      apiPromises.statistics = (async () => {
        const stats = await fetchPlayerStats(playerIdNum, currentSeason);
        if (!stats || stats.length === 0) {
          const prevSeasonStats = await fetchPlayerStats(playerIdNum, currentSeason - 1);
          return prevSeasonStats || [];
        }
        return stats;
      })();
    }

    if (loadOptions.fetchFixtures) {
      apiPromises.fixtures = (async () => {
        try {
          const fixtures = await fetchPlayerFixtures(playerIdNum);
          return {
            data: fixtures?.data || [],
            status: fixtures?.status || 'success',
            message: fixtures?.message
          };
        } catch {
          return {
            data: [] as FixtureData[],
            status: 'error' as const,
            message: '경기 데이터를 가져오는데 실패했습니다.'
          };
        }
      })();
    }

    if (loadOptions.fetchTrophies) {
      apiPromises.trophies = fetchPlayerTrophies(playerIdNum);
    }

    if (loadOptions.fetchTransfers) {
      apiPromises.transfers = fetchPlayerTransfers(playerIdNum);
    }

    if (loadOptions.fetchInjuries) {
      apiPromises.injuries = (async () => {
        try {
          return await fetchPlayerInjuries(playerIdNum);
        } catch (error) {
          console.error(`[fetchPlayerFullData] 부상 데이터 로드 오류:`, error);
          return [] as InjuryData[];
        }
      })();
    }

    if (loadOptions.fetchRankings) {
      apiPromises.rankings = apiPromises.playerData!.then(async (playerData) => {
        const currentLeagueId = playerData?.statistics?.[0]?.league?.id || 39;
        return fetchPlayerRankings(playerIdNum, currentLeagueId);
      });
    }

    // 병렬로 모든 API 호출 처리
    const results = await Promise.allSettled(
      Object.entries(apiPromises).map(async ([key, promise]) => {
        try {
          const data = await promise;
          return { key, data, error: null };
        } catch (error) {
          console.error(`[fetchPlayerFullData] ${key} 로드 실패:`, error);
          return { key, data: null, error };
        }
      })
    );

    // 결과 조합
    const response: PlayerFullDataResponse = {
      success: true,
      message: '선수 데이터를 성공적으로 가져왔습니다.',
      cachedAt: Date.now()
    };

    // 각 데이터 처리
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { key, data } = result.value;

        if (data) {
          if (key === 'allSeasons') {
            response.allSeasons = data as number[];
          } else {
            // @ts-expect-error - 동적 키 할당
            response[key] = data;
          }
        }
      }
    });

    // 시즌 데이터 병합
    if (response.allSeasons) {
      if (response.seasons && response.seasons.length > 0) {
        const combinedSeasons = [...new Set([...response.seasons, ...response.allSeasons])];
        response.seasons = combinedSeasons.sort((a, b) => b - a);
      } else {
        response.seasons = response.allSeasons;
      }
      delete response.allSeasons;
    }

    // 필수 데이터인 playerData가 없으면 실패로 처리
    if (!response.playerData) {
      console.error(`[fetchPlayerFullData] playerData 없음 - playerId: ${playerId}`);
      return {
        success: false,
        message: '선수 기본 정보를 가져오는데 실패했습니다.'
      };
    }

    // 4590 표준: 선수 사진 및 팀 로고 URL 조회
    const playerNumId = response.playerData.info?.id;
    const teamId = response.playerData.statistics?.[0]?.team?.id;

    const [playerPhotoUrl, teamLogoUrl] = await Promise.all([
      playerNumId ? getPlayerPhotoUrl(playerNumId) : Promise.resolve('/images/placeholder-player.svg'),
      teamId ? getTeamLogoUrl(teamId) : Promise.resolve('/images/placeholder-team.svg')
    ]);

    response.playerPhotoUrl = playerPhotoUrl;
    response.teamLogoUrl = teamLogoUrl;

    // 4590 표준: fixtures 이미지 URL 맵 생성 (다크모드 포함)
    if (response.fixtures?.data && response.fixtures.data.length > 0) {
      const fixturesTeamIds = new Set<number>();
      const fixturesLeagueIds = new Set<number>();

      response.fixtures.data.forEach(fixture => {
        if (fixture.teams?.home?.id) fixturesTeamIds.add(fixture.teams.home.id);
        if (fixture.teams?.away?.id) fixturesTeamIds.add(fixture.teams.away.id);
        if (fixture.league?.id) fixturesLeagueIds.add(fixture.league.id);
      });

      const [fixturesTeamLogos, fixturesLeagueLogos, fixturesLeagueLogosDark] = await Promise.all([
        fixturesTeamIds.size > 0 ? getTeamLogoUrls([...fixturesTeamIds]) : Promise.resolve({}),
        fixturesLeagueIds.size > 0 ? getLeagueLogoUrls([...fixturesLeagueIds]) : Promise.resolve({}),
        fixturesLeagueIds.size > 0 ? getLeagueLogoUrls([...fixturesLeagueIds], true) : Promise.resolve({})
      ]);

      response.fixtures.teamLogoUrls = fixturesTeamLogos;
      response.fixtures.leagueLogoUrls = fixturesLeagueLogos;
      response.fixtures.leagueLogoDarkUrls = fixturesLeagueLogosDark;
    }

    // 4590 표준: injuries 이미지 URL 맵 생성
    if (response.injuries && response.injuries.length > 0) {
      const injuriesTeamIds = new Set<number>();

      response.injuries.forEach(injury => {
        if (injury.team?.id) injuriesTeamIds.add(injury.team.id);
      });

      if (injuriesTeamIds.size > 0) {
        response.injuriesTeamLogoUrls = await getTeamLogoUrls([...injuriesTeamIds]);
      }
    }

    // 4590 표준: transfers 이미지 URL 맵 생성
    if (response.transfers && response.transfers.length > 0) {
      const transfersTeamIds = new Set<number>();

      response.transfers.forEach(transfer => {
        if (transfer.teams?.from?.id) transfersTeamIds.add(transfer.teams.from.id);
        if (transfer.teams?.to?.id) transfersTeamIds.add(transfer.teams.to.id);
      });

      if (transfersTeamIds.size > 0) {
        response.transfersTeamLogoUrls = await getTeamLogoUrls([...transfersTeamIds]);
      }
    }

    // 4590 표준: trophies 이미지 URL 맵 생성 (다크모드 포함)
    if (response.trophies && response.trophies.length > 0) {
      const trophiesLeagueIds = new Set<number>();

      response.trophies.forEach(trophy => {
        if (trophy.leagueLogo) {
          const match = trophy.leagueLogo.match(/\/(\d+)\.(png|svg)$/);
          if (match) {
            trophiesLeagueIds.add(parseInt(match[1], 10));
          }
        }
      });

      if (trophiesLeagueIds.size > 0) {
        const [trophiesLeagueLogos, trophiesLeagueLogosDark] = await Promise.all([
          getLeagueLogoUrls([...trophiesLeagueIds]),
          getLeagueLogoUrls([...trophiesLeagueIds], true)
        ]);
        response.trophiesLeagueLogoUrls = trophiesLeagueLogos;
        response.trophiesLeagueLogoDarkUrls = trophiesLeagueLogosDark;
      }
    }

    // 4590 표준: statistics 이미지 URL 맵 생성
    if (response.statistics && response.statistics.length > 0) {
      const statsTeamIds = new Set<number>();
      const statsLeagueIds = new Set<number>();

      response.statistics.forEach(stat => {
        if (stat.team?.id) statsTeamIds.add(stat.team.id);
        if (stat.league?.id) statsLeagueIds.add(stat.league.id);
      });

      const [statsTeamLogos, statsLeagueLogos, statsLeagueLogoDark] = await Promise.all([
        statsTeamIds.size > 0 ? getTeamLogoUrls([...statsTeamIds]) : Promise.resolve({}),
        statsLeagueIds.size > 0 ? getLeagueLogoUrls([...statsLeagueIds]) : Promise.resolve({}),
        statsLeagueIds.size > 0 ? getLeagueLogoUrls([...statsLeagueIds], true) : Promise.resolve({})
      ]);

      response.statisticsTeamLogoUrls = statsTeamLogos;
      response.statisticsLeagueLogoUrls = statsLeagueLogos;
      response.statisticsLeagueLogoDarkUrls = statsLeagueLogoDark;
    }

    return response;

  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    };
  }
}; 