# Container 컴포넌트 사용 현황

> 최종 업데이트: 2026-01-19

## 개요

`src/shared/components/ui/container.tsx` - 섹션 레이아웃을 위한 컨테이너 컴포넌트.

---

## 사용 중 (74곳)

### Livescore 컴포넌트 (34곳)

| 파일 |
|-----|
| `src/domains/livescore/components/football/standings/StandingsPreview.tsx` |
| `src/domains/livescore/components/football/match/tabs/stats/FormationStats.tsx` |
| `src/domains/livescore/components/football/match/tabs/lineups/components/PlayerStatsModal.tsx` |
| `src/domains/livescore/components/football/transfers/TransferFilters.tsx` |
| `src/domains/livescore/components/football/standings/LeagueStandings.tsx` |
| `src/domains/livescore/components/football/match/tabs/events/Events.tsx` |
| `src/domains/livescore/components/football/match/tabs/standings/Standings.tsx` |
| `src/domains/livescore/components/football/match/tabs/stats/Stats.tsx` |
| `src/domains/livescore/components/football/match/tabs/lineups/Lineups.tsx` |
| `src/domains/livescore/components/football/team/tabs/Squad.tsx` |
| `src/domains/livescore/components/football/team/tabs/PlayerStats.tsx` |
| `src/domains/livescore/components/football/player/tabs/PlayerRankings.tsx` |
| `src/domains/livescore/components/football/player/tabs/PlayerFixtures.tsx` |
| `src/domains/livescore/components/football/player/tabs/PlayerOverview.tsx` |
| `src/domains/livescore/components/football/player/tabs/PlayerTrophies.tsx` |
| `src/domains/livescore/components/football/team/tabs/TeamOverview.tsx` |
| `src/domains/livescore/components/football/team/tabs/TeamFixtures.tsx` |
| `src/domains/livescore/components/football/team/tabs/TeamTransfers.tsx` |
| `src/domains/livescore/components/football/match/tabs/h2h/H2H.tsx` |
| `src/domains/livescore/components/football/match/tabs/summary/Summary.tsx` |
| `src/domains/livescore/components/football/league/LeagueOverview.tsx` |
| `src/domains/livescore/components/football/league/LeagueFixtures.tsx` |
| `src/domains/livescore/components/football/league/LeagueStandings.tsx` |
| `src/domains/livescore/components/football/league/LeagueTopScorers.tsx` |
| `src/domains/livescore/components/football/league/LeagueTopAssists.tsx` |
| `src/domains/livescore/components/common/CommonComponents.tsx` |
| `src/domains/livescore/components/football/team/TeamHeader.tsx` |
| `src/domains/livescore/components/football/match/MatchHeader.tsx` |
| `src/domains/livescore/components/football/match/sidebar/MatchSidebar.tsx` |
| `src/domains/livescore/components/football/match/sidebar/SupportCommentsSection.tsx` |
| `src/domains/livescore/components/football/match/sidebar/MatchPredictionClient.tsx` |
| `src/domains/livescore/components/football/team/tabs/overview/components/StatsCards.tsx` |
| `src/domains/livescore/components/football/MainView/NavigationBar/index.tsx` |
| `src/domains/livescore/components/football/MainView/LeagueMatchList/index.tsx` |

### Sidebar 컴포넌트 (4곳)

| 파일 |
|-----|
| `src/domains/sidebar/components/standings/LeagueStandings.tsx` |
| `src/domains/sidebar/components/Sidebar.tsx` |
| `src/domains/sidebar/components/TabsClient.tsx` |
| `src/domains/sidebar/components/HotdealTabsClient.tsx` |

### Boards 컴포넌트 (11곳)

| 파일 |
|-----|
| `src/domains/boards/components/post/PostEditForm.tsx` |
| `src/domains/boards/components/post/ServerPostList.tsx` |
| `src/domains/boards/components/post/CommentSection.tsx` |
| `src/domains/boards/components/post/PopularPostList.tsx` |
| `src/domains/boards/components/post/PostNavigation.tsx` |
| `src/domains/boards/components/notice/NoticeList.tsx` |
| `src/domains/boards/components/common/ServerPostListWrapper.tsx` |
| `src/domains/boards/components/common/PeriodFilter.tsx` |
| `src/domains/boards/components/common/HoverMenu.tsx` |
| `src/domains/boards/components/hotdeal/StoreFilterMenu.tsx` |
| `src/domains/boards/components/layout/PostDetailLayout.tsx` |

### App 페이지 (12곳)

| 파일 |
|-----|
| `src/app/transfers/page.tsx` |
| `src/app/shop/[category]/page.tsx` |
| `src/app/livescore/football/leagues/page.tsx` |
| `src/app/ui/page.tsx` |
| `src/app/settings/profile/page.tsx` |
| `src/app/settings/points/page.tsx` |
| `src/app/settings/password/page.tsx` |
| `src/app/settings/my-posts/page.tsx` |
| `src/app/settings/my-comments/page.tsx` |
| `src/app/settings/icons/page.tsx` |
| `src/app/settings/exp/page.tsx` |
| `src/app/settings/account-delete/page.tsx` |

### Widgets 컴포넌트 (3곳)

| 파일 |
|-----|
| `src/domains/widgets/components/AllPostsWidget.tsx` |
| `src/domains/widgets/components/board-collection-widget/BoardCollectionWidgetClient.tsx` |
| `src/domains/widgets/components/live-score-widget/LiveScoreWidgetV2.tsx` |

### 기타 (2곳)

| 파일 |
|-----|
| `src/domains/search/components/SearchResultsContainer.tsx` |
| `src/domains/settings/components/common/SettingsContainer.tsx` |

---

## 미사용 (커스텀 구현) - 18곳+

### Settings 영역 - ✅ 완료

모든 Settings 영역 마이그레이션 완료 (14곳):
- 컴포넌트 레벨 6곳
- 페이지 레벨 8곳

### Boards 영역 - ✅ 완료

모든 Boards 영역 마이그레이션 완료 (10곳)

### Sidebar 영역 - ✅ 완료

마이그레이션 완료 (2곳):
- `src/domains/sidebar/components/TabsClient.tsx`
- `src/domains/sidebar/components/HotdealTabsClient.tsx`

**제외** (연결된 컨테이너 패턴):
- `src/app/user/[publicId]/page.tsx` - `md:rounded-t-lg md:border-b-0` (상단)
- `src/app/user/[publicId]/UserActivityTabs.tsx` - `md:rounded-b-lg md:border-t-0` (하단)
- 두 컴포넌트가 하나의 시각적 컨테이너를 형성하므로 개별 마이그레이션 불가

### Livescore 영역 - ✅ 완료

마이그레이션 완료 (9개 파일, 16개 컨테이너):
- `src/domains/livescore/components/common/CommonComponents.tsx` (5개 컨테이너)
- `src/domains/livescore/components/football/team/TeamHeader.tsx`
- `src/domains/livescore/components/football/match/MatchHeader.tsx`
- `src/domains/livescore/components/football/match/sidebar/MatchSidebar.tsx` (3개 컨테이너)
- `src/domains/livescore/components/football/match/sidebar/SupportCommentsSection.tsx`
- `src/domains/livescore/components/football/match/sidebar/MatchPredictionClient.tsx`
- `src/domains/livescore/components/football/team/tabs/overview/components/StatsCards.tsx`
- `src/domains/livescore/components/football/MainView/NavigationBar/index.tsx`
- `src/domains/livescore/components/football/MainView/LeagueMatchList/index.tsx` (2개 컨테이너)

### Widgets 영역 - ✅ 완료

마이그레이션 완료 (3곳):
- `src/domains/widgets/components/AllPostsWidget.tsx`
- `src/domains/widgets/components/board-collection-widget/BoardCollectionWidgetClient.tsx`
- `src/domains/widgets/components/live-score-widget/LiveScoreWidgetV2.tsx`

### 기타 (제외)

- `src/app/error.tsx`, `src/app/not-found.tsx` - 에러 페이지 (특수)
- `src/app/ui/page.tsx`, `src/app/test/page.tsx` - 테스트 페이지
- `src/domains/notifications/components/NotificationDropdown.tsx` - 드롭다운 (특수)
- `src/shared/components/Calendar/index.tsx` - 캘린더 (특수)
- Admin 페이지들 - 보류

---

## 커스텀 패턴

```tsx
// 현재 (커스텀)
<div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 overflow-hidden">
  {/* 내용 */}
</div>

// 목표 (Container)
<Container>
  <ContainerContent>
    {/* 내용 */}
  </ContainerContent>
</Container>
```

---

## 사용 예시

```tsx
import {
  Container, ContainerHeader, ContainerTitle, ContainerContent
} from '@/shared/components/ui';

<Container>
  <ContainerHeader>
    <ContainerTitle>섹션 제목</ContainerTitle>
  </ContainerHeader>
  <ContainerContent>
    {/* 내용 */}
  </ContainerContent>
</Container>
```

### 헤더에 액션 버튼 추가

```tsx
<Container>
  <ContainerHeader>
    <ContainerTitle>섹션 제목</ContainerTitle>
    <Button variant="header" size="sm">더보기</Button>
  </ContainerHeader>
  <ContainerContent>
    {/* 내용 */}
  </ContainerContent>
</Container>
```

---

## 마이그레이션 우선순위

1. ~~**높음**: Settings 영역 - ✅ 완료~~
2. ~~**중간**: Boards 영역 - ✅ 완료~~
3. ~~**중간**: Sidebar 영역 - ✅ 완료~~ (2곳 마이그레이션, 2곳 제외)
4. ~~**낮음**: Widgets 영역 - ✅ 완료~~ (3곳)
5. ~~**낮음**: Livescore 영역 - ✅ 완료~~ (9개 파일, 16개 컨테이너)

**모든 영역 마이그레이션 완료!**

---

## 변경 이력

| 날짜 | 변경 내용 |
|-----|----------|
| 2026-01-19 | Livescore 영역 9개 파일 마이그레이션 완료 - **모든 영역 완료!** |
| 2026-01-19 | Widgets 영역 3곳 마이그레이션 완료 |
| 2026-01-19 | Sidebar 영역 2곳 마이그레이션, 2곳 제외 (연결된 컨테이너 패턴) |
| 2026-01-19 | Boards 영역 10곳 마이그레이션 완료 |
| 2026-01-19 | Settings 페이지 레벨 8곳 마이그레이션 완료 (전체 완료) |
| 2026-01-19 | Settings 컴포넌트 6곳 마이그레이션 완료 |
| 2026-01-19 | 미사용 커스텀 구현 40곳+ 발견, 문서 업데이트 |
| 2026-01-19 | 초기 문서 작성 |
