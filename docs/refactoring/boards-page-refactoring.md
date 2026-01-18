# boards/[slug]/page.tsx 분할 리팩토링 계획

## 1. 현재 상태 분석

### 1.1 파일 정보
- **파일**: `src/app/boards/[slug]/page.tsx`
- **줄 수**: 290줄
- **목표**: 100줄 이하

### 1.2 현재 구조

```
page.tsx (290줄)
├── generateMetadata() (17-81줄, ~64줄)
│   └── 메타데이터 생성 로직
│
└── BoardDetailPage() (83-289줄, ~206줄)
    ├── 파라미터 추출 (91-96)
    ├── getBoardPageData() 호출 (99)
    ├── fetchPosts() 호출 (117-124)
    ├── convertApiPostsToLayoutPosts() 변환 (127)
    ├── getBoardPopularPosts() 호출 (130)
    ├── 공지사항 처리 로직 (133-198, ~65줄) ⚠️ 복잡
    │   ├── 공지 게시판 분기 (139-187)
    │   └── 일반 게시판 분기 (188-198)
    ├── HoverMenu 데이터 구성 (200-253, ~53줄) ⚠️ 페이지에 있으면 안됨
    │   └── getSupabaseServer() 직접 호출
    └── BoardDetailLayout 렌더링 (256-282)
```

### 1.3 현재 데이터 fetch 현황

| 함수 | 위치 (줄) | 설명 | 문제점 |
|------|----------|------|--------|
| `getBoardPageData()` | 99 | 게시판 기본 정보 | - |
| `fetchPosts()` | 117-124 | 게시글 목록 | 별도 호출 |
| `getBoardPopularPosts()` | 130 | 인기 게시글 | 별도 호출 |
| `getNotices()` | 141 | 공지 (공지 게시판용) | **중복 호출** |
| `getNotices()` | 142 | 공지 (헤더용) | **중복 호출** |
| `getNotices()` | 190 | 공지 (일반 게시판용) | 조건부 호출 |
| `getSupabaseServer()` | 201-205 | HoverMenu용 boards | **직접 DB 호출** |

**총 fetch 횟수**: 6-7회 (조건에 따라 다름)

### 1.4 발견된 문제점

#### 문제 1: 페이지에서 너무 많은 데이터 fetch
```typescript
// 현재: 페이지에서 여러 함수 호출
const result = await getBoardPageData(slug, currentPage, fromParam);
const postsData = await fetchPosts({...});
const popularPosts = await getBoardPopularPosts(result.boardData.id);
const notices = await getNotices(result.boardData.id);
// ... HoverMenu용 직접 쿼리
```

#### 문제 2: 공지사항 처리 로직이 페이지에 포함 (~65줄)
```typescript
// 현재: 페이지 컴포넌트 내부에 복잡한 데이터 변환 로직
if (isNoticeBoard) {
  const allNotices = await getNotices();
  const headerNotices = await getNotices(result.boardData.id);

  const noticePosts: LayoutPost[] = allNotices.map((notice) => {
    // ... 30줄의 변환 로직
  });
  // ...
} else {
  // ...
}
```

#### 문제 3: HoverMenu 데이터 구성이 페이지에 포함 (~53줄)
```typescript
// 현재: 페이지에서 직접 Supabase 호출 및 데이터 가공
const supabase = await getSupabaseServer();
const { data: boardsData } = await supabase
  .from('boards')
  .select('*')
  .order('display_order', { ascending: true });

// ... 50줄의 데이터 구조화 로직
```

#### 문제 4: 데이터 변환 로직이 페이지에 포함
```typescript
const layoutPosts = convertApiPostsToLayoutPosts(postsData.data || []);
```

---

## 2. 리팩토링 계획

### 2.1 목표

| 항목 | 현재 | 목표 |
|------|------|------|
| page.tsx 줄 수 | 290줄 | 100줄 이하 |
| 페이지 내 fetch 호출 | 6-7회 | 1회 |
| 데이터 변환 로직 | 페이지 내 | 유틸리티 분리 |
| 공지사항 로직 | 페이지 내 | 액션 함수 분리 |

### 2.2 새로운 구조

```
page.tsx (~80줄)
├── generateMetadata() (유지)
└── BoardDetailPage()
    ├── 파라미터 추출
    ├── getBoardPageAllData() 호출 ← 단일 fetch
    ├── 에러 처리
    └── BoardDetailLayout 렌더링

actions/
├── getBoardPageAllData.ts (신규) ← 통합 데이터 fetch
└── getBoards.ts (기존)

utils/
├── noticeUtils.ts (신규) ← 공지사항 변환 로직
└── hoverMenuUtils.ts (신규) ← HoverMenu 데이터 구성
```

### 2.3 새로운 데이터 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│                     page.tsx                                      │
├─────────────────────────────────────────────────────────────────┤
│  const pageData = await getBoardPageAllData(slug, page, params); │
│  return <BoardDetailLayout {...pageData} />;                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              getBoardPageAllData() (신규 액션)                    │
├─────────────────────────────────────────────────────────────────┤
│  병렬 fetch:                                                      │
│  ├── getBoardPageData()     → 게시판 기본 정보                   │
│  ├── fetchPosts()           → 게시글 목록                        │
│  ├── getBoardPopularPosts() → 인기 게시글                        │
│  ├── getNoticesForBoard()   → 공지사항 (통합)                    │
│  └── getHoverMenuData()     → HoverMenu 데이터                   │
│                                                                  │
│  데이터 변환:                                                     │
│  ├── convertApiPostsToLayoutPosts()                              │
│  └── processNotices()                                            │
│                                                                  │
│  return { 모든 데이터 통합 };                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 파일별 상세 계획

### 3.1 신규 파일: getBoardPageAllData.ts

**위치**: `src/domains/boards/actions/getBoardPageAllData.ts`
**예상 줄 수**: ~150줄

```typescript
// src/domains/boards/actions/getBoardPageAllData.ts
'use server';

import { getBoardPageData } from './getBoards';
import { fetchPosts } from './fetchPosts';
import { getBoardPopularPosts } from './getPopularPosts';
import { getNoticesForBoard } from './posts';
import { getHoverMenuData } from './getHoverMenuData';
import { convertApiPostsToLayoutPosts } from '../utils/post/postUtils';
import { processNoticesForLayout } from '../utils/notice/noticeUtils';

export interface BoardPageAllData {
  // 게시판 정보
  boardData: {...};
  breadcrumbs: {...}[];
  teamData: {...} | null;
  leagueData: {...} | null;
  isLoggedIn: boolean;
  rootBoardId: string;
  rootBoardSlug: string;
  viewType: string;

  // 게시글 정보
  posts: LayoutPost[];
  pagination: {...};
  popularPosts: {...}[];
  notices: {...}[];

  // HoverMenu 정보
  topBoards: {...}[];
  hoverChildBoardsMap: Record<string, {...}[]>;
}

export async function getBoardPageAllData(
  slug: string,
  currentPage: number,
  fromParam?: string,
  store?: string
): Promise<BoardPageAllData | { error: string }> {
  // 1. 기본 게시판 데이터 fetch
  const boardResult = await getBoardPageData(slug, currentPage, fromParam);

  if (!boardResult.success || !boardResult.boardData) {
    return { error: boardResult.error || '게시판을 찾을 수 없습니다.' };
  }

  // 2. 나머지 데이터 병렬 fetch
  const [postsData, popularPosts, noticesData, hoverMenuData] = await Promise.all([
    fetchPosts({
      boardIds: boardResult.filteredBoardIds,
      currentBoardId: boardResult.boardData.id,
      page: currentPage,
      limit: 20,
      fromParam,
      store
    }),
    getBoardPopularPosts(boardResult.boardData.id),
    getNoticesForBoard(boardResult.boardData),
    getHoverMenuData(boardResult.rootBoardId)
  ]);

  // 3. 데이터 변환
  const { posts, notices, pagination } = processNoticesForLayout(
    boardResult.boardData,
    postsData,
    noticesData
  );

  // 4. 통합 반환
  return {
    boardData: boardResult.boardData,
    breadcrumbs: boardResult.breadcrumbs,
    teamData: boardResult.teamData,
    leagueData: boardResult.leagueData,
    isLoggedIn: boardResult.isLoggedIn,
    rootBoardId: boardResult.rootBoardId,
    rootBoardSlug: boardResult.rootBoardSlug,
    viewType: boardResult.boardData.view_type,
    posts,
    pagination,
    popularPosts,
    notices,
    topBoards: hoverMenuData.topBoards,
    hoverChildBoardsMap: hoverMenuData.childBoardsMap
  };
}
```

### 3.2 신규 파일: noticeUtils.ts

**위치**: `src/domains/boards/utils/notice/noticeUtils.ts`
**예상 줄 수**: ~80줄

```typescript
// src/domains/boards/utils/notice/noticeUtils.ts

import type { LayoutPost } from '../../types/post';

/**
 * 공지사항 데이터를 LayoutPost 형식으로 변환
 * 기존 page.tsx의 133-198줄 로직을 분리
 */
export function processNoticesForLayout(
  boardData: BoardData,
  postsData: PostsResponse,
  noticesData: NoticesData
): {
  posts: LayoutPost[];
  notices: Notice[];
  pagination: Pagination;
} {
  const isNoticeBoard = boardData.slug === 'notice' || boardData.slug === 'notices';

  if (isNoticeBoard) {
    // 공지사항 게시판 처리
    const noticePosts = convertNoticesToLayoutPosts(noticesData.allNotices);
    return {
      posts: noticePosts,
      notices: noticesData.headerNotices,
      pagination: {
        totalItems: noticesData.allNotices.length,
        itemsPerPage: noticesData.allNotices.length,
        currentPage: 1
      }
    };
  } else {
    // 일반 게시판 처리
    return {
      posts: convertApiPostsToLayoutPosts(postsData.data || []),
      notices: noticesData.boardNotices,
      pagination: {
        totalItems: postsData.meta.totalItems,
        itemsPerPage: postsData.meta.itemsPerPage,
        currentPage: postsData.meta.currentPage
      }
    };
  }
}

/**
 * 공지사항을 LayoutPost 형식으로 변환
 */
function convertNoticesToLayoutPosts(notices: Notice[]): LayoutPost[] {
  return notices.map((notice) => {
    const content = typeof notice.content === 'string'
      ? notice.content
      : notice.content ? JSON.stringify(notice.content) : undefined;

    const teamId = typeof notice.team_id === 'string'
      ? parseInt(notice.team_id, 10)
      : notice.team_id ?? null;
    const leagueId = typeof notice.league_id === 'string'
      ? parseInt(notice.league_id, 10)
      : notice.league_id ?? null;

    return {
      id: notice.id,
      title: notice.title,
      board_id: notice.board_id || '',
      board_name: notice.board_name || notice.board?.name || '',
      board_slug: notice.board_slug || notice.board?.slug || notice.board_id || '',
      post_number: notice.post_number,
      created_at: notice.created_at || '',
      formattedDate: notice.formattedDate || '',
      views: notice.views ?? 0,
      likes: notice.likes ?? 0,
      author_nickname: notice.author_nickname || notice.profiles?.nickname || '익명',
      author_id: notice.user_id,
      author_public_id: notice.profiles?.public_id ?? null,
      author_icon_id: notice.profiles?.icon_id ?? null,
      author_icon_url: notice.author_icon_url ?? null,
      author_level: notice.author_level || notice.profiles?.level || 1,
      comment_count: notice.comment_count ?? 0,
      content,
      team_id: teamId,
      league_id: leagueId
    };
  });
}
```

### 3.3 신규 파일: getHoverMenuData.ts

**위치**: `src/domains/boards/actions/getHoverMenuData.ts`
**예상 줄 수**: ~60줄

```typescript
// src/domains/boards/actions/getHoverMenuData.ts
'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { cache } from 'react';

interface HoverMenuBoard {
  id: string;
  name: string;
  display_order: number;
  slug?: string;
}

interface HoverMenuData {
  topBoards: HoverMenuBoard[];
  childBoardsMap: Record<string, HoverMenuBoard[]>;
}

/**
 * HoverMenu용 게시판 데이터 조회
 * 기존 page.tsx의 200-253줄 로직을 분리
 */
export const getHoverMenuData = cache(async (rootBoardId: string): Promise<HoverMenuData> => {
  const supabase = await getSupabaseServer();

  const { data: boardsData } = await supabase
    .from('boards')
    .select('id, name, display_order, slug, parent_id')
    .order('display_order', { ascending: true });

  const topBoards: HoverMenuBoard[] = [];
  const childBoardsMap: Record<string, HoverMenuBoard[]> = {};

  if (!boardsData) {
    return { topBoards, childBoardsMap };
  }

  // 루트 게시판의 직접 하위 게시판들 (상위 게시판들)
  const rootChildBoards = boardsData.filter(board => board.parent_id === rootBoardId);

  topBoards.push(...rootChildBoards.map(board => ({
    id: board.id,
    name: board.name,
    display_order: board.display_order || 0,
    slug: board.slug || undefined
  })));

  // 모든 하위 게시판 관계 맵핑
  boardsData.forEach(board => {
    if (board.parent_id) {
      if (!childBoardsMap[board.parent_id]) {
        childBoardsMap[board.parent_id] = [];
      }
      childBoardsMap[board.parent_id].push({
        id: board.id,
        name: board.name,
        display_order: board.display_order || 0,
        slug: board.slug || undefined
      });
    }
  });

  return { topBoards, childBoardsMap };
});
```

### 3.4 수정 파일: page.tsx (리팩토링 후)

**예상 줄 수**: ~80줄

```typescript
// src/app/boards/[slug]/page.tsx (리팩토링 후)
import { Metadata } from 'next';
import { getBoardPageAllData } from '@/domains/boards/actions/getBoardPageAllData';
import { generateBoardMetadata } from '@/domains/boards/utils/metadata/boardMetadata';
import BoardDetailLayout from '@/domains/boards/components/layout/BoardDetailLayout';
import ErrorMessage from '@/shared/ui/error-message';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 메타데이터 생성 (별도 유틸로 분리 가능)
export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params;
  return generateBoardMetadata(slug);
}

export default async function BoardDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ page?: string; from?: string; store?: string }>
}) {
  // 1. 파라미터 추출
  const { slug } = await params;
  const { page = '1', from: fromParam, store } = await searchParams;
  const currentPage = isNaN(parseInt(page, 10)) || parseInt(page, 10) < 1
    ? 1
    : parseInt(page, 10);

  // 2. 단일 데이터 fetch
  const result = await getBoardPageAllData(slug, currentPage, fromParam, store);

  // 3. 에러 처리
  if ('error' in result) {
    return <ErrorMessage message={result.error} />;
  }

  // 4. 레이아웃 렌더링
  return (
    <BoardDetailLayout
      boardData={{
        ...result.boardData,
        slug: result.boardData.slug || ''
      }}
      breadcrumbs={result.breadcrumbs}
      teamData={result.teamData}
      leagueData={result.leagueData ? {
        ...result.leagueData,
        type: 'league'
      } : null}
      isLoggedIn={result.isLoggedIn}
      currentPage={currentPage}
      slug={slug}
      rootBoardId={result.rootBoardId}
      rootBoardSlug={result.rootBoardSlug}
      viewType={result.viewType}
      posts={result.posts}
      topBoards={result.topBoards}
      hoverChildBoardsMap={result.hoverChildBoardsMap}
      pagination={result.pagination}
      popularPosts={result.popularPosts}
      notices={result.notices}
    />
  );
}
```

---

## 4. 파일 변경 목록

### 4.1 신규 생성 파일

| 파일 | 줄 수 | 설명 |
|------|-------|------|
| `src/domains/boards/actions/getBoardPageAllData.ts` | ~150 | 통합 데이터 fetch 함수 |
| `src/domains/boards/utils/notice/noticeUtils.ts` | ~80 | 공지사항 변환 유틸 |
| `src/domains/boards/actions/getHoverMenuData.ts` | ~60 | HoverMenu 데이터 함수 |
| `src/domains/boards/utils/metadata/boardMetadata.ts` | ~70 | 메타데이터 생성 유틸 (선택) |
| **총 추가** | **~360** | |

### 4.2 수정 파일

| 파일 | 현재 줄 수 | 목표 줄 수 | 변경 내용 |
|------|-----------|-----------|----------|
| `src/app/boards/[slug]/page.tsx` | 290 | ~80 | 데이터 fetch 및 변환 로직 제거 |
| `src/domains/boards/actions/posts.ts` | - | +20 | `getNoticesForBoard()` 함수 추가 |
| `src/domains/boards/actions/index.ts` | - | +2 | 새 함수 export 추가 |

### 4.3 삭제할 코드 (page.tsx 내)

| 위치 (줄) | 내용 | 이동 위치 |
|----------|------|----------|
| 117-127 | `fetchPosts()` 호출 및 변환 | getBoardPageAllData.ts |
| 129-130 | `getBoardPopularPosts()` 호출 | getBoardPageAllData.ts |
| 133-198 | 공지사항 처리 로직 (~65줄) | noticeUtils.ts |
| 200-253 | HoverMenu 데이터 구성 (~53줄) | getHoverMenuData.ts |

---

## 5. 예상 개선 효과

### 5.1 코드량 변화

| 항목 | 이전 | 이후 |
|------|------|------|
| page.tsx | 290줄 | ~80줄 |
| 총 코드량 | 290줄 | ~440줄 (분리된 파일 포함) |

**참고**: 총 코드량은 증가하지만, 각 파일이 단일 책임을 가지며 재사용 가능

### 5.2 성능 개선

| 항목 | 이전 | 이후 |
|------|------|------|
| 페이지 내 fetch 호출 | 6-7회 (순차) | 1회 (내부 병렬) |
| 데이터 변환 위치 | 페이지 컴포넌트 | 서버 액션 |
| HoverMenu 데이터 캐싱 | 없음 | `cache()` 적용 |

### 5.3 유지보수성 개선

| 항목 | 이전 | 이후 |
|------|------|------|
| 공지사항 로직 변경 | page.tsx 수정 | noticeUtils.ts만 수정 |
| HoverMenu 로직 변경 | page.tsx 수정 | getHoverMenuData.ts만 수정 |
| 새 데이터 추가 | page.tsx에 fetch 추가 | getBoardPageAllData.ts에 추가 |
| 테스트 용이성 | 어려움 (페이지 전체 테스트) | 개별 함수 단위 테스트 가능 |

---

## 6. 작업 순서

| 순서 | 작업 | 예상 소요 | 상태 |
|------|------|----------|------|
| 1 | `getHoverMenuData.ts` 생성 | - | ✅ 완료 |
| 2 | `noticeUtils.ts` 생성 | - | ✅ 완료 |
| 3 | `getNoticesForBoard()` 함수 추가 | - | ✅ 완료 |
| 4 | `getBoardPageAllData.ts` 생성 | - | ✅ 완료 |
| 5 | `page.tsx` 리팩토링 | - | ✅ 완료 |
| 6 | `boardMetadata.ts` 분리 (선택) | - | ⏳ 보류 |
| 7 | 테스트 및 검증 | - | ⬜ |

---

## 7. 참고: 현재 코드 위치 매핑

```
현재 page.tsx 줄 번호 → 이동 위치
─────────────────────────────────
17-81   (generateMetadata)     → boardMetadata.ts 또는 유지
91-96   (파라미터 추출)         → 유지
99      (getBoardPageData)      → getBoardPageAllData.ts
117-127 (fetchPosts + 변환)     → getBoardPageAllData.ts
129-130 (getBoardPopularPosts)  → getBoardPageAllData.ts
133-198 (공지사항 처리)          → noticeUtils.ts
200-253 (HoverMenu 데이터)      → getHoverMenuData.ts
256-282 (JSX 렌더링)            → 유지
```

---

## 8. 리팩토링 완료 내역 (2026-01-18)

### 8.1 생성된 파일

| 파일 | 줄 수 | 설명 |
|------|-------|------|
| `src/domains/boards/actions/getHoverMenuData.ts` | 59 | HoverMenu 데이터 fetch (cache 적용) |
| `src/domains/boards/actions/getBoardPageAllData.ts` | 153 | 통합 데이터 fetch 함수 |
| `src/domains/boards/utils/notice/noticeUtils.ts` | 117 | 공지사항 처리 유틸 |

### 8.2 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/app/boards/[slug]/page.tsx` | 290줄 → 142줄 (148줄 감소) |
| `src/domains/boards/actions/posts/notices.ts` | `getNoticesForBoard()` 함수 추가 (+37줄) |
| `src/domains/boards/actions/posts/index.ts` | export 추가 |
| `src/domains/boards/actions/index.ts` | export 추가 |

### 8.3 삭제된 코드 (page.tsx 내)

| 위치 | 내용 | 줄 수 |
|------|------|-------|
| 기존 117-127 | `fetchPosts()` 호출 및 변환 | ~11줄 |
| 기존 129-130 | `getBoardPopularPosts()` 호출 | ~2줄 |
| 기존 133-198 | 공지사항 처리 로직 | ~65줄 |
| 기존 200-253 | HoverMenu 데이터 구성 | ~53줄 |
| **총 삭제** | | **~131줄** |

### 8.4 최종 결과

| 항목 | 이전 | 이후 |
|------|------|------|
| page.tsx 줄 수 | 290줄 | 142줄 |
| 페이지 내 fetch 호출 | 6-7회 | 1회 (getBoardPageAllData) |
| 공지사항 로직 위치 | page.tsx 내 | noticeUtils.ts |
| HoverMenu 로직 위치 | page.tsx 내 | getHoverMenuData.ts |
| 데이터 변환 위치 | page.tsx 내 | 서버 액션 내 |

### 8.5 새로운 데이터 흐름

```
page.tsx
    │
    └── getBoardPageAllData(slug, page, fromParam, store)
          │
          ├── getBoardPageData()          → 게시판 기본 정보
          │
          └── Promise.all([
                fetchPosts()              → 게시글 목록
                getBoardPopularPosts()    → 인기 게시글
                getNoticesForBoard()      → 공지사항 (통합)
                getHoverMenuData()        → HoverMenu 데이터
              ])
          │
          └── processNoticesForLayout()   → 데이터 변환
          │
          └── return { 통합 데이터 }
```

---

*작성일: 2026-01-17*
*완료일: 2026-01-18*
*대상 파일: src/app/boards/[slug]/page.tsx*
