# User Domain UI 재설계 가이드

> **Status**: Phase 1 완료 (2025-12-31)

## 완료된 작업

### Phase 1 (2025-12-31)

1. **Pagination 컴포넌트 추출**
   - `src/domains/user/components/list/Pagination.tsx` 생성
   - UI Guidelines 준수 (배경색, 호버, 다크모드)

2. **UserPostList/UserCommentList 간소화**
   - 168줄 → 79줄 (53% 감소)
   - 공통 Pagination 컴포넌트 사용

3. **탭 컴포넌트 표준화**
   - `UserActivityTabs.tsx`: `@/shared/components/ui/tabs` 사용
   - `UserProfileModal.tsx`: 동일하게 공통 컴포넌트 적용
   - `variant="fill"` 스타일로 통일

---

## 목표

1. 코드 중복 제거 및 컴포넌트 재사용성 향상
2. 일관된 UI/UX 경험 제공
3. 프로젝트 디자인 시스템 준수

---

## 제안 구조

### 새 디렉토리 구조

```
src/domains/user/
├── actions/
│   ├── getPublicProfile.ts
│   ├── getUserPosts.ts
│   ├── getUserComments.ts
│   └── index.ts
│
├── components/
│   ├── profile/
│   │   ├── ProfileHeader.tsx      # 공통 프로필 헤더
│   │   ├── ProfileStats.tsx       # 통계 그리드
│   │   ├── LevelProgress.tsx      # 레벨 진행률 바
│   │   └── index.ts
│   │
│   ├── list/
│   │   ├── UserPostList.tsx       # 간소화된 버전
│   │   ├── UserCommentList.tsx    # 간소화된 버전
│   │   ├── Pagination.tsx         # 공통 페이지네이션
│   │   └── index.ts
│   │
│   ├── AuthorLink.tsx             # 유지
│   ├── PublicProfileCard.tsx      # ProfileHeader 사용
│   ├── UserProfileModal.tsx       # ProfileHeader 사용
│   └── index.ts
│
├── hooks/
│   ├── usePaginatedData.ts        # 공통 페이지네이션 훅
│   └── index.ts
│
├── context/
│   └── UserProfileModalContext.tsx
│
└── types/
    └── index.ts
```

---

## 컴포넌트 재설계

### 1. ProfileHeader (신규)

프로필 상단 정보를 표시하는 공통 컴포넌트

```typescript
// src/domains/user/components/profile/ProfileHeader.tsx

interface ProfileHeaderProps {
  profile: PublicProfile;
  variant?: 'default' | 'compact';  // compact: 모달용
  showStats?: boolean;              // 통계 표시 여부
  isOwnProfile?: boolean;
  onReport?: () => void;            // 신고 콜백
}

export function ProfileHeader({
  profile,
  variant = 'default',
  showStats = true,
  isOwnProfile = false,
  onReport
}: ProfileHeaderProps) {
  return (
    <div className="...">
      {/* 아이콘 + 닉네임 + 레벨 */}
      <div className="flex items-center gap-3">
        <UserIcon
          iconUrl={profile.icon_url}
          level={profile.level}
          size={variant === 'compact' ? 48 : 56}
        />
        <div>
          <h1 className="...">{profile.nickname}</h1>
          <LevelProgress level={profile.level} exp={profile.exp} />
        </div>
      </div>

      {/* 통계 */}
      {showStats && <ProfileStats profile={profile} />}

      {/* 신고 버튼 */}
      {!isOwnProfile && onReport && (
        <ReportButton onClick={onReport} />
      )}
    </div>
  );
}
```

---

### 2. LevelProgress (신규)

레벨 진행률 표시 컴포넌트

```typescript
// src/domains/user/components/profile/LevelProgress.tsx

interface LevelProgressProps {
  level: number;
  exp: number;
  showExpText?: boolean;  // EXP 텍스트 표시
}

export function LevelProgress({ level, exp, showExpText = true }: LevelProgressProps) {
  const progress = calculateLevelProgress(level, exp);
  const expToNext = getExpToNextLevel(level, exp);
  const nextLevelExp = LEVEL_EXP_REQUIREMENTS[level] || 0;

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          레벨 {level}
        </span>
        {showExpText && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({exp} / {nextLevelExp} EXP)
          </span>
        )}
      </div>

      {/* 진행률 바 */}
      <div className="w-full h-1.5 bg-[#EAEAEA] dark:bg-[#333333] rounded-full mt-1.5">
        <div
          className="h-full bg-slate-800 dark:bg-[#F0F0F0] rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
        다음 레벨까지 {expToNext} EXP 필요
      </div>
    </div>
  );
}
```

---

### 3. ProfileStats (신규)

통계 그리드 컴포넌트

```typescript
// src/domains/user/components/profile/ProfileStats.tsx

interface ProfileStatsProps {
  profile: PublicProfile;
  layout?: 'grid' | 'row';  // grid: 3열, row: 가로 나열
}

export function ProfileStats({ profile, layout = 'grid' }: ProfileStatsProps) {
  const stats = [
    { icon: FileText, label: '작성글', value: profile.post_count },
    { icon: MessageSquare, label: '댓글', value: profile.comment_count },
    { icon: Calendar, label: '가입', value: formatJoinDate(profile.created_at) },
  ];

  return (
    <div className={layout === 'grid' ? 'grid grid-cols-3 gap-4' : 'flex gap-6'}>
      {stats.map(({ icon: Icon, label, value }) => (
        <div key={label} className="text-center">
          <div className="flex items-center justify-center gap-1.5 text-gray-600 dark:text-gray-400 mb-1">
            <Icon className="w-4 h-4" />
            <span className="text-xs">{label}</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}
```

---

### 4. Pagination (공통화)

```typescript
// src/domains/user/components/list/Pagination.tsx

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxButtons?: number;  // 표시할 버튼 수 (default: 7)
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxButtons = 7
}: PaginationProps) {
  // 페이지 번호 계산
  const pages = useMemo(() => {
    const result: number[] = [];
    let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    const end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    for (let i = start; i <= end; i++) result.push(i);
    return result;
  }, [currentPage, totalPages, maxButtons]);

  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-center gap-1 p-4 border-t border-black/5 dark:border-white/10">
      {/* 첫/이전 버튼 */}
      {/* 페이지 번호들 */}
      {/* 다음/마지막 버튼 */}
    </nav>
  );
}
```

---

### 5. usePaginatedData 훅 (신규)

```typescript
// src/domains/user/hooks/usePaginatedData.ts

interface UsePaginatedDataOptions<T> {
  publicId: string;
  fetcher: (publicId: string, pagination: PaginationParams) => Promise<ActionResponse<T[]>>;
  itemsPerPage?: number;
}

interface UsePaginatedDataResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  setPage: (page: number) => void;
  refresh: () => void;
}

export function usePaginatedData<T>({
  publicId,
  fetcher,
  itemsPerPage = 10
}: UsePaginatedDataOptions<T>): UsePaginatedDataResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher(publicId, { page: currentPage, limit: itemsPerPage });
      if (result.success && result.data) {
        setData(result.data);
        setTotalCount(result.totalCount || 0);
      } else {
        setError(result.error || '데이터를 불러올 수 없습니다.');
      }
    } catch (e) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [publicId, currentPage, itemsPerPage, fetcher]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    setPage: setCurrentPage,
    refresh: loadData
  };
}
```

---

### 6. 간소화된 UserPostList

```typescript
// src/domains/user/components/list/UserPostList.tsx

interface UserPostListProps {
  publicId: string;
}

export function UserPostList({ publicId }: UserPostListProps) {
  const {
    data: posts,
    loading,
    currentPage,
    totalPages,
    setPage
  } = usePaginatedData({
    publicId,
    fetcher: getUserPosts
  });

  return (
    <>
      <PostList
        posts={posts}
        loading={loading}
        showBoard={true}
        currentBoardId=""
        emptyMessage="작성한 게시글이 없습니다."
        className="!bg-transparent border-0 rounded-none"
      />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </>
  );
}
```

---

## 컬러 팔레트 준수

프로젝트 디자인 시스템 (`CLAUDE.md`) 준수:

```css
/* 배경 */
bg-white dark:bg-[#1D1D1D]
bg-[#F5F5F5] dark:bg-[#262626]

/* 텍스트 */
text-gray-900 dark:text-[#F0F0F0]
text-gray-600 dark:text-gray-400
text-gray-500 dark:text-gray-400

/* 테두리 */
border-black/7 dark:border-0
border-black/5 dark:border-white/10

/* 호버 */
hover:bg-[#EAEAEA] dark:hover:bg-[#333333]

/* 프로그레스 바 */
bg-[#EAEAEA] dark:bg-[#333333]  /* 배경 */
bg-slate-800 dark:bg-[#F0F0F0]  /* 채움 */
```

---

## 마이그레이션 단계

### Phase 1: 공통 컴포넌트 추출
1. `ProfileHeader`, `LevelProgress`, `ProfileStats` 생성
2. `Pagination` 공통화
3. `usePaginatedData` 훅 생성

### Phase 2: 기존 컴포넌트 리팩토링
1. `PublicProfileCard` → `ProfileHeader` 사용
2. `UserProfileModal` → `ProfileHeader` 사용
3. `UserPostList`, `UserCommentList` → 훅 사용

### Phase 3: 정리
1. 미사용 타입 제거
2. index.ts 업데이트
3. 문서 업데이트

---

## 테스트 체크리스트

- [ ] `/user/[publicId]` 페이지 정상 렌더링
- [ ] 프로필 모달 열기/닫기
- [ ] 게시글 목록 페이지네이션
- [ ] 댓글 목록 페이지네이션
- [ ] 다크모드 스타일링
- [ ] 모바일 반응형
- [ ] 본인 프로필 vs 타인 프로필 (신고 버튼)
