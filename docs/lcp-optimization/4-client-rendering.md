# 4. 클라이언트측 렌더링

> LCP 최적화 점검 - 2026-02-03 완료

## 현재 상태 요약

| 항목 | 상태 | 비고 |
|------|------|------|
| 서버 컴포넌트 우선 사용 | ✅ | 페이지/레이아웃 모두 서버 컴포넌트 |
| 서버 렌더링 로고 (LCP) | ✅ | SiteLayout에서 서버 로고 제공 |
| 홈페이지 위젯 SSR | ✅ | **확인 완료** - Promise.all 병렬 fetch |
| 서버/클라이언트 분리 | ✅ | **확인 완료** - 모든 위젯 올바른 패턴 |
| 클라이언트 데이터 fetch | ⚠️ | HeaderClient 경기 수 조회 |
| Hydration 최적화 | ✅ | useDeferredValue, startTransition 사용 |

---

## 상세 분석

### A. 홈페이지 렌더링 구조 ✅

**파일:** `src/app/(site)/page.tsx`

```tsx
// ISR: 60초마다 페이지 재생성
export const revalidate = 60;

export default async function HomePage() {
  // 모든 위젯 데이터를 병렬로 fetch (TTFB 최적화)
  const [liveScoreData, boardCollectionData, postsData, newsData] = await Promise.all([
    fetchLiveScoreData(),
    fetchBoardCollectionData(),
    fetchAllPostsData(),
    fetchNewsData(),
  ]);

  return (
    <main>
      <BoardQuickLinksWidget />
      <LiveScoreWidgetV2 initialData={liveScoreData} />
      <BoardCollectionWidget initialData={boardCollectionData} />
      <AllPostsWidget initialData={postsData} />
      <NewsWidget initialData={newsData} />
    </main>
  );
}
```

**상태:** ✅ 양호 - 모든 데이터가 서버에서 병렬 fetch됨

---

### B. 레이아웃 렌더링 구조 ✅

**파일:** `src/app/(site)/layout.tsx`

```tsx
export default async function SiteLayout({ children }) {
  // 서버 컴포넌트에서 데이터 fetch (Supabase만)
  const [fullUserData, headerBoardsData] = await Promise.all([
    getFullUserData(),
    getBoardsForNavigation({ includeTotalPostCount: true }),
  ]);

  // 서버 렌더링 로고 (LCP 최적화)
  const serverLogo = (
    <div id="server-logo-placeholder">
      <Image src={siteConfig.logo} priority fetchPriority="high" />
    </div>
  );

  return (
    <>
      {serverLogo}
      <SiteLayoutClient
        fullUserData={fullUserData}
        headerBoards={headerBoardsData.boardData}
        // ...
      >
        {children}
      </SiteLayoutClient>
    </>
  );
}
```

**상태:** ✅ 양호 - 서버에서 데이터 fetch 후 클라이언트에 전달

---

### C. 서버/클라이언트 컴포넌트 분리 패턴 ✅

#### 1) LiveScoreWidgetV2 - 올바른 패턴 ✅
```
LiveScoreWidgetV2Server (서버)
    └── fetchLiveScoreData()  // 서버에서 데이터 fetch
    └── <LiveScoreWidgetV2 initialData={data} />  // 클라이언트에 전달
```

#### 2) BoardCollectionWidget - 올바른 패턴 ✅
**파일:** `src/domains/widgets/components/board-collection-widget/BoardCollectionWidget.tsx`
```tsx
// 서버 컴포넌트
export async function fetchBoardCollectionData() { ... }

export default async function BoardCollectionWidget({ initialData }) {
  const boardsData = initialData ?? await fetchBoardCollectionData();
  return <BoardCollectionWidgetClient boardsData={boardsData} />;
}
```

#### 3) NewsWidget - 올바른 패턴 ✅
**파일:** `src/domains/widgets/components/news-widget/NewsWidget.tsx`
```tsx
// 서버 컴포넌트
export async function fetchNewsData() { ... }

export default async function NewsWidget({ initialData }) {
  if (initialData) {
    return <NewsWidgetClient initialNews={initialData} />;
  }
  const news = await getAllNewsPosts(slugs);
  return <NewsWidgetClient initialNews={news} />;
}
```

#### 4) AllPostsWidget - 올바른 패턴 ✅
**파일:** `src/domains/widgets/components/AllPostsWidget.tsx`
```tsx
// 서버 컴포넌트
export async function fetchAllPostsData() { ... }

export default async function AllPostsWidget({ initialData }) {
  const postsData = initialData ?? await fetchAllPostsData();
  return <PostList posts={postsData.data} />;
}
```

---

### D. 클라이언트에서 데이터 fetch하는 케이스

| 컴포넌트 | 데이터 | 트리거 | 영향도 | 상태 |
|---------|-------|--------|-------|------|
| `HeaderClient` | 오늘 경기 수 | 페이지 로드 | Medium | ⚠️ |
| `LeagueStandings` | 리그 순위 | 탭 변경 | OK | ✅ |
| `LiveScoreModalClient` | 경기 목록 | 모달 열기 | OK | ✅ |
| `SidebarRelatedPosts` | 관련 글 | 팀/선수 페이지 | OK | ✅ |

#### 1) HeaderClient - 오늘 경기 수 조회 ⚠️
**파일:** `src/domains/layout/components/HeaderClient.tsx:187-194`

```tsx
const { data: matchCountData } = useQuery({
  queryKey: ['todayMatchCount'],
  queryFn: () => fetchTodayMatchCount(),
  staleTime: 1000 * 60 * 5, // 5분 캐시
  refetchOnWindowFocus: false,
  refetchOnMount: false,  // ← 마운트 시 재요청 방지
});
```

**문제점:**
- 모든 페이지 로드 시 클라이언트에서 API 호출
- 로딩 중 회색 펄스 애니메이션 표시 (line 329-334)
- 경기 표시등(🟢/🔴)을 위한 데이터인데 서버에서 가져올 수 있음

#### 2) LeagueStandings - 탭 변경 시 fetch ✅
**파일:** `src/domains/sidebar/components/league/LeagueStandings.tsx:57-60`

```tsx
const { standings, isLoading, error } = useLeagueStandings(activeLeague, {
  initialData: activeLeague === initialLeague ? initialStandings : undefined,
  enabled: !isMobile, // 모바일에서는 비활성화
});
```

**상태:** ✅ OK - 데스크탑에서 탭 변경 시에만 fetch

#### 3) LiveScoreModalClient - 모달 열기 시 fetch ✅
**파일:** `src/domains/layout/components/livescoremodal/LiveScoreModalClient.tsx:22-30`

```tsx
const { data: liveScoreData, isLoading } = useQuery({
  queryKey: ['multiDayMatches'],
  queryFn: () => fetchMultiDayMatches(),
  enabled: isOpen, // 모달 열릴 때만 활성화
  staleTime: 1000 * 60 * 5, // 5분 캐시
});
```

**상태:** ✅ OK - 모달 열릴 때만 fetch (지연 로드)

#### 4) SidebarRelatedPosts - 팀/선수 페이지 fetch ✅
**파일:** `src/domains/sidebar/components/SidebarRelatedPosts.tsx`

```tsx
// 팀/선수 페이지에서만 활성화
const entityType = teamMatch ? 'team' : playerMatch ? 'player' : null;

const { data: posts } = useQuery({
  queryKey: ['sidebar-related-posts', entityType, entityId],
  queryFn: async () => getRelatedPosts({ ... }),
  enabled: !!entityType && !!entityId,
  staleTime: 5 * 60 * 1000,
});
```

**상태:** ✅ OK - 팀/선수 페이지에서만 fetch

---

### E. Hydration 최적화 현황 ✅

**파일:** `src/app/(site)/SiteLayoutClient.tsx`

```tsx
// React 18 동시성 기능 활용
const deferredIsOpen = useDeferredValue(isOpen);
const deferredIsProfileOpen = useDeferredValue(isProfileOpen);

// 낮은 우선순위 상태 업데이트
startTransition(() => {
  setIsOpen(false);
});
```

**상태:** ✅ 양호 - React 18 동시성 기능 적극 활용

---

## 발견된 문제점

### 1. HeaderClient 클라이언트 데이터 fetch (Medium)

**현재 상태:**
```tsx
// HeaderClient.tsx:187-194
const { data: matchCountData } = useQuery({
  queryKey: ['todayMatchCount'],
  queryFn: () => fetchTodayMatchCount(),
});

// HeaderClient.tsx:329-334 - 로딩 상태
{isLoadingMatches ? (
  <>
    <span className="animate-ping ... bg-gray-400" />
    <span className="... bg-gray-500" />
  </>
) : ...}
```

**영향:**
- 매 페이지 로드마다 추가 API 요청
- 사용자에게 로딩 상태(회색 펄스) 노출

---

## 개선 방안

### 1. 경기 수를 서버에서 미리 fetch

```tsx
// 현재: 클라이언트에서 fetch
// HeaderClient.tsx
const { data: matchCountData } = useQuery({...});

// 개선: 레이아웃에서 서버 fetch 후 전달
// layout.tsx
const [fullUserData, headerBoardsData, matchCount] = await Promise.all([
  getFullUserData(),
  getBoardsForNavigation(),
  fetchTodayMatchCount(),  // 서버에서 미리 가져오기
]);

// HeaderClient에 props로 전달
<HeaderClient initialMatchCount={matchCount} />
```

### 2. React Query initialData 활용

```tsx
// HeaderClient.tsx
interface HeaderClientProps {
  initialMatchCount?: { success: boolean; count: number };
}

const { data: matchCountData } = useQuery({
  queryKey: ['todayMatchCount'],
  queryFn: () => fetchTodayMatchCount(),
  initialData: initialMatchCount,  // 서버 데이터로 초기화
  staleTime: 1000 * 60 * 5,
});
```

**예상 개선:**
- 클라이언트 API 요청 1개 제거
- 초기 로딩 깜빡임 제거
- TTFB에 포함되어 일관된 로딩

---

## 긍정적인 점

1. **페이지 컴포넌트 모두 서버 컴포넌트** - async function 사용
2. **홈페이지 위젯 데이터 서버 fetch** - Promise.all 병렬 처리
3. **ISR 적용** - `revalidate: 60`으로 캐시된 HTML 즉시 제공
4. **서버/클라이언트 분리 패턴** - 모든 위젯에서 올바르게 적용
5. **서버 렌더링 로고** - LCP 요소 즉시 표시
6. **React Query 캐싱** - 중복 요청 방지, staleTime 설정
7. **React 18 동시성** - useDeferredValue, startTransition 활용
8. **지연 로딩 패턴** - LeagueStandings, LiveScoreModal, SidebarRelatedPosts

---

## 측정 방법

```bash
# 1. 초기 HTML 확인
# Chrome > View Page Source
# - 게시글 목록이 HTML에 포함되어 있는지 확인

# 2. JavaScript 비활성화 테스트
# Chrome DevTools > Settings > Disable JavaScript
# - 콘텐츠가 보이면 SSR 성공

# 3. Network 탭에서 클라이언트 API 확인
# - XHR/Fetch 필터
# - 페이지 로드 시 호출되는 API 확인

# 4. React DevTools > Profiler
# - Hydration 시간 측정
```

---

## 결론

### 완료된 항목 ✅
- 홈페이지 위젯 서버 fetch (Promise.all 병렬)
- 서버/클라이언트 컴포넌트 분리 패턴
- 서버 렌더링 로고 (LCP 최적화)
- React 18 동시성 기능
- React Query 캐싱 및 지연 로딩

### 개선 가능 (Low Priority) ⚠️
- HeaderClient 경기 수 서버 fetch 이동
  - 현재 `refetchOnMount: false`로 영향 최소화됨
  - 첫 로드 시에만 깜빡임 발생

---

## 완료 일자

- 2026-02-03: 컴포넌트별 상세 점검 완료, 문서 업데이트
