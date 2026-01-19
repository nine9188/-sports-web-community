# 라이트모드 배경색 위반 목록

> 생성일: 2026-01-19

## 표준 패턴

```tsx
// 금지
bg-gray-50   bg-gray-100   bg-gray-200

// 권장
bg-[#F5F5F5]   // 라이트 배경 (gray-50, gray-100 대체)
bg-[#EAEAEA]   // 라이트 강조 (gray-200 대체)
bg-white       // 메인 배경
```

---

## 수정 현황

- [x] 사용자용 페이지 (약 35개 파일)
  - [x] 1. Lineups.tsx ✅ (2곳)
  - [x] 2. Stats.tsx ✅ (6곳)
  - [x] ~~3. MatchStatsChart.tsx~~ - **삭제됨** (미사용 레거시 코드)
  - [x] 4. Comment.tsx ✅ (2곳)
  - [x] 5. PostActions.tsx ✅ (2곳)
  - [x] 6. signup/page.client.tsx ✅ (2곳)
  - [x] 7. AdditionalStats.tsx ✅ (이미 수정됨)
  - [x] 8. HomeAwayStats.tsx ✅ (이미 수정됨)
  - [x] 9. PlayerStats.tsx ✅ (2곳)
  - [x] 10. PlayerTrophies.tsx ✅ (이미 수정됨)
  - [x] 11. button.tsx ✅ (1곳)
  - [x] 12. ChatTypingBubble.tsx ✅ (이미 수정됨)
  - [x] ~~13. ClientBoardList.tsx~~ - **삭제됨** (미사용 레거시)
  - [x] 14. privacy/page.tsx ✅ (1곳)
  - [x] 15. TransfersPageContent.tsx ✅ (1곳)
  - [x] 16. Comment.tsx ✅ (1곳 - 작성자 뱃지)
  - [x] 17. account-recovery/page.client.tsx ✅ (3곳 - readonly 입력, 스켈레톤)
  - [x] 18. BoardSelector.tsx ✅ (2곳 - 비활성 선택자)
  - [x] 19. ServerPostListWrapper.tsx ✅ (1곳 - 스켈레톤 + 다크모드 추가)
  - [x] 20. not-found.tsx ✅ (이미 수정됨)
  - [x] 21. error.tsx ✅ (1곳 - 호버)
  - [x] 22. NotificationBell.tsx ✅ (1곳 - 호버)
  - [x] 23. Standings.tsx (team) ✅ (다크모드 작업 시 수정됨)
  - [x] 24. LeagueStandingsTable.tsx ✅ (다크모드 작업 시 수정됨)
  - [x] 25. PlayerHeader.tsx ✅ (4곳 - 구분선)
  - [x] 26. StatsCards.tsx ✅ (7곳 - 구분선)
  - [x] 27. BasicStatsCards.tsx ✅ (7곳 - 구분선)
  - [x] 28. Standings.tsx (match) ✅ (2곳 - 폴백, 폼)
  - [x] 29. ServerLeagueStandings.tsx ✅ (2곳 - 스켈레톤)
  - [x] 30. LeagueStandings.tsx ✅ (1곳 - 스켈레톤)
  - [x] 31. Sidebar.tsx ✅ (2곳 - 스켈레톤)
  - [x] 32. HeadersUI.tsx ✅ (다수 - 스켈레톤)
  - [x] 33. ClientHoverMenu.tsx ✅ (3곳 - 스켈레톤)
  - [x] 34. Events.tsx ✅ (1곳 - TeamLogo 폴백)
  - [x] 35. signin/page.client.tsx ✅ (이미 수정됨)
- [x] Admin 페이지 - 추후 일괄 수정 예정

---

## 사용자용 파일 목록

### bg-gray-50 위반

| # | 파일 | 경로 | 위반 유형 |
|---|------|------|----------|
| 1 | Lineups.tsx | `src/domains/livescore/components/football/match/tabs/lineups/` | 테이블 헤더, 행 배경 |
| 2 | Stats.tsx | `src/domains/livescore/components/football/match/tabs/` | 테이블 헤더 |
| ~~3~~ | ~~MatchStatsChart.tsx~~ | ~~`src/domains/boards/components/post/`~~ | **삭제됨** (미사용) |
| 4 | Comment.tsx | `src/domains/boards/components/post/` | 답글 배경 |
| 5 | PostActions.tsx | `src/domains/boards/components/post/` | 호버 상태 |
| 6 | signup/page.client.tsx | `src/app/(auth)/signup/` | 폼 배경 |
| 7 | AdditionalStats.tsx | `src/domains/livescore/components/football/team/tabs/stats/components/` | 통계 카드 |
| 8 | HomeAwayStats.tsx | `src/domains/livescore/components/football/team/tabs/stats/components/` | 통계 카드 |
| 9 | PlayerStats.tsx | `src/domains/livescore/components/football/player/tabs/` | 통계 카드 |
| 10 | PlayerTrophies.tsx | `src/domains/livescore/components/football/player/tabs/` | 트로피 카드 |
| 11 | button.tsx | `src/shared/components/ui/` | 버튼 variant |
| 12 | ChatTypingBubble.tsx | `src/domains/chatbot/components/` | 타이핑 버블 |
| ~~13~~ | ~~ClientBoardList.tsx~~ | ~~`src/domains/boards/components/board/`~~ | **삭제됨** (미사용) |
| 14 | privacy/page.tsx | `src/app/` | 섹션 배경 |
| 15 | TransfersPageContent.tsx | `src/domains/livescore/components/football/transfers/` | 테이블 헤더 |

### bg-gray-100 위반

| # | 파일 | 경로 | 위반 유형 |
|---|------|------|----------|
| ~~16~~ | ~~Comment.tsx~~ | ~~`src/domains/boards/components/post/`~~ | ✅ **수정됨** |
| ~~17~~ | ~~account-recovery/page.client.tsx~~ | ~~`src/app/(auth)/help/`~~ | ✅ **수정됨** |
| ~~18~~ | ~~BoardSelector.tsx~~ | ~~`src/domains/boards/components/createnavigation/`~~ | ✅ **수정됨** |
| ~~19~~ | ~~ServerPostListWrapper.tsx~~ | ~~`src/domains/boards/components/common/`~~ | ✅ **수정됨** |
| ~~20~~ | ~~not-found.tsx~~ | ~~`src/app/`~~ | ✅ **이미 수정됨** |
| ~~21~~ | ~~error.tsx~~ | ~~`src/app/`~~ | ✅ **수정됨** |
| ~~22~~ | ~~NotificationBell.tsx~~ | ~~`src/domains/notifications/components/`~~ | ✅ **수정됨** |

### bg-gray-200 위반

| # | 파일 | 경로 | 위반 유형 |
|---|------|------|----------|
| ~~23~~ | ~~Standings.tsx (team)~~ | ~~`src/domains/livescore/components/football/team/tabs/`~~ | ✅ **다크모드 작업 시 수정됨** |
| ~~24~~ | ~~LeagueStandingsTable.tsx~~ | ~~`src/domains/livescore/components/football/leagues/`~~ | ✅ **다크모드 작업 시 수정됨** |
| ~~25~~ | ~~PlayerHeader.tsx~~ | ~~`src/domains/livescore/components/football/player/`~~ | ✅ **수정됨** |
| ~~26~~ | ~~StatsCards.tsx~~ | ~~`src/domains/livescore/components/football/team/tabs/overview/components/`~~ | ✅ **수정됨** |
| ~~27~~ | ~~BasicStatsCards.tsx~~ | ~~`src/domains/livescore/components/football/team/tabs/stats/components/`~~ | ✅ **수정됨** |
| ~~28~~ | ~~Standings.tsx (match)~~ | ~~`src/domains/livescore/components/football/match/tabs/`~~ | ✅ **수정됨** |
| ~~29~~ | ~~ServerLeagueStandings.tsx~~ | ~~`src/domains/sidebar/components/league/`~~ | ✅ **수정됨** |
| ~~30~~ | ~~LeagueStandings.tsx~~ | ~~`src/domains/sidebar/components/league/`~~ | ✅ **수정됨** |
| ~~31~~ | ~~Sidebar.tsx~~ | ~~`src/domains/sidebar/components/`~~ | ✅ **수정됨** |
| ~~32~~ | ~~HeadersUI.tsx~~ | ~~`src/domains/livescore/components/common/`~~ | ✅ **수정됨** |
| ~~33~~ | ~~ClientHoverMenu.tsx~~ | ~~`src/domains/boards/components/common/`~~ | ✅ **수정됨** |
| ~~34~~ | ~~Events.tsx~~ | ~~`src/domains/livescore/components/football/match/tabs/`~~ | ✅ **수정됨** |
| ~~35~~ | ~~signin/page.client.tsx~~ | ~~`src/app/(auth)/signin/`~~ | ✅ **이미 수정됨** |

---

## 무시 (Admin/Test)

| 파일 | 경로 | 이유 |
|------|------|------|
| tset/*.tsx | `src/app/tset/` | 테스트 페이지 |
| test-*.tsx | `src/app/admin/` | Admin 테스트 |
| admin/**/*.tsx | `src/app/admin/` | Admin 페이지 |
| *.md | docs | 문서 파일 |

---

## 변환 규칙

| Before | After | 용도 |
|--------|-------|------|
| `bg-gray-50` | `bg-[#F5F5F5]` | 라이트 배경 |
| `bg-gray-100` | `bg-[#F5F5F5]` | 라이트 배경 |
| `bg-gray-200` | `bg-[#EAEAEA]` | 라이트 강조 |
| `hover:bg-gray-50` | `hover:bg-[#F5F5F5]` | 호버 배경 |
| `hover:bg-gray-100` | `hover:bg-[#EAEAEA]` | 호버 강조 |

---

## 주의사항

1. **이미 수정된 파일 확인**: 다크모드 작업 시 일부 파일은 이미 수정되었을 수 있음
2. **다크모드 페어링**: 라이트모드 수정 시 `dark:` 접두사가 있는지 확인
3. **일관성 유지**: 같은 컴포넌트 내에서 일관된 색상 사용

---

*마지막 업데이트: 2026-01-19*
