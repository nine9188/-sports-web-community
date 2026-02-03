# Phase 2: 404에서 클라이언트 데이터 호출 차단

## 목표

404 페이지에서 불필요한 클라이언트 사이드 API 호출 비활성화

## 상태

- [ ] LeagueStandings: 404에서 `enabled=false` 처리
- [ ] 모바일 경기일정: 404에서 fetch 비활성화
- [ ] 테스트 및 검증
- [ ] 배포

---

## 대상 컴포넌트

### 1. LeagueStandings (PC 순위 사이드바)

**현재 상태:**
- 클라이언트 컴포넌트
- `useLeagueStandings` 훅 사용 (React Query 10분 캐시)
- 모바일에서는 이미 `enabled=false` 처리됨

**위치:**
- `src/domains/livescore/components/LeagueStandings.tsx`
- `src/domains/livescore/hooks/useLeagueStandings.ts`

**위험도:** 낮음 (React Query 캐시 있음, 서버 부하 주범 아님)

### 2. 모바일 경기일정

**현재 상태:**
- 클라이언트 컴포넌트
- 모바일 뷰에서 경기 일정 fetch

**위치:**
- 확인 필요

**위험도:** 낮음

---

## 구현 방법

### 방법 1: pathname 기반 감지

```tsx
'use client';
import { usePathname } from 'next/navigation';

function LeagueStandings() {
  const pathname = usePathname();

  // 404 감지 로직 (존재하지 않는 경로 패턴)
  const is404 = /* 감지 로직 */;

  const { data } = useLeagueStandings({
    enabled: !is404 && !isMobile,
  });
}
```

**문제점:** 클라이언트에서 404 여부를 정확히 알기 어려움

### 방법 2: Context 기반 전달

```tsx
// layout.tsx 또는 page.tsx에서
<NotFoundContext.Provider value={{ isNotFound: true }}>
  {children}
</NotFoundContext.Provider>

// 컴포넌트에서
const { isNotFound } = useNotFoundContext();
const { data } = useLeagueStandings({
  enabled: !isNotFound && !isMobile,
});
```

**장점:** 명시적, 정확함
**단점:** Context 추가 필요

### 방법 3: not-found.tsx에서 별도 렌더

```tsx
// app/not-found.tsx
export default function NotFound() {
  return (
    <NotFoundLayout>
      {/* LeagueStandings, 경기일정 없이 렌더 */}
    </NotFoundLayout>
  );
}
```

**문제점:** Next.js App Router에서 not-found.tsx는 가장 가까운 layout 안에서 렌더됨

---

## 권장 구현 (방법 2: Context)

### 1. NotFoundContext 생성

```tsx
// src/shared/context/NotFoundContext.tsx
'use client';

import { createContext, useContext, ReactNode } from 'react';

interface NotFoundContextType {
  isNotFound: boolean;
}

const NotFoundContext = createContext<NotFoundContextType>({ isNotFound: false });

export function NotFoundProvider({
  children,
  isNotFound = false
}: {
  children: ReactNode;
  isNotFound?: boolean;
}) {
  return (
    <NotFoundContext.Provider value={{ isNotFound }}>
      {children}
    </NotFoundContext.Provider>
  );
}

export function useNotFound() {
  return useContext(NotFoundContext);
}
```

### 2. not-found.tsx에서 Provider 사용

```tsx
// app/(site)/not-found.tsx
import { NotFoundProvider } from '@/shared/context/NotFoundContext';

export default function NotFound() {
  return (
    <NotFoundProvider isNotFound={true}>
      <div>404 - 페이지를 찾을 수 없습니다</div>
    </NotFoundProvider>
  );
}
```

### 3. 컴포넌트에서 사용

```tsx
// LeagueStandings.tsx
import { useNotFound } from '@/shared/context/NotFoundContext';

function LeagueStandings() {
  const { isNotFound } = useNotFound();

  const { data } = useLeagueStandings({
    enabled: !isNotFound && !isMobile,
  });

  if (isNotFound) return null;

  // ... 렌더링
}
```

---

## 우선순위 판단

| 항목 | 서버 부하 | 클라 부하 | 우선순위 |
|------|----------|----------|---------|
| RightSidebar (Phase 1) | ⚠️ 높음 | - | ✅ 완료 |
| LeagueStandings | 낮음 | 중간 | 선택 |
| 모바일 경기일정 | 낮음 | 중간 | 선택 |

**결론:** Phase 1 (RightSidebar 캐시)이 핵심. Phase 2는 선택사항.

---

## 검증 방법

1. 404 URL 접속 (`/boards/xxx/999999`)
2. 브라우저 DevTools > Network 탭
3. LeagueStandings, 경기일정 관련 API 호출 없음 확인

---

## 참고

- Phase 1이 완료되면 404에서 서버 DB 부하는 거의 0에 가까움
- Phase 2는 클라이언트 측 최적화로, UX/네트워크 비용 절감 목적
- 필수는 아니며 필요 시 진행
