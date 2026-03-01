# API-Sports 표준 아키텍처

> API-Sports 데이터를 사용하는 **모든 페이지/컴포넌트의 기준 문서**.
> 새 페이지 추가, 기존 페이지 수정 시 반드시 이 문서를 따른다.

**작성일**: 2026-02-27 | **최종 업데이트**: 2026-03-01 (P2/P3/P4 기술부채 해결 반영)

---

## 1. 데이터 흐름 개요

```
┌─────────────────────────────────────────────────────────┐
│  API-Sports (v3.football.api-sports.io)                 │
└───────────────┬─────────────────────────────────────────┘
                │ fetch + Next.js revalidate (L1 캐시)
                ▼
┌─────────────────────────────────────────────────────────┐
│  Server Action (domains/livescore/actions/)              │
│  - fetchFromFootballApi()  ← 유일한 API 래퍼            │
│  - React cache()로 렌더 내 중복 방지 (L3 캐시)          │
│  - 종료 경기 → Supabase match_cache (L2 캐시)           │
└───────────────┬─────────────────────────────────────────┘
                │ Server Component (page.tsx)에서 호출
                ▼
┌─────────────────────────────────────────────────────────┐
│  Hydration Layer                                        │
│  - HydrationBoundary + prefetchQuery (라이브스코어)      │
│  - initialData prop → Client Component (경기/팀/선수)   │
│  - CacheSeeder → layout 자식용 (예외: 메인페이지만)     │
└───────────────┬─────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────┐
│  React Query (L4 캐시)                                  │
│  - useQuery() → HydrationBoundary/initialData 히트      │
│  - 폴링: LIVE 30초 / 오늘 60초 / 나머지 없음           │
└─────────────────────────────────────────────────────────┘
```

---

## 2. API 호출 래퍼

### 2.1 표준 래퍼: `fetchFromFootballApi()`

**파일**: `src/domains/livescore/actions/footballApi.ts`

모든 API-Sports 호출은 이 함수를 통해야 한다.

```typescript
fetchFromFootballApi(endpoint: string, params: Record<string, string | number>)
```

**기능**:
- URL 파라미터 알파벳순 정렬 → 캐시 키 안정성 100%
- endpoint별 `next: { revalidate }` 자동 적용
- `timezone: 'Asia/Seoul'` 자동 추가 (지원 endpoint만)
- 인증 헤더 (`x-rapidapi-key`) 자동 설정

### 2.2 endpoint별 revalidate (Next.js Data Cache)

| endpoint | revalidate | 이유 |
|----------|-----------|------|
| `fixtures` | 60초 | 실시간 경기 정보 |
| `events` | 30초 | 경기 중 이벤트 (골, 카드) |
| `lineups` | 300초 (5분) | 킥오프 전 확정 |
| `standings` | 1800초 (30분) | 경기 종료 후 업데이트 |
| `players` | 3600초 (1시간) | 정적 선수 정보 |
| `teams` | 3600초 (1시간) | 정적 팀 정보 |
| `injuries` | 3600초 (1시간) | 부상 정보 |
| `transfers` | 86400초 (24시간) | 이적 정보 |
| `trophies` | 86400초 (24시간) | 우승 기록 |
| 기본값 | 300초 (5분) | — |

### 2.3 레거시 래퍼 (신규 사용 금지)

| 파일 | 상태 | 비고 |
|------|------|------|
| `shared/utils/footballApi.ts` (`fetchFootball`) | 미사용 | 문서에만 참조, 실제 import 없음. 삭제 대상. |
| `shared/utils/apiCache.ts` | `fetchFootball`의 의존성 | 위와 동일 |
| `domains/livescore/utils/matchDataApi.ts` | ✅ 전환 완료 | `fetchFromFootballApi('fixtures', { id })` 사용, 한글 매핑 유지 |

> ~~**`matchDataApi.ts`는 우선순위 높은 기술부채.**~~ → **전환 완료.**
> `cache: 'no-store'` 직접 fetch를 `fetchFromFootballApi()` 표준 래퍼로 전환.
> L1 캐시(revalidate 60초) 활성화. 한글 팀명/리그명 매핑 로직은 유지.

---

## 3. 캐시 계층 (4단계)

### L1: Next.js Data Cache (서버)

| 대상 | TTL | 설정 위치 |
|------|-----|----------|
| API-Sports fetch 응답 | 30초~86400초 | `fetchFromFootballApi()` 내 `next: { revalidate }` |
| 사이드바 standings | 600초 (10분) | `sidebar/actions/football.ts` |

- Vercel 인스턴스 간 공유
- 동일 URL → 동일 캐시 키 (파라미터 정렬로 보장)

### L2: Supabase match_cache (DB)

**파일**: `src/domains/livescore/actions/match/matchCache.ts`

| 항목 | 값 |
|------|-----|
| 대상 | 종료(FT) 경기만 |
| TTL | `power` 영구, 나머지 6시간 soft TTL (아래 표 참고) |
| data_type | `full`, `events`, `lineups`, `stats`, `power`, `playerRatings`, `matchPlayerStats` |
| 함수 | `getMatchCache()`, `getMatchCacheBulk()`, `setMatchCache()`, `setMatchCacheBulk()` |

- 종료 경기는 API 재호출 불필요 → API 쿼터 절약
- match detail page에서 FT 판단 후 L2 우선 조회

**FT 후 정정 가능성 대응 (soft TTL)** — ✅ 구현 완료:

API-Sports는 경기 종료 후에도 통계/평점/이벤트를 보강·정정하는 경우가 있다.
"영구 오염 캐시" 리스크를 방지하기 위해 6시간 soft TTL을 적용한다.
캐시 만료 시 API에서 재조회하여 갱신한다.

| data_type | soft TTL | 이유 |
|-----------|----------|------|
| `full` | 6시간 | FT 직후 데이터 보강 가능 |
| `events` | 6시간 | 오심 정정, 득점자 변경 가능 |
| `lineups` | 6시간 | FT 직후 데이터 보강 가능 |
| `stats` | 6시간 | 통계 보강이 몇 시간 후 반영됨 |
| `playerRatings` | 6시간 | 평점 보강이 몇 시간 후 반영됨 |
| `matchPlayerStats` | 6시간 | 선수 통계 보강이 몇 시간 후 반영됨 |
| `power` | 영구 (TTL 없음) | H2H 계산 결과, 불변 |

`isExpired(updatedAt, dataType)` 함수가 `updated_at` 컬럼으로 만료 여부를 판단.

### L3: React cache() (렌더 사이클)

| 파일 | 캐시 함수 |
|------|----------|
| `actions/footballApi.ts` | `fetchMatchesByDateCached()`, `fetchMultiDayMatches()` |
| `actions/match/matchData.ts` | `fetchCachedMatchFullData()` |
| `actions/match/eventData.ts` | events 중복 방지 |
| `actions/match/lineupData.ts` | lineups 중복 방지 |
| `actions/match/statsData.ts` | stats 중복 방지 |
| `actions/teams/team.ts` | team 중복 방지 |
| `actions/teams/*.ts` | 각 팀 데이터 중복 방지 |
| `actions/player/data.ts` | player 중복 방지 |

- 같은 렌더 사이클 내 동일 호출 1회로 축소
- 요청 종료 시 자동 해제 — **서로 다른 요청 간에는 공유되지 않음**

> **주의**: `cache()`는 **중복 방지(dedupe) 전용**이다.
> 쿼터 절약의 핵심은 L1(Data Cache)과 L2(match_cache)이며,
> `cache()`는 같은 렌더에서 동일 서버 액션이 여러 번 호출될 때만 효과가 있다.
> 요청 A와 요청 B 사이의 데이터 공유는 반드시 L1 또는 L2를 통해야 한다.

### L4: React Query (클라이언트)

**기본값** (`RootLayoutProvider.tsx`):

| 설정 | 값 |
|------|-----|
| staleTime | 5분 |
| gcTime | 10분 |
| retry | 1 |
| refetchOnWindowFocus | `false` |
| refetchOnMount | `false` |
| refetchOnReconnect | `false` |
| structuralSharing | `false` |

**CACHE_STRATEGIES** (`shared/constants/cacheConfig.ts`):

| 전략명 | staleTime | gcTime | 용도 |
|--------|-----------|--------|------|
| REAL_TIME | 30초 | 5분 | 라이브 이벤트 |
| FREQUENTLY_UPDATED | 2분 | 10분 | 경기 이벤트, 댓글 |
| OCCASIONALLY_UPDATED | 5분 | 30분 | 통계, 라인업 |
| STABLE_DATA | 30분 | 2시간 | 팀 정보, 순위 |
| STATIC_DATA | 1시간 | 24시간 | 선수단, 이적, 트로피 |

> `usePlayerQueries.ts`만 `CACHE_STRATEGIES` 상수를 사용 중.
> `useMatchQueries.ts`, `useTeamQueries.ts`는 dead code로 삭제됨.

---

## 4. Query Key 관리

### 4.1 유일한 소스: `shared/constants/queryKeys.ts`

모든 query key는 이 파일에서 정의하고 import해야 한다.

**`shared/constants/queryKeys.ts` 외의 Query Key 정의는 금지한다.**
로컬에서 키가 필요하면 반드시 shared에 추가한 후 import해서 사용한다.
키가 조금이라도 달라지면 같은 데이터가 서로 다른 캐시에 저장되어,
`prefetchTab()` 등에서 "프리페치 했는데 로딩이 뜨는" 사고가 발생한다.

```typescript
import { liveScoreKeys } from '@/shared/constants/queryKeys';
import { matchKeys } from '@/shared/constants/queryKeys';
import { teamKeys } from '@/shared/constants/queryKeys';
import { playerKeys } from '@/shared/constants/queryKeys';
```

**정의된 키 팩토리**:

| 팩토리 | 키 예시 |
|--------|---------|
| `liveScoreKeys.matches(date)` | `['liveScore', 'matches', '2026-02-27']` |
| `liveScoreKeys.multiDay()` | `['liveScore', 'multiDay']` |
| `liveScoreKeys.liveCount()` | `['liveScore', 'liveCount']` |
| `matchKeys.detail(id)` | `['match', '12345']` |
| `matchKeys.events(id)` | `['match', '12345', 'events']` |
| `teamKeys.info(id)` | `['team', '100', 'info']` |
| `playerKeys.stats(id)` | `['player', '306', 'stats']` |

### 4.2 현재 Query Key 중복 현황

| 훅 파일 | 로컬 키 정의 | shared 사용 | 상태 |
|---------|-------------|------------|------|
| `usePlayerQueries.ts` | 없음 | `import { playerKeys }` | ✅ 정상 |
| `useLiveScoreQueries.ts` | 없음 | `import { liveScoreKeys }` | ✅ 완료 |
| ~~`useMatchQueries.ts`~~ | — | — | ✅ 삭제됨 |
| ~~`useTeamQueries.ts`~~ | — | — | ✅ 삭제됨 |

> Query Key 통합 완료. 모든 훅이 `shared/constants/queryKeys.ts`에서 import.

---

## 5. Hydration 패턴

### 5.1 HydrationBoundary (TanStack Query v5 권장)

서버에서 `prefetchQuery`로 캐시를 채운 뒤 `dehydrate` → `HydrationBoundary`로 클라이언트에 주입.
props drilling 없이 `useQuery`가 캐시 히트하여 즉시 데이터 사용.

```typescript
// Server Component (page.tsx)
const queryClient = getQueryClient();
await queryClient.prefetchQuery({ queryKey, queryFn });

return (
  <HydrationBoundary state={dehydrate(queryClient)}>
    <ClientComponent />  {/* props로 데이터 전달 안 함 */}
  </HydrationBoundary>
);
```

**적용 페이지**:

| 페이지 | 서버에서 prefetch | 클라이언트에서 사용 |
|--------|------------------|-------------------|
| `/livescore/football` | 3일치 `prefetchQuery` | `LiveScoreView` → `useLiveScore()` |

### 5.2 initialData prop (레거시, 일부 페이지 유지)

```
Server Component (page.tsx)
  → Promise.all([fetchA(), fetchB(), ...])
  → <ClientComponent initialData={data} />
```

**적용 페이지**:

| 페이지 | 서버에서 fetch | 클라이언트에서 수신 |
|--------|---------------|-------------------|
| `/livescore/football/match/[id]` | `fetchCachedMatchFullData()` + power + playerStats | `MatchPageClient` → `useMatchTabData()` |
| `/livescore/football/team/[id]` | `fetchTeamFullData()` | `TeamPageClient` → `useTeamTabData()` |
| `/livescore/football/player/[id]` | `fetchPlayerFullData()` | `PlayerPageClient` → `usePlayerTabData()` |

### 5.3 예외 패턴: CacheSeeder (메인페이지 한정)

**파일**: `src/shared/components/LiveScoreCacheSeeder.tsx`

```
page.tsx → fetchMultiDayMatches()
         → <LiveScoreCacheSeeder data={multiDayData} />
         → queryClient.setQueryData(liveScoreKeys.multiDay(), data)

layout.tsx 자식들:
  HeaderClient → useTodayMatchCount() → CacheSeeder 캐시 히트
  LiveScoreModalClient → useMultiDayMatches() → CacheSeeder 캐시 히트
```

**왜 CacheSeeder인가 — page→layout 경계 문제**:

Next.js App Router에서 layout은 page를 **감싸는** 구조다.
데이터 흐름은 layout → page (부모 → 자식) 방향만 가능하고,
**page → layout 방향으로 props를 전달할 수 없다.**

```
(site)/layout.tsx  ← HeaderClient, LiveScoreModalClient (경기 데이터 필요)
  └─ page.tsx      ← fetchMultiDayMatches() (여기서 데이터 fetch)
```

- `HydrationBoundary`도 page.tsx 안에서 선언하므로 layout.tsx 자식에게 도달하지 않음
- layout.tsx에서 직접 fetch하면 page.tsx 위젯과 **동일 데이터를 이중 fetch** (3일치 매치)
- 따라서 page.tsx에서 한 번 fetch → CacheSeeder로 React Query 캐시에 주입 → layout 자식이 캐시에서 읽는 것이 유일하게 효율적인 방법

**이 패턴은 메인페이지 한 곳에서만 사용**. 나머지 페이지는 layout 자식이 경기 데이터를 필요로 하지 않으므로 HydrationBoundary 또는 initialData를 사용한다.

### 5.4 HydrationBoundary 마이그레이션 상태

**initialData 대비 HydrationBoundary 장점**:
- `dataUpdatedAt`이 서버 fetch 시점으로 보존 → staleTime 계산 정확
- props drilling 불필요 → 컴포넌트 인터페이스 단순화
- 여러 쿼리를 한번에 hydrate 가능

| 페이지 | 현재 패턴 | 상태 |
|--------|-----------|------|
| 메인 위젯 | CacheSeeder (예외 유지) | ✅ 유지 |
| 라이브스코어 | HydrationBoundary + prefetchQuery | ✅ 전환 완료 |
| 경기 상세 | props 직접 전달 (React Query 미사용) | ✅ 유지 |
| 팀 상세 | props 직접 전달 (React Query 미사용) | ✅ 유지 |
| 선수 상세 | initialData + initialDataUpdatedAt | ✅ 유지 |

---

## 6. 서버 QueryClient

**파일**: `src/shared/api/getQueryClient.ts`

서버 컴포넌트에서 `prefetchQuery`를 사용하기 위한 요청별 싱글턴:

```typescript
import { QueryClient } from '@tanstack/react-query';
import { cache } from 'react';

const getQueryClient = cache(
  () => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000 },
    },
  })
);

export default getQueryClient;
```

- `React cache()`로 래핑 → 같은 렌더 사이클 내 싱글턴 보장
- 클라이언트 QueryClient (`RootLayoutProvider`)와 별개
- HydrationBoundary 마이그레이션 시 사용

---

## 7. 폴링 정책

**파일**: `src/domains/livescore/hooks/useLiveScoreQueries.ts`

### 폴링 조건 정의

- **LIVE 모드**: 사용자가 UI에서 "LIVE" 토글을 활성화한 상태 (`showLiveOnly === true`). 경기 상태(live fixtures 존재 여부)와 무관하게 사용자 토글 기준.
- **오늘 판단**: `Asia/Seoul`(KST) 기준 `yyyy-MM-dd` 문자열 비교. 사용자 로컬 타임존이 아닌 서버/클라이언트 모두 KST 고정.

| 조건 | refetchInterval | 이유 |
|------|----------------|------|
| LIVE 모드 (showLiveOnly=true) | 30초 | 실시간 스코어 |
| 오늘 날짜 (KST 기준) | 60초 | 새 경기 시작 감지 |
| 과거/미래 날짜 | 없음 | 데이터 변경 없음 |

**공통 설정**:
- `refetchIntervalInBackground: false` — 탭 비활성 시 폴링 중지
- `staleTime: 5분` — HydrationBoundary 캐시 히트 후 5분간 fresh 유지
- 나머지 refetch 옵션은 RootLayoutProvider 기본값 사용

> HydrationBoundary 패턴으로 전환 후, `refetchOnMount/WindowFocus/Reconnect: false`는
> 더 이상 명시할 필요 없음. staleTime 내에서는 자동으로 refetch하지 않음.

---

## 8. 이미지 파이프라인 (4590 표준)

### 8.1 핵심 규칙

1. 클라이언트는 **절대** API-Sports 이미지 URL을 직접 사용하지 않는다
2. 공식 이미지 소스는 **Supabase Storage**
3. 서버에서 URL을 확정한다 (Server Actions/Components만)
4. 모든 이미지 타입은 동일한 파이프라인을 따른다

### 8.2 파이프라인

```
API-Sports 원본 (media.api-sports.io)
  → 다운로드 (서버)
  → Sharp WebP 변환 (quality: 80%)
  → 3사이즈 생성 (sm/md/lg)
  → Supabase Storage 업로드
  → asset_cache DB에 상태 기록
  → Storage 공개 URL 반환
```

### 8.3 이미지 사이즈

| 사이즈 | 일반 (px) | 경기장 (px) | 용도 |
|--------|----------|------------|------|
| sm | 64 | 128 | 리스트 아이템 |
| md | 128 | 256 | 매치카드, 순위표 |
| lg | 256 | 512 | 헤더, 히어로 |

### 8.4 asset_cache 테이블

| 컬럼 | 설명 |
|------|------|
| type | `player_photo`, `coach_photo`, `team_logo`, `league_logo`, `venue_photo` |
| entity_id | API-Sports 엔티티 ID |
| storage_path | Supabase Storage 경로 |
| status | `ready` / `pending` / `error` |
| checked_at | 마지막 상태 확인 시점 |

### 8.5 이미지 TTL

| 타입 | TTL | 이유 |
|------|-----|------|
| player_photo | 30일 | 시즌 중 변경 가능 |
| coach_photo | 30일 | 시즌 중 변경 가능 |
| team_logo | 90일 | 거의 안 바뀜 |
| league_logo | 90일 | 거의 안 바뀜 |
| venue_photo | 180일 | 사실상 불변 |

### 8.6 서버 함수

**파일**: `src/domains/livescore/actions/images/`

| 함수 | 용도 |
|------|------|
| `getTeamLogoUrl(id)` | 팀 로고 단건 |
| `getTeamLogoUrls([ids])` | 팀 로고 배치 |
| `getLeagueLogoUrl(id, isDark?)` | 리그 로고 (다크모드 지원) |
| `getLeagueLogoUrls([ids], isDark?)` | 리그 로고 배치 |
| `getPlayerPhotoUrl(id)` | 선수 사진 단건 |
| `getPlayerPhotoUrls([ids])` | 선수 사진 배치 |
| `getCoachPhotoUrl(id)` | 감독 사진 단건 |
| `getCoachPhotoUrls([ids])` | 감독 사진 배치 |

### 8.7 컴포넌트

| 컴포넌트 | 위치 | 역할 |
|---------|------|------|
| `UnifiedSportsImage` | `shared/components/` | 서버 컴포넌트 — URL 확정 |
| `UnifiedSportsImageClient` | `shared/components/` | 클라이언트 — 렌더링, 로딩/에러/재시도 |

### 8.8 Placeholder & Fallback

| 타입 | Placeholder 경로 |
|------|-----------------|
| player_photo | `/images/placeholder-player.svg` |
| coach_photo | `/images/placeholder-coach.svg` |
| team_logo | `/images/placeholder-team.svg` |
| league_logo | `/images/placeholder-league.svg` |
| venue_photo | `/images/placeholder-venue.svg` |

**Fallback 체인**: Storage URL → 500ms 대기 + 재시도 → Placeholder (에러 시 1시간 쿨다운)

---

## 9. 페이지별 데이터 흐름 상세

### 9.1 메인페이지 (`/`)

```
page.tsx
  ├─ fetchMultiDayMatches() → 3일치 raw data
  ├─ transformToWidgetLeagues() → WidgetLeague[] (빅매치 리그만)
  ├─ <LiveScoreCacheSeeder data={multiDayData} />  ← layout 자식용
  └─ <LiveScoreWidgetV2 initialData={leagues} />
        ├─ WidgetHeader (서버)
        ├─ LeagueToggleClient (클라이언트) × N
        └─ MatchCardServer (서버) × N

layout.tsx 자식:
  HeaderClient → useTodayMatchCount() → CacheSeeder 캐시 히트
  LiveScoreModalClient → useMultiDayMatches() → CacheSeeder 캐시 히트
```

### 9.2 라이브스코어 (`/livescore/football`)

```
page.tsx (searchParams → 자동 dynamic)
  ├─ getQueryClient()
  ├─ Promise.all([
  │    prefetchQuery({ queryKey: matches(yesterday), queryFn: ... }),
  │    prefetchQuery({ queryKey: matches(today),     queryFn: ... }),
  │    prefetchQuery({ queryKey: matches(tomorrow),  queryFn: ... }),
  │  ])
  └─ <HydrationBoundary state={dehydrate(queryClient)}>
       <LiveScoreView initialDate={dateParam} />    ← 1-prop만 전달
     </HydrationBoundary>

LiveScoreView (클라이언트)
  └─ useLiveScore(selectedDate, { showLiveOnly })
       └─ useMatches(date)
            ├─ queryKey: liveScoreKeys.matches(date)
            ├─ HydrationBoundary 캐시 히트 → 로딩 없음
            └─ 폴링: LIVE 30초, 오늘 60초, 나머지 없음
```

### 9.3 경기 상세 (`/livescore/football/match/[id]`)

```
page.tsx
  ├─ fetchCachedMatchFullData(matchId, { events, lineups, stats, standings })
  ├─ FT 경기 → getMatchCacheBulk(id, ['power', 'matchPlayerStats']) (L2 캐시)
  ├─ 진행중 → getCachedPowerData(), fetchAllPlayerStats()
  ├─ getPlayersKoreanNames([playerIds])
  └─ <MatchPageClient
       matchId / initialTab
       initialData / initialPowerData / allPlayerStats / sidebarData />

MatchPageClient (클라이언트)
  └─ useMatchTabData({ matchId, initialData, initialPowerData })
       └─ queryClient.setQueryData() × 탭별 초기화
       └─ 탭 전환 → prefetchTab() (해당 탭 데이터 프리페치)
```

### 9.4 팀 상세 (`/livescore/football/team/[id]`)

```
page.tsx (서버)
  ├─ fetchTeamFullData(id, { matches, squad, playerStats, standings, transfers })
  ├─ getPlayersKoreanNames([playerIds])
  └─ <TeamPageClient
       teamId / initialTab / initialData / playerKoreanNames />

TeamPageClient (클라이언트)
  ├─ <TeamHeader initialData={...} />         ← props 직접 렌더링
  ├─ <TabNavigation activeTab={...} />        ← useState로 탭 관리
  └─ <TabContent initialData={...} tab={...} />
       └─ 탭별 컴포넌트가 initialData에서 필요한 데이터 추출
```

> React Query 미사용. 서버에서 모든 탭 데이터를 fetch하여 props로 전달.
> `useTeamQueries.ts`는 dead code로 삭제됨.

### 9.5 선수 상세 (`/livescore/football/player/[id]`)

```
page.tsx (서버) — searchParams 사용 (자동 dynamic)
  ├─ fetchPlayerFullData(playerId, { all options })
  ├─ getPlayerKoreanName(playerId)
  ├─ getPlayersKoreanNames([rankingsPlayerIds])
  └─ <PlayerPageClient
       playerId / initialTab / initialData / rankingsKoreanNames />

PlayerPageClient (클라이언트)
  ├─ <PlayerHeader playerId={...} initialData={...} />
  │    └─ usePlayerInfo(playerId)           ← L4 캐시
  ├─ <TabNavigation activeTab={...} />      ← useState
  └─ <TabContent playerId={...} currentTab={...} initialData={...} />
       └─ usePlayerTabData({ playerId, initialData, currentTab })
            └─ useQueries() with initialData + initialDataUpdatedAt
            └─ enabled: currentTab === 'xxx' (현재 탭만 활성)
```

> 경기/팀 상세와 달리 React Query를 실제 사용.
> `fixtures.ts`는 `fetchFromFootballApi` 전환 완료.

### 9.6 데이터센터 (`/livescore/football/leagues`)

```
LeaguesPage (서버, ISR 1시간)
  ├─ LEAGUE_CATEGORIES                     ← 하드코딩 상수
  ├─ getLeagueLogoUrls(allLeagueIds)       ← Supabase 배치 조회
  └─ <LeagueCard /> × N

LeaguePage (서버, /leagues/[id])
  ├─ fetchLeagueDetails(id)                ← fetchFromFootballApi('leagues')
  ├─ fetchLeagueStandings(leagueId)        ← fetchFromFootballApi('standings')
  ├─ getLeagueLogoUrl / getTeamLogoUrls    ← 4590 이미지
  ├─ <LeagueHeader />
  └─ <LeagueStandingsTable />
```

> React Query 미사용. 서버에서 fetch → props 전달.

### 9.7 이적시장 (`/transfers`)

```
TransfersPage (서버, searchParams → 자동 dynamic)
  ├─ fetchTransfersFullData(filters)       ← Supabase transfers_cache (24시간)
  │                                           → 미스 시 fetchFromFootballApi('transfers')
  ├─ getPlayersKoreanNames / getPlayerPhotoUrls / ensureAssetsCached
  └─ <TransfersPageContent initialData={...} />
       ├─ <TransferFilters />              ← 클라이언트 필터 (URL 업데이트)
       └─ <TransferList />
```

> React Query 미사용. 필터 변경 시 URL searchParams 업데이트 → 서버 리렌더링.

### 9.8 추가 도메인 (API-Sports 사용)

#### 예측 분석 (`/prediction`, `/admin/prediction`)

```
prediction/actions.ts (서버)
  ├─ fetchPredictions(fixtureId)        ← fetchFromFootballApi('predictions')
  ├─ getUpcomingMatches(date)           ← fetchFromFootballApi('fixtures', { date, status: 'NS' })
  ├─ getTeamLogoUrls / getLeagueLogoUrl ← 4590 이미지
  └─ generateLeaguePredictionPost()     ← Tiptap 게시글 생성

prediction/utils/predictMatch.ts (서버)
  ├─ fetchFromFootballApi('fixtures')    ← 경기 정보
  ├─ fetchFromFootballApi('teams/statistics') ← 팀 통계 (시즌 폴백)
  ├─ fetchFromFootballApi('injuries')    ← 부상 정보
  ├─ fetchFromFootballApi('fixtures')    ← 팀 폼 (last N)
  ├─ fetchFromFootballApi('fixtures/headtohead') ← 상대전적
  ├─ fetchFromFootballApi('odds')        ← 배당률
  └─ OpenAI GPT-4.1-nano → AI 분석 → Supabase 캐시
```

> 모든 API 호출 `fetchFromFootballApi` 사용 ✅

#### 사이드바 순위표

```
sidebar/actions/football.ts (서버)
  └─ fetchStandingsData(leagueKey)       ← fetchFromFootballApi('standings')
       ├─ React cache() 래핑 (L3)
       ├─ getTeamLogoUrls (4590)
       └─ standings: 30분 revalidate (L1)
```

> `fetchFromFootballApi` 전환 완료 ✅ (기존: 직접 fetch)

#### 에디터 선수 카드

```
boards/actions/createPlayerCardData.ts (서버)
  ├─ getPlayerPhotoUrl(id)               ← Supabase 이미지 (API-Sports 호출 없음)
  └─ getTeamLogoUrl(id)                  ← Supabase 이미지
```

> API-Sports 직접 호출 없음 ✅

#### Admin 팀 동기화

```
livescore/actions/footballTeamsSync.ts (서버)
  └─ syncAllFootballTeamsFromApi()       ← 직접 fetch() (no-store)
       ├─ 모든 리그 팀 데이터 일괄 동기화
       └─ football_teams 테이블 upsert
```

> Admin 전용, 매뉴얼 실행. 항상 최신 데이터 필요 → `no-store` 정상.
> `fetchFromFootballApi` 미사용은 의도적 (TTL 불필요, 일괄 동기화).

---

## 10. 페이지별 React Query 설정 요약

### 라이브스코어 훅 (`useLiveScoreQueries.ts`)

| 훅 | staleTime | gcTime | 폴링 |
|----|-----------|--------|------|
| `useMatches()` | 5분 | 30분 | 30초(LIVE) / 60초(오늘) / 없음 |
| `useTodayLiveCount()` | 1분 | 10분 | 60초 |
| `useMultiDayMatches()` | 5분 | 10분 | 없음 |

### 경기 상세 — React Query 미사용

> `useMatchQueries.ts` 삭제됨. 서버에서 모든 탭 데이터를 fetch하여 props로 직접 전달.

### 팀 상세 — React Query 미사용

> `useTeamQueries.ts` 삭제됨. 서버에서 모든 탭 데이터를 fetch하여 props로 직접 전달.

### 선수 상세 훅 (`usePlayerQueries.ts`) — CACHE_STRATEGIES 사용

실제 사용 훅: `usePlayerInfo` (PlayerHeader), `usePlayerTabData` (TabContent).
개별 훅(usePlayerStats 등 6개) + `usePlayerAllTabs`는 dead code → 삭제 완료.

| 쿼리 (usePlayerTabData 내부) | 전략 | staleTime | gcTime |
|----|------|-----------|--------|
| `playerKeys.info` | STABLE_DATA | 30분 | 2시간 |
| `playerKeys.stats` | OCCASIONALLY_UPDATED | 5분 | 30분 |
| `playerKeys.fixtures` | OCCASIONALLY_UPDATED | 5분 | 30분 |
| `playerKeys.transfers` | STATIC_DATA | 1시간 | 24시간 |
| `playerKeys.trophies` | STATIC_DATA | 1시간 | 24시간 |
| `playerKeys.injuries` | STABLE_DATA | 30분 | 2시간 |
| `playerKeys.rankings` | STABLE_DATA | 30분 | 2시간 |

### 데이터센터/리그 — React Query 미사용

> 서버 컴포넌트에서 모든 데이터 fetch → props 전달.
> 리그 목록은 ISR 1시간, 리그 상세는 `await params` 자동 dynamic.

### 이적시장 — React Query 미사용

> 서버 컴포넌트에서 `fetchTransfersFullData` → props 전달.
> 필터 변경은 URL searchParams 업데이트 → 서버 리렌더링.
> Supabase `transfers_cache` (24시간 TTL) + L1 캐시 (24시간).

---

## 11. 파일 맵

### 서버 액션 (API 호출)

```
src/domains/livescore/actions/
├── footballApi.ts              ← fetchFromFootballApi (표준 래퍼)
├── images/
│   ├── index.ts                ← getTeamLogoUrl, getPlayerPhotoUrl 등
│   ├── constants.ts            ← 4590 상수 (TTL, 사이즈, 버킷)
│   └── ensureAssetCached.ts    ← WebP 변환, Storage 업로드
├── match/
│   ├── matchData.ts            ← fetchCachedMatchFullData
│   ├── matchCache.ts           ← L2 Supabase match_cache
│   ├── eventData.ts
│   ├── lineupData.ts
│   ├── statsData.ts
│   ├── standingsData.ts
│   ├── headtohead.ts
│   ├── playerStats.ts
│   └── sidebarData.ts
├── player/
│   ├── data.ts                 ← fetchPlayerFullData
│   ├── player.ts
│   ├── stats.ts
│   ├── fixtures.ts
│   ├── rankings.ts
│   ├── injuries.ts
│   ├── transfers.ts
│   └── trophies.ts
├── teams/
│   ├── team.ts                 ← fetchTeamFullData
│   ├── matches.ts
│   ├── squad.ts
│   ├── player-stats.ts
│   ├── standings.ts
│   └── transfers.ts
├── transfers/
│   ├── index.ts                ← fetchTransfersFullData
│   └── transfersCache.ts       ← Supabase transfers_cache (24시간 TTL)
└── footballTeamsSync.ts        ← Admin 동기화 (no-store)
```

### 유틸리티

```
src/domains/livescore/utils/
├── transformMatch.ts           ← transformMatches() — API 데이터 → Match[]
├── resolveMatchNames.ts        ← resolveMatchNames() — 한국어 팀명/리그명 해석 (공통 유틸)
└── matchDataApi.ts             ← 매치 상세 데이터 API (fetchFromFootballApi 전환 완료)
```

### React Query 훅

```
src/domains/livescore/hooks/
├── index.ts                    ← re-exports
├── useLiveScoreQueries.ts      ← useMatches, useLiveScore
├── useLiveScoreData.ts         ← useMultiDayMatches (CacheSeeder용)
└── usePlayerQueries.ts         ← usePlayerInfo + usePlayerTabData (죽은 훅 7개 삭제 완료)
(useMatchQueries.ts — 삭제됨, dead code)
(useTeamQueries.ts — 삭제됨, dead code)
```

### 공유 인프라

```
src/shared/
├── constants/
│   ├── queryKeys.ts            ← 모든 Query Key 정의 (유일한 소스)
│   └── cacheConfig.ts          ← CACHE_STRATEGIES 상수
├── api/
│   ├── supabase.ts             ← 클라이언트 Supabase
│   ├── supabaseServer.ts       ← 서버 Supabase
│   └── getQueryClient.ts       ← 서버 QueryClient 팩토리
├── components/
│   ├── LiveScoreCacheSeeder.tsx ← 메인페이지 캐시 주입
│   ├── UnifiedSportsImage.tsx   ← 4590 서버 이미지 컴포넌트
│   └── UnifiedSportsImageClient.tsx ← 4590 클라이언트 이미지 컴포넌트
└── utils/
    (footballApi.ts — 삭제됨, 레거시)
    (apiCache.ts — 삭제됨, 레거시)
```

---

## 12. 페이지 렌더링 정책: `force-dynamic` 사용 기준

### 원칙

`force-dynamic`은 페이지 HTML 캐시를 비활성화한다.
내부 `fetch()` 호출의 `next: { revalidate }` (L1)은 여전히 동작하므로
API 쿼터 누수는 없지만, **페이지 HTML이 매 요청마다 재생성**되어 TTFB가 증가한다.

**`force-dynamic`이 필요한 경우**:
- 쿠키/세션/헤더에 따라 페이지 내용이 달라지는 경우
- `searchParams`를 사용하는 경우 (Next.js 15에서 자동 dynamic)

**`force-dynamic`이 불필요한 경우**:
- 데이터만 동적이고 사용자별 차이가 없는 경우 → `fetch revalidate`로 충분
- `searchParams` 사용 시 이미 자동 dynamic → 중복 선언 불필요

### 현재 상태

| 페이지 | force-dynamic | 필요 여부 | 사유 |
|--------|:------------:|:---------:|------|
| `/livescore/football` | ~~명시됨~~ 제거됨 | 중복 | `searchParams` 사용으로 이미 자동 dynamic |
| `/livescore/football/player/[id]` | ~~명시됨~~ 제거됨 | 중복 | `searchParams` 사용으로 이미 자동 dynamic |
| `/livescore/football/match/[id]` | 없음 | — | 정상 |
| `/livescore/football/team/[id]` | 없음 | — | 정상 |

> `force-dynamic`보다 "데이터 dynamic(`fetch revalidate`)"이 이 아키텍처와 맞는 방식이다.
> 페이지 레벨에서 동적 렌더를 강제하는 것보다, fetch 레벨에서 TTL을 제어하는 것이 L1 캐시를 살린다.

---

## 13. 기술부채 우선순위

아키텍처 표준과 현재 코드 사이의 차이를 정리한다.
위에서 아래로 우선순위 순.

### P0: 쿼터 누수 위험 (즉시) — ✅ 해결

| 항목 | 현재 | 목표 | 파일 |
|------|------|------|------|
| ~~`matchDataApi.ts` `no-store` 호출~~ | ✅ `fetchFromFootballApi()` 전환 완료 | — | `matchDataApi.ts` |
| ~~`fixtures.ts` 직접 `fetch()`~~ | ✅ `fetchFromFootballApi()` 전환 완료 (Semaphore/retry/API_CONFIG 삭제) | — | `actions/player/fixtures.ts` |

### P1: 캐시 정확성 (키 통합) — 부분 해결

| 항목 | 현재 | 목표 | 파일 |
|------|------|------|------|
| ~~`matchKeys` 로컬 정의~~ | ✅ shared import 완료 | — | ~~`useMatchQueries.ts`~~ (삭제) |
| ~~`teamKeys` 로컬 정의~~ | ✅ `useTeamQueries.ts` 삭제로 해결 | — | ~~`useTeamQueries.ts`~~ (삭제) |
| ~~match 훅 캐시 상수~~ | ✅ `useMatchQueries.ts` 삭제로 해결 | — | ~~`useMatchQueries.ts`~~ (삭제) |
| ~~team 훅 캐시 상수~~ | ✅ `useTeamQueries.ts` 삭제로 해결 | — | ~~`useTeamQueries.ts`~~ (삭제) |

### P2: Hydration 품질 (HydrationBoundary) — ✅ 해결

| 항목 | 현재 | 상태 |
|------|------|------|
| ~~경기 상세~~ | ✅ React Query 미사용 (props 직접 전달), 죽은 훅 삭제 완료 | ✅ |
| ~~팀 상세~~ | ✅ React Query 미사용 (props 직접 전달), 죽은 훅 삭제 완료 | ✅ |
| ~~선수 상세~~ | ✅ `initialData` + `initialDataUpdatedAt` 정상 작동, 죽은 훅 7개 삭제 완료 | ✅ |
| ~~라이브스코어~~ | ✅ HydrationBoundary + prefetchQuery 전환 완료. 6-prop → 1-prop 단순화. | ✅ |

### P3: 캐시 안전성 — ✅ 해결

| 항목 | 현재 | 상태 |
|------|------|------|
| ~~L2 match_cache soft TTL~~ | ✅ 6시간 soft TTL 구현 완료 (`power` 제외 전 타입) | ✅ |
| ~~`force-dynamic` 중복 선언~~ | ✅ 라이브스코어/팀 상세/선수 상세 모두 제거 완료 | ✅ |

### P4: 코드 품질 (중복/타입/구조) — ✅ 해결

#### ~~4-1. transformMatches vs convertToMatch 로직 중복~~ — ✅ 해결

`resolveMatchNames()` 공통 유틸리티를 추출하여 단일 소스로 통합.

| 파일 | 변경 |
|------|------|
| `livescore/utils/resolveMatchNames.ts` | **새 파일** — `getTeamById()` + `getLeagueById()` 한국어 매핑 통합 |
| `livescore/utils/transformMatch.ts` | `resolveMatchNames()` 사용으로 리팩토링 |
| `widgets/.../LiveScoreWidgetV2Server.tsx` | `resolveMatchNames()` 사용으로 리팩토링 |

#### ~~4-2. Match 타입 이름 충돌~~ — ✅ 해결

위젯 타입을 네임스페이스 분리 완료:

| Before | After |
|--------|-------|
| `Match` | `WidgetMatch` |
| `Team` | `WidgetTeam` |
| `League` | `WidgetLeague` |

#### ~~4-3. useLiveScore 6-prop 코드 스멜~~ — ✅ P2에서 자동 해결

HydrationBoundary 전환으로 `LiveScoreView`가 `initialDate` 1-prop만 받음.
서버 데이터는 React Query 캐시를 통해 자동 주입.

#### ~~4-4. 메인→라이브스코어 네비게이션 시 오늘 데이터 이중 fetch~~ — ✅ P2에서 자동 해결

HydrationBoundary로 서버 데이터가 React Query L4 캐시에 주입되므로,
메인→라이브스코어 이동 시 클라이언트 캐시 히트로 중복 fetch 방지.

### P5: 레거시 정리 — ✅ 완료

| 항목 | 상태 |
|------|:----:|
| ~~`shared/utils/footballApi.ts` 삭제~~ | ✅ 삭제 완료 |
| ~~`shared/utils/apiCache.ts` 삭제~~ | ✅ 삭제 완료 |
| ~~`search/actions/teamMatches.ts` 삭제~~ | ✅ @deprecated, import 0건 → 삭제 완료 |
| ~~`sidebar/actions/football.ts` 직접 fetch~~ | ✅ `fetchFromFootballApi` 전환 완료 |
