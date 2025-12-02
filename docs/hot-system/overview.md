# 사이드바 인기글 시스템 설계 문서

## 📋 개요

사이드바 인기글 시스템은 **슬라이딩 윈도우 방식**을 사용하여 초보 커뮤니티의 낮은 게시글 활동량에 적합하게 설계되었습니다.

**구현 위치**: `src/domains/sidebar/`

---

## 🎯 핵심 설계 원칙

### 1. 슬라이딩 윈도우 방식

- **고정 기간**: 최근 **7일**
- **이유**: 초보 커뮤니티는 하루 게시글이 적기 때문에 충분한 콘텐츠 확보를 위해 1주일 단위로 설정
- **동적 확장 가능**: 향후 커뮤니티 활성화 시 조건부로 기간 단축 가능

### 2. 4가지 인기글 탭

| 탭 | 아이콘 | 정렬 기준 | 설명 |
|---|-------|---------|------|
| **HOT** | 🔥 Flame | 복합 점수 (조회+좋아요×10+댓글×20) × 시간감쇠 | 종합 인기도 |
| **조회수** | 👁️ Eye | `views DESC` | 최근 7일 내 가장 많이 본 글 |
| **추천수** | 👍 ThumbsUp | `likes DESC` | 최근 7일 내 좋아요가 많은 글 |
| **댓글수** | 💬 MessageSquare | `comment_count DESC` | 최근 7일 내 댓글이 많은 글 |

---

## 📂 파일 구조

```
src/domains/sidebar/
├── actions/
│   ├── getHotPosts.ts           # HOT 탭 전용 (복합 점수 + 시간감쇠)
│   └── topicPosts.ts            # 조회수/추천/댓글 탭
├── components/
│   ├── TabsClient.tsx           # 클라이언트 탭 UI
│   └── RightSidebar.tsx         # 서버 컴포넌트 (데이터 페칭)
└── types/
    └── index.ts                 # TypeScript 타입 정의
```

---

## 🔥 HOT 탭 - 복합 점수 알고리즘

### 점수 계산 공식

```typescript
// 1. 기본 점수 (Base Score)
rawScore = (views × 1) + (likes × 10) + (comments × 20)

// 2. 시간 감쇠 (Time Decay)
hoursSince = (현재시간 - 게시글작성시간) / 1시간
maxHours = windowDays × 24  // 7일 = 168시간
timeDecay = max(0, 1 - (hoursSince / maxHours))

// 3. 최종 HOT 점수
hotScore = rawScore × timeDecay
```

### 가중치 설계 이유

| 요소 | 가중치 | 이유 |
|-----|-------|------|
| **조회수** | ×1 | 기본 관심도 (수동적 참여) |
| **좋아요** | ×10 | 적극적 참여 (클릭 필요) |
| **댓글** | ×20 | 최고 수준 참여 (시간 투자) |

### 시간 감쇠 효과

- **방금 올라온 글** (1시간 전): `timeDecay ≈ 0.994` → 거의 감쇠 없음
- **3일 전 글**: `timeDecay ≈ 0.57` → 절반 정도 감쇠
- **7일 전 글**: `timeDecay ≈ 0` → 거의 사라짐

**결과**: 오래된 글은 자동으로 점수가 낮아져 자연스럽게 하위로 내려감

---

## 📊 조회수/추천/댓글 탭

### 공통 로직

```typescript
// 1. 최근 7일 게시글만 조회
const windowStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

// 2. 해당 필드 기준으로 정렬
query = supabase
  .from('posts')
  .select(...)
  .gte('created_at', windowStart)
  .order(sortField, { ascending: false })
  .limit(100);

// 3. 상위 20개만 반환
return posts.slice(0, 20);
```

### 차이점

| 탭 | 정렬 필드 | 댓글 수 계산 |
|---|----------|------------|
| **조회수** | `views` | ❌ 불필요 |
| **추천수** | `likes` | ❌ 불필요 |
| **댓글수** | `created_at` | ✅ 필요 (별도 JOIN) |

---

## 🎨 UI 표시 규칙

### 헤더 표시

```tsx
{postsData.windowDays ? `최근 ${postsData.windowDays}일 기준` : '최근 24시간 기준'}
// 현재: "최근 7일 기준"
```

### HOT 탭 카운트 표시

```tsx
// HOT 탭: 조회수 + 좋아요 함께 표시
<span className="flex items-center gap-2">
  <span><Eye /> {post.views}</span>
  <span><ThumbsUp /> {post.likes}</span>
</span>
```

### 다른 탭 카운트 표시

```tsx
// 조회수 탭: 조회수만
<span><Eye /> {post.views}</span>

// 추천수 탭: 추천수만
<span><ThumbsUp /> {post.likes}</span>

// 댓글수 탭: 댓글수만
<span><MessageSquare /> {post.comment_count}</span>
```

---

## ⚙️ 설정 변경 가이드

### 윈도우 기간 변경

**현재**: 고정 7일
**위치**:
- `src/domains/sidebar/actions/getHotPosts.ts:39`
- `src/domains/sidebar/actions/topicPosts.ts:38`

```typescript
// 현재
let windowDays = 7;

// 14일로 변경하려면
let windowDays = 14;
```

### 동적 윈도우 적용 (커뮤니티 활성화 시)

```typescript
// Step 1: 최근 24시간 게시글 수 확인
const { count: recentCount } = await supabase
  .from('posts')
  .select('*', { count: 'exact', head: true })
  .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
  .eq('is_deleted', false)
  .eq('is_hidden', false);

// Step 2: 활동량에 따른 동적 윈도우
let windowDays = 7;  // 기본값

if (recentCount! >= 100) {
  windowDays = 1;  // 하루 100개 이상 → 1일 윈도우
} else if (recentCount! >= 50) {
  windowDays = 3;  // 하루 50~99개 → 3일 윈도우
}
// 50개 미만 → 7일 유지
```

### HOT 점수 가중치 조정

**위치**: `src/domains/sidebar/actions/getHotPosts.ts:177`

```typescript
// 현재 가중치
const rawScore = (views * 1) + (likes * 10) + (comments * 20);

// 댓글 중요도 더 높이려면
const rawScore = (views * 1) + (likes * 10) + (comments * 50);

// 좋아요 중요도 낮추려면
const rawScore = (views * 1) + (likes * 5) + (comments * 20);
```

---

## 🚀 성능 최적화

### 1. React.cache 적용

```typescript
export const getCachedTopicPosts = cache(async (type: TabType) => {
  // 동일 요청은 캐싱되어 중복 쿼리 방지
});

export const getHotPosts = cache(async (options) => {
  // HOT 점수 계산도 캐싱
});
```

### 2. 병렬 데이터 페칭

```typescript
// RightSidebar.tsx
const [viewsData, likesData, commentsData, hotData] = await Promise.all([
  getCachedTopicPosts('views'),
  getCachedTopicPosts('likes'),
  getCachedTopicPosts('comments'),
  getHotPosts({ limit: 20 })
]);
```

### 3. 쿼리 최적화

- **초기 limit**: 100개만 가져와서 메모리 절약
- **필요한 필드만 SELECT**: `id, title, created_at, views, likes, ...`
- **인덱스 활용**: `created_at` 필드에 인덱스 권장

---

## 📈 향후 개선 방향

### Phase 1: 커뮤니티 성장 시

1. **동적 윈도우 도입**
   - 하루 게시글 50개 이상 → 3일 윈도우
   - 하루 게시글 100개 이상 → 1일 윈도우

2. **캐싱 강화**
   - Redis 도입으로 서버 측 캐싱
   - 1시간마다 갱신

### Phase 2: 개인화

1. **사용자 맞춤 인기글**
   - 팔로우한 게시판 우선 표시
   - 관심 팀/리그 기반 필터링

2. **실시간 HOT 이슈**
   - 최근 1시간 급상승 글 표시
   - 별도 "지금 HOT" 탭 추가

### Phase 3: 고급 분석

1. **AI 기반 추천**
   - 사용자 읽기 패턴 분석
   - 유사 글 추천

2. **시간대별 인기글**
   - 오전/오후/저녁 인기글 분리
   - 주중/주말 패턴 반영

---

## 🔍 트러블슈팅

### 문제 1: 인기글이 비어있음

**원인**: 최근 7일 내 게시글이 없음

**해결**:
```typescript
// windowDays를 14일 또는 30일로 확장
let windowDays = 14;
```

### 문제 2: 오래된 글만 계속 표시됨

**원인**: HOT 탭의 시간 감쇠가 작동하지 않음

**확인**:
```typescript
// getHotPosts.ts:166-170
const postTime = new Date(post.created_at || Date.now()).getTime();
const hoursSince = (now - postTime) / (1000 * 60 * 60);
const timeDecay = Math.max(0, 1 - (hoursSince / maxHours));
```

### 문제 3: 댓글수 탭이 느림

**원인**: 댓글 수 계산 시 JOIN 발생

**해결**:
- `posts` 테이블에 `comment_count` 컬럼 추가 (비정규화)
- 댓글 추가/삭제 시 `comment_count` 증감

---

## 📝 관련 문서

- [HOT 점수 계산 가이드](./HOT_SCORE_GUIDE.md)
- [알림 시스템 설계](../notifications/NOTIFICATION_SYSTEM.md)
- [엣지 함수 설정](../../../supabase/functions/check-hot-posts/README.md)
- [게시판 구조](../boards/README.md)
- [Supabase 스키마](../../shared/types/supabase.ts)

---

**문서 작성일**: 2025-12-02
**최종 업데이트**: 2025-12-02
**버전**: 1.0.0
**작성자**: Claude Code
