# 01. Root layout

검토 대상:
- `src/app/layout.tsx`
- `src/app/RootLayoutProvider.tsx`
- `src/shared/context/ThemeContext.tsx`
- `src/shared/context/AuthContext.tsx`
- `src/shared/context/IconContext.tsx`

## 요약

Root layout은 Server Component로 유지되어 있고, 전역 metadata와 Organization/WebSite JSON-LD를 서버 렌더 결과에 포함한다. DB/API 직접 조회도 없다.

현재는 `RootLayoutProvider`에서 사이트 전용 아이콘 context와 전역 팝업/출석 체크를 분리해서 root의 client boundary를 줄였다. root는 theme/auth/toaster만 담당한다.

실제 코드 추적 중 `(site)/layout.tsx`가 서버에서 `getFullUserData()`로 로그인 사용자 데이터를 이미 내려주는데, 일부 클라이언트 UI가 다시 `useAuth()`의 클라이언트 인증 상태를 렌더 조건으로 사용해 초기 로그인 UI를 숨길 수 있는 문제가 확인됐다. 이 부분은 수정했다.

## 체크 결과

### 라우트 구조

- `src/app/layout.tsx`는 `'use client'`가 없는 Server Component다.
- `RootLayoutProvider`만 별도 Client Component로 분리되어 있다.
- root layout에는 `loading.tsx`, `error.tsx`, `not-found.tsx` 관련 추가 wrapper가 없다.

판정: 통과

### 서버 우선

- root layout 주석대로 DB/API 직접 조회는 없다.
- `siteConfig`, `brandColors` 기반 정적 설정만 사용한다.
- Google tag, AdSense는 `next/script`의 `lazyOnload`로 로드한다.

판정: 통과

주의:
- `RootLayoutProvider` 내부 `AuthProvider`는 클라이언트에서 `supabase.auth.getUser()`를 실행한다.
- 이 호출은 초기 HTML 생성에는 영향을 주지 않지만, 모든 페이지에서 인증 상태 확인 client work를 발생시킨다.
- 서버에서 이미 내려준 사용자 데이터가 있는 UI는 이 클라이언트 인증 로딩 상태에 의존하면 안 된다.

### metadata / SEO

- 전역 `metadataBase`, `title`, `description`, `keywords`, `openGraph`, `twitter`, `manifest`, `robots`, verification 값이 있다.
- Organization + WebSite JSON-LD가 root layout에서 서버 렌더된다.
- 전역 canonical은 없다. canonical은 각 indexable route의 `generateMetadata`에서 개별 확인해야 한다.

판정: 부분 통과

후속 확인:
- 각 공개 페이지에서 canonical을 개별 설정하는지 확인한다.
- 검색/필터/탭 URL은 페이지별로 `robots` 또는 canonical 정리가 필요하다.

### loading / streaming

- root layout에 `loading.tsx` 의존은 없다.
- `SuspensionPopup`, `AttendanceChecker`는 site layout으로 이동했다.

판정: 통과

주의:
- 두 컴포넌트는 전역 client-only 부가 기능이다. 모든 페이지에서 필요한지 별도 확인할 가치가 있다.

### prefetch

- root layout 자체에는 `Link` 또는 `prefetch` 사용이 없다.

판정: 통과

### Client Component 경계

- `RootLayoutProvider`는 `'use client'`이며 `ThemeProvider`, `AuthProvider`, `Toaster`만 포함한다.
- Client Provider가 `children`을 받는 구조라서 Server Component 자식 전체를 Client Component로 바꾸지는 않는다.
- `IconProvider`는 site layout으로 이동했다.

판정: 통과

확인된 문제:
- `HeaderClient`가 `initialUserData`를 받으면서도 `useAuth().user`가 있을 때만 로그인 UI를 렌더했다.
- `ProfileSidebar`도 `userData`를 받으면서 `useAuth().user`를 로그인 UI 조건과 출석 캘린더 user id 조건으로 사용했다.
- 결과적으로 서버에서 로그인 사용자 데이터를 가져와도, 클라이언트 인증 확인이 끝나기 전까지 헤더/모바일 프로필 사이드바가 비로그인 상태처럼 보일 수 있었다.

수정:
- `HeaderClient`는 서버에서 검증해 전달된 `initialUserData`를 초기 렌더 기준으로 사용하도록 변경했다.
- `ProfileSidebar`는 전달받은 `userData`를 로그인 여부와 출석 캘린더 user id 기준으로 사용하도록 변경했다.
- 로그아웃 처리는 `useLogout()`을 통해 기존 `AuthContext` 흐름을 유지한다.

개선 후보:
- `AuthProvider`의 초기 인증 확인을 서버 세션 주입으로 더 줄일 수 있는지 확인한다.

### 번들 / hydration

- 전역 client bundle에 포함되는 항목:
  - `next-themes`
  - Supabase browser auth client
  - `sonner`
  - site layout client chunk
- `SuspensionPopup`, `AttendanceChecker`, `IconProvider`는 root에서 빠졌다.

판정: 통과

### 중복 호출 / 중복 HTML

- root layout 자체의 중복 DB/API 호출은 발견하지 못했다.
- `AuthProvider`의 인증 조회는 client-side 1회 흐름이다.
- JSON-LD는 전역 Organization/WebSite만 포함하므로 상세 페이지 JSON-LD와 역할이 겹치지 않는다.

판정: 통과

## 결론

Root layout은 SSR 기준에서 큰 구조 문제는 없다. 전역 metadata와 JSON-LD는 적절히 서버에서 제공되고, root layout 자체는 서버 우선 구조다.

실제 수정이 필요한 문제는 서버에서 받은 로그인 사용자 데이터를 클라이언트 인증 상태로 다시 가리는 부분과, site 전용 client work를 root에 올려둔 부분이었다. 전자는 `HeaderClient`, `ProfileSidebar`에서 고쳤고, 후자는 provider 배치를 조정했다.

남은 후보는 `AuthProvider` 초기 인증 확인의 즉시성뿐이다. 이것도 idle 지연을 제거해 즉시 체크하도록 바꿨다.

## 검증

- `npm.cmd run typecheck` 통과
- `npm.cmd run build` 통과
