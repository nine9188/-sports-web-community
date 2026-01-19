# 다크모드 배경색 위반 목록

> 생성일: 2026-01-18

## 표준 패턴

```tsx
// ❌ 금지
dark:bg-gray-900  dark:bg-gray-800  dark:bg-gray-700  dark:bg-zinc-900

// ✅ 권장
dark:bg-[#1D1D1D]   // 메인 배경 (가장 어두움)
dark:bg-[#262626]   // 카드/섹션 배경
dark:bg-[#333333]   // 호버/강조 배경
dark:bg-[#3F3F3F]   // 버튼 배경
```

---

## 수정 현황

- [x] 사용자용 페이지 (16개 파일) ✅ 완료
  - [x] 1. signin/page.client.tsx ✅
  - [x] 2. UnifiedSportsImage.tsx ✅
  - [x] 3. PredictionChart.tsx ✅ (4곳)
  - [x] 4. SuspensionPopup.tsx ✅ (2곳)
  - [x] 5. ChatFloatingButton.tsx ✅ (툴팁)
  - [x] 6. AttendanceCalendar.tsx ✅
  - [x] 7. LiveScoreView.tsx ✅ (8곳)
  - [x] 8. LeagueStandingsTable.tsx ✅
  - [x] 9. Standings.tsx (team tabs) ✅
  - [x] 10. Squad.tsx ✅
  - [x] 11. FormationStats.tsx ✅
  - [x] 12. FormDisplay.tsx ✅
  - [x] 13. MatchStatsChart.tsx ✅
  - [x] 14. Stats.tsx ✅
  - [x] 15. Lineups.tsx ✅ (12곳 + 감독 4곳)
  - [x] 16. PlayerImage.tsx ✅
- [ ] Admin 페이지 - 추후 일괄 수정 예정

---

## 사용자용 파일 상세

### 1. signin/page.client.tsx ✅ 완료
- **경로**: `src/app/(auth)/signin/page.client.tsx`
- **위반 유형**: 스켈레톤 로딩
- **라인**: 378-384

```tsx
// Before (스켈레톤 배경)
<div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-8"></div>
<div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>

// After
<div className="h-8 bg-[#EAEAEA] dark:bg-[#333333] rounded w-48 mb-2"></div>
<div className="h-4 bg-[#EAEAEA] dark:bg-[#333333] rounded w-full mb-2"></div>
...
```

---

### 2. UnifiedSportsImage.tsx ✅ 완료
- **경로**: `src/shared/components/UnifiedSportsImage.tsx`
- **위반 유형**: 이미지 로딩 실패 시 fallback 배경
- **라인**: 154

```tsx
// Before
className={`${containerClasses} flex items-center justify-center bg-gray-100 dark:bg-gray-800`}

// After (테두리 추가)
className={`${containerClasses} flex items-center justify-center bg-[#F5F5F5] dark:bg-[#262626] border border-black/7 dark:border-white/10`}
```

---

### 3. PredictionChart.tsx ✅ 완료
- **경로**: `src/domains/prediction/components/PredictionChart.tsx`
- **위반 유형**: 버튼, 태그, 툴팁
- **라인**: 151, 465, 611, 677

```tsx
// Before (라인 151 - 버튼 비활성화)
return 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400';

// After
return 'bg-[#F5F5F5] dark:bg-[#333333] text-gray-500 dark:text-gray-400';

// Before (라인 465 - 태그)
className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded ..."

// After
className="text-[10px] px-1.5 py-0.5 bg-[#F5F5F5] dark:bg-[#262626] rounded ..."

// Before (라인 611 - 툴팁)
<div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded ...">

// After
<div className="bg-white dark:bg-[#262626] border border-black/7 dark:border-white/10 rounded ...">

// Before (라인 677 - 스코어 배지)
className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-bold ..."

// After
className="px-2 py-0.5 bg-[#F5F5F5] dark:bg-[#262626] rounded font-bold ..."
```

---

### 4. SuspensionPopup.tsx ✅ 완료
- **경로**: `src/shared/components/SuspensionPopup.tsx`
- **위반 유형**: 정보 박스, 버튼
- **라인**: 147, 173

```tsx
// Before (라인 147 - 정보 박스)
<div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">

// After
<div className="p-3 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg">

// Before (라인 173 - 취소 버튼)
className="... bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 ..."

// After
className="... bg-[#F5F5F5] dark:bg-[#262626] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] ..."
```

---

### 5. ChatFloatingButton.tsx
- **경로**: `src/domains/chatbot/components/ChatFloatingButton.tsx`
- **위반 유형**: 툴팁
- **라인**: 56

```tsx
// Before
<div className="... px-3 py-1 bg-gray-800 dark:bg-gray-700 text-white ...">

// After
<div className="... px-3 py-1 bg-slate-800 dark:bg-[#333333] text-white ...">
```

---

### 6. AttendanceCalendar.tsx ✅ 완료
- **경로**: `src/shared/components/AttendanceCalendar.tsx`
- **위반 유형**: 프로그레스바 배경
- **라인**: 491

```tsx
// Before
<div className="mt-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">

// After
<div className="mt-1 h-1 bg-[#EAEAEA] dark:bg-[#333333] rounded-full overflow-hidden">
```

---

### 7. LiveScoreView.tsx ✅ 완료
- **경로**: `src/domains/livescore/components/football/MainView/LiveScoreView.tsx`
- **위반 유형**: 스켈레톤 로딩
- **라인**: 259, 260, 268, 273, 274, 279, 284, 285

```tsx
// Before (스켈레톤 - 다수)
<div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
<div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
...

// After
<div className="w-5 h-5 bg-[#EAEAEA] dark:bg-[#333333] rounded animate-pulse"></div>
<div className="h-4 w-32 bg-[#EAEAEA] dark:bg-[#333333] rounded animate-pulse"></div>
...
```

---

### 8. LeagueStandingsTable.tsx ✅ 완료
- **경로**: `src/domains/livescore/components/football/leagues/LeagueStandingsTable.tsx`
- **위반 유형**: 배지 (기본 색상)
- **라인**: 108

```tsx
// Before
default: return 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300';

// After
default: return 'bg-[#EAEAEA] dark:bg-[#333333] text-gray-700 dark:text-gray-300';
```

---

### 9. Standings.tsx (team tabs) ✅ 완료
- **경로**: `src/domains/livescore/components/football/team/tabs/Standings.tsx`
- **위반 유형**: 배지 (기본 색상)
- **라인**: 61

```tsx
// Before
default: return 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300';

// After
default: return 'bg-[#EAEAEA] dark:bg-[#333333] text-gray-700 dark:text-gray-300';
```

---

### 10. Squad.tsx ✅ 완료
- **경로**: `src/domains/livescore/components/football/team/tabs/Squad.tsx`
- **위반 유형**: 선수 이미지 fallback
- **라인**: 181

```tsx
// Before
<div className="w-8 h-8 md:w-10 md:h-10 bg-gray-100 dark:bg-gray-700 rounded-full ...">

// After
<div className="w-8 h-8 md:w-10 md:h-10 bg-[#F5F5F5] dark:bg-[#333333] rounded-full ...">
```

---

### 11. FormationStats.tsx ✅ 완료
- **경로**: `src/domains/livescore/components/football/team/tabs/stats/components/FormationStats.tsx`
- **위반 유형**: 프로그레스바 배경
- **라인**: 40

```tsx
// Before
<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">

// After
<div className="w-full bg-[#EAEAEA] dark:bg-[#333333] rounded-full h-2">
```

---

### 12. FormDisplay.tsx ✅ 완료
- **경로**: `src/domains/livescore/components/football/team/tabs/overview/components/FormDisplay.tsx`
- **위반 유형**: 무승부 배경색
- **라인**: 37

```tsx
// Before
bgColor = 'bg-gray-200 dark:bg-gray-700';

// After
bgColor = 'bg-[#EAEAEA] dark:bg-[#333333]';
```

---

### 13. MatchStatsChart.tsx ✅ 완료
- **경로**: `src/domains/boards/components/post/MatchStatsChart.tsx`
- **위반 유형**: 배지 (기본 색상)
- **라인**: 45

```tsx
// Before
default: return 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300';

// After
default: return 'bg-[#EAEAEA] dark:bg-[#333333] text-gray-700 dark:text-gray-300';
```

---

### 14. Stats.tsx ✅ 완료
- **경로**: `src/domains/livescore/components/football/match/tabs/Stats.tsx`
- **위반 유형**: 프로그레스바 배경
- **라인**: 112

```tsx
// Before
<div className="w-full bg-gray-200 dark:bg-gray-700 relative" style={{ height: '4px' }}>

// After
<div className="w-full bg-[#EAEAEA] dark:bg-[#333333] relative" style={{ height: '4px' }}>
```

---

### 15. Lineups.tsx ✅ 완료
- **경로**: `src/domains/livescore/components/football/match/tabs/lineups/Lineups.tsx`
- **위반 유형**: 선수 번호 배경, 이미지 fallback, 감독 fallback
- **라인**: 12곳 (선수) + 4곳 (감독) + PlayerImage className

```tsx
// Before (선수 번호 배경 - 다수)
<div className="w-10 h-10 ... bg-gray-100 dark:bg-gray-800 rounded-full border-2 border-gray-200 dark:border-gray-700">

// After (UnifiedSportsImage 패턴 통일)
<div className="w-10 h-10 ... bg-[#F5F5F5] dark:bg-[#262626] rounded-full border border-black/7 dark:border-white/10">
```

---

### 16. PlayerImage.tsx ✅ 완료
- **경로**: `src/domains/livescore/components/football/match/tabs/lineups/components/PlayerImage.tsx`
- **위반 유형**: 이미지 fallback
- **라인**: 58

```tsx
// Before
<div className={`${width} ${height} bg-gray-200 dark:bg-gray-700 rounded-full ...`}>

// After (UnifiedSportsImage 패턴 통일)
<div className={`${width} ${height} bg-[#F5F5F5] dark:bg-[#262626] border border-black/7 dark:border-white/10 rounded-full ...`}>
```

---

## 무시 (Admin/Test)

| 파일 | 경로 | 이유 |
|------|------|------|
| tset/page.tsx | `src/app/tset/` | 테스트 페이지 |
| tset/match/page.tsx | `src/app/tset/` | 테스트 페이지 |
| tset/friendly/page.tsx | `src/app/tset/` | 테스트 페이지 |
| NoticeManagement.tsx | `src/app/admin/notices/` | Admin |
| NoticeAdminSection.tsx | `src/domains/boards/.../post-edit-form/components/` | Admin 컴포넌트 |
| test-teams/page.tsx | `src/app/admin/` | Admin |
| test-kleague/page.tsx | `src/app/admin/` | Admin |
| test-cron/page.tsx | `src/app/admin/` | Admin |

---

## 변환 규칙 요약

| Before | After | 용도 |
|--------|-------|------|
| `dark:bg-gray-900` | `dark:bg-[#1D1D1D]` | 메인 배경 |
| `dark:bg-gray-800` | `dark:bg-[#262626]` | 카드/섹션 |
| `dark:bg-gray-700` | `dark:bg-[#333333]` | 호버/강조 |
| `bg-gray-100` | `bg-[#F5F5F5]` | 라이트 배경 |
| `bg-gray-200` | `bg-[#EAEAEA]` | 라이트 강조 |

---

*마지막 업데이트: 2026-01-19*
