# Match Detail Hardening

## Status

2026-05-16 기준 match 상세 페이지 hardening 1차 구현은 완료했다.

2026-05-17 추가 보강:

- `team-16476-vs-team-1988`, `team-104-vs-team-1301` 같은 placeholder match slug 생성을 차단했다.
- match canonical slug가 DB shell만으로 정상 팀명을 만들 수 없으면 highlight title, API fallback 순서로 실제 팀명을 다시 확인하도록 조정했다.
- match SSR preload 중 `getSupabaseAction()`을 읽기 함수에서 사용해 쿠키 설정 에러가 찍히던 문제를 분리했다.

목표는 Googlebot 재크롤 burst 때 `/livescore/football/match/[id]/[slug]`가 매 요청마다 무거운 `fixtures?id` API에 의존하지 않도록 만드는 것이다. API-Football은 그대로 사용하지만, SEO와 라우팅에 필요한 최소 데이터는 DB `fixtures` shell을 먼저 사용한다.

중요한 전제:

- SSR을 제거하지 않는다.
- 경기 상세에 필요한 데이터를 임의로 제거하지 않는다.
- DB shell에 없는 상세 데이터는 API fallback을 계속 사용한다.
- API fallback 성공 시 최소 shell을 DB에 저장해서 다음 요청을 가볍게 만든다.
- API temporary failure는 match URL 전체 장애가 아니라 해당 데이터 영역의 fallback으로 처리한다.

## 문제 요약

기존 match 상세 구조는 다음 이유로 Googlebot 대량 접근 시 timeout/server connection failed 후보가 된다.

1. `generateMetadata()`가 `fetchCachedMatchFullData()`를 호출했다.
2. canonical slug 생성도 `fetchCachedMatchFullData()`를 호출했다.
3. 본문 렌더링도 다시 `fetchCachedMatchFullData()`를 호출했다.
4. `resolveCanonicalMatchSlug()`가 실패하면 `/match/[id]/[slug]` 본문이 바로 404로 갈 수 있었다.
5. `footballApi.ts`에서 `fixtures?id` 요청은 항상 `no-store`라서 Next fetch cache/revalidate 효과를 거의 못 받았다.
6. `sync-fixtures`가 오래된 fixture row를 삭제해서, 이미 크롤링된 과거 match URL의 DB shell이 사라질 수 있었다.
7. DB shell에 팀 ID만 있고 팀 이름/slug가 없으면 `Team 16476` 같은 fallback 이름이 `team-16476` slug로 변환될 수 있었다.
8. SSR preload에서 읽기용 prediction 함수가 `getSupabaseAction()`을 사용해 Supabase token refresh 후 쿠키 설정 실패 로그를 만들 수 있었다.

이 구조는 일반 유저 트래픽에서는 눈에 잘 안 띄지만, Googlebot이 sitemap에 있는 match URL을 한꺼번에 재크롤하면 API/DB 연결 실패와 404가 늘어날 수 있다.

문제의 핵심은 SSR 자체가 아니다. 경기 상세는 SEO 페이지이므로 SSR이 필요하다. 문제는 SSR 첫 응답이 매번 외부 `fixtures?id` API, 이벤트, 라인업, 통계 같은 무거운 데이터에 직접 묶이는 것이다.

## DB 확인 결과

MCP로 확인한 주요 테이블 상태:

- `fixtures`: 1,849 rows
- `football_teams`: 1,368 rows
- `leagues`: 37 rows
- `match_highlights`: 1,294 rows
- `asset_cache`: 83,509 rows
- `match_cache`: 현재 public REST 기준으로 없음 또는 노출 안 됨

기존 `fixtures`에는 다음 shell 수준 컬럼만 있었다.

- `fixture_id`
- `home_team_id`
- `away_team_id`
- `league_id`
- `season`
- `match_date`
- `status_short`
- `round`
- `updated_at`

기존에는 score, status long, venue가 없어서 match metadata title과 JSON-LD를 안정적으로 만들기에는 부족했다.

## DB 변경

Supabase MCP migration으로 아래 컬럼과 인덱스를 추가했다.

```sql
alter table public.fixtures
  add column if not exists home_goals integer,
  add column if not exists away_goals integer,
  add column if not exists status_long text,
  add column if not exists venue_name text,
  add column if not exists venue_city text;

create index if not exists idx_fixtures_status_short on public.fixtures(status_short);
create index if not exists idx_fixtures_match_date on public.fixtures(match_date);
```

의도:

- `home_goals`, `away_goals`: 종료 경기 title/metadata에서 `0 - 1` 같은 점수 표시
- `status_long`: API 없이도 `Match finished`, `Not started` 등 상태명 구성
- `venue_name`, `venue_city`: JSON-LD `SportsEvent.location` fallback
- `status_short`, `match_date` index: sitemap/SEO/상태 기준 조회 부담 완화

## 코드 변경

### 1. Match shell read path 추가

파일:

- `src/domains/livescore/actions/match/matchShell.ts`

추가한 역할:

- `fixtures.fixture_id`로 DB shell을 먼저 조회
- `football_teams`에서 홈/원정 팀 이름, 한국어 이름, slug, logo를 보강
- `leagues` 매핑에서 리그 이름, 국가, 로고, flag를 보강
- DB shell이 없을 때만 API-Football `fixtures?id` fallback
- API fallback 성공 시 `fixtures`에 shell upsert
- API temporary failure와 real missing을 구분

반환 타입:

```ts
type MatchShellResult =
  | { status: 'found'; shell: MatchShell; source: 'db' | 'api' }
  | { status: 'missing' }
  | { status: 'temporary-error'; error: string };
```

핵심 효과:

- metadata와 canonical slug가 full match detail API를 직접 타지 않아도 된다.
- API가 일시적으로 실패해도 DB shell이 있으면 페이지 라우팅과 SEO 기본값을 유지할 수 있다.

### 2. Match slug를 shell-first로 변경

파일:

- `src/domains/livescore/actions/match/matchSlug.ts`

변경 전:

- `resolveCanonicalMatchSlug()`가 `fetchCachedMatchFullData()`를 호출했다.
- slug 하나 만들기 위해 full match data path가 열렸다.

변경 후:

- `fetchCachedMatchShell()`을 먼저 사용한다.
- 팀 ID 기반으로 `football_teams.slug`를 조회해서 `homeSlug-vs-awaySlug`를 만든다.
- 팀 slug가 부족하면 shell team name 기반 slug를 시도한다.
- 단, `team-123`, `Team 123`, `match-123` 같은 placeholder slug는 canonical 후보로 인정하지 않는다.
- DB shell로 정상 slug를 만들 수 없으면 `match_highlights.video_title` 기반 추출을 시도한다.
- highlight title도 없거나 불충분하면 마지막으로 API `fixtures?id` fallback에서 실제 팀명을 확인한다.

핵심 효과:

- canonical slug 생성 비용이 줄었다.
- API temporary failure 때문에 slug 생성이 바로 실패할 가능성이 줄었다.
- placeholder slug가 sitemap/canonical/internal link로 퍼지는 것을 막는다.

### 3. Metadata를 shell-first로 변경

파일:

- `src/app/(site)/livescore/football/match/[id]/[slug]/page.tsx`

변경 전:

- `generateMetadata()`에서 `fetchCachedMatchFullData(id, { all false })`를 호출했다.
- metadata 생성만으로도 `fixtures?id` API path가 열렸다.

변경 후:

- `generateMetadata()`는 `fetchCachedMatchShell(id)`만 호출한다.
- DB shell에 점수가 있으면 `home 2 - 1 away`, 없거나 예정 경기면 `home vs away`로 title을 만든다.
- canonical path는 `resolveCanonicalMatchSlug(id)` 결과를 우선 사용하고, 없으면 현재 slug 기반 path로 fallback한다.
- `tab` query가 있으면 기존처럼 `noindex`를 유지한다.

핵심 효과:

- Googlebot이 head/meta만 읽는 상황에서도 full match API 호출을 줄인다.
- score 컬럼이 아직 비어 있는 옛 row는 `vs`로 안전하게 표시한다.

### 4. 본문 canonical redirect 404 완화

파일:

- `src/app/(site)/livescore/football/match/[id]/[slug]/page.tsx`

변경 전:

- `canonicalSlug`가 없으면 `notFound()`로 처리했다.

변경 후:

- `canonicalSlug`가 있을 때만 slug mismatch redirect를 수행한다.
- `canonicalSlug`가 없으면 현재 요청 slug로 본문 렌더링을 계속 시도한다.
- JSON-LD URL도 `canonicalSlug || slug`를 사용한다.

핵심 효과:

- slug 생성 fallback이 실패해도 실제 match data 또는 fixture shell이 있으면 바로 404로 떨어지지 않는다.

### 5. Full data 실패 시 shell fallback 추가

파일:

- `src/domains/livescore/actions/match/matchData.ts`

변경 전:

- `fetchCachedMatchData(matchId)`가 실패하면 `success: false`가 반환됐다.
- 이 경우 본문은 `notFound()`로 갈 수 있었다.

변경 후:

- `fetchCachedMatchData(matchId)` 실패 시 `fetchCachedMatchShell(matchId)`를 한 번 더 확인한다.
- shell이 있으면 `MatchFullDataResponse` 형태의 최소 응답을 만들어 반환한다.
- 이벤트, 라인업, 통계, 순위 같은 상세 탭 데이터는 API/개별 action에 계속 의존한다.

핵심 효과:

- API-Football이 순간적으로 실패해도 DB에 fixture shell이 있는 match 상세는 최소 페이지로 살아남는다.
- 이것은 외부 API를 없앤다는 뜻이 아니라, API 장애가 SEO URL 전체 장애로 번지는 것을 막는 방어층이다.

주의:

- 기존 row 중 `home_goals`, `away_goals`가 아직 null인 row는 shell fallback 본문에서 score가 `0` fallback으로 들어갈 수 있다.
- metadata는 null score일 때 `vs`를 쓰므로 title 쪽은 안전하다.
- 정확한 score shell을 채우려면 `sync-fixtures` 재실행 또는 별도 backfill이 필요하다.

### 6. Finished match cache 판정을 shell 기반으로 변경

파일:

- `src/domains/livescore/actions/match/matchData.ts`

변경 전:

- 완료 경기인지 확인하려고 `fetchCachedMatchData(matchId)`를 먼저 호출했다.

변경 후:

- `fetchCachedMatchShell(matchId)`의 `status.code`로 완료 여부를 판단한다.
- 완료 상태 `FT`, `AET`, `PEN`이고 events를 요구하지 않으면 기존 `unstable_cache` path를 유지한다.

핵심 효과:

- 캐시 여부 판정 자체가 full API path에 의존하지 않는다.

### 7. fixtures sync를 shell 보존형으로 변경

파일:

- `src/app/api/sync-fixtures/route.ts`

변경 전:

- 과거 60일보다 오래된 `fixtures` row를 삭제했다.
- score/status long/venue를 저장하지 않았다.

변경 후:

- `status_long`, `home_goals`, `away_goals`, `venue_name`, `venue_city`를 함께 upsert한다.
- 오래된 fixture row 삭제를 중단했다.
- 응답에 `cleanup: 'skipped: fixture shell rows are retained for crawled match URLs'`를 포함한다.

핵심 효과:

- 이미 크롤링된 과거 match URL의 최소 shell이 DB에 남는다.
- API가 실패해도 오래된 match URL이 404로 바뀌는 위험이 줄어든다.

### 8. `fixtures?id` no-store 정책 완화

파일:

- `src/domains/livescore/actions/footballApi.ts`

변경 전:

```ts
const shouldNoStore = options.cache === 'no-store' || (endpoint === 'fixtures' && queryParams.has('id'));
```

변경 후:

```ts
const shouldNoStore = options.cache === 'no-store';
```

핵심 효과:

- `fixtures?id`도 명시적으로 `cache: 'no-store'`를 주지 않는 한 endpoint별 `revalidate` 정책을 탈 수 있다.
- 현재 `fixtures` 기본 revalidate는 기존 `getRevalidateTime('fixtures')` 정책을 따른다.

### 9. Placeholder match slug 차단

파일:

- `src/domains/livescore/utils/slugs.ts`
- `src/domains/livescore/utils/entityLinks.ts`
- `src/domains/livescore/actions/match/matchSlug.ts`

문제 사례:

```txt
/livescore/football/match/1526530/team-16476-vs-team-1988
/livescore/football/match/1544684/team-104-vs-team-1301
```

원인:

- fixture shell에는 `home_team_id`, `away_team_id`가 있었지만, `football_teams` row나 slug/name 보강이 부족했다.
- `buildShellFromFixtureRow()`가 팀명이 없을 때 `Team ${id}`를 fallback name으로 사용했다.
- 기존 slug helper가 `Team 16476`을 정상 이름처럼 보고 `team-16476`으로 변환했다.

변경 후:

- `getTeamSlugFromName()`은 `team`, `team-숫자` 결과를 빈 slug로 취급한다.
- `getMatchSlug()`는 홈/원정 양쪽 정상 slug가 모두 있을 때만 `home-vs-away`를 만든다.
- `getMatchLinkSlug()`도 한쪽 팀만 있는 반쪽 slug를 만들지 않는다.
- `isUsableMatchSlug()`는 `team-숫자`가 포함된 match slug를 거부한다.
- canonical 생성은 DB team slug -> shell team name -> highlight title -> API fixture team name 순서로 시도한다.

정책:

- `team-숫자-vs-team-숫자`는 canonical URL로 절대 사용하지 않는다.
- 한쪽만 정상 팀명이고 다른 쪽이 `team-숫자`이면 match canonical을 만들지 않는다.
- 실제 팀명을 API fallback으로 확인할 수 있을 때만 사람이 읽을 수 있는 slug를 만든다.

### 10. SSR prediction preload 쿠키 로그 정리

파일:

- `src/domains/livescore/actions/match/predictions.ts`

문제 로그:

```txt
Cookies can only be modified in a Server Action or Route Handler
POST /auth/v1/token
```

원인:

- match page SSR에서 sidebar extras를 preload한다.
- 그 안에서 `getPredictionStats()`와 `getUserPrediction()`을 호출한다.
- 두 함수는 읽기 함수인데 `getSupabaseAction()`을 사용하고 있었다.
- Supabase가 서버 렌더 중 token refresh를 시도하면 쿠키를 쓰려고 하고, Server Component 컨텍스트에서는 쿠키 수정이 불가능해서 로그가 찍혔다.

변경 후:

- `getPredictionStats()`는 공개 통계 읽기이므로 `getSupabaseAdmin()`을 사용한다.
- `getUserPrediction()`은 현재 사용자별 읽기이므로 `getSupabaseServer()`를 사용한다.
- prediction 저장/삭제/수동 통계 갱신 같은 쓰기 함수는 계속 `getSupabaseAction()`을 사용한다.

정책:

- Server Component/SSR preload의 읽기 함수는 `getSupabaseServer()` 또는 `getSupabaseAdmin()`을 사용한다.
- 사용자 입력으로 상태를 바꾸는 Server Action만 `getSupabaseAction()`을 사용한다.
- 쿠키 설정 실패 로그가 있어도 페이지가 200이면 즉시 장애는 아니지만, SSR 중 token refresh와 auth API 호출이 늘어나므로 제거 대상이다.

## API와 DB 의존성에 대한 결론

API를 안 쓰는 구조로 바꾼 것이 아니다. 이 서비스는 DB에 모든 선수/매치/이벤트 데이터를 저장하지 않으므로 API-Football은 계속 필요하다.

이번 변경의 방향은 다음과 같다.

- DB에는 SEO와 라우팅에 필요한 최소 shell만 저장한다.
- score, status, venue처럼 작고 안정적인 필드는 `fixtures`에 보존한다.
- 이벤트, 라인업, 통계, 상세 선수 데이터처럼 크고 자주 바뀌는 데이터는 계속 API를 사용한다.
- API fallback이 성공하면 최소 shell을 DB에 upsert해서 다음 요청부터 더 가볍게 처리한다.

즉, "외부 데이터를 DB 없이 쓰지 않는다"가 아니라 "모든 데이터를 DB에 복제하지 않고, URL 생존에 필요한 최소 데이터만 DB에 둔다"가 맞다.

운영 기준:

- metadata, canonical slug, 기본 match header는 DB shell 우선이다.
- DB shell이 없으면 API fallback을 사용한다.
- API fallback이 성공하면 `fixtures` shell을 upsert한다.
- match slug는 홈/원정 양쪽의 정상 팀명이 확보된 경우에만 생성한다.
- `team-숫자` placeholder가 섞인 slug는 canonical 후보에서 제외한다.
- 이벤트, 라인업, 통계, 순위 같은 상세 데이터는 API 또는 기존 cache 경로를 유지한다.
- 상세 데이터 중 하나가 실패해도 DB shell이 있으면 match 페이지 전체는 가능한 한 유지한다.
- DB shell도 없고 API에서도 fixture를 찾지 못하면 404가 맞다.

## 404 완화 범위

완화된 경우:

- DB `fixtures`에 해당 `fixture_id`가 있는 match URL
- API가 일시 실패해도 shell이 남아 있는 match URL
- canonical slug 생성이 실패했지만 현재 slug로 접근한 match URL
- 오래된 match URL이 sync cleanup으로 fixture shell을 잃는 경우

여전히 404가 맞는 경우:

- DB shell도 없고 API에서도 해당 fixture를 찾지 못하는 경우
- `fixture_id`가 잘못됐거나 숫자가 아닌 경우
- 실제로 존재하지 않는 match URL

## 남은 운영 작업

1. `sync-fixtures`를 한 번 실행해서 새 컬럼을 채운다.
2. 과거 sitemap에 포함된 오래된 match까지 score/status/venue를 채우려면 별도 backfill route 또는 script가 필요하다.
3. `football_teams`에 없는 팀 name/slug를 backfill해야 `team-숫자` fallback 없이 DB shell만으로 canonical slug를 만들 수 있다.
4. 기존에 배포/캐시/sitemap에 노출된 `team-숫자-vs-team-숫자` URL은 새 canonical 생성 정책 배포 후 재검증한다.
5. match 상세의 이벤트/라인업/통계 탭은 여전히 API 의존적이다. 이 부분은 SEO 첫 응답보다 사용자 상호작용 영역에 가깝기 때문에 이번 범위에서는 유지했다.
6. SSR preload에서 `getSupabaseAction()`을 읽기 함수에 사용하는 패턴이 다른 match 하위 action에 남아 있는지 계속 점검한다.

## Verification

아래 검증을 통과했다.

```bash
npm.cmd run typecheck
npm.cmd run build
```

빌드 결과:

- TypeScript compile 통과
- Next.js production build 통과
- `/livescore/football/match/[id]`
- `/livescore/football/match/[id]/[slug]`
- `/api/sync-fixtures`
- match sitemap route 포함 전체 app build 성공

2026-05-17 추가 검증:

```bash
npm.cmd run typecheck
```

추가 확인:

- `team-숫자` placeholder slug guard TypeScript 통과
- prediction preload client 분리 TypeScript 통과
