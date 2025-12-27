# Phase 1: 핵심 사용자 흐름 리뷰

> Phase 1 상세 문서
> 마지막 업데이트: 2025-12-24

## 목차
- [1.1 메인 페이지](#11-메인-페이지)
- [1.2 게시판](#12-게시판)
- [1.3 라이브스코어](#13-라이브스코어)
- [1.4 샵](#14-샵)
- [1.5 기타 도메인](#15-기타-도메인)

---

## 1.1 메인 페이지

> **[📝 상세 리뷰 결과 보기](./phase1-1-main-page-review.md)**

### 페이지 파일
| 파일 | 설명 |
|------|------|
| `src/app/page.tsx` | 메인 페이지 |

### 사용 위젯 컴포넌트
| 컴포넌트 | 파일 경로 | 설명 |
|----------|----------|------|
| `BoardQuickLinksWidget` | `src/domains/widgets/components/board-quick-links-widget/BoardQuickLinksWidget.tsx` | 게시판 바로가기 아이콘 |
| `LiveScoreWidgetV2` | `src/domains/widgets/components/live-score-widget/LiveScoreWidgetV2.tsx` | 라이브스코어 위젯 |
| `LiveScoreWidgetV2Server` | `src/domains/widgets/components/live-score-widget/LiveScoreWidgetV2Server.tsx` | 라이브스코어 서버 컴포넌트 |
| `BoardCollectionWidget` | `src/domains/widgets/components/board-collection-widget/BoardCollectionWidget.tsx` | 게시판 모음 위젯 |
| `BoardCollectionWidgetClient` | `src/domains/widgets/components/board-collection-widget/BoardCollectionWidgetClient.tsx` | 게시판 모음 클라이언트 |
| `AllPostsWidget` | `src/domains/widgets/components/AllPostsWidget.tsx` | 전체 게시글 위젯 |
| `NewsWidget` | `src/domains/widgets/components/news-widget.tsx` | 뉴스 위젯 |
| `NewsWidgetClient` | `src/domains/widgets/components/news-widget-client.tsx` | 뉴스 위젯 클라이언트 |

### 기타 위젯 (필요시 사용)
| 컴포넌트 | 파일 경로 | 설명 |
|----------|----------|------|
| `BannerWidget` | `src/domains/widgets/components/banner-widget.tsx` | 배너 위젯 |
| `BannerCarousel` | `src/domains/widgets/components/banner-widget/BannerCarousel.tsx` | 배너 캐러셀 |
| `BannerWrapper` | `src/domains/widgets/components/banner-widget/BannerWrapper.tsx` | 배너 래퍼 |

### 체크리스트
| 항목 | 상태 | 담당 컴포넌트 | 비고 |
|------|------|---------------|------|
| 페이지 로딩 정상 | ✅ | `page.tsx` | 코드상 문제 없음 |
| 게시판 바로가기 표시 | ✅ | `BoardQuickLinksWidget` | 97줄, 우수 |
| 라이브스코어 위젯 표시 | ✅ | `LiveScoreWidgetV2` | 386줄, 양호 |
| 게시판 모음 표시 | ✅ | `BoardCollectionWidget` | 47줄 (리팩토링 완료) |
| 전체 게시글 표시 | ✅ | `AllPostsWidget` | 60줄, 우수 |
| 뉴스 위젯 표시 | ✅ | `NewsWidget` | [리팩토링 완료](./refactoring-news-widget.md) |
| 다크모드 지원 | ✅ | 전체 | dark: 클래스 적용됨 |
| 모바일 반응형 | ✅ | 전체 | md: 브레이크포인트 사용 |

### 발견된 이슈 요약
| 심각도 | 이슈 | 컴포넌트 | 상태 |
|--------|------|----------|------|
| ✅ 해결 | 서버 컴포넌트 너무 김 (269줄), N+1 쿼리 | BoardCollectionWidget | [완료](./refactoring-board-collection-widget.md) |
| ✅ 해결 | 이미지 추출 함수 복잡 (90줄+), 타입 중복 | NewsWidget | [완료](./refactoring-news-widget.md) |
| ✅ 해결 | 인라인 스타일, 하드코딩 링크, 타입 중복 | page.tsx, AllPostsWidget, LiveScoreWidgetV2 | 완료 |

---

## 1.2 게시판

> **[📝 상세 리뷰 결과 보기](./phase1-2-boards-review.md)**

### 페이지 파일
| 파일 | 라우트 | 설명 |
|------|--------|------|
| `src/app/boards/[slug]/page.tsx` | `/boards/[slug]` | 게시판 목록 |
| `src/app/boards/all/page.tsx` | `/boards/all` | 전체 글 보기 |
| `src/app/boards/popular/page.tsx` | `/boards/popular` | 인기글 |
| `src/app/boards/popular/PopularPageClient.tsx` | - | 인기글 클라이언트 |
| `src/app/boards/[slug]/[postNumber]/page.tsx` | `/boards/[slug]/[postNumber]` | 글 상세 |
| `src/app/boards/[slug]/create/page.tsx` | `/boards/[slug]/create` | 글 작성 |
| `src/app/boards/[slug]/[postNumber]/edit/page.tsx` | `/boards/[slug]/[postNumber]/edit` | 글 수정 |

### 서버 액션
| 파일 | 설명 |
|------|------|
| `src/domains/boards/actions/index.ts` | 액션 인덱스 |
| `src/domains/boards/actions/getBoards.ts` | 게시판 목록 조회 |
| `src/domains/boards/actions/getPosts.ts` | 게시글 목록 조회 |
| `src/domains/boards/actions/getPostDetails.ts` | 게시글 상세 조회 |
| `src/domains/boards/actions/getPostForm.ts` | 게시글 폼 데이터 |
| `src/domains/boards/actions/getPopularPosts.ts` | 인기글 조회 |
| `src/domains/boards/actions/getAllPopularPosts.ts` | 전체 인기글 조회 |
| `src/domains/boards/actions/matches.ts` | 경기 관련 |

### 게시판/목록 컴포넌트
| 컴포넌트 | 파일 경로 |
|----------|----------|
| `BoardInfo` | `src/domains/boards/components/board/BoardInfo.tsx` |
| `BoardTeamInfo` | `src/domains/boards/components/board/BoardTeamInfo.tsx` |
| `LeagueInfo` | `src/domains/boards/components/board/LeagueInfo.tsx` |
| `ClientBoardList` | `src/domains/boards/components/board/ClientBoardList.tsx` |
| `ServerBoardList` | `src/domains/boards/components/board/ServerBoardList.tsx` |
| `BoardPopularPosts` | `src/domains/boards/components/board/BoardPopularPosts.tsx` |

### 게시글 목록 컴포넌트
| 컴포넌트 | 파일 경로 |
|----------|----------|
| `PostList` | `src/domains/boards/components/post/PostList.tsx` |
| `PostListMain` | `src/domains/boards/components/post/postlist/PostListMain.tsx` |
| `ServerPostList` | `src/domains/boards/components/post/ServerPostList.tsx` |
| `PopularPostList` | `src/domains/boards/components/post/PopularPostList.tsx` |
| `DesktopPostList` | `src/domains/boards/components/post/postlist/components/desktop/DesktopPostList.tsx` |
| `DesktopPostItem` | `src/domains/boards/components/post/postlist/components/desktop/DesktopPostItem.tsx` |
| `DesktopVirtualizedItem` | `src/domains/boards/components/post/postlist/components/desktop/DesktopVirtualizedItem.tsx` |
| `MobilePostList` | `src/domains/boards/components/post/postlist/components/mobile/MobilePostList.tsx` |
| `MobilePostItem` | `src/domains/boards/components/post/postlist/components/mobile/MobilePostItem.tsx` |
| `MobileVirtualizedItem` | `src/domains/boards/components/post/postlist/components/mobile/MobileVirtualizedItem.tsx` |
| `PostListSkeleton` | `src/domains/boards/components/post/postlist/components/shared/PostListSkeleton.tsx` |
| `PostListEmpty` | `src/domains/boards/components/post/postlist/components/shared/PostListEmpty.tsx` |
| `PostRenderers` | `src/domains/boards/components/post/postlist/components/shared/PostRenderers.tsx` |

### 게시글 상세 컴포넌트
| 컴포넌트 | 파일 경로 |
|----------|----------|
| `PostDetailLayout` | `src/domains/boards/components/layout/PostDetailLayout.tsx` |
| `PostHeader` | `src/domains/boards/components/post/PostHeader.tsx` |
| `PostContent` | `src/domains/boards/components/post/PostContent.tsx` |
| `PostFooter` | `src/domains/boards/components/post/PostFooter.tsx` |
| `PostActions` | `src/domains/boards/components/post/PostActions.tsx` |
| `ServerPostActions` | `src/domains/boards/components/post/ServerPostActions.tsx` |
| `PostNavigation` | `src/domains/boards/components/post/PostNavigation.tsx` |

### 댓글 컴포넌트
| 컴포넌트 | 파일 경로 |
|----------|----------|
| `CommentSection` | `src/domains/boards/components/post/CommentSection.tsx` |
| `Comment` | `src/domains/boards/components/post/Comment.tsx` |

### 글 작성/수정 컴포넌트
| 컴포넌트 | 파일 경로 |
|----------|----------|
| `PostEditForm` | `src/domains/boards/components/post/PostEditForm.tsx` |
| `BoardSelector` | `src/domains/boards/components/createnavigation/BoardSelector.tsx` |
| `EditorToolbar` | `src/domains/boards/components/createnavigation/EditorToolbar.tsx` |
| `ImageUploadForm` | `src/domains/boards/components/form/ImageUploadForm.tsx` |
| `LinkForm` | `src/domains/boards/components/form/LinkForm.tsx` |
| `VideoForm` | `src/domains/boards/components/form/VideoForm.tsx` |
| `YoutubeForm` | `src/domains/boards/components/form/YoutubeForm.tsx` |
| `SocialEmbedForm` | `src/domains/boards/components/form/SocialEmbedForm.tsx` |
| `MatchResultForm` | `src/domains/boards/components/form/MatchResultForm.tsx` |

### 공지사항 컴포넌트
| 컴포넌트 | 파일 경로 |
|----------|----------|
| `NoticeList` | `src/domains/boards/components/notice/NoticeList.tsx` |
| `NoticeItem` | `src/domains/boards/components/notice/NoticeItem.tsx` |
| `NoticeBadge` | `src/domains/boards/components/notice/NoticeBadge.tsx` |

### 공통 컴포넌트
| 컴포넌트 | 파일 경로 |
|----------|----------|
| `BoardBreadcrumbs` | `src/domains/boards/components/common/BoardBreadcrumbs.tsx` |
| `HoverMenu` | `src/domains/boards/components/common/HoverMenu.tsx` |
| `HoverMenuWrapper` | `src/domains/boards/components/common/HoverMenuWrapper.tsx` |
| `ClientHoverMenu` | `src/domains/boards/components/common/ClientHoverMenu.tsx` |
| `ServerHoverMenu` | `src/domains/boards/components/common/ServerHoverMenu.tsx` |
| `PostListWrapper` | `src/domains/boards/components/common/PostListWrapper.tsx` |
| `ServerPostListWrapper` | `src/domains/boards/components/common/ServerPostListWrapper.tsx` |
| `PeriodFilter` | `src/domains/boards/components/common/PeriodFilter.tsx` |
| `BoardDetailLayout` | `src/domains/boards/components/layout/BoardDetailLayout.tsx` |

### 경기 관련 컴포넌트
| 컴포넌트 | 파일 경로 |
|----------|----------|
| `MatchCard` | `src/domains/boards/components/match/MatchCard.tsx` |
| `MatchCardNode` | `src/domains/boards/components/match/MatchCardNode.tsx` |
| `MatchStatsChart` | `src/domains/boards/components/post/MatchStatsChart.tsx` |

### 체크리스트
| 항목 | 상태 | 담당 컴포넌트/액션 | 비고 |
|------|------|-------------------|------|
| 게시판 목록 조회 | ⬜ | `getBoards.ts`, `BoardInfo` | |
| 전체 글 보기 | ⬜ | `getAllPopularPosts.ts`, `PostList` | |
| 인기글 보기 | ⬜ | `getPopularPosts.ts`, `PopularPostList` | |
| 글 상세 보기 | ⬜ | `getPostDetails.ts`, `PostDetailLayout` | |
| 글 작성 | ⬜ | `PostEditForm`, `EditorToolbar` | 로그인 필요 |
| 글 수정 | ⬜ | `PostEditForm` | 작성자만 |
| 글 삭제 | ⬜ | `PostActions` | 작성자만 |
| 댓글 작성 | ⬜ | `CommentSection` | |
| 댓글 수정/삭제 | ⬜ | `Comment` | |
| 대댓글 기능 | ⬜ | `Comment` | |
| 좋아요/싫어요 | ⬜ | `PostActions` | |
| 이미지 업로드 | ⬜ | `ImageUploadForm` | |
| 페이지네이션 | ⬜ | `PostList` | |
| 정렬 기능 | ⬜ | `PeriodFilter` | |
| 공지사항 표시 | ⬜ | `NoticeList` | |
| 데스크톱 레이아웃 | ⬜ | `DesktopPostList` | |
| 모바일 레이아웃 | ⬜ | `MobilePostList` | |

---

## 1.3 라이브스코어

> **[📝 상세 리뷰 결과 보기](./phase1-3-livescore-review.md)**

### 페이지 파일
| 파일 | 라우트 | 설명 |
|------|--------|------|
| `src/app/livescore/football/page.tsx` | `/livescore/football` | 축구 메인 |
| `src/app/livescore/football/leagues/page.tsx` | `/livescore/football/leagues` | 리그 목록 |
| `src/app/livescore/football/leagues/[id]/page.tsx` | `/livescore/football/leagues/[id]` | 리그 상세 |
| `src/app/livescore/football/leagues/[id]/layout.tsx` | - | 리그 레이아웃 |
| `src/app/livescore/football/team/[id]/page.tsx` | `/livescore/football/team/[id]` | 팀 상세 |
| `src/app/livescore/football/team/[id]/layout.tsx` | - | 팀 레이아웃 |
| `src/app/livescore/football/player/[id]/page.tsx` | `/livescore/football/player/[id]` | 선수 상세 |
| `src/app/livescore/football/player/[id]/layout.tsx` | - | 선수 레이아웃 |
| `src/app/livescore/football/match/[id]/page.tsx` | `/livescore/football/match/[id]` | 경기 상세 |
| `src/app/livescore/football/match/[id]/layout.tsx` | - | 경기 레이아웃 |

### 서버 액션
| 파일 | 설명 |
|------|------|
| `src/domains/livescore/actions/index.ts` | 액션 인덱스 |
| `src/domains/livescore/actions/footballApi.ts` | 축구 API 호출 |
| `src/domains/livescore/actions/footballTeamsSync.ts` | 팀 데이터 동기화 |

### 메인 뷰 컴포넌트
| 컴포넌트 | 파일 경로 |
|----------|----------|
| `LiveScoreView` | `src/domains/livescore/components/football/MainView/LiveScoreView.tsx` |
| `NavigationBar` | `src/domains/livescore/components/football/MainView/NavigationBar/index.tsx` |
| `LeagueMatchList` | `src/domains/livescore/components/football/MainView/LeagueMatchList/index.tsx` |
| `MatchCard` | `src/domains/livescore/components/football/MainView/MatchCard/index.tsx` |

### 리그 컴포넌트
| 컴포넌트 | 파일 경로 |
|----------|----------|
| `LeagueCard` | `src/domains/livescore/components/football/leagues/LeagueCard.tsx` |
| `LeagueHeader` | `src/domains/livescore/components/football/leagues/LeagueHeader.tsx` |
| `LeagueTeamsList` | `src/domains/livescore/components/football/leagues/LeagueTeamsList.tsx` |
| `TeamCard` | `src/domains/livescore/components/football/leagues/TeamCard.tsx` |

### 경기 상세 컴포넌트
| 컴포넌트 | 파일 경로 |
|----------|----------|
| `MatchHeader` | `src/domains/livescore/components/football/match/MatchHeader.tsx` |
| `TabNavigation` | `src/domains/livescore/components/football/match/TabNavigation.tsx` |
| `TabContent` | `src/domains/livescore/components/football/match/TabContent.tsx` |
| `MatchDataContext` | `src/domains/livescore/components/football/match/context/MatchDataContext.tsx` |
| `MatchSidebar` | `src/domains/livescore/components/football/match/sidebar/MatchSidebar.tsx` |
| `MatchPredictionClient` | `src/domains/livescore/components/football/match/sidebar/MatchPredictionClient.tsx` |
| `SupportCommentsSection` | `src/domains/livescore/components/football/match/sidebar/SupportCommentsSection.tsx` |

### 경기 탭 컴포넌트
| 컴포넌트 | 파일 경로 |
|----------|----------|
| `Events` | `src/domains/livescore/components/football/match/tabs/Events.tsx` |
| `Stats` | `src/domains/livescore/components/football/match/tabs/Stats.tsx` |
| `Power` | `src/domains/livescore/components/football/match/tabs/Power.tsx` |
| `Standings` | `src/domains/livescore/components/football/match/tabs/Standings.tsx` |
| `Lineups` | `src/domains/livescore/components/football/match/tabs/lineups/Lineups.tsx` |
| `Formation` | `src/domains/livescore/components/football/match/tabs/lineups/Formation.tsx` |
| `Field` | `src/domains/livescore/components/football/match/tabs/lineups/components/Field.tsx` |
| `Player` | `src/domains/livescore/components/football/match/tabs/lineups/components/Player.tsx` |
| `PlayerImage` | `src/domains/livescore/components/football/match/tabs/lineups/components/PlayerImage.tsx` |
| `PlayerEvents` | `src/domains/livescore/components/football/match/tabs/lineups/components/PlayerEvents.tsx` |
| `PlayerStatsModal` | `src/domains/livescore/components/football/match/tabs/lineups/components/PlayerStatsModal.tsx` |

### 팀 상세 컴포넌트
| 컴포넌트 | 파일 경로 |
|----------|----------|
| `TeamHeader` | `src/domains/livescore/components/football/team/TeamHeader.tsx` |
| `TabNavigation` | `src/domains/livescore/components/football/team/TabNavigation.tsx` |
| `TabContent` | `src/domains/livescore/components/football/team/TabContent.tsx` |
| `TeamDataContext` | `src/domains/livescore/components/football/team/context/TeamDataContext.tsx` |

### 팀 탭 컴포넌트
| 컴포넌트 | 파일 경로 |
|----------|----------|
| `Overview` | `src/domains/livescore/components/football/team/tabs/overview/Overview.tsx` |
| `FormDisplay` | `src/domains/livescore/components/football/team/tabs/overview/components/FormDisplay.tsx` |
| `MatchItems` | `src/domains/livescore/components/football/team/tabs/overview/components/MatchItems.tsx` |
| `StandingsPreview` | `src/domains/livescore/components/football/team/tabs/overview/components/StandingsPreview.tsx` |
| `StatsCards` | `src/domains/livescore/components/football/team/tabs/overview/components/StatsCards.tsx` |
| `Squad` | `src/domains/livescore/components/football/team/tabs/Squad.tsx` |
| `Standings` | `src/domains/livescore/components/football/team/tabs/Standings.tsx` |
| `Stats` | `src/domains/livescore/components/football/team/tabs/stats/Stats.tsx` |
| `BasicStatsCards` | `src/domains/livescore/components/football/team/tabs/stats/components/BasicStatsCards.tsx` |
| `GoalsChart` | `src/domains/livescore/components/football/team/tabs/stats/components/GoalsChart.tsx` |
| `CardsChart` | `src/domains/livescore/components/football/team/tabs/stats/components/CardsChart.tsx` |
| `FormationStats` | `src/domains/livescore/components/football/team/tabs/stats/components/FormationStats.tsx` |
| `HomeAwayStats` | `src/domains/livescore/components/football/team/tabs/stats/components/HomeAwayStats.tsx` |
| `AdditionalStats` | `src/domains/livescore/components/football/team/tabs/stats/components/AdditionalStats.tsx` |

### 선수 상세 컴포넌트
| 컴포넌트 | 파일 경로 |
|----------|----------|
| `PlayerHeader` | `src/domains/livescore/components/football/player/PlayerHeader.tsx` |
| `TabNavigation` | `src/domains/livescore/components/football/player/TabNavigation.tsx` |
| `TabContent` | `src/domains/livescore/components/football/player/TabContent.tsx` |
| `PlayerDataContext` | `src/domains/livescore/components/football/player/context/PlayerDataContext.tsx` |

### 선수 탭 컴포넌트
| 컴포넌트 | 파일 경로 |
|----------|----------|
| `PlayerStats` | `src/domains/livescore/components/football/player/tabs/PlayerStats.tsx` |
| `PlayerFixtures` | `src/domains/livescore/components/football/player/tabs/PlayerFixtures.tsx` |
| `PlayerTransfers` | `src/domains/livescore/components/football/player/tabs/PlayerTransfers.tsx` |
| `PlayerInjuries` | `src/domains/livescore/components/football/player/tabs/PlayerInjuries.tsx` |
| `PlayerTrophies` | `src/domains/livescore/components/football/player/tabs/PlayerTrophies.tsx` |
| `PlayerRankings` | `src/domains/livescore/components/football/player/tabs/PlayerRankings.tsx` |

### 이적 정보 컴포넌트
| 컴포넌트 | 파일 경로 |
|----------|----------|
| `TransfersPageContent` | `src/domains/livescore/components/football/transfers/TransfersPageContent.tsx` |
| `TransferFilters` | `src/domains/livescore/components/football/transfers/TransferFilters.tsx` |

### 공통 컴포넌트
| 컴포넌트 | 파일 경로 |
|----------|----------|
| `CommonComponents` | `src/domains/livescore/components/common/CommonComponents.tsx` |
| `HeadersUI` | `src/domains/livescore/components/common/HeadersUI.tsx` |

### 체크리스트
| 항목 | 상태 | 담당 컴포넌트 | 비고 |
|------|------|---------------|------|
| 축구 메인 페이지 | ⬜ | `LiveScoreView` | |
| 날짜별 경기 조회 | ⬜ | `NavigationBar` | |
| 경기 카드 표시 | ⬜ | `MatchCard` | |
| 리그별 그룹화 | ⬜ | `LeagueMatchList` | |
| 리그 목록 페이지 | ⬜ | `LeagueCard` | |
| 리그 상세 페이지 | ⬜ | `LeagueHeader`, `LeagueTeamsList` | |
| 팀 상세 - 헤더 | ⬜ | `TeamHeader` | |
| 팀 상세 - 개요 | ⬜ | `Overview` | |
| 팀 상세 - 스쿼드 | ⬜ | `Squad` | |
| 팀 상세 - 순위 | ⬜ | `Standings` | |
| 팀 상세 - 통계 | ⬜ | `Stats` | |
| 선수 상세 - 헤더 | ⬜ | `PlayerHeader` | |
| 선수 상세 - 통계 | ⬜ | `PlayerStats` | |
| 선수 상세 - 경기 | ⬜ | `PlayerFixtures` | |
| 선수 상세 - 이적 | ⬜ | `PlayerTransfers` | |
| 선수 상세 - 부상 | ⬜ | `PlayerInjuries` | |
| 선수 상세 - 트로피 | ⬜ | `PlayerTrophies` | |
| 경기 상세 - 헤더 | ⬜ | `MatchHeader` | |
| 경기 상세 - 이벤트 | ⬜ | `Events` | |
| 경기 상세 - 통계 | ⬜ | `Stats` | |
| 경기 상세 - 라인업 | ⬜ | `Lineups`, `Formation` | |
| 경기 상세 - 순위 | ⬜ | `Standings` | |
| 경기 예측 | ⬜ | `MatchPredictionClient` | |
| 응원 댓글 | ⬜ | `SupportCommentsSection` | |
| 실시간 스코어 업데이트 | ⬜ | `LiveScoreView` | |

---

## 파일 구조 요약

```
src/
├── app/
│   ├── page.tsx                          # 메인 페이지
│   ├── boards/
│   │   ├── [slug]/
│   │   │   ├── page.tsx                  # 게시판 목록
│   │   │   ├── create/page.tsx           # 글 작성
│   │   │   └── [postNumber]/
│   │   │       ├── page.tsx              # 글 상세
│   │   │       └── edit/page.tsx         # 글 수정
│   │   ├── all/page.tsx                  # 전체 글
│   │   └── popular/page.tsx              # 인기글
│   └── livescore/football/
│       ├── page.tsx                      # 라이브스코어 메인
│       ├── leagues/
│       │   ├── page.tsx                  # 리그 목록
│       │   └── [id]/page.tsx             # 리그 상세
│       ├── team/[id]/page.tsx            # 팀 상세
│       ├── player/[id]/page.tsx          # 선수 상세
│       └── match/[id]/page.tsx           # 경기 상세
│
└── domains/
    ├── widgets/components/               # 메인 페이지 위젯 (14개)
    ├── boards/
    │   ├── actions/ (8개)                # 서버 액션
    │   └── components/ (56개)            # 게시판 컴포넌트
    └── livescore/
        ├── actions/ (3개)                # 서버 액션
        └── components/ (60개+)           # 라이브스코어 컴포넌트
```

---

## 발견된 이슈

> 리뷰 중 발견된 이슈를 여기에 기록

### 1.1 메인 페이지 이슈 (✅ 해결됨)
| # | 이슈 | 위치 | 심각도 | 상태 |
|---|------|------|--------|------|
| 1 | 서버 컴포넌트 너무 김 (269줄), N+1 쿼리 | BoardCollectionWidget | 🔴 높음 | ✅ 해결 |
| 2 | 이미지 추출 함수 복잡 (90줄+), 타입 중복 | NewsWidget | 🟠 중간 | ✅ 해결 |

### 1.2 게시판 이슈
| # | 이슈 | 위치 | 심각도 | 상태 |
|---|------|------|--------|------|
| 3 | PostContent.tsx 너무 김 (1727줄) | 컴포넌트 | 🔴 높음 | [1차 완료](./refactoring-post-content.md) |
| 4 | PostEditForm.tsx 너무 김 (995줄) | 컴포넌트 | 🔴 높음 | [✅ 해결](./refactoring-post-edit-form.md) |
| 5 | 타입/함수 중복 (4개 파일) | 페이지들 | 🔴 높음 | [✅ 해결](./refactoring-board-types.md) |
| 6 | HoverMenu 로직 중복 | 페이지들 | 🟠 중간 | [✅ 해결](./refactoring-hover-menu.md) |
| 7 | PostList.backup.tsx 삭제 필요 | 컴포넌트 | 🟡 낮음 | ✅ 삭제됨 |

---

## 1.4 샵

> **[📝 상세 리뷰 결과 보기](./phase1-4-shop-review.md)**

### 파일 현황
| 분류 | 파일 수 |
|------|--------|
| 전체 | 11개 |

### 체크리스트
| 항목 | 상태 | 비고 |
|------|------|------|
| 카테고리 필터 | ✅ | CategoryFilter.tsx (599줄, 구조 양호) |
| 아이템 그리드 | ✅ | ItemGrid.tsx (불필요 타입 단언 제거) |
| 구매 모달 | ✅ | PurchaseModal.tsx |
| 페이지네이션 | ✅ | ShopPagination.tsx |

---

## 1.5 기타 도메인

> **[📝 상세 리뷰 결과 보기](./phase1-5-other-domains-review.md)**

### 도메인 현황
| 도메인 | 파일 수 | 상태 |
|--------|--------|------|
| auth | 12개 | ✅ console.log 4개 제거 |
| notifications | 14개 | ✅ 구조 양호 |
| settings | 37개 | ✅ console.log 4개 제거 |
| chatbot | 29개 | ✅ console.log 1개 제거 |
| 기타 | - | 🟡 관리자 기능 |

---

## 진행 상황

| 섹션 | 진행률 | 마지막 업데이트 |
|------|--------|----------------|
| 1.1 메인 페이지 | 100% ✅ | 2024-12-23 |
| 1.2 게시판 | 100% ✅ | 2024-12-23 |
| 1.3 라이브스코어 | 100% ✅ | 2024-12-24 |
| 1.4 샵 | 100% ✅ | 2024-12-24 |
| 1.5 기타 도메인 | 100% ✅ | 2024-12-24 |

---

[← 메인 체크리스트로 돌아가기](../launch-review-checklist.md)
