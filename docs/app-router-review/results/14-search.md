# 14. Search

대상 route:
- `src/app/(site)/search/page.tsx`

관련 파일:
- `src/domains/search/actions/index.ts`
- `src/domains/search/actions/searchPosts.ts`
- `src/domains/search/actions/searchComments.ts`
- `src/domains/search/actions/searchTeams.ts`
- `src/domains/search/actions/searchLogs.ts`
- `src/domains/search/components/SearchHeader.tsx`
- `src/domains/search/components/SearchResultsContainer.tsx`
- `src/domains/search/components/PostSearchResults.tsx`
- `src/domains/search/components/CommentSearchResults.tsx`
- `src/domains/search/components/TeamSearchResults.tsx`
- `src/domains/search/components/SearchPagination.tsx`

## 점검 기준

- 검색 페이지가 기본적으로 Server Component인지 확인한다.
- 검색어, 타입, 정렬, 페이지 query가 검색 노출 정책과 분리되는지 확인한다.
- 검색 결과를 서버에서 준비하되, 실제 상호작용만 client island로 남기는지 확인한다.
- 검색어 입력값이 렌더링 중 오류를 만들지 않는지 확인한다.
- 같은 검색에서 데이터 조회와 count 조회가 불필요하게 중복되지 않는지 확인한다.

## 발견한 문제

### 1. 검색어를 그대로 `RegExp`에 넣어서 렌더링 오류가 날 수 있다

`PostSearchResults.tsx`와 `CommentSearchResults.tsx`의 `highlightQuery()`는 검색어를 그대로 `new RegExp()`에 넣는다.

예시:
- `q=[`
- `q=(test`
- `q=*`
- `q=\`

이런 값은 정규식 문법 오류를 만들 수 있고, 검색 결과 렌더링 중 client component가 깨질 수 있다.
검색어는 사용자 입력이므로 하이라이트용 정규식을 만들기 전에 반드시 escape해야 한다.

### 2. `page` query 정규화가 없다

`src/app/(site)/search/page.tsx`는 `parseInt(params.page || '1', 10)`만 하고 바로 offset을 계산한다.

문제 사례:
- `/search?q=arsenal&page=abc` → `page = NaN`
- `/search?q=arsenal&page=0` → offset 음수
- `/search?q=arsenal&page=-1` → offset 음수

검색 서버 액션까지 비정상 offset이 전달될 수 있으므로, page는 `Number.isFinite()`와 `Math.max(1, value)`로 정규화해야 한다.

### 3. `all` 검색에서 count 쿼리가 중복된다

`searchContent()`는 `type === 'all'`일 때 `searchPosts()`, `searchComments()`, `searchTeams()`를 호출한다.
이 하위 함수들은 기본적으로 각자의 count를 이미 계산한다.

그런데 같은 함수 안에서 다시 `getPostsCount()`, `getCommentsCount()`, `getTeamsCount()`를 별도로 실행한다.
즉 전체 검색 탭에서는 데이터 조회 + count 조회가 카테고리별로 중복될 수 있다.

수정 방향은 둘 중 하나다.
- 하위 검색 함수의 `totalCount`를 그대로 사용한다.
- 또는 `type === 'all'`일 때 하위 검색은 `skipCount: true`로 호출하고, 별도 count 함수만 사용한다.

현재 구조에서는 첫 번째 방향이 더 단순하다.

### 4. `SearchHeader`는 client component일 필요가 없다

`SearchHeader.tsx`는 `"use client"`를 갖고 있지만, `useState`, `useEffect`, `useRouter`, browser API를 쓰지 않는다.
props로 받은 `initialQuery`를 표시하는 정적 헤더이므로 Server Component로 내릴 수 있다.

### 5. 검색 결과 전체가 큰 client boundary 안에 있다

`SearchResultsContainer.tsx`가 client component이고, 그 아래 `PostSearchResults`, `CommentSearchResults`, `TeamSearchResults`도 client component다.

필요한 client 기능은 다음 정도다.
- 탭 클릭 시 URL 변경
- 검색 결과 클릭 로그
- 팀 결과의 최근 경기 펼침/접기
- pagination URL 조작

반대로 게시글/댓글 결과 목록 렌더링 자체와 빈 상태, 요약 텍스트는 서버에서 그릴 수 있다.
이번 수정에서 전부 나누지는 않더라도, 최소한 `SearchHeader`와 정규식/page/count 문제는 먼저 정리하는 것이 맞다.

## 확인 결과

- `/search` 페이지 자체는 Server Component다.
- `generateMetadata()`에서 이미 `noindex: true`를 넣고 있다.
- `robots.txt`도 `/search`를 disallow하고 있어 검색 결과 URL의 색인 노출은 이미 막는 방향이다.
- `dynamic = 'force-dynamic'`으로 검색 요청마다 서버 렌더링한다.
- 검색 결과 데이터는 서버에서 `searchContent()`로 준비한 뒤 client container에 props로 전달한다.

## 수정 내용

### 1. 하이라이트 정규식 escape 처리 완료

`PostSearchResults.tsx`와 `CommentSearchResults.tsx`에 `escapeRegExp()` helper를 추가했다.
검색어를 escape한 뒤 `RegExp`를 생성하도록 바꿔서 `q=[`, `q=*`, `q=\` 같은 특수문자 검색어도 렌더링 오류를 만들지 않게 했다.

### 2. page query 정규화 완료

`page.tsx`에서 page 값을 다음 기준으로 정리했다.
- 숫자가 아니면 `1`
- `1`보다 작으면 `1`

정규화된 page만 offset 계산에 사용하도록 바꿔서 `page=abc`, `page=0`, `page=-1`이 검색 액션까지 비정상 offset으로 전달되지 않게 했다.

### 3. `all` 검색 count 중복 제거 완료

`searchContent()`에서 `type === 'all'`일 때는 이미 호출한 `searchPosts()`, `searchComments()`, `searchTeams()`의 `totalCount`를 그대로 사용하도록 정리했다.
별도 `getPostsCount()`, `getCommentsCount()`, `getTeamsCount()`는 특정 타입 검색에서 다른 탭 count가 필요할 때만 실행되게 했다.

### 4. `SearchHeader` server component화 완료

`SearchHeader.tsx`의 `"use client"`를 제거했다.
이 파일은 props 기반 렌더링만 하므로 Server Component로 내려도 동작 차이가 없다.

### 5. 큰 client boundary 분리는 후속 후보로 남김

`SearchResultsContainer`와 결과 컴포넌트 분리는 클릭 로그, 탭 URL 변경, 팀 경기 펼침 기능과 얽혀 있다.
이번 14번에서는 렌더링 오류, page 정규화, 중복 count 제거, 불필요한 header client boundary 제거까지 완료했다.
결과 목록 전체를 server/client island로 더 작게 나누는 작업은 별도 구조 분리 대상으로 남긴다.

## 검증

- `npm.cmd run typecheck` 통과
- `npm.cmd run build` 통과

빌드 중 외부 API/데이터 조회 경고는 있었지만 빌드 자체는 성공했다.
해당 경고는 이번 검색 페이지 수정 범위의 실패가 아니라 기존 빌드 시점 외부 fetch 문제로 보인다.

## 결론

14번 검색은 수정 완료했다.
SEO는 이미 `noindex`와 robots 정책이 들어가 있어 큰 문제는 아니었고, 실제 우선 수정 대상이던 검색어 정규식 escape, page query 정규화, 전체 검색 count 중복 제거, `SearchHeader`의 불필요한 client boundary 제거를 반영했다.
