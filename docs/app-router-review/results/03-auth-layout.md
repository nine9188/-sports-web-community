# 03. Auth layout

검토 대상:
- `src/app/(auth)/layout.tsx`
- `src/app/(auth)/signin/page.tsx`
- `src/app/(auth)/signup/page.tsx`
- `src/app/(auth)/social-signup/page.tsx`
- `src/app/(auth)/help/find-id/page.tsx`
- `src/app/(auth)/help/find-password/page.tsx`
- `src/app/(auth)/help/reset-password/page.tsx`
- `src/app/(auth)/help/account-found/page.tsx`
- `src/app/(auth)/help/account-recovery/page.tsx`

## 요약

`(auth)` layout은 인증 페이지용 공통 shell만 담당하는 Server Component다. 별도 DB/API 조회는 없고, client boundary도 만들지 않는다.

검토 중 layout에 있던 `generateMetadata()`와 `../globals.css` 중복 import를 제거했다. 하위 auth 페이지들이 이미 각자 `generateMetadata()`를 갖고 있어서 layout 메타는 실제로 중복이었고, root layout이 전역 CSS를 이미 책임지고 있어서 nested global CSS import도 불필요했다.

## 체크 결과

### 1. 라우트 구조

- `src/app/(auth)/layout.tsx`는 `'use client'`가 없는 Server Component다.
- layout은 로고 헤더와 가운데 정렬 shell만 렌더한다.
- 로그인/회원가입 폼 상태, redirect, storage 접근은 하위 `page.client.tsx`로 내려가 있다.

판정: 통과

### 2. metadata / SEO

- auth 하위 페이지들은 모두 개별 `generateMetadata()`를 가진다.
- 확인된 페이지들은 각자 `path`를 분리해서 canonical을 만든다.
  - `/signin`
  - `/signup`
  - `/social-signup`
  - `/help/find-id`
  - `/help/find-password`
  - `/help/reset-password`
  - `/help/account-found`
- `/help/account-recovery`
- 모두 `noindex: true`로 공개 색인 대상이 아니다.

판정: 통과

수정:
- layout의 `/signin` 기준 metadata를 제거했다.
- auth route별 canonical과 noindex는 각 페이지가 직접 책임지도록 정리했다.
- 이유: `/signup`, `/social-signup`, `/help/*`가 이미 각자 `generateMetadata()`를 갖고 있어서 layout 메타는 실제로 중복이었고, 부모 layout에서 특정 페이지(`/signin`) 기준 메타를 들고 있을 이유가 없었다.
- 이유: `../globals.css`는 root layout에서 이미 한 번만 import되므로 auth layout에서 다시 import하면 중복 전역 스타일 책임만 늘어난다.

### 3. Client Component 경계

- auth layout은 provider를 추가하지 않는다.
- `Link`, `Image` 외에 브라우저 상태나 auth sync를 잡는 로직이 없다.
- `useAuth()`, `localStorage`, `sessionStorage`, `window` 같은 브라우저 전용 처리는 페이지 client 쪽에만 있다.

판정: 통과

### 4. 이동 / prefetch

- 로고 링크는 `/`로 가며 `prefetch={false}`다.
- auth 페이지 내부 도움말 링크들도 대부분 `prefetch={false}`를 사용한다.
- 이 구조는 가벼운 auth shell에서는 무난하다.

판정: 통과

## 결론

`Auth layout`은 공통 shell만 남겨 두는 쪽으로 정리했다. 메타데이터와 CSS 책임이 중복되던 부분을 제거해서, 하위 auth 페이지들의 개별 설정이 더 분명해졌다.

## 검증

- `rg -n "generateMetadata|metadata|noindex|canonical|robots" "src\\app\\(auth)"` 확인
- `src/app/(auth)/*/page.tsx` 및 `page.client.tsx` 구조 확인
- `npm.cmd run typecheck` 통과
- `npm.cmd run build` 통과
