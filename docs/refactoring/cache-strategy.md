# React cache() 전략 가이드

## 1. cache()란?

### 1.1 정의

`cache()`는 React 18에서 도입된 **요청 단위 메모이제이션** 함수입니다.

```tsx
import { cache } from 'react';

const getData = cache(async (id: string) => {
  const data = await fetchFromDB(id);
  return data;
});
```

### 1.2 동작 원리

```
┌─────────────────────────────────────────────────────────────┐
│                    단일 HTTP 요청                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  layout.tsx ──→ getData('123') ──→ DB 쿼리 실행 ✅          │
│                                     ↓                       │
│                              결과 캐시 저장                  │
│                                     ↓                       │
│  page.tsx ────→ getData('123') ──→ 캐시에서 반환 ⚡         │
│                                    (DB 쿼리 없음)           │
│                                     ↓                       │
│  component ───→ getData('123') ──→ 캐시에서 반환 ⚡         │
│                                    (DB 쿼리 없음)           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                    요청 종료 시 캐시 자동 삭제
```

### 1.3 핵심 특징

| 특징 | 설명 |
|------|------|
| **요청 범위** | 단일 HTTP 요청 내에서만 유효 |
| **자동 삭제** | 요청 완료 시 캐시 자동 정리 |
| **인자 기반** | 동일 인자 = 캐시 히트 |
| **서버 전용** | 서버 컴포넌트/서버 액션에서만 동작 |

---

## 2. 왜 필요한가?

### 2.1 현재 문제점

**boards 도메인 예시:**

```
게시판 페이지 로드 시 (boards/[slug]/page.tsx)
├── getBoardPageData()      → boards 테이블 조회 ①
├── fetchPosts()            → posts 테이블 조회
├── getBoardPopularPosts()  → posts, boards 조회 ②
├── getNoticesForBoard()    → posts 조회
└── getHoverMenuData()      → boards 테이블 조회 ③ (cache 적용됨)

⚠️ boards 테이블: 3번 조회 (1번만 필요)
⚠️ 같은 요청 내에서 중복 DB 호출 발생!
```

**실제 코드:**
```typescript
// getBoardPageData() - boards 조회 (cache 없음)
const [boardResult, allBoardsResult] = await Promise.all([
  supabase.from('boards').select('*').eq('slug', slug).single(),
  supabase.from('boards').select('*')  // ← 전체 boards 조회
]);

// getHoverMenuData() - boards 조회 (cache 있음)
export const getHoverMenuData = cache(async (rootBoardId: string) => {
  const { data: boardsData } = await supabase
    .from('boards')
    .select('...')  // ← 또 boards 조회 (cache로 1번만)
});

// getBoardPopularPosts() - boards 간접 조회 (cache 없음)
const allBoardIds = await getAllChildBoardIds(supabase, boardId);
// ← 재귀적으로 boards 조회!
```

### 2.2 cache() 적용 효과

| 항목 | Before | After |
|------|--------|-------|
| boards 테이블 조회 | 3-4회 | 1회 |
| DB 커넥션 | 매번 새로 | 재사용 |
| 응답 시간 | 느림 | 빠름 |
| Supabase 비용 | 높음 | 낮음 |

---

## 3. 현재 사용 현황

### 3.1 도메인별 cache() 사용률

| 도메인 | 서버 액션 수 | cache 사용 | 사용률 |
|--------|-------------|-----------|--------|
| **boards** | 22개 | 1개 | **4.5%** ❌ |
| **livescore** | ~20개 | ~15개 | **75%** ✅ |
| **sidebar** | 5개 | 4개 | **80%** ✅ |
| **shared** | 2개 | 1개 | **50%** |

### 3.2 cache() 미적용 주요 함수 (boards)

| 함수 | 파일 | 호출 빈도 | 우선순위 |
|------|------|----------|----------|
| `getAllBoards()` | getBoards.ts | 매 페이지 | 🔴 높음 |
| `getBoardPageData()` | getBoards.ts | 매 페이지 | 🔴 높음 |
| `fetchPosts()` | getPosts.ts | 매 페이지 | 🟡 중간 |
| `getBoardPopularPosts()` | getPopularPosts.ts | 매 페이지 | 🟡 중간 |
| `getNoticesForBoard()` | notices.ts | 매 페이지 | 🟡 중간 |

### 3.3 cache() 적용된 함수 (참고용)

```typescript
// ✅ shared/actions/user.ts
export const getFullUserData = cache(async () => { ... });

// ✅ domains/boards/actions/getHoverMenuData.ts
export const getHoverMenuData = cache(async (rootBoardId: string) => { ... });

// ✅ domains/sidebar/actions/boards.ts
export const getBoardsForNavigation = cache(async () => { ... });

// ✅ domains/livescore/actions/match/matchData.ts
export const getMatchData = cache(async (matchId: number) => { ... });
```

---

## 4. cache() 적용 기준

### 4.1 적용해야 하는 경우 ✅

1. **같은 요청 내 여러 번 호출될 가능성**
   ```typescript
   // layout.tsx, page.tsx, component에서 모두 호출 가능
   const userData = await getFullUserData();
   ```

2. **읽기 전용 데이터**
   ```typescript
   // 게시판 목록, 사용자 프로필 등
   const boards = await getAllBoards();
   ```

3. **비용이 큰 쿼리**
   ```typescript
   // 여러 테이블 조인, 집계 쿼리 등
   const stats = await getComplexStatistics();
   ```

4. **변경이 드문 데이터**
   ```typescript
   // 설정, 메타데이터 등
   const settings = await getSiteSettings();
   ```

### 4.2 적용하면 안 되는 경우 ❌

1. **사용자 입력 기반 동적 데이터**
   ```typescript
   // 검색 결과 - 매번 다른 쿼리
   const results = await search(userQuery);
   ```

2. **실시간성이 중요한 데이터**
   ```typescript
   // 라이브 스코어 (단, 같은 요청 내에서는 cache 가능)
   const liveScore = await getLiveScore();
   ```

3. **변경 작업 (Mutation)**
   ```typescript
   // 생성, 수정, 삭제는 cache 불가
   await createPost(data);  // ❌
   await updatePost(id, data);  // ❌
   await deletePost(id);  // ❌
   ```

4. **인자가 매번 다른 경우**
   ```typescript
   // 페이지네이션 - page 값이 매번 다름
   const posts = await fetchPosts({ page: currentPage });
   // → cache 효과 없음 (인자가 다르면 캐시 미스)
   ```

### 4.3 주의사항

```typescript
// ⚠️ 인자 객체 비교
const getData = cache(async (options: { id: string }) => { ... });

getData({ id: '123' });  // 캐시 저장
getData({ id: '123' });  // 캐시 미스! (객체 참조가 다름)

// ✅ 해결: 기본 타입 사용
const getData = cache(async (id: string) => { ... });

getData('123');  // 캐시 저장
getData('123');  // 캐시 히트!
```

---

## 5. 구현 계획

### 5.1 Phase 1: boards 핵심 함수 (즉시)

| 함수 | 변경 전 | 변경 후 |
|------|--------|--------|
| `getAllBoards()` | 일반 함수 | cache 래핑 |
| `getBoardBySlugOrId()` | 일반 함수 | cache 래핑 |

**구현:**
```typescript
// Before
export async function getAllBoards() {
  const supabase = await getSupabaseServer();
  const { data } = await supabase.from('boards').select('*');
  return data;
}

// After
export const getAllBoards = cache(async () => {
  const supabase = await getSupabaseServer();
  const { data } = await supabase.from('boards').select('*');
  return data;
});
```

### 5.2 Phase 2: boards 데이터 공유 최적화

**문제:**
```
getBoardPageData() → 모든 boards 조회
getHoverMenuData() → 모든 boards 조회 (cache)
getBoardPopularPosts() → 하위 boards 조회

→ boards 데이터 중복 조회!
```

**해결:**
```typescript
// 1. 공통 boards 조회 함수 생성
export const getCachedAllBoards = cache(async () => {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('boards')
    .select('id, name, slug, parent_id, display_order, team_id, league_id')
    .order('display_order');
  return data || [];
});

// 2. 기존 함수에서 공통 함수 사용
export async function getBoardPageData(slug: string, ...) {
  const allBoards = await getCachedAllBoards();  // cache 활용
  const board = allBoards.find(b => b.slug === slug);
  // ...
}

export const getHoverMenuData = cache(async (rootBoardId: string) => {
  const allBoards = await getCachedAllBoards();  // cache 활용
  // ...
});
```

### 5.3 Phase 3: 인기 게시글 최적화

```typescript
// Before - 재귀적 DB 조회
async function getAllChildBoardIds(supabase, boardId) {
  const { data } = await supabase
    .from('boards')
    .select('id')
    .eq('parent_id', boardId);
  // 재귀 호출... 매번 DB 조회
}

// After - 캐시된 boards에서 계산
export const getAllChildBoardIds = cache(async (boardId: string) => {
  const allBoards = await getCachedAllBoards();

  const findChildren = (parentId: string): string[] => {
    const children = allBoards.filter(b => b.parent_id === parentId);
    return [
      parentId,
      ...children.flatMap(c => findChildren(c.id))
    ];
  };

  return findChildren(boardId);
});
```

---

## 6. 장단점

### 6.1 장점 ✅

| 항목 | 설명 |
|------|------|
| **DB 부하 감소** | 중복 쿼리 제거로 DB 호출 최소화 |
| **응답 속도 향상** | 캐시 히트 시 즉시 반환 |
| **Supabase 비용 절감** | API 호출 수 감소 |
| **코드 단순화** | 중복 제거, 데이터 공유 용이 |
| **자동 메모리 관리** | 요청 종료 시 자동 정리 |

### 6.2 단점/주의점 ⚠️

| 항목 | 설명 | 대응 |
|------|------|------|
| **요청 범위 한정** | 다른 요청에서는 재실행 | Next.js revalidate와 병행 |
| **인자 비교 방식** | 객체는 참조 비교 | 기본 타입 사용 권장 |
| **디버깅 어려움** | 캐시 동작 추적 어려움 | 로깅 추가 |
| **실시간 데이터 부적합** | 캐시 기간 동안 stale | 용도에 맞게 선별 적용 |

### 6.3 cache() vs 다른 캐싱 방법

| 방법 | 범위 | 수명 | 용도 |
|------|------|------|------|
| **React cache()** | 단일 요청 | 요청 종료까지 | 같은 요청 내 중복 제거 |
| **Next.js unstable_cache** | 전역 | 지정 시간 | 빌드 간 데이터 재사용 |
| **React Query** | 클라이언트 | 지정 시간 | CSR 데이터 캐싱 |
| **Redis/Memcached** | 서버 | 지정 시간 | 분산 캐싱 |

---

## 7. 구현 체크리스트

### Phase 1: 기본 적용 (즉시) ✅
- [x] `getAllBoards()` cache 래핑
- [x] `getBoardBySlugOrId()` cache 래핑
- [x] `getBoards()` cache 래핑

### Phase 2: 데이터 공유 최적화 ✅
- [x] `getCachedAllBoards()` 생성
- [x] `getBoardPageData()` 최적화
- [x] `getHoverMenuData()` 최적화 (기존 cache 유지)

### Phase 3: 하위 게시판 최적화 ✅
- [x] `getCachedChildBoardIds()` 생성 (재귀 DB 조회 제거)
- [x] `getBoardPopularPosts()` 최적화

### Phase 4: 테스트 및 검증
- [ ] DB 쿼리 로깅으로 중복 제거 확인
- [ ] 성능 측정 (응답 시간)
- [ ] 기능 테스트

---

## 8. 예상 효과

### 8.1 DB 호출 감소

| 페이지 | Before | After | 감소율 |
|--------|--------|-------|--------|
| 게시판 목록 | 3회 | 1회 | **67%** |
| 게시글 목록 | 6-7회 | 2-3회 | **60%** |
| 게시글 상세 | 4-5회 | 2회 | **60%** |

### 8.2 응답 시간 개선

```
Before: 페이지 로드 ~300ms (DB 6회)
After:  페이지 로드 ~150ms (DB 2회)
→ 약 50% 개선 예상
```

### 8.3 Supabase 비용

```
월간 API 호출 (추정)
Before: 100만 회
After:  40만 회
→ 약 60% 절감 예상
```

---

## 9. 참고

- [React cache() 공식 문서](https://react.dev/reference/react/cache)
- [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [Supabase Best Practices](https://supabase.com/docs/guides/database/best-practices)

---

*작성일: 2026-01-19*
