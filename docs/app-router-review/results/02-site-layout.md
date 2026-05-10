# 02. Site layout

검토 대상
- `src/app/(site)/layout.tsx`
- `src/app/(site)/SiteLayoutClient.tsx`
- `src/shared/components/AuthStateManager.tsx`
- `src/shared/context/TeamLeagueContext.tsx`
- `src/proxy.ts`

## 결론

대체로 합격.

## 확인 결과

### 1. 일반 site route의 공통 shell

- `src/app/(site)/layout.tsx`는 일반 `(site)` route에서 `getAllTeams()`, `getAllLeagues()`, `getFullUserData()`를 먼저 조회한다.
- 이 데이터는 `TeamLeagueProvider`와 `SiteLayoutClient`에 전달된다.
- 즉, site shell은 서버에서 초기 데이터를 준비하고, client는 상호작용만 맡는다.

### 2. standalone route는 skip

- `/about`, `/contact`, `/guide`, `/privacy`, `/terms`는 `src/proxy.ts`가 `x-skip-site-layout: 1`을 붙인다.
- 이 경우 `src/app/(site)/layout.tsx`는 `children`만 반환하고 공통 fetch를 수행하지 않는다.
- 따라서 “모든 `(site)` route에서 먼저 fetch한다”는 표현은 틀리고, “일반 site route에서만 공통 fetch한다”가 맞다.

### 3. Client boundary

`SiteLayoutClient` 안에서 다음 client work가 처리된다.
- `IconProvider`
- `AuthStateManager`
- `SuspensionPopup`
- `AttendanceChecker`
- `PhoneVerificationPopup`

이 구성은 site shell의 공통 UI는 유지하면서, 상태 변화가 필요한 부분만 client로 분리하는 구조다.

### 4. Auth / header / sidebar

- `AuthStateManager`가 `HeaderClient`, `Sidebar`, `ProfileSidebar`, `UniversalChatbot`을 묶는다.
- `HeaderClient`와 `ProfileSidebar`는 `initialUserData`를 받아 초기 렌더를 구성한다.
- 이후 auth sync는 client 쪽 `AuthContext`와 Supabase session 변경으로 따라간다.

### 5. Streaming / loading

- `TotalPostCountValue`는 `Suspense`로 감싸져 있다.
- `RightSidebar`도 mobile 여부와 `Suspense` fallback을 함께 사용한다.
- site layout 전체를 client로 넘기지 않고, 필요한 조각만 streaming한다.

## 정리

이 layout은 구조적으로 문제 없다.
다만 기존 문서의 “모든 `(site)` route에서 먼저 fetch한다”는 문장은 실제 코드와 다르므로,
“일반 site route에서만 공통 fetch를 하고, standalone route는 proxy로 skip한다”로 수정해야 한다.

## 검증

- `npm.cmd run typecheck` 통과
