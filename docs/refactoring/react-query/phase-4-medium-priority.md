# Phase 4: Medium Priority

> 상태: ✅ 완료

---

## 개요

중간 우선순위 컴포넌트들의 React Query 마이그레이션입니다.

---

## 마이그레이션 완료 (5개)

| 파일 | 현재 패턴 | 마이그레이션 유형 | 상태 |
|------|----------|-----------------|------|
| **`EntityPickerForm.tsx`** | `useEffect` + `fetchLeagueTeams()` → `fetchTeamSquad()` | **의존 쿼리** (league → teams → players) | ✅ 완료 |
| **`MatchResultForm.tsx`** | `useEffect` + `getMatchesByDate()` | 날짜별 쿼리 | ✅ 완료 |
| **`NotificationBell.tsx`** | `useState` + `useEffect` + realtime 구독 | 쿼리 + Realtime | ✅ 완료 |
| **`NotificationsPage.tsx`** | `useState` + `useEffect` + `getNotifications()` | 단순 쿼리 | ✅ 완료 |
| **`ProfileForm.tsx`** | `useEffect` + `getNicknameTicketCount()` | 단순 쿼리 | ✅ 완료 |

---

## 마이그레이션 불필요 (분석 결과 확정)

### Settings 컴포넌트

| 파일 | 이유 |
|------|------|
| `MyPostsContent.tsx` | Props 기반 (서버에서 데이터 전달) |
| `MyCommentsContent.tsx` | Props 기반 |
| `PointHistory.tsx` | Props 기반 |
| `ExpHistory.tsx` | Props 기반 |
| `IconForm.tsx` | Props 기반 + 서버액션 mutation만 |

### Shop 컴포넌트

| 파일 | 이유 |
|------|------|
| `shop/page.tsx` | 서버 컴포넌트 |
| `ItemGrid.tsx` | Props 기반 |
| `PurchaseModal.tsx` | Props 기반 |
| `useShopItems.ts` | UI 상태 + mutation만 (데이터 페칭 없음) |

### Notifications 컴포넌트

| 파일 | 이유 |
|------|------|
| `NotificationDropdown.tsx` | Props 기반 |

### Form 컴포넌트

| 파일 | 이유 |
|------|------|
| `ImageUploadForm.tsx` | UI 상태만 (폼 리셋, 클릭 외부 감지) |
| `LinkForm.tsx` | UI 상태만 |
| `SocialEmbedForm.tsx` | 로컬 URL 검증 (detectPlatform) |
| `VideoForm.tsx` | Supabase 업로드 (mutation) |
| `YoutubeForm.tsx` | 로컬 URL 검증 |
| `BoardSelector.tsx` | Props 기반 (boards 전달받음) |

### Post 컴포넌트

| 파일 | 이유 |
|------|------|
| `PostEditForm.tsx` | 에디터 확장 동적 import (로컬), 서버액션 mutation |
| `CommentSection.tsx` | **이미 React Query 사용 중!** (`useComments` 훅) |

---

## 생성된 훅 파일 ✅

```
src/domains/notifications/hooks/useNotificationQueries.ts  ✅
src/domains/settings/hooks/useProfileQueries.ts            ✅
src/domains/boards/hooks/useEntityQueries.ts               ✅
src/domains/boards/hooks/useMatchFormQueries.ts            ✅
```

---

## 체크리스트 ✅

### EntityPickerForm.tsx → useEntityQueries (의존 쿼리)

- [x] `useLeagueTeams(leagueId)` - 리그 선택 시 팀 목록
- [x] `useTeamPlayers(teamId)` - 팀 선택 시 선수 목록
- [x] `enabled` 옵션으로 의존성 체이닝

```typescript
// 의존 쿼리 패턴
const { data: teams } = useQuery({
  queryKey: ['league', leagueId, 'teams'],
  queryFn: () => fetchLeagueTeams(leagueId),
  enabled: !!leagueId, // leagueId가 있을 때만 실행
});

const { data: players } = useQuery({
  queryKey: ['team', teamId, 'players'],
  queryFn: () => fetchTeamSquad(teamId),
  enabled: !!teamId, // teamId가 있을 때만 실행
});
```

### MatchResultForm.tsx → useMatchFormQueries

- [x] `useMatchesByDate(date)` - 날짜별 경기 목록

### NotificationBell.tsx → useNotificationQueries

- [x] `useNotifications(userId)` - 알림 목록
- [x] Supabase Realtime 구독과 결합 (useNotificationCache로 캐시 업데이트)

### NotificationsPage.tsx → useNotificationQueries

- [x] 동일한 훅 재사용

### ProfileForm.tsx → useProfileQueries

- [x] `useNicknameTicketCount(userId)` - 티켓 카운트

---

## 결과

| 항목 | 마이그레이션 | 불필요 |
|------|------------|--------|
| 컴포넌트 수 | 5개 | 16개 |
| 훅 파일 | 4개 생성 | - |
