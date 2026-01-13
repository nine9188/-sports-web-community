# BoardCollectionWidget 리팩토링 계획

> 작성일: 2024-12-23
> 상태: 계획 단계

## 1. 현재 상태 분석

### 1.1 파일 구조
```
board-collection-widget/
├── index.ts                          # export
├── types.ts                          # 타입 정의 (33줄)
├── BoardCollectionWidget.tsx         # 서버 컴포넌트 (269줄) ← 문제
└── BoardCollectionWidgetClient.tsx   # 클라이언트 컴포넌트 (257줄)
```

### 1.2 현재 코드 구조 (BoardCollectionWidget.tsx)

```
BoardCollectionWidget.tsx (269줄)
│
├── [7-22줄] 타입 정의
│   ├── BoardCollectionSetting
│   └── PostWithContent
│
├── [25-257줄] getBoardsData() 함수 ← 230줄, 너무 김!
│   │
│   ├── [31-35줄] 설정 조회 (board_collection_widget_settings)
│   │   └── ⚠️ `as never` 타입 단언 사용
│   │
│   ├── [39-51줄] 기본 게시판 fallback 처리
│   │   └── ⚠️ `as unknown` 타입 단언 사용
│   │
│   ├── [56-66줄] 게시판 정보 조회 & 정렬
│   │
│   └── [69-249줄] Promise.all - 각 게시판별 데이터 조회 ← N+1 문제
│       │
│       ├── [72-80줄] 하위 게시판 조회 (쿼리 1)
│       │
│       ├── [83-88줄] 최신 게시글 조회 (쿼리 2)
│       │
│       ├── [91-96줄] 인기 게시글 조회 (쿼리 3)
│       │   └── ⚠️ limit(0) - 사용 안 함, 죽은 코드
│       │
│       ├── [116-145줄] 댓글 수 조회 (쿼리 4)
│       │
│       ├── [148-168줄] 게시판 정보 매핑 조회 (쿼리 5)
│       │
│       ├── [171-205줄] 팀/리그 로고 조회 (쿼리 6, 7)
│       │
│       └── [208-247줄] 데이터 포맷팅
│
└── [260-268줄] 컴포넌트 렌더링
```

### 1.3 발견된 문제점

| # | 문제 | 심각도 | 위치 |
|---|------|--------|------|
| 1 | getBoardsData 함수가 230줄로 너무 김 | 🔴 높음 | 25-257줄 |
| 2 | N+1 쿼리 문제 (게시판당 최대 7개 쿼리) | 🔴 높음 | 69-249줄 |
| 3 | 타입 단언 (`as never`, `as unknown`) 사용 | 🟠 중간 | 32, 49줄 |
| 4 | 죽은 코드 (popularPosts limit(0)) | 🟠 중간 | 91-96줄 |
| 5 | 타입이 컴포넌트 파일에 정의됨 | 🟡 낮음 | 7-22줄 |
| 6 | 하드코딩된 기본 게시판 slug | 🟡 낮음 | 44줄 |

### 1.4 쿼리 호출 횟수 분석

**게시판 3개 기준:**
```
현재:
- 설정 조회: 1회
- 기본 게시판 조회: 1회 (fallback 시)
- 게시판 정보 조회: 1회
- 게시판별 반복 (3회):
  - 하위 게시판: 3회
  - 최신 게시글: 3회
  - 인기 게시글: 3회 (사용 안 함)
  - 댓글 수: 3회
  - 게시판 정보: 3회
  - 팀 로고: 3회
  - 리그 로고: 3회

총: 약 24회 쿼리 (게시판 3개 기준)
```

---

## 2. 리팩토링 목표

### 2.1 정량적 목표
| 항목 | 현재 | 목표 |
|------|------|------|
| BoardCollectionWidget.tsx 줄 수 | 269줄 | < 50줄 |
| getBoardsData 함수 줄 수 | 230줄 | < 80줄 |
| 쿼리 호출 횟수 (3개 게시판) | ~24회 | ~8회 |
| 타입 단언 사용 | 2개 | 0개 |

### 2.2 정성적 목표
- 단일 책임 원칙 (SRP) 적용
- 테스트 가능한 구조
- 재사용 가능한 유틸리티 함수
- 타입 안전성 향상

---

## 3. 리팩토링 계획

### 3.1 새로운 파일 구조

```
board-collection-widget/
├── index.ts                              # export
├── types.ts                              # 모든 타입 정의 (확장)
├── BoardCollectionWidget.tsx             # 서버 컴포넌트 (간소화)
├── BoardCollectionWidgetClient.tsx       # 클라이언트 컴포넌트 (유지)
│
├── actions/                              # 🆕 데이터 fetching 분리
│   ├── index.ts
│   ├── getBoardSettings.ts               # 설정 조회
│   ├── getBoardsWithPosts.ts             # 게시판+게시글 조회 (최적화)
│   └── getPostsMetadata.ts               # 댓글 수, 로고 등 메타데이터
│
└── utils/                                # 🆕 유틸리티 분리
    ├── index.ts
    └── formatPost.ts                     # 포맷팅 로직
```

### 3.2 단계별 작업 계획

#### Step 1: 타입 정리 및 확장
**파일:** `types.ts`

**작업 내용:**
- `BoardCollectionSetting` 타입 추가
- `PostWithContent` 타입 추가
- `PostMetadata` 타입 추가 (댓글 수, 로고 등)

```typescript
// types.ts에 추가할 타입들
export interface BoardCollectionSetting {
  board_id: string;
  display_order: number;
}

export interface PostWithContent {
  id: string;
  title: string;
  post_number: number;
  created_at: string;
  content: Json;
  views: number | null;
  likes: number | null;
  board_id: string | null;
  category: string | null;
}

export interface PostMetadata {
  commentCounts: Record<string, number>;
  boardInfos: Map<string, BoardInfoDetail>;
  teamLogos: Map<number, string>;
  leagueLogos: Map<number, string>;
}

export interface BoardInfoDetail {
  slug: string;
  name: string;
  teamId: number | null;
  leagueId: number | null;
}
```

---

#### Step 2: 설정 조회 함수 분리
**파일:** `actions/getBoardSettings.ts`

**책임:** 위젯 설정 및 게시판 목록 조회

```typescript
// getBoardSettings.ts
'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { BoardCollectionSetting } from '../types';

const DEFAULT_BOARD_SLUGS = ['sports-news', 'soccer'];

export async function getBoardSettings(): Promise<string[]> {
  const supabase = await getSupabaseServer();

  // 1. 설정 테이블에서 조회
  const { data: settings } = await supabase
    .from('board_collection_widget_settings')
    .select('board_id, display_order')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (settings && settings.length > 0) {
    return (settings as BoardCollectionSetting[]).map(s => s.board_id);
  }

  // 2. 기본 게시판으로 fallback
  const { data: defaultBoards } = await supabase
    .from('boards')
    .select('id')
    .in('slug', DEFAULT_BOARD_SLUGS);

  return defaultBoards?.map(b => b.id) || [];
}
```

**예상 줄 수:** ~30줄

---

#### Step 3: 게시판+게시글 통합 조회 (쿼리 최적화)
**파일:** `actions/getBoardsWithPosts.ts`

**책임:** 게시판 정보와 게시글을 효율적으로 조회

**최적화 전략:**
1. 모든 게시판 정보를 한 번에 조회
2. 하위 게시판 ID를 한 번에 조회
3. 모든 게시글을 한 번에 조회 후 게시판별로 그룹화

```typescript
// getBoardsWithPosts.ts
'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { BoardInfo, PostWithContent } from '../types';

interface BoardWithPosts {
  board: BoardInfo;
  posts: PostWithContent[];
}

export async function getBoardsWithPosts(boardIds: string[]): Promise<BoardWithPosts[]> {
  if (boardIds.length === 0) return [];

  const supabase = await getSupabaseServer();

  // 1. 게시판 정보 한 번에 조회
  const { data: boards } = await supabase
    .from('boards')
    .select('id, name, slug, description')
    .in('id', boardIds);

  if (!boards || boards.length === 0) return [];

  // 2. 하위 게시판 한 번에 조회
  const { data: childBoards } = await supabase
    .from('boards')
    .select('id, parent_id')
    .in('parent_id', boardIds);

  // 게시판별 하위 게시판 ID 매핑
  const childBoardMap = new Map<string, string[]>();
  boardIds.forEach(id => childBoardMap.set(id, [id]));
  childBoards?.forEach(child => {
    const existing = childBoardMap.get(child.parent_id!) || [];
    existing.push(child.id);
    childBoardMap.set(child.parent_id!, existing);
  });

  // 모든 관련 게시판 ID
  const allBoardIds = Array.from(childBoardMap.values()).flat();

  // 3. 모든 게시글 한 번에 조회
  const { data: allPosts } = await supabase
    .from('posts')
    .select('id, title, post_number, created_at, content, views, likes, board_id, category')
    .in('board_id', allBoardIds)
    .order('created_at', { ascending: false })
    .limit(boardIds.length * 20); // 게시판당 20개

  // 4. 게시판별로 그룹화
  const result = boardIds.map(boardId => {
    const board = boards.find(b => b.id === boardId);
    if (!board) return null;

    const relatedBoardIds = childBoardMap.get(boardId) || [boardId];
    const posts = (allPosts || [])
      .filter(p => relatedBoardIds.includes(p.board_id!))
      .slice(0, 20);

    return {
      board: { ...board, slug: board.slug || '' },
      posts: posts as PostWithContent[]
    };
  }).filter((item): item is BoardWithPosts => item !== null);

  // boardIds 순서 유지
  return boardIds
    .map(id => result.find(r => r.board.id === id))
    .filter((item): item is BoardWithPosts => item !== undefined);
}
```

**예상 줄 수:** ~70줄
**쿼리 횟수:** 3회 (게시판 정보, 하위 게시판, 게시글)

---

#### Step 4: 메타데이터 조회 함수
**파일:** `actions/getPostsMetadata.ts`

**책임:** 댓글 수, 게시판 상세 정보, 로고 조회

```typescript
// getPostsMetadata.ts
'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { PostMetadata, BoardInfoDetail } from '../types';

export async function getPostsMetadata(postIds: string[], boardIds: string[]): Promise<PostMetadata> {
  if (postIds.length === 0) {
    return {
      commentCounts: {},
      boardInfos: new Map(),
      teamLogos: new Map(),
      leagueLogos: new Map()
    };
  }

  const supabase = await getSupabaseServer();

  // 병렬로 모든 메타데이터 조회
  const [commentResult, boardInfoResult] = await Promise.all([
    // 1. 댓글 수 조회
    supabase
      .from('comments')
      .select('post_id')
      .in('post_id', postIds)
      .eq('is_hidden', false)
      .eq('is_deleted', false),

    // 2. 게시판 상세 정보 조회
    supabase
      .from('boards')
      .select('id, slug, name, team_id, league_id')
      .in('id', boardIds)
  ]);

  // 댓글 수 집계
  const commentCounts: Record<string, number> = {};
  commentResult.data?.forEach(comment => {
    if (comment.post_id) {
      commentCounts[comment.post_id] = (commentCounts[comment.post_id] || 0) + 1;
    }
  });

  // 게시판 정보 매핑
  const boardInfos = new Map<string, BoardInfoDetail>();
  const teamIds: number[] = [];
  const leagueIds: number[] = [];

  boardInfoResult.data?.forEach(board => {
    boardInfos.set(board.id, {
      slug: board.slug || '',
      name: board.name || '',
      teamId: board.team_id,
      leagueId: board.league_id
    });
    if (board.team_id) teamIds.push(board.team_id);
    if (board.league_id) leagueIds.push(board.league_id);
  });

  // 3. 팀/리그 로고 조회 (필요한 경우만)
  const [teamResult, leagueResult] = await Promise.all([
    teamIds.length > 0
      ? supabase.from('teams').select('id, logo').in('id', teamIds)
      : Promise.resolve({ data: [] }),
    leagueIds.length > 0
      ? supabase.from('leagues').select('id, logo').in('id', leagueIds)
      : Promise.resolve({ data: [] })
  ]);

  const teamLogos = new Map<number, string>();
  const leagueLogos = new Map<number, string>();

  teamResult.data?.forEach(team => {
    if (team.logo) teamLogos.set(team.id, team.logo);
  });
  leagueResult.data?.forEach(league => {
    if (league.logo) leagueLogos.set(league.id, league.logo);
  });

  return { commentCounts, boardInfos, teamLogos, leagueLogos };
}
```

**예상 줄 수:** ~80줄
**쿼리 횟수:** 4회 (댓글, 게시판 정보, 팀 로고, 리그 로고) - 병렬 실행

---

#### Step 5: 포맷팅 유틸리티 분리
**파일:** `utils/formatPost.ts`

```typescript
// formatPost.ts
import { PostWithContent, BoardPost, PostMetadata, BoardInfo } from '../types';

export function formatPost(
  post: PostWithContent,
  parentBoard: BoardInfo,
  metadata: PostMetadata
): BoardPost {
  const postBoardId = post.board_id || '';
  const boardInfo = metadata.boardInfos.get(postBoardId);

  const teamLogo = boardInfo?.teamId
    ? metadata.teamLogos.get(boardInfo.teamId) || null
    : null;
  const leagueLogo = boardInfo?.leagueId
    ? metadata.leagueLogos.get(boardInfo.leagueId) || null
    : null;

  return {
    id: post.id,
    title: post.title,
    post_number: post.post_number,
    created_at: post.created_at,
    content: typeof post.content === 'string' ? post.content : JSON.stringify(post.content),
    views: post.views || 0,
    likes: post.likes || 0,
    comment_count: metadata.commentCounts[post.id] || 0,
    board_slug: boardInfo?.slug || parentBoard.slug || '',
    board_name: boardInfo?.name || parentBoard.name,
    author_nickname: '익명',
    category: post.category || null,
    team_logo: teamLogo,
    league_logo: leagueLogo
  };
}

export function formatBoardPosts(
  posts: PostWithContent[],
  parentBoard: BoardInfo,
  metadata: PostMetadata
): BoardPost[] {
  return posts.map(post => formatPost(post, parentBoard, metadata));
}
```

**예상 줄 수:** ~45줄

---

#### Step 6: 메인 컴포넌트 간소화
**파일:** `BoardCollectionWidget.tsx` (리팩토링 후)

```typescript
// BoardCollectionWidget.tsx (리팩토링 후)
import React from 'react';
import BoardCollectionWidgetClient from './BoardCollectionWidgetClient';
import { getBoardSettings } from './actions/getBoardSettings';
import { getBoardsWithPosts } from './actions/getBoardsWithPosts';
import { getPostsMetadata } from './actions/getPostsMetadata';
import { formatBoardPosts } from './utils/formatPost';
import { BoardCollectionData } from './types';

export default async function BoardCollectionWidget() {
  // 1. 설정된 게시판 ID 목록 가져오기
  const boardIds = await getBoardSettings();
  if (boardIds.length === 0) return null;

  // 2. 게시판 + 게시글 가져오기
  const boardsWithPosts = await getBoardsWithPosts(boardIds);
  if (boardsWithPosts.length === 0) return null;

  // 3. 메타데이터 가져오기 (댓글 수, 로고 등)
  const allPostIds = boardsWithPosts.flatMap(b => b.posts.map(p => p.id));
  const allBoardIds = boardsWithPosts.flatMap(b => b.posts.map(p => p.board_id).filter(Boolean)) as string[];
  const metadata = await getPostsMetadata(allPostIds, allBoardIds);

  // 4. 최종 데이터 포맷팅
  const boardsData: BoardCollectionData[] = boardsWithPosts.map(({ board, posts }) => ({
    board,
    recentPosts: formatBoardPosts(posts, board, metadata),
    popularPosts: [], // deprecated
    featuredImages: [] // deprecated
  }));

  return <BoardCollectionWidgetClient boardsData={boardsData} />;
}
```

**예상 줄 수:** ~35줄

---

## 4. 리팩토링 전후 비교

### 4.1 파일/줄 수 비교

| 파일 | 리팩토링 전 | 리팩토링 후 |
|------|-------------|-------------|
| types.ts | 33줄 | ~60줄 |
| BoardCollectionWidget.tsx | 269줄 | ~35줄 |
| actions/getBoardSettings.ts | - | ~30줄 |
| actions/getBoardsWithPosts.ts | - | ~70줄 |
| actions/getPostsMetadata.ts | - | ~80줄 |
| utils/formatPost.ts | - | ~45줄 |
| **총합** | **302줄** | **~320줄** |

> 총 줄 수는 비슷하지만, 각 파일이 단일 책임을 가지고 분리됨

### 4.2 쿼리 횟수 비교 (게시판 3개 기준)

| 단계 | 리팩토링 전 | 리팩토링 후 |
|------|-------------|-------------|
| 설정 조회 | 1~2 | 1~2 |
| 게시판 정보 | 1 | 1 |
| 하위 게시판 | 3 (각각) | 1 (한번에) |
| 게시글 | 3 (각각) | 1 (한번에) |
| 인기 게시글 | 3 (사용 안 함) | 0 (제거) |
| 댓글 수 | 3 (각각) | 1 (한번에) |
| 게시판 상세 | 3 (각각) | 1 (한번에) |
| 팀 로고 | 3 (각각) | 1 (한번에) |
| 리그 로고 | 3 (각각) | 1 (한번에) |
| **총합** | **~24회** | **~8회** |

### 4.3 코드 품질 비교

| 항목 | 리팩토링 전 | 리팩토링 후 |
|------|-------------|-------------|
| 단일 책임 원칙 | ❌ 위반 | ✅ 준수 |
| 타입 단언 | 2개 | 0개 |
| 죽은 코드 | 있음 | 없음 |
| 테스트 용이성 | 어려움 | 쉬움 |
| 재사용성 | 낮음 | 높음 |

---

## 5. 작업 체크리스트

### Step 1: 타입 정리
- [ ] `types.ts`에 새 타입 추가
- [ ] 기존 타입과 충돌 없는지 확인

### Step 2: actions 폴더 생성 및 함수 분리
- [ ] `actions/index.ts` 생성
- [ ] `actions/getBoardSettings.ts` 생성
- [ ] `actions/getBoardsWithPosts.ts` 생성
- [ ] `actions/getPostsMetadata.ts` 생성

### Step 3: utils 폴더 생성
- [ ] `utils/index.ts` 생성
- [ ] `utils/formatPost.ts` 생성

### Step 4: 메인 컴포넌트 리팩토링
- [ ] `BoardCollectionWidget.tsx` 수정
- [ ] 기존 코드 백업 (주석 또는 .backup)

### Step 5: 테스트 및 검증
- [ ] 개발 서버에서 동작 확인
- [ ] 빈 게시판 케이스 확인
- [ ] 에러 처리 확인

### Step 6: 정리
- [ ] 불필요한 코드/파일 제거
- [ ] index.ts export 정리

---

## 6. 리스크 및 대응

| 리스크 | 가능성 | 영향 | 대응 |
|--------|--------|------|------|
| 기존 기능 깨짐 | 중간 | 높음 | 단계별 테스트, 백업 유지 |
| 타입 에러 | 낮음 | 중간 | TypeScript strict 모드 활용 |
| 쿼리 최적화 실패 | 낮음 | 중간 | 성능 측정 후 롤백 가능하도록 |

---

## 7. 예상 소요 시간

| 단계 | 예상 시간 |
|------|----------|
| Step 1: 타입 정리 | 10분 |
| Step 2: actions 분리 | 30분 |
| Step 3: utils 분리 | 10분 |
| Step 4: 메인 컴포넌트 | 15분 |
| Step 5: 테스트 | 15분 |
| Step 6: 정리 | 5분 |
| **총합** | **~85분** |

---

## 8. 완료 상태

- [x] 계획 검토 완료
- [x] 리팩토링 진행 승인
- [x] 작업 완료 (2024-12-23)

### 최종 결과

#### 새로운 파일 구조
```
board-collection-widget/
├── index.ts                              # export (변경 없음)
├── types.ts                              # 79줄 (33 → 79, 타입 추가)
├── BoardCollectionWidget.tsx             # 47줄 (269 → 47) ✅
├── BoardCollectionWidgetClient.tsx       # 257줄 (변경 없음)
├── actions/
│   ├── index.ts                          # 3줄
│   ├── getBoardSettings.ts               # 42줄
│   ├── getBoardsWithPosts.ts             # 91줄
│   └── getPostsMetadata.ts               # 107줄
└── utils/
    ├── index.ts                          # 1줄
    └── formatPost.ts                     # 49줄
```

#### 목표 달성
| 항목 | 목표 | 결과 | 상태 |
|------|------|------|------|
| BoardCollectionWidget.tsx | < 50줄 | 47줄 | ✅ |
| 쿼리 최적화 | ~8회 | ~8회 | ✅ |
| 타입 단언 제거 | 0개 | 0개 | ✅ |
| 죽은 코드 제거 | 제거 | 제거됨 | ✅ |
| 빌드 성공 | 성공 | 성공 | ✅ |

---

## 9. 클라이언트 컴포넌트 리뷰 (2026-01-14 추가)

> 서버 컴포넌트는 리팩토링 완료됨. 아래는 **BoardCollectionWidgetClient.tsx** 이슈.

### 9.1 발견된 문제점

#### 문제 1: 게시글 렌더링 코드 3회 중복 (심각도: 높음)

**동일한 Link 컴포넌트가 3곳에서 반복:**

| 위치 | 라인 | 용도 |
|------|------|------|
| 1 | 139-160 | 데스크톱 왼쪽 열 (1~10번) |
| 2 | 165-186 | 데스크톱 오른쪽 열 (11~20번) |
| 3 | 227-248 | 모바일 목록 |

```typescript
// 3곳에서 동일한 구조 반복
<Link
  href={`/boards/${post.board_slug}/${post.post_number}`}
  className={`text-xs text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA]
    dark:hover:bg-[#333333] transition-colors py-2 px-4 flex items-center gap-2 min-w-0 ${...}`}
>
  <div className="flex-shrink-0">{renderBoardLogo(post)}</div>
  <span className="flex-1 min-w-0 line-clamp-1">{post.title}</span>
  {post.comment_count > 0 && (
    <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
      [{post.comment_count}]
    </span>
  )}
</Link>
```

**문제점:**
- 스타일 변경 시 3곳 모두 수정 필요
- 버그 수정 누락 위험
- 코드량 증가로 가독성 저하

---

#### 문제 2: 중복 상태 관리 (심각도: 중간)

```typescript
const [selectedBoardIndex, setSelectedBoardIndex] = useState(0);
const [page, setPage] = useState(0);  // ← selectedBoardIndex와 항상 동일!

// 항상 함께 업데이트
const handleNext = () => {
  setSelectedBoardIndex((prev) => (prev + 1) % totalPages);
  setPage((prev) => (prev + 1) % totalPages);  // 중복!
};
```

**문제점:** `page`와 `selectedBoardIndex`가 항상 같은 값

---

#### 문제 3: 매직 넘버 (심각도: 중간)

```typescript
slice(0, 10)           // 페이지당 게시글 수
slice(10, 20)          // 두 번째 페이지
currentPage * 10       // 페이지 오프셋
index === 9            // 마지막 아이템 체크
recentPosts.length > 10  // 2페이지 존재 여부
```

**문제점:** 숫자 의미 파악 어려움, 변경 시 여러 곳 수정 필요

---

#### 문제 4: 인라인 스타일 (심각도: 낮음)

```typescript
style={{maxWidth: '60px'}}  // Line 63
style={{maxWidth: '70px'}}  // Line 72
```

**문제점:** Tailwind 컨벤션과 불일치

---

#### 문제 5: 긴 className 반복 (심각도: 낮음)

```typescript
// 동일한 긴 className이 여러 곳에서 반복
className={`text-xs text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA]
  dark:hover:bg-[#333333] transition-colors py-2 px-4 flex items-center gap-2 min-w-0 ${...}`}
```

---

### 9.2 리팩토링 계획

#### Phase 1: 상수 정의
```typescript
const POSTS_PER_PAGE = 10;
```

#### Phase 2: 컴포넌트 분리
```typescript
// PostItem 컴포넌트 추출
interface PostItemProps {
  post: Post;
  isLast: boolean;
}

const PostItem = ({ post, isLast }: PostItemProps) => (
  <Link href={`/boards/${post.board_slug}/${post.post_number}`} className={...}>
    <BoardLogo post={post} />
    <span className="flex-1 min-w-0 line-clamp-1">{post.title}</span>
    <CommentCount count={post.comment_count} />
  </Link>
);
```

#### Phase 3: 상태 정리
```typescript
// page 상태 제거, selectedBoardIndex만 사용
const [selectedBoardIndex, setSelectedBoardIndex] = useState(0);
```

#### Phase 4: 스타일 정리
```typescript
// 인라인 스타일 → Tailwind
className="max-w-[60px]"
```

---

### 9.3 예상 결과

| 항목 | 변경 전 | 변경 후 |
|------|--------|--------|
| 총 라인 수 | ~257줄 | ~180줄 |
| 중복 코드 | 3곳 | 0곳 |
| 상태 변수 | 4개 | 3개 |
| 게시글 스타일 변경 시 수정 위치 | 3곳 | 1곳 |

---

### 9.4 상태

- [x] 클라이언트 컴포넌트 리팩토링 완료 (2026-01-14)

### 9.5 완료된 변경사항

| 항목 | 변경 전 | 변경 후 |
|------|--------|--------|
| 총 라인 수 | 257줄 | 255줄 |
| 중복 코드 | 3곳 | 0곳 (PostItem 컴포넌트) |
| 상태 변수 | 4개 | 3개 (page 제거) |
| 매직 넘버 | 다수 | POSTS_PER_PAGE 상수 |
| 인라인 스타일 | 2곳 | 0곳 (Tailwind 변환) |

**추출된 컴포넌트:**
- `BoardLogo` - 게시판 로고 렌더링
- `CommentCount` - 댓글 수 표시
- `PostItem` - 게시글 아이템 (3곳 중복 제거)

---

[← Phase 1.1 메인 페이지 리뷰](./phase1-1-main-page-review.md)
