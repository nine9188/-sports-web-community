# 06. Boards List

검토 대상:
- `/boards/[slug]`
- `/boards/all`
- `/boards/popular`
- `/boards/hotdeal`
- `/boards/hotdeal-*`

## 문제

게시판 목록 route는 서버에서 데이터를 가져오고 있었지만, 사용자별 상태와 공유 캐시가 섞이는 문제가 있었다. 또 `BoardDetailLayout` 전체가 client component라서 게시판 헤더, 공지, 목록까지 큰 client boundary 안에 들어갔다. 목록 URL의 SEO 정책도 route별로 달랐고, 일부 JSON-LD에는 도메인 하드코딩이 남아 있었다.

## 수정 내용

### 1. 사용자 상태를 게시판 데이터 캐시 밖으로 분리

수정한 곳:
- `src/domains/boards/actions/getBoardPageAllData.ts`
- `src/domains/boards/actions/getBoards.ts`
- `src/domains/boards/actions/permissions.ts`

무엇을 바꿨는지:
- `getBoardPageAllData()`의 `unstable_cache` 결과에는 게시판/게시글/공지/메뉴 같은 공개 데이터만 남겼다.
- `isLoggedIn`, `isAdmin`, `canWrite`, `canWriteNotice`는 캐시 밖에서 요청마다 계산하도록 분리했다.
- `getBoardPageData()`에서 `supabase.auth.getUser()`를 제거해 사용자 상태가 공유 캐시에 들어가지 않게 했다.

### 2. 글쓰기 권한을 공통 helper로 정리

수정한 곳:
- `src/domains/boards/actions/permissions.ts`
- `src/domains/boards/actions/getPostForm.ts`
- `src/domains/boards/actions/posts/create.ts`
- `src/domains/boards/components/layout/BoardDetailLayout.tsx`

무엇을 바꿨는지:
- 게시판 목록 표시용 권한을 `canWrite`, `canWriteNotice`로 명확히 만들었다.
- 목록의 글쓰기 버튼은 `isLoggedIn/isAdmin` 조합이 아니라 `canWrite` 기준으로 표시한다.
- 작성 페이지 데이터 로딩과 `createPost()` action도 같은 권한 계산을 사용해 최종 검증한다.
- 공지 게시판은 관리자만 작성 가능하도록 서버 action 기준을 유지했다.

### 3. `BoardDetailLayout` server component 전환

수정한 곳:
- `src/domains/boards/components/layout/BoardDetailLayout.tsx`
- `src/domains/boards/components/layout/RecentlyVisitedBoardEffect.tsx`
- `src/app/(site)/boards/popular/page.tsx`
- `src/app/(site)/boards/popular/PopularPageClient.tsx`

무엇을 바꿨는지:
- `BoardDetailLayout.tsx`의 `"use client"`를 제거했다.
- 최근 방문 기록 저장은 `RecentlyVisitedBoardEffect` client island로 분리했다.
- `/boards/popular/PopularPageClient.tsx`는 제거하고, page에서 `BoardDetailLayout`을 직접 렌더링하게 바꿨다.
- 검색바, 필터, 호버 메뉴처럼 실제 상호작용이 필요한 부분만 client component로 남겼다.

### 4. 목록 URL metadata 정책 공통화

수정한 곳:
- `src/app/(site)/boards/_shared/boardListMetadata.ts`
- `src/app/(site)/boards/[slug]/page.tsx`
- `src/app/(site)/boards/all/page.tsx`
- `src/app/(site)/boards/popular/page.tsx`
- `src/app/(site)/boards/(hotdeal)/_shared/generateHotdealMetadata.ts`
- hotdeal 계열 page metadata

무엇을 바꿨는지:
- 목록 metadata용 `getBoardListMetadataState()`를 추가했다.
- 기본 목록의 `page=2` 이상은 canonical path에 page를 포함한다.
- `from`, `store`, `search`, `searchType`, `period`가 있는 변형 URL은 `robots: { index: false, follow: true }`로 정리한다.
- `/boards/all`, `/boards/popular`, hotdeal 계열도 같은 규칙을 사용한다.

### 5. 게시판 JSON-LD 도메인 하드코딩 제거

수정한 곳:
- `src/app/(site)/boards/[slug]/page.tsx`

무엇을 바꿨는지:
- 게시판 JSON-LD와 Breadcrumb JSON-LD의 `https://4590football.com` 직접 사용을 `siteConfig.url` 기준으로 바꿨다.

### 6. 호버 메뉴 데이터 조립 중복 제거

수정한 곳:
- `src/domains/boards/actions/getHoverMenuData.ts`
- `src/app/(site)/boards/all/page.tsx`
- `src/app/(site)/boards/popular/page.tsx`

무엇을 바꿨는지:
- 전체글/인기글에서 직접 `topBoards`, `hoverChildBoardsMap`을 만들던 코드를 제거했다.
- `getGlobalHoverMenuData()`를 추가해 공통 메뉴 데이터 조립을 한 곳으로 모았다.

### 7. 인기글 조회 캐시 추가

수정한 곳:
- `src/domains/boards/actions/getAllPopularPosts.ts`

무엇을 바꿨는지:
- `period/page/limit` 기준으로 인기글 결과를 `unstable_cache` 60초 캐시에 넣었다.
- 캐시 태그는 `posts`, `comments`, `popular-posts`로 지정했다.
- 캐시 내부에서는 쿠키가 필요 없는 `getSupabaseAdmin()`을 사용하게 정리했다.

## 확인 결과

- 게시판 목록의 공유 캐시에 로그인 사용자 상태가 들어가지 않는다.
- 목록 UI의 글쓰기 표시 기준과 작성 action의 최종 권한 검증이 같은 helper를 사용한다.
- `BoardDetailLayout`은 server component가 되었고, 방문 기록만 client island로 분리됐다.
- `/boards/popular`의 불필요한 client wrapper는 제거됐다.
- 목록 URL metadata 규칙은 동적 게시판, 전체글, 인기글, hotdeal 계열에 공통 적용됐다.
- 게시판 JSON-LD 도메인 하드코딩은 제거됐다.
- 전체글/인기글 호버 메뉴 조립 중복과 인기글 매 요청 계산 부담을 줄였다.

## 검증

- `npm.cmd run typecheck` 통과
- `npm.cmd run build` 통과

주의:
- 빌드 중 Supabase/API-Football 외부 요청은 로컬 샌드박스 네트워크 제한 때문에 retry 로그가 발생했다.
- 해당 로그와 별개로 컴파일, 타입 검사, 빌드는 성공했다.

## 결론

6번 게시판 목록은 사용자 상태와 공개 데이터 캐시를 분리했고, 권한 판단을 공통화했으며, 큰 client boundary를 줄였다. SEO URL 정책과 JSON-LD 기준도 공통 구조로 정리 완료했다.
