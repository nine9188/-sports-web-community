# 07. Post detail

대상 route:
- `src/app/(site)/boards/[slug]/[postNumber]/page.tsx`

관련 파일:
- `src/domains/boards/components/layout/PostDetailLayout.tsx`
- `src/domains/boards/components/layout/PostDetailRelatedList.tsx`
- `src/domains/boards/components/post/PostNavigation.tsx`
- `src/domains/boards/components/post/PostFooter.tsx`
- `src/domains/boards/hooks/post/useComments.ts`
- `src/domains/boards/components/post/postlist/*`

## 점검 기준

- `page.tsx`가 Server Component인지 확인한다.
- 상세 진입 전 목록 상태가 상세 화면 안에서도 유지되는지 확인한다.
- 상세 안의 이전글/다음글/목록/삭제 후 이동 링크가 같은 반환 경로 기준을 쓰는지 확인한다.
- 서버에서 이미 받은 초기 댓글을 클라이언트가 즉시 다시 요청하지 않는지 확인한다.
- 목록 링크 생성 로직이 desktop/mobile/virtualized 목록에서 일관적인지 확인한다.

## 발견한 문제

### 1. 상세 진입 시 목록 상태가 링크에 남지 않았다

목록에서 게시글 상세로 이동할 때 `from`, `page`, `sort` 같은 목록 상태가 상세 URL에 안정적으로 붙지 않았다.
일부 목록 컴포넌트는 `sessionStorage`에만 현재 보드를 저장했지만, 상세 페이지는 그 값을 실제 복귀 링크에 사용하지 않았다.

그 결과 상세 화면의 "목록" 버튼이나 삭제 후 이동이 원래 보던 목록 페이지가 아니라 `/boards/${boardSlug}` 기본 목록으로 돌아갈 수 있었다.

### 2. 상세 내부 이동에서 query 상태가 끊겼다

상세 화면의 이전글/다음글 링크가 현재 상세 URL의 query 상태를 이어받지 않았다.
`from`, `page`, `sort`가 끊기면 다음 게시글로 이동한 뒤 목록으로 돌아갈 때 원래 목록 맥락을 잃는다.

### 3. 관련글 목록 페이징이 `from` 값을 제거했다

`PostDetailRelatedList`에서 관련글 목록 페이지를 바꿀 때 `from` query를 삭제하고 `listPage`만 남겼다.
상세 페이지 안에서 관련글 페이지를 이동하면 원래 상세 진입 출처가 사라지는 구조였다.

### 4. 초기 댓글을 받은 뒤에도 첫 마운트에서 재조회했다

`CommentSection`은 서버에서 받은 `initialComments`를 `useComments()`에 넘기고 있었다.
하지만 hook 내부에서 첫 마운트 시 다시 `getComments(postId)`를 호출할 수 있어서, SSR 초기 데이터와 클라이언트 재조회가 중복될 수 있었다.

## 수정 내용

### 1. 목록에서 상세로 가는 href를 공통 함수로 통일했다

`src/domains/boards/components/post/postlist/utils.ts`에 `buildPostDetailHref()`를 추가했다.
이 함수가 게시글 상세 URL을 만들 때 현재 보드와 현재 목록 페이지 정보를 같이 붙인다.

적용한 컴포넌트:
- `DesktopPostItem.tsx`
- `MobilePostItem.tsx`
- `DesktopVirtualizedItem.tsx`
- `MobileVirtualizedItem.tsx`

또한 `currentPage` prop을 목록 계층 전체로 전달했다.

전달 경로:
- `PostListMain.tsx`
- `VirtualizedPostList.tsx`
- `DesktopPostListServer.tsx`
- `MobilePostListServer.tsx`
- `DesktopPostList.tsx`
- `MobilePostList.tsx`
- 각 item 컴포넌트

### 2. 상세 page에서 반환 경로를 계산했다

`src/app/(site)/boards/[slug]/[postNumber]/page.tsx`에 query string 생성 helper를 추가했다.

계산한 값:
- `returnHref`: 목록 버튼과 삭제 후 이동에 사용할 복귀 경로
- `detailQueryString`: 이전글/다음글 링크에 유지할 상세 query

`returnHref`에는 `from`, `page`, `sort`를 유지한다.
`listPage`는 상세 내부 관련글 목록 페이지 상태라서 실제 목록 복귀 경로에는 넣지 않았다.

### 3. 상세 layout과 navigation/footer가 같은 반환 경로를 쓰도록 연결했다

`PostDetailLayout.tsx`가 `returnHref`, `detailQueryString`을 받아 하위 컴포넌트에 전달한다.

수정한 동작:
- `PostNavigation.tsx`
  - 목록 버튼이 `returnHref`를 우선 사용한다.
  - 이전글/다음글 링크가 `detailQueryString`을 유지한다.
- `PostFooter.tsx`
  - 삭제 성공 후 이동 경로가 `returnHref`를 우선 사용한다.

이제 상세 화면의 목록 복귀와 삭제 후 이동이 서로 다른 기준으로 움직이지 않는다.

### 4. 관련글 목록 페이징에서 `from`을 보존했다

`PostDetailRelatedList.tsx`에서 `from` query를 삭제하던 처리를 제거했다.
관련글 목록의 `listPage`만 바뀌고, 상세 진입 출처는 유지된다.

관련글 목록에도 `currentPage`를 넘겨서, 관련글에서 다시 상세로 들어갈 때 목록 페이지 상태가 이어지도록 했다.

### 5. 초기 댓글이 있으면 첫 마운트 재조회를 건너뛰게 했다

`useComments.ts`에서 `initialComments`가 있고 아직 버전 변경이 없는 최초 상태라면 클라이언트 재조회 없이 초기 데이터를 그대로 사용하도록 했다.

이 변경으로 서버에서 받은 댓글을 마운트 직후 같은 조건으로 다시 요청하는 중복 호출을 줄였다.

### 6. `PostDetailLayout`의 client boundary를 줄였다

`PostDetailLayout.tsx`의 `"use client"`를 제거해서 layout 자체를 Server Component로 되돌렸다.
기존에 layout을 client로 만들던 직접 원인은 hash scroll용 `useEffect`였다.

이 브라우저 전용 동작은 `PostHashScroller.tsx`로 분리했다.
이제 상세 페이지의 큰 wrapper, breadcrumb, header 배치, 본문 구조, navigation 배치는 서버 컴포넌트 트리에서 렌더링되고,
실제로 상호작용이 필요한 컴포넌트만 client island로 남는다.

client island로 유지한 부분:
- `PostHashScroller.tsx`: URL hash 스크롤 처리
- `PostActions.tsx`: 추천/비추천 상호작용
- `PostFooter.tsx`: 수정/삭제 버튼과 삭제 후 이동
- `CommentSection.tsx`: 댓글 작성/수정/답글/해시 처리
- `PostDetailRelatedList.tsx`: 상세 내부 관련글 페이징
- `HoverMenu.tsx`, `BoardSearchBar.tsx`, `AdSense.tsx`, `KakaoAd.tsx`: 기존 브라우저 API 또는 client hook 사용 영역

## 검증

- `npm.cmd run typecheck` 통과
- `npm.cmd run build` 통과

빌드 중 외부 fetch/env 관련 warning은 있었지만 build 자체는 성공했다.

## 결론

7번 게시글 상세는 코드 수정까지 완료했다.
핵심 수정은 상세 진입과 복귀 경로를 URL query 기준으로 일원화한 것이다.
목록, 가상화 목록, 모바일 목록, 상세 navigation/footer, 관련글 목록이 같은 상태 전달 규칙을 따르도록 맞췄고, 초기 댓글 중복 재조회도 줄였다.
또한 `PostDetailLayout` 자체를 Server Component로 되돌려 상세 페이지의 client boundary를 실제 상호작용 영역으로 좁혔다.
