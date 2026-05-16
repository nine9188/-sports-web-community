# Team Detail Hardening

## Goal

team 상세는 DB shell이 꽤 충분하다. API fallback은 유지하되, metadata와 canonical slug는 DB shell 우선으로 처리하고, overview 본문의 무거운 데이터 fan-out을 줄인다.

## DB 확인 결과

- `football_teams`: 1,368 rows
- `league_id` 보유: 1,368 rows
- `slug` 보유: 1,298 rows
- `name_ko` 보유: 523 rows
- `logo_cached_url`은 현재 0 rows지만 `asset_cache`에는 `team_logo` ready row가 9,922개 있음
- `leagues`: 37 rows

즉 team SEO shell은 DB에서 대부분 처리 가능하다. 한글명이 없는 팀은 영문명 fallback을 사용하면 된다.

## Current Hot Path

- `src/app/(site)/livescore/football/team/[id]/[slug]/page.tsx`
  - metadata: `fetchTeamSeoData(id)`
  - metadata: `resolveTeamCanonicalSlug(id)`
  - 본문: `resolveTeamCanonicalSlug(id)`
  - 본문: `fetchTeamFullData(id, options)`
  - overview일 때 추가 병렬 호출:
    - `fetchTeamOverviewPlayerRankingsData(id, 5)`
    - `fetchTeamOverviewTransfersData(id)`
    - `fetchTeamOverviewRecentMatchesData(id, 5)`
    - `fetchTeamOverviewUpcomingMatchesData(id, 5)`
    - `fetchTeamOverviewStandingsData(id)`
- `src/domains/livescore/actions/teams/team.ts`
  - `fetchTeamSeoData`
  - `fetchTeamFullData`
  - overview helper actions
- `src/domains/livescore/actions/teams/slug.ts`
  - DB slug 조회
  - 없으면 API `teams` fallback

## Problems

1. metadata는 비교적 가볍지만 본문 overview가 한 요청에서 여러 데이터 소스를 병렬 호출한다.
2. `fetchTeamFullData()` 내부에서 team 기본 정보와 stats를 만들기 위해 API `leagues`, `teams/statistics` fallback을 탈 수 있다.
3. overview 첫 진입에서 rankings, transfers, recent, upcoming, standings를 모두 SSR한다. Googlebot burst 때 DB/API 연결 수가 커진다.
4. slug 없는 팀 약 70개는 API fallback 또는 name 기반 slug 생성이 필요하다.
5. API로 확인된 신규/누락 팀 shell을 저장하는 명확한 경로가 약하다.

## Target Shape

### 1. Team shell read path 추가 또는 강화

새 server action 후보:

- `src/domains/livescore/actions/teams/teamShell.ts`

역할:

- `football_teams`에서 최소 shell 조회
- `leagues` 매핑 붙이기
- slug가 없으면 DB name 기반으로 slug 생성 후 저장
- shell이 없을 때만 API `teams` fallback
- API fallback 성공 시 최소 shell + slug upsert
- API transient failure와 real missing 구분

저장할 최소 컬럼:

```txt
team_id
name
name_ko 가능하면
slug
country
country_ko 가능하면
league_id
league_name
league_name_ko
logo_url
current_season
updated_at
```

### 2. Metadata는 team shell만 사용

수정 대상:

- `src/app/(site)/livescore/football/team/[id]/[slug]/page.tsx`
- `src/domains/livescore/actions/teams/team.ts`
- `src/domains/livescore/actions/teams/slug.ts`

`fetchTeamSeoData()`와 `resolveTeamCanonicalSlug()`가 같은 shell read path를 공유하도록 정리한다. metadata에서는 `fetchTeamFullData()` 또는 stats API path를 타지 않는다.

### 3. Overview SSR fan-out 줄이기

수정 대상:

- `src/app/(site)/livescore/football/team/[id]/[slug]/page.tsx`
- `src/domains/livescore/components/football/team/TeamPageClient.tsx`
- 필요 시 team tab API route 또는 server action

현재 overview에서 한 번에 SSR하는 후보:

```txt
fetchTeamFullData
fetchTeamOverviewPlayerRankingsData
fetchTeamOverviewTransfersData
fetchTeamOverviewRecentMatchesData
fetchTeamOverviewUpcomingMatchesData
fetchTeamOverviewStandingsData
```

목표:

```txt
SSR:
  team shell
  최근/예정 경기 중 첫 화면에 필요한 최소 block 1~2개

Lazy/API route:
  player rankings
  transfers
  full standings
  player stats
  squad
```

Googlebot에는 첫 화면 shell과 주요 링크만 안정적으로 제공하고, 무거운 block은 cache된 API route 또는 client lazy load로 분리한다.

### 4. Asset cache 활용 정리

현재 `football_teams.logo_cached_url`은 비어 있지만 `asset_cache`에는 team logo ready row가 많다. 페이지마다 `getTeamLogoUrl()`을 직접 여러 번 호출하는 대신 shell 단계에서 asset lookup을 batch/cache로 붙이는 방식을 유지하거나, 자주 쓰는 팀은 `logo_cached_url` backfill을 검토한다.

## Implementation Order

1. `teamShell.ts` 추가 또는 `fetchTeamSeoData()`를 shell 중심으로 리팩터링
2. slug 없는 팀은 name 기반 slug 생성 후 저장
3. API fallback 성공 시 최소 team shell upsert
4. `resolveTeamCanonicalSlug()`를 shell-first로 변경
5. team metadata가 shell path만 쓰도록 정리
6. overview SSR에서 heavy blocks를 분리
7. heavy block API/server action에 `unstable_cache` 또는 TTL 정책 적용

## Expected Result

- 팀 metadata/canonical은 대부분 DB shell로 처리
- DB에 없는 팀만 API fallback
- API fallback 성공 시 다음 요청부터 DB shell 사용
- team overview 첫 요청의 DB/API fan-out 감소
- Googlebot burst 때 서버 연결 실패 가능성 감소
