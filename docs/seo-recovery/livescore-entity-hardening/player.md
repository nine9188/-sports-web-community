# Player Detail Hardening

## Status

2026-05-16 기준 player 상세 페이지 hardening 1차 구현은 완료했다.

목표는 `/livescore/football/player/[id]/[slug]`가 metadata, canonical slug, 기본 프로필 표시를 위해 매번 API-Football에 의존하지 않게 만드는 것이다. API-Football은 그대로 사용하지만, SEO와 라우팅에 필요한 최소 player shell은 `football_players` DB를 먼저 사용한다.

중요한 전제:

- SSR을 제거하지 않는다.
- 선수 상세에 필요한 데이터를 임의로 제거하지 않는다.
- DB shell에 없는 상세 탭 데이터는 API fallback 또는 기존 cache 경로를 계속 사용한다.
- API fallback 성공 시 팀 ID가 확인되는 선수는 최소 shell을 DB에 저장한다.
- API temporary failure는 player URL 전체 장애가 아니라 shell fallback 또는 탭별 fallback으로 처리한다.

## 문제 요약

기존 player 상세 구조는 다음 이유로 Googlebot 재크롤 burst 때 무거워질 수 있었다.

1. `generateMetadata()`에서 `fetchCachedPlayerData(id)`를 호출했다.
2. metadata 내부에서 다시 `getSafePlayerKoreanName()`와 `getSafeTeamById()`를 호출했다.
3. 본문에서 `resolvePlayerCanonicalSlug(playerId)`를 호출했다.
4. 본문에서 다시 `fetchPlayerFullData(playerId, options)`를 호출했다.
5. `resolvePlayerCanonicalSlug()`는 DB slug가 없으면 API `players/profiles`, API `players` fallback을 탔다.
6. canonical slug가 없으면 `/player/[id]/[slug]` 본문이 바로 404가 될 수 있었다.
7. `fetchPlayerData()`는 DB row가 있고 fresh한 경우에도 fresh API 조회를 시도하는 흐름이 있었다.

이 구조는 DB에 이미 있는 선수까지 Googlebot 요청마다 불필요하게 API fallback 후보가 될 수 있다.

문제의 핵심은 SSR 자체가 아니다. 선수 상세는 SEO 페이지이므로 SSR이 필요하다. 문제는 metadata, slug, 기본 프로필처럼 가벼운 영역까지 full player data/API fallback에 묶이는 것이다.

## DB 확인 결과

MCP로 확인한 `football_players` 주요 상태:

- `football_players`: 9,685 rows
- `slug`: 대부분 보유
- `team_id`: NOT NULL
- `korean_name`: 대부분 보유
- `api_data`: 상당수 보유
- `photo_cached_url`: 현재 거의 비어 있음
- `asset_cache`: `player_photo` ready row가 다수 존재

`football_players` shell에 실제로 있는 주요 컬럼:

- `player_id`
- `name`
- `korean_name`
- `display_name`
- `team_id`
- `team_name`
- `position`
- `number`
- `nationality`
- `nationality_ko`
- `age`
- `height`
- `weight`
- `photo_url`
- `photo_cached_url`
- `slug`
- `is_active`
- `last_api_sync`
- `api_data`
- `updated_at`

결론:

- player metadata, canonical slug, breadcrumb, 기본 프로필 shell은 대부분 DB만으로 처리 가능하다.
- DB에 없는 선수는 계속 API fallback이 필요하다.
- 다만 `team_id`가 NOT NULL이라, API profile-only 응답처럼 팀을 알 수 없는 선수는 DB에 무리해서 저장하지 않는다.

## 코드 변경

### 1. Player shell read path 추가

파일:

- `src/domains/livescore/actions/player/playerShell.ts`

추가한 역할:

- `football_players.player_id`로 DB shell을 먼저 조회
- `football_teams`를 붙여 팀 이름, 한국어 팀명, slug, logo, 리그 shell을 보강
- DB shell이 있으면 API 호출 없이 `PlayerShellResult` 반환
- DB shell이 없을 때만 API-Football `players` fallback
- `players` fallback도 실패하면 `players/profiles` fallback
- API fallback 성공 시 팀 ID가 있는 경우에만 `football_players`에 최소 shell upsert
- API temporary failure와 real missing을 구분

반환 타입:

```ts
type PlayerShellResult =
  | { status: 'found'; shell: PlayerShell; source: 'db' | 'api' }
  | { status: 'missing' }
  | { status: 'temporary-error'; error: string };
```

저장 기준:

- `players` API에서 `team.id`가 확인되는 경우만 upsert한다.
- `team_id`가 없는 profile-only 응답은 현재 DB 제약상 저장하지 않는다.
- 이 선택은 DB schema를 크게 바꾸지 않고, 잘못된 `team_id` placeholder를 만들지 않기 위한 것이다.

### 2. Canonical slug를 shell-first로 변경

파일:

- `src/domains/livescore/actions/player/slug.ts`

변경 전:

- DB REST slug 조회
- 없으면 API `players/profiles`
- 없으면 API `players`

변경 후:

- `fetchCachedPlayerShell(playerId)`를 먼저 사용한다.
- shell에 slug가 있으면 그대로 사용한다.
- slug가 없으면 shell 이름으로 `getPlayerLinkSlug()`를 만든다.
- shell도 없을 때만 기존 API fallback을 유지한다.

핵심 효과:

- DB에 있는 선수의 canonical slug 생성은 API 없이 끝난다.
- API fallback으로 한 번 확인된 선수는 팀 ID가 있으면 DB shell로 저장되어 다음 요청부터 가벼워진다.

### 3. Metadata를 shell-first로 변경

파일:

- `src/app/(site)/livescore/football/player/[id]/[slug]/page.tsx`

변경 전:

- `generateMetadata()`가 `fetchCachedPlayerData(id)`를 호출했다.
- metadata 안에서 한국어 이름과 팀 매핑을 별도로 조회했다.

변경 후:

- `generateMetadata()`는 `fetchCachedPlayerShell(id)`를 먼저 사용한다.
- 선수명, 국적, 소속팀, 포지션, 사진은 shell에서 가져온다.
- DB/API shell이 없을 때만 noindex missing metadata를 반환한다.

핵심 효과:

- metadata 생성이 full player data path에서 분리됐다.
- Googlebot이 metadata만 요청하는 상황의 API 의존도가 줄었다.

### 4. Player 본문 canonical 404 완화

파일:

- `src/app/(site)/livescore/football/player/[id]/[slug]/page.tsx`

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
- 사용자가 이미 usable slug로 들어온 경우에는 `fetchPlayerFullData()` 또는 shell fallback으로 렌더링을 시도할 수 있다.

### 5. Full data 실패 시 shell fallback 추가

파일:

- `src/domains/livescore/actions/player/data.ts`

변경 전:

- `fetchPlayerFullData()`에서 `playerData`가 없으면 실패 응답을 반환했다.

변경 후:

- `playerData`가 없을 때 `fetchCachedPlayerShell(playerId)`를 확인한다.
- shell이 있으면 `PlayerFullDataResponse` 형태의 최소 응답을 만들어 반환한다.
- 기본 프로필, 팀, 리그, 사진, 포지션 정도만 채우고 상세 탭 데이터는 비워둔다.

핵심 효과:

- API temporary failure가 전체 player URL의 즉시 404로 번지는 위험을 줄인다.
- DB에 있는 선수는 최소 프로필 화면까지는 유지할 수 있다.

### 6. Fresh DB player의 불필요한 API 조회 제거

파일:

- `src/domains/livescore/actions/player/player.ts`

변경 전:

```ts
if (dbPlayerData && hasPlayerBio(dbPlayerData) && !isPlayerProfileStale(dbPlayerData)) {
  const freshApiPlayerData = await fetchFreshPlayerDataFromApi(id);
  return freshApiPlayerData
    ? mergePlayerProfileFromApi(dbPlayerData, freshApiPlayerData)
    : dbPlayerData;
}
```

변경 후:

```ts
if (dbPlayerData && hasPlayerBio(dbPlayerData) && !isPlayerProfileStale(dbPlayerData)) {
  return dbPlayerData;
}
```

핵심 효과:

- 이미 fresh한 DB 선수는 API를 다시 확인하지 않는다.
- Googlebot burst 때 DB에 있는 선수들의 API fan-out을 줄인다.

## API와 DB 의존성에 대한 결론

API를 제거한 것이 아니다. 현재 서비스는 DB에 모든 선수의 모든 시즌 통계, fixture, trophies, transfers, injuries를 저장하지 않는다.

이번 변경의 방향은 다음과 같다.

- DB에는 URL 생존과 SEO에 필요한 최소 player shell만 둔다.
- 선수 상세 탭의 통계, 경기, 트로피, 이적, 부상, 랭킹은 계속 API 또는 기존 캐시 경로를 사용한다.
- DB에 있는 선수는 metadata와 slug 생성을 API 없이 처리한다.
- DB에 없는 선수는 API fallback으로 열고, 팀 ID가 확인되면 다음 요청을 위해 최소 shell을 저장한다.

즉, "외부 데이터를 DB 없이 쓰지 않는다"가 아니라 "모든 데이터를 DB에 복제하지 않고, 크롤링 URL이 죽지 않게 하는 최소 데이터만 DB에 둔다"가 맞다.

운영 기준:

- metadata, canonical slug, 기본 player profile은 DB shell 우선이다.
- DB shell이 없으면 API fallback을 사용한다.
- API fallback이 성공하고 팀 ID가 확인되면 `football_players` shell을 upsert한다.
- 통계, 경기, 트로피, 이적, 부상, 랭킹 같은 상세 탭 데이터는 API 또는 기존 cache 경로를 유지한다.
- 상세 탭 데이터 중 하나가 실패해도 DB shell이 있으면 player 페이지 전체는 가능한 한 유지한다.
- DB shell도 없고 API에서도 player를 찾지 못하면 404 또는 noindex missing 처리가 맞다.

## 404 완화 범위

완화된 경우:

- `football_players`에 해당 `player_id`가 있는 선수 URL
- canonical slug 생성이 실패했지만 요청 slug가 usable한 선수 URL
- full player data path가 실패했지만 DB/API shell이 있는 선수 URL
- API fallback 성공 후 팀 ID가 확인되어 DB shell로 저장된 신규 선수 URL

여전히 404 또는 missing 처리가 맞는 경우:

- `player_id`가 숫자가 아닌 경우
- 요청 slug가 `player`, `player-123`, `123` 같은 unusable slug인 경우
- DB shell도 없고 API에서도 선수를 찾지 못하는 경우
- API profile-only 응답인데 팀 ID가 없어 DB에 저장할 수 없고 이후 API도 계속 실패하는 경우

## 남은 운영 작업

1. `asset_cache`의 `player_photo` ready row를 `football_players.photo_cached_url`로 backfill할지 결정한다.
2. DB에 없는 profile-only 선수까지 저장해야 한다면 `football_players.team_id` nullable 전환 또는 별도 `player_shells` 테이블이 필요하다.
3. player sitemap에서 `isWorthlessSitemapPlayer()` 기준과 신규 shell 저장 기준을 다시 맞추면 sitemap 품질이 더 좋아진다.
4. match와 동일하게 player도 운영 로그에서 API 호출 수와 404 변화를 확인해야 한다.

## Verification

아래 검증을 통과했다.

```bash
npm.cmd run typecheck
npm.cmd run build
```

빌드 결과:

- TypeScript compile 통과
- Next.js production build 통과
- `/livescore/football/player/[id]`
- `/livescore/football/player/[id]/[slug]`
- player sitemap route 포함 전체 app build 성공
