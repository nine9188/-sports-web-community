# 15. Public user page

대상 route:
- `/user/[publicId]`
- `src/app/(site)/user/[publicId]/page.tsx`

관련 파일:
- `src/app/(site)/user/[publicId]/UserActivityTabs.tsx`
- `src/domains/user/actions/getPublicProfile.ts`
- `src/domains/user/actions/getUserPosts.ts`
- `src/domains/user/actions/getUserComments.ts`
- `src/domains/user/hooks/usePaginatedUserData.ts`
- `src/domains/user/components/PublicProfileCard.tsx`
- `src/domains/reports/components/ReportButton.tsx`
- `src/shared/components/UserIcon.tsx`
- `src/shared/components/ui/pagination.tsx`
- `src/shared/components/ui/tabs.tsx`

## 점검 기준

- 공개 유저 페이지가 기본적으로 Server Component인지 확인한다.
- 프로필, 작성글, 댓글 목록의 초기 HTML이 서버에서 준비되는지 확인한다.
- 작성글 / 댓글 탭 상태와 page 상태가 URL과 분리되지 않았는지 확인한다.
- `generateMetadata()`와 page 본문이 같은 프로필 데이터를 중복 조회하지 않는지 확인한다.
- client boundary가 신고, 탭 클릭, 페이지 이동처럼 실제 상호작용에만 쓰이는지 확인한다.
- 공개 유저 페이지의 noindex / robots 정책이 현재 의도와 맞는지 확인한다.

## 발견한 문제

### 1. `generateMetadata()`와 page 본문이 `getPublicProfile()`을 중복 호출한다

`page.tsx`는 `generateMetadata()`에서 `getPublicProfile(publicId)`를 호출하고, page 본문에서도 다시 같은 함수를 호출한다.

`getPublicProfile()` 내부에서는 다음 조회가 이어진다.
- `profiles` 조회
- `shop_items` 아이콘 조회
- `posts` count 조회
- `comments` count 조회
- `login_history` count 조회

즉 한 번의 `/user/[publicId]` 요청에서 같은 프로필 묶음 조회가 metadata와 본문 때문에 두 번 실행될 수 있다.
이 route는 noindex라 SEO 유입 페이지는 아니지만, 작성자 링크에서 자주 열릴 수 있으므로 중복 DB 호출을 줄이는 것이 맞다.

### 2. 활동 목록 초기 HTML이 서버에서 렌더링되지 않는다

`UserActivityTabs.tsx`는 client component이고, `useUserPosts()` / `useUserComments()` 훅이 mount 이후 server action을 호출한다.

문제는 다음과 같다.
- 첫 서버 HTML에는 프로필 카드만 있고 작성글 목록은 비어 있다.
- hydration 이후에야 작성글/댓글 데이터를 가져온다.
- `PostListMain`은 서버 렌더링 가능한 목록 컴포넌트를 가지고 있는데, 이 route에서는 client fetch 뒤에만 데이터를 넘긴다.

체크리스트의 "초기 목록 / 상세 데이터는 서버에서 준비" 기준에 맞지 않는다.

### 3. 작성글과 댓글 데이터를 첫 진입부터 둘 다 client에서 불러온다

`UserActivityTabs.tsx`는 아래처럼 두 훅을 모두 활성화한다.

- `useUserPosts(publicId, true)`
- `useUserComments(publicId, true)`

사용자가 기본 작성글 탭만 보고 있어도 댓글 탭 데이터까지 즉시 조회한다.
각 액션은 다시 프로필을 조회하고, 댓글 탭은 사용자의 댓글 목록과 게시글 목록까지 추가로 조회한다.

초기 진입에서는 현재 탭 데이터만 서버에서 가져오고, 다른 탭은 사용자가 이동할 때 가져오는 구조가 더 맞다.

### 4. 탭과 페이지 상태가 URL에 없다

검토 순서 문서에서는 15번을 "tab 상태: 작성글, 댓글 등"으로 보고 있다.
하지만 현재 구현은 `activeTab`과 `currentPage`를 모두 client state로만 관리한다.

문제 사례:
- 댓글 탭에서 새로고침하면 작성글 탭으로 돌아간다.
- 2페이지를 보고 있어도 URL에 남지 않는다.
- 뒤로가기 / 앞으로가기와 탭 상태가 연결되지 않는다.
- 서버가 현재 탭과 page를 알 수 없어 SSR 초기 목록을 만들 수 없다.

이 route는 `noindex`라 query URL 색인 문제는 작지만, App Router SSR 구조상 `?tab=comments&page=2` 같은 상태 URL을 서버에서 읽는 쪽이 맞다.

### 5. `PublicProfileCard` 전체가 client component다

`PublicProfileCard.tsx`는 `"use client"`를 갖고 있다.
하지만 카드의 대부분은 props 기반 정적 렌더링이다.

실제로 client가 필요한 부분은 다음 정도다.
- `ReportButton`의 dialog / form 상태
- `UserIcon`의 이미지 error fallback 상태

프로필 닉네임, 레벨, 마스킹 ID, 글/댓글/방문 수 표시까지 전부 hydrate할 필요는 없다.
`PublicProfileCard` 자체는 Server Component로 내리고, `ReportButton`과 필요한 아이콘 표시만 client island로 남기는 것이 맞다.

### 6. `getUserCommentedPosts()`가 사용자의 모든 댓글을 읽은 뒤 메모리에서 중복 제거 / 페이지네이션한다

`getUserCommentedPosts()`는 특정 사용자의 모든 댓글에서 `post_id, created_at`을 읽고, 서버 메모리에서 게시글 ID를 중복 제거한 뒤 page slice를 만든다.

댓글이 많은 사용자일수록 비용이 커진다.
현재 15번의 핵심 SSR 수정과 별개로, 장기적으로는 DB에서 "사용자가 댓글 단 게시글"을 최신 댓글 기준으로 distinct pagination 하는 구조가 필요하다.

## 확인 결과

- `/user/[publicId]` page 자체는 Server Component다.
- `generateMetadata()`는 모든 공개 유저 페이지에 `noindex: true`를 넣는다.
- `robots.txt`에도 `/user/` disallow가 있어 공개 유저 페이지는 검색 노출 대상이 아니다.
- 별도 `loading.tsx`는 이 route 아래에 없다.
- `AuthorLink`의 `/user/${publicId}` 이동은 `prefetch={false}`를 사용한다.
- 현재 가장 큰 문제는 noindex 정책이 아니라 활동 목록을 client fetch로만 구성하는 SSR 경계다.

## 수정 내용

### 1. `getPublicProfile()` 요청 단위 중복 제거 완료

`getPublicProfile()` 내부 조회를 React `cache()`로 감쌌다.
같은 요청 안에서 metadata와 page 본문이 같은 publicId를 조회하면 프로필 묶음 조회가 재사용된다.

수정 내용:
- `generateMetadata()`와 page 본문 모두 기존 API를 그대로 호출한다.
- 내부 구현만 cached function으로 분리했다.
- 공개 프로필 조회 API의 외부 호출 형태는 유지했다.

### 2. page가 `searchParams`를 받아 `tab`과 `page`를 정규화하도록 수정 완료

`page.tsx`의 props에 `searchParams`를 추가했다.

정규화 기준:
- `tab=posts|comments`만 허용
- 없거나 이상하면 `posts`
- `page`는 숫자가 아니거나 1보다 작으면 `1`

정규화된 값으로 현재 탭과 페이지를 결정하게 했다.

### 3. 현재 탭의 초기 목록을 서버에서 조회하도록 수정 완료

page 서버 컴포넌트에서 현재 탭에 따라 다음 중 하나만 호출하도록 바꿨다.

- `tab=posts`: `getUserPosts(publicId, { page, limit: 20 })`
- `tab=comments`: `getUserCommentedPosts(publicId, { page, limit: 20 })`

그 결과를 `UserActivityTabs`에 `posts`, `totalCount`, `activeTab`, `currentPage`로 넘긴다.
이제 첫 HTML에 현재 탭 목록이 포함되고, 불필요한 양쪽 탭 동시 fetch가 사라졌다.

### 4. 탭과 페이지 이동을 URL 기반으로 수정 완료

`UserActivityTabs`에서 `useState`, `useUserPosts`, `useUserComments`를 제거했다.
탭은 `Link` 기반으로 바꾸고, 페이지네이션은 URL mode를 사용하도록 바꿨다.

수정 기준:
- 작성글 탭 href: `/user/[publicId]`
- 댓글 탭 href: `/user/[publicId]?tab=comments`
- 2페이지 이상 href: 현재 tab을 유지하면서 `page` query 추가
- 1페이지는 가능하면 `page` query를 생략
- 이동은 `Link` 또는 URL mode pagination으로 처리한다.

이 route는 noindex라 SEO 색인 이슈는 작지만, canonical 기준은 `/user/[publicId]`로 유지하고 query 상태는 사용자 탐색 상태로만 둔다.

### 5. `PublicProfileCard` Server Component화 완료

`PublicProfileCard.tsx`의 `"use client"`를 제거했다.
정적 프로필 표시 영역은 서버에서 렌더링하고, `ReportButton`은 client island로 유지한다.

`UserIcon`은 현재 client component지만, 최소 수정에서는 그대로 child island로 둘 수 있다.
더 줄이려면 `getPublicProfile()`이 이미 fallback icon URL을 계산하므로 프로필 카드 전용 서버 이미지 컴포넌트로 대체할 수 있다.

### 6. client hook은 15번 route 초기 데이터 경로에서 제거 완료

`UserActivityTabs`가 더 이상 `usePaginatedUserData.ts`를 사용하지 않는다.
파일 자체는 다른 화면에서 재사용될 가능성을 고려해 이번 수정에서 삭제하지 않았다.

### 7. 댓글 단 게시글 pagination은 별도 최적화 후보로 남김

이번 15번에서 SSR 경계와 중복 조회를 먼저 고쳤다.
다만 `getUserCommentedPosts()`의 전체 댓글 조회 후 메모리 pagination은 남는 비용이므로, 완전 최적화하려면 DB RPC나 view로 distinct post pagination을 내려야 한다.

## 검증

- `npm.cmd run typecheck` 통과
- `npm.cmd run build` 통과
- `/user/[publicId]`는 서버에서 현재 탭 목록을 조회한 뒤 렌더링한다.
- `/user/[publicId]?tab=comments&page=2` 같은 상태 URL은 page 서버 컴포넌트에서 정규화해 같은 탭과 페이지를 유지한다.
- metadata와 page 본문의 같은 publicId 프로필 조회는 React `cache()`로 요청 단위 중복을 줄였다.

빌드 중 sitemap, API-Football, AllPostsWidget 외부 fetch 경고가 있었지만 빌드 자체는 성공했다.
해당 경고는 이번 공개 유저 페이지 수정 범위의 실패가 아니라 기존 빌드 시점 외부 fetch 문제로 보인다.

## 결론

15번 공개 유저 페이지는 수정 완료했다.
검색 노출 정책은 이미 `noindex`와 robots disallow로 막혀 있어 큰 문제는 아니다.
실제 우선 수정 대상이던 프로필 중복 조회 제거, 활동 목록 SSR 전환, 작성글/댓글/page 상태의 URL화, `PublicProfileCard`의 불필요한 client boundary 축소를 반영했다.
