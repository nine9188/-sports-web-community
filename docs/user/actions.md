# User Domain 서버 액션

## 개요

모든 서버 액션은 `'use server'` 지시어로 시작하며, `@/shared/lib/supabase/server`의 `getSupabaseServer`를 사용합니다.

## 액션 목록

### 1. `getPublicProfile`

**파일**: `src/domains/user/actions/getPublicProfile.ts`

**목적**: public_id로 사용자 공개 프로필 조회

**시그니처**:
```typescript
export async function getPublicProfile(
  publicId: string
): Promise<ActionResponse<PublicProfile>>
```

**파라미터**:
- `publicId`: 8자리 영숫자 문자열

**반환값**:
```typescript
{
  success: true,
  data: {
    id: string;           // UUID
    public_id: string;    // 8자리
    nickname: string;
    icon_id: number | null;
    icon_url: string | null;  // 아이콘 URL (shop_items 또는 레벨 기반)
    level: number;
    exp: number;
    created_at: string;   // 실제로는 updated_at 사용 중 (버그?)
    post_count: number;
    comment_count: number;
  }
}
```

**쿼리 흐름**:
```
1. profiles 테이블에서 public_id로 조회
   └─ SELECT id, public_id, nickname, icon_id, level, exp, updated_at

2. icon_id가 있으면 shop_items에서 image_url 조회
   └─ SELECT image_url FROM shop_items WHERE id = icon_id

3. icon_url이 없으면 레벨 기반 아이콘 생성
   └─ getLevelIconUrl(level)

4. posts 테이블에서 게시글 수 카운트
   └─ SELECT COUNT(*) FROM posts WHERE user_id = id AND is_deleted = false

5. comments 테이블에서 댓글 수 카운트
   └─ SELECT COUNT(*) FROM comments WHERE user_id = id AND is_deleted = false
```

**주의사항**:
- `created_at` 필드에 실제로는 `updated_at` 값이 들어감 (line 81)
- profiles 테이블에 `created_at` 컬럼이 없거나 조회하지 않음

---

### 2. `getUserPosts`

**파일**: `src/domains/user/actions/getUserPosts.ts`

**목적**: 사용자가 작성한 게시글 목록 조회

**시그니처**:
```typescript
export async function getUserPosts(
  publicId: string,
  pagination: PaginationParams = { page: 1, limit: 10 }
): Promise<ActionResponse<Post[]>>
```

**반환값**:
```typescript
{
  success: true,
  data: Post[],           // boards/postlist/types의 Post 형식
  totalCount: number,
  hasMore: boolean
}
```

**쿼리 흐름**:
```
1. profiles에서 public_id로 user_id 조회
   └─ SELECT id, nickname, public_id, level, icon_id

2. 아이콘 URL 조회 (icon_id가 있으면)
   └─ SELECT image_url FROM shop_items

3. posts 조회 (boards JOIN)
   └─ SELECT posts.*, boards.*
      WHERE user_id = ? AND is_deleted = false
      ORDER BY created_at DESC
      LIMIT/OFFSET

4. 각 게시글의 댓글 수 조회
   └─ SELECT post_id FROM comments WHERE post_id IN (...)

5. Post 형식으로 변환
```

**Post 변환 필드**:
```typescript
{
  id, title, content, created_at,
  formattedDate,        // formatDate(created_at)
  views, likes,
  board_id, board_name, board_slug, post_number,
  is_hidden, is_deleted,
  author_nickname, author_id, author_public_id,
  author_level, author_icon_id, author_icon_url,
  comment_count,
  team_id, league_id    // boards 테이블에서
}
```

---

### 3. `getUserCommentedPosts`

**파일**: `src/domains/user/actions/getUserComments.ts`

**목적**: 사용자가 댓글 단 게시글 목록 조회 (중복 제거, 최신 댓글 순)

**시그니처**:
```typescript
export async function getUserCommentedPosts(
  publicId: string,
  pagination: PaginationParams = { page: 1, limit: 10 }
): Promise<ActionResponse<Post[]>>
```

**쿼리 흐름**:
```
1. profiles에서 public_id로 user_id 조회

2. comments에서 해당 사용자의 모든 댓글 조회 (post_id, created_at)
   └─ SELECT post_id, created_at
      FROM comments
      WHERE user_id = ? AND is_deleted = false
      ORDER BY created_at DESC

3. 클라이언트 사이드에서 중복 제거 (JavaScript Set 사용)
   └─ 첫 번째 등장한 post_id만 유지

4. 페이지네이션 적용 (slice)

5. 해당 게시글들 상세 조회
   └─ SELECT posts.*, boards.*, profiles.*
      WHERE id IN (paginatedPostIds)

6. 아이콘 URL 일괄 조회

7. 댓글 수 조회

8. 원래 순서대로 정렬 (최신 댓글 순)

9. Post 형식으로 변환
```

**별칭**:
```typescript
export const getUserComments = getUserCommentedPosts;
```

---

## 타입 정의

### `ActionResponse<T>`

```typescript
interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  totalCount?: number;
  error?: string;
  hasMore?: boolean;
}
```

### `PaginationParams`

```typescript
interface PaginationParams {
  page: number;   // 1부터 시작
  limit: number;  // 페이지당 항목 수
}
```

---

## 성능 고려사항

### 현재 쿼리 수 (getUserCommentedPosts 기준)

| 단계 | 쿼리 수 |
|------|--------|
| 프로필 조회 | 1 |
| 댓글 목록 조회 | 1 |
| 게시글 상세 조회 | 1 |
| 아이콘 URL 조회 | 1 |
| 댓글 수 조회 | 1 |
| **총합** | **5** |

### 개선 가능성

1. **N+1 문제 없음**: 아이콘과 댓글 수는 일괄 조회

2. **중복 제거 비효율**:
   - 현재: 모든 댓글 가져온 후 JS에서 중복 제거
   - 개선: `SELECT DISTINCT ON (post_id)` 또는 서브쿼리

3. **카운트 분리 쿼리**:
   - 현재: `SELECT 'post_id' FROM comments WHERE post_id IN (...)`
   - 개선: `SELECT post_id, COUNT(*) GROUP BY post_id`

---

## 에러 처리

모든 액션은 동일한 에러 처리 패턴 사용:

```typescript
try {
  // 비즈니스 로직
} catch (error) {
  console.error('설명:', error);
  return {
    success: false,
    error: error instanceof Error ? error.message : '기본 에러 메시지',
    data: [],  // 또는 undefined
    totalCount: 0,
  };
}
```

### 검증 에러

```typescript
if (!publicId || publicId.length !== 8) {
  return {
    success: false,
    error: '유효하지 않은 프로필 ID입니다.',
  };
}
```
