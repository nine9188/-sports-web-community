# UI 가이드라인 위반 분석

## 1. 개요

`docs/UI_GUIDELINES.md` 기준으로 코드베이스 전체를 검색하여 위반 사항을 분석한 문서입니다.

**분석일:** 2026-01-19 (업데이트)
**검색 범위:** `src/**/*.tsx` (774개 파일)
**제외 대상:** `/ui`, `/test`, `/admin` 페이지

---

## 2. 수정 완료 현황

### 2.1 완료된 수정 (2026-01-19)

| 위반 유형 | 수정된 파일 수 | 상태 |
|----------|---------------|------|
| `bg-slate-*` | 15+ | ✅ 완료 |
| `dark:bg-gray-[789]` | 2 | ✅ 완료 |
| `bg-gray-800/900` | 4 | ✅ 완료 |
| `text-slate-*` | 5 | ✅ 완료 |
| `focus:ring-slate-*` | 4 | ✅ 완료 |

### 2.2 수정된 파일 목록

**globals.css:**
- `dark:bg-slate-900` → `dark:bg-[#1D1D1D]`
- `dark:bg-slate-950` → `dark:bg-[#1A1A1A]`

**notifications/page.tsx:**
- `bg-slate-800` → `bg-[#262626]`

**Sidebar.tsx, ServerLeagueStandings.tsx:**
- `bg-slate-800` → `bg-[#262626]`

**IconForm.tsx:**
- `bg-slate-800` → `bg-[#262626]`
- `text-slate-800` → `text-[#262626]`

**VideoForm.tsx, ExpForm.tsx:**
- `bg-slate-800` → `bg-[#262626]`

**ClientUserProfile.tsx:**
- `bg-slate-800` → `bg-[#262626]`

**BackButton.tsx:**
- `text-slate-600` → `text-gray-600`
- 다크모드 지원 추가

**signin/page.client.tsx:**
- `text-slate-600` → `text-gray-600`
- `focus:ring-slate-500` → `focus:ring-gray-500`

**signup/page.client.tsx:**
- `bg-slate-100` → `bg-[#F5F5F5]`
- `text-slate-600` → `text-gray-600`
- `focus:ring-slate-500` → `focus:ring-gray-500`

**account-recovery/page.client.tsx:**
- `text-slate-500` → `text-gray-500`
- `text-slate-600 hover:text-slate-800` → `text-gray-600 hover:text-gray-800` + 다크모드

**social-signup/page.client.tsx:**
- `focus:ring-slate-500` → `focus:ring-gray-500`

**MatchPredictionClient.tsx:**
- `bg-gray-800` → `bg-[#262626]`

**NoticeAdminSection.tsx:**
- `dark:bg-gray-700` → `dark:bg-[#333333]`

**ChatFloatingButton.tsx:**
- `bg-slate-400 dark:bg-slate-500` → `bg-gray-400 dark:bg-gray-500` (ping 애니메이션)

---

## 3. 남은 위반 사항 (제외 대상)

### 3.1 /admin 페이지 (제외)

관리자 전용 페이지로 수정 대상에서 제외:
- `app/admin/notices/NoticeManagement.tsx`
- `app/admin/test-*/*.tsx`
- `app/admin/youtube/page.tsx`
- `app/admin/banners/init/page.tsx`
- 기타 admin 페이지들

### 3.2 /ui 페이지 (제외)

UI 테스트 페이지로 수정 대상에서 제외:
- `app/ui/page.tsx`

### 3.3 /test 페이지 (제외)

테스트 페이지로 수정 대상에서 제외:
- `app/test/page.tsx`

### 3.4 의미적 색상 (유지)

의도적으로 유지하는 색상:
- **PostActions.tsx**: `hover:bg-blue-*` - 좋아요 버튼 (파란색 = 긍정)
- **Standings.tsx**: `hover:bg-blue-*` - 홈팀 강조 (파란색 = 홈)
- **predictionChartRenderer.ts**: `dark:bg-gray-700` - 스켈레톤 로딩 (회색 플레이스홀더)

### 3.5 오버레이 패턴 (유지)

표준 오버레이 패턴으로 유지:
- `bg-black bg-opacity-50` - 모달/바텀시트 배경

---

## 4. 색상 패턴 정리

### 4.1 Primary 버튼/요소

```css
/* Light */
bg-[#262626]
hover:bg-[#3F3F3F]

/* Dark */
dark:bg-[#3F3F3F]
dark:hover:bg-[#4A4A4A]
```

### 4.2 배경 색상

```css
/* Primary Background */
bg-white dark:bg-[#1D1D1D]

/* Secondary Background */
bg-[#F5F5F5] dark:bg-[#262626]

/* Tertiary Background */
bg-[#EAEAEA] dark:bg-[#333333]
```

### 4.3 테두리 색상

```css
/* Primary Border */
border-black/7 dark:border-white/10

/* Active Border */
border-[#262626] dark:border-[#F0F0F0]
```

### 4.4 텍스트 색상

```css
/* Primary Text */
text-gray-900 dark:text-[#F0F0F0]

/* Secondary Text */
text-gray-700 dark:text-gray-300

/* Tertiary Text */
text-gray-500 dark:text-gray-400
```

### 4.5 진행 바 / 체크마크

```css
/* Progress Bar Fill */
bg-[#262626] dark:bg-[#F0F0F0]

/* Progress Bar Track */
bg-[#EAEAEA] dark:bg-[#333333]
/* 또는 */
bg-[#F5F5F5] dark:bg-[#262626]
```

---

## 5. 검증 명령어

위반 검색용 grep 명령 (제외 대상 필터링):

```bash
# slate-* 검색 (admin, test, ui 제외)
grep -r "bg-slate-\|text-slate-\|border-slate-" src --include="*.tsx" | grep -v "/admin/" | grep -v "/test/" | grep -v "/ui/"

# dark:bg-gray-[789] 검색
grep -r "dark:bg-gray-[789]" src --include="*.tsx" | grep -v "/admin/" | grep -v "/test/" | grep -v "/ui/"

# bg-gray-800/900 검색
grep -r "bg-gray-800\|bg-gray-900" src --include="*.tsx" | grep -v "/admin/" | grep -v "/test/" | grep -v "/ui/"
```

---

## 6. 결론

### 6.1 수정 완료

- `/ui`, `/test`, `/admin` 제외한 모든 파일에서 UI 위반 수정 완료
- slate-* 색상 → HEX 또는 gray-* 로 변환
- 일관된 HEX 색상 시스템 적용

### 6.2 유지 항목

- 의미적 색상 (좋아요=파란색, 홈팀=파란색)
- 오버레이 패턴 (`bg-black bg-opacity-50`)
- 스켈레톤 로딩 색상

### 6.3 제외 항목

- `/admin/*` - 관리자 전용
- `/test/*` - 테스트 페이지
- `/ui/*` - UI 테스트 페이지

---

*작성일: 2026-01-19*
*마지막 업데이트: 2026-01-19*
*기준: docs/UI_GUIDELINES.md*
