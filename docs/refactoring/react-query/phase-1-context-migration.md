# Phase 1: Context → React Query 마이그레이션

> 상태: ✅ 완료
> 목표: 3개 Context 파일 (4,170줄) → React Query 훅으로 대체

---

## 개요

Player, Team, Match Context를 React Query로 마이그레이션하여 코드 복잡성을 크게 줄이고 자동 캐싱/상태 관리를 적용합니다.

| Context | 현재 상태 | 라인 수 | 상태 |
|---------|---------|---------|------|
| `PlayerDataContext.tsx` | Context + 다중 useState | **3,600+ 줄** | ✅ 완료 |
| `TeamDataContext.tsx` | Context + 다중 useState | 250줄 | ✅ 완료 |
| `MatchDataContext.tsx` | Context + 다중 useState | 320줄 | ✅ 완료 |

---

## 1-1. 공통 인프라 구축 ✅

- [x] `dateUtils.ts` 생성 및 기존 코드 마이그레이션
- [x] `cacheConfig.ts` 생성 (캐시 정책 상수)
- [x] `queryKeys.ts` 생성 (Query Key 팩토리)

---

## 1-2. Player Context 마이그레이션 (3,600줄) ✅

### 문제점 (Before)

```typescript
// 현재 패턴 (복잡함)
const [seasons, setSeasons] = useState<number[]>([]);
const [statistics, setStatistics] = useState<PlayerStatistic[]>([]);
const [fixturesData, setFixturesData] = useState<FixtureData[]>([]);
const [tabsData, setTabsData] = useState<Record<TabType, TabData | undefined>>({});
const [tabsLoaded, setTabsLoaded] = useState<Record<string, boolean>>({});

// 수동 캐시 관리
const getTabData = useCallback(async (tab: TabType) => {
  if (tabsData[tab]) return tabsData[tab]; // 캐시 확인
  const fullData = await fetchPlayerFullData(playerId, options);
  setTabsData(prev => ({...prev, [tab]: tabData}));
  setTabsLoaded(prev => ({...prev, [tab]: true}));
  return tabData;
}, [tabsData, isLoading, getOptionsForTab, playerId, ...]);
```

### 해결책 (After)

- **usePlayerQueries.ts 생성** ✅
  - [x] usePlayerInfo
  - [x] usePlayerStats
  - [x] usePlayerFixtures
  - [x] usePlayerTransfers
  - [x] usePlayerTrophies
  - [x] usePlayerInjuries
  - [x] usePlayerRankings
  - [x] usePlayerTabData (통합 훅)
  - [x] usePlayerAllTabs (프리페치 훅)

### 수정된 컴포넌트 (4개)

| 파일 | Context 사용 | 수정 수준 |
|------|-------------|---------|
| **TabContent.tsx** | `playerId`, `currentTab`, `tabsData`, `isLoading`, `error` | ✅ 완료 |
| **PlayerHeader.tsx** | `playerData`, `isLoading`, `error` | ✅ 완료 |
| **TabNavigation.tsx** | `setCurrentTab()` → onTabChange 콜백 패턴 | ✅ 완료 |
| **PlayerDataContext.tsx** | 정의 (3,600줄) | ✅ 삭제 완료 |

### 클라이언트 사이드 탭 전환 패턴 ✅

- [x] PlayerPageClient.tsx 생성 (탭 상태 관리 래퍼)
- [x] page.tsx → PlayerPageClient 사용 (서버 컴포넌트)
- [x] window.history.replaceState로 shallow URL 업데이트

### Fixtures API 배치 최적화 ✅

- [x] fixtures.ts → ids 파라미터로 배치 요청 (40회 → 2회)
- [x] 모든 탭 데이터 서버에서 미리 로드 (fixtures 포함)
- [x] initialDataUpdatedAt 설정으로 불필요한 refetch 방지

---

## 1-3. Team Context 마이그레이션 (250줄) ✅

### 수정된 컴포넌트 (3개)

| 파일 | 수정 내용 | 상태 |
|------|---------|------|
| **TeamPageClient.tsx** | 클라이언트 탭 상태 관리 래퍼 | ✅ 생성 |
| **page.tsx** | 모든 탭 데이터 서버에서 미리 로드 | ✅ 수정됨 |
| **TabNavigation.tsx** | onTabChange 콜백 패턴 | ✅ 수정됨 |
| **TabContent.tsx** | initialData props 사용 (Context 제거) | ✅ 수정됨 |
| **TeamHeader.tsx** | initialData props 사용 (Context 제거) | ✅ 수정됨 |
| **TeamDataContext.tsx** | - | ✅ 삭제 완료 |

### 클라이언트 사이드 탭 전환 패턴 ✅

- [x] window.history.replaceState로 shallow URL 업데이트
- [x] 서버 리로드 없이 즉시 탭 전환

---

## 1-4. Match Context 마이그레이션 (320줄) ✅

### 서버 사이드 데이터 프리로드 패턴

- [x] page.tsx에서 모든 탭 데이터 미리 로드
- [x] `fetchPlayerRatingsAndCaptains(matchId)` - Lineups 탭용
- [x] `fetchMatchPlayerStats(matchId)` - Stats 탭용

### 클라이언트 사이드 탭 전환 패턴 ✅

- [x] MatchPageClient.tsx 생성 (탭 상태 관리 래퍼)
- [x] window.history.replaceState로 shallow URL 업데이트
- [x] `export const dynamic` 및 `export const revalidate` 제거 (불필요한 서버 재렌더링 방지)

### 수정된 컴포넌트 (6개)

| 파일 | 수정 내용 | 상태 |
|------|---------|------|
| **page.tsx** | 모든 탭 데이터 서버 프리로드, dynamic/revalidate 제거 | ✅ 수정됨 |
| **MatchPageClient.tsx** | 클라이언트 탭 상태 관리, initialProps 추가 | ✅ 수정됨 |
| **TabContent.tsx** | initialPlayerRatings, initialMatchPlayerStats props 추가 | ✅ 수정됨 |
| **TabNavigation.tsx** | onTabChange 콜백 패턴 적용 | ✅ 수정됨 |
| **tabs/lineups/Lineups.tsx** | usePlayerStats 훅 제거, initialPlayerRatings props 사용 | ✅ 수정됨 |
| **tabs/Stats.tsx** | useQuery 제거, initialMatchPlayerStats props 사용 | ✅ 수정됨 |

### POST 요청 문제 해결 ✅

- [x] 탭 전환 시 불필요한 서버 액션 호출 제거
- [x] Team/Player 페이지와 동일하게 서버 프리로드 + 클라이언트 캐시 패턴 적용

---

## 결과

| 항목 | Before | After |
|------|--------|-------|
| 코드 라인 수 | 4,170줄 | ~500줄 |
| Context 파일 | 3개 | 0개 |
| 수동 캐싱 로직 | 복잡 | 자동 (React Query) |
| 탭 전환 시 서버 요청 | 매번 발생 | 캐시 활용 |
| API 호출 횟수 | 40회+ | 2회 (배치) |
