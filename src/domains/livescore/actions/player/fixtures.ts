'use server';

import { cache } from 'react';
import { FixtureData } from '@/domains/livescore/types/player';

// ============================================
// 타입 정의
// ============================================

interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    timestamp: number;
    status: {
      short: string;
      [key: string]: string | number | boolean;
    };
  };
  league: {
    id: number;
    name: string;
    logo: string;
    country?: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    [key: string]: { home: number | null; away: number | null };
  };
}

interface FixtureWithStats extends Omit<FixtureData, 'statistics'> {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      [key: string]: string | number | boolean;
    };
    timestamp: number;
  };
  statistics: {
    games: { minutes: number; rating: number | null; position: string | null; number: number | null };
    shots: { total: number; on: number };
    goals: { total: number; assists: number; conceded: number; saves: number | null };
    passes: { total: number; key: number; accuracy: string };
    cards: { yellow: number; red: number };
  };
}

export interface FixturesResponse {
  data: FixtureData[];
  status?: 'success' | 'partial' | 'error' | 'stale';
  message?: string;
  cached?: boolean;
  stale?: boolean; // Stale 데이터 여부
  seasonUsed?: number;
  completeness?: {
    total: number;
    success: number;
    failed: number;
    failedFixtureIds?: number[];
  };
}

// ============================================
// 캐시 구조 (Complete/Partial 분리)
// ============================================

interface CacheEntry {
  timestamp: number;
  data: FixtureData[];
  totalFixtures: number;
  failedFixtureIds: number[];
}

// Complete 캐시 (실패 없는 완전한 데이터)
const completeCache = new Map<string, CacheEntry>();
// Partial 캐시 (일부 실패 포함)
const partialCache = new Map<string, CacheEntry>();

// 캐시 TTL
const CACHE_TTL = {
  complete: 6 * 60 * 60 * 1000,  // 6시간
  partial: 30 * 60 * 1000,       // 30분 (부분 데이터는 짧게)
  stale: 24 * 60 * 60 * 1000,    // 24시간 (stale 데이터 최대 유지)
};

// ============================================
// API 설정
// ============================================

const API_CONFIG = {
  baseUrl: 'https://v3.football.api-sports.io',
  headers: {
    'x-rapidapi-host': 'v3.football.api-sports.io',
    'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
  },
  chunkSize: 5,
  chunkDelay: 500,
  maxRetries: 3,
  baseBackoffDelay: 1000,
  requestTimeout: 10000, // 10초 타임아웃
  maxConcurrency: 3,     // 최대 동시 요청 수
};

// ============================================
// 세마포어 (동시성 제한)
// ============================================

class Semaphore {
  private permits: number;
  private queue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    return new Promise<void>(resolve => this.queue.push(resolve));
  }

  release(): void {
    this.permits++;
    const next = this.queue.shift();
    if (next) {
      this.permits--;
      next();
    }
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

// 전역 세마포어 (동시 요청 제한)
const apiSemaphore = new Semaphore(API_CONFIG.maxConcurrency);

// ============================================
// Rate Limit 대응 Fetch
// ============================================

interface FetchResult {
  ok: boolean;
  status: number;
  data?: unknown;
  error?: string;
  retryable: boolean;
}

/**
 * Rate Limit 대응 fetch
 * - Retry-After 헤더 존중
 * - 지수 백오프 + jitter
 * - AbortController로 타임아웃
 * - 4xx는 재시도 안 함 (429 제외)
 * - 동시성 제한 (세마포어)
 */
async function fetchWithRateLimit(
  url: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<FetchResult> {
  // 세마포어로 동시 요청 제한
  return apiSemaphore.run(async () => {
    // AbortController로 타임아웃 설정
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.requestTimeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 429 Too Many Requests - 재시도
      if (response.status === 429) {
        if (retryCount >= API_CONFIG.maxRetries) {
          return { ok: false, status: 429, error: 'Rate limit exceeded', retryable: false };
        }

        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : API_CONFIG.baseBackoffDelay * Math.pow(2, retryCount) + Math.random() * 1000;

        console.log(`[fetchWithRateLimit] 429 Rate limited. Waiting ${waitTime}ms (retry ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return fetchWithRateLimit(url, options, retryCount + 1);
      }

      // 5xx 서버 에러 - 재시도
      if (response.status >= 500) {
        if (retryCount >= API_CONFIG.maxRetries) {
          return { ok: false, status: response.status, error: `Server error: ${response.status}`, retryable: false };
        }

        const waitTime = API_CONFIG.baseBackoffDelay * Math.pow(2, retryCount);
        console.log(`[fetchWithRateLimit] ${response.status} Server error. Retrying in ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return fetchWithRateLimit(url, options, retryCount + 1);
      }

      // 4xx 클라이언트 에러 (429 제외) - 재시도 안 함
      if (response.status >= 400 && response.status < 500) {
        console.error(`[fetchWithRateLimit] Client error ${response.status}: ${url}`);
        return { ok: false, status: response.status, error: `Client error: ${response.status}`, retryable: false };
      }

      // 성공
      const data = await response.json();
      return { ok: true, status: response.status, data, retryable: false };

    } catch (error) {
      clearTimeout(timeoutId);

      // 타임아웃 에러
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`[fetchWithRateLimit] Timeout after ${API_CONFIG.requestTimeout}ms: ${url}`);

        if (retryCount < API_CONFIG.maxRetries) {
          const waitTime = API_CONFIG.baseBackoffDelay * Math.pow(2, retryCount);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return fetchWithRateLimit(url, options, retryCount + 1);
        }
        return { ok: false, status: 0, error: 'Request timeout', retryable: false };
      }

      // 네트워크 에러 - 재시도
      if (retryCount < API_CONFIG.maxRetries) {
        const waitTime = API_CONFIG.baseBackoffDelay * Math.pow(2, retryCount);
        console.log(`[fetchWithRateLimit] Network error. Retrying in ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return fetchWithRateLimit(url, options, retryCount + 1);
      }

      return { ok: false, status: 0, error: String(error), retryable: false };
    }
  });
}

// ============================================
// 캐시 유틸리티
// ============================================

/**
 * 캐시 키 생성 (모든 요청 파라미터 반영)
 */
function createCacheKey(playerId: number, season: number, teamId?: number): string {
  return `fixtures_p${playerId}_s${season}${teamId ? `_t${teamId}` : ''}`;
}

/**
 * 캐시에서 데이터 조회 (Complete > Partial > Stale 순서)
 */
function getFromCache(cacheKey: string): { entry: CacheEntry | null; type: 'complete' | 'partial' | 'stale' | null } {
  const now = Date.now();

  // 1. Complete 캐시 확인
  const complete = completeCache.get(cacheKey);
  if (complete && (now - complete.timestamp) < CACHE_TTL.complete) {
    return { entry: complete, type: 'complete' };
  }

  // 2. Partial 캐시 확인 (complete가 없거나 만료된 경우)
  const partial = partialCache.get(cacheKey);
  if (partial && (now - partial.timestamp) < CACHE_TTL.partial) {
    return { entry: partial, type: 'partial' };
  }

  // 3. Stale 데이터 확인 (모두 만료됐지만 24시간 이내면 stale로 반환)
  if (complete && (now - complete.timestamp) < CACHE_TTL.stale) {
    return { entry: complete, type: 'stale' };
  }
  if (partial && (now - partial.timestamp) < CACHE_TTL.stale) {
    return { entry: partial, type: 'stale' };
  }

  return { entry: null, type: null };
}

/**
 * 캐시에 저장
 */
function saveToCache(cacheKey: string, entry: CacheEntry, isComplete: boolean): void {
  if (isComplete) {
    completeCache.set(cacheKey, entry);
    // Complete 데이터가 들어오면 Partial 삭제
    partialCache.delete(cacheKey);
  } else {
    partialCache.set(cacheKey, entry);
  }
}

// ============================================
// 메인 함수
// ============================================

/**
 * 선수 경기 기록 가져오기
 *
 * 개선사항:
 * - Stale-While-Revalidate 패턴
 * - Complete/Partial 캐시 분리
 * - 동시성 제한 (세마포어)
 * - AbortController 타임아웃
 * - 4xx는 재시도 안 함 (429 제외)
 */
export async function fetchPlayerFixtures(
  playerId: number,
  limit: number = 0
): Promise<FixturesResponse> {
  if (!playerId) {
    return { data: [], status: 'error', message: '선수 ID가 필요합니다' };
  }

  // 현재 시즌 계산
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const currentSeason = month >= 6 ? year : year - 1;

  // 초기 캐시 키 (teamId 없이)
  const initialCacheKey = createCacheKey(playerId, currentSeason);

  // 캐시 확인 (Complete > Partial > Stale)
  const cached = getFromCache(initialCacheKey);

  // Complete 캐시가 있으면 즉시 반환
  if (cached.type === 'complete' && cached.entry) {
    const limitedData = limit > 0 ? cached.entry.data.slice(0, limit) : cached.entry.data;
    return {
      data: limitedData,
      status: 'success',
      message: '캐시된 경기 기록을 불러왔습니다',
      cached: true,
      seasonUsed: currentSeason,
      completeness: {
        total: cached.entry.totalFixtures,
        success: cached.entry.data.length,
        failed: 0
      }
    };
  }

  // Stale 데이터가 있으면 먼저 반환하고 백그라운드에서 갱신 시도
  // (여기서는 동기적으로 처리하되, stale 표시)
  const staleEntry = cached.type === 'stale' ? cached.entry : null;

  try {
    // API 요청 시작
    const fetchOptions: RequestInit = {
      headers: API_CONFIG.headers,
    };

    // 1. 선수 정보 조회 (팀 ID 획득)
    const playerResult = await fetchWithRateLimit(
      `${API_CONFIG.baseUrl}/players?id=${playerId}&season=${currentSeason}`,
      fetchOptions
    );

    if (!playerResult.ok || !playerResult.data) {
      // 실패 시 stale 데이터 반환
      if (staleEntry) {
        const limitedData = limit > 0 ? staleEntry.data.slice(0, limit) : staleEntry.data;
        return {
          data: limitedData,
          status: 'stale',
          message: '최신 데이터를 가져오지 못해 이전 데이터를 표시합니다',
          cached: true,
          stale: true,
          seasonUsed: currentSeason
        };
      }
      return { data: [], status: 'error', message: `선수 정보 조회 실패: ${playerResult.error}` };
    }

    const playerData = playerResult.data as { response?: Array<{ statistics?: Array<{ team?: { id: number } }> }> };
    let teamId = playerData.response?.[0]?.statistics?.[0]?.team?.id;

    // 현재 시즌에 데이터 없으면 이전 시즌 시도
    if (!teamId && currentSeason >= 2023) {
      const prevResult = await fetchWithRateLimit(
        `${API_CONFIG.baseUrl}/players?id=${playerId}&season=${currentSeason - 1}`,
        fetchOptions
      );

      if (prevResult.ok && prevResult.data) {
        const prevData = prevResult.data as { response?: Array<{ statistics?: Array<{ team?: { id: number } }> }> };
        teamId = prevData.response?.[0]?.statistics?.[0]?.team?.id;
      }
    }

    if (!teamId) {
      if (staleEntry) {
        const limitedData = limit > 0 ? staleEntry.data.slice(0, limit) : staleEntry.data;
        return {
          data: limitedData,
          status: 'stale',
          message: '선수의 팀 정보를 찾을 수 없어 이전 데이터를 표시합니다',
          cached: true,
          stale: true,
          seasonUsed: currentSeason
        };
      }
      return { data: [], status: 'error', message: '선수의 팀 정보를 찾을 수 없습니다' };
    }

    // 최종 캐시 키 (teamId 포함)
    const finalCacheKey = createCacheKey(playerId, currentSeason, teamId);

    // 2. 팀 경기 목록 조회
    const fixturesUrl = `${API_CONFIG.baseUrl}/fixtures?team=${teamId}&season=${currentSeason}&from=${currentSeason}-07-01&to=${Number(currentSeason) + 1}-06-30`;
    const fixturesResult = await fetchWithRateLimit(fixturesUrl, fetchOptions);

    if (!fixturesResult.ok || !fixturesResult.data) {
      if (staleEntry) {
        const limitedData = limit > 0 ? staleEntry.data.slice(0, limit) : staleEntry.data;
        return {
          data: limitedData,
          status: 'stale',
          message: '경기 목록을 가져오지 못해 이전 데이터를 표시합니다',
          cached: true,
          stale: true,
          seasonUsed: currentSeason
        };
      }
      return { data: [], status: 'error', message: `경기 목록 조회 실패: ${fixturesResult.error}` };
    }

    const fixturesData = fixturesResult.data as { response?: ApiFixture[] };
    const allFixtures = fixturesData.response || [];

    if (allFixtures.length === 0) {
      // 빈 결과도 완전한 데이터로 캐시
      saveToCache(finalCacheKey, {
        timestamp: Date.now(),
        data: [],
        totalFixtures: 0,
        failedFixtureIds: []
      }, true);

      return {
        data: [],
        status: 'success',
        message: `${currentSeason} 시즌 경기 기록이 없습니다`,
        seasonUsed: currentSeason
      };
    }

    // FT 상태인 경기만 필터링
    const completedFixtures = allFixtures.filter(f => f.fixture.status.short === 'FT');
    const totalFixtures = completedFixtures.length;

    // 3. 각 경기의 선수 통계 가져오기 (청크 + 딜레이)
    const fixturesWithStats: Array<FixtureWithStats | null> = [];
    const failedFixtureIds: number[] = [];

    for (let i = 0; i < completedFixtures.length; i += API_CONFIG.chunkSize) {
      const chunk = completedFixtures.slice(i, i + API_CONFIG.chunkSize);

      // 청크 간 딜레이
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.chunkDelay));
      }

      const chunkResults = await Promise.all(
        chunk.map(async (fixture) => {
          const fixtureId = fixture.fixture.id;

          const statsResult = await fetchWithRateLimit(
            `${API_CONFIG.baseUrl}/fixtures/players?fixture=${fixtureId}`,
            fetchOptions
          );

          if (!statsResult.ok || !statsResult.data) {
            console.error(`[fetchPlayerFixtures] Failed fixture ${fixtureId}: ${statsResult.error}`);
            failedFixtureIds.push(fixtureId);
            return null;
          }

          const statsData = statsResult.data as {
            response?: Array<{
              players: Array<{
                player: { id: number };
                statistics: Array<{
                  games?: { minutes?: number; rating?: number | null; position?: string | null; number?: number | null };
                  shots?: { total?: number; on?: number };
                  goals?: { total?: number; assists?: number; conceded?: number; saves?: number | null };
                  passes?: { total?: number; key?: number; accuracy?: string };
                  cards?: { yellow?: number; red?: number };
                }>;
              }>;
            }>;
          };

          // 선수 통계 찾기
          let playerStats = null;
          for (const teamStats of statsData.response || []) {
            const found = teamStats.players.find(p => p.player.id === playerId);
            if (found) {
              playerStats = found.statistics[0];
              break;
            }
          }

          // 선수가 참여하지 않은 경기는 건너뛰기 (실패 아님)
          if (!playerStats) return null;

          const defaultStats = {
            games: { minutes: 0, rating: null, position: null, number: null },
            shots: { total: 0, on: 0 },
            goals: { total: 0, assists: 0, conceded: 0, saves: null },
            passes: { total: 0, key: 0, accuracy: "0" },
            cards: { yellow: 0, red: 0 }
          };

          return {
            fixture: {
              id: fixture.fixture.id,
              date: fixture.fixture.date,
              status: fixture.fixture.status,
              timestamp: fixture.fixture.timestamp
            },
            league: {
              id: fixture.league.id,
              name: fixture.league.name,
              logo: fixture.league.logo,
              country: fixture.league.country || ''
            },
            teams: {
              home: { id: fixture.teams.home.id, name: fixture.teams.home.name, logo: fixture.teams.home.logo },
              away: { id: fixture.teams.away.id, name: fixture.teams.away.name, logo: fixture.teams.away.logo },
              playerTeamId: teamId
            },
            goals: {
              home: fixture.goals.home?.toString() || '0',
              away: fixture.goals.away?.toString() || '0'
            },
            statistics: {
              games: { ...defaultStats.games, ...(playerStats?.games || {}) },
              shots: { ...defaultStats.shots, ...(playerStats?.shots || {}) },
              goals: { ...defaultStats.goals, ...(playerStats?.goals || {}) },
              passes: { ...defaultStats.passes, ...(playerStats?.passes || {}) },
              cards: { ...defaultStats.cards, ...(playerStats?.cards || {}) }
            }
          } as FixtureWithStats;
        })
      );

      fixturesWithStats.push(...chunkResults);
    }

    // 유효한 경기 필터링 (출전 시간 > 0)
    const validFixtures = fixturesWithStats
      .filter((f): f is FixtureWithStats => f !== null && (f.statistics?.games?.minutes || 0) > 0)
      .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime());

    const isComplete = failedFixtureIds.length === 0;

    // 캐시에 저장
    const cacheEntry: CacheEntry = {
      timestamp: Date.now(),
      data: validFixtures as unknown as FixtureData[],
      totalFixtures,
      failedFixtureIds
    };

    saveToCache(finalCacheKey, cacheEntry, isComplete);

    // 결과 반환
    const limitedFixtures = limit > 0 ? validFixtures.slice(0, limit) : validFixtures;

    return {
      data: limitedFixtures as unknown as FixtureData[],
      status: isComplete ? 'success' : 'partial',
      message: isComplete
        ? (limitedFixtures.length > 0 ? '경기 기록을 찾았습니다' : `${currentSeason} 시즌 경기 기록이 없습니다`)
        : `일부 경기 데이터 로딩 실패 (${failedFixtureIds.length}건)`,
      cached: false,
      seasonUsed: currentSeason,
      completeness: {
        total: totalFixtures,
        success: validFixtures.length,
        failed: failedFixtureIds.length,
        failedFixtureIds: failedFixtureIds.length > 0 ? failedFixtureIds : undefined
      }
    };

  } catch (error) {
    console.error('[fetchPlayerFixtures] Fatal error:', error);

    // 치명적 에러 시 stale 데이터 반환
    if (staleEntry) {
      const limitedData = limit > 0 ? staleEntry.data.slice(0, limit) : staleEntry.data;
      return {
        data: limitedData,
        status: 'stale',
        message: '오류가 발생하여 이전 데이터를 표시합니다',
        cached: true,
        stale: true,
        seasonUsed: currentSeason
      };
    }

    return {
      data: [],
      status: 'error',
      message: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

/**
 * 캐싱을 적용한 선수 경기 기록 가져오기
 */
export const fetchCachedPlayerFixtures = cache(fetchPlayerFixtures);
