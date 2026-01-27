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
import { getPlayerCache, setPlayerCache } from './playerCache';

// 서버 데이터 캐싱을 위한 맵 (ID-탭 기반으로 캐싱)
const serverDataCache = new Map<string, PlayerFullDataResponse>();

// 캐시 만료 시간 설정 (10분으로 증가)
const CACHE_EXPIRY_TIME = 10 * 60 * 1000;

// 캐시 만료 시간 추적 맵
const cacheTTL = new Map<string, number>();

// API 호출 지연 시간 및 재시도 로직
const API_DELAY = 1000; // 1초 지연

// Request 중복 방지를 위한 진행 중인 요청 추적 맵
const ongoingRequests = new Map<string, Promise<PlayerFullDataResponse>>();

/**
 * API 호출을 위한 재시도 함수
 */
async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>, 
  retries = 3, 
  delay = API_DELAY
): Promise<T> {
  try {
    // API 호출 간 지연 시간 적용
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return await fetchFn();
  } catch (error: unknown) {
    // 429 (Too Many Requests) 오류이거나 다른 오류일 때 재시도
    if (retries > 0) {
      // 지수 백오프 적용 (재시도마다 대기 시간 증가)
      return fetchWithRetry(fetchFn, retries - 1, delay * 2);
    }
    throw error;
  }
}

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
export const fetchCachedPlayerData = cache(async (id: string): Promise<PlayerData> => {
  try {
    // 캐시된 데이터 확인 (서버 컴포넌트에서는 React의 cache 함수가 처리)
    
    // 재시도 로직을 적용한 API 호출
    const playerData = await fetchWithRetry(() => fetchPlayerData(id));
    
    return playerData;
  } catch (error) {
    throw error;
  }
});

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
  fixtures?: {
    data: FixtureData[];
    status?: string;
    message?: string;
  };
  trophies?: TrophyData[];
  transfers?: TransferData[];
  injuries?: InjuryData[];
  rankings?: RankingsData;
  cachedAt?: number; // 캐시 타임스탬프 추가
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
    // API에서 사용 가능한 시즌 목록 가져오기
    const seasonsResponse = await fetch(
      "https://v3.football.api-sports.io/leagues/seasons",
      {
        headers: {
          "x-rapidapi-host": "v3.football.api-sports.io",
          "x-rapidapi-key": process.env.FOOTBALL_API_KEY || "",
        },
        cache: "force-cache", // 강제 캐싱 적용
      }
    );

    if (!seasonsResponse.ok) {
      throw new Error(`시즌 정보 API 응답 오류: ${seasonsResponse.status}`);
    }

    const seasonsData = await seasonsResponse.json();
    
    // API 응답에서 시즌 목록 추출
    const seasons = seasonsData.response || [];
    
    // 내림차순으로 정렬 (최신 시즌이 먼저 오도록)
    return seasons.sort((a: number, b: number) => b - a);
  } catch {
    // 기본 시즌 목록 반환 (최근 10년)
    const currentYear = new Date().getFullYear();
    const fallbackSeasons = Array.from({ length: 10 }, (_, i) => currentYear - i);
    return fallbackSeasons;
  }
};

// 캐시된 시즌 목록 데이터
let cachedSeasons: number[] | null = null;
let cachedSeasonsTimestamp: number = 0;
const SEASONS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24시간 캐시

/**
 * 캐싱을 적용한 시즌 목록 가져오기 함수
 */
export const getCachedSeasons = async (): Promise<number[]> => {
  const now = Date.now();
  
  // 캐시가 유효하면 캐시된 데이터 반환
  if (cachedSeasons && now - cachedSeasonsTimestamp < SEASONS_CACHE_TTL) {
    return cachedSeasons;
  }
  
  // 새로운 데이터 가져오기
  const seasons = await fetchAvailableSeasons();
  
  // 캐시 업데이트
  cachedSeasons = seasons;
  cachedSeasonsTimestamp = now;
  
  return seasons;
};

// 캐싱된 React 버전의 함수
export const getCachedSeasonsForReact = cache(getCachedSeasons);

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
    
    // 캐시 키 생성 - 선수 ID와 요청 옵션을 결합
    const optionsKey = Object.entries(loadOptions)
      .filter(([, value]) => value === true)
      .map(([key]) => key)
      .join('-');
    
    const cacheKey = `player-${playerId}-${optionsKey}`;
    
    // 캐시 유효성 체크 함수
    const isCacheValid = (key: string): boolean => {
      if (!serverDataCache.has(key)) return false;
      
      // 캐시 만료 시간 확인
      const cachedTime = cacheTTL.get(key);
      if (!cachedTime) return false;
      
      const now = Date.now();
      return now - cachedTime < CACHE_EXPIRY_TIME;
    };
    
    // 캐시된 데이터가 있고 유효하면 반환
    if (isCacheValid(cacheKey)) {
      const cachedData = serverDataCache.get(cacheKey)!;
      return {
        ...cachedData,
        cachedAt: cacheTTL.get(cacheKey)
      };
    }
    
    // 이미 진행 중인 동일한 요청이 있는지 확인
    if (ongoingRequests.has(cacheKey)) {
      // 진행 중인 요청이 있으면 해당 Promise 재사용
      return ongoingRequests.get(cacheKey)!;
    }
    
    // 새로운 요청을 생성하고 진행 중인 요청 맵에 저장
    const fetchDataPromise = (async () => {
      try {
        // 현재 시즌 계산
        const currentSeason = getCurrentSeason();
        
        // 병렬로 처리할 API 호출 준비
        const apiPromises: {
          playerData?: Promise<PlayerData>;
          seasons?: Promise<number[]>;
          allSeasons?: Promise<number[]>; // 추가: 모든 시즌 데이터
          statistics?: Promise<PlayerStatistic[]>;
          fixtures?: Promise<{ data: FixtureData[] }>;
          trophies?: Promise<TrophyData[]>;
          transfers?: Promise<TransferData[]>;
          injuries?: Promise<InjuryData[]>;
          rankings?: Promise<RankingsData>;
        } = {};
        
        // ============================================
        // L2 (Supabase) 캐시 확인 → miss 시 API 호출 → 저장
        // ============================================

        /**
         * L2 캐시 래퍼: Supabase 캐시 확인 후 miss이면 fetcher 실행, 결과 저장
         */
        async function withCache<T>(
          dataType: 'info' | 'stats' | 'fixtures' | 'trophies' | 'transfers' | 'injuries' | 'seasons',
          fetcher: () => Promise<T>,
          season?: number
        ): Promise<T> {
          // L2 캐시 조회
          const cached = await getPlayerCache(playerIdNum, dataType, season);
          if (cached.data !== null && cached.fresh) {
            return cached.data as T;
          }

          // stale 데이터가 있으면 백그라운드 갱신 (stale-while-revalidate)
          // 여기서는 단순히 API 호출
          const freshData = await fetcher();

          // L2 캐시에 저장 (비동기, 실패해도 무시)
          setPlayerCache(playerIdNum, dataType, freshData, season).catch(() => {});

          return freshData;
        }

        // 기본 선수 데이터는 항상 가져옴
        apiPromises.playerData = withCache<PlayerData>(
          'info',
          () => fetchCachedPlayerData(playerId)
        );

        // 모든 사용 가능한 시즌 목록 가져오기 (필요한 경우)
        if (loadOptions.fetchSeasons || loadOptions.fetchFixtures) {
          apiPromises.allSeasons = getCachedSeasons();
        }

        // 선택적으로 다른 데이터 로드
        if (loadOptions.fetchSeasons) {
          apiPromises.seasons = withCache<number[]>(
            'seasons',
            () => fetchPlayerSeasons(playerIdNum)
          );
        }

        if (loadOptions.fetchStats) {
          apiPromises.statistics = withCache<PlayerStatistic[]>(
            'stats',
            async () => {
              const stats = await fetchPlayerStats(playerIdNum, currentSeason);
              if (!stats || stats.length === 0) {
                const prevSeasonStats = await fetchPlayerStats(playerIdNum, currentSeason - 1);
                return prevSeasonStats || [];
              }
              return stats;
            },
            currentSeason
          );
        }

        if (loadOptions.fetchFixtures) {
          apiPromises.fixtures = withCache<{ data: FixtureData[]; status?: string; message?: string }>(
            'fixtures',
            async () => {
              try {
                const fixtures = await fetchPlayerFixtures(playerIdNum);
                return {
                  data: fixtures?.data || [],
                  status: fixtures?.status || 'success',
                  message: fixtures?.message
                };
              } catch {
                return {
                  data: [],
                  status: 'error',
                  message: '피클스처 데이터를 가져오는데 실패했습니다.'
                };
              }
            },
            currentSeason
          );
        }

        if (loadOptions.fetchTrophies) {
          apiPromises.trophies = withCache<TrophyData[]>(
            'trophies',
            () => fetchPlayerTrophies(playerIdNum)
          );
        }

        if (loadOptions.fetchTransfers) {
          apiPromises.transfers = withCache<TransferData[]>(
            'transfers',
            () => fetchPlayerTransfers(playerIdNum)
          );
        }

        if (loadOptions.fetchInjuries) {
          apiPromises.injuries = withCache<InjuryData[]>(
            'injuries',
            async () => {
              try {
                return await fetchPlayerInjuries(playerIdNum);
              } catch (error) {
                console.error(`[fetchPlayerFullData] 부상 데이터 로드 오류:`, error);
                return [];
              }
            }
          );
        }

        if (loadOptions.fetchRankings) {
          // 랭킹은 캐시 대상 아님 (다른 선수 데이터 포함)
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
              return { key, data };
            } catch (error) {
              return { key, error };
            }
          })
        );
        
        // 결과 조합
        const response: PlayerFullDataResponse = {
          success: true,
          message: '선수 데이터를 성공적으로 가져왔습니다.',
          cachedAt: Date.now() // 현재 타임스탬프 설정
        };
        
        // 각 데이터 처리
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            const { key, data } = result.value;
            
            if (data) {
              // 특별한 처리: allSeasons 결과와 seasons 결과 병합
              if (key === 'allSeasons') {
                // allSeasons 키는 내부 처리용이므로 바로 저장하지 않음
                response.allSeasons = data as number[];
              } else {
                // @ts-expect-error - 동적 키 할당
                response[key] = data;
              }
            }
          }
        });
        
        // 시즌 데이터 병합 - 특정 선수의 시즌과 전체 가능한 시즌 결합
        if (response.allSeasons) {
          // 이미 선수 특정 시즌이 있으면 합치고, 없으면 전체 시즌 사용
          if (response.seasons && response.seasons.length > 0) {
            // 선수의 시즌과 전체 시즌을 합쳐서 중복 제거 후 다시 정렬
            const combinedSeasons = [...new Set([...response.seasons, ...response.allSeasons])];
            response.seasons = combinedSeasons.sort((a, b) => b - a);
          } else {
            response.seasons = response.allSeasons;
          }
          
          // 내부 처리용 allSeasons는 최종 결과에서 제거
          delete response.allSeasons;
        }
        
        // 필수 데이터인 playerData가 없으면 실패로 처리
        if (!response.playerData) {
          return {
            success: false,
            message: '선수 기본 정보를 가져오는데 실패했습니다.'
          };
        }
        
        // 결과를 캐시에 저장
        serverDataCache.set(cacheKey, response);
        cacheTTL.set(cacheKey, Date.now());
        
        return response;
      } finally {
        // 요청이 완료되면 진행 중인 요청 맵에서 제거
        ongoingRequests.delete(cacheKey);
      }
    })();
    
    // 진행 중인 요청 맵에 저장
    ongoingRequests.set(cacheKey, fetchDataPromise);
    
    return fetchDataPromise;
    
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    };
  }
}; 