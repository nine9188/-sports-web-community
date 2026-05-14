# 18. Post create

대상 route:
- `/boards/[slug]/create`
- `src/app/(site)/boards/[slug]/create/page.tsx`

관련 파일:
- `src/domains/boards/actions/getPostForm.ts`
- `src/domains/boards/actions/posts/create.ts`
- `src/domains/boards/components/post/PostEditForm.tsx`
- `src/domains/boards/components/createnavigation/BoardSelector.tsx`
- `src/domains/boards/components/createnavigation/EditorToolbar.tsx`
- `src/shared/guards/auth.guard.ts`
- `src/shared/utils/metadataNew.ts`

문서 작성 / 확인 기준:
- 이 문서는 UTF-8로 작성한다.
- 검증 명령은 bash 터미널 기준으로 기록한다.
- Windows PowerShell 전용 명령은 검증 절차에 넣지 않는다.
- 이번 18번은 코드 수정 없이 App Router SSR 관점의 검토 결과만 기록한다.

## 점검 기준

- 게시글 작성 page가 Server Component인지 확인한다.
- 작성 페이지가 검색 색인에서 제외되는지 확인한다.
- 인증 체크가 서버에서 먼저 수행되는지 확인한다.
- 에디터처럼 브라우저 상태가 필요한 영역만 client boundary로 남는지 확인한다.
- `generateMetadata()`와 page 본문이 같은 게시판 데이터를 중복 조회하지 않는지 확인한다.
- `imageUrl` query 같은 입력값이 초기 에디터 콘텐츠에 안전하게 반영되는지 확인한다.
- 내부 이동에 `prefetch={false}`가 적용되는지 확인한다.
- route segment에 `loading.tsx`가 없는지 확인한다.

## 발견한 문제

### 1. `authGuard()`와 `getCreatePostData()`가 인증 / 프로필 조회를 다시 수행한다

`CreatePostPage`는 먼저 `authGuard()`를 호출한다.
그 뒤 `getCreatePostData(slug)` 안에서 다시 `supabase.auth.getUser()`를 호출하고, `profiles`에서 `is_admin`, `is_suspended`, `suspended_until`을 조회한다.

즉 같은 요청 안에서 인증 사용자와 프로필 성격의 조회가 중복된다.
`getCreatePostData()`가 권한 계산을 위해 프로필이 필요하다는 점은 맞지만, 이미 `authGuard()`가 반환한 `user` / `profile`을 넘기거나 요청 단위 cache로 묶는 편이 낫다.

### 2. `imageUrl` query가 초기 TipTap image node로 바로 들어간다

`searchParams.imageUrl`이 있으면 page에서 바로 다음 형태의 초기 콘텐츠를 만든다.

```json
{ "type": "image", "attrs": { "src": "imageUrl", "alt": "라인업" } }
```

작성 페이지는 인증 / noindex route라 검색 노출 문제는 작다.
다만 사용자 입력 URL이 그대로 에디터 이미지 src가 되므로, 최소한 `http:` / `https:` URL만 허용하거나 서비스에서 의도한 이미지 프록시 / CDN URL만 받는 식의 정규화가 필요하다.

### 3. page-level broad catch가 일부 서버 오류를 200 fallback UI로 숨길 수 있다

`CreatePostPage`는 큰 `try/catch`로 전체 렌더링을 감싼다.
`redirect()` 계열 digest는 다시 throw하고 있어 인증 redirect 자체는 보존된다.

하지만 게시판 조회나 권한 계산 중 일반 예외가 발생하면 route error boundary로 가지 않고 직접 오류 UI를 반환한다.
작성 페이지라 SEO 영향은 작지만, 실제 서버 오류가 정상 200 HTML처럼 보일 수 있다.
치명적 조회 실패는 `error.tsx`로 보내고, 권한 없음 / 게시판 없음처럼 예상 가능한 상태만 명시 UI로 처리하는 편이 더 맞다.

### 4. fallback metadata path가 실제 route와 맞지 않는다

`generateMetadata()`의 fallback은 `path: '/boards/create'`를 사용한다.
실제 route는 `/boards/[slug]/create`이고 `/boards/create` route는 없다.

현재 `noindex: true`라 검색 canonical 문제는 작지만, metadata helper가 canonical / Open Graph URL을 만들 때 존재하지 않는 URL이 들어갈 수 있다.

### 5. 작성 form에 전체 게시판 flat 배열을 client로 전달한다

`getCreatePostData()`는 전체 게시판 트리를 가져온 뒤 `allBoardsFlat` 형태로 client component인 `PostEditForm`에 넘긴다.
에디터 자체는 client가 맞지만, 게시판 선택에 필요한 데이터는 "작성 가능한 게시판"만 서버에서 걸러서 전달하는 편이 hydration payload를 줄일 수 있다.

## 확인 결과

- `/boards/[slug]/create` page 자체는 Server Component다.
- `PostEditForm`은 TipTap, 입력 상태, 업로드 모달, submit handler를 쓰므로 Client Component가 맞다.
- `PostEditForm`은 `next/dynamic`으로 분리되어 에디터 번들을 lazy load한다.
- `generateMetadata()`는 `noindex: true`를 넣는다.
- `getCachedCreatePostData`가 React `cache()`로 감싸져 있어 같은 request 안의 metadata / page 게시판 데이터 중복은 줄이고 있다.
- 작성 액션 `createPost()`는 서버에서 다시 세션, 정지 상태, 게시판 쓰기 권한을 확인한다.
- 오류 UI의 게시판 목록 링크에는 `prefetch={false}`가 있다.
- 대상 route 아래에 별도 `loading.tsx`는 없다.

## 후속 수정 후보

### 1. 인증 / 프로필 조회 중복 축소

`authGuard()` 결과를 `getCreatePostData()`에 넘기거나, 현재 사용자 / 프로필 조회를 요청 단위 cache로 묶는다.
게시글 작성 권한 계산은 서버에서 유지하되 같은 요청 안의 반복 조회만 줄이는 방향이 안전하다.

### 2. `imageUrl` query 정규화

초기 image node를 만들기 전에 URL을 검증한다.
권장 기준:
- `http:` / `https:`만 허용
- 가능하면 서비스 이미지 프록시, CDN, storage public URL만 허용
- 유효하지 않으면 initialContent에 넣지 않음

### 3. fallback metadata path 정리

slug가 없거나 조회 실패한 경우에도 존재하지 않는 `/boards/create` 대신 기본적으로 `/boards`나 실제 요청 path 기준으로 metadata를 구성한다.
작성 route는 계속 `noindex`를 유지한다.

### 4. page-level catch 범위 축소

예상 가능한 상태만 화면에서 처리하고, 실제 예외는 route error boundary로 보낸다.
현재 route는 `src/app/(site)/boards/error.tsx`가 있으므로 치명적 오류를 숨기지 않는 쪽이 낫다.

### 5. client로 전달하는 게시판 데이터 축소

`allBoardsFlat`를 전체 게시판이 아니라 사용자에게 쓰기 권한이 있는 게시판 중심으로 줄인다.
공지 게시판 제외처럼 일부 필터는 이미 있으므로, 같은 위치에서 권한 기반 필터링까지 확장할 수 있다.

## 검증

문서 작성 후 bash 기준으로 다음 명령으로 UTF-8을 확인한다.

```bash
file -bi docs/app-router-review/results/18-post-create.md
iconv -f UTF-8 -t UTF-8 docs/app-router-review/results/18-post-create.md >/dev/null && echo "utf-8 ok"
```

코드 수정은 하지 않았으므로 이 문서 작성만으로 `npm run typecheck`나 `npm run build`가 새로 검증해야 할 변경 사항은 없다.

## 결론

18번 게시글 작성 route는 큰 방향이 맞다.
page는 Server Component이고, 에디터만 client boundary로 분리되어 있으며, 작성 액션도 서버에서 권한을 다시 확인한다.

후속 우선순위는 인증 / 프로필 중복 조회 축소, `imageUrl` query 정규화, fallback metadata path 정리, page-level catch 범위 축소다.
