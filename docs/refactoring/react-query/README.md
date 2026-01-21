# React Query 마이그레이션 가이드

> 작성일: 2025-01-21
> 최종 업데이트: 2026-01-22
> 상태: ✅ 완료 (Phase 1~5 모두 완료)

## 개요

이 문서는 프로젝트에서 React Query로 리팩토링할 수 있는 모든 패턴을 분석하고, 중복 코드 제거 및 공통화 계획을 정리합니다.

**분석 범위:**
- ✅ 선수(Player), 팀(Team), 매치(Match), 리그(League), 이적(Transfers)
- ✅ 보드 상세, 포스트리스트 헤더
- ✅ 세팅(Settings), 챗봇(Chatbot), 공지사항(Notices)
- ✅ 샵(Shop), 전체글(All), 인기글(Popular), 핫딜(Hotdeal)
- ✅ 로그인/회원가입, Admin 전체

---

## Phase 문서 목록

| Phase | 문서 | 상태 | 설명 |
|-------|------|------|------|
| 1 | [Phase 1: Context → React Query](./phase-1-context-migration.md) | ✅ 완료 | Player, Team, Match Context 마이그레이션 (4,170줄) |
| 2 | [Phase 2: Livescore 폴링 & 캐싱](./phase-2-livescore-polling.md) | ✅ 완료 | LiveScoreView, LeagueStandings 마이그레이션 |
| 3 | [Phase 3: Admin 페이지](./phase-3-admin.md) | ✅ 완료 | Admin 9개 훅 + 8개 대형 컴포넌트 리팩토링 |
| 4 | [Phase 4: Medium Priority](./phase-4-medium-priority.md) | ✅ 완료 | EntityPicker, Notifications 등 5개 컴포넌트 |
| 5 | [Phase 5: 공통 컴포넌트](./phase-5-common-components.md) | ✅ 완료 | StateComponents, useClickOutside |

---

## 공통 문서

| 문서 | 설명 |
|------|------|
| [공통 패턴 & Query Keys](./shared-patterns.md) | Query Key 전략, 캐시 정책, 클라이언트 사이드 탭 전환 패턴 |

---

## 진행 요약

### ✅ 완료된 리팩토링

| 파일 | 상태 | 설명 |
|------|------|------|
| `useComments.ts` | ✅ 완료 | useQuery + useMutation으로 댓글 CRUD |
| `CommentSection.tsx` | ✅ 완료 | useComments 훅 사용 |
| `useMatchQueries.ts` | ✅ 완료 | 매치 데이터 React Query 훅 |
| `useTeamQueries.ts` | ✅ 완료 | 팀 데이터 React Query 훅 |
| `useLiveScoreQueries.ts` | ✅ 완료 | 라이브스코어 폴링 훅 |
| `useLeagueQueries.ts` | ✅ 완료 | 리그 순위 훅 |
| `useNotificationQueries.ts` | ✅ 완료 | 알림 훅 |
| `useProfileQueries.ts` | ✅ 완료 | 프로필 훅 |
| `useEntityQueries.ts` | ✅ 완료 | 엔티티 선택 훅 |
| `dateUtils.ts` | ✅ 완료 | 날짜 유틸 통합 |

### 🔵 이미 React Query 적용된 케이스

| 파일 | 설명 |
|------|------|
| `useChatbot.tsx` | 대화 목록, 메시지 조회 및 전송 |
| `useChatMessages.tsx` | 메시지 CRUD + 읽음 상태 |
| `useReadStatus.tsx` | 메시지 읽음 상태 관리 |
| `useChatConversations.tsx` | 대화 목록 관리 |

### ✅ 서버 컴포넌트 (Good Practice - 변경 불필요)

**Livescore 페이지:**
- `player/[id]/page.tsx` - 서버에서 초기 데이터 로드 + 캐싱
- `team/[id]/page.tsx` - 탭에 따른 선택적 서버 로드
- `leagues/[id]/page.tsx` - 서버 액션으로 리그 데이터 로드

**Board 페이지:**
- `boards/[slug]/page.tsx` - 서버 액션으로 게시판 데이터 로드
- `boards/[slug]/[postNumber]/page.tsx` - 서버 액션 (getPostPageData)
- `boards/all/page.tsx` - 서버 컴포넌트 (getAllPopularPosts)

### ⬜ 변경 불필요 - UI/Form 상태만 사용

| 파일 | 이유 |
|------|------|
| `signin/page.client.tsx` | 폼 상태만 관리 (서버 데이터 없음) |
| `signup/page.client.tsx` | 폼 상태만 관리 (서버 데이터 없음) |
| `PostHeader.tsx` | Pure presentational (props만 받음) |
| `BoardDetailLayout.tsx` | 서버에서 props 전달받음, UI 상태만 관리 |

---

## 생성된 훅 파일

### Livescore Domain

```
src/domains/livescore/hooks/
├── useMatchQueries.ts       ✅
├── useTeamQueries.ts        ✅
├── useLiveScoreQueries.ts   ✅
├── useLeagueQueries.ts      ✅
└── index.ts                 ✅
```

### Other Domains

```
src/domains/notifications/hooks/
└── useNotificationQueries.ts ✅

src/domains/settings/hooks/
└── useProfileQueries.ts      ✅

src/domains/boards/hooks/
├── useEntityQueries.ts       ✅
├── useMatchFormQueries.ts    ✅
└── post/useComments.ts       ✅
```

### Admin Domain

```
src/domains/admin/hooks/
├── index.ts              ✅
├── useAdminDashboard.ts  ✅
├── useAdminUsers.ts      ✅
├── useAdminBoards.ts     ✅
├── useAdminNotices.ts    ✅
├── useAdminReports.ts    ✅
├── useAdminPredictions.ts ✅
├── useAdminExp.ts        ✅
├── useAdminLogs.ts       ✅
└── useAdminShop.ts       ✅
```

### Shared

```
src/shared/
├── utils/dateUtils.ts        ✅
├── components/StateComponents.tsx ✅
└── hooks/useClickOutside.ts  ✅
```

---

## Phase 3 최종 결과

### Phase 3 진행률

| 단계 | 상태 | 진행률 |
|------|------|--------|
| Phase 3-1 UI Guidelines | ✅ 완료 | 100% |
| Phase 3-2 React Query | ✅ 완료 | 100% (9/9) |
| Phase 3-3 컴포넌트 분리 | ✅ 완료 | 100% (8/8) |

### Phase 3-3 리팩토링 결과

| 파일 | 원본 | 리팩토링 후 | 감소율 |
|------|------|-----------|--------|
| `prediction/page.tsx` | 1,287줄 | 693줄 | **46%** |
| `SeoSettingsPage.tsx` | 736줄 | 307줄 | **58%** |
| `reports/page.tsx` | 671줄 | 262줄 | **61%** |
| `boards/page.tsx` | 650줄 | 259줄 | **60%** |
| `notifications/page.tsx` | 526줄 | 241줄 | **54%** |
| `ShopItemManagement.tsx` | 509줄 | 254줄 | **50%** |
| `LogViewer.tsx` | 461줄 | 134줄 | **71%** |
| `ExpManager.tsx` | 413줄 | 226줄 | **45%** |

**총 절감: 5,253줄 → 2,076줄 (약 60% 감소)**

---

## 전체 마이그레이션 요약

| Phase | 내용 | 상태 |
|-------|------|------|
| Phase 1 | Context → React Query (4,170줄 → ~500줄) | ✅ 완료 |
| Phase 2 | Livescore 폴링 & 캐싱 | ✅ 완료 |
| Phase 3 | Admin 페이지 (9개 훅 + 8개 컴포넌트 분리) | ✅ 완료 |
| Phase 4 | Medium Priority (5개 컴포넌트) | ✅ 완료 |
| Phase 5 | 공통 컴포넌트 | ✅ 완료 |
