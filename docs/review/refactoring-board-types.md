# 게시판 공통 타입/함수 분리

> 작성일: 2024-12-23
> 상태: ✅ 완료

## 1. 문제점

### 1.1 타입 중복

`LayoutPost`, `ApiPost`, `PopularPost` 타입이 4개 파일에 중복 정의됨:

| 파일 | 중복 줄 수 |
|------|-----------|
| `[slug]/page.tsx` | ~50줄 |
| `all/page.tsx` | ~50줄 |
| `popular/page.tsx` | ~50줄 |
| `BoardDetailLayout.tsx` | ~45줄 |

### 1.2 함수 중복

`convertApiPostsToLayoutPosts` 함수가 4개 파일에 동일하게 정의됨:

```typescript
// 각 파일에 ~25줄씩 중복
function convertApiPostsToLayoutPosts(apiPosts: ApiPost[]): LayoutPost[] {
  return apiPosts.map(post => ({
    id: post.id,
    title: post.title,
    // ... 필드 매핑
  }));
}
```

---

## 2. 해결 방안

### 2.1 새로운 파일 구조

```
src/domains/boards/
├── types/
│   └── post/
│       ├── index.ts           # export
│       └── layout.ts          # 타입 정의 (신규)
└── utils/
    └── post/
        └── postUtils.ts       # 변환 함수 추가
```

### 2.2 생성된 타입

**파일:** `types/post/layout.ts`

```typescript
export interface LayoutPost {
  id: string;
  title: string;
  board_id: string;
  board_name: string;
  board_slug: string;
  post_number: number;
  created_at: string;
  formattedDate: string;
  views: number;
  likes: number;
  author_nickname: string;
  author_id?: string;
  author_icon_id?: number | null;
  author_icon_url?: string | null;
  author_level?: number;
  comment_count: number;
  content?: string;
  team_id?: number | null;
  thumbnail?: string | null;
  hot_score?: number;
  is_hot?: boolean;
}

export interface ApiPost {
  id: string;
  title: string;
  board_id?: string;
  post_number?: number | string;
  created_at?: string;
  views?: number | string;
  like_count?: number | string;
  dislike_count?: number | string;
  comment_count?: number | string;
  author_nickname?: string;
  author_id?: string;
  content?: string;
  team_id?: number | string | null;
  thumbnail?: string | null;
  hot_score?: number;
  is_hot?: boolean;
  boards?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  profiles?: {
    icon_id?: number | null;
    icon_url?: string | null;
    level?: number;
    nickname?: string;
  } | null;
}

export interface PopularPost {
  id: string;
  title: string;
  board_name: string;
  board_slug: string;
  post_number: number;
  views: number;
  likes: number;
  comment_count: number;
  created_at: string;
  formattedDate: string;
  author_nickname: string;
  thumbnail?: string | null;
  hot_score?: number;
  is_hot?: boolean;
}
```

### 2.3 생성된 함수

**파일:** `utils/post/postUtils.ts`

```typescript
export function convertApiPostsToLayoutPosts(apiPosts: ApiPost[]): LayoutPost[] {
  return apiPosts.map(post => ({
    id: post.id,
    title: post.title,
    board_id: post.board_id || '',
    board_name: post.boards?.name || '',
    board_slug: post.boards?.slug || '',
    post_number: typeof post.post_number === 'string'
      ? parseInt(post.post_number, 10)
      : (post.post_number || 0),
    created_at: post.created_at || '',
    formattedDate: post.created_at
      ? new Date(post.created_at).toLocaleDateString('ko-KR')
      : '',
    views: typeof post.views === 'string'
      ? parseInt(post.views, 10)
      : (post.views || 0),
    likes: typeof post.like_count === 'string'
      ? parseInt(post.like_count, 10)
      : (post.like_count || 0),
    author_nickname: post.author_nickname || post.profiles?.nickname || '익명',
    author_id: post.author_id || undefined,
    author_icon_id: post.profiles?.icon_id ?? null,
    author_icon_url: post.profiles?.icon_url ?? null,
    author_level: post.profiles?.level,
    comment_count: typeof post.comment_count === 'string'
      ? parseInt(post.comment_count, 10)
      : (post.comment_count || 0),
    content: post.content || undefined,
    team_id: typeof post.team_id === 'string'
      ? parseInt(post.team_id, 10)
      : post.team_id as number | null,
    thumbnail: post.thumbnail || null,
    hot_score: post.hot_score || undefined,
    is_hot: post.is_hot || false
  }));
}
```

---

## 3. 변경된 파일

| 파일 | 변경 전 | 변경 후 | 감소 |
|------|---------|---------|------|
| `[slug]/page.tsx` | 236줄 | 182줄 | -54줄 |
| `all/page.tsx` | 207줄 | 126줄 | -81줄 |
| `popular/page.tsx` | 214줄 | 133줄 | -81줄 |
| `BoardDetailLayout.tsx` | 329줄 | 284줄 | -45줄 |
| **합계** | - | - | **-261줄** |

---

## 4. 사용 방법

```typescript
// 타입 import
import type { LayoutPost, ApiPost, PopularPost } from '@/domains/boards/types/post';

// 함수 import
import { convertApiPostsToLayoutPosts } from '@/domains/boards/utils/post/postUtils';

// 사용
const layoutPosts = convertApiPostsToLayoutPosts(apiPosts);
```

---

## 5. 빌드 테스트

✅ 성공

---

[← Phase 1.2 게시판 리뷰](./phase1-2-boards-review.md)
