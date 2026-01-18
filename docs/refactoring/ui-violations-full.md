# UI 가이드라인 위반 전체 목록

> 생성일: 2026-01-18
> UI_GUIDELINES.md 기준으로 위반 사항 정리

---

## 요약

| 위반 유형 | 사용자용 | Admin/Test | 총 파일 수 |
|----------|---------|------------|-----------|
| Blue Hover | 10 | 19+ | 30+ |
| 다크모드 배경 (gray-800/900) | 14 | 10 | 24 |
| 라이트모드 배경 (gray-50/100/200) | 50+ | 27 | 77 |
| 버튼 색상 (gray-800/black) | 30+ | 20 | 50 |
| 테두리 색상 (gray/slate/zinc) | 40+ | 30 | 70 |
| 라운드 크기 (xl/2xl/3xl) | 8 | 3 | 11 |
| 텍스트 (dark:text-white) | 5 | 4 | 9 |

---

## 1. Blue Hover 위반

> ❌ `hover:text-blue-*`, `hover:bg-blue-*`
> ✅ `hover:bg-[#EAEAEA] dark:hover:bg-[#333333]`

**→ 상세 목록: [blue-hover-violations.md](./blue-hover-violations.md)**

---

## 2. 다크모드 배경색 위반 (24개 파일)

> ❌ `dark:bg-gray-900`, `dark:bg-gray-800`, `dark:bg-gray-700`, `dark:bg-zinc-900`
> ✅ `dark:bg-[#1D1D1D]`, `dark:bg-[#262626]`, `dark:bg-[#333333]`

### 사용자용 페이지
| 파일 | 경로 |
|------|------|
| PredictionChart.tsx | `src/domains/prediction/components/` |
| LiveScoreView.tsx | `src/domains/livescore/components/football/MainView/` |
| UnifiedSportsImage.tsx | `src/shared/components/` |
| Squad.tsx | `src/domains/livescore/components/football/team/tabs/` |
| FormationStats.tsx | `src/domains/livescore/components/football/team/tabs/stats/components/` |
| Stats.tsx | `src/domains/livescore/components/football/match/tabs/` |
| SuspensionPopup.tsx | `src/shared/components/` |
| AttendanceCalendar.tsx | `src/shared/components/` |
| FormDisplay.tsx | `src/domains/livescore/components/football/team/tabs/overview/components/` |
| PlayerImage.tsx | `src/domains/livescore/components/football/match/tabs/lineups/components/` |
| Lineups.tsx | `src/domains/livescore/components/football/match/tabs/lineups/` |
| LeagueStandingsTable.tsx | `src/domains/livescore/components/football/leagues/` |
| ChatFloatingButton.tsx | `src/domains/chatbot/components/` |
| MatchStatsChart.tsx | `src/domains/boards/components/post/` |
| Standings.tsx | `src/domains/livescore/components/football/team/tabs/` |
| signin/page.client.tsx | `src/app/(auth)/signin/` |

### Admin/Test 페이지
| 파일 | 경로 |
|------|------|
| test-kleague/page.tsx | `src/app/admin/` |
| test-teams/page.tsx | `src/app/admin/` |
| test-cron/page.tsx | `src/app/admin/` |
| NoticeManagement.tsx | `src/app/admin/notices/` |
| NoticeAdminSection.tsx | `src/domains/boards/components/post/post-edit-form/components/` |
| tset/*.tsx | `src/app/tset/` (테스트) |

---

## 3. 라이트모드 배경색 위반 (77개 파일)

> ❌ `bg-gray-50`, `bg-gray-100`, `bg-gray-200`
> ✅ `bg-[#F5F5F5]`, `bg-[#EAEAEA]`

### 사용자용 페이지 (주요)
| 파일 | 경로 |
|------|------|
| Comment.tsx | `src/domains/boards/components/post/` |
| BoardSelector.tsx | `src/domains/boards/components/createnavigation/` |
| PredictionChart.tsx | `src/domains/prediction/components/` |
| LiveScoreView.tsx | `src/domains/livescore/components/football/MainView/` |
| PlayerHeader.tsx | `src/domains/livescore/components/football/player/` |
| PlayerFixtures.tsx | `src/domains/livescore/components/football/player/tabs/` |
| PlayerStats.tsx | `src/domains/livescore/components/football/player/tabs/` |
| PlayerTrophies.tsx | `src/domains/livescore/components/football/player/tabs/` |
| AdditionalStats.tsx | `src/domains/livescore/components/football/team/tabs/stats/components/` |
| HomeAwayStats.tsx | `src/domains/livescore/components/football/team/tabs/stats/components/` |
| Squad.tsx | `src/domains/livescore/components/football/team/tabs/` |
| StatsCards.tsx | `src/domains/livescore/components/football/team/tabs/overview/components/` |
| BasicStatsCards.tsx | `src/domains/livescore/components/football/team/tabs/stats/components/` |
| FormationStats.tsx | `src/domains/livescore/components/football/team/tabs/stats/components/` |
| Standings.tsx (match) | `src/domains/livescore/components/football/match/tabs/` |
| Stats.tsx | `src/domains/livescore/components/football/match/tabs/` |
| Lineups.tsx | `src/domains/livescore/components/football/match/tabs/lineups/` |
| Events.tsx | `src/domains/livescore/components/football/match/tabs/` |
| LeagueStandingsTable.tsx | `src/domains/livescore/components/football/leagues/` |
| HeadersUI.tsx | `src/domains/livescore/components/common/` |
| TransfersPageContent.tsx | `src/domains/livescore/components/football/transfers/` |
| LeagueStandings.tsx | `src/domains/sidebar/components/league/` |
| ServerLeagueStandings.tsx | `src/domains/sidebar/components/league/` |
| Sidebar.tsx | `src/domains/sidebar/components/` |
| ChatTypingBubble.tsx | `src/domains/chatbot/components/` |
| SuspensionPopup.tsx | `src/shared/components/` |
| AttendanceCalendar.tsx | `src/shared/components/` |
| button.tsx | `src/shared/components/ui/` |
| PostActions.tsx | `src/domains/boards/components/post/` |
| ServerPostList.tsx | `src/domains/boards/components/post/` |
| MatchStatsChart.tsx | `src/domains/boards/components/post/` |
| ServerPostListWrapper.tsx | `src/domains/boards/components/common/` |
| ClientHoverMenu.tsx | `src/domains/boards/components/common/` |
| ClientBoardList.tsx | `src/domains/boards/components/board/` |
| NotificationBell.tsx | `src/domains/notifications/components/` |
| not-found.tsx | `src/app/` |
| error.tsx | `src/app/` |
| privacy/page.tsx | `src/app/` |
| signup/page.client.tsx | `src/app/(auth)/signup/` |
| signin/page.client.tsx | `src/app/(auth)/signin/` |
| account-recovery/page.client.tsx | `src/app/(auth)/help/` |

### Admin 페이지 (27개)
- `src/app/admin/` 하위 대부분

---

## 4. 버튼 색상 위반 (50개 파일)

> ❌ `bg-gray-800`, `bg-black`
> ✅ `bg-slate-800 dark:bg-[#3F3F3F]`

### 사용자용 페이지 (주요)
| 파일 | 경로 |
|------|------|
| ProfileSidebar.tsx | `src/domains/sidebar/components/` |
| HeaderClient.tsx | `src/domains/layout/components/` |
| HotdealEndButton.tsx | `src/domains/boards/components/hotdeal/` |
| MegaDropdownMenu.tsx | `src/domains/layout/components/navigation/` |
| PredictionChart.tsx | `src/domains/prediction/components/` |
| NavigationBar/index.tsx | `src/domains/livescore/components/football/MainView/` |
| UserProfileModal.tsx | `src/domains/user/components/` |
| EntityPickerForm.tsx | `src/domains/boards/components/entity/` |
| MatchResultForm.tsx | `src/domains/boards/components/form/` |
| EditorToolbar.tsx | `src/domains/boards/components/createnavigation/` |
| PlayerStatsModal.tsx | `src/domains/livescore/components/football/match/tabs/lineups/components/` |
| NicknameChangeModal.tsx | `src/domains/settings/components/profile/` |
| MobileNotificationModal.tsx | `src/domains/notifications/components/` |
| SuspensionPopup.tsx | `src/shared/components/` |
| NewsWidgetClient.tsx | `src/domains/widgets/components/news-widget/` |
| BannerCarousel.tsx | `src/domains/widgets/components/banner-widget/` |
| Sidebar.tsx | `src/domains/sidebar/components/` |
| CategoryFilter.tsx | `src/domains/shop/components/` |
| AccountDeleteForm.tsx | `src/domains/settings/components/account-delete/` |
| Lineups.tsx | `src/domains/livescore/components/football/match/tabs/lineups/` |
| Power.tsx | `src/domains/livescore/components/football/match/tabs/` |
| MobileBoardModal.tsx | `src/domains/layout/components/navigation/` |
| LiveScoreModalClient.tsx | `src/domains/layout/components/livescoremodal/` |
| MobileHamburgerModal.tsx | `src/domains/layout/components/` |
| ChatFloatingButton.tsx | `src/domains/chatbot/components/` |
| SocialEmbedForm.tsx | `src/domains/boards/components/form/` |
| VideoForm.tsx | `src/domains/boards/components/form/` |
| YoutubeForm.tsx | `src/domains/boards/components/form/` |
| ImageUploadForm.tsx | `src/domains/boards/components/form/` |
| LinkForm.tsx | `src/domains/boards/components/form/` |
| MobileBottomSheet.tsx | `src/domains/boards/components/common/hover-menu/` |
| youtube-widget-client.tsx | `src/app/components/widgets/youtube-widget/` |
| PurchaseModal.tsx | `src/domains/shop/components/` |
| PlayerInjuries.tsx | `src/domains/livescore/components/football/player/tabs/` |
| select.tsx | `src/shared/ui/` |
| dialog.tsx | `src/shared/ui/` |

---

## 5. 테두리 색상 위반 (70개 파일)

> ❌ `border-gray-*`, `border-slate-*`, `border-zinc-*`
> ✅ `border-black/7 dark:border-0` 또는 `border-black/5 dark:border-white/10`

### 사용자용 페이지 (주요)
| 파일 | 경로 |
|------|------|
| Comment.tsx | `src/domains/boards/components/post/` |
| tabs.tsx | `src/shared/ui/` |
| tabs.tsx | `src/shared/components/ui/` |
| HotdealTabsClient.tsx | `src/domains/sidebar/components/` |
| PostEditForm.tsx | `src/domains/boards/components/post/` |
| HotdealFormFields.tsx | `src/domains/boards/components/hotdeal/` |
| PredictionChart.tsx | `src/domains/prediction/components/` |
| BoardCollectionWidgetClient.tsx | `src/domains/widgets/components/board-collection-widget/` |
| PlayerFixtures.tsx | `src/domains/livescore/components/football/player/tabs/` |
| Spinner.tsx | `src/shared/components/` |
| UserProfileModal.tsx | `src/domains/user/components/` |
| IconForm.tsx | `src/domains/settings/components/icons/` |
| ChatFormRenderer.tsx | `src/domains/chatbot/components/` |
| UserActivityTabs.tsx | `src/app/user/[publicId]/` |
| EntityPickerForm.tsx | `src/domains/boards/components/entity/` |
| notifications/page.tsx | `src/app/` |
| AttendanceCalendar.tsx | `src/shared/components/` |
| NewsWidgetClient.tsx | `src/domains/widgets/components/news-widget/` |
| BannerCarousel.tsx | `src/domains/widgets/components/banner-widget/` |
| BannerWrapper.tsx | `src/domains/widgets/components/banner-widget/` |
| ClientBoardNavigation.tsx | `src/domains/sidebar/components/board/` |
| TabsClient.tsx | `src/domains/sidebar/components/` |
| Sidebar.tsx | `src/domains/sidebar/components/` |
| NotificationItem.tsx | `src/domains/notifications/components/` |
| Lineups.tsx | `src/domains/livescore/components/football/match/tabs/lineups/` |
| HeadersUI.tsx | `src/domains/livescore/components/common/` |
| LiveScoreModalClient.tsx | `src/domains/layout/components/livescoremodal/` |
| ChatInput.tsx | `src/domains/chatbot/components/` |
| ChatConversationList.tsx | `src/domains/chatbot/components/` |
| ChatChipButtons.tsx | `src/domains/chatbot/components/` |
| MatchStatsChart.tsx | `src/domains/boards/components/post/` |
| PostActions.tsx | `src/domains/boards/components/post/` |
| ImageUploadForm.tsx | `src/domains/boards/components/form/` |
| PeriodFilter.tsx | `src/domains/boards/components/common/` |
| terms/page.tsx | `src/app/` |
| privacy/page.tsx | `src/app/` |
| not-found.tsx | `src/app/` |
| error.tsx | `src/app/` |
| signup/page.client.tsx | `src/app/(auth)/signup/` |
| signin/page.client.tsx | `src/app/(auth)/signin/` |
| account-recovery/page.client.tsx | `src/app/(auth)/help/` |
| live-score-widget-client.tsx | `src/domains/widgets/components/` |
| LeagueStandings.tsx | `src/domains/sidebar/components/league/` |
| TransfersPageContent.tsx | `src/domains/livescore/components/football/transfers/` |
| Standings.tsx | `src/domains/livescore/components/football/team/tabs/` |
| MatchPredictionClient.tsx | `src/domains/livescore/components/football/match/sidebar/` |

---

## 6. 라운드 크기 위반 (11개 파일)

> ❌ `rounded-xl`, `rounded-2xl`, `rounded-3xl`
> ✅ `rounded`, `rounded-md`, `rounded-lg`, `rounded-full`

| 파일 | 경로 |
|------|------|
| layout.tsx | `src/app/` |
| PostContent.tsx | `src/domains/boards/components/post/` |
| PlayerStatsModal.tsx | `src/domains/livescore/components/football/match/tabs/lineups/components/` |
| SuspensionPopup.tsx | `src/shared/components/` |
| ChatModal.tsx | `src/domains/chatbot/components/` |
| ChatTypingBubble.tsx | `src/domains/chatbot/components/` |
| ChatMessageBubble.tsx | `src/domains/chatbot/components/` |
| ChatInput.tsx | `src/domains/chatbot/components/` |
| UIThemeSettingsPage.tsx | `src/app/admin/site-management/ui-theme/` |
| signup/page.client.tsx | `src/app/(auth)/signup/` |
| signin/page.client.tsx | `src/app/(auth)/signin/` |

---

## 7. 텍스트 색상 위반 (9개 파일)

> ❌ `dark:text-white` (단독 사용)
> ✅ `dark:text-[#F0F0F0]`

| 파일 | 경로 |
|------|------|
| PostRenderers.tsx | `src/domains/boards/components/post/postlist/components/shared/` |
| AttendanceCalendar.tsx | `src/shared/components/` |
| Power.tsx | `src/domains/livescore/components/football/match/tabs/` |
| NoticeBadge.tsx | `src/domains/boards/components/notice/` |
| NoticeManagement.tsx | `src/app/admin/notices/` |
| notices/page.tsx | `src/app/admin/notices/` |
| tset/*.tsx | `src/app/tset/` (테스트) |

---

## 수정 우선순위

### 1순위 (사용자 경험 직접 영향)
- [ ] Blue Hover 위반 (10개 파일)
- [ ] 버튼 색상 위반 (사용자용 36개)
- [ ] 라이트/다크모드 배경 (사용자용)

### 2순위 (일관성)
- [ ] 테두리 색상 위반
- [ ] 라운드 크기 위반
- [ ] 텍스트 색상 위반

### 3순위 (Admin/Test)
- [ ] Admin 페이지들
- [ ] Test 페이지들 (tset/)

---

## 수정 가이드

### 배경색 변환
```tsx
// Dark mode
dark:bg-gray-900 → dark:bg-[#1D1D1D]
dark:bg-gray-800 → dark:bg-[#262626]
dark:bg-gray-700 → dark:bg-[#333333]

// Light mode
bg-gray-50 → bg-[#F5F5F5]
bg-gray-100 → bg-[#F5F5F5]
bg-gray-200 → bg-[#EAEAEA]
```

### 버튼 색상 변환
```tsx
bg-gray-800 → bg-slate-800 dark:bg-[#3F3F3F]
bg-black → bg-slate-800 dark:bg-[#3F3F3F]
hover:bg-gray-700 → hover:bg-slate-700 dark:hover:bg-[#4A4A4A]
```

### 테두리 색상 변환
```tsx
border-gray-200 → border-black/7 dark:border-white/10
border-gray-300 → border-black/7 dark:border-white/10
border-slate-200 → border-black/7 dark:border-white/10
```

### 라운드 변환
```tsx
rounded-xl → rounded-lg
rounded-2xl → rounded-lg
rounded-3xl → rounded-lg
```

### 텍스트 변환
```tsx
dark:text-white → dark:text-[#F0F0F0]
```

---

*마지막 업데이트: 2026-01-18*
