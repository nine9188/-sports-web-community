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
  statistics?: PlayerStatistic[];
  fixtures?: { data: FixtureData[] };
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
      fetchRankings: options.fetchRankings ?? false
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
          statistics?: Promise<PlayerStatistic[]>;
          fixtures?: Promise<{ data: FixtureData[] }>;
          trophies?: Promise<TrophyData[]>;
          transfers?: Promise<TransferData[]>;
          injuries?: Promise<InjuryData[]>;
          rankings?: Promise<RankingsData>;
        } = {};
        
        // 기본 선수 데이터는 항상 가져옴
        apiPromises.playerData = fetchCachedPlayerData(playerId);
        
        // 선택적으로 다른 데이터 로드
        if (loadOptions.fetchSeasons) {
          apiPromises.seasons = fetchPlayerSeasons(playerIdNum);
        }
        
        if (loadOptions.fetchStats) {
          // 현재 시즌과 이전 시즌 데이터 모두 로드 시도
          apiPromises.statistics = fetchPlayerStats(playerIdNum, currentSeason)
            .then(async (stats) => {
              // 현재 시즌 데이터가 없거나 비어있으면 이전 시즌 데이터 시도
              if (!stats || stats.length === 0) {
                const prevSeasonStats = await fetchPlayerStats(playerIdNum, currentSeason - 1);
                return prevSeasonStats || [];
              }
              return stats;
            });
        }
        
        if (loadOptions.fetchFixtures) {
          // 현재 시즌과 이전 시즌 피클스처 데이터 모두 로드 시도
          apiPromises.fixtures = fetchPlayerFixtures(playerIdNum, currentSeason)
            .then(async (fixtures) => {
              // 현재 시즌 데이터가 없거나 비어있으면 이전 시즌 데이터 시도
              if (!fixtures || fixtures.data.length === 0) {
                const prevSeasonFixtures = await fetchPlayerFixtures(playerIdNum, currentSeason - 1);
                return prevSeasonFixtures || { data: [] };
              }
              return fixtures;
            });
        }
        
        if (loadOptions.fetchTrophies) {
          apiPromises.trophies = fetchPlayerTrophies(playerIdNum);
        }
        
        if (loadOptions.fetchTransfers) {
          apiPromises.transfers = fetchPlayerTransfers(playerIdNum);
        }
        
        if (loadOptions.fetchInjuries) {
          apiPromises.injuries = fetchPlayerInjuries(playerIdNum);
        }
        
        if (loadOptions.fetchRankings) {
          // 기본 리그 ID로 프리미어리그(39) 사용, 데이터가 있으면 첫 번째 리그 ID 사용
          const defaultLeagueId = 39;
          apiPromises.rankings = fetchPlayerRankings(playerIdNum, defaultLeagueId);
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
              // @ts-expect-error - 동적 키 할당
              response[key] = data;
            }
          }
        });
        
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