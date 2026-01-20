/**
 * API 캐싱 유틸리티
 *
 * Football API 캐싱 전략의 핵심 유틸리티 모듈
 * - URL 빌더 (캐시 키 안정성 보장)
 * - TTL 정책 테이블
 * - 동적 TTL 계산
 *
 * @see docs/refactoring/api-caching-strategy.md
 */

// =============================================================================
// API Base URL
// =============================================================================

export const API_BASE_URL = 'https://v3.football.api-sports.io';

// =============================================================================
// Types
// =============================================================================

/**
 * 정규화된 파라미터 타입
 * - URL 빌더와 정책 결정 모두 이 타입 기준
 * - 캐시 키 일관성 보장
 */
export type CleanParams = Record<string, string>;

/**
 * 캐시 정책 항목
 */
interface CachePolicy {
  ttl: number;
  tags: string[];
}

// =============================================================================
// Parameter Normalization
// =============================================================================

/**
 * 파라미터 정규화 함수
 * - 빈 값 제거 (undefined, null, '')
 * - String 변환
 * - footballApi.ts에서도 import해서 사용
 */
export function normalizeParams(
  params: Record<string, string | number | boolean | undefined | null>
): CleanParams {
  const out: CleanParams = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    out[k] = String(v);
  }
  return out;
}

// =============================================================================
// URL Builders
// =============================================================================

/**
 * URL 빌더 (이미 정규화된 CleanParams용)
 * - fetchFootball()에서 한 번 정규화 후 이 함수 사용
 * - 중복 정규화 방지
 * - 키 알파벳 순 정렬로 캐시 키 안정성 보장
 */
export function buildFootballApiUrlFromClean(
  endpoint: string,
  cleanParams: CleanParams
): string {
  // 키 알파벳 순 정렬
  const sortedKeys = Object.keys(cleanParams).sort();

  // URLSearchParams 생성
  const searchParams = new URLSearchParams();
  for (const key of sortedKeys) {
    searchParams.append(key, cleanParams[key]);
  }

  // 슬래시 중복 방지
  const normalizedEndpoint = endpoint.replace(/^\/+/, '');

  const queryString = searchParams.toString();
  return queryString
    ? `${API_BASE_URL}/${normalizedEndpoint}?${queryString}`
    : `${API_BASE_URL}/${normalizedEndpoint}`;
}

/**
 * URL 빌더 (raw params용 - 편의 함수)
 * - 내부에서 normalizeParams 호출
 * - 단독 사용 시 편리
 */
export function buildFootballApiUrl(
  endpoint: string,
  params: Record<string, string | number | boolean | undefined | null>
): string {
  return buildFootballApiUrlFromClean(endpoint, normalizeParams(params));
}

// =============================================================================
// Date/Season Utilities
// =============================================================================

/**
 * 날짜 포맷 정규화 (KST 기준 YYYY-MM-DD)
 *
 * ⚠️ 주의: getTime() + 9h 방식은 이중 보정 위험
 * ✅ Intl.DateTimeFormat 사용으로 서버/클라이언트 상관없이 안전
 */
export function normalizeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  // Intl 기반 KST 변환 (이중 보정 방지)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
  // 결과: "2026-01-19" (YYYY-MM-DD)
}

/**
 * 시즌 정규화 (자동 계산)
 * - 7월 이후면 현재 연도
 * - 7월 이전이면 작년
 */
export function getCurrentSeason(): number {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  // 7월 이후면 현재 연도, 아니면 작년
  return month >= 6 ? year : year - 1;
}

// =============================================================================
// Cache Policy Table
// =============================================================================

/**
 * 엔드포인트별 캐시 정책 테이블
 *
 * TTL 단위: 초
 * - STATIC (24h): 거의 변경 안 됨
 * - SEMI_STATIC (1h): 시즌 중 가끔 변경
 * - SEMI_REALTIME (15m): 경기 전후 변경
 * - LIVE (15s): 경기 중 (비용 절감을 위해 no-store 대신 짧은 TTL)
 */
export const API_CACHE_POLICY: Record<string, CachePolicy> = {
  // === 정적 데이터 (24시간) ===
  'teams': { ttl: 86400, tags: ['team'] },
  'venues': { ttl: 86400, tags: ['venue'] },
  'leagues': { ttl: 86400, tags: ['league'] },
  'players': { ttl: 86400, tags: ['player'] },
  'countries': { ttl: 86400, tags: ['country'] },
  'timezone': { ttl: 86400, tags: ['timezone'] },

  // === 준정적 데이터 (1시간) ===
  'standings': { ttl: 3600, tags: ['standings'] },
  'teams/statistics': { ttl: 3600, tags: ['team-stats'] },
  'players/squads': { ttl: 3600, tags: ['squad'] },
  'players/seasons': { ttl: 3600, tags: ['player-seasons'] },
  'players/profiles': { ttl: 3600, tags: ['player-profile'] },
  'trophies': { ttl: 3600, tags: ['trophies'] },
  'transfers': { ttl: 3600, tags: ['transfers'] },
  'coaches': { ttl: 3600, tags: ['coach'] },
  'coachs': { ttl: 3600, tags: ['coach'] }, // api-sports uses 'coachs' (typo)

  // === 준실시간 데이터 (15분) ===
  'fixtures': { ttl: 900, tags: ['fixture'] }, // 기본값
  'fixtures/statistics': { ttl: 900, tags: ['match-stats'] },
  'fixtures/events': { ttl: 900, tags: ['match-events'] },
  'fixtures/lineups': { ttl: 900, tags: ['match-lineups'] },
  'fixtures/players': { ttl: 900, tags: ['match-players'] },
  'fixtures/headtohead': { ttl: 900, tags: ['h2h'] },
  'injuries': { ttl: 900, tags: ['injuries'] },
  'predictions': { ttl: 900, tags: ['predictions'] },
  'odds': { ttl: 900, tags: ['odds'] },

  // === 실시간 (15초 캐시 - 비용 절감) ===
  // ⚠️ no-store(0)가 아니라 15초 → API 호출 대폭 감소
  'fixtures/live': { ttl: 15, tags: ['live'] },
} as const;

// =============================================================================
// Dynamic TTL Calculation
// =============================================================================

/**
 * 경기 상태 + 시간 기반 TTL 결정
 *
 * @param status api-sports status code (1H, 2H, HT, FT, NS, etc.)
 * @param matchTimestamp 경기 시작 시간 (seconds 또는 milliseconds)
 *
 * ⚠️ 단위 주의: api-sports는 Unix seconds로 반환
 *    - 입력이 10자리(seconds)면 * 1000으로 자동 변환
 *    - 입력이 13자리(milliseconds)면 그대로 사용
 */
export function getMatchCacheTTL(
  status: string,
  matchTimestamp?: number
): number {
  const now = Date.now();

  // ⚠️ api-sports timestamp는 seconds → milliseconds로 변환
  // 10자리면 seconds, 13자리면 milliseconds
  const timestampMs = matchTimestamp
    ? matchTimestamp < 10000000000
      ? matchTimestamp * 1000
      : matchTimestamp
    : undefined;

  // 라이브 상태들
  const liveStatuses = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT'];
  if (liveStatuses.includes(status)) {
    return 30; // 30초
  }

  // 종료 직후 window (FT 후 10분 이내)
  // 통계 정정/최종 반영 대기
  if (status === 'FT' && timestampMs) {
    const matchEnd = timestampMs + 105 * 60 * 1000; // 경기 시작 + 105분
    const minutesSinceEnd = (now - matchEnd) / (60 * 1000);

    if (minutesSinceEnd < 10) {
      return 120; // 2분 (통계 정정 반영)
    }
    if (minutesSinceEnd < 60) {
      return 300; // 5분
    }
  }

  // 종료된 경기 (FT, AET, PEN, AWD, WO)
  const finishedStatuses = ['FT', 'AET', 'PEN', 'AWD', 'WO'];
  if (finishedStatuses.includes(status)) {
    return 900; // 15분
  }

  // 경기 전 (NS, TBD, PST)
  const preMatchStatuses = ['NS', 'TBD', 'PST', 'SUSP', 'CANC'];
  if (preMatchStatuses.includes(status)) {
    // 경기 시작 30분 전부터는 짧게
    if (timestampMs) {
      const minutesToStart = (timestampMs - now) / (60 * 1000);
      if (minutesToStart < 30) {
        return 60; // 1분
      }
    }
    return 900; // 15분
  }

  // 기본값
  return 900;
}
