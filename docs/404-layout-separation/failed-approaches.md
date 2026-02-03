# 시도했던 방식들 (실패 기록)

## 개요

"404에서 헤더/사이드바 UI를 숨기기" 위해 시도한 방식들의 실패 기록.

결론: Next App Router에서 "404일 때 layout 분리"는 구조적으로 비효율.
정석은 **레이아웃은 가볍게 유지 + 데이터 호출 비용 최소화**.

---

## 방식 1: Parallel Routes + Context

### 아이디어

```
layout.tsx
  └── LayoutProvider (Context로 children 전달)
        └── @chrome (SiteLayoutClient)
              └── useLayoutChildren() → children 가져옴
```

### 실패 이유

- **렌더링 21~64초 소요**
- 서버 컴포넌트를 Context로 전달 시 직렬화 오버헤드
- 무한 로딩 발생

### 관련 파일 (삭제됨)

- `(site)/LayoutContext.tsx`
- `(site)/@chrome/*`

---

## 방식 2: Parallel Routes + Portal

### 아이디어

```
layout.tsx
  ├── @chrome (프레임만, renderChildren=false)
  │     └── <main id="main-content"> (빈 컨테이너)
  │
  └── MainContentPortal
        └── children → Portal → #main-content로 주입
```

### 실패 이유

- **SSR에서 Portal 동작 안 함**
- 서버에서 children 렌더 안 됨
- 클라이언트에서만 Portal 작동 → 콘텐츠 안 보임

### 관련 파일 (삭제됨)

- `(site)/MainContentPortal.tsx`
- `(site)/@chrome/*`

---

## 방식 3: Parallel Routes + CSS (`display: contents`)

### 아이디어

```tsx
// layout.tsx
return (
  <>
    {chrome}
    <div style={{ display: 'contents' }}>
      {children}
    </div>
  </>
);
```

### 실패 이유

- `display: contents`는 DOM에서 wrapper만 제거
- children이 chrome 내부 main 영역에 들어가지 않음
- **Parallel Routes 구조상 children을 @chrome 내부로 전달 불가**
  - children과 chrome은 형제 관계

---

## 왜 Parallel Routes가 안 되는가?

### Next.js Parallel Routes 구조

```
layout.tsx
├── @chrome/page.tsx (형제 1)
└── children (형제 2)
```

- `@chrome`과 `children`은 **형제 관계**
- layout에서 children을 @chrome 내부로 전달할 방법 없음
- Context/Portal/CSS 모두 이 구조적 한계를 극복 못함

### 404에서 @chrome이 null이 되려면?

- `@chrome/default.tsx`가 null 반환해야 함
- 하지만 `@chrome/[...slug]/page.tsx`가 모든 경로에 매칭
- `notFound()` 호출해도 @chrome은 계속 렌더됨

---

## 결론

| 접근 방식 | 문제 |
|----------|------|
| Parallel Routes 분리 | 구조적으로 불가능 |
| 404에서 layout 제외 | Next App Router 지원 안 함 |

**대안**: 레이아웃 유지 + 데이터 호출 비용 최소화 (요청 간 캐시)

---

## 참고: Next.js의 layout 동작

```
요청: /boards/nonexistent/999999

1. (site)/layout.tsx 실행 (항상)
   └── RightSidebar 생성 → 5쿼리 실행

2. (site)/boards/[slug]/[postNumber]/page.tsx 실행
   └── notFound() 호출

3. not-found.tsx 렌더
   └── 하지만 layout은 이미 실행됨!
```

**핵심**: `notFound()`는 page만 교체함. layout은 이미 실행된 후.
