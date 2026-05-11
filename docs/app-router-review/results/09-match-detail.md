# 09. Match detail

대상 route:
- `src/app/(site)/livescore/football/match/[id]/[slug]/page.tsx`
- `src/app/(site)/livescore/football/match/[id]/page.tsx`

관련 파일:
- `src/domains/livescore/components/football/match/MatchPageClient.tsx`
- `src/domains/livescore/components/football/match/TabNavigation.tsx`
- `src/domains/livescore/components/football/match/TabContent.tsx`
- `src/domains/livescore/components/football/match/MatchHeader.tsx`
- `src/domains/livescore/components/football/match/sidebar/MatchSidebar.tsx`
- `src/domains/livescore/components/football/match/sidebar/RelatedPosts.tsx`
- `src/domains/livescore/components/football/match/sidebar/SupportCommentsSection.tsx`
- `src/domains/livescore/components/football/match/sidebar/MatchPredictionClient.tsx`
- `src/domains/livescore/actions/match/matchData.ts`

## 점검 기준

- 상세 페이지가 기본적으로 Server Component인지 확인한다.
- canonical slug가 없는 경우와 있는 경우의 URL 정규화가 일관적인지 확인한다.
- `tab` query 상태가 검색 인덱스에 중복 노출되지 않는지 확인한다.
- metadata와 본문이 같은 데이터를 중복으로 읽는지 확인한다.
- header, sidebar, tab content 중 server로 둘 수 있는 부분이 과도하게 client로 묶이지 않는지 확인한다.

## 발견한 문제

### 1. `tab` query URL이 검색 정책에서 분리되지 않았다

매치 상세는 `?tab=power|events|lineups|stats|standings|support` 형태로 탭 상태를 URL에 둔다.
그런데 `generateMetadata()`는 `searchParams`를 받지 않고, `tab`이 붙은 변형 URL을 `noindex`로 막지 않는다.

이 상태에서는 같은 경기 상세가 탭마다 여러 URL로 열리고, 검색 엔진 기준으로는 기본 페이지와 탭 변형 페이지가 같이 노출될 수 있다.
탭은 실제 콘텐츠 분기라기보다 UI 상태에 가깝기 때문에, 기본 canonical은 유지하되 탭 URL은 검색 제외하는 쪽이 맞다.

### 2. `/match/[id]` 리다이렉트가 tab 상태를 그대로 보존한다

`src/app/(site)/livescore/football/match/[id]/page.tsx`는 canonical slug로 리다이렉트할 때 `tab` query를 그대로 붙인다.
탐색 UX에는 자연스럽지만, 검색 정책이 같이 맞춰지지 않으면 `canonical slug + tab` 조합이 불필요한 변형 URL이 된다.

### 3. 서버에서 초기 데이터를 많이 읽지만, 그 데이터를 받는 shell은 큰 client island다

`MatchPageContent()`는 서버에서 경기 본문, 하이라이트, 전력 데이터, 라인업, 사이드바 extras, 선수 이름 매핑, JSON-LD를 준비한다.
이 자체는 서버 책임이 맞지만, 최종 렌더는 `MatchPageClient` 하나의 client 컴포넌트로 내려간다.

`MatchPageClient` 아래에 다음이 함께 묶여 있다:
- `MatchHeader`
- `TabNavigation`
- `TabContent`
- `MatchSidebar`

이 구조는 탭/예측/댓글처럼 상호작용이 필요한 부분은 적절하지만, 정적 성격이 강한 header와 일부 sidebar shell까지 같이 hydrate한다.
즉, 필요한 island는 맞지만 island 경계는 아직 넓다.

### 4. metadata와 본문 데이터는 캐시로 대부분 중복이 줄어들지만, 정책이 문서화돼 있지 않다

`fetchCachedMatchFullData()`는 `cache()`와 `unstable_cache()`를 섞어서 metadata와 본문 중복을 줄이고 있다.
즉, 같은 경기 기본 데이터가 metadata와 본문에서 완전히 새로 호출되는 구조는 아니다.

다만 이 동작이 코드에는 있지만 검토 문서에는 분리 기준이 없어서, 탭 query 정책과 함께 명시할 필요가 있다.

## 확인 결과

- `page.tsx`는 Server Component다.
- canonical slug는 `resolveCanonicalMatchSlug()`로 정규화하고 있다.
- `MatchPageContent()`는 기본 경기 데이터와 탭별 추가 데이터를 서버에서 선별적으로 준비한다.
- `TabNavigation`은 `pathname?tab=...` 형태로 탭 상태를 URL에 유지한다.
- `RelatedPosts`, `SupportCommentsSection`, `MatchPredictionClient`는 client island다.
- `fetchCachedMatchFullData()`는 같은 요청 안에서 기본 경기 데이터 중복을 줄이고 있다.

## 수정 내용

### 1. 탭 변형 URL을 noindex로 분리

`src/app/(site)/livescore/football/match/[id]/[slug]/page.tsx`의 `generateMetadata()`가 `searchParams`를 받도록 수정했다.
`tab` query가 있으면 `noindex`를 넣는다.

적용 대상:
- `/livescore/football/match/[id]/[slug]?tab=events`
- `/livescore/football/match/[id]/[slug]?tab=lineups`
- `/livescore/football/match/[id]/[slug]?tab=stats`
- `/livescore/football/match/[id]/[slug]?tab=standings`
- `/livescore/football/match/[id]/[slug]?tab=support`

기본 canonical slug URL은 그대로 indexable하게 둔다.
탭 URL은 사용자 탐색 상태로만 취급하고 검색 노출은 막는다.

### 2. `MatchPageClient`의 client boundary를 제거했다

`src/domains/livescore/components/football/match/MatchPageClient.tsx`는 직접 `useState`, `useEffect`, router, browser API를 쓰지 않고 하위 컴포넌트 배치만 하고 있었다.
따라서 `"use client"`를 제거해 `MatchPageClient` 자체는 Server Component로 돌렸다.

client island로 남는 부분:
- `MatchHeader.tsx`: 다크모드 감지와 팀/리그 context 사용
- `TabNavigation.tsx`: 탭 클릭과 router 이동
- `TabContent.tsx`: 탭별 client 컴포넌트 조합
- `MatchSidebar.tsx`: 사이드바 client 상태와 context 사용
- `MatchPredictionClient.tsx`: 예측 상호작용
- `SupportCommentsSection.tsx`: 응원 댓글 작성/세션 처리
- `RelatedPosts.tsx`: 현재는 client 파일이지만 주로 정적 링크 목록

### 3. 데이터 캐시 정책은 유지하되 문서에서 명시한다

metadata와 본문의 기본 경기 데이터는 cached helper로 중복 호출을 줄이고 있다.
이 부분은 구조가 맞으므로 그대로 유지했다.

## 검증

- `npm.cmd run typecheck` 통과
- `npm.cmd run build` 통과

## 결론

9번 매치 상세는 수정 완료했다.
핵심 수정은 `tab` query URL을 `noindex`로 정리하고, `MatchPageClient` 자체를 Server Component로 되돌린 것이다.
이제 검색 노출은 canonical match URL 중심으로 유지되고, 실제 상호작용이 필요한 하위 컴포넌트만 client island로 남는다.
