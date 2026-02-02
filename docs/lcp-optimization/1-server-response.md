# 1. 느린 서버 응답 시간 (TTFB)

> LCP 최적화 점검 - 2026-02-02

## 현재 상태 요약

| 항목 | 상태 | 비고 |
|------|------|------|
| ISR 적용 | ✅ | `revalidate: 60` (홈페이지) |
| React cache() 사용 | ✅ | 레이아웃 함수들, 인증 함수, 핫딜 ID |
| 병렬 데이터 fetch | ✅ | **수정 완료** - 홈페이지 위젯 병렬화 |
| 인증 중복 확인 | ✅ | **수정 완료** (2026-02-02) |
| DB 쿼리 복잡도 | ✅ | fetchPosts 내부 병렬화 + 핫딜 ID 캐시 |

---

## 상세 분석: 서버 함수 호출 흐름

### A. 레이아웃 레벨 (모든 페이지에서 실행)

**파일:** `src/app/(site)/layout.tsx`

```typescript
const [fullUserData, headerBoardsData] = await Promise.all([
  getFullUserData(),
  getBoardsForNavigation({ includeTotalPostCount: true }),
]);
```

#### 1) `getFullUserData()` - 사용자 정보 조회
**파일:** `src/shared/actions/user.ts`

| 순서 | 쿼리 | 병렬 여부 |
|------|------|----------|
| 1 | `getAuthenticatedUser()` | ✅ 캐시됨 |
| 2 | `profiles` select | ✅ 병렬 |
| 3 | `posts` count | ✅ 병렬 |
| 4 | `comments` count | ✅ 병렬 |
| 5 | `shop_items` select (아이콘 있을 경우) | ⚠️ 순차 (조건부) |

**상태:** ✅ 인증 캐시 적용 완료

#### 2) `getBoardsForNavigation()` - 네비게이션 데이터
**파일:** `src/domains/layout/actions.ts`

| 순서 | 쿼리 | 병렬 여부 |
|------|------|----------|
| 1 | `getAuthenticatedUser()` | ✅ 캐시됨 (중복 제거) |
| 2 | `getUserAdminStatus()` | ✅ 캐시됨 |
| 3 | `boards` select | ✅ 병렬 |
| 4 | `posts` count | ✅ 병렬 |

**상태:** ✅ 인증/관리자 확인 캐시 적용 완료

---

### B. 홈페이지 위젯들 ✅ 병렬화 완료

**파일:** `src/app/(site)/page.tsx`

```tsx
// 수정 후: 모든 데이터를 병렬로 fetch
export default async function HomePage() {
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

**상태:** ✅ 4개 위젯 데이터가 동시에 fetch됨

---

## 발견된 문제점 및 해결 현황

### 1. ~~인증 중복 호출~~ ✅ 해결됨 (2026-02-02)
```
// 이전: 매 요청마다 인증 API 2회 호출
getFullUserData() → supabase.auth.getUser()
getBoardsForNavigation() → supabase.auth.getUser()

// 해결: 캐시된 함수로 통합 (src/shared/actions/auth.ts)
getAuthenticatedUser() - React cache()로 같은 request 내 1회만 호출
```

### 2. ~~관리자 확인 중복~~ ✅ 해결됨 (2026-02-02)
```
// 이전: profiles.is_admin 2회 조회
// 해결: getUserAdminStatus() 캐시 함수 사용
```

### 3. ~~홈페이지 위젯 순차 실행~~ ✅ 해결됨 (2026-02-02)
```
// 이전: 순차 실행 (17~22개 쿼리)
BoardCollectionWidget → AllPostsWidget → NewsWidget

// 해결: Promise.all로 병렬 실행
const [liveScoreData, boardCollectionData, postsData, newsData] = await Promise.all([...]);
```

### 4. ~~fetchPosts 핫딜 ID 반복 조회~~ ✅ 해결됨 (2026-02-02)
```typescript
// 이전: 매번 boards 테이블에서 핫딜 게시판 ID 조회
const { data: hotdealBoards } = await supabase.from('boards')...

// 해결: 캐시된 함수 사용 (src/domains/boards/actions/getPosts.ts)
const getHotdealBoardIds = cache(async () => {...});
```

---

## 적용된 수정 사항

### 1. 인증 캐시 함수 생성

**새 파일:** `src/shared/actions/auth.ts`
```typescript
export const getAuthenticatedUser = cache(async () => {
  const supabase = await getSupabaseServer();
  return supabase.auth.getUser();
});

export const getUserAdminStatus = cache(async (userId: string) => {
  // profiles.is_admin 조회 (캐시됨)
});
```

**수정된 파일:**
- `src/shared/actions/user.ts` - getAuthenticatedUser() 사용
- `src/domains/layout/actions.ts` - getAuthenticatedUser(), getUserAdminStatus() 사용

### 2. 핫딜 ID 캐시 함수 추가

**파일:** `src/domains/boards/actions/getPosts.ts`
```typescript
const getHotdealBoardIds = cache(async (): Promise<string[]> => {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('boards')
    .select('id')
    .in('slug', HOTDEAL_BOARD_SLUGS);
  return data?.map(b => b.id) || [];
});
```

### 3. 홈페이지 위젯 병렬화

**수정된 파일:**
- `src/app/(site)/page.tsx` - async로 변경, Promise.all 사용
- `src/domains/widgets/components/live-score-widget/LiveScoreWidgetV2Server.tsx`
  - `fetchLiveScoreData()` 함수 추가
  - `initialData` props 추가
- `src/domains/widgets/components/board-collection-widget/BoardCollectionWidget.tsx`
  - `fetchBoardCollectionData()` 함수 추가
  - `initialData` props 추가
- `src/domains/widgets/components/AllPostsWidget.tsx`
  - `fetchAllPostsData()` 함수 추가
  - `initialData` props 추가
- `src/domains/widgets/components/news-widget/NewsWidget.tsx`
  - `fetchNewsData()` 함수 추가
  - `initialData` props 추가

---

## 예상 성능 개선

| 항목 | 이전 | 이후 | 개선 |
|------|------|------|------|
| 인증 API 호출 | 2회/요청 | 1회/요청 | -50% |
| 홈페이지 위젯 | 순차 실행 | 병렬 실행 | ~200-500ms 단축 |
| 핫딜 ID 조회 | 매번 DB 조회 | 캐시 사용 | 1회/요청 |

---

## 측정 방법

```bash
# 1. Chrome DevTools > Network > 첫 요청의 TTFB 확인
# 목표: < 200ms

# 2. Vercel 로그에서 서버 함수 실행 시간 확인

# 3. 로컬에서 타이밍 로그 추가
console.time('homepage-data');
const data = await Promise.all([...]);
console.timeEnd('homepage-data');
```

---

## 완료 일자

- 2026-02-02: 모든 최적화 적용 완료
