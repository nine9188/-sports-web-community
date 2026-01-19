# Tabs 컴포넌트 사용 현황

> 최종 업데이트: 2026-01-19

## 개요

`src/shared/components/ui/tabs.tsx` - 탭 네비게이션 컴포넌트. 콜백 및 상태 관리 지원.

**컴포넌트**:
- `TabList` - 배열 기반 탭 목록 (권장)

**Variant**:
| variant | 용도 | 크기 |
|---------|------|------|
| `default` | 독립 사용 (설정, 경기상세) | h-12 (큰 탭) |
| `contained` | Container 안에서 사용 (사이드바) | py-2 (작은 탭) |

---

## 사용 중 (16곳)

### default variant (독립 사용)

| 파일 | 용도 |
|-----|------|
| `src/domains/livescore/components/football/match/TabNavigation.tsx` | 경기 상세 탭 |
| `src/domains/livescore/components/football/player/TabNavigation.tsx` | 선수 상세 탭 |
| `src/domains/livescore/components/football/team/TabNavigation.tsx` | 팀 상세 탭 |
| `src/domains/settings/components/common/SettingsTabs.tsx` | 설정 탭 |
| `src/domains/search/components/SearchResultsContainer.tsx` | 검색 결과 탭 |
| `src/app/admin/shop/components/ShopItemManagement.tsx` | 샵 아이템 관리 탭 |
| `src/app/admin/rss/page.tsx` | RSS 관리 탭 |
| `src/app/admin/prediction/page.tsx` | 예측 관리 탭 |
| `src/domains/livescore/components/football/player/tabs/PlayerRankings.tsx` | 선수 랭킹 탭 |

### contained variant (컨테이너 내 사용)

| 파일 | 용도 |
|-----|------|
| `src/domains/sidebar/components/TabsClient.tsx` | 인기글 사이드바 |
| `src/domains/sidebar/components/HotdealTabsClient.tsx` | 핫딜 베스트 사이드바 |
| `src/domains/sidebar/components/league/LeagueStandings.tsx` | 축구 팀순위 사이드바 |
| `src/app/user/[publicId]/UserActivityTabs.tsx` | 유저 활동 탭 |
| `src/domains/boards/components/entity/EntityPickerForm.tsx` | 팀/선수 선택 |
| `src/app/(auth)/help/account-recovery/page.client.tsx` | 계정 찾기 |

### 기타

| 파일 | 용도 |
|-----|------|
| `src/app/ui/page.tsx` | UI 데모 페이지 |
| `src/app/test/page.tsx` | 탭 테스트 페이지 |

---

## 보류 (탭이 아닌 UI)

| 파일 | 용도 | 이유 |
|-----|------|------|
| `src/domains/livescore/components/football/match/sidebar/SupportCommentsSection.tsx` | 응원 댓글 필터 | Button variant 토글 (필터 버튼 그룹) |

---

## 사용 예시

### TabList (default) - 독립 사용

```tsx
import { TabList, type TabItem } from '@/shared/components/ui';

const tabs: TabItem[] = [
  { id: 'power', label: '전력' },
  { id: 'events', label: '이벤트' },
  { id: 'lineups', label: '라인업' },
];

<TabList
  tabs={tabs}
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>
```

### TabList (contained) - 컨테이너 내 사용

```tsx
import { TabList, type TabItem } from '@/shared/components/ui';

const tabs: TabItem[] = [
  { id: 'hot', label: 'HOT', icon: <Flame className="h-3 w-3" /> },
  { id: 'views', label: '조회수', icon: <Eye className="h-3 w-3" /> },
];

<div className="bg-white dark:bg-[#1D1D1D] rounded-lg border ...">
  <TabList
    tabs={tabs}
    activeTab={activeTab}
    onTabChange={setActiveTab}
    variant="contained"
    className="mb-0"
  />
  <div className="p-4">
    {/* 컨텐츠 */}
  </div>
</div>
```

### TabItem 타입

```tsx
interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;  // 아이콘 (선택)
  count?: number;          // 카운트 (showCount와 함께 사용)
  mobileOnly?: boolean;    // 모바일에서만 표시
  disabled?: boolean;      // 비활성화
}
```

---

## 변경 이력

| 날짜 | 변경 내용 |
|-----|----------|
| 2026-01-19 | 커스텀 구현 6곳 → TabList contained로 마이그레이션 완료 |
| 2026-01-19 | contained variant 추가 (사이드바용 작은 탭) |
| 2026-01-19 | 초기 문서 작성 |
