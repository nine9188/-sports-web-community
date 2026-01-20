# Streaming/Suspense 전면 도입 계획

## 1. 개요

### 1.1 Streaming이란?

Next.js App Router의 **Streaming**은 서버에서 HTML을 점진적으로 전송하는 기술입니다.

```
기존 방식 (Blocking):
┌─────────────────────────────────────────────────────┐
│ 서버: 모든 데이터 fetch (4초) → 전체 HTML 전송      │
│ 클라이언트: 4초 대기 → 한번에 전체 페이지 표시      │
└─────────────────────────────────────────────────────┘

Streaming 방식:
┌─────────────────────────────────────────────────────┐
│ 서버: 껍데기 HTML 즉시 전송 → 데이터 도착 시 추가 전송 │
│ 클라이언트: 즉시 레이아웃 표시 → 순차적으로 채워짐    │
└─────────────────────────────────────────────────────┘
```

### 1.2 왜 필요한가?

| 지표 | 현재 | Streaming 적용 후 |
|------|------|-------------------|
| FCP (First Contentful Paint) | 느림 | 즉시 |
| LCP (Largest Contentful Paint) | 모든 데이터 대기 | 점진적 개선 |
| 사용자 체감 | "로딩 오래 걸림" | "빠르다" |
| SEO | 동일 | 동일 (서버 렌더링) |

### 1.3 현재 상태

```
loading.tsx 파일: 6개 (기본 스켈레톤만)
Suspense 사용: 거의 없음
Streaming: 미적용
```

---

## 2. 구현 패턴

### 2.1 기본 패턴: Suspense + async 컴포넌트

```tsx
// ❌ 현재 방식 - 모든 데이터 대기
export default async function MatchPage({ params }: Props) {
  const { id } = await params;
  const match = await getMatch(id);        // 2초
  const stats = await getStats(id);        // 1초
  const comments = await getComments(id);  // 1초
  // 총 4초 후에야 페이지 표시

  return (
    <div>
      <MatchInfo match={match} />
      <MatchStats stats={stats} />
      <Comments comments={comments} />
    </div>
  );
}

// ✅ Streaming 방식 - 점진적 로딩
export default async function MatchPage({ params }: Props) {
  const { id } = await params;

  return (
    <div>
      <Suspense fallback={<MatchInfoSkeleton />}>
        <MatchInfo id={id} />
      </Suspense>
      <Suspense fallback={<MatchStatsSkeleton />}>
        <MatchStats id={id} />
      </Suspense>
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments id={id} />
      </Suspense>
    </div>
  );
}

// 각 컴포넌트가 자체적으로 데이터 fetch
async function MatchInfo({ id }: { id: string }) {
  const match = await getMatch(id);  // 이 컴포넌트만 2초 대기
  return <div>{/* match 정보 */}</div>;
}

async function MatchStats({ id }: { id: string }) {
  const stats = await getStats(id);  // 1초 후 표시
  return <div>{/* stats 정보 */}</div>;
}
```

### 2.2 병렬 데이터 fetch + Suspense

```tsx
// 독립적인 데이터는 병렬로 fetch
export default async function MatchPage({ params }: Props) {
  const { id } = await params;

  // 병렬로 시작 (Promise.all 아님 - 각각 독립적)
  return (
    <div>
      {/* 레이아웃은 즉시 표시 */}
      <header>경기 상세</header>

      {/* 각 섹션은 독립적으로 로딩 */}
      <div className="grid grid-cols-2 gap-4">
        <Suspense fallback={<TeamInfoSkeleton />}>
          <HomeTeam id={id} />
        </Suspense>
        <Suspense fallback={<TeamInfoSkeleton />}>
          <AwayTeam id={id} />
        </Suspense>
      </div>

      <Suspense fallback={<TimelineSkeleton />}>
        <MatchTimeline id={id} />
      </Suspense>
    </div>
  );
}
```

### 2.3 중첩 Suspense (Nested Suspense)

```tsx
// 중요도에 따른 계층적 로딩
export default function BoardPage() {
  return (
    <div>
      {/* 1단계: 게시판 헤더 (가장 빠름) */}
      <Suspense fallback={<HeaderSkeleton />}>
        <BoardHeader />

        {/* 2단계: 게시글 목록 (헤더 후) */}
        <Suspense fallback={<PostListSkeleton />}>
          <PostList />

          {/* 3단계: 페이지네이션 (목록 후) */}
          <Suspense fallback={<PaginationSkeleton />}>
            <Pagination />
          </Suspense>
        </Suspense>
      </Suspense>
    </div>
  );
}
```

---

## 3. 적용 대상 페이지 분석

### 3.1 우선순위 높음 (영향도 큼)

| 페이지 | 현재 fetch | Streaming 적용 |
|--------|-----------|----------------|
| `/boards/[slug]` | 1회 (통합) | 헤더/목록/인기글 분리 |
| `/boards/[slug]/[postNumber]` | 4-5회 | 본문/댓글/관련글 분리 |
| `/livescore/football` | 1회 | 날짜별/리그별 분리 |
| `/livescore/football/match/[id]` | 5-6회 | 기본정보/타임라인/통계/라인업 분리 |
| `/livescore/football/team/[id]` | 4-5회 | 팀정보/선수/일정/순위 분리 |
| `/livescore/football/player/[id]` | 3-4회 | 선수정보/통계/이적/트로피 분리 |

### 3.2 우선순위 중간

| 페이지 | 현재 fetch | Streaming 적용 |
|--------|-----------|----------------|
| `/shop` | 2-3회 | 카테고리/상품목록 분리 |
| `/settings/*` | 2-3회 | 프로필/포인트/경험치 분리 |
| `/user/[publicId]` | 3-4회 | 프로필/게시글/댓글 분리 |

### 3.3 우선순위 낮음 (이미 빠름)

| 페이지 | 이유 |
|--------|------|
| `/signin`, `/signup` | 데이터 fetch 적음 |
| `/help/*` | 정적 콘텐츠 |
| `/terms`, `/privacy` | 정적 콘텐츠 |

---

## 4. 구현 계획

### Phase 1: 게시글 상세 페이지 (가장 효과적)

**대상**: `/boards/[slug]/[postNumber]/page.tsx`

**현재 구조**:
```tsx
export default async function PostPage({ params }) {
  const data = await getPostPageAllData(slug, postNumber);
  // 본문 + 댓글 + 관련글 + 작성자정보 모두 대기

  return (
    <PostDetail data={data} />
  );
}
```

**개선 구조**:
```tsx
export default async function PostPage({ params }) {
  const { slug, postNumber } = await params;

  return (
    <div>
      {/* 본문: 최우선 */}
      <Suspense fallback={<PostContentSkeleton />}>
        <PostContent slug={slug} postNumber={postNumber} />
      </Suspense>

      {/* 댓글: 본문 다음 */}
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments slug={slug} postNumber={postNumber} />
      </Suspense>

      {/* 관련글: 마지막 */}
      <Suspense fallback={<RelatedPostsSkeleton />}>
        <RelatedPosts slug={slug} />
      </Suspense>
    </div>
  );
}
```

**예상 효과**:
- FCP: 4초 → 0.5초
- 본문 표시: 4초 → 1.5초
- 전체 완료: 4초 → 4초 (동일하지만 체감 빠름)

### Phase 2: 경기 상세 페이지

**대상**: `/livescore/football/match/[id]/page.tsx`

**개선 구조**:
```tsx
export default async function MatchPage({ params }) {
  const { id } = await params;

  return (
    <div>
      {/* 기본 정보: 즉시 */}
      <Suspense fallback={<MatchHeaderSkeleton />}>
        <MatchHeader id={id} />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 타임라인: 중요 */}
        <Suspense fallback={<TimelineSkeleton />}>
          <MatchTimeline id={id} />
        </Suspense>

        {/* 통계: 병렬 */}
        <Suspense fallback={<StatsSkeleton />}>
          <MatchStats id={id} />
        </Suspense>

        {/* 라인업: 병렬 */}
        <Suspense fallback={<LineupSkeleton />}>
          <MatchLineup id={id} />
        </Suspense>
      </div>

      {/* H2H: 낮은 우선순위 */}
      <Suspense fallback={<H2HSkeleton />}>
        <HeadToHead id={id} />
      </Suspense>
    </div>
  );
}
```

### Phase 3: 팀/선수 상세 페이지

**대상**:
- `/livescore/football/team/[id]/page.tsx`
- `/livescore/football/player/[id]/page.tsx`

**구조**: Phase 2와 유사하게 섹션별 Suspense 적용

### Phase 4: 게시판 목록 페이지

**대상**: `/boards/[slug]/page.tsx`

**개선 구조**:
```tsx
export default async function BoardPage({ params, searchParams }) {
  const { slug } = await params;

  return (
    <div>
      {/* 게시판 헤더: 즉시 */}
      <Suspense fallback={<BoardHeaderSkeleton />}>
        <BoardHeader slug={slug} />
      </Suspense>

      {/* 공지사항: 빠름 */}
      <Suspense fallback={<NoticeSkeleton />}>
        <NoticeList slug={slug} />
      </Suspense>

      {/* 게시글 목록: 주요 */}
      <Suspense fallback={<PostListSkeleton />}>
        <PostList slug={slug} searchParams={searchParams} />
      </Suspense>

      {/* 인기글 사이드바: 병렬 */}
      <Suspense fallback={<PopularPostsSkeleton />}>
        <PopularPosts slug={slug} />
      </Suspense>
    </div>
  );
}
```

---

## 5. 스켈레톤 컴포넌트 추가 필요

### 5.1 기존 스켈레톤 (src/shared/components/skeletons/)

```
Skeleton          - 기본 애니메이션 박스
TextSkeleton      - 텍스트 라인
CardSkeleton      - 카드 형태
ListSkeleton      - 리스트 아이템
TableSkeleton     - 테이블
AvatarSkeleton    - 프로필 이미지
ButtonSkeleton    - 버튼
ImageSkeleton     - 이미지
StatSkeleton      - 통계 박스
BadgeSkeleton     - 뱃지
```

### 5.2 추가 필요 스켈레톤

| 스켈레톤 | 사용처 |
|----------|--------|
| `PostContentSkeleton` | 게시글 본문 |
| `CommentListSkeleton` | 댓글 목록 |
| `MatchHeaderSkeleton` | 경기 헤더 (스코어, 팀명) |
| `TimelineSkeleton` | 경기 타임라인 |
| `LineupSkeleton` | 라인업 |
| `PlayerStatsSkeleton` | 선수 통계 |
| `TeamInfoSkeleton` | 팀 정보 |
| `H2HSkeleton` | 상대전적 |

---

## 6. 주의사항

### 6.1 Suspense 경계 설계

```tsx
// ❌ 너무 세분화 - 깜빡임 많음
<Suspense fallback={<Skeleton />}>
  <Title />
</Suspense>
<Suspense fallback={<Skeleton />}>
  <Subtitle />
</Suspense>
<Suspense fallback={<Skeleton />}>
  <Description />
</Suspense>

// ✅ 적절한 그룹화
<Suspense fallback={<HeaderSkeleton />}>
  <Header /> {/* Title + Subtitle + Description */}
</Suspense>
```

### 6.2 데이터 의존성 주의

```tsx
// ❌ 의존성 있는 데이터를 분리하면 안됨
<Suspense>
  <UserName userId={userId} />
</Suspense>
<Suspense>
  <UserAvatar userId={userId} />  {/* 같은 user 데이터 */}
</Suspense>

// ✅ 같은 데이터는 함께
<Suspense fallback={<UserCardSkeleton />}>
  <UserCard userId={userId} />  {/* 내부에서 name + avatar 렌더링 */}
</Suspense>
```

### 6.3 에러 경계 함께 사용

```tsx
// Suspense + ErrorBoundary 조합
<ErrorBoundary fallback={<SectionError />}>
  <Suspense fallback={<SectionSkeleton />}>
    <AsyncSection />
  </Suspense>
</ErrorBoundary>
```

---

## 7. 성능 측정

### 7.1 측정 지표

| 지표 | 설명 | 목표 |
|------|------|------|
| FCP | 첫 콘텐츠 표시 | < 1초 |
| LCP | 가장 큰 콘텐츠 표시 | < 2.5초 |
| TTI | 인터랙티브 가능 | < 3.5초 |
| CLS | 레이아웃 변경 | < 0.1 |

### 7.2 측정 방법

```bash
# Lighthouse CI
npx lighthouse https://your-site.com --view

# Web Vitals
npm install web-vitals
```

```tsx
// app/layout.tsx에 Web Vitals 추가
import { useReportWebVitals } from 'next/web-vitals';

export function reportWebVitals(metric) {
  console.log(metric);
  // Sentry나 Analytics로 전송
}
```

---

## 8. 구현 체크리스트

### Phase 1: 게시글 상세

- [ ] `PostContent` async 컴포넌트 분리
- [ ] `Comments` async 컴포넌트 분리
- [ ] `RelatedPosts` async 컴포넌트 분리
- [ ] 각 컴포넌트용 스켈레톤 생성
- [ ] `/boards/[slug]/[postNumber]/page.tsx` 리팩토링
- [ ] 성능 측정 및 비교

### Phase 2: 경기 상세

- [ ] `MatchHeader` async 컴포넌트 분리
- [ ] `MatchTimeline` async 컴포넌트 분리
- [ ] `MatchStats` async 컴포넌트 분리
- [ ] `MatchLineup` async 컴포넌트 분리
- [ ] 각 컴포넌트용 스켈레톤 생성
- [ ] `/livescore/football/match/[id]/page.tsx` 리팩토링

### Phase 3: 팀/선수 상세

- [ ] 팀 페이지 Suspense 적용
- [ ] 선수 페이지 Suspense 적용
- [ ] 스켈레톤 생성

### Phase 4: 게시판 목록

- [ ] 게시판 목록 페이지 Suspense 적용
- [ ] 인기글 사이드바 분리

---

## 9. 예상 결과

### Before (현재)

```
페이지 로딩 시퀀스:
[0s]─────[4s]──────────────────────────
     로딩...        전체 페이지 표시
     (빈 화면)
```

### After (Streaming)

```
페이지 로딩 시퀀스:
[0s]──[0.5s]──[1.5s]──[2.5s]──[4s]
 │      │       │       │      │
 │      │       │       │      └── 관련글 표시
 │      │       │       └── 댓글 표시
 │      │       └── 본문 표시
 │      └── 헤더/레이아웃 표시
 └── 스켈레톤 표시
```

**체감 개선:**
- 첫 화면까지: 4초 → 0.5초
- 주요 콘텐츠까지: 4초 → 1.5초
- 사용자 이탈률 감소 예상

---

*작성일: 2026-01-20*
*대상: Task #18 - Streaming/Suspense 전면 도입*
