# 라이브스코어 API 호출 분석 및 최적화 계획

> 작성일: 2026-01-26
> 위치: `src/domains/livescore/`

## 1. 개요

현재 프로젝트에서 Football API (api-sports.io)를 호출하는 모든 위치와 패턴을 분석하고, 중복 호출 및 최적화 가능한 부분을 정리한 문서입니다.

---

## 2. API 호출 구조 다이어그램

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Football API (api-sports.io)                        │
│                    https://v3.football.api-sports.io                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↑
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ↓                             ↓                             ↓
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────────────┐
│ fetchFromFootball │   │ fetchMatchesByDate│   │ 직접 fetch 호출           │
│ Api (공통 함수)   │   │ (날짜별 경기)     │   │ (일부 레거시 코드)        │
└───────────────────┘   └───────────────────┘   └───────────────────────────┘
        ↑                       ↑
        │                       │
        │         ┌─────────────┼─────────────┐
        │         │             │             │
        │         ↓             ↓             ↓
        │   fetchMultiDay   fetchBigMatches  React Query
        │   Matches (3일)   (빅매치 필터)    (useLiveScore)
        │         │             │             │
        │         └──────┬──────┘             │
        │                │                    │
        ↓                ↓                    ↓
┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐
│ 개별 경기   │  │ layout.tsx  │  │ MainView (라이브스코어) │
│ 상세 조회   │  │ (SSR)       │  │ (CSR + Polling)         │
│             │  │             │  │                         │
│ - H2H       │  │ ↓           │  └─────────────────────────┘
│ - 라인업    │  │ ┌───────┐   │
│ - 통계      │  │ │모달   │   │
│ - 이벤트    │  │ │위젯   │   │
└─────────────┘  │ └───────┘   │
                └─────────────┘
```

---

## 3. 경기 일정 데이터 호출 현황

### 3.1 메인 3개 컴포넌트 (Phase 1 최적화 후)

| 컴포넌트 | 파일 위치 | 호출 함수 | 데이터 범위 | 호출 시점 |
|---------|----------|----------|------------|----------|
| **모달** | `layout.tsx` | `fetchTodayMatchesOnly()` | 오늘 (1일) | SSR (페이지 로드) |
| **모달** | `LiveScoreContent.tsx` | `fetchMatchesByDateLabel()` | 어제/내일 | CSR (탭 클릭 시 lazy load) |
| **위젯** | `LiveScoreWidgetV2Server.tsx` | `fetchBigMatches()` | 오늘+내일 빅매치 | SSR (페이지 로드) |
| **MainView** | `livescore/football/page.tsx` | `fetchMatchesByDate()` | 선택한 날짜 1일 | SSR + CSR Polling |

### 3.2 데이터 흐름 상세 (Phase 1 최적화 후)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           layout.tsx (SSR)                              │
│                                                                         │
│  const [... liveScoreData ...] = await Promise.all([                   │
│    ...                                                                  │
│    fetchTodayMatchesOnly(),  ← API 호출 (오늘만, 1회)                  │
│    ...                                                                  │
│  ]);                                                                    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     RootLayoutClient                            │   │
│  │                           ↓                                     │   │
│  │                    AuthStateManager                             │   │
│  │                           ↓                                     │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │                    HeaderClient                          │   │   │
│  │  │                         ↓                                │   │   │
│  │  │  ┌─────────────────────────────────────────────────┐    │   │   │
│  │  │  │          LiveScoreModalClient                   │    │   │   │
│  │  │  │                    ↓                            │    │   │   │
│  │  │  │  ┌─────────────────────────────────────────┐   │    │   │   │
│  │  │  │  │        LiveScoreContent                 │   │    │   │   │
│  │  │  │  │                                         │   │    │   │   │
│  │  │  │  │  • 오늘: SSR 데이터 사용 (즉시)        │   │    │   │   │
│  │  │  │  │  • 어제/내일: React Query lazy load    │   │    │   │   │
│  │  │  │  │    (탭 클릭 시에만 API 호출)          │   │    │   │   │
│  │  │  │  └─────────────────────────────────────────┘   │    │   │   │
│  │  │  └─────────────────────────────────────────────────┘    │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.3 함수 호출 관계

```typescript
// footballApi.ts 내부 함수 호출 관계

fetchBigMatches()
    └── fetchMultiDayMatches()  // 내부에서 호출
            └── fetchMatchesByDate(어제)
            └── fetchMatchesByDate(오늘)
            └── fetchMatchesByDate(내일)
                    └── fetchFromFootballApi('fixtures', { date, timezone })
                            └── fetch('https://v3.football.api-sports.io/fixtures?...')

// React cache() 덕분에 같은 서버 렌더링 사이클 내에서 중복 호출 방지
```

---

## 4. 개별 경기 데이터 호출 현황

### 4.1 fixtures 엔드포인트 사용처

| 파일 | 함수 | 용도 | API 파라미터 |
|------|------|------|-------------|
| `livescore/utils/matchDataApi.ts` | `fetchMatchData(id)` | 경기 상세 페이지 | `?id={matchId}` |
| `livescore/actions/teams/matches.ts` | `fetchTeamMatches(teamId)` | 팀 페이지 - 시즌 경기 | `?team={id}&season={year}` |
| `search/actions/teamMatches.ts` | `getTeamMatches(teamId)` | 검색 - 팀 경기 | `?team={id}&last=&next=` |
| `livescore/actions/player/fixtures.ts` | `fetchPlayerFixtures(playerId)` | 선수 출전 기록 | `?team={id}&season={year}` |
| `livescore/actions/match/headtohead.ts` | `fetchHeadToHead(teamA, teamB)` | 상대전적 | `?h2h={a}-{b}&last=&status=FT` |
| `prediction/actions.ts` | `getUpcomingMatches(date)` | 예측 분석용 | `?date={date}&status=NS` |
| `boards/actions/matches.ts` | `getMatchesByDate(date)` | 게시글 작성 | `fetchMatchesByDate()` 재사용 |

### 4.2 기타 API 엔드포인트 사용처

| 엔드포인트 | 파일 | 용도 |
|-----------|------|------|
| `/predictions` | `prediction/actions.ts` | AI 예측 데이터 |
| `/fixtures/events` | `livescore/actions/match/eventData.ts` | 경기 이벤트 (골, 카드 등) |
| `/fixtures/lineups` | `livescore/actions/match/lineupData.ts` | 라인업 |
| `/fixtures/statistics` | `livescore/actions/match/statsData.ts` | 경기 통계 |
| `/players` | `livescore/actions/player/` | 선수 정보 |
| `/standings` | `sidebar/actions/football.ts` | 리그 순위 |

---

## 5. 발견된 문제점

### 5.1 중복 호출 문제

#### 문제 1: 라이브스코어 페이지 접속 시 오늘 데이터 2번 호출

```
사용자가 /livescore/football 접속

1. layout.tsx 실행
   └── fetchMultiDayMatches() → 오늘 데이터 포함 (API 호출 1)

2. livescore/football/page.tsx 실행
   └── fetchMatchesByDate(오늘) → 오늘 데이터 (API 호출 2)

결과: 오늘 데이터 2번 호출 (중복)
```

**원인**: `fetchMatchesByDate`는 `cache()`로 감싸져 있지만, `fetchMultiDayMatches` 내부에서 호출되는 것과 page.tsx에서 직접 호출되는 것은 서로 다른 캐시 키로 취급될 수 있음.

#### 문제 2: 팀 경기 조회 함수 중복

```typescript
// 두 함수가 거의 동일한 역할 수행
// livescore/actions/teams/matches.ts
export async function fetchTeamMatches(teamId: string) { ... }

// search/actions/teamMatches.ts
export async function getTeamMatches(teamId: number) { ... }
```

### 5.2 비효율 문제

#### 문제 3: 모달 3일치 무조건 로드

```typescript
// layout.tsx
const liveScoreData = await fetchMultiDayMatches();
// → 어제, 오늘, 내일 3일치 모두 로드

// 실제 사용 패턴:
// - 대부분 사용자는 오늘 탭만 확인
// - 모달을 아예 열지 않는 사용자도 많음
```

**낭비되는 리소스**:
- API 호출: 3회 (어제 + 오늘 + 내일)
- 초기 페이지 로드 시간 증가
- 불필요한 데이터 전송

---

## 6. 최적화 계획

### Phase 1: 모달 데이터 로딩 최적화 ✅ 완료 (2026-01-26)

**목표**: API 호출 3회 → 1회 (초기 로드 시)

**변경 전 구조**:
```
layout.tsx
    ↓
fetchMultiDayMatches() → 3일치 모두 SSR
    ↓
모달: 캐시된 데이터 사용
```

**변경 후 구조**:
```
layout.tsx
    ↓
fetchTodayMatchesOnly() → 오늘만 SSR (API 1회)
    ↓
모달 열림 (오늘 탭: SSR 데이터)
    ↓
어제/내일 탭 클릭 시 React Query lazy load
```

**구현 내용**:
1. `footballApi.ts`에 새로운 타입 및 함수 추가:
   - `TodayMatchesResult` 타입
   - `fetchTodayMatchesOnly()` - 오늘 경기만 SSR
   - `fetchMatchesByDateLabel()` - 어제/내일 lazy load용

2. `layout.tsx` 변경:
   - `fetchMultiDayMatches()` → `fetchTodayMatchesOnly()` 변경

3. `LiveScoreContent.tsx` 완전 재작성:
   - React Query `useQuery` 적용
   - `enabled` 옵션으로 탭 선택 시에만 fetch
   - 5분 staleTime, 10분 gcTime 캐싱

**실제 효과**:
| 시나리오 | 변경 전 | 변경 후 |
|---------|--------|--------|
| 페이지 로드 | 3회 API | **1회 API** |
| 모달 안 열음 | 3회 낭비 | **1회만** |
| 오늘 탭만 봄 | 3회 | **1회** |
| 3탭 모두 봄 | 3회 | 3회 (동일) |

### Phase 2: 라이브스코어 페이지 중복 제거 ✅ 완료 (2026-01-26)

**목표**: layout과 page 간 오늘 데이터 중복 호출 제거

**구현 방안**: React `cache()` 함수를 활용한 서버 렌더링 중복 제거

**변경 내용**:
1. `footballApi.ts`에 `fetchMatchesByDateCached` 함수 추가
   ```typescript
   // React cache()로 감싸서 같은 렌더 사이클 내 중복 호출 방지
   export const fetchMatchesByDateCached = cache(async (date: string): Promise<MatchData[]> => {
     return fetchMatchesByDate(date);
   });
   ```

2. 모든 내부 함수가 캐시된 버전 사용:
   - `fetchTodayMatchesOnly` → `fetchMatchesByDateCached` 사용
   - `fetchMultiDayMatches` → `fetchMatchesByDateCached` 사용
   - `fetchMatchesByDateLabel` → `fetchMatchesByDateCached` 사용

3. `page.tsx` 업데이트:
   - `fetchMatchesByDate` → `fetchMatchesByDateCached` 변경

**효과**:
| 시나리오 | 변경 전 | 변경 후 |
|---------|--------|--------|
| /livescore/football 접속 (오늘) | API 2회 (layout + page) | **API 1회** |
| 다른 날짜 선택 | API 1회 | API 1회 (동일) |

**동작 원리**:
```
사용자 → /livescore/football 접속

1. layout.tsx 실행
   └── fetchTodayMatchesOnly()
       └── fetchMatchesByDateCached("2026-01-26") ← API 호출 1회

2. page.tsx 실행 (같은 렌더 사이클)
   └── fetchMatchesByDateCached("2026-01-26") ← cache() 덕분에 재사용 (API 호출 없음)

결과: 오늘 데이터 API 1회만 호출
```

### Phase 3: 팀 경기 조회 함수 통합 ✅ 완료 (2026-01-26)

**목표**: 중복 함수 제거, 단일 소스 유지

**변경 전 구조**:
```
livescore/actions/teams/matches.ts
  └── fetchTeamMatches(teamId: string) → 시즌 전체 경기

search/actions/teamMatches.ts
  └── getTeamMatches(teamId: number, limit) → 최근/예정 경기
```

**변경 후 구조**:
```
livescore/actions/teams/matches.ts (통합)
  ├── fetchTeamMatchesUnified(teamId, options) → 통합 함수
  │     options: { mode: 'season' | 'recent', limit, applyKoreanNames, season }
  │
  ├── fetchTeamMatches(teamId) → 레거시 호환 (season 모드)
  └── getTeamMatchesRecent(teamId, limit) → 레거시 호환 (recent 모드)

search/actions/teamMatches.ts
  └── @deprecated (통합 함수로 이전)
```

**구현 내용**:
1. `fetchTeamMatchesUnified` 통합 함수 생성:
   - `mode: 'season'`: 시즌 전체 경기 (팀 상세 페이지용)
   - `mode: 'recent'`: 최근/예정 경기만 (검색 결과용)
   - `applyKoreanNames`: 한국어 팀명 매핑 여부
   - `fetchFromFootballApi` 공통 함수 사용

2. 검색 컴포넌트 업데이트:
   - `TeamMatchDropdown.tsx`: `getTeamMatchesRecent` 사용
   - `TeamSearchResults.tsx`: `getTeamMatchesRecent` 사용

3. `search/actions/teamMatches.ts` deprecated 처리

**효과**:
- 코드 중복 제거
- 단일 API 호출 로직 유지
- 한국어 팀명 매핑 일관성 확보
- 타입 통합 (`Match` 타입 공유)

---

## 7. 관련 파일 목록

### 핵심 파일

| 파일 | 역할 |
|------|------|
| `src/domains/livescore/actions/footballApi.ts` | API 호출 핵심 함수 |
| `src/app/layout.tsx` | SSR 데이터 로딩 (모달용) |
| `src/app/livescore/football/page.tsx` | 라이브스코어 페이지 |
| `src/domains/widgets/components/live-score-widget/LiveScoreWidgetV2Server.tsx` | 위젯 서버 컴포넌트 |
| `src/domains/layout/components/livescoremodal/LiveScoreContent.tsx` | 모달 콘텐츠 |
| `src/domains/livescore/hooks/useLiveScoreQueries.ts` | React Query 훅 |

### 개별 경기 관련 파일

| 파일 | 역할 |
|------|------|
| `src/domains/livescore/utils/matchDataApi.ts` | 경기 상세 데이터 |
| `src/domains/livescore/actions/match/headtohead.ts` | 상대전적 |
| `src/domains/livescore/actions/match/eventData.ts` | 경기 이벤트 |
| `src/domains/livescore/actions/match/lineupData.ts` | 라인업 |
| `src/domains/livescore/actions/match/statsData.ts` | 경기 통계 |
| `src/domains/livescore/actions/teams/matches.ts` | 팀 경기 목록 |
| `src/domains/search/actions/teamMatches.ts` | 검색용 팀 경기 (중복) |
| `src/domains/livescore/actions/player/fixtures.ts` | 선수 출전 기록 |
| `src/domains/prediction/actions.ts` | 예측 분석 |

---

## 8. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-01-26 | 초기 문서 작성 - 전체 API 호출 분석 완료 |
| 2026-01-26 | **Phase 1 완료** - 모달 데이터 로딩 최적화 (3회→1회 API) |
| 2026-01-26 | **Phase 2 완료** - 라이브스코어 페이지 중복 제거 (React cache 적용) |
| 2026-01-26 | **Phase 3 완료** - 팀 경기 조회 함수 통합 (중복 코드 제거) |

---

## 9. 참고 문서

- [MainView 리팩토링 가이드](./mainview-refactoring.md)
- [API 캐싱 전략](../refactoring/api-caching-strategy.md)
