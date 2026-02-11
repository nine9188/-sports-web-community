# 메인 페이지 성능 최적화 계획

> 작성일: 2026-02-08
> 상태: 전체 최적화 완료 (Phase 1~3 + 이미지 + eager loading + 모바일 사이드바 스킵)

## 1. 문제 정의

메인 페이지(`/`) 첫 로딩이 느리다. 원인은 **첫 화면 경로(critical path)에 모든 데이터 fetch를 몰아넣은 구조**.

### Phase 1 이전 렌더링 흐름 (원본 문제)

```
[1단계] layout.tsx await (블로킹)             ~200-400ms
  ├── getFullUserData()         → DB 3~4개 (auth + profile + counts + icon)
  └── getBoardsForNavigation()  → DB 2개 (boards + posts count)

[2단계] layout JSX 서버 컴포넌트 (동시, 하지만 전부 끝나야 layout 완료)
  ├── ServerLeagueStandings     → 외부 API 1회 + 이미지 3개   ~300-1000ms
  └── RightSidebar              → DB 5~7개 + 이미지 3개       ~200-400ms

[3단계] page.tsx await (layout 완료 후 시작)
  ├── fetchLiveScoreData()        → 외부 API 3회 + 이미지 9개
  ├── fetchBoardCollectionData()  → DB 3개
  ├── fetchAllPostsData()         → DB 7~8개 + 이미지 3개
  └── fetchNewsData()             → DB 4개

총 TTFB: ~1100-2800ms (캐시 미스 시)
총 쿼리: DB ~28개, 외부 API 4회, 이미지 조회 18회
```

### 전체 최적화 완료 후 현재 렌더링 흐름

```
[1단계] layout.tsx await (블로킹)                     ~100-200ms
  └── getBoardsForNavigation()    → DB 2개 (getFullUserData 제거됨 ✅)

[2단계] layout JSX 반환 후 동시 시작
  ├── page.tsx await              → fetchLiveScoreData(캐시 ~1ms) + fetchBoardCollectionData(DB 3)
  ├── ServerLeagueStandings       → Suspense 비동기 스트리밍 (외부 API + 이미지)
  └── RightSidebar                → Suspense 비동기 스트리밍 (DB 5~7 + 이미지)

[3단계] page.tsx await 완료 → 첫 HTML 전송              ~100-200ms
  └── layout shell + LiveScore + BoardCollection + Suspense fallbacks

[4단계] Suspense 스트리밍 (각자 준비되면 전송, 비블로킹)
  ├── AllPostsWidget              → DB 7~8 + 이미지 3 (count+posts 병렬화 ✅)
  ├── NewsWidget                  → DB 4
  ├── ServerLeagueStandings       → 외부 API 1 + 이미지 3
  └── RightSidebar                → DB 5~7 + 이미지 3

[클라이언트] React Query로 비동기 fetch (비블로킹)
  └── getFullUserData()           → 프로필, isAdmin, AuthSection 렌더링

첫 HTML TTFB: ~200-400ms (layout DB 2 + page DB 3 + API 캐시)
블로킹 쿼리: DB ~5개, API 3회(캐시)
나머지: Suspense 스트리밍 + 클라이언트 React Query
```

### 핵심 원인 및 해결 현황

1. ~~**layout에서 cookies() 사용**~~ → layout의 getFullUserData 제거 ✅ (Phase 2). 단, getBoardsForNavigation에 여전히 cookies() 있음
2. ~~**layout에 무거운 사이드바**~~ → ✅ Phase 1-1에서 Suspense 래핑으로 해결
3. ~~**page 위젯 전부 서버 await**~~ → ✅ Phase 1-2에서 below-fold Suspense 분리로 해결
4. ~~**Suspense 스트리밍 부재**~~ → ✅ Phase 1에서 layout/page 모두 Suspense 추가
5. ~~**layout의 getFullUserData()**~~ → ✅ Phase 2에서 클라이언트 React Query로 이동
6. ~~**이미지 이중 DB 조회**~~ → ✅ MatchCardServer에서 이미 조회된 URL 직접 사용
7. ~~**fetchPosts count+posts 순차 실행**~~ → ✅ Phase 3에서 Promise.all 병렬화

### 비교: op.gg talk / fotmob

| | op.gg talk | fotmob | 우리 사이트 |
|---|---|---|---|
| 방식 | 빠른 SSR (쿼리 적음) | 셸 먼저 + 클라이언트 fetch | 서버에서 전부 완료 후 전송 |
| 첫 화면 경로 | 가벼움 | 거의 없음 | **28개 쿼리 + API 4회** |
| TTFB | ~100ms | ~50ms | ~1100-2800ms |

## 2. 목표

- **SSR 유지** (커뮤니티 사이트 = 매번 fresh 데이터, ISR/캐시로 게시글 지연 불가)
- **첫 화면 경로 최소화** (레이아웃/사이드바 분리, 핵심 콘텐츠만 SSR)
- **TTFB ~200-400ms 목표**

## 3. 최적화 전략: "첫 화면 경로에서 빼기"

### 원칙

```
첫 화면에 보이는 것 → SSR 유지 (빠르게)
첫 화면에 안 보이는 것 → Suspense 스트리밍 또는 클라이언트 로딩
```

### 3-1. Layout 경량화

#### A. getFullUserData() → 클라이언트로 이동

| 항목 | 현재 | 변경 후 |
|------|------|---------|
| 위치 | layout.tsx (서버 await) | 클라이언트 React Query |
| 쿼리 | DB 3~4개 | 서버 0개 |
| 효과 | cookies() 제거 → dynamic 강제 해제 가능 | layout이 가벼워짐 |

**관련 파일**:
- `src/app/(site)/layout.tsx` (호출부)
- `src/shared/actions/user.ts` (getFullUserData 구현)
- `src/domains/sidebar/components/auth/AuthSection.tsx` (소비)
- `src/app/(site)/SiteLayoutClient.tsx` (전달)

**영향 범위**:
- 헤더의 로그인/프로필 표시 → 클라이언트 hydration 후 표시 (깜빡임 최소화 필요)
- isAdmin 판단 → 클라이언트에서 처리
- 사이드바 AuthSection → 클라이언트 컴포넌트로 전환

#### B. ServerLeagueStandings → Suspense 래핑

| 항목 | 현재 | 변경 후 |
|------|------|---------|
| 위치 | layout JSX 직접 포함 | `<Suspense>` 래핑 |
| 블로킹 | layout 완료까지 대기 | layout 즉시 완료, 나중에 스트리밍 |
| 효과 | 외부 API 300-1000ms 제거 | layout ~100ms로 단축 |

**관련 파일**:
- `src/app/(site)/layout.tsx:41` (호출부)
- `src/domains/sidebar/components/league/ServerLeagueStandings.tsx`

**비고**: `hidden md:block` → 모바일에서 아예 안 보이는데 항상 fetch 중

#### C. RightSidebar → Suspense 래핑

| 항목 | 현재 | 변경 후 |
|------|------|---------|
| 위치 | layout JSX 직접 포함 | `<Suspense>` 래핑 |
| 블로킹 | layout 완료까지 대기 | layout 즉시 완료, 나중에 스트리밍 |
| 효과 | DB 5~7개 + 이미지 3개 제거 | layout ~100ms로 단축 |

**관련 파일**:
- `src/app/(site)/layout.tsx:70` (호출부)
- `src/domains/sidebar/components/RightSidebar.tsx`

**비고**: `hidden xl:block` → 데스크톱 XL에서만 보이는데 항상 fetch 중

### 3-2. Page 위젯 스트리밍

#### 첫 화면 (above fold) → SSR 유지

| 위젯 | 쿼리 | 유지 이유 |
|------|------|----------|
| BoardQuickLinks | 0 | 정적 아이콘, 쿼리 없음 |
| LiveScoreWidget | API 3회 (인메모리 캐시 5분) | 첫 화면 핵심 콘텐츠 |
| BoardCollectionWidget | DB 3개 | 첫 화면에 보임 |

#### 스크롤 아래 (below fold) → Suspense 스트리밍

| 위젯 | 쿼리 | 변경 |
|------|------|------|
| AllPostsWidget | DB 7~8개 + 이미지 3개 | `<Suspense>` 래핑 |
| NewsWidget | DB 4개 | `<Suspense>` 래핑 |

**관련 파일**:
- `src/app/(site)/page.tsx` (위젯 배치)
- `src/domains/widgets/components/AllPostsWidget.tsx`
- `src/domains/widgets/components/news-widget/NewsWidget.tsx`

### 3-3. fetchAllPostsData 폭포 최적화

현재 3~4단계 순차 폭포:
```
Step 1: posts SELECT + COUNT (순차)
Step 2: boards + profiles + comments (3개 병렬)
Step 3: teamLogos + leagueLogos×2 (3개 병렬)
Step 4: 데이터 조합
```

**개선**: Step 1~3을 가능한 한 병합하여 단계 줄이기

**관련 파일**:
- `src/domains/boards/actions/getPosts.ts` (fetchPosts 구현)

## 4. 최적화 전후 비교

### 블로킹 쿼리 수 비교 (최종)

| | 최적화 이전 (블로킹) | 현재 (블로킹) | 현재 (스트리밍/클라이언트) |
|---|---|---|---|
| Layout (유저) | DB 4 | - | 클라이언트 React Query ✅ |
| Layout (게시판) | DB 2 | DB 2 | - |
| Layout (사이드바) | DB 7 + API 1 + 이미지 6 | - | Suspense 스트리밍 ✅ |
| LiveScore | API 3 + 이미지 9 | API 3 (캐시) | - |
| LiveScore 이미지 | 이미지 20 (이중 조회) | - | 이중 조회 제거 ✅ |
| BoardCollection | DB 3 | DB 3 | - |
| AllPosts | DB 8 + 이미지 3 | - | Suspense 스트리밍 (count+posts 병렬화 ✅) |
| News | DB 4 | - | Suspense 스트리밍 ✅ |
| **합계 (블로킹)** | **DB ~28 + API 4 + 이미지 29** | **DB ~5 + API 3(캐시)** | - |
| **예상 TTFB** | **~1100-2800ms** | **~200-400ms** | - |

### 단계별 첫 화면 경로

```
최적화 이전:
  Layout: DB 6 + 사이드바(API 1 + DB 7 + 이미지 6) → ~700-1400ms (전부 블로킹)
  → Page: DB 22 + API 3 + 이미지 12                 → ~500-1500ms (전부 블로킹)
  총 TTFB: ~1100-2800ms

현재 (Phase 1~3 + 이미지 수정 완료):
  Layout: DB 2 (getBoardsForNavigation만)            → ~100-200ms (블로킹)
  → Page: LiveScore(캐시) + BoardCollection(DB 3)   → ~100-200ms (블로킹)
  → 나머지: Suspense 스트리밍 + 클라이언트 React Query
  첫 HTML TTFB: ~200-400ms
```

### 참고: `revalidate = 60`은 무효

`page.tsx`에 `export const revalidate = 60`이 있지만 완전히 무효:
- layout의 `getFullUserData()` → `getSupabaseServer()` → `cookies()` 호출
- page의 `fetchBoardCollectionData()` → `getSupabaseServer()` → `cookies()` 호출
- `cookies()` 사용 시 전체 라우트가 dynamic으로 강제됨 → ISR 불가
- Phase 2에서 layout의 cookies() 제거 후에도 page에서 cookies() 호출하므로 ISR 적용 불가
- 커뮤니티 사이트 특성상 ISR 자체가 부적합 (새 글이 즉시 보여야 함)

## 5. 실행 순서

### Phase 1: Suspense 래핑 (즉시 효과, 최소 변경) ✅ 완료

#### 1-1. Layout 사이드바 Suspense 래핑 ✅ 완료 (2026-02-08)

`src/app/(site)/layout.tsx` 변경:
- `ServerLeagueStandings`를 `<Suspense fallback={<LeagueStandingsSkeleton />}>`로 래핑
- `RightSidebar`를 `<Suspense fallback={<RightSidebarSkeleton />}>`로 래핑
- fallback: CLS 방지를 위해 원본과 같은 CSS 크기 유지 (`hidden md:block`, `hidden xl:block w-[300px]`)

**변경 효과**:
- layout body의 `await Promise.all` 완료 후 즉시 JSX 반환 가능
- ServerLeagueStandings (외부 API ~300-1000ms) + RightSidebar (DB 5~7개 ~200-400ms)가 layout을 블로킹하지 않음
- 두 컴포넌트는 Suspense 스트리밍으로 준비되면 전송 (데이터는 매번 fresh)

**빌드 확인**: `next build` 성공

#### 1-2. Page below-fold 위젯 Suspense 래핑 ✅ 완료 (2026-02-08)

`src/app/(site)/page.tsx` 변경:
- `fetchAllPostsData`, `fetchNewsData` import 제거
- `Promise.all`에서 4개 fetch → 2개로 축소 (LiveScore + BoardCollection만)
- `AllPostsWidget`, `NewsWidget`을 `<Suspense>`로 래핑 (initialData 없이 자체 fetch)

**변경 전**:
```typescript
const [liveScoreData, boardCollectionData, allPostsData, newsData] = await Promise.all([
  fetchLiveScoreData(),
  fetchBoardCollectionData(),
  fetchAllPostsData(),   // ← DB 7~8개 + 이미지 3개
  fetchNewsData(),       // ← DB 4개
]);
```

**변경 후**:
```typescript
const [liveScoreData, boardCollectionData] = await Promise.all([
  fetchLiveScoreData(),
  fetchBoardCollectionData(),
]);
// AllPostsWidget, NewsWidget은 <Suspense>로 래핑하여 자체 fetch → 스트리밍
```

**변경 효과**:
- page.tsx의 블로킹 쿼리에서 DB 11~12개 + 이미지 3개 제거
- AllPostsWidget/NewsWidget이 각각 독립적으로 fetch → 준비되는 대로 스트리밍 전송
- 첫 화면(above-fold) HTML이 더 빠르게 전송됨
- 데이터는 매번 fresh (Suspense 스트리밍은 캐시가 아님)

**빌드 확인**: `next build` 성공

### 이미지 이중 조회 수정 ✅ 완료 (2026-02-08)

`src/domains/widgets/components/live-score-widget/MatchCardServer.tsx` 변경:
- `UnifiedSportsImage` (async 서버 컴포넌트, DB 재조회) → `UnifiedSportsImageClient` (직접 URL 사용)
- `fetchBigMatches()`에서 이미 배치 조회된 `match.homeTeam.logo` / `match.awayTeam.logo` URL을 직접 사용

**변경 효과**:
- 이미지별 개별 DB 조회 20회 → 0회
- 서버 렌더링 시간 단축 (불필요한 async 제거)

**빌드 확인**: `next build` 성공

### Phase 2: Layout에서 유저 데이터 분리 ✅ 완료 (2026-02-08)

변경 내용:
1. `layout.tsx`: `getFullUserData()` 제거, `Promise.all` → `await getBoardsForNavigation()` 단독
2. `SiteLayoutClient.tsx`: `useQuery({ queryKey: ['fullUserData'] })` 추가, `isAdmin`/`authSection`/`headerUserData` 클라이언트에서 생성
3. `AuthSection.tsx`: `'use client'` 지시문 추가 (클라이언트 컴포넌트 내부에서 렌더링)
4. `ClientBoardNavigation.tsx`: `useQuery` 추가로 isAdmin 독립 확인 (React Query 캐시 공유)

**변경 효과**:
- layout 블로킹에서 DB 3~4개 제거 (auth + profile + counts + icon)
- layout 블로킹: DB 5~6개 → DB 2개
- 유저 데이터는 클라이언트 hydration 후 React Query로 fetch (비블로킹)
- 같은 `['fullUserData']` queryKey로 SiteLayoutClient와 ClientBoardNavigation 간 캐시 공유

**빌드 확인**: `next build` 성공

### Phase 3: fetchPosts count+posts 병렬화 ✅ 완료 (2026-02-08)

`src/domains/boards/actions/getPosts.ts` 변경:
- count 쿼리와 posts 쿼리를 순차 실행 → `Promise.all` 병렬 실행

**변경 전**:
```typescript
const { count } = await countQuery;                    // 순차 1
const { data: postsData } = await postsQuery           // 순차 2
  .range(offset, offset + limit - 1).limit(limit);
```

**변경 후**:
```typescript
const [countResult, postsResult] = await Promise.all([ // 병렬
  countQuery,
  postsQuery.range(offset, offset + limit - 1).limit(limit)
]);
```

**변경 효과**:
- AllPostsWidget Suspense 스트리밍 내부에서 DB 쿼리 1단계 절약
- count + posts 쿼리가 동시에 실행되어 ~50-100ms 단축

**빌드 확인**: `next build` 성공

## 6. 주의사항

### 커뮤니티 사이트 특성
- **ISR/캐시로 게시글 지연 불가** → 새로고침 시 새 글 즉시 표시 필수
- Suspense 스트리밍은 캐시가 아님 → 매번 fresh 데이터, 준비된 순서대로 전송
- `unstable_cache`는 사이드바(순위, 인기글)에만 적용 가능 (이미 적용됨)

### SEO
- 메인 페이지 핵심 콘텐츠(LiveScore, BoardCollection)는 SSR 유지 → SEO 영향 없음
- AllPosts/News는 Suspense 스트리밍 → 서버에서 렌더링되므로 SEO 유지
- 사이드바는 SEO 가치 낮음 → 클라이언트 로딩 무방

### Suspense fallback
- 사이드바: 높이 고정된 빈 영역 (CLS 방지)
- below-fold 위젯: 간단한 Spinner 또는 빈 Container

## 7. 관련 파일 목록

### Phase 1에서 변경된 파일

| 파일 | 역할 | 변경 내용 |
|------|------|----------|
| `src/app/(site)/layout.tsx` | 사이트 레이아웃 | ✅ Suspense 래핑 (ServerLeagueStandings, RightSidebar) |
| `src/app/(site)/page.tsx` | 메인 페이지 | ✅ below-fold 위젯 Suspense 래핑, Promise.all 4→2 축소 |

### Phase 1에서 변경하지 않은 파일 (Suspense로 감싸짐)

| 파일 | 역할 | 비고 |
|------|------|------|
| `src/domains/sidebar/components/league/ServerLeagueStandings.tsx` | 순위표 | Suspense 내부에서 자체 fetch |
| `src/domains/sidebar/components/RightSidebar.tsx` | 우측 사이드바 | Suspense 내부에서 자체 fetch |
| `src/domains/widgets/components/AllPostsWidget.tsx` | 전체 게시글 | Suspense 내부에서 자체 fetch (initialData 없이) |
| `src/domains/widgets/components/news-widget/NewsWidget.tsx` | 뉴스 | Suspense 내부에서 자체 fetch (initialData 없이) |

### Suspense JSX 전달 체인 (검증 완료)

```
layout.tsx (Suspense 생성)
  → SiteLayoutClient.tsx (React.ReactNode props로 전달)
    → AuthStateManager.tsx (props로 전달)
      → Sidebar.tsx (leagueStandingsComponent: 데스크톱 line 56, 모바일 line 96)
      → {rightSidebar} (line 94, isMatchPage일 때 숨김)
```

### Phase 2 + 3 + 이미지 수정에서 변경된 파일

| 파일 | Phase | 변경 내용 |
|------|-------|----------|
| `src/app/(site)/layout.tsx` | Phase 2 ✅ | getFullUserData() 제거, Promise.all → 단독 await |
| `src/app/(site)/SiteLayoutClient.tsx` | Phase 2 ✅ | useQuery로 유저 데이터 클라이언트 fetch, isAdmin/authSection 생성 |
| `src/domains/sidebar/components/auth/AuthSection.tsx` | Phase 2 ✅ | `'use client'` 지시문 추가 |
| `src/domains/sidebar/components/board/ClientBoardNavigation.tsx` | Phase 2 ✅ | useQuery로 isAdmin 독립 확인 |
| `src/domains/boards/actions/getPosts.ts` | Phase 3 ✅ | count+posts 쿼리 Promise.all 병렬화 |
| `src/domains/widgets/components/live-score-widget/MatchCardServer.tsx` | 이미지 ✅ | UnifiedSportsImage → UnifiedSportsImageClient (이중 조회 제거) + priorityImages prop 추가 |
| `src/domains/widgets/components/live-score-widget/LiveScoreWidgetV2Server.tsx` | 이미지 ✅ | 첫 리그에 priorityImages={true} 전달 |
| `src/app/(site)/page.tsx` | 정리 ✅ | 무효한 `revalidate = 60` 제거 |
| `src/app/(site)/layout.tsx` | 모바일 ✅ | User-Agent로 모바일 감지, RightSidebar fetch 스킵 |

## 8. 모바일 성능 분석

### 문제: 안 보이는 데이터를 항상 fetch

서버 컴포넌트는 CSS `hidden`과 관계없이 **항상 실행**된다. 모바일에서 안 보이는 사이드바 데이터를 매번 조회 중.

#### 뷰포트별 낭비

| 뷰포트 | RightSidebar | LeagueStandings | 낭비 쿼리 |
|---------|-------------|-----------------|----------|
| **모바일** (<768px) | `hidden xl:block` → **안 보임** | `hidden lg:block` → **안 보임** | **DB 8개 + API 1 + 이미지 6개** |
| **태블릿** (768-1024px) | `hidden xl:block` → **안 보임** | 보임 | **DB 6개 + 이미지 3개** |
| **데스크톱** (1024-1280px) | `hidden xl:block` → **안 보임** | 보임 | **DB 6개 + 이미지 3개** |
| **XL** (1280px+) | 보임 | 보임 | 없음 |

**모바일 사용자 1만명/일 기준**:
- 낭비 DB 쿼리: 10,000 × 8 = **80,000개/일**
- 낭비 외부 API: 10,000 × 1 = **10,000회/일**
- 낭비 데이터: ~50-100KB × 10,000 = **~1GB/일**

### 근본 원인

```
서버 컴포넌트 실행 순서:
  1. layout.tsx가 <RightSidebar />, <ServerLeagueStandings /> 생성
  2. 서버에서 async 함수 실행 → DB/API 호출 (뷰포트 모름)
  3. HTML 렌더링 → CSS hidden 적용
  4. 클라이언트에 전송 → 안 보이지만 데이터는 이미 fetch 완료

문제: 서버는 뷰포트를 모른다 → CSS hidden은 fetch를 막지 못한다
```

### 해결: Suspense + User-Agent 기반 조건부 렌더링 ✅ 완료

**Phase 1**: Suspense 래핑으로 블로킹 해결
- ✅ 사이드바 fetch가 layout을 블로킹하지 않음
- ✅ 모바일에서도 메인 콘텐츠 먼저 표시

**추가 최적화**: RightSidebar를 모바일에서 서버 fetch 자체 스킵 ✅
- `layout.tsx`에서 `headers()`로 User-Agent 감지
- `isMobilePhone` = `/iPhone|Android.*Mobile|Windows Phone/` 패턴 매칭
- 모바일이면 `<RightSidebarSkeleton />` (빈 aside) 반환, 서버 fetch 안 함
- 태블릿/데스크톱이면 기존 Suspense + 서버 fetch 유지
- `headers()`는 이미 dynamic 라우트이므로 추가 비용 없음

**ServerLeagueStandings**: 모바일 사이드바 드로어에서도 표시되므로 스킵 불가 (Suspense 스트리밍 유지)

**효과**: 모바일 요청당 DB 5~7개 + 이미지 3개 서버 리소스 절약

## 9. 이미지 순차 로딩 문제 ("주루루루룩")

### 현상

우리 사이트: 이미지가 하나씩 차례로 나타남 (주루루루룩)
fotmob: 이미지가 한번에 딱 나타남

### 원인 1: 이중 조회 (가장 심각)

`fetchBigMatches()`에서 이미 팀/리그 로고 URL을 **배치로 조회 완료**:

```typescript
// footballApi.ts:283-287 - 이미 배치로 한번에 조회함
const [teamLogoUrls, leagueLogoUrls, leagueLogoDarkUrls] = await Promise.all([
  getTeamLogoUrls([...teamIds]),         // 전체 팀 한번에
  getLeagueLogoUrls([...leagueIds]),     // 전체 리그 한번에
  getLeagueLogoUrls([...leagueIds], true) // 다크모드 한번에
]);

// 결과: match.teams.home.logo = "이미 조회된 Storage URL"
```

**그런데** `MatchCardServer` → `UnifiedSportsImage`가 **또 개별로 DB 조회**:

```typescript
// UnifiedSportsImage.tsx - 각 이미지마다 개별 DB 조회
src = await getTeamLogoUrl(numericId);  // 이미 있는 URL을 또 조회!
```

**결과**: 10경기 x 2팀 = **20번 중복 DB 조회** (이미 한번에 조회한 걸 또 함)

### 원인 2: 기본 lazy 로딩 (클라이언트 "주루루루룩"의 주 원인)

```typescript
// UnifiedSportsImageClient.tsx
loading = 'lazy',   // 기본값 → 브라우저가 뷰포트 진입 시에만 로드
priority = false,    // preload 힌트 없음
```

- `loading="lazy"` → 스크롤하면서 이미지가 하나씩 나타남 → **"주루루루룩" 현상의 주범**
- `<link rel="preload">` 없음 → 브라우저가 미리 준비 안 함
- `fetchpriority="high"` 없음 → 우선순위 낮음

### 참고: 서버 렌더링은 순차가 아님

RSC에서 sibling async 컴포넌트는 **동시에** 렌더링됨:
```
LiveScoreWidgetV2Server가 JSX 반환
  → 모든 MatchCardServer가 동시 렌더링
    → 모든 UnifiedSportsImage가 동시에 DB 조회 (병렬)
```

서버 쪽은 순차 폭포가 아니라 **병렬 중복 조회**가 문제.
클라이언트 쪽 "주루루루룩"은 `loading="lazy"` 때문.

### 해결 방법

#### ~~즉시 수정: 이중 조회 제거~~ ✅ 완료

`MatchCardServer`에서 `UnifiedSportsImage` → `UnifiedSportsImageClient`로 변경 완료:

```
이전: MatchCardServer → <UnifiedSportsImage type="team" id={homeTeamId} />
                        → await getTeamLogoUrl(homeTeamId)  ← 이중 조회!

현재: MatchCardServer → <UnifiedSportsImageClient src={match.homeTeam.logo} />
                        → 이미 조회된 URL 직접 사용 ✅
```

**효과**: 이미지별 DB 조회 20회 → 0회 (이미 fetchBigMatches에서 완료)

#### ~~추가: 첫 화면 이미지 priority 설정~~ ✅ 완료

`LiveScoreWidgetV2Server`에서 `isFirst`(첫 번째 리그)를 `MatchCardServer`에 `priorityImages` prop으로 전달:

```typescript
// LiveScoreWidgetV2Server.tsx - 첫 번째 리그만 priority 설정
<MatchCardServer match={match} isLast={...} priorityImages={isFirst} />

// MatchCardServer.tsx - priority에 따라 eager/lazy 결정
<UnifiedSportsImageClient
  src={match.homeTeam.logo}
  loading={priorityImages ? "eager" : "lazy"}
  priority={priorityImages}
/>
```

**효과**: 첫 번째 리그 이미지가 브라우저 로드 즉시 표시 (preload + eager), 나머지는 lazy 유지

### fotmob과의 차이 요약 (최적화 후)

| | fotmob | 우리 사이트 (이전) | 우리 사이트 (현재) |
|---|---|---|---|
| 이미지 URL | API 응답에 포함 | 배치 조회 후 **또 개별 조회** | 배치 조회 URL 직접 사용 ✅ |
| 서버 렌더링 | HTML에 URL 포함 | HTML에 URL 포함 | HTML에 URL 포함 |
| 브라우저 로딩 | eager + preload | **lazy (기본값)** | 첫 리그 eager + priority ✅ |
| 결과 | 한번에 딱 | 주루루루룩 | 첫 리그는 한번에, 나머지 lazy |
