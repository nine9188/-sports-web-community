# 프로젝트 아키텍처 구조도 (전수 상세)

프로젝트
ㄴ 기술 스택
  ㄴ Next.js App Router (next@^16), React 19, TypeScript
  ㄴ Tailwind CSS
  ㄴ Supabase(인증/DB/스토리지)
  ㄴ React Query(클라이언트 캐시)
  ㄴ Sentry(관측성)
  ㄴ Vitest / Playwright(테스트)

프로젝트
ㄴ 최상위 레이아웃/공통 셸
  ㄴ src/app/layout.tsx
     ㄴ 네비/라이브스코어/UI 테마/SEO/유저 데이터 서버 fetch
     ㄴ RootLayoutClient에 전달
  ㄴ src/app/RootLayoutClient.tsx
     ㄴ React Query/Theme/Auth/Icon 컨텍스트 구성
     ㄴ 사이드바/레이아웃 셸 렌더
  ㄴ 공통 UI/네비
     ㄴ src/domains/sidebar/*
     ㄴ src/domains/layout/*
     ㄴ src/shared/components/*

프로젝트
ㄴ 페이지 전체 목록 및 구성(자동 추출)
  ㄴ /help/account-found
     ㄴ 그룹 포함 경로: /(auth)/help/account-found
     ㄴ 파일: src/app/(auth)\help\account-found\page.tsx
     ㄴ 도메인 import: 없음
     ㄴ shared import
        ㄴ @/shared/utils/metadataNew
  ㄴ /help/account-recovery
     ㄴ 그룹 포함 경로: /(auth)/help/account-recovery
     ㄴ 파일: src/app/(auth)\help\account-recovery\page.tsx
     ㄴ 도메인 import: 없음
     ㄴ shared import
        ㄴ @/shared/utils/metadataNew
  ㄴ /help/reset-password
     ㄴ 그룹 포함 경로: /(auth)/help/reset-password
     ㄴ 파일: src/app/(auth)\help\reset-password\page.tsx
     ㄴ 도메인 import: 없음
     ㄴ shared import
        ㄴ @/shared/utils/metadataNew
  ㄴ /signin
     ㄴ 그룹 포함 경로: /(auth)/signin
     ㄴ 파일: src/app/(auth)\signin\page.tsx
     ㄴ 도메인 import: 없음
     ㄴ shared import
        ㄴ @/shared/utils/metadataNew
  ㄴ /signup
     ㄴ 그룹 포함 경로: /(auth)/signup
     ㄴ 파일: src/app/(auth)\signup\page.tsx
     ㄴ 도메인 import: 없음
     ㄴ shared import
        ㄴ @/shared/utils/metadataNew
  ㄴ /social-signup
     ㄴ 그룹 포함 경로: /(auth)/social-signup
     ㄴ 파일: src/app/(auth)\social-signup\page.tsx
     ㄴ 도메인 import: 없음
     ㄴ shared import
        ㄴ @/shared/utils/metadataNew
  ㄴ /admin/boards
     ㄴ 파일: src/app/admin\boards\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/admin/components/boards
        ㄴ @/domains/admin/hooks/useAdminBoards
     ㄴ shared import: 없음
  ㄴ /admin/exp
     ㄴ 파일: src/app/admin\exp\page.tsx
     ㄴ 도메인 import: 없음
     ㄴ shared import
        ㄴ @/shared/actions/admin-actions
        ㄴ @/shared/components/ui/button
        ㄴ @/shared/context/AuthContext
        ㄴ @/shared/utils/level-icons
  ㄴ /admin/logs
     ㄴ 파일: src/app/admin\logs\page.tsx
     ㄴ 도메인 import: 없음
     ㄴ shared import
        ㄴ @/shared/components/Spinner
  ㄴ /admin/notices
     ㄴ 파일: src/app/admin\notices\page.tsx
     ㄴ 도메인 import: 없음
     ㄴ shared import
        ㄴ @/shared/components/Spinner
  ㄴ /admin/notifications
     ㄴ 파일: src/app/admin\notifications\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/admin/components/notifications
        ㄴ @/domains/notifications/actions
     ㄴ shared import
        ㄴ @/shared/components/ui
        ㄴ @/shared/lib/supabase
  ㄴ /admin
     ㄴ 파일: src/app/admin\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/admin/components/StatCard
        ㄴ @/domains/admin/hooks/useAdminDashboard
     ㄴ shared import
        ㄴ @/shared/components/Spinner
  ㄴ /admin/points
     ㄴ 파일: src/app/admin\points\page.tsx
     ㄴ 도메인 import: 없음
     ㄴ shared import
        ㄴ @/shared/actions/admin-actions
        ㄴ @/shared/components/ui/button
        ㄴ @/shared/context/AuthContext
  ㄴ /admin/prediction
     ㄴ 파일: src/app/admin\prediction\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/admin/components/prediction
        ㄴ @/domains/prediction/actions
     ㄴ shared import
        ㄴ @/shared/components/Calendar
        ㄴ @/shared/components/Spinner
        ㄴ @/shared/components/ui
        ㄴ @/shared/utils/dateUtils
  ㄴ /admin/reports
     ㄴ 파일: src/app/admin\reports\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/admin/components/reports
        ㄴ @/domains/reports/actions
     ㄴ shared import: 없음
  ㄴ /admin/shop
     ㄴ 파일: src/app/admin\shop\page.tsx
     ㄴ 도메인 import: 없음
     ㄴ shared import
        ㄴ @/shared/lib/supabase/server
        ㄴ @/shared/utils/auth-guard
  ㄴ /admin/site-management/branding
     ㄴ 파일: src/app/admin\site-management\branding\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/site-config/actions
     ㄴ shared import: 없음
  ㄴ /admin/site-management
     ㄴ 파일: src/app/admin\site-management\page.tsx
     ㄴ 도메인 import: 없음
     ㄴ shared import: 없음
  ㄴ /admin/site-management/seo-v2
     ㄴ 파일: src/app/admin\site-management\seo-v2\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/seo/actions/seoSettings
     ㄴ shared import
        ㄴ @/shared/lib/supabase/server
  ㄴ /admin/site-management/ui-theme
     ㄴ 파일: src/app/admin\site-management\ui-theme\page.tsx
     ㄴ 도메인 import: 없음
     ㄴ shared import: 없음
  ㄴ /admin/test-cron
     ㄴ 파일: src/app/admin\test-cron\page.tsx
     ㄴ 도메인 import: 없음
     ㄴ shared import: 없음
  ㄴ /admin/test-kleague
     ㄴ 파일: src/app/admin\test-kleague\page.tsx
     ㄴ 도메인 import: 없음
     ㄴ shared import: 없음
  ㄴ /admin/test-teams
     ㄴ 파일: src/app/admin\test-teams\page.tsx
     ㄴ 도메인 import: 없음
     ㄴ shared import: 없음
  ㄴ /admin/users
     ㄴ 파일: src/app/admin\users\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/admin/actions/suspension
        ㄴ @/domains/admin/components/SuspensionManager
        ㄴ @/domains/admin/hooks/useAdminUsers
     ㄴ shared import
        ㄴ @/shared/components/Spinner
        ㄴ @/shared/components/ui
        ㄴ @/shared/context/AuthContext
  ㄴ /admin/widgets/board-collection
     ㄴ 파일: src/app/admin\widgets\board-collection\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/widgets/actions/boardCollectionSettings
     ㄴ shared import
        ㄴ @/shared/components/Spinner
        ㄴ @/shared/components/ui
  ㄴ /auth/confirmed
     ㄴ 파일: src/app/auth\confirmed\page.tsx
     ㄴ 도메인 import: 없음
     ㄴ shared import
        ㄴ @/shared/utils/metadataNew
  ㄴ /boards/hotdeal
     ㄴ 그룹 포함 경로: /boards/(hotdeal)/hotdeal
     ㄴ 파일: src/app/boards\(hotdeal)\hotdeal\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/seo/actions/seoSettings
     ㄴ shared import
        ㄴ @/shared/lib/supabase/server
  ㄴ /boards/hotdeal-appliance
     ㄴ 그룹 포함 경로: /boards/(hotdeal)/hotdeal-appliance
     ㄴ 파일: src/app/boards\(hotdeal)\hotdeal-appliance\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/seo/actions/seoSettings
     ㄴ shared import
        ㄴ @/shared/lib/supabase/server
  ㄴ /boards/hotdeal-apptech
     ㄴ 그룹 포함 경로: /boards/(hotdeal)/hotdeal-apptech
     ㄴ 파일: src/app/boards\(hotdeal)\hotdeal-apptech\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/seo/actions/seoSettings
     ㄴ shared import
        ㄴ @/shared/lib/supabase/server
  ㄴ /boards/hotdeal-beauty
     ㄴ 그룹 포함 경로: /boards/(hotdeal)/hotdeal-beauty
     ㄴ 파일: src/app/boards\(hotdeal)\hotdeal-beauty\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/seo/actions/seoSettings
     ㄴ shared import
        ㄴ @/shared/lib/supabase/server
  ㄴ /boards/hotdeal-food
     ㄴ 그룹 포함 경로: /boards/(hotdeal)/hotdeal-food
     ㄴ 파일: src/app/boards\(hotdeal)\hotdeal-food\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/seo/actions/seoSettings
     ㄴ shared import
        ㄴ @/shared/lib/supabase/server
  ㄴ /boards/hotdeal-living
     ㄴ 그룹 포함 경로: /boards/(hotdeal)/hotdeal-living
     ㄴ 파일: src/app/boards\(hotdeal)\hotdeal-living\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/seo/actions/seoSettings
     ㄴ shared import
        ㄴ @/shared/lib/supabase/server
  ㄴ /boards/hotdeal-mobile
     ㄴ 그룹 포함 경로: /boards/(hotdeal)/hotdeal-mobile
     ㄴ 파일: src/app/boards\(hotdeal)\hotdeal-mobile\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/seo/actions/seoSettings
     ㄴ shared import
        ㄴ @/shared/lib/supabase/server
  ㄴ /boards/hotdeal-sale
     ㄴ 그룹 포함 경로: /boards/(hotdeal)/hotdeal-sale
     ㄴ 파일: src/app/boards\(hotdeal)\hotdeal-sale\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/seo/actions/seoSettings
     ㄴ shared import
        ㄴ @/shared/lib/supabase/server
  ㄴ /boards/[slug]/[postNumber]/edit
     ㄴ 파일: src/app/boards\[slug]\[postNumber]\edit\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/boards/actions
        ㄴ @/domains/boards/components/post/PostEditForm
     ㄴ shared import
        ㄴ @/shared/styles
  ㄴ /boards/[slug]/[postNumber]
     ㄴ 파일: src/app/boards\[slug]\[postNumber]\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/boards/actions
        ㄴ @/domains/boards/components/layout/PostDetailLayout
        ㄴ @/domains/layout/components/TrackPageVisit
        ㄴ @/domains/seo/actions/seoSettings
     ㄴ shared import
        ㄴ @/shared/lib/supabase/server
        ㄴ @/shared/styles
  ㄴ /boards/[slug]/create
     ㄴ 파일: src/app/boards\[slug]\create\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/boards/actions
        ㄴ @/domains/boards/components/post/PostEditForm
     ㄴ shared import
        ㄴ @/shared/styles
  ㄴ /boards/[slug]
     ㄴ 파일: src/app/boards\[slug]\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/boards/actions/getBoardPageAllData
        ㄴ @/domains/boards/actions/posts
        ㄴ @/domains/boards/components/layout/BoardDetailLayout
        ㄴ @/domains/seo/actions/seoSettings
     ㄴ shared import
        ㄴ @/shared/lib/supabase/server
        ㄴ @/shared/styles
  ㄴ /boards/all
     ㄴ 파일: src/app/boards\all\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/boards/actions
        ㄴ @/domains/boards/components/layout/BoardDetailLayout
        ㄴ @/domains/boards/utils/post/postUtils
     ㄴ shared import
        ㄴ @/shared/lib/supabase/server
        ㄴ @/shared/styles
        ㄴ @/shared/utils/metadataNew
  ㄴ /boards/popular
     ㄴ 파일: src/app/boards\popular\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/boards/actions/getAllPopularPosts
        ㄴ @/domains/boards/utils/post/postUtils
     ㄴ shared import
        ㄴ @/shared/lib/supabase/server
        ㄴ @/shared/styles
        ㄴ @/shared/utils/metadataNew
  ㄴ /livescore/football/leagues/[id]
     ㄴ 파일: src/app/livescore\football\leagues\[id]\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/livescore/actions/footballApi
        ㄴ @/domains/livescore/actions/match/standingsData
        ㄴ @/domains/livescore/components/football/leagues
     ㄴ shared import: 없음
  ㄴ /livescore/football/leagues
     ㄴ 파일: src/app/livescore\football\leagues\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/layout/components/TrackPageVisit
        ㄴ @/domains/livescore/components/football/leagues
        ㄴ @/domains/livescore/constants/league-mappings
     ㄴ shared import
        ㄴ @/shared/components/ui
        ㄴ @/shared/utils/metadataNew
  ㄴ /livescore/football/match/[id]
     ㄴ 파일: src/app/livescore\football\match\[id]\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/livescore/actions/match/headtohead
        ㄴ @/domains/livescore/actions/match/matchData
        ㄴ @/domains/livescore/actions/match/matchPlayerStats
        ㄴ @/domains/livescore/actions/match/playerStats
        ㄴ @/domains/livescore/actions/match/sidebarData
        ㄴ @/domains/livescore/components/football/match/MatchPageClient
        ㄴ @/domains/livescore/constants/league-mappings
        ㄴ @/domains/livescore/constants/teams
        ㄴ @/domains/seo/actions/seoSettings
     ㄴ shared import: 없음
  ㄴ /livescore/football
     ㄴ 파일: src/app/livescore\football\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/layout/components/TrackPageVisit
        ㄴ @/domains/livescore/actions/footballApi
        ㄴ @/domains/livescore/components/football/MainView/LiveScoreView
        ㄴ @/domains/livescore/constants/league-mappings
        ㄴ @/domains/livescore/constants/teams/index
        ㄴ @/domains/livescore/types/match
     ㄴ shared import
        ㄴ @/shared/utils/metadataNew
  ㄴ /livescore/football/player/[id]
     ㄴ 파일: src/app/livescore\football\player\[id]\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/livescore/actions/player/data
        ㄴ @/domains/livescore/components/football/player/PlayerPageClient
        ㄴ @/domains/livescore/constants/players
        ㄴ @/domains/livescore/constants/teams
        ㄴ @/domains/livescore/hooks
        ㄴ @/domains/seo/actions/seoSettings
     ㄴ shared import: 없음
  ㄴ /livescore/football/team/[id]
     ㄴ 파일: src/app/livescore\football\team\[id]\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/livescore/actions/teams/team
        ㄴ @/domains/livescore/components/football/team/TeamPageClient
        ㄴ @/domains/seo/actions/seoSettings
     ㄴ shared import: 없음
  ㄴ /notifications
     ㄴ 파일: src/app/notifications\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/notifications/actions/delete
        ㄴ @/domains/notifications/actions/read
        ㄴ @/domains/notifications/components/NotificationItem
        ㄴ @/domains/notifications/hooks/useNotificationQueries
        ㄴ @/domains/notifications/types/notification
     ㄴ shared import
        ㄴ @/shared/components/Spinner
        ㄴ @/shared/components/ui
  ㄴ /page.tsx
     ㄴ 파일: src/app/page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/widgets/components
        ㄴ @/domains/widgets/components/live-score-widget/index
     ㄴ shared import
        ㄴ @/shared/utils/metadataNew
  ㄴ /privacy
     ㄴ 파일: src/app/privacy\page.tsx
     ㄴ 도메인 import: 없음
     ㄴ shared import
        ㄴ @/shared/components/BackButton
        ㄴ @/shared/utils/metadataNew
  ㄴ /search
     ㄴ 파일: src/app/search\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/search
        ㄴ @/domains/search/actions
        ㄴ @/domains/search/types
     ㄴ shared import
        ㄴ @/shared/utils/metadataNew
  ㄴ /settings/account-delete
     ㄴ 파일: src/app/settings\account-delete\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/settings/components
     ㄴ shared import
        ㄴ @/shared/components/ui
        ㄴ @/shared/lib/supabase/server
  ㄴ /settings/exp
     ㄴ 파일: src/app/settings\exp\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/settings/actions/auth
        ㄴ @/domains/settings/actions/exp
        ㄴ @/domains/settings/components/exp/ExpForm
        ㄴ @/domains/settings/components/exp/ExpHistory
        ㄴ @/domains/settings/components/exp/LevelList
     ㄴ shared import
        ㄴ @/shared/components/ui
  ㄴ /settings/icons
     ㄴ 파일: src/app/settings\icons\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/settings/actions/icons
        ㄴ @/domains/settings/components/icons
     ㄴ shared import
        ㄴ @/shared/components/ui
        ㄴ @/shared/lib/supabase/server
        ㄴ @/shared/utils/level-icons-server
  ㄴ /settings/my-comments
     ㄴ 파일: src/app/settings\my-comments\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/settings/actions/my-comments
        ㄴ @/domains/settings/components/my-comments/MyCommentsContent
     ㄴ shared import
        ㄴ @/shared/components/Spinner
        ㄴ @/shared/components/ui
        ㄴ @/shared/utils/auth-guard
  ㄴ /settings/my-posts
     ㄴ 파일: src/app/settings\my-posts\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/settings/actions/my-posts
        ㄴ @/domains/settings/components/my-posts/MyPostsContent
     ㄴ shared import
        ㄴ @/shared/components/Spinner
        ㄴ @/shared/components/ui
        ㄴ @/shared/lib/supabase/server
  ㄴ /settings
     ㄴ 파일: src/app/settings\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/settings
     ㄴ shared import: 없음
  ㄴ /settings/password
     ㄴ 파일: src/app/settings\password\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/settings
        ㄴ @/domains/settings/components
     ㄴ shared import
        ㄴ @/shared/components/ui
  ㄴ /settings/phone
     ㄴ 파일: src/app/settings\phone\page.tsx
     ㄴ 도메인 import: 없음
     ㄴ shared import: 없음
  ㄴ /settings/points
     ㄴ 파일: src/app/settings\points\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/settings/actions/auth
        ㄴ @/domains/settings/actions/points
        ㄴ @/domains/settings/components/points
     ㄴ shared import
        ㄴ @/shared/components/ui
  ㄴ /settings/profile
     ㄴ 파일: src/app/settings\profile\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/settings/actions/auth
        ㄴ @/domains/settings/actions/profile
        ㄴ @/domains/settings/components
     ㄴ shared import
        ㄴ @/shared/components/SuspensionNotice
        ㄴ @/shared/components/ui
        ㄴ @/shared/utils/suspension-guard
  ㄴ /shop/[category]
     ㄴ 파일: src/app/shop\[category]\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/shop/actions/actions
        ㄴ @/domains/shop/components/CategoryFilter
     ㄴ shared import
        ㄴ @/shared/components/ui
        ㄴ @/shared/lib/supabase/server
  ㄴ /shop
     ㄴ 파일: src/app/shop\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/layout/components/TrackPageVisit
        ㄴ @/domains/shop/actions/actions
        ㄴ @/domains/shop/components/CategoryFilter
     ㄴ shared import
        ㄴ @/shared/components/ui
        ㄴ @/shared/lib/supabase/server
        ㄴ @/shared/utils/metadataNew
  ㄴ /terms
     ㄴ 파일: src/app/terms\page.tsx
     ㄴ 도메인 import: 없음
     ㄴ shared import
        ㄴ @/shared/components/BackButton
        ㄴ @/shared/utils/metadataNew
  ㄴ /test/dropdown
     ㄴ 파일: src/app/test\dropdown\page.tsx
     ㄴ 도메인 import: 없음
     ㄴ shared import: 없음
  ㄴ /test
     ㄴ 파일: src/app/test\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/livescore/components/common/HeadersUI
     ㄴ shared import
        ㄴ @/shared/components/Spinner
        ㄴ @/shared/styles
        ㄴ @/shared/styles/error
  ㄴ /transfers
     ㄴ 파일: src/app/transfers\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/layout/components/TrackPageVisit
        ㄴ @/domains/livescore/components/football/transfers
     ㄴ shared import
        ㄴ @/shared/components/ui
        ㄴ @/shared/utils/metadataNew
  ㄴ /ui
     ㄴ 파일: src/app/ui\page.tsx
     ㄴ 도메인 import: 없음
     ㄴ shared import
        ㄴ @/shared/components/Spinner
        ㄴ @/shared/components/ui
        ㄴ @/shared/components/ui/tabs
        ㄴ @/shared/styles
        ㄴ @/shared/styles&apos;;</p>
  ㄴ /user/[publicId]
     ㄴ 파일: src/app/user\[publicId]\page.tsx
     ㄴ 도메인 import
        ㄴ @/domains/user/actions
        ㄴ @/domains/user/components
     ㄴ shared import: 없음

프로젝트
ㄴ 도메인별 사용 페이지(자동 추출)
  ㄴ admin
     ㄴ /admin
     ㄴ /admin/boards
     ㄴ /admin/notifications
     ㄴ /admin/prediction
     ㄴ /admin/reports
     ㄴ /admin/users
  ㄴ boards
     ㄴ /boards/[slug]
     ㄴ /boards/[slug]/[postNumber]
     ㄴ /boards/[slug]/[postNumber]/edit
     ㄴ /boards/[slug]/create
     ㄴ /boards/all
     ㄴ /boards/popular
  ㄴ layout
     ㄴ /boards/[slug]/[postNumber]
     ㄴ /livescore/football
     ㄴ /livescore/football/leagues
     ㄴ /shop
     ㄴ /transfers
  ㄴ livescore
     ㄴ /livescore/football
     ㄴ /livescore/football/leagues
     ㄴ /livescore/football/leagues/[id]
     ㄴ /livescore/football/match/[id]
     ㄴ /livescore/football/player/[id]
     ㄴ /livescore/football/team/[id]
     ㄴ /test
     ㄴ /transfers
  ㄴ notifications
     ㄴ /admin/notifications
     ㄴ /notifications
  ㄴ prediction
     ㄴ /admin/prediction
  ㄴ reports
     ㄴ /admin/reports
  ㄴ search
     ㄴ /search
  ㄴ seo
     ㄴ /admin/site-management/seo-v2
     ㄴ /boards/[slug]
     ㄴ /boards/[slug]/[postNumber]
     ㄴ /boards/hotdeal
     ㄴ /boards/hotdeal-appliance
     ㄴ /boards/hotdeal-apptech
     ㄴ /boards/hotdeal-beauty
     ㄴ /boards/hotdeal-food
     ㄴ /boards/hotdeal-living
     ㄴ /boards/hotdeal-mobile
     ㄴ /boards/hotdeal-sale
     ㄴ /livescore/football/match/[id]
     ㄴ /livescore/football/player/[id]
     ㄴ /livescore/football/team/[id]
  ㄴ settings
     ㄴ /settings
     ㄴ /settings/account-delete
     ㄴ /settings/exp
     ㄴ /settings/icons
     ㄴ /settings/my-comments
     ㄴ /settings/my-posts
     ㄴ /settings/password
     ㄴ /settings/points
     ㄴ /settings/profile
  ㄴ shop
     ㄴ /shop
     ㄴ /shop/[category]
  ㄴ site-config
     ㄴ /admin/site-management/branding
  ㄴ user
     ㄴ /user/[publicId]
  ㄴ widgets
     ㄴ /admin/widgets/board-collection
     ㄴ /page.tsx

프로젝트
ㄴ 도메인 디렉터리 구조
  ㄴ domains/admin
     ㄴ actions
     ㄴ chatbot
     ㄴ components
     ㄴ hooks
  ㄴ domains/auth
     ㄴ actions
     - actions.ts.backup
     - actions-custom.ts.backup
     ㄴ components
     ㄴ types
  ㄴ domains/boards
     ㄴ actions
     ㄴ components
     ㄴ hooks
     - index.ts
     ㄴ types
     ㄴ utils
  ㄴ domains/chatbot
     ㄴ actions
     - CHATBOT_COMPREHENSIVE_REVIEW.md
     - CHATBOT_UI_GUIDE.md
     ㄴ components
     ㄴ constants
     ㄴ hooks
     - index.ts
     ㄴ types
     ㄴ utils
  ㄴ domains/layout
     - actions.ts
     ㄴ components
     ㄴ hooks
     - index.ts
     ㄴ types
     ㄴ utils
  ㄴ domains/livescore
     ㄴ actions
     ㄴ components
     ㄴ constants
     ㄴ hooks
     ㄴ types
     ㄴ utils
  ㄴ domains/notifications
     ㄴ actions
     ㄴ components
     ㄴ hooks
     - index.ts
     ㄴ types
     ㄴ utils
  ㄴ domains/prediction
     - actions.ts
     ㄴ components
     ㄴ libs
     ㄴ utils
  ㄴ domains/reports
     ㄴ actions
     ㄴ components
     ㄴ types
  ㄴ domains/search
     ㄴ actions
     ㄴ components
     ㄴ constants
     - index.ts
     ㄴ types
     ㄴ utils
  ㄴ domains/seo
     ㄴ actions
  ㄴ domains/settings
     ㄴ actions
     ㄴ components
     ㄴ hooks
     - index.ts
     ㄴ types
  ㄴ domains/shop
     ㄴ actions
     ㄴ components
     ㄴ hooks
     ㄴ types
  ㄴ domains/sidebar
     ㄴ actions
     ㄴ components
     ㄴ hooks
     - index.ts
     ㄴ types
  ㄴ domains/site-config
     - actions.ts
     - types.ts
  ㄴ domains/ui-theme
     - actions.ts
  ㄴ domains/user
     ㄴ actions
     ㄴ components
     ㄴ hooks
     ㄴ types
  ㄴ domains/widgets
     ㄴ actions
     ㄴ components
     ㄴ navigation
     ㄴ types

프로젝트
ㄴ 공용(shared) 디렉터리 구조
  ㄴ shared/actions
     - activity-actions.ts
     - admin-actions.ts
     - attendance-actions.ts
     - log-actions.ts
     - referral-actions.ts
     - user.ts
  ㄴ shared/api
     - README.md
  ㄴ shared/components
     - AttendanceCalendar.tsx
     - AttendanceChecker.tsx
     - AuthStateManager.tsx
     - BackButton.tsx
     ㄴ Calendar
     ㄴ editor
     - Footer.tsx
     ㄴ legal
     - RewardGuide.tsx
     ㄴ skeletons
     - Spinner.tsx
     - StateComponents.tsx
     - SuspensionNotice.tsx
     - SuspensionPopup.tsx
     - ThemeToggle.tsx
     - TurnstileWidget.tsx
     ㄴ ui
     - UnifiedSportsImage.tsx
     - UserIcon.tsx
  ㄴ shared/constants
     - cacheConfig.ts
     - queryKeys.ts
     - rewards.ts
  ㄴ shared/context
     - AuthContext.tsx
     - IconContext.tsx
     - ThemeContext.tsx
  ㄴ shared/guards
     - auth.guard.ts
  ㄴ shared/hooks
     - useAuthGuard.ts
     - useClickOutside.ts
     - useLogout.ts
  ㄴ shared/lib
     ㄴ supabase
  ㄴ shared/services
     - email.ts
     - verification.ts
  ㄴ shared/styles
     - alert.ts
     - badge.ts
     - card.ts
     - DESIGN_SYSTEM.md
     - design-tokens.ts
     - error.ts
     - focus.ts
     - hover.ts
     - index.ts
     - input.ts
     - skeleton.ts
  ㄴ shared/types
     - image.ts
     - matchCard.ts
     - playerCard.ts
     - supabase.ts
     - teamCard.ts
     - user.ts
  ㄴ shared/utils
     - activity-rewards-client.ts
     - apiCache.ts
     - auth-guard.ts
     - cn.ts
     - dateUtils.ts
     - footballApi.ts
     - imageCopy.ts
     - imageProxy.ts
     - index.ts
     - level-icons.ts
     - level-icons-server.ts
     - level-icons-shared.ts
     - log-middleware.ts
     - matchCard.ts
     - matchCardRenderer.ts
     - metadataNew.ts
     - performance.ts
     - suspension-format.ts
     - suspension-guard.ts
     - user-icons.ts

프로젝트
ㄴ API 라우트
  ㄴ src/app/api/cron/check-hot-posts/route.ts
  ㄴ src/app/api/proxy-image/route.ts
  ㄴ src/app/api/sync-teams/route.ts
  ㄴ src/app/api/test-kleague/route.ts
  ㄴ src/app/api/test-teams/route.ts

프로젝트
ㄴ 인증/미들웨어/관측성
  ㄴ middleware.ts (보호 경로, 리다이렉트, 관리자 권한)
  ㄴ src/instrumentation.ts (Sentry 연결)
  ㄴ sentry.*.config.ts

프로젝트
ㄴ 설정 파일
  ㄴ next.config.js
  ㄴ tailwind.config.ts
  ㄴ tsconfig.json
  ㄴ eslint.config.mjs
