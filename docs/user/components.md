# User Domain 컴포넌트 상세

## 1. Page Components

### `/user/[publicId]/page.tsx` (서버 컴포넌트)

**위치**: `src/app/user/[publicId]/page.tsx`

**역할**: 공개 프로필 페이지의 메인 진입점

**특징**:
- Next.js 15 async params 패턴 사용
- 서버 컴포넌트로 초기 데이터 페칭
- SEO를 위한 `generateMetadata` 구현

```typescript
interface PageProps {
  params: Promise<{ publicId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { publicId } = await params;
  const result = await getPublicProfile(publicId);
  // ... 메타데이터 반환
}

export default async function UserProfilePage({ params }: PageProps) {
  const { publicId } = await params;
  const result = await getPublicProfile(publicId);

  if (!result.success || !result.data) {
    notFound();
  }

  // 본인 프로필 체크
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const isOwnProfile = user?.id === profile.id;

  return (
    <main>
      <PublicProfileCard profile={profile} isOwnProfile={isOwnProfile} />
      <UserActivityTabs publicId={publicId} />
    </main>
  );
}
```

---

### `UserActivityTabs.tsx` (클라이언트 컴포넌트)

**위치**: `src/app/user/[publicId]/UserActivityTabs.tsx`

**역할**: 작성글/댓글 탭 전환 UI

**Props**:
```typescript
interface UserActivityTabsProps {
  publicId: string;
}
```

**특징**:
- `@/shared/ui/tabs` 컴포넌트 사용
- `variant="minimal"` 스타일
- 탭 전환 시 해당 리스트 렌더링

---

## 2. User Domain Components

### `PublicProfileCard.tsx`

**위치**: `src/domains/user/components/PublicProfileCard.tsx`

**역할**: 프로필 정보를 카드 형태로 표시

**Props**:
```typescript
interface PublicProfileCardProps {
  profile: PublicProfile;
  isOwnProfile?: boolean;  // true면 신고 버튼 숨김
}
```

**UI 구조**:
```
┌─────────────────────────────────────┐
│ ┌──────┐  닉네임                     │
│ │ Icon │  레벨 N (xxx / yyy EXP)    │
│ └──────┘  [==========----] 70%      │
│           다음 레벨까지 zzz EXP 필요  │
├─────────────────────────────────────┤
│   작성글      │     댓글     │ 가입일  │
│     123      │     456     │ 2024년  │
├─────────────────────────────────────┤
│        [신고하기 버튼]               │ ← isOwnProfile=false
└─────────────────────────────────────┘
```

**의존성**:
- `UserIcon` (아이콘 표시)
- `ReportButton` (신고)
- `LEVEL_EXP_REQUIREMENTS`, `calculateLevelProgress`, `getExpToNextLevel` (레벨 계산)

---

### `UserProfileModal.tsx`

**위치**: `src/domains/user/components/UserProfileModal.tsx`

**역할**: 프로필을 모달 형태로 표시 (게시글에서 작성자 클릭 시)

**Props**:
```typescript
interface UserProfileModalProps {
  publicId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string | null;  // 본인 체크용
}
```

**UI 구조**:
```
┌─────────────────────────────────────┐
│ 프로필                          [X] │ ← 헤더
├─────────────────────────────────────┤
│  [프로필 정보 - PublicProfileCard와 │
│   유사하지만 인라인 구현]            │
├─────────────────────────────────────┤
│  [작성글]        [댓글]             │ ← 탭 버튼
├─────────────────────────────────────┤
│  UserPostList 또는 UserCommentList  │
└─────────────────────────────────────┘
```

**특징**:
- 내부 상태로 프로필 데이터 관리 (`useState`)
- `isOpen` 변경 시 `getPublicProfile` 호출
- 모바일: 하단에서 슬라이드업 (`rounded-t-2xl`)
- 데스크탑: 중앙 모달 (`md:rounded-lg`)

**문제점**:
- `PublicProfileCard`와 프로필 UI 코드 중복
- 컴포넌트 크기가 큼 (242줄)

---

### `AuthorLink.tsx`

**위치**: `src/domains/user/components/AuthorLink.tsx`

**역할**: 게시글/댓글의 작성자 표시 및 프로필 접근

**Props**:
```typescript
interface AuthorLinkProps {
  nickname: string;
  publicId?: string | null;  // 없으면 클릭 불가
  iconUrl?: string | null;
  level?: number;            // default: 1
  iconSize?: number;         // default: 16
  className?: string;
  showIcon?: boolean;        // default: true
}
```

**동작**:
1. `publicId` 있음: 클릭 시 드롭다운 표시
2. 드롭다운에서 "프로필 보기" 클릭 → `/user/[publicId]` 이동
3. `publicId` 없음: 단순 텍스트 표시 (클릭 불가)

**UI**:
```
[아이콘] 닉네임  →  클릭 시  ┌──────────────┐
                          │ 👤 프로필 보기 │
                          └──────────────┘
```

---

### `UserPostList.tsx`

**위치**: `src/domains/user/components/UserPostList.tsx`

**역할**: 사용자가 작성한 게시글 목록 표시

**Props**:
```typescript
interface UserPostListProps {
  publicId: string;
}
```

**특징**:
- 페이지당 10개 (`ITEMS_PER_PAGE = 10`)
- `boards/PostList` 컴포넌트 재사용
- 자체 페이지네이션 UI 포함

**데이터 흐름**:
```
useEffect([publicId, currentPage])
    │
    └─ loadPosts(currentPage)
        │
        └─ getUserPosts(publicId, { page, limit })
            │
            └─ setPosts(result.data)
```

**페이지네이션 UI**:
- 첫/마지막/이전/다음 버튼
- 페이지 번호 최대 7개 표시
- 모바일에서 양 끝 페이지 숨김

---

### `UserCommentList.tsx`

**위치**: `src/domains/user/components/UserCommentList.tsx`

**역할**: 사용자가 댓글 단 게시글 목록 표시

**특징**:
- `UserPostList`와 거의 동일한 구조
- `getUserCommentedPosts` 액션 사용
- 게시글 작성자가 아닌 **해당 게시글** 표시

**문제점**:
- `UserPostList`와 코드 중복 (Pagination 컴포넌트)
- 167줄 중 Pagination이 80줄 차지

---

## 3. Context

### `UserProfileModalContext.tsx`

**위치**: `src/domains/user/context/UserProfileModalContext.tsx`

**역할**: 앱 전역에서 프로필 모달 열기/닫기 관리

```typescript
interface UserProfileModalContextType {
  openProfileModal: (publicId: string) => void;
  closeProfileModal: () => void;
}
```

**Provider 위치**: `RootLayoutClient.tsx` (추정)

**사용법**:
```typescript
const { openProfileModal } = useUserProfileModal();
openProfileModal('a1b2c3d4');
```

**현재 상태**:
- Provider가 설정되어 있으나 `AuthorLink`에서 직접 페이지 이동 사용
- 모달 방식과 페이지 방식 혼재

---

## 4. Shared Components

### `UserIcon.tsx`

**위치**: `src/shared/components/UserIcon.tsx`

**역할**: 사용자 프로필 아이콘 표시 (메모이제이션됨)

**Props**:
```typescript
interface UserIconProps {
  iconUrl?: string | null;   // 커스텀 아이콘 URL
  level?: number;            // 레벨 기반 아이콘 (default: 1)
  size?: number;             // 픽셀 (default: 20)
  alt?: string;
  className?: string;
  priority?: boolean;        // 이미지 로딩 우선순위
}
```

**아이콘 결정 로직**:
```
1. error 발생 → getFallbackIconUrl(level)
2. iconUrl 없음 → getLevelIconUrl(level)
3. iconUrl 있음 → iconUrl 사용
```

**특수 처리**:
- API-Sports URL 감지 시 `UnifiedSportsImage` 사용
- 일반 URL은 Next.js `Image` 컴포넌트

---

## 컴포넌트 관계도

```
                    RootLayoutClient
                          │
                  UserProfileModalProvider
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   AuthorLink      /user/[publicId]    UserProfileModal
   (게시글에서)      (페이지)              (모달)
        │                 │                 │
        │          ┌──────┴──────┐          │
        │          │             │          │
        │   PublicProfileCard    │    (프로필 UI 중복)
        │          │     UserActivityTabs   │
        │          │             │          │
        │          │      ┌──────┴──────┐   │
        │          │      │             │   │
        │          │  UserPostList  UserCommentList
        │          │      │             │
        └──────────┴──────┴─────────────┴───┘
                          │
                      PostList (boards 도메인)
```
