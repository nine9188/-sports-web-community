# 13. Transfers

대상 route:
- `src/app/(site)/transfers/page.tsx`
- `src/app/(site)/transfers/team/[id]/page.tsx`
- `src/app/(site)/transfers/team/[id]/[slug]/page.tsx`

관련 파일:
- `src/domains/livescore/components/football/transfers/TransferFilters.tsx`
- `src/domains/livescore/components/football/transfers/TransferLeagueGroups.tsx`
- `src/domains/livescore/components/football/transfers/TransfersPageContent.tsx`
- `src/domains/livescore/actions/transfers/index.ts`
- `src/domains/livescore/actions/transfers/transferTeams.ts`
- `src/domains/livescore/utils/entityLinks.ts`

## 점검 기준

- 상세 / 목록 페이지가 기본적으로 Server Component인지 확인한다.
- query 상태 URL이 canonical URL과 섞이지 않는지 확인한다.
- metadata와 본문이 같은 데이터를 불필요하게 중복 조회하지 않는지 확인한다.
- redirect 경로가 query state를 적절히 보존하는지 확인한다.
- client boundary가 실제 상호작용에만 쓰이는지 확인한다.

## 발견한 문제

### 1. `/transfers`의 query 변형 URL이 검색 정책에서 분리되지 않았다

`/transfers`는 `team`, `type`, `page` query를 받지만, 실제로는 `team`이 유효할 때만 팀 상세로 redirect하고 나머지 query는 본문 의미를 바꾸지 않는다.

즉 다음 같은 URL은 base hub와 사실상 같은 HTML을 보여준다.
- `/transfers?type=in`
- `/transfers?page=2`
- `/transfers?team=invalid`

그런데 `generateMetadata()`는 `searchParams`를 받지 않고 `noindex`도 넣지 않는다.
그래서 base hub와 동일한 내용의 query URL이 검색 색인에 섞일 수 있다.

### 2. `/transfers/team/[id]/[slug]`의 `type` / `page` 상태 URL도 indexable이다

팀 이적시장 페이지는 `type`과 `page`를 실제 상태 값으로 사용한다.
- `type=in|out|all`
- `page=1, 2, ...`

본문은 이 query를 기준으로 다른 이적 목록을 보여주지만, `generateMetadata()`는 `searchParams`를 보지 않는다.
그 결과 canonical base URL은 정리되어 있어도, `?type=...` / `?page=...` 변형 URL이 그대로 indexable 상태로 남는다.

이건 게시글/선수 상세에서 처리했던 query state 정책과 같은 문제다.

### 3. client boundary는 필요한 부분이지만, root hub는 더 서버 중심으로 볼 수 있다

`TransferFilters`와 `TransferLeagueGroups`는 각각 필터 조작과 펼침/접기 상태가 필요해서 client component가 맞다.
다만 root hub는 정적 소개 + 리그 그룹 목록이 중심이므로, query 정책만 정리하면 구조적으로는 충분히 서버 중심으로 유지할 수 있다.

## 확인 결과

- `src/app/(site)/transfers/page.tsx`는 Server Component다.
- valid `team` query는 서버에서 팀 상세로 redirect한다.
- `TransfersPageContent`는 서버에서 데이터 조합을 마치고, 필터/그룹만 client island로 넘긴다.
- `getTransferLeagueTeamGroups()`와 `getAllTeams()` / `getAllLeagues()`는 캐시를 쓰므로, 현재 route의 핵심 문제는 데이터 중복보다 URL 정책 쪽이다.

## 수정 방향

### 1. `/transfers`는 query가 남는 경우 `noindex`로 정리했다

root hub는 canonical 기준을 `/transfers` 단일 URL로 둔다.
query가 남는 경우는 검색용 정규 URL이 아니라 상태/오타/예외 URL로 보고 `generateMetadata()`에서 `noindex`를 넣었다.

### 2. `/transfers/team/[id]/[slug]`는 `type` / `page` query를 `noindex`로 묶었다

`generateMetadata()`가 `searchParams`를 받도록 바꾸고, `type`이나 `page`가 있으면 `noindex`를 넣는다.
canonical은 정규화된 팀 이적시장 URL로 유지하고, query는 탐색용 상태로만 취급한다.

### 3. redirect 경로는 지금처럼 query state를 보존했다

`/transfers`와 `/transfers/team/[id]`의 redirect에서 `type` / `page`를 보존하는 현재 구조는 유지한다.
다만 색인 정책만 `noindex`로 분리해서, 이동 UX와 SEO 정책을 동시에 맞춘다.

## 검증

- `npm.cmd run typecheck` 통과
- `npm.cmd run build` 통과

## 결론

13번 이적시장은 수정 완료했다.
핵심 수정은 root hub와 팀 상세의 query state URL을 `noindex`로 정리해서 canonical URL과 검색 노출 정책을 분리한 것이다.
