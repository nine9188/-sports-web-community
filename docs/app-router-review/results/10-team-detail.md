# 10. Team detail

대상 route:
- `src/app/(site)/livescore/football/team/[id]/[slug]/page.tsx`
- `src/app/(site)/livescore/football/team/[id]/page.tsx`

관련 파일:
- `src/domains/livescore/components/football/team/TeamPageClient.tsx`
- `src/domains/livescore/components/football/team/TabNavigation.tsx`
- `src/domains/livescore/components/football/team/TabContent.tsx`
- `src/domains/livescore/components/football/team/TeamHeader.tsx`
- `src/domains/livescore/actions/teams/team.ts`

## 점검 기준

- 상세 페이지가 기본적으로 Server Component인지 확인한다.
- canonical slug로 정규화되는 URL과 탭 query URL의 정책이 일관적인지 확인한다.
- tab 상태가 검색 인덱스와 중복 노출되지 않는지 확인한다.
- 서버가 사용자와 검색 크롤러에 서로 다른 본문을 보여주지 않는지 확인한다.
- 초기 overview 데이터를 server shell에서 잘 준비하는지 확인한다.

## 발견한 문제

### 1. `tab` query URL이 검색 정책에서 분리되지 않았다

팀 상세는 `?tab=overview|fixtures|standings|squad|transfers|stats` 형태로 상태를 URL에 둔다.
그런데 `generateMetadata()`는 `searchParams`를 받지 않고, `tab` 변형 URL을 `noindex`로 막지 않는다.

이 구조에서는 같은 팀 페이지가 탭마다 여러 URL로 열릴 수 있고, 검색 엔진 기준으로 기본 페이지와 탭 변형 페이지가 같이 노출될 수 있다.
탭은 실제 콘텐츠 분기이기도 하지만, 검색 노출 관점에서는 상태 URL이므로 별도 정책이 필요하다.

### 2. `/team/[id]` 리다이렉트가 tab 상태를 그대로 보존한다

`src/app/(site)/livescore/football/team/[id]/page.tsx`는 canonical slug로 리다이렉트할 때 `tab` query를 그대로 붙인다.
탐색 UX는 자연스럽지만, 메타 정책이 같이 맞춰지지 않으면 불필요한 변형 URL이 남는다.

### 3. 검색 크롤러와 일반 사용자에게 서로 다른 본문을 줄 수 있다

`TeamPageContent()`는 `headers()`의 user-agent를 보고 `isSearchCrawler()`일 때 `shouldFetchHeavyOverview`를 끈다.
즉, overview 탭에서 플레이어 랭킹/이적 preview 같은 일부 데이터는 검색 크롤러에게만 아예 안 내려갈 수 있다.

이 방식은 서버 비용 절감에는 도움이 되지만, 같은 URL이 사용자와 크롤러에게 다른 HTML을 주는 구조가 된다.
SEO 관점에서 중요한 overview 콘텐츠라면 문제가 될 수 있고, 적어도 어떤 데이터를 크롤러에서 빼는지 명시가 필요하다.

### 4. client boundary가 전체 팀 화면을 한 번에 감싼다

`TeamPageClient.tsx`가 `TeamHeader`, 광고 배너, `TabNavigation`, `TabContent`를 한꺼번에 묶고 있다.
`TabContent` 아래 탭들은 모두 client components를 조합하고 있어, 현재 구조는 사용자 상호작용엔 맞지만 클라이언트 범위가 넓다.

특히 `TeamHeader`는 이미지/배너 렌더링 위주라 정적 shell로 더 밀어낼 여지가 있다.

## 확인 결과

- `page.tsx`는 Server Component다.
- canonical slug는 `resolveTeamCanonicalSlug()`로 정규화하고 있다.
- 팀 상세는 `overview`, `fixtures`, `standings`, `squad`, `transfers`, `stats` 탭으로 분기한다.
- `TeamPageContent()`는 탭별로 필요한 서버 데이터를 선별해서 준비한다.
- `TeamPageClient`와 그 하위 탭 컴포넌트는 client island다.

## 수정 내용

### 1. 탭 query URL을 noindex로 정리

`src/app/(site)/livescore/football/team/[id]/[slug]/page.tsx`의 `generateMetadata()`가 `searchParams`를 받도록 바꿨다.
`tab` query가 있으면 `noindex`를 넣는다.

적용 대상:
- `/livescore/football/team/[id]/[slug]?tab=fixtures`
- `/livescore/football/team/[id]/[slug]?tab=standings`
- `/livescore/football/team/[id]/[slug]?tab=squad`
- `/livescore/football/team/[id]/[slug]?tab=transfers`
- `/livescore/football/team/[id]/[slug]?tab=stats`

기본 canonical은 정규화된 slug URL로 유지한다.
`/team/[id]` 리다이렉트는 유지하되 탭 변형 URL은 검색 제외로 정리했다.

### 2. 크롤러 전용 데이터 축소 정책을 재검토

`isSearchCrawler()`와 `shouldFetchHeavyOverview` 분기를 제거했다.
overview 탭은 사용자와 검색 크롤러 모두 같은 서버 데이터 준비 경로를 탄다.

이제 overview에서 플레이어 랭킹, 이적 preview, 최근/예정 경기, 순위 preview를 크롤러만 빼는 구조가 아니다.
SEO 관점에서 같은 URL의 HTML 차이를 줄였다.

### 3. client boundary를 더 얇게 나눌 수 있는지 검토

`src/domains/livescore/components/football/team/TeamPageClient.tsx`의 `"use client"`를 제거했다.
이제 `TeamPageClient`는 Server Component로 렌더되고, 실제 상호작용이 필요한 하위 탭 컴포넌트만 client island로 남는다.

남는 client island:
- `TabNavigation.tsx`
- `TabContent.tsx`
- `TeamHeader.tsx`

TeamHeader는 내부에서 이미지/다크모드 처리용 client 컴포넌트를 사용하므로 그대로 client 성격을 유지한다.

## 검증

- `npm.cmd run typecheck` 통과
- `npm.cmd run build` 통과

## 결론

10번 팀 상세는 수정 완료했다.
핵심 수정은 `tab` query URL을 `noindex`로 정리하고, overview의 crawler/user 분기와 `TeamPageClient`의 client boundary를 줄인 것이다.
이제 검색 노출은 정규화된 팀 URL 중심으로 유지되고, 탭 변형 URL은 상태 URL로만 취급된다.
