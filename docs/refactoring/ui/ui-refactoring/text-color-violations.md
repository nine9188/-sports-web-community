# 텍스트 색상 위반 목록

> 생성일: 2026-01-19
> 가이드라인: `dark:text-white` 단독 사용 금지
> 허용값: `dark:text-[#F0F0F0]`

---

## 요약

| 구분 | 파일 수 | 위반 개수 |
|------|---------|----------|
| 사용자 페이지 | 4 | 12 |
| Admin | 2 | 7 |
| tset (무시) | 3 | 20+ |
| **총계** | **6** | **19+** |

---

## 사용자 페이지 위반 (4개 파일)

### 1. AttendanceCalendar.tsx (2곳)
- **경로**: `src/shared/components/AttendanceCalendar.tsx:216,228`
- **사용 페이지**: 전역 (출석 체크 달력)
- **위반 코드**:
```tsx
// 216번 줄
'text-slate-700 dark:text-white font-medium'

// 228번 줄
'bg-slate-200 dark:bg-[#3F3F3F] text-slate-700 dark:text-white font-medium'
```
- **수정**: `dark:text-white` → `dark:text-[#F0F0F0]`

---

### 2. PostRenderers.tsx (1곳)
- **경로**: `src/domains/boards/components/post/postlist/components/shared/PostRenderers.tsx:120`
- **사용 페이지**: 게시판 목록 (TikTok 아이콘)
- **위반 코드**:
```tsx
<TiktokIcon className="h-3 w-3 text-black dark:text-white flex-shrink-0" />
```
- **수정**: `dark:text-white` → `dark:text-[#F0F0F0]`

---

### 3. Power.tsx (8곳)
- **경로**: `src/domains/livescore/components/football/match/tabs/Power.tsx`
- **위치**: 594, 623, 670, 699, 751, 780, 821, 850번 줄
- **사용 페이지**: `/livescore/football/match/[id]` (파워 랭킹 탭)
- **위반 코드**:
```tsx
<span className="text-gray-900 dark:text-white font-semibold flex-shrink-0 text-base">{playerA.goals}</span>
```
- **수정**: `dark:text-white` → `dark:text-[#F0F0F0]` (8곳 모두)

---

### 4. NoticeBadge.tsx (1곳)
- **경로**: `src/domains/boards/components/notice/NoticeBadge.tsx:17`
- **사용 페이지**: 게시판 공지 뱃지
- **위반 코드**:
```tsx
text: 'text-white dark:text-white',
```
- **수정**: `dark:text-white` → `dark:text-[#F0F0F0]`
- **참고**: 이 경우는 배경이 빨간색이므로 `text-white`가 맞을 수 있음 (확인 필요)

---

## Admin 페이지 (무시 가능)

### notices/page.tsx (1곳)
- **경로**: `src/app/admin/notices/page.tsx:13`

### NoticeManagement.tsx (6곳)
- **경로**: `src/app/admin/notices/NoticeManagement.tsx:229,243,342,357,383`

---

## tset 페이지 (무시)

- `src/app/tset/page.tsx` - 15곳
- `src/app/tset/match/page.tsx` - 9곳
- `src/app/tset/friendly/page.tsx` - 8곳

---

## 수정 가이드

```tsx
// 변환 규칙
dark:text-white → dark:text-[#F0F0F0]

// 예외
// 배경이 진한 색상(빨강, 파랑 등)인 경우 text-white 유지 가능
```

---

## 수정 체크리스트

- [ ] #1 AttendanceCalendar.tsx (2곳)
- [ ] #2 PostRenderers.tsx (1곳)
- [ ] #3 Power.tsx (8곳)
- [ ] #4 NoticeBadge.tsx (1곳) - 확인 필요

---

*마지막 업데이트: 2026-01-19*
