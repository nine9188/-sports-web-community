# 19. Post edit

대상 route:
- `/boards/[slug]/[postNumber]/edit`
- `src/app/(site)/boards/[slug]/[postNumber]/edit/page.tsx`

관련 파일:
- `src/domains/boards/actions/getPostForm.ts`
- `src/domains/boards/actions/posts/update.ts`
- `src/domains/boards/components/post/PostEditForm.tsx`
- `src/shared/utils/metadataNew.ts`

문서 작성 / 확인 기준:
- 이 문서는 UTF-8로 작성한다.
- 검증 명령은 bash 터미널 기준으로 기록한다.
- Windows PowerShell 전용 명령은 검증 절차에 넣지 않는다.
- 이번 19번은 코드 수정 없이 App Router SSR 관점의 검토 결과만 기록한다.

## 점검 기준

- 게시글 수정 page가 Server Component인지 확인한다.
- 수정 페이지가 검색 색인에서 제외되는지 확인한다.
- 로그인 / 작성자 권한 체크가 서버에서 수행되는지 확인한다.
- 에디터처럼 브라우저 상태가 필요한 부분만 client boundary인지 확인한다.
- `redirect()` / `notFound()` 흐름이 broad catch에 의해 깨지지 않는지 확인한다.
- `postNumber` param이 안전하게 처리되는지 확인한다.
- 내부 이동에 `prefetch={false}`가 적용되는지 확인한다.
- route segment에 `loading.tsx`가 없는지 확인한다.

## 발견한 문제

### 1. `redirect()`가 catch에 잡혀 `notFound()`로 바뀔 수 있다

`EditPostPage`는 전체 렌더링을 `try/catch`로 감싼다.
그 안에서 로그인 필요 또는 권한 없음 상태일 때 `redirect()`를 호출한다.

Next.js의 `redirect()`는 내부적으로 예외를 던지는 방식인데, 현재 catch는 redirect digest를 다시 throw하지 않고 무조건 `notFound()`를 반환한다.
그 결과 로그인 필요 / 권한 없음 redirect가 404로 바뀔 수 있다.

이 route에서 가장 먼저 고쳐야 할 문제다.
catch에서 다음 기준으로 redirect / notFound digest를 다시 throw해야 한다.

```ts
if (error && typeof error === 'object' && 'digest' in error) {
  throw error;
}
```

### 2. 로그인 redirect 경로가 실제 route와 다르다

`result.redirectToLogin`일 때 page는 `/login?...`으로 redirect한다.
현재 App Router에 존재하는 로그인 page는 `src/app/(auth)/signin/page.tsx`, 즉 `/signin`이다.

따라서 이 분기는 `/signin?redirect=...` 기준으로 맞춰야 한다.

### 3. 권한 없음 redirect query가 message를 직접 문자열로 붙인다

권한 없는 경우 다음처럼 query를 만든다.

```ts
redirect(`/boards/${slug}/${postNumber}?message=본인+작성글만+수정할+수+있습니다`);
```

현재 한글과 공백을 `+`로 직접 넣고 있다.
동작할 수는 있지만, 다른 route처럼 `encodeURIComponent()`를 쓰는 편이 안전하다.

### 4. `postNumber` 정규화가 없다

`getPostEditData()`는 `parseInt(postNumber, 10)`을 바로 Supabase query에 사용한다.

문제 사례:
- `/boards/free/abc/edit`
- `/boards/free/0/edit`
- `/boards/free/-1/edit`

대부분은 조회 실패로 끝나겠지만, route param 단계에서 양의 정수만 허용하고 아니면 `notFound()`로 정리하는 편이 명확하다.

### 5. page-level catch가 실제 데이터 오류를 모두 404로 바꾼다

현재 catch는 모든 예외를 `notFound()`로 처리한다.
게시글이 없는 경우 404는 맞지만, Supabase 장애나 예기치 않은 서버 오류까지 404가 된다.

예상 가능한 상태:
- 게시판 없음
- 게시글 없음
- 작성자 아님
- 로그인 필요

예상하지 못한 서버 오류:
- DB 장애
- schema mismatch
- content parsing 오류

두 범주를 분리해야 운영 중 원인 파악이 쉽다.

## 확인 결과

- `/boards/[slug]/[postNumber]/edit` page 자체는 Server Component다.
- `dynamic = 'force-dynamic'`, `revalidate = 0`으로 사용자별 수정 화면을 정적으로 캐시하지 않는다.
- `generateMetadata()`는 `noindex: true`를 넣는다.
- page 본문은 `getPostEditData(slug, postNumber)`로 서버에서 게시글, 게시판, 작성자 권한을 확인한다.
- 수정 액션 `updatePost()`도 서버에서 세션, 정지 상태, 작성자 일치를 다시 검증한다.
- `PostEditForm`은 TipTap과 입력 상태가 필요하므로 Client Component가 맞다.
- 오류 UI의 게시글 복귀 링크에는 `prefetch={false}`가 있다.
- 대상 route 아래에 별도 `loading.tsx`는 없다.

## 후속 수정 후보

### 1. redirect digest 재throw

`EditPostPage` catch에서 redirect / notFound digest를 다시 throw한다.
이 수정이 없으면 인증 / 권한 redirect가 404로 바뀔 수 있다.

### 2. 로그인 경로를 `/signin`으로 통일

`/login`을 `/signin`으로 바꾸고 redirect 대상도 작성 중이던 수정 page로 유지한다.

### 3. `postNumber` param 정규화

page 초입에서 `Number.parseInt()` 후 `Number.isInteger()`와 `> 0` 기준으로 검증한다.
유효하지 않은 값은 `notFound()`로 정리한다.

### 4. 서버 오류와 not-found 상태 분리

`getPostEditData()`가 상태 코드를 구분할 수 있게 결과 타입을 나누거나, page에서 오류 종류에 따라 `notFound()`, `redirect()`, error boundary를 분리한다.

### 5. query message 인코딩

권한 없음 redirect message는 직접 문자열 결합 대신 `encodeURIComponent()`를 사용한다.

## 검증

문서 작성 후 bash 기준으로 다음 명령으로 UTF-8을 확인한다.

```bash
file -bi docs/app-router-review/results/19-post-edit.md
iconv -f UTF-8 -t UTF-8 docs/app-router-review/results/19-post-edit.md >/dev/null && echo "utf-8 ok"
```

코드 수정은 하지 않았으므로 이 문서 작성만으로 `npm run typecheck`나 `npm run build`가 새로 검증해야 할 변경 사항은 없다.

## 결론

19번 게시글 수정 route는 서버에서 수정 권한을 확인하고, 실제 에디터만 client로 두는 방향은 맞다.
하지만 `redirect()`가 broad catch에 잡혀 404로 바뀔 수 있는 문제가 크다.

우선순위는 redirect digest 재throw, `/signin` 경로 통일, `postNumber` 정규화, 서버 오류 / not-found 분리다.
