# 경기 상세 페이지 (`/livescore/football/match/[id]`) 아키텍처 검토

> `docs/livescore/architecture.md` 표준 대비 실제 코드 검증 결과.

**검토일**: 2026-02-27

---

## 검토 요약

| 항목 | 상태 | 비고 |
|:-----|:----:|:-----|
| API 호출 래퍼 | ✅ | `matchDataApi.ts` → `fetchFromFootballApi` 전환 완료 |
| 캐시 계층 (L1/L2/L3/L4) | ✅ | L1 캐시 정상 작동 (revalidate 60초) |
| Query Key 관리 | ✅ | `matchKeys` shared import, 로컬 정의 없음 |
| Hydration 패턴 | ✅ | 서버 fetch → props 직접 전달 (React Query 미사용) |
| 폴링 정책 | ✅ | 폴링 없음 (경기 상세는 정적 조회) |
| 이미지 파이프라인 | ✅ | 4590 표준 준수 |
| force-dynamic | ✅ | 미사용 (정상) |

---

## 수정된 사항

### 1. `matchDataApi.ts` — `no-store` 제거, 표준 래퍼 전환

**파일**: `src/domains/livescore/utils/matchDataApi.ts`

| Before | After |
|--------|-------|
| API-Sports에 직접 `fetch()` + `cache: 'no-store'` | `fetchFromFootballApi('fixtures', { id })` 사용 |
| Next.js Data Cache 완전 바이패스 (매 요청마다 API 호출) | L1 캐시 활성화 (revalidate 60초) |
| API URL, API KEY 직접 하드코딩 | 표준 래퍼가 관리 |

**이유**:
- `cache: 'no-store'`로 Next.js Data Cache를 무시하고 매 요청마다 API-Sports 직접 호출 → **API 쿼터 낭비**
- `fetchFromFootballApi`는 `next: { revalidate: 60 }` 설정으로 L1 캐시 활용
- 한글 팀명/리그명 매핑 로직은 그대로 유지

### 2. `useMatchQueries.ts` — 죽은 코드 삭제

**파일**: `src/domains/livescore/hooks/useMatchQueries.ts` → **파일 삭제**

| 삭제된 항목 | 이유 |
|------------|------|
| `useMatchDetail` | 실제 사용처 0곳 |
| `useMatchEvents` | 실제 사용처 0곳 |
| `useMatchLineups` | 실제 사용처 0곳 |
| `useMatchStats` | 실제 사용처 0곳 |
| `useMatchStandings` | 실제 사용처 0곳 |
| `useMatchPower` | 실제 사용처 0곳 |
| `useMatchTabData` | 실제 사용처 0곳 (`setQueryData` 패턴) |

**파일**: `src/domains/livescore/hooks/index.ts`
- 위 7개 훅의 re-export 제거

**이유**:
- `MatchPageClient`는 `useMatchTabData`를 호출하지 않음
- 서버에서 fetch한 `initialData`를 props로 `MatchHeader`, `TabContent`에 직접 전달
- 7개 훅 모두 정의만 있고 import하는 곳이 0곳 → 완전한 dead code
- `setQueryData` 패턴도 실행되지 않았으므로 HydrationBoundary 전환 자체가 불필요

### 3. `matchKeys` 로컬 정의 → shared import (이전 검토에서 수정)

**파일**: `src/domains/livescore/hooks/index.ts`

`matchKeys`는 `shared/constants/queryKeys.ts`에서 re-export. 로컬 정의 없음.

---

## 데이터 흐름

```
page.tsx (서버)
  │
  ├─ fetchCachedMatchFullData(matchId, { all options })
  │   ├─ L2 캐시 확인 (FT 경기 → Supabase match_cache)
  │   ├─ 캐시 미스 → fetchCachedMatchData(matchId)
  │   │   └─ fetchFromFootballApi('fixtures', { id })    ← L1 캐시 (60초)
  │   └─ fetchMatchEvents / Lineups / Stats / Standings  ← 표준 래퍼
  │
  ├─ FT 경기?
  │   ├─ YES → getMatchCacheBulk → L2에서 power, playerStats 조회
  │   │        캐시 미스만 API 호출 → L2에 저장
  │   └─ NO  → 병렬: sidebarData + power + playerStats
  │
  ├─ getPlayersKoreanNames(playerIds)  ← DB 조회
  │
  └─ <MatchPageClient
       matchId / initialTab / playerKoreanNames
       initialData / initialPowerData / allPlayerStats / sidebarData
     />

MatchPageClient (클라이언트)
  ├─ <MatchHeader initialData={...} />           ← props 직접 렌더링
  ├─ <MatchInfoSection initialData={...} />      ← 사이드바
  └─ <TabContent initialData={...} currentTab={...} />
       └─ 탭별 컴포넌트가 initialData에서 필요한 데이터 추출
```

**React Query를 사용하지 않는 이유**:
- 서버에서 모든 탭 데이터를 한 번에 fetch하여 props로 전달
- 탭 전환은 클라이언트 상태(`useState`)로 관리, 추가 API 호출 없음
- 데이터 리프레시가 필요 없는 정적 조회 페이지

---

## 항목별 상세 검증

### API 호출 래퍼 — ✅ 수정 완료

모든 API-Sports 호출이 `fetchFromFootballApi()`를 경유:

| 함수 | 엔드포인트 | 상태 |
|------|-----------|:----:|
| `fetchCachedMatchData` (matchDataApi.ts) | `fixtures` (id) | ✅ 전환 완료 |
| `fetchMatchEvents` (eventData.ts) | `fixtures/events` | ✅ |
| `fetchMatchLineups` (lineupData.ts) | `fixtures/lineups` | ✅ |
| `fetchMatchStats` (statsData.ts) | `fixtures/statistics` | ✅ |
| `fetchCachedLeagueStandings` (standingsData.ts) | `standings` | ✅ |
| `getCachedPowerData` (headtohead.ts) | `fixtures/headtohead` | ✅ |

---

### 캐시 계층 — ✅ 정상

| 계층 | 상태 | 설명 |
|------|:----:|------|
| L1 (Next.js Data Cache) | ✅ | `fetchFromFootballApi` → `revalidate: 60` (모든 경로) |
| L2 (Supabase match_cache) | ✅ | FT 경기: `getMatchCacheBulk` → `setMatchCache` |
| L3 (React cache) | ✅ | `fetchCachedMatchFullData = cache(...)`, `getCachedSidebarData = cache(...)` |
| L4 (React Query) | — | 이 페이지에서 React Query 미사용 (props 직접 전달) |

---

### Hydration 패턴 — ✅ 정상

서버에서 모든 데이터를 fetch → props로 직접 전달 → 클라이언트에서 즉시 렌더링.
React Query를 사용하지 않으므로 HydrationBoundary도 불필요.

---

### 폴링 정책 — ✅ 정상

경기 상세는 폴링 없음. 탭 전환은 이미 로드된 데이터로 즉시 렌더링.

---

### 이미지 파이프라인 — ✅ 정상

`matchData.ts`에서 4590 표준 이미지 처리:
- `getTeamLogoUrls([homeId, awayId])` → 팀 로고 Storage URL
- `getLeagueLogoUrl(leagueId)` → 리그 로고 (라이트/다크모드)

---

### force-dynamic — ✅ 정상

미사용. `searchParams` 사용으로 자동 dynamic 렌더링.

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `src/app/(site)/livescore/football/match/[id]/page.tsx` | 서버 컴포넌트 (데이터 fetch) |
| `src/domains/livescore/components/football/match/MatchPageClient.tsx` | 클라이언트 래퍼 (탭 관리) |
| `src/domains/livescore/components/football/match/TabContent.tsx` | 탭별 렌더링 |
| `src/domains/livescore/components/football/match/MatchHeader.tsx` | 매치 헤더 |
| `src/domains/livescore/utils/matchDataApi.ts` | 기본 경기 데이터 (표준 래퍼 전환 완료) |
| `src/domains/livescore/actions/match/matchData.ts` | fetchCachedMatchFullData (L2 + API 통합) |
| `src/domains/livescore/actions/match/sidebarData.ts` | 사이드바 데이터 (예측/응원/관련글) |
| `src/domains/livescore/actions/match/matchCache.ts` | L2 Supabase match_cache |
| `src/domains/livescore/actions/match/headtohead.ts` | 전력 비교 데이터 |
| `src/domains/livescore/actions/match/playerStats.ts` | 선수 통계 데이터 |
| `src/domains/livescore/actions/match/eventData.ts` | 경기 이벤트 데이터 |
| `src/domains/livescore/actions/match/lineupData.ts` | 라인업 데이터 |
| `src/domains/livescore/actions/match/statsData.ts` | 경기 통계 데이터 |
| `src/domains/livescore/actions/match/standingsData.ts` | 리그 순위 데이터 |
