# Team Detail Hardening

## Status

2026-05-16 기준 team 상세 페이지 hardening 1차 구현은 완료했다.

2026-05-17 추가 보강:

- team slug 품질이 match canonical slug에도 직접 영향을 준다는 점을 명시했다.
- `team-123` 같은 placeholder slug는 usable slug가 아니며, team 상세와 match 상세 모두에서 canonical 후보로 쓰면 안 된다.
- match URL에서 `team-숫자-vs-team-숫자`가 생기지 않으려면 `football_teams`의 name/slug backfill이 필요하다.

목표는 `/livescore/football/team/[id]/[slug]`의 metadata, canonical slug, 기본 팀 프로필을 DB shell 중심으로 처리하고, overview 첫 SSR 데이터를 유지하면서 외부 API fan-out 위험을 줄이는 것이다. API-Football은 계속 사용하지만, 크롤링 URL 생존에 필요한 최소 team shell은 `football_teams` DB를 먼저 사용한다.

중요한 전제:

- SSR을 제거하지 않는다.
- overview preview 데이터를 임의로 제거하지 않는다.
- 필요한 데이터는 SSR에 유지하되 DB/cache 우선, API fallback, 블록별 실패 격리로 안정화한다.
- DB에 모든 데이터를 복제하지 않는다. URL 생존과 첫 HTML에 필요한 shell/preview만 우선 저장하거나 캐시한다.

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
7. team slug/name이 부족한 팀은 match 상세의 `home-vs-away` canonical 생성에서도 placeholder slug를 만들 수 있었다.

team은 DB shell이 이미 충분한 편이라, player/match보다 더 DB 우선으로 가져가기 좋다. 다만 DB에 없는 overview 데이터는 API fallback이 필요하므로, 목표는 API 제거가 아니라 API 실패가 페이지 전체 실패로 번지는 것을 막는 것이다.

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
- `team`, `team-123`, `123` 같은 placeholder slug는 canonical로 쓰지 않는다.
- team slug가 부족하면 team 상세뿐 아니라 match 상세 canonical도 품질이 떨어지므로 backfill 대상이다.

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

이번 변경에서는 preview를 제거하지 않는다. "overview SSR이 무겁다"는 말은 preview를 빼라는 뜻이 아니라, preview를 만드는 방식이 외부 API 실시간 호출에 과하게 묶이지 않게 하라는 뜻이다. 대신 team shell-first, canonical 404 완화, metadata 경량화를 먼저 적용했다.

최선의 후속 방향:

- preview SSR은 유지한다.
- preview 블록별로 `unstable_cache` key와 TTL을 분리한다.
- rankings/transfers/standings/recent/upcoming 각각 실패 격리를 적용한다.
- 전체 squad/transfers/standings를 매번 새로 계산하지 않고 overview preview payload를 작게 유지한다.
- DB/cache miss인 블록만 API fallback을 호출한다.
- API fallback 성공 시 다음 요청을 위해 preview cache 또는 최소 shell을 저장한다.
- API fallback 실패 시 해당 블록만 fallback UI/빈 preview/이전 캐시로 처리하고, 팀 페이지 전체는 가능한 한 유지한다.

권장 처리 순서:

```txt
1. team shell 조회
2. overview preview별 DB/cache 조회
3. miss인 preview만 API fallback
4. API 성공 결과 write-back
5. 실패한 preview만 fallback 처리
6. team shell이 있으면 페이지 200 유지
```

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

정책을 더 구체적으로 쓰면 다음과 같다.

- team shell은 SSR의 기반 데이터이므로 DB 우선이다.
- team slug는 team 상세 URL뿐 아니라 match 상세의 `home-vs-away` slug 재료다.
- `team-숫자` placeholder는 URL 생존용 fallback이 아니라 품질 문제로 보고 보정한다.
- overview preview는 SSR에 남기되 block별 cache와 fallback을 둔다.
- 전체 탭 데이터는 필요에 따라 탭 SSR 또는 기존 API/cache 경로를 유지한다.
- temporary API failure는 block fallback 대상이다.
- real missing은 404 또는 noindex missing 처리 대상이다.

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
2. overview preview는 SSR 유지가 요구사항이다. client lazy load로 무조건 빼지 말고 preview별 `unstable_cache`/TTL/실패 격리를 적용한다.
3. `fetchTeamData()` 내부의 `teams/statistics` 호출도 overview에서 더 가볍게 하려면 `fetchTeamStats` 옵션 또는 stats cache 분리가 필요하다.
4. team sitemap에서 slug 없는 약 70개 팀은 shell 기반 slug 저장/backfill을 별도로 수행하면 더 좋다.
5. match canonical에서 `team-숫자-vs-team-숫자`가 다시 나오지 않도록 `football_teams`의 `name`, `display_name`, `slug` 누락 팀을 주기적으로 점검한다.
6. API fallback으로 확인된 신규 팀은 리그/country 조건이 맞으면 가능한 한 shell로 저장해 다음 match slug 생성에서 DB만으로 해결되게 한다.

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
