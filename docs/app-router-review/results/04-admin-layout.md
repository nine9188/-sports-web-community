# 04. Admin layout

검토 대상:
- `src/app/admin/layout.tsx`
- `src/app/admin/components/AdminLayoutClient.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/site-management/page.tsx`
- `src/app/admin/notices/page.tsx`
- `src/app/admin/prediction/layout.tsx`

## 요약

`admin` layout은 서버에서 `authGuard({ requireAdmin: true })`를 먼저 실행해서 접근을 막고, 그 다음에 관리자 shell을 렌더한다. 인증/권한 차단은 서버에서 처리되고 있다.

검토 중 실제로 손댄 부분은 shell 구조였다. 기존에는 헤더, 바깥 컨테이너, 페이지 컨텐츠 래퍼까지 전부 `AdminLayoutClient` 안에 들어가 있어서 pathname 하이라이트만 필요한데도 관리자 shell 전체가 client boundary에 걸려 있었다. 이건 정적 shell을 불필요하게 hydrate하는 구조라서 분리했다.

## 체크 결과

### 1. 라우트 구조

- `src/app/admin/layout.tsx`는 서버 컴포넌트다.
- `authGuard()`를 layout 시작점에서 호출해서 비인증/비관리자를 먼저 차단한다.
- 하위 페이지는 모두 이 layout을 공유한다.

판정: 통과

### 2. metadata / robots

- admin layout은 `robots: { index: false, follow: false, nocache: true }`를 둔다.
- `title`과 `description`도 별도로 정의되어 있다.
- 일부 하위 페이지는 자체 metadata를 추가로 둔다.
  - `site-management`
  - `notices`
  - `emoticon-submissions`
  - `site-management/branding`
  - `site-management/seo-v2`
  - `site-management/ui-theme`

판정: 통과

### 3. Client Component 경계

- 기존 `AdminLayoutClient`는 헤더, 상단 링크, nav, 콘텐츠 래퍼까지 전부 client였다.
- 실제로 client가 필요한 건 `usePathname()`로 active state를 계산하는 메뉴 부분뿐이다.

수정:
- `src/app/admin/layout.tsx`로 정적 shell을 다시 올렸다.
- `AdminLayoutClient`는 메뉴 링크 하이라이트만 담당하도록 줄였다.

이유:
- 헤더와 바깥 컨테이너는 pathname이나 브라우저 상태가 필요 없다.
- 정적 shell을 client boundary 밖으로 빼야 hydration 범위가 줄고, 관리자 페이지 전체가 불필요하게 client 쪽으로 묶이지 않는다.

판정: 통과

### 4. 이동 / prefetch

- admin 메뉴와 복귀 링크는 모두 내부 `Link`를 사용한다.
- `prefetch={false}`를 명시해서 관리자 페이지 프리페치 비용을 줄였다.

판정: 통과

## 실제 수정한 곳

- `src/app/admin/layout.tsx`
  - 서버 shell 복원
  - 헤더/컨테이너/children 래퍼를 client 밖으로 이동
  - `AdminLayoutClient`는 nav만 감싸도록 사용
- `src/app/admin/components/AdminLayoutClient.tsx`
  - `children` 제거
  - menu item에서 `/` 반환 링크 삭제
  - pathname 하이라이트만 담당하도록 축소

## 결론

`Admin layout`은 권한 차단은 잘 되어 있었고, 실제 문제는 shell이 너무 넓게 client로 잡혀 있던 점이었다. 그 부분을 줄여서 서버 shell + 최소 client nav 구조로 정리했다.

## 검증

- `npm.cmd run typecheck` 통과
- `npm.cmd run build` 통과
