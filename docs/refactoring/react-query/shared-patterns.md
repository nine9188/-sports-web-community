# 공통 패턴 & Query Keys

> React Query 마이그레이션에서 사용하는 공통 패턴과 규칙

---

## Query Key 전략

```typescript
// src/shared/constants/queryKeys.ts

// 댓글
export const commentKeys = {
  all: ['comments'] as const,
  list: (postId: string) => [...commentKeys.all, 'list', postId] as const,
};

// 매치
export const matchKeys = {
  all: ['match'] as const,
  detail: (matchId: string) => [...matchKeys.all, matchId] as const,
  events: (matchId: string) => [...matchKeys.detail(matchId), 'events'] as const,
  lineups: (matchId: string) => [...matchKeys.detail(matchId), 'lineups'] as const,
  stats: (matchId: string) => [...matchKeys.detail(matchId), 'stats'] as const,
  standings: (matchId: string) => [...matchKeys.detail(matchId), 'standings'] as const,
  power: (matchId: string, homeId: number, awayId: number) =>
    [...matchKeys.detail(matchId), 'power', homeId, awayId] as const,
};

// 팀
export const teamKeys = {
  all: ['team'] as const,
  detail: (teamId: string) => [...teamKeys.all, teamId] as const,
  info: (teamId: string) => [...teamKeys.detail(teamId), 'info'] as const,
  matches: (teamId: string) => [...teamKeys.detail(teamId), 'matches'] as const,
  squad: (teamId: string) => [...teamKeys.detail(teamId), 'squad'] as const,
  playerStats: (teamId: string) => [...teamKeys.detail(teamId), 'playerStats'] as const,
  standings: (teamId: string) => [...teamKeys.detail(teamId), 'standings'] as const,
};

// 선수
export const playerKeys = {
  all: ['player'] as const,
  detail: (playerId: string) => [...playerKeys.all, playerId] as const,
  stats: (playerId: string) => [...playerKeys.detail(playerId), 'stats'] as const,
  fixtures: (playerId: string) => [...playerKeys.detail(playerId), 'fixtures'] as const,
  transfers: (playerId: string) => [...playerKeys.detail(playerId), 'transfers'] as const,
  trophies: (playerId: string) => [...playerKeys.detail(playerId), 'trophies'] as const,
  injuries: (playerId: string) => [...playerKeys.detail(playerId), 'injuries'] as const,
  rankings: (playerId: string) => [...playerKeys.detail(playerId), 'rankings'] as const,
};

// 라이브스코어
export const liveScoreKeys = {
  all: ['liveScore'] as const,
  matches: (date: string) => [...liveScoreKeys.all, 'matches', date] as const,
  liveCount: () => [...liveScoreKeys.all, 'liveCount'] as const,
};

// 리그
export const leagueKeys = {
  all: ['league'] as const,
  detail: (leagueId: string) => [...leagueKeys.all, leagueId] as const,
  standings: (leagueId: string) => [...leagueKeys.detail(leagueId), 'standings'] as const,
};

// Admin
export const adminKeys = {
  all: ['admin'] as const,
  dashboard: () => [...adminKeys.all, 'dashboard'] as const,
  usersCount: () => [...adminKeys.dashboard(), 'usersCount'] as const,
  postsCount: () => [...adminKeys.dashboard(), 'postsCount'] as const,
  commentsCount: () => [...adminKeys.dashboard(), 'commentsCount'] as const,
  boardsCount: () => [...adminKeys.dashboard(), 'boardsCount'] as const,
  reportsCount: () => [...adminKeys.dashboard(), 'reportsCount'] as const,
  logsCount: () => [...adminKeys.dashboard(), 'logsCount'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  boards: () => [...adminKeys.all, 'boards'] as const,
  notices: () => [...adminKeys.all, 'notices'] as const,
  banners: () => [...adminKeys.all, 'banners'] as const,
  predictions: () => [...adminKeys.all, 'predictions'] as const,
  reports: (filters?: object) => [...adminKeys.all, 'reports', filters] as const,
  expHistory: (userId: string, page?: number) => [...adminKeys.all, 'expHistory', userId, page] as const,
  logs: (filters?: object, page?: number) => [...adminKeys.all, 'logs', filters, page] as const,
};

// Notifications
export const notificationKeys = {
  all: ['notifications'] as const,
  list: (userId?: string) => [...notificationKeys.all, 'list', userId] as const,
  unreadCount: (userId?: string) => [...notificationKeys.all, 'unreadCount', userId] as const,
};

// Profile
export const profileKeys = {
  all: ['profile'] as const,
  nicknameTicket: (userId: string) => [...profileKeys.all, 'nicknameTicket', userId] as const,
};

// Entity Picker (폼용)
export const entityKeys = {
  all: ['entity'] as const,
  leagueTeams: (leagueId: number) => [...entityKeys.all, 'leagueTeams', leagueId] as const,
  teamPlayers: (teamId: number) => [...entityKeys.all, 'teamPlayers', teamId] as const,
};

// Match Form (폼용)
export const matchFormKeys = {
  all: ['matchForm'] as const,
  byDate: (date: string) => [...matchFormKeys.all, 'byDate', date] as const,
};

// Shop
export const shopKeys = {
  items: () => ['shop', 'items'] as const,
  userItems: (userId: string) => ['shop', 'userItems', userId] as const,
};
```

---

## 캐시 정책 표준

```typescript
// src/shared/constants/cacheConfig.ts

export const CACHE_STRATEGIES = {
  // 실시간 데이터 (경기 중 이벤트)
  REAL_TIME: {
    staleTime: 1000 * 30,        // 30초
    gcTime: 1000 * 60 * 5,       // 5분
  },

  // 자주 업데이트되는 데이터 (경기 이벤트, 댓글)
  FREQUENTLY_UPDATED: {
    staleTime: 1000 * 60 * 2,    // 2분
    gcTime: 1000 * 60 * 10,      // 10분
  },

  // 가끔 업데이트되는 데이터 (통계, 라인업)
  OCCASIONALLY_UPDATED: {
    staleTime: 1000 * 60 * 5,    // 5분
    gcTime: 1000 * 60 * 30,      // 30분
  },

  // 안정적인 데이터 (팀 정보, 순위, 게시판 목록)
  STABLE_DATA: {
    staleTime: 1000 * 60 * 30,   // 30분
    gcTime: 1000 * 60 * 60 * 2,  // 2시간
  },

  // 거의 변경되지 않는 데이터 (선수단, 리그 정보)
  STATIC_DATA: {
    staleTime: 1000 * 60 * 60,   // 1시간
    gcTime: 1000 * 60 * 60 * 24, // 24시간
  },
} as const;
```

---

## 클라이언트 사이드 탭 전환 패턴

> Player, Team, Match, League 페이지에서 공통으로 사용

### 문제점: URL 기반 탭 전환의 한계

```tsx
// 기존 방식 (느림, 깜빡임)
const handleTabChange = (tab: string) => {
  router.push(`/player/${playerId}?tab=${tab}`);
  // → 서버 컴포넌트 전체 리렌더링 발생!
};
```

**문제:**
- 탭 클릭마다 서버 라운드트립 발생
- 페이지 전체 리로드로 느린 반응
- 화면 깜빡임 발생

### 해결책: 클라이언트 사이드 탭 전환

#### 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────┐
│ page.tsx (서버 컴포넌트)                                      │
│  - URL에서 초기 탭 결정                                       │
│  - 초기 데이터 fetch (fetchPlayerFullData)                   │
│  - PageClient에 데이터 전달                                   │
└────────────────────┬────────────────────────────────────────┘
                     │ props: { playerId, initialTab, initialData }
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ PlayerPageClient.tsx (클라이언트 컴포넌트)                     │
│  - useState로 currentTab 관리                                │
│  - handleTabChange로 상태 + URL 업데이트                      │
│  - window.history.replaceState (shallow update)             │
└────────────────────┬────────────────────────────────────────┘
                     │ props: { activeTab, onTabChange }
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ TabNavigation.tsx                                            │
│  - onTabChange 콜백으로 부모에게 알림                          │
│  - UI 상태만 관리 (isChangingTab)                            │
└─────────────────────────────────────────────────────────────┘
```

#### 1. 서버 컴포넌트 (page.tsx)

```tsx
export default async function PlayerPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id: playerId } = await params;
  const { tab = 'stats' } = await searchParams;

  const initialData = await fetchPlayerFullData(playerId, loadOptions);

  return (
    <PlayerPageClient
      playerId={playerId}
      initialTab={initialTab}
      initialData={initialData}
    />
  );
}
```

#### 2. 클라이언트 래퍼 (PageClient.tsx)

```tsx
'use client';

export default function PlayerPageClient({
  playerId,
  initialTab,
  initialData,
}: PlayerPageClientProps) {
  const [currentTab, setCurrentTab] = useState<PlayerTabType>(initialTab);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleTabChange = useCallback((tabId: string) => {
    const newTab = tabId as PlayerTabType;
    if (newTab === currentTab) return;

    // 1. 클라이언트 상태 즉시 업데이트
    setCurrentTab(newTab);

    // 2. URL을 shallow로 업데이트 (페이지 리로드 없음!)
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (newTab === 'stats') {
      params.delete('tab');
    } else {
      params.set('tab', newTab);
    }

    const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, [currentTab, pathname, searchParams]);

  return (
    <div>
      <PlayerTabNavigation activeTab={currentTab} onTabChange={handleTabChange} />
      <TabContent playerId={playerId} currentTab={currentTab} initialData={initialData} />
    </div>
  );
}
```

#### 3. 탭 네비게이션 (TabNavigation.tsx)

```tsx
'use client';

interface PlayerTabNavigationProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export default function PlayerTabNavigation({
  activeTab = 'stats',
  onTabChange,
}: PlayerTabNavigationProps) {
  const handleTabChange = useCallback((tabId: string) => {
    if (tabId === activeTab) return;
    onTabChange?.(tabId);
  }, [activeTab, onTabChange]);

  return <TabList tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />;
}
```

### 비교

| 항목 | URL 기반 (router.push) | 클라이언트 사이드 |
|------|----------------------|----------------|
| **반응 속도** | 느림 (서버 왕복) | 즉시 |
| **깜빡임** | 있음 | 없음 |
| **URL 업데이트** | ✅ | ✅ (shallow) |
| **북마크/공유** | ✅ | ✅ |
| **뒤로가기** | ✅ | ⚠️ (replaceState) |
| **서버 부하** | 높음 | 낮음 |

### 핵심 포인트

1. **useState로 탭 상태 관리** - Context나 URL 파라미터 대신
2. **window.history.replaceState** - router.push 대신 (서버 리로드 방지)
3. **onTabChange 콜백 패턴** - 자식 → 부모 통신
4. **React Query 캐싱** - 탭 데이터 자동 캐싱

---

## 예상 효과

| 항목 | 현재 | 리팩토링 후 |
|------|------|------------|
| **PlayerDataContext 코드** | 3,600+ 줄 | 200~300줄 |
| **전체 코드량** | ~10,000줄 | ~7,000줄 (30% 감소) |
| **중복 코드** | 많음 | 최소화 |
| **캐싱 관리** | 수동/분산 | 자동/중앙화 |
| **API 호출** | 중복 발생 | 50~70% 감소 |
| **코드 일관성** | 낮음 | 높음 |
| **유지보수성** | 어려움 | 용이 |
| **테스트 용이성** | 낮음 | 높음 (훅 단위 테스트) |

---

## Context 마이그레이션 요약

| Context | Context 파일 | 수정 필요 | 변경 없음 | 상태 |
|---------|------------|----------|----------|------|
| **Player** | 1개 (3,600줄) | 3개 | 6개 | ✅ 완료 |
| **Team** | 1개 (250줄) | 3개 | 4개 | ✅ 완료 |
| **Match** | 1개 (320줄) | 4개 | 4개 | ✅ 완료 |
| **합계** | 3개 (4,170줄) | 10개 | 14개 | ✅ 완료 |
