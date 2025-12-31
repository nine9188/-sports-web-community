# User Domain 문제점 및 개선사항

> **Last Updated**: 2025-12-31

## 해결된 문제 (Phase 1)

- [x] **페이지네이션 컴포넌트 중복**: `list/Pagination.tsx`로 추출
- [x] **탭 컴포넌트 비표준**: `@/shared/components/ui/tabs` 사용으로 변경
- [x] **코드 라인 수 과다**: UserPostList/UserCommentList 168줄 → 79줄

---

## 1. 코드 중복 문제

### 1.1 프로필 UI 중복

**문제**: `PublicProfileCard`와 `UserProfileModal` 내부에 동일한 프로필 UI가 중복 구현됨

**위치**:
- `PublicProfileCard.tsx`: 130줄
- `UserProfileModal.tsx`: 114~199줄 (프로필 부분)

**중복 요소**:
- 프로필 아이콘 + 닉네임
- 레벨 정보 및 진행률 바
- 통계 그리드 (작성글, 댓글, 가입일)
- 신고 버튼

**개선안**:
```typescript
// 공통 컴포넌트 추출
interface ProfileHeaderProps {
  profile: PublicProfile;
  isOwnProfile?: boolean;
  showReportButton?: boolean;
  compact?: boolean;  // 모달용 컴팩트 버전
}

function ProfileHeader({ profile, isOwnProfile, showReportButton, compact }: ProfileHeaderProps) {
  // 공통 UI
}
```

---

### 1.2 페이지네이션 컴포넌트 중복

**문제**: `UserPostList`와 `UserCommentList`에 동일한 Pagination 컴포넌트가 각각 정의됨

**위치**:
- `UserPostList.tsx`: 88~167줄 (80줄)
- `UserCommentList.tsx`: 88~167줄 (80줄)

**개선안**:
```typescript
// 공통 컴포넌트로 추출
// src/domains/user/components/Pagination.tsx
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // 공통 구현
}
```

---

### 1.3 데이터 페칭 로직 중복

**문제**: `UserPostList`와 `UserCommentList`의 데이터 페칭 패턴이 거의 동일

**중복 패턴**:
```typescript
const [posts, setPosts] = useState<Post[]>([]);
const [loading, setLoading] = useState(true);
const [currentPage, setCurrentPage] = useState(1);
const [totalCount, setTotalCount] = useState(0);

const loadPosts = async (page: number) => {
  setLoading(true);
  try {
    const result = await getXXX(publicId, { page, limit });
    // ...
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  loadPosts(currentPage);
}, [publicId, currentPage]);
```

**개선안**: 커스텀 훅으로 추출
```typescript
function usePaginatedUserData<T>(
  publicId: string,
  fetcher: (publicId: string, pagination: PaginationParams) => Promise<ActionResponse<T[]>>
) {
  // 공통 로직
  return { data, loading, currentPage, totalCount, setCurrentPage };
}
```

---

## 2. 아키텍처 문제

### 2.1 프로필 접근 방식 혼재

**현상**:
- `AuthorLink`: 드롭다운 → 페이지 이동 (`/user/[publicId]`)
- `UserProfileModalContext`: 모달 방식

**문제점**:
- 두 방식이 혼재되어 있음
- `UserProfileModalContext`가 Provider로 설정되어 있으나 실제 사용되지 않음

**개선안**:
1. 한 방식으로 통일 (페이지 또는 모달)
2. 또는 설정에 따라 선택 가능하도록

---

### 2.2 타입 불일치

**문제**: `UserPostItem`, `UserCommentItem` 타입이 정의만 되어 있고 미사용

**현상**:
- 정의: `src/domains/user/types/index.ts`
- 실제 사용: `boards/postlist/types`의 `Post` 타입

**개선안**:
1. 미사용 타입 제거
2. 또는 `Post` 타입을 확장하는 방식으로 변경

---

### 2.3 created_at 필드 오류

**위치**: `getPublicProfile.ts:81`

```typescript
created_at: profile.updated_at,  // ❌ 잘못된 필드명
```

**문제**: 가입일이라고 표시하지만 실제로는 마지막 수정일

**개선안**:
1. profiles 테이블에서 `created_at` 컬럼 조회
2. 또는 필드명을 `updated_at`으로 변경하고 UI 라벨도 수정

---

## 3. UI/UX 문제

### 3.1 모달 크기 및 스크롤

**문제**: `UserProfileModal`이 내용이 많을 때 스크롤 처리

**현상**:
- 프로필 정보 + 탭 + 게시글 목록이 모두 모달 내부
- 게시글이 많으면 모달이 길어짐

**개선안**:
1. 프로필 정보는 고정, 게시글 목록만 스크롤
2. 또는 모달 높이 제한 후 내부 스크롤

---

### 3.2 반응형 디자인 개선 필요

**문제**: 모바일/데스크탑 UI 차이가 크지만 일관성 부족

**현상**:
- 모달: 모바일에서 하단 슬라이드업
- 페이지: 별도 처리 없음

---

### 3.3 로딩 상태 개선

**문제**: 각 컴포넌트가 개별 로딩 상태 관리

**개선안**: 스켈레톤 UI 적용

---

## 4. 성능 문제

### 4.1 getUserCommentedPosts 비효율

**문제**: 모든 댓글을 가져온 후 JS에서 중복 제거

```typescript
// 현재 방식
const { data: commentedPostIds } = await supabase
  .from('comments')
  .select('post_id, created_at')
  .eq('user_id', profile.id)
  .order('created_at', { ascending: false });

// JS에서 중복 제거
const uniquePostIds: string[] = [];
for (const comment of commentedPostIds || []) {
  if (!seenPosts.has(comment.post_id)) {
    uniquePostIds.push(comment.post_id);
  }
}
```

**개선안**: SQL에서 처리
```sql
SELECT DISTINCT ON (post_id) post_id, created_at
FROM comments
WHERE user_id = ?
ORDER BY post_id, created_at DESC
```

---

### 4.2 아이콘 URL 다중 조회

**문제**: `getUserCommentedPosts`에서 여러 작성자의 아이콘을 조회해야 함

**현재 방식**: 일괄 조회 (OK)

---

## 5. 코드 품질 문제

### 5.1 컴포넌트 크기

| 파일 | 라인 수 | 권장 |
|------|--------|------|
| UserProfileModal.tsx | 242 | < 150 |
| UserPostList.tsx | 168 | < 100 |
| UserCommentList.tsx | 168 | < 100 |

### 5.2 ESLint 비활성화

```typescript
// eslint-disable-next-line react-hooks/exhaustive-deps
```

**위치**:
- `UserProfileModal.tsx:43`
- `UserPostList.tsx:44`
- `UserCommentList.tsx:44`

**문제**: 의존성 배열 문제를 무시

---

## 6. 개선 우선순위

### 높음 (즉시 수정)
1. `created_at` 필드 오류 수정
2. Pagination 컴포넌트 추출
3. 프로필 UI 컴포넌트 추출

### 중간 (리팩토링 시)
4. 미사용 타입 정리
5. 커스텀 훅 추출
6. 프로필 접근 방식 통일

### 낮음 (향후)
7. SQL 쿼리 최적화
8. 스켈레톤 UI 적용
9. 반응형 디자인 개선
