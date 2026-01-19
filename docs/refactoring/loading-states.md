# Loading States 개선 계획

## 현재 상태

### Next.js loading.tsx
```
src/app/loading.tsx:           없음 ❌
src/app/boards/loading.tsx:    없음 ❌
src/app/livescore/loading.tsx: 없음 ❌
...
```

### 기존 로딩 패턴
| 패턴 | 사용처 | 상태 |
|------|--------|------|
| `Spinner` 컴포넌트 | 40+ 파일 | ✅ 통일됨 |
| `PostListSkeleton` | 게시글 목록 | ✅ 도메인 전용 |
| `LoadingSkeleton` | 라이브스코어 모달 | ⚠️ import 누락 |
| 인라인 `animate-pulse` | 38개 파일 | ❌ 비일관 |

---

## 개선 방향: loading.tsx 도입

### 왜 loading.tsx인가?

1. **자동 Streaming**: 서버 컴포넌트 로딩 시 자동 표시
2. **Suspense 통합**: React Suspense와 자연스럽게 연동
3. **코드 간소화**: 개별 isLoading 상태 관리 불필요
4. **UX 개선**: 페이지 전환 시 빈 화면 방지

### Next.js loading.tsx 동작 원리

```
사용자가 /boards/free 접속
        ↓
Next.js가 자동으로 Suspense boundary 생성
        ↓
page.tsx 로딩 중 → loading.tsx 표시
        ↓
page.tsx 완료 → 실제 콘텐츠 표시
```

---

## 구현 계획

### Phase 1: 전역 loading.tsx (우선)

```
src/app/
├── loading.tsx          ← 전역 폴백 (필수)
```

**전역 로딩 컴포넌트:**
```tsx
// src/app/loading.tsx
import Spinner from '@/shared/components/Spinner';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Spinner size="lg" />
    </div>
  );
}
```

### Phase 2: 주요 라우트별 loading.tsx

| 경로 | 로딩 UI | 우선순위 |
|------|---------|----------|
| `src/app/boards/loading.tsx` | 게시판 스켈레톤 | 높음 |
| `src/app/boards/[slug]/loading.tsx` | 게시글 목록 스켈레톤 | 높음 |
| `src/app/livescore/loading.tsx` | 라이브스코어 스켈레톤 | 중간 |
| `src/app/shop/loading.tsx` | 상점 스켈레톤 | 중간 |
| `src/app/settings/loading.tsx` | 설정 스켈레톤 | 낮음 |

### Phase 3: 공통 Skeleton 컴포넌트

```
src/shared/components/
├── Spinner.tsx          ← 기존 (유지)
└── skeletons/
    ├── index.ts
    ├── TextSkeleton.tsx
    ├── CardSkeleton.tsx
    ├── ListSkeleton.tsx
    └── TableSkeleton.tsx
```

---

## 상세 구현

### 1. 전역 loading.tsx

```tsx
// src/app/loading.tsx
import Spinner from '@/shared/components/Spinner';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Spinner size="lg" />
    </div>
  );
}
```

### 2. 게시판 loading.tsx

```tsx
// src/app/boards/loading.tsx
export default function BoardsLoading() {
  return (
    <div className="container mx-auto">
      {/* 헤더 스켈레톤 */}
      <div className="bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-0 rounded-lg mb-4">
        <div className="h-12 bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg" />
        <div className="p-4 space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-4 bg-[#F5F5F5] dark:bg-[#262626] rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 3. 게시글 목록 loading.tsx

```tsx
// src/app/boards/[slug]/loading.tsx
export default function BoardDetailLoading() {
  return (
    <div className="container mx-auto">
      {/* 게시판 헤더 스켈레톤 */}
      <div className="bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-0 rounded-lg mb-4">
        <div className="h-12 bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg animate-pulse" />
      </div>

      {/* 게시글 목록 스켈레톤 */}
      <div className="bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-0 rounded-lg">
        <div className="h-12 bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg" />
        <div className="divide-y divide-black/5 dark:divide-white/10">
          {Array(10).fill(0).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              <div className="w-16 h-4 bg-[#F5F5F5] dark:bg-[#262626] rounded animate-pulse" />
              <div className="flex-1 h-4 bg-[#F5F5F5] dark:bg-[#262626] rounded animate-pulse" />
              <div className="w-20 h-4 bg-[#F5F5F5] dark:bg-[#262626] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 4. 라이브스코어 loading.tsx

```tsx
// src/app/livescore/loading.tsx
import Spinner from '@/shared/components/Spinner';

export default function LivescoreLoading() {
  return (
    <div className="container mx-auto">
      {/* 날짜 네비게이션 스켈레톤 */}
      <div className="bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-0 rounded-lg mb-4">
        <div className="h-14 flex items-center justify-center gap-4 px-4">
          {Array(7).fill(0).map((_, i) => (
            <div key={i} className="w-12 h-8 bg-[#F5F5F5] dark:bg-[#262626] rounded animate-pulse" />
          ))}
        </div>
      </div>

      {/* 경기 목록 스켈레톤 */}
      <div className="bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-0 rounded-lg">
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </div>
    </div>
  );
}
```

---

## 공통 Skeleton 컴포넌트

### 기본 스타일 상수 (추가)

```tsx
// src/shared/styles/skeleton.ts
export const skeletonBase = 'bg-[#F5F5F5] dark:bg-[#262626] rounded animate-pulse';
export const skeletonText = 'h-4 bg-[#F5F5F5] dark:bg-[#262626] rounded animate-pulse';
export const skeletonTitle = 'h-6 bg-[#F5F5F5] dark:bg-[#262626] rounded animate-pulse';
export const skeletonAvatar = 'rounded-full bg-[#F5F5F5] dark:bg-[#262626] animate-pulse';
export const skeletonCard = 'bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-0 rounded-lg';
```

### Skeleton 컴포넌트

```tsx
// src/shared/components/skeletons/index.tsx
import { skeletonBase, skeletonText, skeletonAvatar } from '@/shared/styles/skeleton';

// 텍스트 스켈레톤
export function TextSkeleton({ width = 'w-full', className = '' }: { width?: string; className?: string }) {
  return <div className={`h-4 ${skeletonBase} ${width} ${className}`} />;
}

// 여러 줄 텍스트 스켈레톤
export function TextBlockSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array(lines).fill(0).map((_, i) => (
        <TextSkeleton key={i} width={i === lines - 1 ? 'w-2/3' : 'w-full'} />
      ))}
    </div>
  );
}

// 아바타 스켈레톤
export function AvatarSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' };
  return <div className={`${skeletonAvatar} ${sizeClasses[size]}`} />;
}

// 카드 스켈레톤
export function CardSkeleton({ hasHeader = true }: { hasHeader?: boolean }) {
  return (
    <div className="bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-0 rounded-lg overflow-hidden">
      {hasHeader && (
        <div className="h-12 bg-[#F5F5F5] dark:bg-[#262626]" />
      )}
      <div className="p-4">
        <TextBlockSkeleton lines={3} />
      </div>
    </div>
  );
}

// 리스트 아이템 스켈레톤
export function ListItemSkeleton() {
  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <TextSkeleton width="w-16" />
      <TextSkeleton width="flex-1" />
      <TextSkeleton width="w-20" />
    </div>
  );
}

// 리스트 스켈레톤
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-black/5 dark:divide-white/10">
      {Array(count).fill(0).map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  );
}
```

---

## 기존 코드 정리

### 수정 필요한 파일

| 파일 | 문제 | 조치 |
|------|------|------|
| `livescoremodal/LoadingSkeleton.tsx` | Spinner import 누락 | import 추가 |
| 인라인 skeleton 38개 파일 | 비일관 | 점진적 마이그레이션 |

### LoadingSkeleton.tsx 수정

```tsx
// src/domains/layout/components/livescoremodal/LoadingSkeleton.tsx
import Spinner from '@/shared/components/Spinner';  // ← 추가

export default function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center h-32">
      <div className="flex items-center gap-2 text-gray-600">
        <Spinner size="sm" />
        <span className="text-sm">경기 정보 로딩중...</span>
      </div>
    </div>
  );
}
```

---

## 작업 순서

### 1단계: 즉시 (1-2시간) ✅ 완료
- [x] `src/app/loading.tsx` 생성 (전역)
- [x] `LoadingSkeleton.tsx` Spinner import 수정
- [x] 스타일 상수 `skeleton.ts` 추가

### 2단계: 주요 라우트 ✅ 완료
- [x] `src/app/boards/loading.tsx` 생성
- [x] `src/app/boards/[slug]/loading.tsx` 생성
- [x] `src/app/livescore/loading.tsx` 생성
- [x] `src/app/shop/loading.tsx` 생성
- [x] `src/app/settings/loading.tsx` 생성

### 3단계: 공통 컴포넌트 ✅ 완료
- [x] 공통 Skeleton 컴포넌트 생성 (`@/shared/components/skeletons`)
- [ ] 인라인 skeleton 마이그레이션 (우선순위 높은 파일) - 점진적 진행

### 4단계: 장기 (필요 시)
- [ ] 추가 라우트에 loading.tsx 추가
- [ ] 인라인 skeleton 전체 마이그레이션

---

## 예상 효과

| 항목 | Before | After |
|------|--------|-------|
| 페이지 전환 UX | 빈 화면 | 스켈레톤 표시 |
| 코드 중복 | 38개 파일 인라인 | 공통 컴포넌트 |
| 유지보수 | 파일마다 다름 | 일관된 패턴 |
| Streaming | 미활용 | 자동 적용 |

---

## 참고

- [Next.js Loading UI](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)
- [React Suspense](https://react.dev/reference/react/Suspense)
- [UI_GUIDELINES.md - Skeleton 섹션](../UI_GUIDELINES.md#44-skeleton)

---

---

## 생성된 파일 목록

### loading.tsx 파일
| 파일 | 용도 |
|------|------|
| `src/app/loading.tsx` | 전역 폴백 (Spinner) |
| `src/app/boards/loading.tsx` | 게시판 목록 스켈레톤 |
| `src/app/boards/[slug]/loading.tsx` | 게시글 목록 스켈레톤 |
| `src/app/livescore/loading.tsx` | 라이브스코어 스켈레톤 |
| `src/app/shop/loading.tsx` | 상점 스켈레톤 |
| `src/app/settings/loading.tsx` | 설정 스켈레톤 |

### 스타일/컴포넌트
| 파일 | 용도 |
|------|------|
| `src/shared/styles/skeleton.ts` | 스켈레톤 스타일 상수 |
| `src/shared/components/skeletons/index.tsx` | 공통 Skeleton 컴포넌트 |

### 수정된 파일
| 파일 | 변경 내용 |
|------|----------|
| `src/shared/styles/index.ts` | skeleton export 추가 |
| `src/domains/layout/components/livescoremodal/LoadingSkeleton.tsx` | Spinner import 추가 |

---

*작성일: 2026-01-19*
*완료일: 2026-01-19*
