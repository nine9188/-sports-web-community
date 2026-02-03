# 404 다이렉트 유입 - 무거운 데이터 호출 차단

## 목표 (요구사항)

- 404에서도 헤더/좌측 네비는 보여도 됨
- 단, 크롤러/검색 유입처럼 **"없는 URL로 다이렉트 진입(404)"** 시 아래 무거운 데이터 호출을 최대한 0(또는 0에 준하게) 만들고 싶음:
  - 모바일 경기일정 (데이터 호출)
  - PC 순위 사이드바 (LeagueStandings)
  - RightSidebar (인기글/핫딜 등)

## 핵심 결론

> **"404에서 레이아웃 자체 분리"는 Next App Router 구조상 비효율/복잡**
> (Parallel Routes도 실사용 난이도 높고 Portal/contents로 해결 불가)
>
> **정석은 레이아웃은 가볍게 유지 + 데이터 호출 비용 최소화 (요청 간 캐시)**

---

## 현재 구조

### 라우트 구조 (단일 그룹)

```
src/app/
├── layout.tsx (Provider만)
├── (site)/
│   ├── layout.tsx        ← 모든 페이지 공통 Shell
│   ├── boards/
│   │   ├── page.tsx
│   │   └── [slug]/
│   │       ├── page.tsx
│   │       └── [postNumber]/
│   │           └── page.tsx   ← 게시글 상세 (site 그룹으로 통합)
│   ├── livescore/
│   └── settings/
```

### 레이아웃 흐름

```
(site)/layout.tsx
  └── SiteLayoutClient (AuthStateManager)
        ├── <HeaderClient />
        ├── <Sidebar />
        ├── <main>{children}</main>
        └── !isMatchPage && <RightSidebar />
```

### 문제점

- `notFound()`가 떠도 `(site)/layout.tsx`는 **먼저 실행됨**
- layout 단계에서 생성/호출되는 데이터는 404에서도 실행됨
- 특히 **RightSidebar**가 서버 컴포넌트라 다이렉트 404 유입에서 서버 DB 부하 발생

---

## 컴포넌트별 호출 위치/위험도

### LeagueStandings (낮음)

- 클라이언트 컴포넌트
- `useLeagueStandings` (React Query 10분 캐시)
- 모바일에서는 `enabled=false` 처리되어 fetch 비활성화
- **서버 폭탄 주범은 아님** (다만 데스크톱 404에서 클라 fetch는 발생 가능)

### RightSidebar (핵심 주범) ⚠️

- **서버 컴포넌트 (async)**
- 매 렌더에서 `Promise.all`로 **5개 쿼리 실행**:
  1. `getCachedTopicPosts('views')`
  2. `getCachedTopicPosts('likes')`
  3. `getCachedTopicPosts('comments')`
  4. `getHotPosts({ limit: 20 })`
  5. `getHotdealBestPosts(10, 3)`
- `(site)/layout.tsx`에서 `<RightSidebar />`를 렌더하는 순간 → **404 다이렉트에서도 5쿼리 실행**

---

## 캐시 현황 (Before → After)

### Before (문제)

| 액션 | react cache() | 요청 간 캐시 |
|------|--------------|-------------|
| getCachedTopicPosts | ✅ | ❌ |
| getHotPosts | ✅ | ❌ |
| getHotdealBestPosts | ❌ | ❌ |

**문제**: `react cache()`는 동일 요청 내 중복 제거만 됨. **요청 간 캐시 공유 안 됨.**
→ 매 페이지 요청마다 RightSidebar의 5개 쿼리가 전부 실행됨 (404 포함)

### After (해결) ✅

| 함수 | 파일 | revalidate | 캐시 키 |
|------|------|-----------|--------|
| `getCachedTopicPosts` | topicPosts.ts | 120초 | `['sidebar', 'topic-posts', type]` |
| `getHotPosts` | getHotPosts.ts | 120초 | `['sidebar', 'hot-posts', limit, minScore]` |
| `getHotdealBestPosts` | getHotdealBestPosts.ts | 300초 | `['sidebar', 'hotdeal-best', limit, windowDays]` |

---

## 해결 방안

### 1순위: RightSidebar 액션 "요청 간 캐시" 전환 ✅ (완료)

`react cache()`만으로는 **요청 간 캐시가 안 됨** (동일 렌더링 사이클 중복 제거용)

→ Next.js `unstable_cache`로 요청 간 캐시 공유 적용

**목표**: "404에서도 실행은 될 수 있지만 **비용이 0에 가깝게**"
(크롤러/검색 유입으로 404가 많아도 DB 부하가 거의 없어짐)

### 2순위: 클라이언트 데이터 호출 차단 (선택)

- LeagueStandings / 모바일 경기일정 같은 클라이언트 훅에서
- 404 화면에서는 `enabled=false`가 되도록 조건 추가
- **1순위(RightSidebar 서버 DB 부하)가 훨씬 크므로 먼저 1순위 적용 권장**

---

## 검증 방법

### 테스트 순서

```bash
# 1. 캐시 완전 초기화
rm -rf .next

# 2. 프로덕션 빌드 (개발 모드는 캐시 동작이 다름)
npm run build && npm run start

# 3. 404 URL로 첫 접속
http://localhost:3000/boards/xxx/999999
# → 터미널에서 [CACHE MISS] 로그 5개 확인

# 4. 새로고침 (F5)
# → [CACHE MISS] 로그 없음 = 캐시 HIT
```

### 확인 포인트

- [ ] 첫 요청에서만 DB 쿼리 발생 (`[CACHE MISS]` 로그)
- [ ] revalidate 시간 내 재요청 시 캐시 HIT (로그 없음)
- [ ] revalidate 시간 후 요청 시 백그라운드 재검증
- [ ] 정상 페이지에서도 캐시 정상 동작

### 성능 개선 결과

| 시나리오 | Before | After |
|----------|--------|-------|
| 404 첫 요청 | 5쿼리 | 5쿼리 (동일) |
| 404 반복 요청 (120초 내) | 5쿼리 | 0쿼리 (캐시) |
| 크롤러 대량 404 | N×5쿼리 | 5쿼리 (캐시 공유) |

---

## 시도했던 방식들 (실패)

자세한 내용은 [failed-approaches.md](./failed-approaches.md) 참고

| 접근 방식 | 문제 |
|----------|------|
| Parallel Routes + Context | 렌더링 21~64초, 직렬화 오버헤드 |
| Parallel Routes + Portal | SSR에서 Portal 동작 안 함 |
| CSS `display: contents` | children을 @chrome 내부로 전달 불가 |
| 404에서 layout 제외 | Next App Router 지원 안 함 |

---

## 관련 문서

- [Phase 1: 요청 간 캐시 적용](./phase-1-request-cache.md) ✅ 완료
- [Phase 2: 클라이언트 호출 차단](./phase-2-client-calls.md) (선택)
- [실패한 접근 방식들](./failed-approaches.md)

---

## 요약

1. **Parallel Routes/Portal/contents로 "404에서 레이아웃 분리"는 구조적으로 비효율**
2. **정석은 레이아웃은 가볍게 유지 + 데이터 호출은 서버 캐시로 비용 최소화**
3. **가장 큰 효과는 RightSidebar 요청 간 캐시 도입**
   - `react cache()`는 요청 간 캐시가 아니라서 404에서도 매번 DB 쿼리 발생
   - `unstable_cache` 적용으로 요청 간 캐시 공유
