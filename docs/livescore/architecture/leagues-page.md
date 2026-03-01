# 데이터센터/리그 페이지 아키텍처 검토

> `docs/livescore/architecture.md` 표준 대비 실제 코드 검증 결과.

**검토일**: 2026-03-01

---

## 검토 요약

### 리그 목록 (`/livescore/football/leagues`)

| 항목 | 상태 | 비고 |
|:-----|:----:|:-----|
| API 호출 래퍼 | ✅ | Supabase 이미지 조회만 사용 (API-Sports 직접 호출 없음) |
| 캐시 계층 | ✅ | ISR 1시간 (`revalidate = 3600`) |
| React Query | — | 미사용 (서버 컴포넌트, 정적 데이터) |
| 이미지 파이프라인 | ✅ | 4590 표준, 다크모드 로고 지원 |
| force-dynamic | ✅ | ISR로 전환 완료 |

### 리그 상세 (`/livescore/football/leagues/[id]`)

| 항목 | 상태 | 비고 |
|:-----|:----:|:-----|
| API 호출 래퍼 | ✅ | `fetchFromFootballApi` 사용 |
| 캐시 계층 (L1/L3) | ✅ | standings: 30분, teams: 1시간 revalidate |
| React Query | — | 미사용 (서버 컴포넌트, props 직접 전달) |
| 이미지 파이프라인 | ✅ | 4590 표준, 배치 팀 로고 조회 |
| force-dynamic | ✅ | layout.tsx에서 제거 완료 (`await params` 자동 dynamic) |

---

## 수정된 사항

### 1. `leagues/page.tsx` — `force-dynamic` → ISR 전환

**파일**: `src/app/(site)/livescore/football/leagues/page.tsx`

| Before | After |
|--------|-------|
| `export const dynamic = 'force-dynamic'` | `export const revalidate = 3600` |

**이유**:
- `params`/`searchParams` 미사용 (리그 목록은 하드코딩 상수)
- 로고 URL은 Supabase Storage에서 조회하며 거의 변하지 않음
- ISR (1시간)로 충분, 매 요청마다 렌더링할 필요 없음

### 2. `leagues/[id]/layout.tsx` — `force-dynamic` 제거

**파일**: `src/app/(site)/livescore/football/leagues/[id]/layout.tsx`

| Before | After |
|--------|-------|
| `export const dynamic = 'force-dynamic'` | 제거 |

**이유**: `page.tsx`에서 `await params`를 사용하므로 Next.js 15가 자동으로 dynamic 렌더링.

---

## 데이터 흐름

### 리그 목록 페이지

```
LeaguesPage (서버)
  │
  ├─ LEAGUE_CATEGORIES                     ← 하드코딩 상수 (API 호출 없음)
  │
  ├─ getLeagueLogoUrls(allLeagueIds)       ← Supabase asset_cache 조회
  ├─ getLeagueLogoUrls(allLeagueIds, true) ← 다크모드 로고
  │
  └─ <LeagueCard
       leagueId / name / leagueLogoUrl / leagueLogoDarkUrl />

LeagueCard (클라이언트)
  └─ 다크모드 감지 (MutationObserver) → 로고 URL 전환
```

### 리그 상세 페이지

```
LeaguePage (서버)
  │
  ├─ fetchLeagueDetails(id)                ← fetchFromFootballApi('leagues')
  ├─ fetchLeagueStandings(leagueId)        ← fetchFromFootballApi('standings')
  │
  ├─ getLeagueLogoUrl(leagueId)            ← Supabase 이미지
  ├─ getLeagueLogoUrl(leagueId, true)      ← 다크모드
  ├─ getTeamLogoUrls([...teamIds])         ← 배치 팀 로고
  │
  ├─ <LeagueHeader league={...} />
  └─ <LeagueStandingsTable standings={...} teamLogoUrls={...} />
```

**특징**:
- React Query 미사용 — 서버에서 모든 데이터 fetch 후 props 전달
- 클라이언트 컴포넌트는 다크모드 감지 + 상호작용(순위표 행 클릭)만 담당

---

## 항목별 상세 검증

### API 호출 래퍼 — ✅ 정상

| 함수 | 파일 | 래퍼 | 상태 |
|------|------|:----:|:----:|
| `fetchLeagueDetails` | footballApi.ts | `fetchFromFootballApi` | ✅ |
| `fetchLeagueStandings` | standingsData.ts | `fetchFromFootballApi` | ✅ |
| `getLeagueLogoUrls` | images/ | Supabase 직접 | ✅ (API-Sports 아님) |
| `getTeamLogoUrls` | images/ | Supabase 직접 | ✅ (API-Sports 아님) |

### 캐시 계층 — ✅ 정상

| 계층 | 리그 목록 | 리그 상세 |
|------|:--------:|:--------:|
| L1 (Next.js) | ISR 3600초 | standings 1800초, leagues 3600초 |
| L3 (React cache) | — | `fetchCachedLeagueStandings = cache(...)` |
| L4 (React Query) | — | — |

### 이미지 — ✅ 4590 표준

- 리그 목록: `getLeagueLogoUrls` 배치 조회 (1회 Supabase 쿼리)
- 리그 상세: 리그 로고 + 순위표 팀 로고 배치 조회
- 다크모드: `DARK_MODE_LEAGUE_IDS` 기반 별도 로고 URL

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `src/app/(site)/livescore/football/leagues/page.tsx` | 리그 목록 (ISR 1시간) |
| `src/app/(site)/livescore/football/leagues/[id]/page.tsx` | 리그 상세 (순위표) |
| `src/app/(site)/livescore/football/leagues/[id]/layout.tsx` | 레이아웃 (force-dynamic 제거) |
| `src/domains/livescore/components/football/leagues/LeagueCard.tsx` | 리그 카드 (다크모드) |
| `src/domains/livescore/components/football/leagues/LeagueHeader.tsx` | 리그 헤더 (다크모드) |
| `src/domains/livescore/components/football/leagues/LeagueStandingsTable.tsx` | 순위표 |
| `src/domains/livescore/actions/footballApi.ts` | fetchLeagueDetails |
| `src/domains/livescore/actions/match/standingsData.ts` | fetchLeagueStandings |
