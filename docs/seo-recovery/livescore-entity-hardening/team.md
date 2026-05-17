# Team Detail Hardening

## Status

2026-05-16 기준 team 상세 페이지 hardening 1차 구현은 완료했다.

목표는 `/livescore/football/team/[id]/[slug]`의 metadata, canonical slug, 기본 팀 프로필을 DB shell 중심으로 처리하고, overview 첫 SSR에서 무거운 데이터 fan-out을 줄이는 것이다. API-Football은 계속 사용하지만, 크롤링 URL 생존에 필요한 최소 team shell은 `football_teams` DB를 먼저 사용한다.

## 문제 요약

기존 team 상세 구조는 다음 이유로 Googlebot 재크롤 burst 때 부담이 커질 수 있었다.

1. metadata에서 `fetchTeamSeoData(id)`와 `resolveTeamCanonicalSlug(id)`를 각각 호출했다.
2. 본문에서 `resolveTeamCanonicalSlug(id)`를 다시 호출했다.
3. 본문에서 `fetchTeamFullData(id, options)`를 호출했다.
4. overview 첫 진입에서 아래 데이터를 동시에 SSR 했다.
   - player rankings
   - transfers
   - recent matches
   - upcoming matches
   - standings
5. `resolveTeamCanonicalSlug()`는 DB slug가 없으면 API `teams` fallback을 탔다.
6. canonical slug가 없으면 `/team/[id]/[slug]` 본문이 바로 404가 될 수 있었다.

team은 DB shell이 이미 충분한 편이라, player/match보다 더 DB 우선으로 가져가기 좋다.

## DB 확인 결과

MCP로 확인한 `football_teams` 주요 상태:

- `football_teams`: 1,368 rows
- `league_id`: NOT NULL
- `league_name`: NOT NULL
- `country`: NOT NULL
- `slug`: 대부분 보유
- `name_ko`: 일부 보유
- `logo_cached_url`: 현재 거의 비어 있음
- `asset_cache`: `team_logo` ready row가 다수 존재
- `leagues`: 37 rows

`football_teams` shell에 실제로 있는 주요 컬럼:

- `team_id`
- `name`
- `name_ko`
- `display_name`
- `short_name`
- `code`
- `logo_url`
- `logo_cached_url`
- `league_id`
- `league_name`
- `league_name_ko`
- `league_logo_url`
- `country`
- `country_ko`
- `founded`
- `venue_id`
- `venue_name`
- `venue_city`
- `venue_capacity`
- `venue_address`
- `venue_surface`
- `current_season`
- `slug`
- `is_active`
- `last_api_sync`
- `api_data`

결론:

- team metadata, canonical slug, 기본 header, JSON-LD 일부는 DB shell만으로 처리 가능하다.
- DB에 없는 팀은 API fallback이 필요하지만, 저장하려면 `league_id`, `league_name`, `country`가 필요하다.

## 코드 변경

### 1. Team shell read path 추가

파일:

- `src/domains/livescore/actions/teams/teamShell.ts`

추가한 역할:

- `football_teams.team_id`로 DB shell을 먼저 조회
- 팀 이름, 한국어 이름, slug, logo, league, venue 정보를 shell로 구성
- DB shell이 있으면 API 호출 없이 `TeamShellResult` 반환
- DB shell이 없을 때만 API-Football `teams` fallback
- API fallback 시 `leagues?team&season`으로 주 리그를 확인
- 리그까지 확인되는 경우에만 `football_teams`에 최소 shell upsert
- API temporary failure와 real missing을 구분

반환 타입:

```ts
type TeamShellResult =
  | { status: 'found'; shell: TeamShell; source: 'db' | 'api' }
  | { status: 'missing' }
  | { status: 'temporary-error'; error: string };
```

저장 기준:

- `teams` API 응답만으로는 `league_id`를 알 수 없다.
- 그래서 API fallback 저장은 `leagues` fallback으로 리그를 확인한 경우에만 수행한다.
- `football_teams.league_id`, `league_name`, `country`가 NOT NULL이라 불완전한 row를 만들지 않는다.

### 2. Canonical slug를 shell-first로 변경

파일:

- `src/domains/livescore/actions/teams/slug.ts`

변경 전:

- Supabase REST로 slug row 조회
- slug가 없으면 API `teams` fallback

변경 후:

- `fetchCachedTeamShell(teamId)`를 먼저 사용한다.
- shell에 slug가 있으면 그대로 사용한다.
- slug가 없으면 shell 이름으로 `getTeamLinkSlug()`를 만든다.
- shell도 없을 때만 기존 API fallback을 유지한다.

핵심 효과:

- DB에 있는 팀의 canonical slug 생성은 API 없이 끝난다.
- API fallback으로 확인된 신규 팀은 리그까지 확인되면 DB shell로 저장된다.

### 3. Team SEO data를 shell 기반으로 변경

파일:

- `src/domains/livescore/actions/teams/team.ts`

변경 전:

- `fetchTeamSeoData()`가 `getTeamById()`를 먼저 보고, 없으면 API `teams` fallback을 탔다.

변경 후:

- `fetchTeamSeoData()`가 `fetchCachedTeamShell()`을 먼저 사용한다.
- shell에서 name, country, founded, logo를 반환한다.
- shell이 없을 때만 기존 API fallback을 유지한다.

핵심 효과:

- metadata와 slug가 같은 shell read path를 공유한다.
- DB에 있는 팀은 metadata에서도 API를 타지 않는다.

### 4. Metadata 이미지 조회 완화

파일:

- `src/app/(site)/livescore/football/team/[id]/[slug]/page.tsx`

변경 전:

- metadata에서 항상 `getTeamLogoUrl(Number(id), 'md')`를 호출했다.

변경 후:

- `fetchTeamSeoData()` shell에 logo가 있으면 그것을 먼저 사용한다.
- logo가 없을 때만 `getTeamLogoUrl()` fallback을 사용한다.

핵심 효과:

- team shell에 logo가 있는 경우 metadata 이미지 조회가 더 가벼워진다.

### 5. Team 본문 canonical 404 완화

파일:

- `src/app/(site)/livescore/football/team/[id]/[slug]/page.tsx`

변경 전:

```ts
if (!canonicalSlug) {
  return notFound();
}
```

변경 후:

- canonical slug가 있을 때만 slug mismatch redirect를 수행한다.
- canonical slug가 없으면 현재 요청 slug로 본문 렌더링을 계속 시도한다.
- JSON-LD URL도 `canonicalSlug || slug`를 사용한다.

핵심 효과:

- slug 생성만 실패했다는 이유로 본문이 바로 404가 되지 않는다.

### 6. Overview SSR preview 유지

파일:

- `src/app/(site)/livescore/football/team/[id]/[slug]/page.tsx`

overview SSR에는 아래 preview 데이터를 유지한다.

```txt
fetchTeamFullData
fetchTeamOverviewPlayerRankingsData
fetchTeamOverviewTransfersData
fetchTeamOverviewRecentMatchesData
fetchTeamOverviewUpcomingMatchesData
fetchTeamOverviewStandingsData
```

요구사항:

- rankings preview 필요
- transfers preview 필요
- standings preview 필요
- recent/upcoming matches preview 필요
- 위 preview들은 첫 SSR 결과에 포함되어야 한다.

이번 변경에서는 preview를 제거하지 않는다. 대신 team shell-first, canonical 404 완화, metadata 경량화를 먼저 적용했다.

최선의 후속 방향:

- preview SSR은 유지한다.
- preview 블록별로 `unstable_cache` key와 TTL을 분리한다.
- rankings/transfers/standings/recent/upcoming 각각 실패 격리를 적용한다.
- 전체 squad/transfers/standings를 매번 새로 계산하지 않고 overview preview payload를 작게 유지한다.

추천 TTL:

- rankings preview: 6시간
- transfers preview: 12시간~24시간
- standings preview: 30분~1시간
- recent/upcoming matches preview: 2분~10분
- team shell: 7일 또는 tag 기반 revalidate

## API와 DB 의존성에 대한 결론

API를 제거한 것이 아니다. 팀 상세는 여전히 다음 데이터를 API 또는 기존 action/cache 경로로 사용한다.

- 시즌 경기
- 스쿼드
- 선수 통계
- 순위
- 이적
- 팀 통계

이번 변경은 모든 데이터를 DB에 복제하는 것이 아니라, team URL 생존과 SEO에 필요한 최소 shell을 DB 우선으로 쓰는 것이다.

## 404 완화 범위

완화된 경우:

- `football_teams`에 해당 `team_id`가 있는 팀 URL
- canonical slug 생성이 실패했지만 요청 slug가 usable한 팀 URL
- API fallback 성공 후 리그가 확인되어 DB shell로 저장된 신규 팀 URL
- overview preview 중 일부가 실패해도 전체 페이지를 막지 않는 경우

여전히 404 또는 missing 처리가 맞는 경우:

- `team_id`가 숫자가 아닌 경우
- 요청 slug가 `team`, `team-123`, `123` 같은 unusable slug인 경우
- DB shell도 없고 API에서도 팀을 찾지 못하는 경우
- API team은 찾았지만 리그/country 조건이 불완전해 DB shell로 저장할 수 없고, 이후 API도 계속 실패하는 경우

## 남은 운영 작업

1. `asset_cache`의 `team_logo` ready row를 `football_teams.logo_cached_url`로 backfill할지 결정한다.
2. overview preview는 SSR 유지가 요구사항이다. client lazy load가 아니라 preview별 `unstable_cache`/TTL/실패 격리를 적용한다.
3. `fetchTeamData()` 내부의 `teams/statistics` 호출도 overview에서 더 가볍게 하려면 `fetchTeamStats` 옵션 또는 stats cache 분리가 필요하다.
4. team sitemap에서 slug 없는 약 70개 팀은 shell 기반 slug 저장/backfill을 별도로 수행하면 더 좋다.

## Verification

아래 검증을 통과했다.

```bash
npm.cmd run typecheck
npm.cmd run build
```

빌드 결과:

- TypeScript compile 통과
- Next.js production build 통과
- `/livescore/football/team/[id]`
- `/livescore/football/team/[id]/[slug]`
- team sitemap route 포함 전체 app build 성공
