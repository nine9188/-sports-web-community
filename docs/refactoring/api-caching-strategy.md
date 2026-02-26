# 외부 API 캐싱 강화 전략

## 1. 개요

api-sports.io (Football API) 호출을 최적화하여 API 비용을 70% 이상 절감하기 위한 캐싱 전략 문서입니다.

**작성일:** 2026-01-19
**관련 태스크:** #11 (code-review-2026-01-17.md)
**예상 효과:** API 호출 70% 절감, 응답 속도 향상
**예상 소요:** 3-5일

---

## 2. 현재 상태 분석

### 2.1 API 사용 파일 (40+ 개)

```
livescore/actions/
├── footballApi.ts          ← 핵심 API 클라이언트 (835줄)
├── footballTeamsSync.ts    ← 팀 동기화
├── match/
│   ├── eventData.ts
│   ├── lineupData.ts
│   ├── matchPlayerStats.ts
│   ├── playerStats.ts
│   ├── standingsData.ts
│   └── statsData.ts
├── player/
│   ├── data.ts, fixtures.ts, injuries.ts
│   ├── player.ts, rankings.ts, stats.ts
│   ├── transfers.ts, trophies.ts
├── teams/
│   ├── matches.ts, player-stats.ts
│   ├── squad.ts, standings.ts, team.ts
└── transfers/
    └── index.ts
```

### 2.2 현재 캐싱 상태

> **2026-02-26 업데이트**: 아래는 2026-01-19 작성 시점의 상태입니다.
> 현재는 `fetchFromFootballApi`가 endpoint별 `next: { revalidate }` TTL을 적용하는 단일 캐시 레이어로 통합되었습니다.
> 자세한 내용은 [섹션 12.2](#122-2026-02-26-캐시-정리)를 참조하세요.

| 구분 | ~~2026-01 상태~~ | 2026-02 현재 |
|------|------|--------|
| `footballApi.ts` | ~~메모리 캐시 1분 TTL~~ | endpoint별 `next: { revalidate }` |
| `fetchFromFootballApi()` | ~~`cache: 'no-store'`~~ | `next: { revalidate: getRevalidateTime(endpoint) }` |
| 팀/선수 API | ~~`cache: 'no-store'`~~ | `fetchFromFootballApi` 사용 (TTL 자동 적용) |
| React `cache()` | 일부 적용 | 유지 (요청 내 중복 제거) |

### 2.3 핵심 문제: 팬아웃 중복 호출

```
경기 상세 페이지 호출 구조 (현재):
┌─────────────────────────────────────────┐
│  MatchDetailPage                         │
├─────────────────────────────────────────┤
│  ├── fetchMatchDetails()     → /fixtures │  ← 1회
│  ├── LineupTab                           │
│  │   └── fetchLineups()      → /fixtures │  ← 중복!
│  ├── StatsTab                            │
│  │   └── fetchStats()        → /statistics │
│  ├── EventsTab                           │
│  │   └── fetchEvents()       → /events    │
│  └── H2HTab                              │
│      └── fetchH2H()          → /h2h       │
└─────────────────────────────────────────┘
문제: 같은 endpoint를 여러 컴포넌트에서 각자 호출
```

---

## 3. 캐싱 전제 조건 (⚠️ 중요)

### 3.1 Next.js Data Cache 동작 조건

**캐시가 작동하는 조건:**
- 동일 URL + 동일 옵션 + 동일 런타임
- `fetch(..., { next: { revalidate } })` 사용
- 정적 렌더링 또는 ISR 경로

**캐시가 무력화되는 조건 (반드시 피할 것):**
```typescript
// ❌ 캐시 무효화 패턴들
cookies()    // → dynamic rendering
headers()    // → dynamic rendering
cache: 'no-store'  // → 명시적 비활성화
searchParams를 읽는 페이지  // → dynamic
사용자별 토큰/쿠키 기반 분기  // → 캐시 키 폭발
```

**✅ 권장 패턴:**
```typescript
// API 호출은 "인증 불필요한 공개 데이터" 경로로 분리
// 사용자 인증이 필요한 로직과 API fetch를 분리

// Good: 순수 데이터 fetch (캐시 가능)
async function fetchTeamData(teamId: string) {
  return fetch(url, { next: { revalidate: 86400 } });
}

// Good: 인증 로직은 별도 레이어
async function getTeamPageData(teamId: string) {
  const [teamData, userPrefs] = await Promise.all([
    fetchTeamData(teamId),        // 캐시됨
    getUserPreferences()           // 사용자별
  ]);
}
```

### 3.2 2단계 캐싱 전략

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: Request Scope (React cache)                    │
│  - 같은 요청 내 중복 호출 제거                            │
│  - 컴포넌트 A, B가 같은 함수 호출 → 1회만 실행           │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  Layer 2: Cross-Request Scope (Next.js Data Cache)       │
│  - 여러 요청 간 재사용                                    │
│  - fetch(..., { next: { revalidate } })                  │
│  - TTL 기반 자동 갱신                                    │
└─────────────────────────────────────────────────────────┘
```

**구현 패턴:**
```typescript
import { cache } from 'react';

// Layer 1: React cache (요청 내 중복 제거)
export const getTeamData = cache(async (teamId: string) => {
  // Layer 2: Next.js Data Cache (요청 간 재사용)
  const response = await fetch(url, {
    next: { revalidate: 86400 }  // 24시간
  });
  return response.json();
});
```

---

## 4. 데이터 분류 및 TTL 설계

### 4.1 데이터 유형별 분류

| 유형 | 설명 | 예시 | TTL |
|------|------|------|-----|
| **STATIC** | 거의 변경 안 됨 | 팀 정보, 경기장, 리그 | 24시간 |
| **SEMI_STATIC** | 시즌 중 가끔 변경 | 스쿼드, 시즌 순위 | 1시간 |
| **SEMI_REALTIME** | 경기 전후 변경 | 종료 경기, 일정 | 15분 |
| **POST_MATCH** | 종료 직후 (정정 가능) | FT 후 5-10분 | 2분 |
| **LIVE** | 경기 중 | 라이브 스코어, 이벤트 | 30초 |

### 4.2 엔드포인트별 정책 테이블

```typescript
// src/shared/utils/apiCache.ts

export const API_CACHE_POLICY = {
  // === 정적 데이터 (24시간) ===
  'teams': { ttl: 86400, tags: ['team'] },
  'venues': { ttl: 86400, tags: ['venue'] },
  'leagues': { ttl: 86400, tags: ['league'] },
  'players': { ttl: 86400, tags: ['player'] },

  // === 준정적 데이터 (1시간) ===
  'standings': { ttl: 3600, tags: ['standings'] },
  'teams/statistics': { ttl: 3600, tags: ['team-stats'] },
  'players/squads': { ttl: 3600, tags: ['squad'] },
  'trophies': { ttl: 3600, tags: ['trophies'] },

  // === 준실시간 데이터 (15분) ===
  'fixtures': { ttl: 900, tags: ['fixture'] },  // 기본값
  'fixtures/statistics': { ttl: 900, tags: ['match-stats'] },
  'fixtures/events': { ttl: 900, tags: ['match-events'] },
  'fixtures/lineups': { ttl: 900, tags: ['match-lineups'] },

  // === 실시간 (15초 캐시 - 비용 절감) ===
  // ⚠️ no-store(0)가 아니라 15초 → API 호출 대폭 감소
  'fixtures/live': { ttl: 15, tags: ['live'] },
} as const;
```

### 4.3 경기 상태 기반 동적 TTL

```typescript
/**
 * 경기 상태 + 시간 기반 TTL 결정
 *
 * @param status api-sports status code (1H, 2H, HT, FT, NS, etc.)
 * @param matchTimestamp 경기 시작 시간
 *
 * ⚠️ 단위 주의: api-sports는 Unix seconds로 반환
 *    - 입력이 seconds면 * 1000으로 변환 필요
 *    - 이 함수는 milliseconds 기준으로 동작
 */
export function getMatchCacheTTL(
  status: string,
  matchTimestamp?: number
): number {
  const now = Date.now();

  // ⚠️ api-sports timestamp는 seconds → milliseconds로 변환
  // 10자리면 seconds, 13자리면 milliseconds
  const timestampMs = matchTimestamp
    ? (matchTimestamp < 10000000000 ? matchTimestamp * 1000 : matchTimestamp)
    : undefined;

  // 라이브 상태들
  const liveStatuses = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT'];
  if (liveStatuses.includes(status)) {
    return 30; // 30초
  }

  // 종료 직후 window (FT 후 10분 이내)
  // 통계 정정/최종 반영 대기
  if (status === 'FT' && timestampMs) {
    const matchEnd = timestampMs + (105 * 60 * 1000); // 경기 시작 + 105분
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
```

---

## 5. 캐시 키 설계 규칙 (⚠️ 필수)

### 5.1 키 안정성 문제

```typescript
// ❌ 캐시 미스 발생 (파라미터 순서 다름)
fetch('/fixtures?league=39&season=2025')
fetch('/fixtures?season=2025&league=39')  // 다른 캐시 키!

// ❌ 캐시 미스 발생 (불필요한 파라미터)
fetch('/fixtures?league=39&season=2025&timezone=Asia/Seoul')
fetch('/fixtures?league=39&season=2025')  // 다른 캐시 키!
```

### 5.2 URL 빌더 유틸리티

```typescript
// src/shared/utils/apiCache.ts

const API_BASE_URL = 'https://v3.football.api-sports.io';

/**
 * 정규화된 파라미터 타입
 * - URL 빌더와 정책 결정 모두 이 타입 기준
 * - 캐시 키 일관성 보장
 */
export type CleanParams = Record<string, string>;

/**
 * 파라미터 정규화 함수
 * - 빈 값 제거
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

/**
 * URL 빌더 (이미 정규화된 CleanParams용)
 * - fetchFootball()에서 한 번 정규화 후 이 함수 사용
 * - 중복 정규화 방지
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
 */
export function getCurrentSeason(): number {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  // 7월 이후면 현재 연도, 아니면 작년
  return month >= 6 ? year : year - 1;
}
```

---

## 6. 통합 Fetch 함수 설계

### 6.1 핵심 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│  도메인 함수 (의미적 API)                                │
│  getTeamData(), getMatchDetails(), getPlayerStats()     │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  fetchFootball() - 통합 API 클라이언트                   │
│  - URL 빌드 (키 안정성)                                  │
│  - TTL 정책 적용                                        │
│  - 로깅                                                 │
│  - 에러 핸들링                                          │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  Next.js fetch + Data Cache                              │
└─────────────────────────────────────────────────────────┘
```

### 6.2 통합 Fetch 함수

```typescript
// src/shared/utils/footballApi.ts

import {
  buildFootballApiUrlFromClean,
  normalizeParams,
  API_CACHE_POLICY,
  getMatchCacheTTL,
  type CleanParams,
} from './apiCache';

interface FetchOptions {
  /** TTL 직접 지정 (정책 오버라이드) */
  ttl?: number;
  /** 경기 상태 (동적 TTL 계산용) */
  matchStatus?: string;
  /** 경기 시작 시간 (동적 TTL 계산용) */
  matchTimestamp?: number;
  /** 캐시 태그 */
  tags?: string[];
}

const API_KEY = process.env.FOOTBALL_API_KEY || '';

/**
 * API 제공자 타입
 * - 'apisports': api-sports.io 직접 호출 (x-apisports-key)
 * - 'rapidapi': RapidAPI 경유 (x-rapidapi-key + x-rapidapi-host)
 */
const API_PROVIDER = (process.env.FOOTBALL_API_PROVIDER || 'rapidapi') as 'apisports' | 'rapidapi';

/**
 * 캐시 태그 활성화 여부 (운영 안전장치)
 * - 태그 기능은 추후 고려 → env로 on/off 가능하게
 * - 기본값: false (안전)
 */
const ENABLE_CACHE_TAGS = process.env.ENABLE_CACHE_TAGS === 'true';

/**
 * 정책 결정 함수 (endpoint + params 기반)
 *
 * ⚠️ 중요:
 * - endpoint만으로 매칭하면 'fixtures' + { live: 'all' }이 기본 TTL로 떨어짐
 * - CleanParams (정규화된 params)를 사용해야 URL 빌더와 동일 기준
 */
/**
 * 정책 결정 결과 (reason 포함 - 디버깅용)
 */
interface CachePolicyResult {
  ttl: number;
  tags: string[];
  reason: string;  // TTL 결정 사유
}

function resolveCachePolicy(
  endpoint: string,
  params: CleanParams,  // ← 정규화된 params만 받음
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

/**
 * Football API 통합 fetch 함수
 * - 캐시 키 안정성 보장
 * - TTL 정책 자동 적용 (endpoint + params 기반)
 * - API 제공자 자동 감지
 * - 개발 환경 로깅
 */
export async function fetchFootball<T = unknown>(
  endpoint: string,
  params: Record<string, string | number | boolean | undefined | null> = {},
  options: FetchOptions = {}
): Promise<T> {
  // 1. params 정규화 (한 번만!)
  const clean = normalizeParams(params);

  // 2. URL 빌드 (정규화된 params 사용 - 중복 정규화 방지)
  const url = buildFootballApiUrlFromClean(endpoint, clean);

  // 3. 정책 결정 (동일한 clean params 사용)
  const { ttl, tags, reason } = resolveCachePolicy(endpoint, clean, options);

  // 4. fetch 옵션 구성 (API 제공자별 헤더)
  const headers: Record<string, string> = API_PROVIDER === 'apisports'
    ? { 'x-apisports-key': API_KEY }
    : {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': API_KEY,
      };

  const fetchOptions: RequestInit & { next?: { revalidate?: number; tags?: string[] } } = {
    headers,
  };

  // tags 병합 (정책 tags + 옵션 tags)
  const mergedTags = Array.from(new Set([
    ...(tags ?? []),
    ...(options.tags ?? [])
  ]));

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
      reason,  // ← TTL 결정 사유
      cacheMode,
      tags: ENABLE_CACHE_TAGS ? mergedTags : '(disabled)',
    });
  }

  // 6. fetch 실행 (429/5xx 재시도 옵션)
  let response: Response;
  let lastError: Error | null = null;
  const MAX_RETRIES = 2;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      response = await fetch(url, fetchOptions);

      // 429 (Rate Limit) 또는 5xx만 재시도
      if (response.status === 429 || response.status >= 500) {
        if (attempt < MAX_RETRIES) {
          // 재시도 전 대기 (exponential backoff)
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
      }

      // 성공 또는 4xx (재시도 불필요)
      break;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt === MAX_RETRIES) break;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }

  if (!response! || !response.ok) {
    throw lastError || new Error(`Football API Error: ${response?.status} - ${endpoint}`);
  }

  // 응답은 이미 JSON이므로 추가 직렬화 불필요
  return response.json();
}
```

### 6.3 도메인 함수 예시

```typescript
// src/domains/livescore/actions/teams/team.ts
import { cache } from 'react';
import { fetchFootball } from '@/shared/utils/footballApi';

/**
 * 팀 기본 정보 조회 (캐시: 24시간)
 */
export const getTeamData = cache(async (teamId: string) => {
  const data = await fetchFootball('teams', { id: teamId });
  return data.response?.[0] ?? null;
});

/**
 * 팀 시즌 통계 조회 (캐시: 1시간)
 */
export const getTeamStats = cache(async (teamId: string, season: number, leagueId: number) => {
  const data = await fetchFootball('teams/statistics', {
    team: teamId,
    season,
    league: leagueId,
  });
  return data.response ?? null;
});
```

```typescript
// src/domains/livescore/actions/match/details.ts
import { cache } from 'react';
import { fetchFootball } from '@/shared/utils/footballApi';

/**
 * 경기 상세 조회 (상태 기반 동적 TTL)
 */
export const getMatchDetails = cache(async (
  matchId: string,
  status?: string,
  matchTimestamp?: number
) => {
  const data = await fetchFootball(
    'fixtures',
    { id: matchId },
    { matchStatus: status, matchTimestamp }
  );
  return data.response?.[0] ?? null;
});
```

---

## 7. 캐시 무효화 전략

### 7.1 권장 접근법: TTL 중심 (3-5일 구현)

```
┌─────────────────────────────────────────────────────────┐
│  접근법 1: TTL만으로 해결 (권장, 간단)                    │
├─────────────────────────────────────────────────────────┤
│  • 라이브 경기: 30초 TTL → 사실상 즉시 갱신              │
│  • 종료 직후: 2분 TTL → 통계 정정 반영                  │
│  • 순위/스쿼드: 1시간 TTL → 충분히 빠름                  │
│  • 팀/선수 기본: 24시간 → 거의 안 바뀜                   │
│                                                         │
│  장점: 구현 단순, 추가 인프라 불필요                     │
│  단점: "즉시" 무효화 불가 (최대 TTL만큼 지연)            │
└─────────────────────────────────────────────────────────┘
```

### 7.2 고급 접근법: 태그 기반 (추후 고려)

```typescript
// 태그 기반 캐시 무효화 (Next.js 14+)

// 1. fetch 시 태그 지정
const data = await fetchFootball('fixtures', { id: matchId }, {
  tags: [`match:${matchId}`, `team:${homeTeamId}`, `team:${awayTeamId}`]
});

// 2. 무효화 트리거 (서버 액션/API 라우트)
import { revalidateTag } from 'next/cache';

export async function onMatchStart(matchId: string) {
  revalidateTag(`match:${matchId}`);
}

export async function onMatchEnd(matchId: string) {
  revalidateTag(`match:${matchId}`);
}
```

**트리거 옵션:**
- 크론 작업 (매 분 라이브 경기 체크)
- 웹훅 (api-sports 웹훅 지원 시)
- 관리자 액션 (수동 무효화)

### 7.3 현실적인 하이브리드

```typescript
// 대부분: TTL로 해결
// 핵심 경기만: 태그로 즉시 무효화

// 예: 빅매치는 태그 추가
const isBigMatch = BIG_MATCH_LEAGUES.includes(leagueId);
const tags = isBigMatch ? [`match:${matchId}`] : [];

const data = await fetchFootball('fixtures', { id: matchId }, { tags });
```

---

## 8. 구현 계획 (5 Phases)

### Phase 0: 팬아웃 중복 제거 (Day 1) ⭐ 핵심

**목표:** 같은 요청 내 중복 호출 제거

**⚠️ 전략 명확화:**
> "모든 데이터를 한 번에 로드"가 아니라 **"중복 호출만 제거"**가 목표
>
> - SSR: 필요한 최소만 로드 (초기 비용 최소화)
> - 탭 진입 시: 추가 데이터 로드 (lazy loading)
> - 모든 fetch 함수: React cache 래핑 (요청 내 중복 제거)

```typescript
// ❌ Bad: 모든 걸 한 번에 가져오기 (초기 로딩 증가)
const matchData = await getMatchFullData(matchId); // 5-7개 API 동시 호출

// ✅ Good: 필요한 것만 + React cache로 중복 제거
// MatchDetailPage.tsx (SSR)
const basicInfo = await getMatchBasicInfo(matchId); // cache 적용, 1회만
return (
  <MatchHeader data={basicInfo} />
  <Suspense fallback={<Loading />}>
    <StatsTab matchId={matchId} /> {/* 탭 진입 시 lazy 로드 */}
  </Suspense>
);

// StatsTab.tsx (탭 진입 시)
const basicInfo = await getMatchBasicInfo(matchId); // cache 히트, 0회 호출
const stats = await getMatchStats(matchId);         // cache 적용, 1회만
```

**핵심 원칙:**
1. 모든 fetch 함수는 `cache()` 래핑 필수
2. 같은 요청에서 같은 함수 여러 번 호출해도 1회만 실행
3. SSR은 최소 데이터만, 탭/모달은 lazy loading

**작업:**
1. 기존 개별 fetch 함수 → React `cache()` 래핑
2. 중복 호출되는 패턴 분석 및 정리
3. Suspense boundary 추가 (탭별 lazy loading)

### Phase 1: 캐싱 유틸리티 (Day 1)

**파일:** `src/shared/utils/apiCache.ts`

- [ ] `API_CACHE_POLICY` 정책 테이블
- [ ] `buildFootballApiUrl()` URL 빌더
- [ ] `getMatchCacheTTL()` 상태 기반 TTL
- [ ] `normalizeDate()`, `getCurrentSeason()` 유틸

**파일:** `src/shared/utils/footballApi.ts`

- [ ] `fetchFootball()` 통합 fetch 함수
- [ ] 개발 환경 로깅

### Phase 2: 정적 데이터 캐싱 (Day 2)

| 파일 | 현재 | 변경 | TTL |
|------|------|------|-----|
| `teams/team.ts` | `cache: 'no-store'` | `fetchFootball()` 사용 | 24h |
| `player/player.ts` | `cache: 'no-store'` | `fetchFootball()` 사용 | 24h |
| `footballApi.ts` | 개별 fetch | `fetchFootball()` 사용 | 정책별 |

### Phase 3: 준정적 데이터 캐싱 (Day 3)

| 파일 | 현재 | 변경 | TTL |
|------|------|------|-----|
| `teams/standings.ts` | `cache: 'no-store'` | `fetchFootball()` | 1h |
| `teams/squad.ts` | `cache: 'no-store'` | `fetchFootball()` | 1h |
| `teams/player-stats.ts` | `cache: 'no-store'` | `fetchFootball()` | 1h |

### Phase 4: 조건부 캐싱 (Day 4)

- [ ] `fetchMatchesByDate()` - 상태별 TTL
- [ ] `match/*` - 경기 상태 기반 조건부 캐싱
- [ ] 라이브 vs 종료 경기 분기 처리
- [ ] 종료 직후 window (2분 TTL) 적용

### Phase 5: 검증 및 모니터링 (Day 5)

- [ ] 개발 환경 로깅 확인
- [ ] api-sports 대시보드 호출 수 비교
- [ ] 캐시 히트율 추정
- [ ] 문서 업데이트

---

## 9. 모니터링 및 디버깅

### 9.1 개발 환경 로깅

```typescript
// fetchFootball() 내부 로그 형식
console.log('[FootballAPI]', {
  endpoint: 'fixtures',
  params: { id: '123456' },
  ttl: 30,
  cacheMode: 'revalidate:30s',
  tags: ['match:123456'],
  reason: 'LIVE',  // TTL 결정 사유
});
```

### 9.2 측정 지표

| 지표 | 측정 방법 | 목표 |
|------|----------|------|
| API 호출 수 | api-sports 대시보드 | 70% 감소 |
| 캐시 히트율 | 로그 분석 (원격 호출 여부) | 70%+ |
| 응답 속도 | 개발자 도구 Network | 50% 개선 |
| 월 비용 | api-sports 청구서 | $40 절감 |

### 9.3 디버깅 체크리스트

캐시가 안 되는 것 같을 때:
- [ ] `cookies()` / `headers()` 호출 체인 확인
- [ ] `cache: 'no-store'` 누락 확인
- [ ] URL 파라미터 순서 확인
- [ ] Vercel 로그에서 "MISS" / "HIT" 확인

**⚠️ 자주 터지는 2가지 (필수 확인):**

- [ ] **라우트/레이아웃에 `revalidate = 0` 또는 `dynamic = 'force-dynamic'`**
  ```typescript
  // ❌ 이게 박혀있으면 fetch revalidate가 무시됨
  export const revalidate = 0;
  export const dynamic = 'force-dynamic';
  ```

- [ ] **상위에서 cookies/headers 읽는 문제**
  ```
  ⚠️ 상위 레이아웃/페이지에서 cookies() 한 번이라도 읽으면
     아래 fetch(..., revalidate)가 기대대로 안 먹을 수 있음

  ✅ 해결: 공개 데이터 fetch 모듈은 cookies/headers를 절대 읽지 않도록 분리
     - fetchFootball() 등은 순수하게 유지
     - 페이지 레벨에서 인증 읽더라도 fetch 모듈은 영향 없게
  ```

---

## 10. 예상 효과

### 10.1 API 호출 절감

```
현재 (캐싱 없음):
├── 홈페이지: 3회/뷰 (3일치 경기)
├── 경기 상세: 5-7회/뷰
├── 팀 상세: 5-7회/뷰
├── 선수 상세: 4-6회/뷰
└── 일일 총: ~10,000회 (1000 DAU 기준)

개선 후:
├── 정적 (24h): 90% 캐시 히트
├── 준정적 (1h): 70% 캐시 히트
├── 준실시간 (15m): 50% 캐시 히트
├── 라이브: 유지
└── 일일 총: ~3,000회 (70% 절감)
```

### 10.2 응답 속도

| 데이터 유형 | 현재 | 캐시 히트 시 |
|------------|------|-------------|
| 팀 정보 | 300-500ms | <50ms |
| 순위표 | 400-600ms | <50ms |
| 경기 상세 | 500-800ms | <100ms |

### 10.3 비용

```
api-sports.io:
├── Pro: 40,000 calls/day ($49.99/month)
├── Basic: 7,500 calls/day ($9.99/month)

현재 → 개선 후:
├── 10,000+/일 (Pro 필요)
├── → 3,000/일 (Basic 충분)
└── 월 $40 절감
```

---

## 11. 체크리스트

### Phase 0: 팬아웃 중복 제거
- [x] 경기 상세 페이지 데이터 흐름 분석
- [x] 기존 fetch 함수 → React `cache()` 래핑
- [x] 중복 호출 패턴 식별 및 정리
- [ ] Suspense boundary 추가 (탭별 lazy loading) - 추후 진행

### Phase 1: 캐싱 유틸리티
- [x] `src/shared/utils/apiCache.ts` 생성
- [x] `export type CleanParams` + `export normalizeParams()`
- [x] `export buildFootballApiUrlFromClean()` (정규화된 params용)
- [x] `export buildFootballApiUrl()` (raw params용 편의 함수)
- [x] `API_CACHE_POLICY` 정책 테이블
- [x] `getMatchCacheTTL()` 상태/시간 기반 TTL (seconds 자동 변환)
- [x] `resolveCachePolicy()` endpoint + CleanParams + **reason** 반환
- [x] `src/shared/utils/footballApi.ts` - `fetchFootball()`
  - [x] reason 로깅 (TTL 결정 근거 추적)
  - [x] 429/5xx 재시도 (exponential backoff)
- [x] `.env` 설정 (코드에 기본값 포함)
  - [x] `FOOTBALL_API_PROVIDER` (apisports / rapidapi)
  - [x] `ENABLE_CACHE_TAGS` (true / false, 기본 false)

### Phase 2: 정적 데이터
- [x] `teams/team.ts` 마이그레이션
- [x] `player/player.ts` 마이그레이션
- [x] `footballApi.ts` - 모든 함수 마이그레이션 완료
  - [x] `fetchMatchesByDate()`
  - [x] `fetchMultiDayMatches()`
  - [x] `fetchMatchDetails()`
  - [x] `fetchLeagueDetails()`
  - [x] `fetchLeagueTeams()`
  - [x] `fetchTeamTrophies()`
  - [x] `fetchLeagueWinner()`
  - [x] `fetchCupFinal()`
  - [x] `fetchCupWinner()`

### Phase 3: 준정적 데이터
- [x] `teams/standings.ts` 마이그레이션
- [x] `teams/squad.ts` 마이그레이션
- [x] `teams/player-stats.ts` 마이그레이션
- [x] `teams/matches.ts` 마이그레이션

### Phase 4: 조건부 캐싱
- [x] `fetchMatchesByDate()` 상태별 TTL
- [x] `match/*` 조건부 캐싱
  - [x] `utils/matchDataApi.ts`
  - [x] `match/eventData.ts`
  - [x] `match/lineupData.ts`
  - [x] `match/statsData.ts`
- [x] 종료 직후 window 적용 (getMatchCacheTTL)

### Phase 5: 검증
- [x] 빌드 성공 확인 (2026-01-19)
- [ ] 로깅 확인 - 배포 후 진행
- [ ] api-sports 대시보드 호출 수 비교 - 배포 후 진행
- [x] 문서 업데이트

---

## 12. 구현 완료 현황 (2026-01-19)

### 생성된 파일
| 파일 | 설명 |
|------|------|
| `src/shared/utils/apiCache.ts` | 캐시 정책 테이블, URL 빌더, TTL 유틸리티 |
| `src/shared/utils/footballApi.ts` | 통합 fetchFootball() 함수 |

### 마이그레이션된 파일 (11개)
| 파일 | TTL 정책 |
|------|----------|
| `teams/team.ts` | teams: 24h, leagues: 24h, teams/statistics: 1h |
| `player/player.ts` | players: 24h |
| `teams/standings.ts` | leagues: 24h, standings: 1h |
| `teams/squad.ts` | players/squads: 1h, coachs: 1h |
| `teams/player-stats.ts` | leagues: 24h, players: 24h |
| `teams/matches.ts` | fixtures: 동적 (15m 기본) |
| `utils/matchDataApi.ts` | fixtures: 상태 기반 동적 (30s~15m) |
| `match/eventData.ts` | fixtures/events: 상태 기반 동적 |
| `match/lineupData.ts` | fixtures/lineups: 상태 기반 동적 |
| `match/statsData.ts` | fixtures/statistics: 상태 기반 동적 |
| `footballApi.ts` | 9개 함수 마이그레이션 (fetchMatchesByDate, fetchMultiDayMatches, fetchMatchDetails, fetchLeagueDetails, fetchLeagueTeams, fetchTeamTrophies, fetchLeagueWinner, fetchCupFinal, fetchCupWinner) |

### 남은 작업 (추후 진행)
- [ ] Suspense boundary 추가 (탭별 lazy loading)
- [ ] 배포 후 로깅/대시보드 모니터링
- [ ] api-sports 호출 수 모니터링 및 비용 절감 확인

---

## 12.2 2026-02-26 캐시 정리

### 배경

Phase 1~5에서 구현한 `fetchFootball()` + `apiCache.ts` 아키텍처와 별도로, 코드 전반에 걸쳐 남아있던 **레거시 캐시 레이어들을 정리**하는 작업을 진행했습니다.

### 제거된 항목

| 항목 | 위치 | 설명 |
|------|------|------|
| `serverDataCache` Map | `player/data.ts` | 10분 TTL 인메모리 캐시 |
| `cacheTTL` Map | `player/data.ts` | endpoint별 TTL 설정 |
| `ongoingRequests` Map | `player/data.ts` | 중복 요청 방지 |
| `fetchWithRetry` 함수 | `player/data.ts` | 재시도 래퍼 |
| `withCache` 래퍼 | `player/data.ts`, `teams/team.ts` | Supabase L2 캐시 |
| `cachedSeasons` / `cachedSeasonsTimestamp` | `player/data.ts` | 시즌 목록 인메모리 캐시 |
| `matchesCache` Map | `footballApi.ts` | 경기 데이터 인메모리 캐시 |
| `powerCache` Map | `match/headtohead.ts` | H2H 파워 랭킹 캐시 |
| `completeCache` / `partialCache` | `player/fixtures.ts` | Complete/Partial/Stale 3단계 캐시 |
| `dataCache` Map | `player/[id]/page.tsx`, `match/[id]/page.tsx` | 페이지 레벨 캐시 |
| `fetchCache` / `revalidate` 오버라이드 | `teams/layout.tsx` 등 | route segment 레벨 캐시 설정 |

### 현재 아키텍처 (단일 캐시 레이어)

```
요청 → React cache() (요청 내 중복 제거) → fetchFromFootballApi (next.revalidate) → API
```

- **모든 API 호출**: `fetchFromFootballApi` 통해 통일
- **캐시**: `next: { revalidate: getRevalidateTime(endpoint) }`만 사용 (Vercel Data Cache)
- **중복 제거**: `React.cache()` 래핑

### 의도적으로 유지한 항목

| 항목 | 위치 | 이유 |
|------|------|------|
| `matchCache` | `match/playerStats.ts` | 종료된 경기 데이터는 불변이므로 캐시 유지 합리적 |
| `transfersCache` | `transfers/index.ts` | 리그 전체 이적 데이터 수집이 비용이 커서 Supabase 캐시 유지 |
| `fetchWithRateLimit` | `player/fixtures.ts` | 캐시가 아닌 rate limit 대응용 (세마포어 + 재시도) |

---

*작성일: 2026-01-19*
*마지막 업데이트: 2026-02-26*
*태스크: #11 외부 API 캐싱 강화*
*상태: ✅ 구현 완료 + 캐시 정리 완료*
*예상 효과: API 호출 70% 절감, ~$40/월 비용 절감*
