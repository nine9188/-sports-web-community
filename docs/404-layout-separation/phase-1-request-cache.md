# Phase 1: RightSidebar 요청 간 캐시 적용

## 목표

404 다이렉트 유입에서 RightSidebar의 5개 DB 쿼리 비용을 0에 가깝게 만들기

## 상태

- [x] getHotdealBestPosts 캐시 적용 (300초 revalidate)
- [x] getCachedTopicPosts 요청 간 캐시로 승격 (120초 revalidate)
- [x] getHotPosts 요청 간 캐시로 승격 (120초 revalidate)
- [ ] 테스트 및 검증
- [ ] 배포

---

## 현재 문제

### RightSidebar가 매 요청마다 실행하는 쿼리

```tsx
// RightSidebar.tsx
const [viewsData, likesData, commentsData, hotData, hotdealData] = await Promise.all([
  getCachedTopicPosts('views'),      // DB 쿼리
  getCachedTopicPosts('likes'),      // DB 쿼리
  getCachedTopicPosts('comments'),   // DB 쿼리
  getHotPosts({ limit: 20 }),        // DB 쿼리
  getHotdealBestPosts(10, 3)         // DB 쿼리 (캐시 없음!)
]);
```

### 캐시 현황

| 함수 | 파일 | react cache() | 요청 간 캐시 |
|------|------|--------------|-------------|
| getCachedTopicPosts | topicPosts.ts | ✅ | ❌ |
| getHotPosts | getHotPosts.ts | ✅ | ❌ |
| getHotdealBestPosts | getHotdealBestPosts.ts | ❌ | ❌ |

---

## 해결: unstable_cache 적용

### Next.js unstable_cache 특징

```tsx
import { unstable_cache } from 'next/cache';

const getCachedData = unstable_cache(
  async () => {
    // DB 쿼리
  },
  ['cache-key'],           // 캐시 키
  { revalidate: 60 }       // 60초마다 재검증
);
```

- **요청 간 캐시 공유** (react cache와 다름)
- revalidate로 캐시 만료 시간 설정
- 태그 기반 수동 무효화 가능

---

## 구현 계획

### 1. getHotdealBestPosts (우선순위 높음 - 캐시 없음)

```tsx
// getHotdealBestPosts.ts
import { unstable_cache } from 'next/cache';

const getCachedHotdealBestPosts = unstable_cache(
  async (limit: number, windowDays: number) => {
    // 기존 로직
  },
  ['hotdeal-best-posts'],
  { revalidate: 300 }  // 5분
);

export async function getHotdealBestPosts(limit = 10, windowDays = 3) {
  return getCachedHotdealBestPosts(limit, windowDays);
}
```

### 2. getCachedTopicPosts

```tsx
// topicPosts.ts
import { unstable_cache } from 'next/cache';

const getTopicPostsWithCache = unstable_cache(
  async (type: 'views' | 'likes' | 'comments' | 'hot') => {
    // 기존 로직 (react cache 제거)
  },
  ['topic-posts'],
  { revalidate: 60 }  // 1분
);

export async function getCachedTopicPosts(type) {
  return getTopicPostsWithCache(type);
}
```

### 3. getHotPosts

```tsx
// getHotPosts.ts
import { unstable_cache } from 'next/cache';

const getHotPostsWithCache = unstable_cache(
  async (options) => {
    // 기존 로직 (react cache 제거)
  },
  ['hot-posts'],
  { revalidate: 60 }  // 1분
);

export async function getHotPosts(options) {
  return getHotPostsWithCache(options);
}
```

---

## 권장 revalidate 값

| 데이터 | revalidate | 이유 |
|--------|-----------|------|
| TOP 글 (조회수/좋아요/댓글) | 60초 | 자주 변하지만 1분 정도는 괜찮음 |
| HOT 글 | 60초 | 점수 계산 포함, 실시간성 필요 |
| 핫딜 베스트 | 300초 | 3일 윈도우라 자주 안 바뀜 |

---

## 테스트 방법

### 1. 로컬 테스트

```bash
# 개발 서버 시작
npm run dev

# 없는 URL 접속
curl http://localhost:3000/boards/nonexistent/999999

# 서버 로그에서 DB 쿼리 확인
# 첫 요청: 쿼리 실행
# 두 번째 요청 (revalidate 내): 쿼리 없음 (캐시 hit)
```

### 2. 검증 포인트

- [ ] 첫 요청에서만 DB 쿼리 발생
- [ ] revalidate 시간 내 재요청 시 캐시 hit
- [ ] revalidate 시간 후 요청 시 백그라운드 재검증
- [ ] 정상 페이지에서도 캐시 정상 동작

---

## 주의사항

### unstable_cache 주의점

1. **직렬화 가능한 데이터만** - 함수, Date 객체 등 불가
2. **캐시 키 설계 중요** - 인자가 다르면 다른 캐시
3. **에러 처리** - 캐시 실패 시 폴백 필요

### 마이그레이션 시

1. 기존 `react cache()` 제거
2. `unstable_cache`로 교체
3. 반환 타입 확인 (직렬화 가능 여부)

---

## 롤백 방법

문제 발생 시:

```bash
git checkout src/domains/sidebar/actions/topicPosts.ts
git checkout src/domains/sidebar/actions/getHotPosts.ts
git checkout src/domains/sidebar/actions/getHotdealBestPosts.ts
```

---

## 구현 결과

> Phase 1 구현 완료 (2024-02-03)

### 적용된 revalidate 값

| 함수 | 파일 | revalidate | 캐시 키 |
|------|------|-----------|--------|
| getCachedTopicPosts | topicPosts.ts | 120초 | `['sidebar', 'topic-posts', type]` |
| getHotPosts | getHotPosts.ts | 120초 | `['sidebar', 'hot-posts', limit, minScore]` |
| getHotdealBestPosts | getHotdealBestPosts.ts | 300초 | `['sidebar', 'hotdeal-best', limit, windowDays]` |

### 성능 개선 (예상)

| 시나리오 | Before | After |
|----------|--------|-------|
| 404 첫 요청 | 5쿼리 | 5쿼리 (동일) |
| 404 반복 요청 (120초 내) | 5쿼리 | 0쿼리 (캐시) |
| 크롤러 대량 404 | N×5쿼리 | 5쿼리 (캐시 공유) |

### 발견된 이슈

(테스트 후 기록)
