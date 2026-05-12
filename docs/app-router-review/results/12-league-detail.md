# 12. League detail

대상 route:
- `src/app/(site)/livescore/football/leagues/[id]/[slug]/page.tsx`
- `src/app/(site)/livescore/football/leagues/[id]/page.tsx`

관련 파일:
- `src/domains/livescore/components/football/leagues/LeagueHeader.tsx`
- `src/domains/livescore/components/football/leagues/LeagueStandingsTable.tsx`
- `src/domains/livescore/components/football/leagues/LeagueRankingsSection.tsx`
- `src/domains/livescore/components/football/leagues/LeagueTeamsList.tsx`
- `src/domains/livescore/components/football/leagues/CupRoundsView.tsx`
- `src/domains/livescore/actions/footballApi.ts`

## 점검 기준

- 상세 페이지가 기본적으로 Server Component인지 확인한다.
- canonical slug 정규화가 일관적인지 확인한다.
- metadata와 본문이 같은 데이터를 중복 조회하지 않는지 확인한다.
- redirect 경로가 불필요한 추가 조회를 만들지 않는지 확인한다.
- client boundary가 꼭 필요한 부분만 hydrate하는지 확인한다.

## 발견한 문제

### 1. metadata와 본문이 같은 리그 상세를 각각 다시 읽는다

`[slug]/page.tsx`의 `generateMetadata()`와 본문 `LeaguePageContent()`가 둘 다 `fetchLeagueDetails(id)`를 호출한다.
`fetchLeagueDetails()` 자체에는 상위 레벨 캐시 래퍼가 없어서, 같은 리그 기본 정보와 로고 조회가 metadata / 본문에서 각각 한 번씩 다시 발생한다.

이 route는 `standings`, `rankings`, `cup rounds` 같은 무거운 섹션도 같이 붙기 때문에, 기본 리그 정보까지 중복 조회되는 구조는 불필요한 비용이다.

### 2. `/leagues/[id]` redirect도 별도 조회를 한 번 더 만든다

`[id]/page.tsx`는 canonical slug로 보내기 위해 `fetchLeagueDetails(id)`를 먼저 읽는다.
주석에는 slug가 상수 기반이라 DB 호출이 불필요하다고 적혀 있지만, 현재 구현은 실제로 리그 API를 한 번 더 호출해서 slug를 계산한다.

즉 `/livescore/football/leagues/[id]`로 들어오면 redirect용 조회 1회, canonical 페이지의 metadata 1회, 본문 1회까지 같은 리그 기본 정보가 반복될 수 있다.

### 3. client island가 여러 개라서 상단 shell의 순수 서버 영역을 더 줄일 여지는 있다

`LeagueHeader`, `LeagueStandingsTable`, `LeagueRankingsSection`, `LeagueTeamsList`, `CupRoundsView`가 모두 client component다.
이 중 일부는 인터랙션이 필요해서 유지할 수 있지만, `LeagueHeader`처럼 다크모드 로고 전환만 위해 client state를 쓰는 부분은 hydration 비용을 더 줄일 여지가 있다.

다만 이건 1, 2번처럼 바로잡아야 하는 핵심 문제라기보다 후순위 최적화 후보에 가깝다.

## 확인 결과

- `page.tsx` 자체는 Server Component다.
- canonical slug는 `getLeagueSlug()`와 `normalizeRouteSlug()`로 정규화하고 있다.
- query state URL은 없어서 `tab` / `page` 같은 `noindex` 대상은 아니다.
- 리그 순위, 득점/도움 순위, 컵 대진표는 서버에서 섹션 단위로 조립한다.
- `getLeagueLogoUrl`, `getLeagueLogoUrls` 쪽은 일부 캐시가 있지만, 상위 리그 상세 조회는 아직 캐시되지 않았다.

## 수정 방향

### 1. 리그 상세 조회를 route 공용 로더로 묶었다

`src/domains/livescore/actions/footballApi.ts`의 `fetchLeagueDetails()`를 `unstable_cache` + `cache`로 감쌌다.
이제 metadata와 본문이 같은 리그 상세를 재사용하고, 동일 요청 내 중복 호출도 줄인다.

### 2. redirect slug 해석도 DB 캐시를 우선 쓰도록 바꿨다

`src/app/(site)/livescore/football/leagues/[id]/page.tsx`는 `fetchLeagueDetails()` 대신 `getLeagueById()`를 먼저 사용한다.
리그 slug 계산은 DB 캐시된 메타데이터로 처리하고, 불필요한 API 조회를 없앴다.

### 3. client boundary는 실제 필요분만 남겼다

`LeagueHeader`의 다크모드 전환용 client state를 제거하고 서버 컴포넌트로 내렸다.
남은 client island는 `CupRoundsView`처럼 실제 접기/펼치기 상태가 필요한 블록과, 이미지 fallback 처리가 필요한 표시용 컴포넌트들뿐이다.

## 검증

- `npm.cmd run typecheck` 통과
- `npm.cmd run build` 통과

## 결론

12번 리그 상세는 수정 완료했다.
핵심 수정은 리그 기본 정보의 중복 조회를 캐시로 묶고, `/leagues/[id]` redirect는 DB 캐시를 우선 쓰도록 정리한 것이다.
