/**
 * Football API 통합 Fetch 함수
 *
 * - 캐시 키 안정성 보장 (URL 정규화)
 * - TTL 정책 자동 적용 (endpoint + params 기반)
 * - API 제공자 자동 감지 (apisports / rapidapi)
 * - 개발 환경 로깅 (reason 포함)
 * - 429/5xx 재시도 (exponential backoff)
 *
 * @see docs/refactoring/api-caching-strategy.md
 */

import {
  buildFootballApiUrlFromClean,
  normalizeParams,
  API_CACHE_POLICY,
  getMatchCacheTTL,
  type CleanParams,
} from './apiCache';

// =============================================================================
// Types
// =============================================================================

export interface FetchOptions {
  /** TTL 직접 지정 (정책 오버라이드) */
  ttl?: number;
  /** 경기 상태 (동적 TTL 계산용) */
  matchStatus?: string;
  /** 경기 시작 시간 (동적 TTL 계산용) - seconds 또는 milliseconds */
  matchTimestamp?: number;
  /** 캐시 태그 (추가) */
  tags?: string[];
}

/**
 * 정책 결정 결과 (reason 포함 - 디버깅용)
 */
interface CachePolicyResult {
  ttl: number;
  tags: string[];
  reason: string; // TTL 결정 사유
}

/**
 * API 응답 기본 타입
 */
interface FootballApiResponse<T = unknown> {
  get?: string;
  parameters?: Record<string, string>;
  errors?: Record<string, string> | string[];
  results?: number;
  paging?: {
    current: number;
    total: number;
  };
  response: T;
}

// =============================================================================
// Configuration
// =============================================================================

const API_KEY = process.env.FOOTBALL_API_KEY || '';

/**
 * API 제공자 타입
 * - 'apisports': api-sports.io 직접 호출 (x-apisports-key)
 * - 'rapidapi': RapidAPI 경유 (x-rapidapi-key + x-rapidapi-host)
 */
const API_PROVIDER = (process.env.FOOTBALL_API_PROVIDER || 'rapidapi') as
  | 'apisports'
  | 'rapidapi';

/**
 * 캐시 태그 활성화 여부 (운영 안전장치)
 * - 태그 기능은 추후 고려 → env로 on/off 가능하게
 * - 기본값: false (안전)
 */
const ENABLE_CACHE_TAGS = process.env.ENABLE_CACHE_TAGS === 'true';

/**
 * 재시도 횟수
 */
const MAX_RETRIES = 2;

// =============================================================================
// Policy Resolution
// =============================================================================

/**
 * 정책 결정 함수 (endpoint + params 기반)
 *
 * ⚠️ 중요:
 * - endpoint만으로 매칭하면 'fixtures' + { live: 'all' }이 기본 TTL로 떨어짐
 * - CleanParams (정규화된 params)를 사용해야 URL 빌더와 동일 기준
 */
function resolveCachePolicy(
  endpoint: string,
  params: CleanParams,
  options: FetchOptions
): CachePolicyResult {
  // 1. 명시적 TTL 지정 시 우선
  if (options.ttl !== undefined) {
    return { ttl: options.ttl, tags: options.tags || [], reason: 'EXPLICIT_TTL' };
  }

  // 2. 경기 상태 기반 동적 TTL (fixtures 관련)
  if (endpoint === 'fixtures' || endpoint.startsWith('fixtures/')) {
    // 라이브 경기 요청 (live=all)
    // ⚠️ no-store(0)가 아니라 15초 캐시 → 비용 절감
    if (params.live) {
      return { ttl: 15, tags: ['live'], reason: 'LIVE_PARAM' };
    }

    // 특정 경기 조회
    if (params.id) {
      // 상태 있으면 동적 TTL
      if (options.matchStatus) {
        const ttl = getMatchCacheTTL(options.matchStatus, options.matchTimestamp);
        return { ttl, tags: [`match:${params.id}`], reason: `STATUS_${options.matchStatus}` };
      }
      // ⚠️ 상태 모르면 안전하게 짧은 TTL (60초)
      return { ttl: 60, tags: [`match:${params.id}`], reason: 'STATUS_UNKNOWN' };
    }

    // 날짜별 경기 목록
    if (params.date) {
      return { ttl: 900, tags: ['fixtures'], reason: 'DATE_QUERY' };
    }
  }

  // 3. 정책 테이블에서 조회
  const policy = API_CACHE_POLICY[endpoint as keyof typeof API_CACHE_POLICY];
  if (policy) {
    return { ttl: policy.ttl, tags: [...policy.tags], reason: `POLICY_${endpoint.toUpperCase()}` };
  }

  // 4. 기본값
  return { ttl: 900, tags: [], reason: 'DEFAULT' };
}

// =============================================================================
// Fetch Function
// =============================================================================

/**
 * Football API 통합 fetch 함수
 *
 * @param endpoint API 엔드포인트 (예: 'fixtures', 'teams', 'standings')
 * @param params 쿼리 파라미터
 * @param options 추가 옵션 (TTL, matchStatus, tags)
 * @returns API 응답 데이터
 *
 * @example
 * // 기본 사용
 * const data = await fetchFootball('teams', { id: '33' });
 *
 * // 경기 상태 기반 동적 TTL
 * const match = await fetchFootball('fixtures', { id: '123456' }, {
 *   matchStatus: '1H',
 *   matchTimestamp: 1737280800
 * });
 *
 * // 명시적 TTL 지정
 * const live = await fetchFootball('fixtures', { live: 'all' }, { ttl: 30 });
 */
export async function fetchFootball<T = unknown>(
  endpoint: string,
  params: Record<string, string | number | boolean | undefined | null> = {},
  options: FetchOptions = {}
): Promise<FootballApiResponse<T>> {
  // 1. params 정규화 (한 번만!)
  const clean = normalizeParams(params);

  // 2. URL 빌드 (정규화된 params 사용 - 중복 정규화 방지)
  const url = buildFootballApiUrlFromClean(endpoint, clean);

  // 3. 정책 결정 (동일한 clean params 사용)
  const { ttl, tags, reason } = resolveCachePolicy(endpoint, clean, options);

  // 4. fetch 옵션 구성 (API 제공자별 헤더)
  const headers: Record<string, string> =
    API_PROVIDER === 'apisports'
      ? { 'x-apisports-key': API_KEY }
      : {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': API_KEY,
        };

  const fetchOptions: RequestInit & { next?: { revalidate?: number; tags?: string[] } } = {
    headers,
  };

  // tags 병합 (정책 tags + 옵션 tags)
  const mergedTags = Array.from(new Set([...(tags ?? []), ...(options.tags ?? [])]));

  if (ttl === 0) {
    fetchOptions.cache = 'no-store';
  } else {
    fetchOptions.next = { revalidate: ttl };
    // ⚠️ tags는 env 토글로 제어 (운영 안전장치)
    if (mergedTags.length && ENABLE_CACHE_TAGS) {
      fetchOptions.next.tags = mergedTags;
    }
  }

  // 5. 개발 환경 로깅 (reason 포함)
  if (process.env.NODE_ENV === 'development') {
    const cacheMode = ttl === 0 ? 'no-store' : `revalidate:${ttl}s`;
    console.log('[FootballAPI]', {
      endpoint,
      params: clean,
      ttl,
      reason, // ← TTL 결정 사유
      cacheMode,
      tags: ENABLE_CACHE_TAGS ? mergedTags : '(disabled)',
    });
  }

  // 6. fetch 실행 (429/5xx 재시도 옵션)
  let response: Response | null = null;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      response = await fetch(url, fetchOptions);

      // 429 (Rate Limit) 또는 5xx만 재시도
      if (response.status === 429 || response.status >= 500) {
        if (attempt < MAX_RETRIES) {
          // 재시도 전 대기 (exponential backoff)
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
      }

      // 성공 또는 4xx (재시도 불필요)
      break;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt === MAX_RETRIES) break;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }

  if (!response || !response.ok) {
    throw lastError || new Error(`Football API Error: ${response?.status} - ${endpoint}`);
  }

  // 응답은 이미 JSON이므로 추가 직렬화 불필요
  return response.json();
}

// =============================================================================
// Helper Exports
// =============================================================================

// Re-export utilities for convenience
export { normalizeParams, normalizeDate, getCurrentSeason } from './apiCache';
export type { CleanParams } from './apiCache';
