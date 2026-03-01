# 선수 상세 페이지 (`/livescore/football/player/[id]`) 아키텍처 검토

> `docs/livescore/architecture.md` 표준 대비 실제 코드 검증 결과.

**검토일**: 2026-03-01

---

## 검토 요약

| 항목 | 상태 | 비고 |
|:-----|:----:|:-----|
| API 호출 래퍼 | ✅ | 모든 액션 파일 `fetchFromFootballApi` 사용 |
| 캐시 계층 (L1/L3/L4) | ✅ | L1 revalidate 정상, L3 `cache()`, L4 React Query |
| Query Key 관리 | ✅ | `playerKeys` shared import, 로컬 정의 없음 |
| Hydration 패턴 | ✅ | `initialData` + `initialDataUpdatedAt` 사용 |
| CACHE_STRATEGIES | ✅ | 모든 훅에서 사용 |
| 폴링 정책 | ✅ | 폴링 없음 (정적 조회) |
| 이미지 파이프라인 | ✅ | 4590 표준 준수 |
| force-dynamic | ✅ | 제거 완료 |
| 탭 컴포넌트 | ✅ | 6개 탭 모두 pure rendering (API 호출 없음) |

---

## 수정된 사항

### 1. `fixtures.ts` — `fetchFromFootballApi` 사용으로 전환

**파일**: `src/domains/livescore/actions/player/fixtures.ts`

| Before | After |
|--------|-------|
| `API_CONFIG` (URL/KEY 하드코딩) | 삭제 — `fetchFromFootballApi`가 관리 |
| `Semaphore` 클래스 (~35행) | 삭제 — 서버리스에서 무의미 |
| `fetchWithRateLimit` (~80행) | 삭제 — L1 캐시로 대체 |
| `FetchResult` 인터페이스 | 삭제 |
| `next: { revalidate }` 없음 | L1 캐시 자동 적용 (fixtures: 60초, players: 1시간) |

**유지한 비즈니스 로직**:
- 시즌 계산 (7월 기준)
- 이전 시즌 fallback
- FT 경기 필터링
- 20개씩 배치 요청 (API 제한)
- 선수 통계 추출 및 기본값 병합
- completeness 추적 (partial/success 상태)

**결과**: 492행 → 271행 (221행 = 45% 삭제)

### 2. `page.tsx` — `force-dynamic` 제거

**파일**: `src/app/(site)/livescore/football/player/[id]/page.tsx`

| Before | After |
|--------|-------|
| `export const dynamic = 'force-dynamic'` | 제거 |

**이유**: `searchParams`를 사용하므로 Next.js 15가 자동으로 dynamic 렌더링.

### 3. 죽은 코드 삭제

**파일**: `src/domains/livescore/hooks/usePlayerQueries.ts`

| 삭제된 항목 | 이유 |
|------------|------|
| `usePlayerStats` | `usePlayerTabData`가 inline queryFn으로 동일 로직 구현, 사용처 0곳 |
| `usePlayerFixtures` | 동일 |
| `usePlayerTransfers` | 동일 |
| `usePlayerTrophies` | 동일 |
| `usePlayerInjuries` | 동일 |
| `usePlayerRankings` | 동일 |
| `usePlayerAllTabs` | 사용되지 않는 프리페치 훅, 사용처 0곳 |
| `UsePlayerQueryOptions` | 삭제된 훅에서만 사용 (usePlayerInfo는 inline 타입으로 변경) |

**유지 대상** (삭제하면 안 됨):

| 항목 | 사용처 | 이유 |
|------|--------|------|
| `usePlayerInfo` | `PlayerHeader.tsx` | 선수 기본 정보 조회 |
| `usePlayerTabData` | `TabContent.tsx` | 탭별 데이터 관리 |
| `PlayerTabType` | `page.tsx` 등 | 타입 export |
| `PlayerStatsData` 등 내부 타입 | `usePlayerTabData` | 통합 훅 내부에서 사용 |

**파일**: `src/domains/livescore/hooks/index.ts`
- 삭제된 7개 훅의 re-export 제거

---

## 데이터 흐름

```
page.tsx (서버)
  │
  ├─ fetchPlayerFullData(playerId, { all options })     ← L3 cache()
  │   ├─ fetchCachedPlayerData(playerId)
  │   │   └─ fetchFromFootballApi('players', { id })    ← L1 캐시 (1시간)
  │   ├─ fetchCachedPlayerSeasons(playerId)
  │   │   └─ fetchFromFootballApi('players/seasons')    ← L1 캐시
  │   ├─ fetchCachedPlayerStats(playerId)
  │   │   └─ fetchFromFootballApi('players')            ← L1 캐시
  │   ├─ fetchCachedPlayerFixtures(playerId)
  │   │   └─ fetchFromFootballApi('players'/'fixtures') ← L1 캐시 (✅ 수정 완료)
  │   ├─ fetchCachedPlayerTransfers(playerId)
  │   │   └─ fetchFromFootballApi('transfers')          ← L1 캐시
  │   ├─ fetchCachedPlayerTrophies(playerId)
  │   │   └─ fetchFromFootballApi('trophies')           ← L1 캐시
  │   ├─ fetchCachedPlayerInjuries(playerId)
  │   │   └─ fetchFromFootballApi('injuries')           ← L1 캐시
  │   └─ fetchPlayerRankings(playerId)
  │       └─ fetchFromFootballApi('players/topscorers')  ← L1 캐시
  │
  ├─ getPlayerKoreanName(playerId)       ← DB 조회
  ├─ getPlayersKoreanNames(rankingIds)   ← DB 조회
  │
  └─ <PlayerPageClient
       playerId / initialTab / initialData
       playerKoreanName / rankingsKoreanNames />

PlayerPageClient (클라이언트)
  ├─ <PlayerHeader playerId={...} initialData={...} />
  │    └─ usePlayerInfo(playerId)         ← L4 캐시 (STABLE_DATA: 30분)
  │
  ├─ <TabNavigation activeTab={...} />    ← useState로 탭 관리
  │
  └─ <TabContent playerId={...} currentTab={...} initialData={...} />
       └─ usePlayerTabData({ playerId, currentTab, initialData })
            ├─ useQuery(playerKeys.info)   ← initialData + initialDataUpdatedAt
            └─ useQueries([
                 stats,      ← enabled: currentTab === 'stats'
                 fixtures,   ← enabled: currentTab === 'fixtures'
                 transfers,  ← enabled: currentTab === 'transfers'
                 trophies,   ← enabled: currentTab === 'trophies'
                 injuries,   ← enabled: currentTab === 'injuries'
                 rankings    ← enabled: currentTab === 'rankings'
               ])
```

**경기/팀 상세와의 차이**:
- 경기/팀 상세: React Query 미사용. props로 직접 전달, 탭 전환 시 추가 API 호출 없음.
- 선수 상세: React Query 사용. `initialData`로 서버 데이터 주입 + `currentTab`에 따라 쿼리 활성화.
- 실질적으로 서버에서 모든 데이터를 미리 로드하므로, `initialData`가 캐시에 들어가 추가 API 호출은 `staleTime` 만료 전까지 발생하지 않음.

---

## 항목별 상세 검증

### API 호출 래퍼 — ✅ 정상

| 함수 | 파일 | 래퍼 | 상태 |
|------|------|:----:|:----:|
| `fetchCachedPlayerData` | player.ts | `fetchFromFootballApi` | ✅ |
| `fetchCachedPlayerSeasons` | stats.ts | `fetchFromFootballApi` | ✅ |
| `fetchCachedPlayerStats` | stats.ts | `fetchFromFootballApi` | ✅ |
| `fetchCachedPlayerFixtures` | fixtures.ts | `fetchFromFootballApi` | ✅ |
| `fetchCachedPlayerTransfers` | transfers.ts | `fetchFromFootballApi` | ✅ |
| `fetchCachedPlayerTrophies` | trophies.ts | `fetchFromFootballApi` | ✅ |
| `fetchCachedPlayerInjuries` | injuries.ts | `fetchFromFootballApi` | ✅ |
| `fetchPlayerRankings` | rankings.ts | `fetchFromFootballApi` | ✅ |

### 캐시 계층 — ✅ 정상

| 계층 | 상태 | 설명 |
|------|:----:|------|
| L1 (Next.js Data Cache) | ✅ | 모든 API 호출 `fetchFromFootballApi` 경유, endpoint별 revalidate 자동 적용 |
| L3 (React cache) | ✅ | `fetchPlayerFullData = cache(...)` |
| L4 (React Query) | ✅ | `usePlayerTabData` + `initialData` + `CACHE_STRATEGIES` |

### React Query 설정 — ✅ 정상

| 쿼리 | 전략 | staleTime | gcTime |
|------|------|-----------|--------|
| `playerKeys.info` | STABLE_DATA | 30분 | 2시간 |
| `playerKeys.stats` | OCCASIONALLY_UPDATED | 5분 | 30분 |
| `playerKeys.fixtures` | OCCASIONALLY_UPDATED | 5분 | 30분 |
| `playerKeys.transfers` | STATIC_DATA | 1시간 | 24시간 |
| `playerKeys.trophies` | STATIC_DATA | 1시간 | 24시간 |
| `playerKeys.injuries` | STABLE_DATA | 30분 | 2시간 |
| `playerKeys.rankings` | STABLE_DATA | 30분 | 2시간 |

### 탭 컴포넌트 — ✅ 정상

| 탭 | 컴포넌트 | API 호출 | 상태 |
|----|----------|:--------:|:----:|
| Stats | `PlayerStats.tsx` | 없음 | ✅ |
| Fixtures | `PlayerFixtures.tsx` | 없음 | ✅ |
| Trophies | `PlayerTrophies.tsx` | 없음 | ✅ |
| Transfers | `PlayerTransfers.tsx` | 없음 | ✅ |
| Injuries | `PlayerInjuries.tsx` | 없음 | ✅ |
| Rankings | `PlayerRankings.tsx` | 없음 | ✅ |

모든 탭은 `usePlayerTabData`에서 데이터를 받아 렌더링 (pure rendering).

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `src/app/(site)/livescore/football/player/[id]/page.tsx` | 서버 컴포넌트 (데이터 fetch, force-dynamic 제거) |
| `src/app/(site)/livescore/football/player/[id]/layout.tsx` | 레이아웃 (정상) |
| `src/domains/livescore/components/football/player/PlayerPageClient.tsx` | 클라이언트 래퍼 (탭 관리) |
| `src/domains/livescore/components/football/player/TabContent.tsx` | 탭별 렌더링 (usePlayerTabData 사용) |
| `src/domains/livescore/components/football/player/PlayerHeader.tsx` | 선수 헤더 (usePlayerInfo 사용) |
| `src/domains/livescore/hooks/usePlayerQueries.ts` | React Query 훅 (죽은 코드 삭제 완료) |
| `src/domains/livescore/actions/player/data.ts` | fetchPlayerFullData (통합 데이터) |
| `src/domains/livescore/actions/player/player.ts` | 선수 기본 정보 |
| `src/domains/livescore/actions/player/stats.ts` | 시즌/통계 데이터 |
| `src/domains/livescore/actions/player/fixtures.ts` | 경기 기록 (fetchFromFootballApi 전환 완료) |
| `src/domains/livescore/actions/player/transfers.ts` | 이적 기록 |
| `src/domains/livescore/actions/player/trophies.ts` | 트로피 |
| `src/domains/livescore/actions/player/injuries.ts` | 부상 기록 |
| `src/domains/livescore/actions/player/rankings.ts` | 리그 랭킹 |
