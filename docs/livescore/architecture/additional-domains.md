# 추가 도메인 아키텍처 검토

> `docs/livescore/architecture.md` 표준 대비 실제 코드 검증 결과.
> 메인 5개 페이지(메인, 라이브스코어, 경기/팀/선수 상세) + 데이터센터/이적시장 이외에
> API-Sports 데이터를 사용하는 모든 파일을 검토.

**검토일**: 2026-03-01

---

## 검토 요약

| 도메인 | 파일 | API 래퍼 | 이슈 | 상태 |
|:-------|:-----|:--------:|:-----|:----:|
| 예측 분석 | `prediction/actions.ts` | ✅ `fetchFromFootballApi` | 없음 | ✅ |
| 예측 분석 | `prediction/utils/predictMatch.ts` | ✅ `fetchFromFootballApi` | 없음 | ✅ |
| 사이드바 | `sidebar/actions/football.ts` | ✅ `fetchFromFootballApi` | 직접 fetch → **전환 완료** | ✅ |
| 에디터 | `boards/actions/createPlayerCardData.ts` | — | API-Sports 호출 없음 (Supabase만) | ✅ |
| Admin 동기화 | `livescore/actions/footballTeamsSync.ts` | ⚠️ 직접 fetch | 의도적 (no-store, 일괄 동기화) | ✅ 예외 |
| 레거시 래퍼 | `shared/utils/footballApi.ts` | — | **삭제 완료** (import 0건) | ✅ |
| 레거시 유틸 | `shared/utils/apiCache.ts` | — | **삭제 완료** (import 0건) | ✅ |
| 레거시 검색 | `search/actions/teamMatches.ts` | — | **삭제 완료** (@deprecated, import 0건) | ✅ |

---

## 수정 사항

### 1. `sidebar/actions/football.ts` — 직접 fetch → fetchFromFootballApi

**Before**:
```typescript
const response = await fetch(
  `https://v3.football.api-sports.io/standings?league=${apiLeagueId}&season=${season}`,
  {
    headers: {
      'x-rapidapi-host': 'v3.football.api-sports.io',
      'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
    },
    next: { revalidate: 600 }
  }
);
const data = await response.json();
```

**After**:
```typescript
import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi';

const data = await fetchFromFootballApi('standings', {
  league: apiLeagueId,
  season: season
});
```

**변경 이유**:
- API 키 관리, 헤더 구성, 캐시 정책을 표준 래퍼에 위임
- standings: 30분 revalidate (표준 정책)
- 기존 10분 → 30분으로 변경 (순위 데이터 특성에 적합)

### 2. 삭제된 파일 (3개)

| 파일 | 이유 |
|------|------|
| `src/shared/utils/footballApi.ts` (261줄) | `fetchFootball()` 함수 — 코드베이스 어디에서도 import하지 않음. `domains/livescore/actions/footballApi.ts`의 `fetchFromFootballApi()`가 표준 래퍼로 사용됨 |
| `src/shared/utils/apiCache.ts` (257줄) | `API_CACHE_POLICY`, `getMatchCacheTTL()` 등 — `footballApi.ts`에서만 import하는데 그 파일도 미사용 |
| `src/domains/search/actions/teamMatches.ts` (170줄) | `@deprecated` 주석 명시. `getTeamMatchesRecent` (`teams/matches.ts`)로 대체 완료. import 0건 |

**총 삭제**: 688줄

---

## 도메인별 상세 분석

### 예측 분석 (`prediction/`)

**파일**: `src/domains/prediction/actions.ts` (1057줄)

| 함수 | API 엔드포인트 | 래퍼 | 상태 |
|------|---------------|:----:|:----:|
| `fetchPredictions` | `predictions` | `fetchFromFootballApi` | ✅ |
| `getUpcomingMatches` | `fixtures` (date+status) | `fetchFromFootballApi` | ✅ |
| 이미지 | — | `getTeamLogoUrls` / `getLeagueLogoUrl` | ✅ 4590 표준 |

**파일**: `src/domains/prediction/utils/predictMatch.ts` (787줄)

| 함수 | API 엔드포인트 | 래퍼 | 상태 |
|------|---------------|:----:|:----:|
| `predictMatch` | `fixtures` (id) | `fetchFromFootballApi` | ✅ |
| `getTeamStats` | `teams/statistics` | `fetchFromFootballApi` | ✅ |
| `getTeamInjuries` | `injuries` | `fetchFromFootballApi` | ✅ |
| `getTeamForm` | `fixtures` (team+last) | `fetchFromFootballApi` | ✅ |
| `getTeamMainLeague` | `leagues` (team) | `fetchFromFootballApi` | ✅ |
| (h2h) | `fixtures/headtohead` | `fetchFromFootballApi` | ✅ |
| (odds) | `odds` | `fetchFromFootballApi` | ✅ |

**특징**:
- 시즌 폴백: 현재 시즌 → 2024 → 전 시즌 순차 시도
- 특수 대회 폴백: 클럽 월드컵 등에서 팀의 주요 리그 통계 조회
- OpenAI GPT-4.1-nano로 AI 분석 생성
- Supabase `match_prediction_cache` 테이블에 결과 캐시

### 사이드바 (`sidebar/`)

**파일**: `src/domains/sidebar/actions/football.ts` (126줄)

- React `cache()` 래핑 → 렌더 사이클 내 중복 방지 (L3)
- standings: 30분 L1 revalidate
- 팀 로고 배치 조회 (4590 표준)

### 에디터 선수 카드 (`boards/`)

**파일**: `src/domains/boards/actions/createPlayerCardData.ts` (89줄)

- API-Sports 직접 호출 없음
- Supabase Storage에서 선수 사진/팀 로고 URL만 조회
- 4590 표준 준수

### Admin 팀 동기화 (`footballTeamsSync.ts`)

**파일**: `src/domains/livescore/actions/footballTeamsSync.ts` (348줄)

- **의도적으로 `fetchFromFootballApi` 미사용**
- 이유: 관리자 전용 일괄 동기화 → 항상 최신 데이터 필요 (`cache: 'no-store'`)
- `football_teams` 테이블에 upsert
- 코드베이스에서 import 0건 → 외부 트리거(관리 스크립트) 또는 미사용 가능

---

## 관련 파일

| 파일 | 역할 | 상태 |
|------|------|:----:|
| `src/domains/prediction/actions.ts` | 예측 분석 (Predictions API + 게시글 생성) | ✅ |
| `src/domains/prediction/utils/predictMatch.ts` | AI 경기 예측 (통계 수집 + GPT 분석) | ✅ |
| `src/domains/sidebar/actions/football.ts` | 사이드바 순위표 | ✅ 수정됨 |
| `src/domains/boards/actions/createPlayerCardData.ts` | 에디터 선수 카드 (Supabase만) | ✅ |
| `src/domains/livescore/actions/footballTeamsSync.ts` | Admin 팀 동기화 (직접 fetch, 예외) | ✅ 예외 |
| ~~`src/shared/utils/footballApi.ts`~~ | ~~레거시 래퍼~~ | 🗑️ 삭제 |
| ~~`src/shared/utils/apiCache.ts`~~ | ~~레거시 유틸~~ | 🗑️ 삭제 |
| ~~`src/domains/search/actions/teamMatches.ts`~~ | ~~레거시 팀 매치 조회~~ | 🗑️ 삭제 |
