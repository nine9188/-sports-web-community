# Player Fixtures API 시스템

선수의 경기 기록을 가져오는 API 시스템 문서입니다.

## 개요

`fetchPlayerFixtures` 함수는 특정 선수의 시즌 경기 기록과 개별 경기 통계를 가져옵니다.

### 파일 위치

```
src/domains/livescore/actions/player/fixtures.ts
```

## 아키텍처

### 데이터 흐름

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   PlayerPage    │────▶│   TabContent    │────▶│ PlayerFixtures  │
│   (page.tsx)    │     │   (컨텍스트)     │     │   (컴포넌트)     │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │ fetchPlayerData │
                        │   (data.ts)     │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │fetchPlayerFixtures│
                        │  (fixtures.ts)  │
                        └────────┬────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │ /players │ │/fixtures │ │/fixtures │
              │   API    │ │   API    │ │ /players │
              └──────────┘ └──────────┘ └──────────┘
```

### 캐시 아키텍처 (2026-02-26 업데이트)

```
요청 → React cache() (요청 내 중복 제거) → fetchWithRateLimit (직접 fetch + rate limit) → API
```

- **React `cache()`**: 같은 서버 렌더링 내 중복 호출 방지
- **`fetchWithRateLimit`**: 세마포어 + 지수 백오프로 rate limit 대응
- ~~data.ts 캐시 (10분 `serverDataCache`)~~ → 제거됨
- ~~fixtures.ts Complete/Partial/Stale 캐시~~ → 제거됨

### API 호출 순서

1. **선수 정보 조회** (`/players?id={playerId}&season={season}`)
   - 선수의 소속팀 ID 획득

2. **팀 경기 목록 조회** (`/fixtures?team={teamId}&season={season}`)
   - 해당 시즌의 모든 경기 목록

3. **경기별 선수 통계** (`/fixtures/players?fixture={fixtureId}`)
   - 각 경기에서 선수의 개별 통계 (N+1 호출)

## 캐시 전략 (2026-02-26 업데이트)

> **2026-02-26 캐시 정리**: 복잡한 Complete/Partial/Stale 3단계 캐시가 제거되었습니다.
> 현재는 캐시 없이 매 요청마다 API를 호출하되, rate limit 대응 로직으로 안정성을 확보합니다.

### 현재 방식

- **캐시 레이어 없음**: 인메모리 캐시(`completeCache`, `partialCache`, `staleCache`) 모두 제거
- **Rate Limit 대응**: `fetchWithRateLimit` + `Semaphore`로 동시성 제어 및 재시도
- **청크 처리**: N+1 호출을 `chunkSize`개씩 묶어서 `chunkDelay`간격으로 처리

### 제거된 항목

- ~~`completeCache` Map (6시간 TTL)~~
- ~~`partialCache` Map (30분 TTL)~~
- ~~`staleCache` Map (24시간 TTL)~~
- ~~`createCacheKey()` 함수~~
- ~~Stale-While-Revalidate 패턴~~

## Rate Limit 대응

### fetchWithRateLimit 함수

```typescript
async function fetchWithRateLimit(
  url: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<FetchResult>
```

### 재시도 정책

| HTTP 상태 | 동작 | 재시도 |
|-----------|------|--------|
| 429 | Retry-After 헤더 존중, 없으면 지수 백오프 + jitter | O (최대 3회) |
| 5xx | 지수 백오프 | O (최대 3회) |
| 4xx (429 제외) | 즉시 실패, 로그 기록 | X |
| 네트워크 에러 | 지수 백오프 | O (최대 3회) |
| 타임아웃 | 10초 후 AbortController로 중단 | O (최대 3회) |

### 지수 백오프 계산

```typescript
// 기본 딜레이: 1000ms
// 재시도 1회: 1000ms * 2^0 = 1000ms + jitter
// 재시도 2회: 1000ms * 2^1 = 2000ms + jitter
// 재시도 3회: 1000ms * 2^2 = 4000ms + jitter

const waitTime = API_CONFIG.baseBackoffDelay * Math.pow(2, retryCount) + Math.random() * 1000;
```

## 동시성 제어

### 세마포어 구현

```typescript
class Semaphore {
  private permits: number;
  private queue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> { ... }
  release(): void { ... }
  async run<T>(fn: () => Promise<T>): Promise<T> { ... }
}

// 최대 3개 동시 요청
const apiSemaphore = new Semaphore(API_CONFIG.maxConcurrency);
```

### 청크 처리

```typescript
// 설정
const API_CONFIG = {
  chunkSize: 5,      // 5개씩 묶어서 처리
  chunkDelay: 500,   // 청크 간 500ms 딜레이
  maxConcurrency: 3, // 최대 3개 동시 요청
};

// 처리 흐름
for (let i = 0; i < fixtures.length; i += chunkSize) {
  const chunk = fixtures.slice(i, i + chunkSize);

  if (i > 0) await delay(chunkDelay);

  const results = await Promise.all(
    chunk.map(fixture =>
      fetchWithRateLimit(`/fixtures/players?fixture=${fixture.id}`)
    )
  );
}
```

## 응답 구조

### FixturesResponse 인터페이스

```typescript
interface FixturesResponse {
  data: FixtureData[];
  status?: 'success' | 'partial' | 'error' | 'stale';
  message?: string;
  cached?: boolean;
  stale?: boolean;
  seasonUsed?: number;
  completeness?: {
    total: number;           // 전체 경기 수
    success: number;         // 성공한 경기 수
    failed: number;          // 실패한 경기 수
    failedFixtureIds?: number[]; // 실패한 경기 ID 목록
  };
}
```

### 상태별 의미

| status | 의미 | cached | stale |
|--------|------|--------|-------|
| `success` | 모든 데이터 정상 로드 | true/false | false |
| `partial` | 일부 경기 로드 실패 | false | false |
| `stale` | 만료된 캐시 데이터 사용 | true | true |
| `error` | 치명적 오류 발생 | false | false |

## 설정 값

```typescript
const API_CONFIG = {
  baseUrl: 'https://v3.football.api-sports.io',
  chunkSize: 5,           // 청크당 경기 수
  chunkDelay: 500,        // 청크 간 딜레이 (ms)
  maxRetries: 3,          // 최대 재시도 횟수
  baseBackoffDelay: 1000, // 기본 백오프 딜레이 (ms)
  requestTimeout: 10000,  // 요청 타임아웃 (ms)
  maxConcurrency: 3,      // 최대 동시 요청 수
};

// CACHE_TTL — 2026-02-26 제거됨
// 현재 인메모리 캐시 없음, rate limit 대응만 유지
```

## 사용 예시

### 기본 사용

```typescript
import { fetchPlayerFixtures } from '@/domains/livescore/actions/player/fixtures';

// 모든 경기 가져오기
const result = await fetchPlayerFixtures(280);

// 최근 10경기만 가져오기
const recent = await fetchPlayerFixtures(280, 10);
```

### 응답 처리

```typescript
const result = await fetchPlayerFixtures(playerId);

if (result.status === 'success') {
  // 완전한 데이터
  console.log(`${result.data.length}경기 로드 완료`);
} else if (result.status === 'partial') {
  // 부분 데이터 - UI에 경고 표시 권장
  console.warn(`${result.completeness?.failed}경기 로드 실패`);
} else if (result.status === 'stale') {
  // 이전 데이터 - UI에 안내 표시 권장
  console.info('이전 캐시 데이터를 표시합니다');
} else {
  // 에러
  console.error(result.message);
}
```

## 트러블슈팅

### 새로고침마다 데이터가 달라지는 문제

**원인**: N+1 API 호출 중 일부가 랜덤하게 실패

**해결**:
1. Rate Limit 대응 (재시도, 429 처리)
2. 동시성 제한 (세마포어)
3. 청크 딜레이로 API 부하 분산

### Rate Limit (429) 자주 발생

**원인**: 동시 요청이 너무 많음

**해결**:
1. `maxConcurrency`를 3에서 2로 낮춤
2. `chunkDelay`를 500에서 1000으로 늘림
3. `chunkSize`를 5에서 3으로 줄임

### 응답이 느림

**원인**: N+1 호출 구조 + 청크 딜레이

**현재 한계**: API-Football은 `/fixtures/players` 엔드포인트에서 단일 fixture ID만 지원

**개선 방향**:
- 필요한 경기만 로드 (limit 활용)
- 청크 사이즈/딜레이 튜닝

## 검증 결과

2026-01-09 검증 완료:

| 항목 | 결과 |
|------|------|
| 첫 요청 | `status=success`, `failedCount=0` ✅ |
| 응답 시간 | 1201ms → 600~700ms (캐시 동작) ✅ |
| 데이터 일관성 | 22경기 로드, 실패 0 ✅ |
| 10회 새로고침 | 안정적으로 동일 데이터 반환 ✅ |

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|-----------|
| 2026-02-26 | 3.0.0 | 캐시 정리 - Complete/Partial/Stale 인메모리 캐시 제거, Rate Limit 대응만 유지 |
| 2026-01-09 | 2.0.1 | 다중 캐시 레이어 문서화, 검증 완료 |
| 2026-01-09 | 2.0.0 | 전면 개편 - Rate Limit 대응, 캐시 분리, 동시성 제한 |
| - | 1.0.0 | 초기 버전 |
