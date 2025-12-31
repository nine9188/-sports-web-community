# User Domain 타입 정의

## 위치

`src/domains/user/types/index.ts`

---

## 타입 목록

### `PublicProfile`

사용자의 공개 프로필 정보

```typescript
interface PublicProfile {
  id: string;              // UUID (내부 user_id)
  public_id: string;       // 8자리 공개 ID
  nickname: string;        // 닉네임
  icon_id: number | null;  // shop_items FK (커스텀 아이콘)
  icon_url: string | null; // 아이콘 이미지 URL
  level: number;           // 현재 레벨 (1-49)
  exp: number;             // 누적 경험치
  created_at: string;      // ISO 날짜 문자열 (실제로는 updated_at)
  post_count: number;      // 작성 게시글 수
  comment_count: number;   // 작성 댓글 수
}
```

**사용처**:
- `getPublicProfile` 반환값
- `PublicProfileCard` props
- `UserProfileModal` 내부 상태

---

### `UserPostItem`

사용자 게시글 아이템 (현재 미사용)

```typescript
interface UserPostItem {
  id: string;
  title: string;
  content: string | null;
  created_at: string;
  views: number;
  likes: number;
  board_id: string;
  board_name: string;
  board_slug: string;
  post_number: number;
}
```

**참고**: 실제로는 `boards/postlist/types`의 `Post` 타입 사용

---

### `UserCommentItem`

사용자 댓글 아이템 (현재 미사용)

```typescript
interface UserCommentItem {
  id: string;
  content: string;
  created_at: string;
  post_id: string;
  post_title: string;
  post_number: number;
  board_slug: string;
  board_name: string;
}
```

**참고**: 댓글 목록이 아닌 "댓글 단 게시글" 목록을 표시하므로 미사용

---

### `PaginationParams`

페이지네이션 파라미터

```typescript
interface PaginationParams {
  page: number;   // 1부터 시작
  limit: number;  // 페이지당 항목 수
}
```

**사용처**:
- `getUserPosts`
- `getUserCommentedPosts`

---

### `ActionResponse<T>`

서버 액션 응답 래퍼

```typescript
interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  totalCount?: number;
  error?: string;
  hasMore?: boolean;
}
```

**사용 예**:
```typescript
// 성공
{ success: true, data: profile }

// 목록 성공
{ success: true, data: posts, totalCount: 100, hasMore: true }

// 실패
{ success: false, error: '프로필을 찾을 수 없습니다.' }
```

---

## 관련 외부 타입

### `Post` (boards 도메인)

`src/domains/boards/components/post/postlist/types.ts`

```typescript
interface Post {
  id: string;
  title: string;
  board_id: string;
  board_name: string;
  board_slug: string;
  post_number: number;
  created_at: string;
  views: number;
  likes: number;
  author_nickname: string;
  author_id?: string;
  author_public_id?: string;
  author_level?: number;
  author_icon_id?: number | null;
  author_icon_url?: string | null;
  comment_count: number;
  content?: string;
  team_id?: string | number | null;
  league_id?: string | number | null;
  team_logo?: string | null;
  league_logo?: string | null;
  formattedDate?: string;
  is_hidden?: boolean;
  is_deleted?: boolean;
}
```

**사용처**: `UserPostList`, `UserCommentList`

---

### `UserIconInfo` (shared 유틸)

`src/shared/utils/level-icons.ts`

```typescript
interface UserIconInfo {
  currentIconId: number | null;
  currentIconUrl: string | null;
  currentIconName: string | null;
  nextIconId: number | null;
  nextIconUrl: string | null;
  nextIconName: string | null;
  currentLevel: number;
  nextLevel: number;
  progress: number;
  totalPoints: number;
  pointsToNextLevel: number;
  isUsingLevelIcon?: boolean;
  levelIconUrl?: string;
  purchasedIconUrl?: string | null;
  level?: number;
  exp?: number;
  iconId?: number | null;
  iconName?: string | null;
}
```

**참고**: 복잡한 구조, 정리 필요

---

## 타입 사용 패턴

### 액션 → 컴포넌트

```typescript
// 액션
const result = await getPublicProfile(publicId);
// result: ActionResponse<PublicProfile>

// 컴포넌트에서
if (result.success && result.data) {
  const profile: PublicProfile = result.data;
}
```

### 목록 데이터

```typescript
// 액션
const result = await getUserPosts(publicId, { page: 1, limit: 10 });
// result: ActionResponse<Post[]>

// 컴포넌트에서
const [posts, setPosts] = useState<Post[]>([]);
const [totalCount, setTotalCount] = useState(0);

if (result.success && result.data) {
  setPosts(result.data);
  setTotalCount(result.totalCount || 0);
}
```

---

## 타입 불일치 문제

### 1. 미사용 타입

`UserPostItem`, `UserCommentItem`은 정의만 되어 있고 실제로 사용되지 않음.
실제로는 `Post` 타입 사용.

### 2. created_at vs updated_at

`PublicProfile.created_at`에 실제로는 `profiles.updated_at` 값이 들어감.
프로필 가입일이 아닌 마지막 수정일이 표시됨.

### 3. UserIconInfo 복잡성

`UserIconInfo` 타입이 너무 많은 속성을 가짐.
레벨 아이콘과 구매 아이콘 정보가 혼재됨.
