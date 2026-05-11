# 08. Livescore football

대상 route:
- `src/app/(site)/livescore/football/page.tsx`

관련 파일:
- `src/domains/livescore/components/football/MainView/LiveScoreView.tsx`
- `src/domains/livescore/components/football/MainView/NavigationBar/index.tsx`
- `src/domains/livescore/components/football/MainView/LeagueMatchList/index.tsx`
- `src/domains/livescore/actions/footballApi.ts`

## 점검 기준

- 페이지 본문이 Server Component에서 초기 데이터를 받아오는지 확인한다.
- 날짜/라이브 필터 같은 query state가 canonical과 index 정책에 맞게 처리되는지 확인한다.
- 서버에서 받은 초기 경기 데이터를 client가 다시 불필요하게 가져오지 않는지 확인한다.
- navigation/search/filter는 client island로만 남기고, 페이지 shell은 서버에서 렌더링하는지 확인한다.

## 발견한 문제

### 1. query state URL이 인덱싱 가능하게 열려 있었다

`/livescore/football?date=...`와 `/livescore/football?filter=live`는 본문 내용은 거의 같은데 URL만 달라지는 상태 페이지다.
그런데 `generateMetadata()`에서 이 query URL들을 `noindex`로 막지 않고 있었다.

이 구조는 날짜별로 무한히 늘어나는 URL이 검색 엔진에 쌓일 수 있고, 라이브 필터 URL도 기본 페이지와 비슷한 변형 페이지로 중복 노출될 수 있다.

### 2. 라이브 필터 URL의 메타 정책이 기본 페이지와 분리되어 있지 않았다

`filter=live`는 제목은 다르지만 canonical은 기본 `/livescore/football`로 돌아가고 있었다.
그런데 검색 엔진에 그대로 노출되면 기본 페이지와 query 페이지가 같이 잡혀 canonical/noindex 정책이 애매해진다.

### 3. 본문 shell과 상호작용 영역은 이미 잘 분리돼 있었지만, 정책 문서가 없었다

`page.tsx`는 서버에서 경기 데이터를 받아 `LiveScoreView`에 넘기고,
`LiveScoreView` 안에서만 날짜 이동, 라이브 토글, 검색, 펼침/접기 같은 상호작용을 처리한다.
구조 자체는 App Router 기준에 맞지만, query URL 정책이 문서와 코드에서 명시돼 있지 않았다.

## 수정 내용

### 1. query state 페이지를 noindex로 처리했다

`src/app/(site)/livescore/football/page.tsx`의 `generateMetadata()`에서 query state가 있으면 `noindex`를 넣도록 했다.

적용 대상:
- `?date=...`
- `?filter=live`

이제 기본 페이지 `/livescore/football`만 indexable하고, 변형 query URL은 검색 노출을 막는다.

### 2. 기본 페이지와 query 페이지의 역할을 분리했다

기본 경로 `/livescore/football`는 오늘 기준의 대표 라이브스코어 페이지로 유지한다.
query URL은 사용자 탐색용 상태로만 취급하고, canonical 노출보다 검색 노출 방지를 우선한다.

### 3. client island는 유지하고 server shell은 그대로 두었다

`LiveScoreView.tsx`와 그 하위 `NavigationBar`, `LeagueMatchList`는 client island로 유지했다.
서버에서는 초기 경기 목록, live 경기 개수, 메타데이터, JSON-LD만 책임지고,
화면에서의 날짜 이동과 필터링은 client에서 처리한다.

이 구조는 `hydration 0`이 아니라 필요한 상호작용만 hydrate하는 형태로 유지된다.

## 검증

- `npm.cmd run typecheck` 통과
- `npm.cmd run build` 통과

## 결론

8번 라이브스코어 메인 페이지는 서버/클라이언트 경계는 크게 문제가 없었고,
핵심 이슈는 query URL의 index 정책이었다.
이제 기본 페이지는 indexable하게 두고, `date`/`filter` 변형 URL은 `noindex`로 정리했다.
