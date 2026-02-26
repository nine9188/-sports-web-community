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
  requestTimeout: 10000,
  maxConcurrency: 3,
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
      return { data: [], status: 'error', message: '선수의 팀 정보를 찾을 수 없습니다' };
    }

    // 2. 팀 경기 목록 조회
    const fixturesUrl = `${API_CONFIG.baseUrl}/fixtures?team=${teamId}&season=${currentSeason}&from=${currentSeason}-07-01&to=${Number(currentSeason) + 1}-06-30`;
    const fixturesResult = await fetchWithRateLimit(fixturesUrl, fetchOptions);

    if (!fixturesResult.ok || !fixturesResult.data) {
      return { data: [], status: 'error', message: `경기 목록 조회 실패: ${fixturesResult.error}` };
    }

    const fixturesData = fixturesResult.data as { response?: ApiFixture[] };
    const allFixtures = fixturesData.response || [];

    if (allFixtures.length === 0) {
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

    // 3. 선수 통계 가져오기 (ids 파라미터로 한 번에 20개씩 요청 - 최적화!)
    const fixturesWithStats: Array<FixtureWithStats | null> = [];
    const failedFixtureIds: number[] = [];

    // fixture ID 목록 추출
    const fixtureIds = completedFixtures.map(f => f.fixture.id);

    // 20개씩 청크로 나눠서 요청 (API 제한)
    const BATCH_SIZE = 20;

    for (let i = 0; i < fixtureIds.length; i += BATCH_SIZE) {
      const batchIds = fixtureIds.slice(i, i + BATCH_SIZE);
      const idsParam = batchIds.join('-');

      // 청크 간 딜레이
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.chunkDelay));
      }

      // 한 번에 여러 경기 데이터 요청 (players 통계 포함)
      const batchResult = await fetchWithRateLimit(
        `${API_CONFIG.baseUrl}/fixtures?ids=${idsParam}`,
        fetchOptions
      );

      if (!batchResult.ok || !batchResult.data) {
        console.error(`[fetchPlayerFixtures] Batch request failed: ${batchResult.error}`);
        failedFixtureIds.push(...batchIds);
        continue;
      }

      const batchData = batchResult.data as {
        response?: Array<{
          fixture: { id: number; date: string; timestamp: number; status: { short: string; [key: string]: string | number | boolean } };
          league: { id: number; name: string; logo: string; country?: string };
          teams: {
            home: { id: number; name: string; logo: string };
            away: { id: number; name: string; logo: string };
          };
          goals: { home: number | null; away: number | null };
          players?: Array<{
            team: { id: number };
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
        }>;
      };

      // 각 경기에서 선수 통계 추출
      for (const fixtureData of batchData.response || []) {
        // 선수 통계 찾기
        let playerStats = null;

        if (fixtureData.players) {
          for (const teamPlayers of fixtureData.players) {
            const found = teamPlayers.players.find(p => p.player.id === playerId);
            if (found) {
              playerStats = found.statistics[0];
              break;
            }
          }
        }

        // 선수가 참여하지 않은 경기는 건너뛰기 (실패 아님)
        if (!playerStats) continue;

        const defaultStats = {
          games: { minutes: 0, rating: null, position: null, number: null },
          shots: { total: 0, on: 0 },
          goals: { total: 0, assists: 0, conceded: 0, saves: null },
          passes: { total: 0, key: 0, accuracy: "0" },
          cards: { yellow: 0, red: 0 }
        };

        fixturesWithStats.push({
          fixture: {
            id: fixtureData.fixture.id,
            date: fixtureData.fixture.date,
            status: fixtureData.fixture.status,
            timestamp: fixtureData.fixture.timestamp
          },
          league: {
            id: fixtureData.league.id,
            name: fixtureData.league.name,
            logo: fixtureData.league.logo,
            country: fixtureData.league.country || ''
          },
          teams: {
            home: { id: fixtureData.teams.home.id, name: fixtureData.teams.home.name, logo: fixtureData.teams.home.logo },
            away: { id: fixtureData.teams.away.id, name: fixtureData.teams.away.name, logo: fixtureData.teams.away.logo },
            playerTeamId: teamId
          },
          goals: {
            home: fixtureData.goals.home?.toString() || '0',
            away: fixtureData.goals.away?.toString() || '0'
          },
          statistics: {
            games: { ...defaultStats.games, ...(playerStats?.games || {}) },
            shots: { ...defaultStats.shots, ...(playerStats?.shots || {}) },
            goals: { ...defaultStats.goals, ...(playerStats?.goals || {}) },
            passes: { ...defaultStats.passes, ...(playerStats?.passes || {}) },
            cards: { ...defaultStats.cards, ...(playerStats?.cards || {}) }
          }
        } as FixtureWithStats);
      }
    }

    // 유효한 경기 필터링 (출전 시간 > 0)
    const validFixtures = fixturesWithStats
      .filter((f): f is FixtureWithStats => f !== null && (f.statistics?.games?.minutes || 0) > 0)
      .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime());

    const isComplete = failedFixtureIds.length === 0;

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
