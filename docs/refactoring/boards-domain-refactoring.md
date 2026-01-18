# Boards 도메인 리팩토링 계획

## 1. 현재 상태 분석

### 1.1 파일 규모

```
boards 도메인: 149개 파일
├── actions/     28개 파일
├── components/  96개 파일 (문제!)
├── hooks/       4개 파일
├── types/       11개 파일
└── utils/       10개 파일
```

### 1.2 현재 구조

```
boards/
├── actions/
│   ├── comments/        (7개) - 댓글 CRUD
│   ├── posts/           (9개) - 게시글 CRUD
│   ├── hotdeal/         (2개) - 핫딜 관련
│   ├── getBoardPageAllData.ts
│   ├── getBoards.ts
│   ├── getHoverMenuData.ts
│   ├── getPopularPosts.ts
│   ├── getAllPopularPosts.ts
│   ├── getPostDetails.ts
│   ├── getPostForm.ts
│   ├── getPosts.ts
│   ├── matches.ts
│   └── index.ts
│
├── components/
│   ├── board/           (6개) - 게시판 관련
│   ├── cards/           (5개) - 카드 컴포넌트
│   ├── common/          (13개) - 공통 컴포넌트
│   ├── createnavigation/ (2개) - 글쓰기 네비게이션
│   ├── entity/          (1개) - 엔티티 선택
│   ├── form/            (6개) - 폼 컴포넌트
│   ├── hotdeal/         (5개) - 핫딜 컴포넌트
│   ├── layout/          (2개) - 레이아웃
│   ├── match/           (2개) - 매치 카드
│   ├── notice/          (4개) - 공지사항
│   └── post/            (50개!) - 게시글 관련 (문제!)
│       ├── post-content/    (17개)
│       ├── post-edit-form/  (4개)
│       └── postlist/        (15개)
│
├── hooks/
│   ├── board/           (1개)
│   ├── post/            (2개)
│   └── useBoards.ts
│
├── types/
│   ├── board/           (2개)
│   ├── hotdeal/         (3개)
│   ├── post/            (4개)
│   ├── match.ts
│   └── response.ts
│
└── utils/
    ├── board/           (1개)
    ├── comment/         (1개)
    ├── hotdeal/         (4개)
    ├── notice/          (1개)
    └── post/            (1개)
```

---

## 2. 7가지 기본 관점 분석

### 2.1 구조/설계 적절성

| 항목 | 상태 | 설명 |
|------|------|------|
| 도메인 분리 | ⚠️ | 하나의 거대 도메인에 여러 기능 혼재 |
| 컴포넌트 폴더 | ❌ | 96개 파일, post/ 폴더만 50개 |
| 액션 분리 | ✅ | comments/, posts/ 서브폴더 적절 |
| 타입 분리 | ✅ | 기능별 서브폴더 존재 |

### 2.2 데이터 흐름

| 항목 | 상태 | 설명 |
|------|------|------|
| 통합 fetch | ✅ | getBoardPageAllData() 사용 |
| 중복 fetch | ✅ | 리팩토링으로 해결됨 |
| 캐시 사용 | ⚠️ | getHoverMenuData만 cache() 사용 |

### 2.3 유지보수 관점

| 항목 | 상태 | 문제점 |
|------|------|--------|
| 파일 탐색 | ❌ | 96개 컴포넌트 중 원하는 파일 찾기 어려움 |
| 변경 영향 | ⚠️ | 게시글 변경 시 50개 파일 확인 필요 |
| 코드 중복 | ⚠️ | Desktop/Mobile 유사 컴포넌트 존재 |

### 2.4 불필요한 복잡성

```
문제 영역:
├── post-content/renderers/  - 7개의 개별 렌더러
├── postlist/components/     - Desktop/Mobile 분리로 중복
└── common/hover-menu/       - 불필요한 깊은 중첩
```

### 2.5 서버/클라이언트 분리

| 컴포넌트 | 타입 | 비고 |
|----------|------|------|
| ServerBoardList.tsx | 서버 | ✅ |
| ClientBoardList.tsx | 클라이언트 | ✅ |
| ServerPostList.tsx | 서버 | ✅ |
| PostList.tsx | 클라이언트 | 이름 불일치 |
| ServerHoverMenu.tsx | 서버 | ✅ |
| ClientHoverMenu.tsx | 클라이언트 | ✅ |

**명명 규칙 불일치**: Server/Client 접두사 일부만 사용

### 2.6 Next.js + Supabase 방식 준수

| 항목 | 상태 | 설명 |
|------|------|------|
| 서버 액션 | ✅ | 모든 actions/ 파일에 'use server' |
| cache() 사용 | ⚠️ | 일부만 사용 (1/28 액션) |
| 에러 처리 | ✅ | try-catch 적용됨 |

### 2.7 확장성 문제

```
현재 문제:
1. 새 게시글 기능 추가 → post/ 폴더 50개 파일 중 어디?
2. 새 카드 타입 추가 → cards/ vs post-content/renderers/?
3. 모바일 최적화 → postlist/components/mobile/ 별도 관리
```

---

## 3. 추가 관점 분석 (신규)

### 3.1 서버 액션 호출 빈도 & 캐시 전략

#### 현재 cache() 사용 현황

| 파일 | cache() | 비고 |
|------|---------|------|
| getHoverMenuData.ts | ✅ | 유일하게 사용 |
| getBoardPageAllData.ts | ❌ | 미사용 (매번 호출) |
| getBoards.ts | ❌ | 미사용 |
| getPopularPosts.ts | ❌ | 미사용 |
| getPostDetails.ts | ❌ | 미사용 |
| getPosts.ts | ❌ | 미사용 |

**문제**: 28개 액션 중 1개만 cache() 사용

#### 권장 cache() 적용 대상

```typescript
// 높은 우선순위 - 자주 호출되는 읽기 전용
export const getBoards = cache(async () => { ... });
export const getPopularPosts = cache(async (boardId: string) => { ... });

// 중간 우선순위 - 페이지별 캐시
export const getBoardPageAllData = cache(async (slug, page) => { ... });
```

#### revalidation 전략

```
현재 revalidatePath 사용처:
├── posts/create.ts    - 게시글 생성 시
├── posts/setNotice.ts - 공지 설정 시
├── hotdeal/endDeal.ts - 핫딜 종료 시
└── getPosts.ts        - (불필요할 수 있음)
```

### 3.2 불필요한 렌더링

#### 발견된 문제

1. **PostList 재렌더링**
   - 페이지네이션 시 전체 리스트 리렌더링
   - useDeferredValue 미사용

2. **CommentSection**
   - 댓글 추가 시 전체 섹션 리렌더링
   - 개별 댓글 memo 미적용

3. **BoardDetailLayout**
   - 큰 컴포넌트, 부분 업데이트 없음

#### 권장 최적화

```typescript
// 1. 리스트 아이템 memo 적용
const MemoizedPostItem = memo(PostItem);

// 2. 댓글 개별 memo
const MemoizedComment = memo(Comment);

// 3. useDeferredValue 활용
const deferredPosts = useDeferredValue(posts);
```

### 3.3 Supabase / 외부 API 비용

#### Supabase 호출 빈도 (boards 도메인)

| 액션 | 호출 시점 | 예상 빈도 |
|------|----------|----------|
| getBoards | 페이지 로드 | 높음 |
| getPosts | 게시판 진입 | 높음 |
| getPostDetails | 게시글 조회 | 높음 |
| createComment | 댓글 작성 | 중간 |
| likePost | 좋아요 | 중간 |

**Supabase 무료 티어 한도**: 500MB DB, 50K MAU

#### 외부 API (api-sports.io)

```
FOOTBALL_API_KEY 사용처 (40+ 파일):
├── livescore 도메인 전체
├── sidebar/actions/football.ts
└── boards 도메인은 직접 사용 안 함 ✅

요금제: 100 requests/day (무료) ~ 7,500/day (Pro)
```

**위험**: livescore 도메인에서 과도한 호출 시 비용 폭탄 가능

### 3.4 UX / 사용자 동선

#### 첫 진입 동선

```
홈페이지 → 게시판 목록 → 게시글 목록 → 게시글 상세

현재 문제:
1. loading.tsx 없음 - 빈 화면 노출
2. Skeleton 일부만 적용 (PostListSkeleton만 존재)
3. Suspense 미사용
```

#### 로딩 중 상태

| 페이지 | loading.tsx | Skeleton | Suspense |
|--------|-------------|----------|----------|
| boards/[slug] | ❌ | ⚠️ 일부 | ❌ |
| boards/[slug]/[postNumber] | ❌ | ❌ | ❌ |
| boards/[slug]/create | ❌ | ❌ | ❌ |

#### 에러 발생 시 사용자 인지

```typescript
// 현재: 루트 error.tsx만 존재
// 문제: 세분화된 에러 메시지 없음

// 권장: 도메인별 error.tsx
app/boards/error.tsx
app/boards/[slug]/error.tsx
```

### 3.5 보안 / 권한 / 데이터 안전성

#### 서버 액션 권한 검증

| 액션 | auth.getUser() | 권한 체크 | 비고 |
|------|----------------|-----------|------|
| createPost | ✅ | ✅ | 로그인 필수 |
| deletePost | ✅ | ⚠️ | 작성자 확인만 |
| setNotice | ✅ | ✅ | is_admin 체크 |
| createComment | ✅ | ✅ | 로그인 필수 |
| deleteComment | ✅ | ⚠️ | 작성자 확인만 |
| likePost | ✅ | ✅ | 로그인 필수 |

**문제**: 삭제 권한이 작성자만 체크, 관리자 삭제 권한 불명확

#### Supabase RLS 의존도

```sql
-- posts 테이블 예상 RLS
-- 읽기: 모든 사용자
-- 쓰기: 로그인 사용자
-- 삭제: 작성자 또는 관리자

현재: 서버 액션에서 권한 체크 + RLS 이중 보호
권장: RLS를 신뢰하되, 서버 액션에서도 검증 유지
```

#### 클라이언트 노출 위험

| 항목 | 상태 | 설명 |
|------|------|------|
| API 키 | ✅ 안전 | process.env 서버 전용 |
| 사용자 ID | ⚠️ | 게시글에 user_id 노출 |
| 이메일 | ✅ 안전 | 클라이언트 노출 없음 |
| 포인트/레벨 | ⚠️ | 프로필에 노출 (의도적) |

### 3.6 테스트 / 안정성

#### 현재 테스트 현황

```
단위 테스트: 0개 ❌
E2E 테스트: 0개 ❌
통합 테스트: 0개 ❌
```

**심각한 문제**: 테스트 코드 전무

#### 단위 테스트가 막히는 구조

```typescript
// 문제: 서버 액션 내부에서 Supabase 직접 호출
export async function createPost(...) {
  const supabase = await getSupabaseServer(); // 모킹 어려움
  // ...
}

// 권장: 의존성 주입 또는 레포지토리 패턴
export async function createPost(deps = { supabase: getSupabaseServer }) {
  const supabase = await deps.supabase();
  // ...
}
```

#### E2E 없으면 위험한 플로우

| 플로우 | 위험도 | 이유 |
|--------|--------|------|
| 회원가입 → 로그인 | 🔴 높음 | 인증 플로우 깨지면 전체 장애 |
| 게시글 작성 → 조회 | 🔴 높음 | 핵심 기능 |
| 댓글 작성 → 알림 | 🟡 중간 | 연동 복잡 |
| 좋아요 → 포인트 | 🟡 중간 | 트랜잭션 필요 |
| 핫딜 종료 | 🟡 중간 | 타이밍 이슈 |

### 3.7 배포 / 운영

#### 환경변수 의존

```env
# 필수 (없으면 장애)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# 선택 (없으면 기능 제한)
FOOTBALL_API_KEY
OPENAI_API_KEY
SOLAPI_API_KEY
SOLAPI_API_SECRET

# 현재: 환경변수 검증 로직 없음
# 권장: 시작 시 필수 환경변수 체크
```

#### 캐시 무효화

```typescript
// 현재 사용 중인 revalidation
revalidatePath('/boards/[slug]');      // 게시판 페이지
revalidatePath('/boards/[slug]/[id]'); // 게시글 페이지

// 문제: 전체 경로 무효화로 인한 과도한 재생성
// 권장: revalidateTag로 세분화된 무효화
```

#### 로그/모니터링

```
현재:
├── console.error() 사용 - 프로덕션에서 확인 어려움
├── Sentry 등 에러 트래킹 없음
└── API 호출 로깅 없음

권장:
├── 구조화된 로깅 (winston, pino)
├── 에러 트래킹 서비스 연동
└── API 호출 메트릭 수집
```

---

## 4. 리팩토링 계획

### 4.1 Phase 1: 도메인 분할 (1-2주)

#### 현재 → 목표

```
현재: boards/ (149개 파일)

목표:
├── boards/          (50개) - 게시판/게시글 핵심
├── comments/        (20개) - 댓글 독립 도메인
├── content-editor/  (25개) - 에디터/렌더러
└── hotdeal/         (15개) - 핫딜 독립 도메인
```

#### 이동할 파일 목록

**comments/ 도메인으로 이동:**
```
actions/comments/*         → comments/actions/
components/post/Comment*   → comments/components/
hooks/post/useComments.ts  → comments/hooks/
types/post/comment.ts      → comments/types/
utils/comment/*            → comments/utils/
```

**content-editor/ 도메인으로 이동:**
```
components/post/post-content/*     → content-editor/renderers/
components/post/post-edit-form/*   → content-editor/form/
components/form/*                  → content-editor/form/
components/cards/*                 → content-editor/cards/
components/entity/*                → content-editor/entity/
```

**hotdeal/ 도메인으로 이동:**
```
actions/hotdeal/*        → hotdeal/actions/
components/hotdeal/*     → hotdeal/components/
types/hotdeal/*          → hotdeal/types/
utils/hotdeal/*          → hotdeal/utils/
```

### 4.2 Phase 2: 캐시 최적화 (3-5일)

```typescript
// 1. 자주 호출되는 액션에 cache() 적용
// src/domains/boards/actions/getBoards.ts
import { cache } from 'react';
export const getBoards = cache(async (slug: string) => { ... });

// 2. revalidateTag 도입
// src/domains/boards/actions/posts/create.ts
revalidateTag(`board-${boardId}`);
revalidateTag(`posts-${boardId}`);

// 3. 태그 기반 무효화 전략
const CACHE_TAGS = {
  BOARD: (id: string) => `board-${id}`,
  POSTS: (boardId: string) => `posts-${boardId}`,
  POST: (id: string) => `post-${id}`,
  COMMENTS: (postId: string) => `comments-${postId}`,
};
```

### 4.3 Phase 3: UX 개선 (3-5일)

```
추가할 파일:
├── app/boards/loading.tsx
├── app/boards/[slug]/loading.tsx
├── app/boards/[slug]/[postNumber]/loading.tsx
├── app/boards/error.tsx
└── app/boards/[slug]/error.tsx
```

### 4.4 Phase 4: 테스트 기반 구축 (1주)

```
추가할 테스트:
├── src/domains/boards/actions/__tests__/
│   ├── getBoards.test.ts
│   ├── getPosts.test.ts
│   └── createPost.test.ts
├── e2e/
│   ├── auth.spec.ts
│   ├── post-crud.spec.ts
│   └── comment.spec.ts
```

---

## 5. 우선순위 정리

| 순서 | 작업 | 영향 | 난이도 | 예상 기간 |
|------|------|------|--------|----------|
| 1 | comments 도메인 분리 | 구조 개선 | 중 | 2-3일 |
| 2 | hotdeal 도메인 분리 | 구조 개선 | 중 | 1-2일 |
| 3 | content-editor 분리 | 구조 개선 | 상 | 3-4일 |
| 4 | cache() 적용 | 성능 | 중 | 2-3일 |
| 5 | loading.tsx 추가 | UX | 하 | 1일 |
| 6 | error.tsx 세분화 | UX | 하 | 1일 |
| 7 | 핵심 테스트 작성 | 안정성 | 상 | 5-7일 |

---

## 6. 예상 결과

### 6.1 파일 수 변화

| 도메인 | 현재 | 목표 | 감소율 |
|--------|------|------|--------|
| boards | 149개 | 50개 | -66% |
| comments (신규) | - | 20개 | - |
| content-editor (신규) | - | 25개 | - |
| hotdeal (신규) | - | 15개 | - |

### 6.2 개선 효과

- **유지보수성**: 기능별 명확한 분리
- **확장성**: 독립 도메인으로 기능 추가 용이
- **성능**: cache() 적용으로 불필요한 fetch 감소
- **UX**: loading/error 상태 명확화
- **안정성**: 테스트 커버리지 확보

---

*작성일: 2026-01-18*
*대상: boards 도메인 (149개 파일)*
