# 11. Player detail

대상 route:
- `src/app/(site)/livescore/football/player/[id]/[slug]/page.tsx`
- `src/app/(site)/livescore/football/player/[id]/page.tsx`

관련 파일:
- `src/domains/livescore/components/football/player/PlayerPageClient.tsx`
- `src/domains/livescore/components/football/player/PlayerHeader.tsx`
- `src/domains/livescore/components/football/player/TabNavigation.tsx`
- `src/domains/livescore/components/football/player/TabContent.tsx`
- `src/domains/livescore/components/football/player/tabs/PlayerFixtures.tsx`
- `src/domains/livescore/actions/player/data.ts`
- `src/domains/livescore/actions/player/slug.ts`

## 점검 기준

- 상세 페이지가 기본적으로 Server Component인지 확인한다.
- canonical slug와 query 상태(`tab`, `page`)의 정책이 일관적인지 확인한다.
- metadata와 본문이 같은 선수 데이터를 중복으로 읽는지 확인한다.
- URL state가 검색 노출과 섞이지 않는지 확인한다.
- 서버 shell과 client island 경계가 과도하게 넓지 않은지 확인한다.

## 발견한 문제

### 1. `tab`와 `page` query URL이 검색 정책에서 분리되지 않았다

선수 상세는 `?tab=stats|fixtures|trophies|transfers|injuries|rankings` 형태의 탭 상태를 URL에 둔다.
`fixtures` 탭은 다시 `page` query로 페이징까지 가진다.

그런데 `generateMetadata()`는 `searchParams`를 받지 않고, `tab`이나 `page`가 붙은 변형 URL을 `noindex`로 막지 않는다.
즉 같은 선수 상세가 탭/페이지마다 여러 URL로 열릴 수 있고, 검색 엔진 기준으로 기본 canonical과 상태 URL이 함께 노출될 수 있다.

### 2. `/player/[id]` 리다이렉트가 tab만 보존하고 `page`는 잃는다

`src/app/(site)/livescore/football/player/[id]/page.tsx`는 canonical slug로 리다이렉트할 때 `tab`만 붙이고 `page`는 유지하지 않는다.
fixtures 2페이지 같은 상태에서 slug 정규화가 일어나면 페이지 상태가 깨질 수 있다.

### 3. metadata와 본문이 같은 최상위 데이터 로더를 각각 호출한다

`generateMetadata()`와 `PlayerPageContent()`가 둘 다 `fetchPlayerFullData()`를 호출한다.
`fetchPlayerFullData()` 내부에 일부 캐시된 하위 호출은 있지만, 상위 함수 자체는 캐시 래퍼가 없다.

그래서 선수 기본 정보, 통계, 랭킹 같은 핵심 데이터는 metadata와 page 본문에서 각각 한 번씩 더 읽히는 구조다.
`cache`/`unstable_cache`가 부분적으로는 중복을 줄이지만, route 기준으로는 여전히 중복 호출 경로가 남아 있다.

### 4. `PlayerPageClient`는 실제 훅이 없는데도 client boundary를 갖는다

`PlayerPageClient.tsx`는 직접 `useState`, `useEffect`, `useRouter`, 브라우저 API를 쓰지 않고
`PlayerHeader`, 광고 배너, `PlayerTabNavigation`, `TabContent`를 묶는 역할만 한다.

즉 지금 client boundary는 실제 상호작용 때문이 아니라 wrapper 위치 때문에 유지되고 있다.
이 wrapper는 Server Component로 내릴 수 있다.

### 5. `PlayerHeader`와 `TabContent` 쪽은 이미 client island가 필요하다

`PlayerHeader.tsx`는 `useTeamLeague()` context와 이미지 처리 때문에 client 성격이 있고,
`TabContent.tsx`는 탭 내부 컴포넌트 조합을 담당한다.
따라서 실제로 client로 남겨야 할 것은 하위 interactive 섹션이지, 상위 wrapper 전체는 아니다.

## 확인 결과

- `page.tsx`는 Server Component다.
- canonical slug는 `resolvePlayerCanonicalSlug()`로 정규화하고 있다.
- `PlayerPageContent()`는 `tab`과 `page`에 따라 필요한 데이터만 선별해서 로드한다.
- `PlayerFixtures.tsx`는 `page` query를 직접 갱신한다.
- `PlayerPageClient`는 현재는 client wrapper지만 자체 훅은 없다.

## 수정 내용

### 1. `tab` / `page` 상태 URL을 noindex로 정리

`src/app/(site)/livescore/football/player/[id]/[slug]/page.tsx`의 `generateMetadata()`가 `searchParams`를 받도록 수정했다.
`tab` 또는 `page` query가 있으면 `noindex`를 넣는다.

적용 대상:
- `/livescore/football/player/[id]/[slug]?tab=fixtures`
- `/livescore/football/player/[id]/[slug]?tab=fixtures&page=2`
- `/livescore/football/player/[id]/[slug]?tab=trophies`
- `/livescore/football/player/[id]/[slug]?tab=transfers`
- `/livescore/football/player/[id]/[slug]?tab=injuries`
- `/livescore/football/player/[id]/[slug]?tab=rankings`

기본 canonical은 정규화된 slug URL로 유지한다.
fixtures paging과 다른 탭 상태 URL은 검색 노출이 아니라 탐색용 상태로만 취급한다.

### 2. slug 정규화 리다이렉트에서 `page` 상태도 보존한다

`src/app/(site)/livescore/football/player/[id]/page.tsx`가 canonical slug로 리다이렉트할 때 `tab`뿐 아니라 `page`도 유지하도록 수정했다.

또한 `[id]/[slug]/page.tsx`에서 slug가 canonical과 다를 때도 query 생성 helper를 사용해 `fixtures` 탭의 `page` 상태를 같이 보존한다.

### 3. `fetchPlayerFullData()` 호출 구조를 route 기준으로 다시 본다

metadata에서 `fetchPlayerFullData()`를 직접 호출하던 구조를 줄였다.
`generateMetadata()`는 전체 탭 로더 대신 `fetchCachedPlayerData()`로 선수 기본 데이터만 읽도록 바꿨다.

본문은 여전히 현재 탭에 필요한 데이터만 `fetchPlayerFullData()`로 준비한다.
이제 metadata가 탭별 통합 로더를 별도로 한 번 더 호출하지 않는다.

### 4. `PlayerPageClient`의 wrapper 역할을 서버로 내린다

`src/domains/livescore/components/football/player/PlayerPageClient.tsx`의 `"use client"`를 제거했다.
`PlayerPageClient`는 직접 훅이나 브라우저 API를 쓰지 않으므로 Server Component로 렌더링한다.

client island로 남는 부분:
- `PlayerHeader.tsx`
- `TabNavigation.tsx`
- `TabContent.tsx`

## 검증

- `npm.cmd run typecheck` 통과
- `npm.cmd run build` 통과

## 결론

11번 선수 상세는 수정 완료했다.
핵심 수정은 `tab`/`page` query URL을 `noindex`로 정리하고, slug 정규화에서 pagination 상태를 보존하며, metadata의 무거운 통합 로더 호출과 `PlayerPageClient` client wrapper를 줄인 것이다.
