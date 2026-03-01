# 팀 상세 페이지 (`/livescore/football/team/[id]`) 아키텍처 검토

> `docs/livescore/architecture.md` 표준 대비 실제 코드 검증 결과.

**검토일**: 2026-02-27

---

## 검토 요약

| 항목 | 상태 | 비고 |
|:-----|:----:|:-----|
| API 호출 래퍼 | ✅ | 모든 액션 파일 `fetchFromFootballApi` 사용 |
| 캐시 계층 (L1/L3) | ✅ | L1 revalidate 60초, L3 `cache()` 적용 |
| Query Key 관리 | ✅ | `teamKeys` shared에 정의, 로컬 정의 없음 |
| Hydration 패턴 | ✅ | 서버 fetch → props 직접 전달 (React Query 미사용) |
| 폴링 정책 | ✅ | 폴링 없음 (팀 상세는 정적 조회) |
| 이미지 파이프라인 | ✅ | 4590 표준 준수 |
| force-dynamic | ✅ | 미사용 (정상) |

---

## 수정된 사항

### 1. `layout.tsx` — `force-dynamic` 제거

**파일**: `src/app/(site)/livescore/football/team/[id]/layout.tsx`

| Before | After |
|--------|-------|
| `export const dynamic = 'force-dynamic'` | 제거 |

**이유**:
- `page.tsx`에서 `searchParams`를 사용하므로 Next.js 15가 자동으로 dynamic 렌더링
- `force-dynamic`은 불필요한 중복 선언

### 2. `useTeamQueries.ts` — 죽은 코드 삭제

**파일**: `src/domains/livescore/hooks/useTeamQueries.ts` → **파일 삭제**

| 삭제된 항목 | 이유 |
|------------|------|
| `teamKeys` (로컬 정의) | `shared/constants/queryKeys.ts`에 이미 존재, import하는 곳 0개 |
| `useTeamInfo` | 실제 사용처 0곳 |
| `useTeamMatches` | 실제 사용처 0곳 |
| `useTeamSquad` | 실제 사용처 0곳 |
| `useTeamPlayerStats` | 실제 사용처 0곳 |
| `useTeamStandings` | 실제 사용처 0곳 |
| `useTeamTabData` | 실제 사용처 0곳 (`setQueryData` 패턴) |

**파일**: `src/domains/livescore/hooks/index.ts`
- 위 7개 항목의 re-export 제거

**이유**:
- `TeamPageClient`는 `useTeamTabData`를 호출하지 않음
- 서버에서 fetch한 `initialData`를 props로 `TeamHeader`, `TabContent`에 직접 전달
- 7개 항목 모두 정의만 있고 import하는 곳이 0곳 → 완전한 dead code

---

## 데이터 흐름

```
page.tsx (서버)
  │
  ├─ fetchTeamFullData(id, { all options })           ← L3 cache()
  │   ├─ fetchTeamData(id)
  │   │   ├─ fetchFromFootballApi('teams', { id })    ← L1 캐시 (60초)
  │   │   ├─ fetchFromFootballApi('leagues', { team }) ← 리그 탐색
  │   │   └─ fetchFromFootballApi('teams/statistics')  ← 팀 통계
  │   │
  │   ├─ getTeamMatches(id)       → fetchFromFootballApi('fixtures')
  │   ├─ getTeamSquad(id)         → fetchFromFootballApi('players/squads')
  │   ├─ getTeamPlayerStats(id)   → fetchFromFootballApi('players')
  │   ├─ getTeamStandings(id)     → fetchFromFootballApi('standings')
  │   ├─ getTeamTransfers(id)     → fetchFromFootballApi('transfers')
  │   │
  │   └─ 이미지 배치 조회 (4590 표준)
  │       ├─ getPlayerPhotoUrls([...ids])
  │       ├─ getTeamLogoUrls([...ids])
  │       ├─ getCoachPhotoUrls([...ids])
  │       ├─ getLeagueLogoUrls([...ids])
  │       └─ getVenueImageUrl(venueId)
  │
  ├─ getPlayersKoreanNames(playerIds)  ← DB 조회
  │
  └─ <TeamPageClient
       teamId / initialTab / playerKoreanNames
       initialData
     />

TeamPageClient (클라이언트)
  ├─ <TeamHeader initialData={...} />         ← props 직접 렌더링
  ├─ <TabNavigation activeTab={...} />        ← useState로 탭 관리
  └─ <TabContent initialData={...} tab={...} />
       └─ 탭별 컴포넌트가 initialData에서 필요한 데이터 추출
```

**React Query를 사용하지 않는 이유**:
- 서버에서 모든 탭 데이터를 한 번에 fetch하여 props로 전달
- 탭 전환은 클라이언트 상태(`useState`)로 관리, 추가 API 호출 없음
- URL은 `window.history.replaceState`로 shallow 업데이트 (서버 리렌더링 없음)

---

## 항목별 상세 검증

### API 호출 래퍼 — ✅ 정상

모든 API-Sports 호출이 `fetchFromFootballApi()`를 경유:

| 함수 | 파일 | 엔드포인트 | 상태 |
|------|------|-----------|:----:|
| `fetchTeamData` | team.ts | `teams`, `leagues`, `teams/statistics` | ✅ |
| `fetchCachedTeamMatches` | matches.ts | `fixtures` | ✅ |
| `fetchCachedTeamSquad` | squad.ts | `players/squads`, `coachs` | ✅ |
| `fetchCachedTeamPlayerStats` | player-stats.ts | `leagues`, `players` | ✅ |
| `fetchCachedTeamStandings` | standings.ts | `leagues`, `standings` | ✅ |
| `fetchCachedTeamTransfers` | transfers.ts | `transfers` | ✅ |

### 캐시 계층 — ✅ 정상

| 계층 | 상태 | 설명 |
|------|:----:|------|
| L1 (Next.js Data Cache) | ✅ | `fetchFromFootballApi` → `revalidate: 60` |
| L3 (React cache) | ✅ | `fetchTeamFullData = cache(...)`, `fetchCachedTeamData = cache(...)` |
| L4 (React Query) | — | 이 페이지에서 React Query 미사용 (props 직접 전달) |

### 이미지 파이프라인 — ✅ 정상

team.ts에서 4590 표준 이미지 배치 조회:
- `getPlayerPhotoUrls` / `getTeamLogoUrls` / `getCoachPhotoUrls` / `getLeagueLogoUrls` / `getVenueImageUrl`
- 다크모드 리그 로고 별도 조회 (`getLeagueLogoUrls([...ids], true)`)

### 탭 컴포넌트 — ✅ 정상

| 탭 | 컴포넌트 | API 호출 | 상태 |
|----|----------|:--------:|:----:|
| Overview | `Overview.tsx` | 없음 | ✅ |
| Fixtures | `FixturesTab.tsx` | 없음 | ✅ |
| Squad | `Squad.tsx` | 없음 | ✅ |
| Standings | `Standings.tsx` | 없음 | ✅ |
| Stats | `Stats.tsx` | 없음 | ✅ |
| Transfers | `TransfersTab.tsx` | 없음 | ✅ |

모든 탭은 `initialData`에서 필요한 데이터를 추출하여 렌더링 (pure rendering).

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `src/app/(site)/livescore/football/team/[id]/page.tsx` | 서버 컴포넌트 (데이터 fetch) |
| `src/app/(site)/livescore/football/team/[id]/layout.tsx` | 레이아웃 (force-dynamic 제거) |
| `src/domains/livescore/components/football/team/TeamPageClient.tsx` | 클라이언트 래퍼 (탭 관리) |
| `src/domains/livescore/components/football/team/TabContent.tsx` | 탭별 렌더링 |
| `src/domains/livescore/components/football/team/TeamHeader.tsx` | 팀 헤더 |
| `src/domains/livescore/actions/teams/team.ts` | fetchTeamFullData (통합 데이터) |
| `src/domains/livescore/actions/teams/matches.ts` | 경기 일정 |
| `src/domains/livescore/actions/teams/squad.ts` | 선수단 |
| `src/domains/livescore/actions/teams/player-stats.ts` | 선수 통계 |
| `src/domains/livescore/actions/teams/standings.ts` | 리그 순위 |
| `src/domains/livescore/actions/teams/transfers.ts` | 이적 정보 |
