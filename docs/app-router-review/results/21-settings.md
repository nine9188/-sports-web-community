# 21. Settings

대상 route:
- `/settings`
- `/settings/profile`
- `/settings/password`
- `/settings/phone`
- `/settings/points`
- `/settings/exp`
- `/settings/icons`
- `/settings/my-posts`
- `/settings/my-comments`
- `/settings/account-delete`

관련 파일:
- `src/app/(site)/settings/layout.tsx`
- `src/app/(site)/settings/page.tsx`
- `src/app/(site)/settings/profile/page.tsx`
- `src/app/(site)/settings/password/page.tsx`
- `src/app/(site)/settings/phone/page.tsx`
- `src/app/(site)/settings/points/page.tsx`
- `src/app/(site)/settings/exp/page.tsx`
- `src/app/(site)/settings/icons/page.tsx`
- `src/app/(site)/settings/my-posts/page.tsx`
- `src/app/(site)/settings/my-comments/page.tsx`
- `src/app/(site)/settings/account-delete/page.tsx`
- `src/domains/settings/actions/*`
- `src/domains/settings/components/common/SettingsTabs.tsx`
- `src/domains/settings/components/my-posts/*`
- `src/domains/settings/components/my-comments/*`

문서 작성 / 확인 기준:
- 이 문서는 UTF-8로 작성한다.
- 검증 명령은 bash 터미널 기준으로 기록한다.
- Windows PowerShell 전용 명령은 검증 절차에 넣지 않는다.
- 이번 21번은 코드 수정 없이 App Router SSR 관점의 검토 결과만 기록한다.

## 점검 기준

- 설정 layout과 하위 page가 Server Component 중심인지 확인한다.
- 로그인 사용자 전용 route가 서버에서 보호되는지 확인한다.
- 설정 페이지가 검색 색인에서 제외되는지 확인한다.
- page query가 있는 목록 화면에서 page 값이 정규화되는지 확인한다.
- 정적 목록 / 테이블이 불필요하게 client component로 올라가지 않는지 확인한다.
- redirect 경로가 실제 App Router route와 일치하는지 확인한다.
- `redirect()` 흐름이 broad catch에 의해 깨지지 않는지 확인한다.
- 내부 링크에 `prefetch={false}`가 적용되는지 확인한다.
- route segment에 `loading.tsx`가 없는지 확인한다.

## 발견한 문제

### 1. 설정 layout과 각 page가 인증 조회를 중복 수행한다

`settings/layout.tsx`는 `getCurrentUser()`로 로그인 여부를 먼저 확인한다.
그런데 하위 page 대부분이 다시 인증을 확인한다.

예시:
- `/settings/profile`: `checkUserAuth('/auth/signin')`
- `/settings/password`: `checkUserAuth('/auth/signin')`
- `/settings/points`: `checkUserAuth('/auth/signin?callbackUrl=/settings/points')`
- `/settings/exp`: `checkUserAuth('/auth/signin')`
- `/settings/icons`: `supabase.auth.getUser()`
- `/settings/my-posts`: `supabase.auth.getUser()`
- `/settings/my-comments`: `authGuard()`
- `/settings/account-delete`: `supabase.auth.getUser()`

각 page가 독립적으로 보호되는 장점은 있지만, 같은 요청에서 인증 확인과 프로필 조회가 반복된다.
layout에서 이미 보호한다면 하위 page는 사용자 컨텍스트를 공유하거나, current user 조회를 요청 단위 cache로 묶는 편이 낫다.

### 2. 여러 redirect 경로가 실제 로그인 route와 다르다

현재 App Router의 로그인 page는 `/signin`이다.
하지만 설정 하위 page와 settings auth action에는 다음 경로가 섞여 있다.

- `/auth/signin`
- `/auth/login`
- `/login`

특히 `checkUserAuth()`의 기본값도 `/auth/signin`이다.
layout은 `/signin`을 쓰고 있어 직접 접근 시 대부분 layout에서 먼저 막히지만, action / page 재사용이나 catch fallback에서는 잘못된 경로가 노출될 수 있다.

### 3. broad catch가 redirect를 오류 UI로 바꿀 수 있다

`/settings/my-posts`, `/settings/my-comments`, `/settings/points`는 page 전체를 `try/catch`로 감싼다.
그 안에서 인증 실패 시 `redirect()`가 발생할 수 있다.

Next.js redirect는 예외 기반이므로 catch에서 digest를 다시 throw하지 않으면 redirect가 정상 처리되지 않는다.
현재 일부 page는 redirect 대신 오류 UI를 반환하거나, catch에서 잘못된 `/auth/signin` 경로로 다시 redirect할 수 있다.

### 4. `page` query 정규화가 약하다

`/settings/my-posts`와 `/settings/my-comments`는 다음 형태로 page를 계산한다.

```ts
const page = resolvedParams.page ? parseInt(resolvedParams.page) : 1;
```

문제 사례:
- `page=abc` -> `NaN`
- `page=0` -> offset 음수
- `page=-1` -> offset 음수
- `page=1.5` -> 의도와 다른 정수 처리

page는 `Number.isFinite()`, `Number.isInteger()`, `Math.max(1, value)` 기준으로 정규화해야 한다.

### 5. `/settings/my-comments`의 게시글 링크가 실제 route와 맞지 않는다

`MyCommentList`는 댓글 링크를 다음처럼 만든다.

```tsx
href={`/boards/${comment.board_id}/posts/${comment.post_id}#comment-${comment.id}`}
```

하지만 실제 게시글 상세 route는 `/boards/[slug]/[postNumber]`다.
현재 action은 `board_id`와 `post_id`만 내려주고 `board_slug`, `post_number`를 내려주지 않는다.
그 결과 "내가 쓴 댓글"에서 게시글로 이동하는 링크가 깨질 수 있다.

### 6. 서버에서 이미 받은 목록이 다시 client state로 감싸진다

`MyPostsContent`와 `MyCommentsContent`는 `"use client"`이고, 서버에서 받은 props를 `useState()` 초기값으로만 저장한다.
실제 client 상호작용은 거의 없다.

`MyPostList`, `MyCommentList`도 링크와 테이블 렌더링 중심이다.
이 영역은 Server Component로 내려서 초기 HTML과 hydration 범위를 줄일 수 있다.

### 7. `SettingsTabs` 전체가 client component다

`SettingsTabs`는 `usePathname()`과 `router.push()`로 현재 탭과 이동을 처리한다.
설정 탭은 정적인 내부 링크 목록이므로 서버에서 `Link prefetch={false}` 기반으로 렌더링하고, active 상태만 현재 pathname 기준으로 처리하는 쪽이 더 단순하다.

현재 구조가 기능적으로 틀린 것은 아니지만, 설정 layout 전체에 불필요한 client boundary를 만든다.

### 8. 포인트 / 경험치 조회가 순차 실행된다

`/settings/points`는 포인트 정보 조회 후 포인트 내역을 조회한다.
`/settings/exp`도 경험치 레벨 조회 후 경험치 내역을 조회한다.

두 조회는 서로 의존성이 낮으므로 `Promise.all()`로 병렬화할 수 있다.
`/settings/profile`은 이미 여러 데이터를 병렬 조회하고 있어 같은 패턴으로 맞출 수 있다.

## 확인 결과

- 설정 layout과 각 page 자체는 기본적으로 Server Component다.
- 설정 layout은 로그인하지 않은 사용자를 `/signin?redirect=/settings...`로 redirect한다.
- 설정 layout metadata는 `noindex: true`다.
- 하위 page들도 대부분 각자 `generateMetadata()`에서 `noindex: true`를 넣는다.
- `/settings`는 `/settings/profile`로 redirect한다.
- `/settings/phone`은 `/settings/profile`로 redirect한다.
- `/settings/my-posts`와 `/settings/my-comments`는 서버에서 초기 목록과 totalCount를 가져온다.
- 내부 게시글 링크 일부에는 `prefetch={false}`가 적용되어 있다.
- 대상 route 아래에 별도 `loading.tsx`는 없다.

## 후속 수정 후보

### 1. 로그인 redirect 경로를 `/signin`으로 통일

`checkUserAuth()` 기본값과 설정 하위 page의 redirect 경로를 `/signin` 기준으로 정리한다.
`redirect` / `callbackUrl` query 이름도 프로젝트에서 쓰는 방식으로 통일한다.

### 2. redirect digest 재throw

page-level `try/catch`가 있는 설정 page는 catch에서 redirect digest를 다시 throw해야 한다.
특히 `my-posts`, `my-comments`, `points`를 먼저 확인한다.

### 3. 인증 조회 cache 또는 context 공유

layout과 하위 page가 모두 auth를 직접 조회하지 않도록 정리한다.
최소 수정은 현재 사용자 조회 helper를 React `cache()`로 감싸는 방식이다.

### 4. `page` query 정규화

`my-posts`, `my-comments`의 page query를 다음 기준으로 정리한다.
- 숫자가 아니면 1
- 정수가 아니면 정수화
- 1보다 작으면 1

### 5. 내 댓글 링크 데이터 보강

`getMyComments()`에서 posts의 `post_number`와 boards의 `slug`를 함께 조회한다.
`MyCommentList`는 `/boards/${board_slug}/${post_number}#comment-${id}`로 링크를 만든다.

### 6. 정적 목록 component server화

`MyPostsContent`, `MyPostList`, `MyCommentsContent`, `MyCommentList`는 우선 Server Component 후보로 본다.
날짜 formatting이 서버 / 클라이언트에서 동일하게 나오도록 `formatDate`의 환경 의존성만 확인하면 된다.

### 7. 설정 탭 Link 기반 전환

`SettingsTabs`를 server-friendly 링크 목록으로 바꾸고 `prefetch={false}`를 명시한다.
현재 active path 처리가 필요하면 layout에서 pathname을 알 수 없는 제약을 고려해 작은 client active indicator만 남기는 방식도 가능하다.

### 8. points / exp 조회 병렬화

포인트 정보 / 포인트 내역, 경험치 레벨 / 경험치 내역은 `Promise.all()`로 병렬 조회한다.

## 검증

문서 작성 후 bash 기준으로 다음 명령으로 UTF-8을 확인한다.

```bash
file -bi docs/app-router-review/results/21-settings.md
iconv -f UTF-8 -t UTF-8 docs/app-router-review/results/21-settings.md >/dev/null && echo "utf-8 ok"
```

코드 수정은 하지 않았으므로 이 문서 작성만으로 `npm run typecheck`나 `npm run build`가 새로 검증해야 할 변경 사항은 없다.

## 결론

21번 설정 route는 Server Component 기반으로 초기 데이터 대부분을 서버에서 준비하고, private route로 `noindex` 처리되어 있다.
하지만 로그인 redirect 경로가 여러 값으로 섞여 있고, 일부 broad catch가 redirect를 깨뜨릴 수 있으며, 내 댓글 링크가 실제 게시글 route와 맞지 않는 문제가 있다.

우선순위는 `/signin` 경로 통일, redirect digest 재throw, `page` query 정규화, 내 댓글 링크 수정, 정적 목록 component server화다.
