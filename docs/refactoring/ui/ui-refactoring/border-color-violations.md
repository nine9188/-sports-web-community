# 테두리 색상 위반 목록

> 생성일: 2026-01-19

## 표준 패턴

```tsx
// 금지
border-gray-100  border-gray-200  border-gray-300  border-gray-600  border-gray-700  border-gray-800
border-slate-200 border-slate-300
border-zinc-*
dark:border-gray-*

// 권장
border-black/7 dark:border-white/10    // 컨테이너, 카드, 입력 필드
border-black/5 dark:border-white/10    // 구분선
border-black/7 dark:border-0           // 컨테이너 외곽 (다크모드 테두리 없음)

// 탭 활성 상태 (예외)
border-slate-800 dark:border-[#F0F0F0]  // 또는 border-gray-900 dark:border-[#F0F0F0]
```

---

## 수정 현황

- [ ] 사용자용 페이지 (약 35개 파일)
- [ ] Admin 페이지 - 추후 일괄 수정 예정

---

## 사용자용 파일 목록

### 공통 컴포넌트 (shared)

| # | 파일 | 경로 | 위반 내용 |
|---|------|------|-----------|
| 1 | Spinner.tsx | `src/shared/components/` | `border-gray-300 dark:border-gray-600` |
| 2 | AttendanceCalendar.tsx | `src/shared/components/` | `border-gray-300 dark:border-gray-600` |
| 3 | tabs.tsx | `src/shared/components/ui/` | `border-gray-900` (탭 활성 - OK) |

### 페이지 (app)

| # | 파일 | 경로 | 위반 내용 |
|---|------|------|-----------|
| 4 | error.tsx | `src/app/` | `border-gray-300 dark:border-gray-600` |
| 5 | not-found.tsx | `src/app/` | `border-gray-300 dark:border-gray-600` |
| 6 | terms/page.tsx | `src/app/` | `border-gray-200 dark:border-gray-700` |
| 7 | privacy/page.tsx | `src/app/` | `border-gray-200/300 dark:border-gray-600/700` (테이블) |
| 8 | globals.css | `src/app/` | `dark:border-gray-800` |
| 9 | notifications/page.tsx | `src/app/` | `border-slate-800 dark:border-white` → `dark:border-[#F0F0F0]` |

### 인증 페이지 (auth)

| # | 파일 | 경로 | 위반 내용 |
|---|------|------|-----------|
| 10 | signin/page.client.tsx | `src/app/(auth)/signin/` | `border-gray-300` (체크박스) |
| 11 | signup/page.client.tsx | `src/app/(auth)/signup/` | `border-gray-300` (체크박스) |
| 12 | social-signup/page.client.tsx | `src/app/(auth)/social-signup/` | `border-gray-300` |
| 13 | account-recovery/page.client.tsx | `src/app/(auth)/help/` | `border-slate-800 dark:border-white` → `dark:border-[#F0F0F0]` |

### 도메인 - boards

| # | 파일 | 경로 | 위반 내용 |
|---|------|------|-----------|
| 14 | PostEditForm.tsx | `src/domains/boards/components/post/` | 확인 필요 |
| 15 | HotdealFormFields.tsx | `src/domains/boards/components/hotdeal/` | 확인 필요 |
| 16 | EntityPickerForm.tsx | `src/domains/boards/components/entity/` | `border-slate-800 dark:border-white` (탭) |
| 17 | ImageUploadForm.tsx | `src/domains/boards/components/form/` | 확인 필요 |
| 18 | PeriodFilter.tsx | `src/domains/boards/components/common/` | `border-slate-800 dark:border-white` (탭) |
| 19 | tipTapRenderer.ts | `src/domains/boards/.../renderers/` | `border-gray-300` |

### 도메인 - sidebar

| # | 파일 | 경로 | 위반 내용 |
|---|------|------|-----------|
| 20 | Sidebar.tsx | `src/domains/sidebar/components/` | `border-gray-200` |
| 21 | ClientBoardNavigation.tsx | `src/domains/sidebar/components/board/` | `border-gray-200 dark:border-gray-700` |
| 22 | TabsClient.tsx | `src/domains/sidebar/components/` | `border-slate-800 dark:border-white` (탭) |
| 23 | HotdealTabsClient.tsx | `src/domains/sidebar/components/` | `border-slate-800 dark:border-white` (탭) |
| 24 | LeagueStandings.tsx | `src/domains/sidebar/components/league/` | `border-slate-800 dark:border-white` (탭) |

### 도메인 - livescore

| # | 파일 | 경로 | 위반 내용 |
|---|------|------|-----------|
| 25 | HeadersUI.tsx | `src/domains/livescore/components/common/` | `border-gray-200` |
| 26 | Standings.tsx | `src/domains/livescore/.../team/tabs/` | 확인 필요 |
| 27 | TransfersPageContent.tsx | `src/domains/livescore/.../transfers/` | 확인 필요 |
| 28 | LiveScoreModalClient.tsx | `src/domains/layout/components/livescoremodal/` | `border-slate-800 dark:border-white` (탭) |
| 29 | MatchPredictionClient.tsx | `src/domains/livescore/.../match/sidebar/` | `border-slate-800 dark:border-[#F0F0F0]` (OK) |

### 도메인 - chatbot

| # | 파일 | 경로 | 위반 내용 |
|---|------|------|-----------|
| 30 | ChatInput.tsx | `src/domains/chatbot/components/` | `border-gray-400 dark:border-gray-600` |
| 31 | ChatFormRenderer.tsx | `src/domains/chatbot/components/` | `border-gray-300/400 dark:border-gray-600` |
| 32 | ChatConversationList.tsx | `src/domains/chatbot/components/` | `border-gray-700 dark:border-gray-300` |
| 33 | ChatChipButtons.tsx | `src/domains/chatbot/components/` | `border-gray-300 dark:border-gray-600` |

### 도메인 - notifications

| # | 파일 | 경로 | 위반 내용 |
|---|------|------|-----------|
| 34 | NotificationItem.tsx | `src/domains/notifications/components/` | `border-gray-300 dark:border-gray-600` (체크박스) |

### 도메인 - widgets

| # | 파일 | 경로 | 위반 내용 |
|---|------|------|-----------|
| 35 | NewsWidgetClient.tsx | `src/domains/widgets/components/news-widget/` | `border-gray-900` (스피너) |
| 36 | BoardCollectionWidgetClient.tsx | `src/domains/widgets/components/board-collection-widget/` | `border-slate-800 dark:border-white` (탭) |

### 도메인 - user

| # | 파일 | 경로 | 위반 내용 |
|---|------|------|-----------|
| 37 | UserProfileModal.tsx | `src/domains/user/components/` | `border-slate-800 dark:border-white` (탭) |
| 38 | UserActivityTabs.tsx | `src/app/user/[publicId]/` | `border-slate-800 dark:border-white` (탭) |

### 도메인 - settings

| # | 파일 | 경로 | 위반 내용 |
|---|------|------|-----------|
| 39 | IconForm.tsx | `src/domains/settings/components/icons/` | `border-slate-800 dark:border-white` (선택) |

### 도메인 - shop

| # | 파일 | 경로 | 위반 내용 |
|---|------|------|-----------|
| 40 | types/index.ts | `src/domains/shop/types/` | `border-gray-300 dark:border-gray-600` (상수) |

---

## Admin/Test 파일 (추후 수정)

| 파일 | 경로 |
|------|------|
| youtube/page.tsx | `src/app/admin/` |
| users/page.tsx | `src/app/admin/` |
| notifications/page.tsx | `src/app/admin/` |
| reports/page.tsx | `src/app/admin/` |
| prediction/page.tsx | `src/app/admin/` |
| rss/page.tsx | `src/app/admin/` |
| boards/page.tsx | `src/app/admin/` |
| exp/components/ExpManager.tsx | `src/app/admin/` |
| shop/components/ShopItemManagement.tsx | `src/app/admin/` |
| notices/NoticeManagement.tsx | `src/app/admin/` |
| site-management/*.tsx | `src/app/admin/site-management/` |
| banners/components/BannerManagementClient.tsx | `src/app/admin/` |
| tset/*.tsx | `src/app/tset/` (테스트) |
| test/page.tsx | `src/app/test/` (테스트) |
| ui/page.tsx | `src/app/ui/` (쇼케이스) |

---

## 변환 규칙

### 일반 테두리

| Before | After |
|--------|-------|
| `border-gray-100` | `border-black/5 dark:border-white/10` |
| `border-gray-200` | `border-black/7 dark:border-white/10` |
| `border-gray-300` | `border-black/7 dark:border-white/10` |
| `dark:border-gray-600` | `dark:border-white/10` |
| `dark:border-gray-700` | `dark:border-white/10` |
| `dark:border-gray-800` | `dark:border-white/10` 또는 `dark:border-0` |

### 탭 활성 상태 (예외)

| Before | After |
|--------|-------|
| `border-slate-800 dark:border-white` | `border-slate-800 dark:border-[#F0F0F0]` |
| `border-gray-900 dark:border-white` | `border-gray-900 dark:border-[#F0F0F0]` |

### 포커스 테두리

| Before | After |
|--------|-------|
| `focus:border-gray-400` | `focus:border-black/20 dark:focus:border-white/20` |

---

## 특이사항

### 1. 탭 활성 상태 (`border-slate-800`)
- 탭 언더라인에서 `border-slate-800`은 허용
- 단, `dark:border-white` → `dark:border-[#F0F0F0]`으로 변경 필요

### 2. 체크박스/라디오 (`border-gray-300`)
- 네이티브 폼 요소는 Tailwind 제한적
- `border-gray-300 dark:border-white/20` 또는 유지 가능

### 3. 테이블 테두리
- 테이블에서 `border-gray-300` 사용은 가독성 위해 유지 가능
- 또는 `border-black/10 dark:border-white/10`으로 변경

### 4. Spinner 컴포넌트
- `Spinner.tsx`의 `border-gray-300 dark:border-gray-600`은 디자인 의도
- 변경 시 전체 스피너 스타일 검토 필요

---

*마지막 업데이트: 2026-01-19*
