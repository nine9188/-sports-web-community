# Blue Hover 위반 목록

> UI 가이드라인에서 `hover:text-blue-*`, `hover:bg-blue-*` 사용 금지
> 대신 `hover:bg-[#EAEAEA] dark:hover:bg-[#333333]` 사용

## ⚠️ 예외 (Blue 사용 허용)

1. **의미있는 버튼**: 추천/비추천, 삭제 등 의미를 전달하는 버튼
   - 추천(좋아요): `bg-blue-500` / `text-blue-500` ✅
   - 비추천(싫어요): `bg-red-500` / `text-red-500` ✅
   - 삭제: `text-red-*` ✅

2. **홈팀/원정팀 구분**: 스포츠 라이브스코어
   - 홈팀: `bg-blue-50 dark:bg-blue-900/30` ✅
   - 원정팀: `bg-red-50 dark:bg-red-900/30` ✅

### 적용된 파일
- `PostActions.tsx` - 게시글 추천/비추천 (bg-blue/red)
- `Comment.tsx` - 댓글 추천/비추천 (text-blue/red)
- `Standings.tsx` - 홈/원정팀 하이라이트

---

## 📦 공통 컴포넌트 사용 필수

### Pagination
- **경로**: `@/shared/components/ui/pagination`
- **사용법**:
```tsx
import { Pagination } from '@/shared/components/ui';

<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
  mode="button"
/>
```
- ❌ 인라인 PaginationButton 정의 금지
- ✅ PlayerFixtures.tsx 리팩토링 완료 (2026-01-18)

## 수정 현황

- [x] 사용자용 페이지 ✅ 전체 완료
  - [x] RecentlyVisited.tsx ✅ 2026-01-18
  - [x] AuthSection.tsx ✅ 2026-01-18
  - [x] PlayerFixtures.tsx ✅ 2026-01-18 (공통 Pagination 사용으로 리팩토링)
  - [x] CommentSection.tsx ✅ 2026-01-18
  - [x] EntityPickerForm.tsx ✅ 2026-01-18
  - ~~PostActions.tsx~~ → 예외 (의미있는 버튼)
  - ~~Standings.tsx~~ → 예외 (홈/원정팀 구분)
  - ~~youtube-widget-client.tsx~~ → 삭제됨 (미사용)
  - ~~BannerCarousel.tsx~~ → 삭제됨 (미사용)
  - ~~live-score-widget-client.tsx~~ → 삭제됨 (V2 사용 중)
- [ ] Admin 페이지 (19개 파일) - 추후 일괄 수정 예정

---

## 1. 사용자용 페이지 (우선 수정)

### ~~1.1 youtube-widget-client.tsx~~ 🗑️ 삭제됨
- 미사용 위젯으로 전체 폴더 삭제됨

### ~~1.2 BannerCarousel.tsx~~ 🗑️ 삭제됨
- 미사용 위젯으로 전체 폴더 삭제됨

### 1.3 RecentlyVisited.tsx ✅ 완료
- **경로**: `src/domains/layout/components/RecentlyVisited.tsx`
- **라인 67, 115**
```tsx
// Before
hover:text-blue-600 dark:hover:text-blue-400

// After (수정됨) - 텍스트 링크 표준 패턴 적용
hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline
```

### ~~1.4 live-score-widget-client.tsx~~ 🗑️ 삭제됨
- V2 버전 사용 중으로 구버전 삭제됨

### 1.5 AuthSection.tsx ✅ 완료
- **경로**: `src/domains/sidebar/components/auth/AuthSection.tsx`
- **라인 24, 26, 28**
```tsx
// Before
dark:hover:text-blue-400

// After (수정됨) - 텍스트 링크 표준 패턴 적용
hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline transition-colors
```

### 1.6 PlayerFixtures.tsx ✅ 완료
- **경로**: `src/domains/livescore/components/football/player/tabs/PlayerFixtures.tsx`
- **라인 34**
```tsx
// Before
"bg-blue-600 text-white hover:bg-blue-700"

// After (수정됨)
"bg-slate-800 dark:bg-[#3F3F3F] text-white hover:bg-slate-700 dark:hover:bg-[#4A4A4A]"
```

### 1.7 Standings.tsx
- **경로**: `src/domains/livescore/components/football/match/tabs/Standings.tsx`
- **라인 379**
```tsx
// Before
bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-800/50

// After (홈팀 하이라이트)
bg-[#F5F5F5] dark:bg-[#262626] hover:bg-[#EAEAEA] dark:hover:bg-[#333333]
```

### 1.8 PostActions.tsx ✅ 완료
- **경로**: `src/domains/boards/components/post/PostActions.tsx`
- **라인 119, 120** (좋아요/싫어요 버튼)
```tsx
// Before
'bg-blue-500 text-white hover:bg-blue-600'
'hover:bg-blue-50 hover:text-blue-500 hover:border-blue-200'

// After (수정됨)
'bg-slate-800 dark:bg-[#3F3F3F] text-white hover:bg-slate-700 dark:hover:bg-[#4A4A4A]'
'hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
```

### 1.9 CommentSection.tsx ✅ 완료
- **경로**: `src/domains/boards/components/post/CommentSection.tsx`
- **라인 328** (답글 취소 버튼)
```tsx
// Before
text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300

// After (수정됨)
text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-[#F0F0F0]
```

### 1.10 EntityPickerForm.tsx ✅ 완료
- **경로**: `src/domains/boards/components/entity/EntityPickerForm.tsx`
- **라인 369** (다시 시도 버튼)
```tsx
// Before
text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300

// After (수정됨)
text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-[#F0F0F0]
```

---

## 2. Admin 페이지

> Admin 페이지는 사용자에게 노출되지 않으므로 우선순위 낮음
> 하지만 일관성을 위해 추후 수정 권장

### 2.1 admin/youtube/page.tsx
- 라인 329, 482, 562, 595

### 2.2 admin/notifications/page.tsx
- 라인 437, 481

### 2.3 admin/widgets/board-collection/page.tsx
- 라인 217

### 2.4 admin/users/page.tsx
- 라인 274

### 2.5 admin/notices/NoticeManagement.tsx
- 라인 348, 383

### 2.6 admin/test-teams/page.tsx
- 라인 142

### 2.7 admin/test-kleague/page.tsx
- 라인 119

### 2.8 admin/test-cron/page.tsx
- 라인 48

### 2.9 admin/boards/page.tsx
- 라인 765, 773, 810

### 2.10 admin/rss/page.tsx
- 라인 583, 664

### 2.11 admin/site-management/branding/page.tsx
- 라인 113, 140, 173

### 2.12 admin/site-management/branding/BrandingSettingsForm.tsx
- 라인 200

### 2.13 admin/reports/page.tsx
- 라인 468

### 2.14 admin/banners/init/page.tsx
- 라인 103

### 2.15 admin/site-management/page.tsx
- 라인 85, 94

### 2.16 admin/site-management/seo-v2/SeoSettingsPage.tsx
- 라인 330, 644, 710

### 2.17 admin/prediction/page.tsx
- 라인 410, 480, 561

### 2.18 admin/banners/components/BannerManagementClient.tsx
- 라인 259, 446, 637, 720, 762

### 2.19 admin/site-management/ui-theme/UIThemeSettingsPage.tsx
- 라인 181

---

## 3. 무시 가능

| 파일 | 이유 |
|------|------|
| `backup/...` | 백업 폴더 |
| `src/app/tset/...` | 테스트 페이지 |
| `src/app/ui/page.tsx` | UI 쇼케이스 (Info 버튼 의도적) |

---

*생성일: 2026-01-18*
