# Next.js SSR App Router 검토 체크리스트

목표:
- 페이지별 SSR 구조 확인
- Server Component / Client Component 경계 확인
- metadata, canonical, robots, JSON-LD 확인
- prefetch 사용 여부 확인
- loading.tsx 사용 여부 확인
- hydration / client bundle 최소화 확인
- 중복 DB/API 호출, 중복 HTML 생성 여부 확인

주의:
- `hydration 0`을 목표로 하지 않는다. 필요한 island만 hydrate하는 쪽이 목표다.
- `loading.tsx`와 `prefetch`는 기본 금지 항목이 아니다. 비용이 있거나 UX에 불리할 때만 제한한다.

## 1. 기본 구조

- `page.tsx`가 기본적으로 Server Component인지 확인한다.
- `layout.tsx`가 공통 shell만 담당하는지 확인한다.
- `error.tsx`, `not-found.tsx`는 필요한 route에만 두고, 불필요한 client wrapper를 늘리지 않는다.

## 2. 서버 경계

- DB/API 조회는 가능한 한 Server Component나 server action에서 처리한다.
- `window`, `localStorage`, `sessionStorage`, DOM API 같은 브라우저 전용 API는 Client Component에서만 사용한다.
- 초기 사용자 데이터는 서버에서 받고, 실시간 auth sync는 client에서 처리하는 구조인지 확인한다.

공식 문서:
- Server and Client Components: https://nextjs.org/docs/app/building-your-application/rendering/server-components
- Composition Patterns: https://nextjs.org/docs/14/app/building-your-application/rendering/composition-patterns

## 3. metadata / SEO

- 각 route에 필요한 경우 `generateMetadata`가 있는지 확인한다.
- `title`, `description`, `metadataBase`, `openGraph`, `twitter`, `robots`를 확인한다.
- canonical은 전역으로 강제하기보다, 각 indexable route의 metadata에서 명시하는지 확인한다.
- JSON-LD는 필요한 경우 서버 렌더 결과에 포함되는지 확인한다.
- 같은 콘텐츠가 여러 URL로 열리면 canonical 또는 redirect 중 하나로 정리한다.
- 필터, 페이징, 정렬 URL은 필요하면 `robots: { index: false, follow: true }` 또는 `noindex`를 사용한다.

공식 문서:
- generateMetadata: https://nextjs.org/docs/app/api-reference/functions/generate-metadata

## 4. loading / streaming

- 로딩 시간이 의미 있는 route에만 `loading.tsx`를 둔다.
- 전체 페이지를 한 번에 client로 넘기지 않는다.
- 필요한 부분만 `Suspense`로 스트리밍한다.
- 서버에서 바로 그릴 수 있는 shell은 서버에서 먼저 렌더링한다.

공식 문서:
- Loading UI and Streaming: https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming

## 5. 이동 / prefetch

- 내부 이동은 기본적으로 `Link`를 사용한다.
- `prefetch`는 기본 허용이지만, 비용이 큰 상세 페이지나 무거운 데이터 경로는 선택적으로 끈다.
- 필요성이 확인되면 그때만 예외 처리한다.

공식 문서:
- Link: https://nextjs.org/docs/app/api-reference/components/link
- Linking and Navigating: https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating

## 6. Client Component 경계

Client가 맡는 것:
- 클릭, 입력, 토글, 모달, 탭 전환
- 브라우저 API 사용
- `useEffect`, `useState`
- 로그인 상태, 프로필, 알림처럼 계속 바뀌는 상호작용 UI

Server로 남겨둘 것:
- 정적 헤더
- breadcrumb
- navigation shell
- 본문 메타 정보
- 초기 목록 / 상세 데이터

확인 질문:
- 이 컴포넌트가 정말 브라우저 상태가 필요한가?
- 이벤트 핸들러가 꼭 필요한가?
- props만으로 서버에서 그릴 수 있는가?

## 7. bundle / hydration

- `use client` 범위를 필요한 파일에만 둔다.
- 정적 UI를 client wrapper 안에 과도하게 넣지 않는다.
- 상호작용이 없는 블록은 server island로 유지한다.
- 서버에서 처리 가능한 부분은 서버에서 끝낸다.

## 8. 서버 액션 / 갱신

- 변경 작업은 우선 Server Action을 검토한다.
- 필요한 경우 `router.refresh()` 또는 서버 재검증 전략을 사용한다.
- 서버 상태를 클라이언트 캐시로 중복 관리하지 않는다.
- React Query 같은 클라이언트 캐시는 정말 필요할 때만 쓴다.

## 9. 중복 호출 / 중복 HTML

- 같은 데이터가 같은 route에서 여러 번 호출되는지 확인한다.
- `fetch`가 같은 URL과 옵션이면 memoization 이득이 있는지 본다.
- `fetch`가 아닌 async 함수면 `cache` 또는 `unstable_cache`를 검토한다.
- `generateMetadata`와 page 본문이 같은 데이터를 중복 조회하지 않는지 확인한다.
- 같은 콘텐츠가 다른 URL로 열리면 canonical 또는 redirect로 정리한다.
- 공개가 아닌 임시 URL은 `robots`로 차단한다.

공식 문서:
- Caching and Revalidating: https://nextjs.org/docs/app/building-your-application/data-fetching/caching
- fetch: https://nextjs.org/docs/app/api-reference/functions/fetch
- generateMetadata: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
