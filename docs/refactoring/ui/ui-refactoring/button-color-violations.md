# 버튼 색상 위반 목록

> 생성일: 2026-01-19

## 표준 패턴

```tsx
// 금지
bg-gray-800        bg-gray-900        bg-black
hover:bg-gray-700  hover:bg-gray-800

// 권장
bg-slate-800 dark:bg-[#3F3F3F]              // 기본 버튼
hover:bg-slate-700 dark:hover:bg-[#4A4A4A]  // 호버 상태

// 모달/카드 배경 (버튼 아님)
dark:bg-[#1D1D1D]  // dark:bg-black 대신
dark:bg-[#262626]  // dark:bg-gray-800 대신
dark:bg-[#333333]  // dark:bg-gray-700 대신
```

---

## 수정 현황

- [x] 사용자용 페이지 (3개 파일) ✅ 완료
  - [x] 1. linkedin.tsx ✅ (border, hover, text 수정)
  - [x] 2. NoticeAdminSection.tsx ✅ (hover 수정)
  - [x] 3. notifications/page.tsx ✅ (뱃지 bg-gray-900 → bg-slate-800)
  - [x] ~~SearchBar.tsx~~ - **삭제됨** (미사용 코드)
  - [x] ~~PlayerStatsModal.tsx~~ - **제외** (의도적 디자인 - 모달 내부 구분용)
- [ ] Admin 페이지 - 추후 일괄 수정 예정

---

## 사용자용 파일 목록

### 수정 완료

| # | 파일 | 경로 | 수정 내용 |
|---|------|------|----------|
| ~~1~~ | ~~linkedin.tsx~~ | ~~`src/shared/components/editor/tiptap/extensions/social-embeds/platforms/`~~ | ✅ border, hover, text 수정 |
| ~~2~~ | ~~NoticeAdminSection.tsx~~ | ~~`src/domains/boards/components/post/post-edit-form/components/`~~ | ✅ hover 수정 |
| ~~3~~ | ~~notifications/page.tsx~~ | ~~`src/app/notifications/`~~ | ✅ 뱃지 bg-gray-900 → bg-slate-800 dark:bg-[#F0F0F0] (다크모드: 흰배경+검은글씨) |

### 제외된 항목

| 파일 | 이유 |
|------|------|
| PlayerStatsModal.tsx | 의도적 디자인 - dark:bg-black으로 모달 내부와 구분 |

---

## Admin/Test 파일 (추후 수정)

### bg-gray-800 사용 (dark mode 배경)

| 파일 | 경로 |
|------|------|
| test-teams/page.tsx | `src/app/admin/` |
| test-kleague/page.tsx | `src/app/admin/` |
| test-cron/page.tsx | `src/app/admin/` |
| NoticeManagement.tsx | `src/app/admin/notices/` |
| page.tsx | `src/app/tset/` |
| match/page.tsx | `src/app/tset/` |
| friendly/page.tsx | `src/app/tset/` |

### bg-gray-900 사용 (코드 블록, 배경)

| 파일 | 경로 |
|------|------|
| youtube/page.tsx | `src/app/admin/` |
| banners/init/page.tsx | `src/app/admin/` |
| test-teams/page.tsx | `src/app/admin/` |
| test-kleague/page.tsx | `src/app/admin/` |
| page.tsx | `src/app/tset/` |
| match/page.tsx | `src/app/tset/` |
| friendly/page.tsx | `src/app/tset/` |

---

## 변환 규칙

### 버튼 배경색

| Before | After | 용도 |
|--------|-------|------|
| `bg-gray-800` | `bg-slate-800 dark:bg-[#3F3F3F]` | 기본 버튼 |
| `bg-gray-900` | `bg-slate-800 dark:bg-[#3F3F3F]` | 기본 버튼 |
| `bg-black` | `bg-slate-800 dark:bg-[#3F3F3F]` | 기본 버튼 |

### 버튼 호버

| Before | After | 용도 |
|--------|-------|------|
| `hover:bg-gray-700` | `hover:bg-slate-700 dark:hover:bg-[#4A4A4A]` | 호버 |
| `hover:bg-gray-800` | `hover:bg-slate-700 dark:hover:bg-[#4A4A4A]` | 호버 |

### 모달/카드 배경 (버튼 아님)

| Before | After | 용도 |
|--------|-------|------|
| `dark:bg-black` | `dark:bg-[#1D1D1D]` | 모달 메인 배경 |
| `dark:bg-gray-800` | `dark:bg-[#262626]` | 카드/섹션 배경 |
| `dark:bg-gray-700` | `dark:bg-[#333333]` | 호버/강조 배경 |

---

## 주의사항

1. **오버레이는 제외**: `bg-black/50`, `bg-black/70` 같은 투명 오버레이는 수정 불필요
2. **이미 수정된 파일 확인**: 대부분의 버튼이 이미 `bg-slate-800` 사용 중 (50개 파일)
3. **다크모드 페어링**: `bg-slate-800`에는 반드시 `dark:bg-[#3F3F3F]` 추가

---

*마지막 업데이트: 2026-01-19*
