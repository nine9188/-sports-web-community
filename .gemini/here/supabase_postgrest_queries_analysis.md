# Supabase PostgREST Database API 쿼리 사용 현황 분석

이 보고서는 프로젝트 코드베이스 전반에서 Supabase Database API (PostgREST)를 호출하는 서버 액션 및 API Route를 분석한 결과입니다. (지시 사항에 따라 코드는 절대 수정하지 않았으며, 오직 현황만 조사했습니다.)

---

## 1. 도메인별 서버 액션 (Server Actions) 분석

### 1) 게시판 도메인 (`src/domains/boards/actions`)
가장 활발하게 PostgREST를 사용하며, 대용량 데이터(본문 HTML 등)를 포함할 가능성이 높아 Egress 관리에 매우 중요한 영역입니다.

| 파일명 | 주요 기능 | 대상 테이블 | Egress 절감 특징 |
| :--- | :--- | :--- | :--- |
| `getPosts.ts` | 게시글 목록 조회 | `posts`, `boards`, `profiles`, `comments` | `content` 컬럼을 쿼리에서 제외하고 요약(`summary`)과 `thumbnail_url`만 가져와 목록을 구성함. |
| `getPostDetails.ts` | 게시글 상세 조회 | `posts`, `posts_content`, `comments`, `post_files` | 본문이 저장된 `posts_content` 테이블을 별도로 쿼리하며, 상세조회 시 데이터 캐싱 처리(`getCachedPostDetail`)를 통해 direct hit를 절감함. |
| `getAllPopularPosts.ts` | 인기글 목록 조회 | `posts`, `comments`, `football_teams`, `leagues`, `shop_items` | `content`를 제외하고 `likes`, `views`, `comment_count`를 읽어 HOT 점수를 계산해 반환. |
| `getCachedPostMeta.ts` | SEO 메타데이터 조회 | `posts`, `posts_content` | `unstable_cache`를 타며, `generateMetadata` 시 설명으로 사용할 200자 요약본(`content_summary`)만 빌드해 제공. |
| `comments/get.ts` | 댓글 목록 조회 | `comments`, `profiles` | 특정 `post_id`에 속한 댓글 메타데이터 및 텍스트 쿼리. |
| `posts/create.ts` / `update.ts` | 글 생성 및 수정 | `posts`, `posts_content` | 쓰기 쿼리 발생. `extractFirstImageUrl`로 썸네일을 자동 추출하여 `posts.thumbnail_url`에 저장. |

### 2) 라이브스코어 도메인 (`src/domains/livescore/actions`)
경기 통계, 리그 정보, 팀/선수 프로필 등 주기적이고 정적인 스포츠 데이터를 다량 조회하는 영역입니다.

| 파일명 | 주요 기능 | 대상 테이블 | Egress 절감 특징 |
| :--- | :--- | :--- | :--- |
| `player/slug.ts` | 선수 canonical slug 조회 | `football_players` | `cache: 'force-cache'`를 얹은 REST `fetch`를 이용하여 Next.js 캐싱을 활용해 canonical slug를 조회. |
| `teams/slug.ts` | 팀 canonical slug 조회 | `football_teams` | 선수 slug 쿼리와 마찬가지로 `force-cache`를 통해 데이터베이스 호출을 차단. |
| `teamLeagueData.ts` | 팀/리그 정보 조회 | `football_teams`, `leagues` | 팀 ID 및 리그 ID로 메타데이터 조회. |

### 3) 관리자 도메인 (`src/domains/admin/actions`)
| 파일명 | 주요 기능 | 대상 테이블 | Egress 절감 특징 |
| :--- | :--- | :--- | :--- |
| `cacheManagement.ts` | 수동 캐시 갱신 및 상태 조회 | `asset_cache`, `posts`, `comments` | `{ head: true }` 옵션 등을 적극 활용하여 단순 카운트 체크 및 로컬 캐시 관리 쿼리 수행. |
| `thumbnail.ts` | 분석글 썸네일 일괄 메이커 | `posts` | 썸네일 수동 업로드 및 캐시 무효화 갱신용 쿼리. |

### 4) 인증 및 프로필 도메인 (`src/domains/auth/actions`)
| 파일명 | 주요 기능 | 대상 테이블 |
| :--- | :--- | :--- |
| `auth.ts` | 세션 및 유저 체크 | `profiles` |
| `signup.ts` | 네이버 등 소셜 로그인 및 회원가입 | `profiles` |

---

## 2. API Routes 및 REST Endpoints (`src/app/api`)

API 라우트 중 외부 크론(Cron Job)이나 클라이언트 측 비동기 호출을 통해 Supabase DB에 직접 쿼리를 수행하는 지점들입니다.

### 1) RSS 피드 생성 (`src/app/rss.xml/route.ts`)
* **쿼리**: `posts` 테이블의 상위 50개 글에 대해 `id, title, created_at, posts_content (content)` 컬럼을 대용량으로 select 합니다.
* **비고**: RSS 봇이 긁어갈 때마다 PostgREST Egress를 유발하므로, 주기적인 정적 캐싱(ISR 등) 처리가 필요합니다.

### 2) 스포츠 데이터 동기화 크론
* **`api/sync-fixtures/route.ts`**: `fixtures` 데이터를 Supabase DB에 업데이트/조회합니다.
* **`api/sync-highlights/route.ts`**: 경기 유튜브 하이라이트 데이터를 `posts`와 `football_highlights` 테이블에 select/insert/update 합니다.

### 3) 기타 클라이언트 유틸
* **`api/post-polls/vote/route.ts`**: 투표 참여 처리 (`post_polls` 쿼리 수행).
* **`api/posts/[postId]/reaction/route.ts`**: 게시글 좋아요/싫어요 처리 (`post_likes` 쿼리 수행).

---

## 3. PostgREST Egress 관점에서의 특이점 및 잠재적 리스크 분석

### 1) 미들웨어 찌꺼기 제거 효과 (직접 접속 및 봇 차단)
* **현황**: 코드베이스를 검토한 결과, 대다수의 `<Link>` 컴포넌트에 명시적으로 `prefetch={false}`가 지정되어 있어 **프리패치 트래픽 자체는 발생하지 않는 구조**였습니다.
* **진짜 원인**: 미들웨어에서 DB 호출이 터진 이유는 프리패치 때문이 아니라, **사용자가 선수/팀 관련 페이지를 직접 클릭해 접속할 때마다 매번, 그리고 검색엔진 봇(Googlebot 등)이 페이지들을 크롤링하여 훑고 지나갈 때마다** 쿼리가 꽂혔기 때문입니다.
* **효과**: 이번 미들웨어 리다이렉트 쿼리 제거로 인해, 직접 유입 및 봇 크롤링으로 발생하던 막대한 미들웨어 레벨의 중복 PostgREST 트래픽이 100% 원천 차단되었습니다.

### 2) [NEW/경고] 댓글 수 카운트 쿼리 비효율성 (`fetchCommentCounts` 및 `getPostDetails.ts`)
* **위치**: 
  * `src/domains/boards/actions/posts/fetchPostsHelpers.ts` 내 `fetchCommentCounts`
  * `src/domains/boards/actions/getPostDetails.ts` 내 하단 목록 댓글 수 집계
* **원인**: 
  * 목록 조회 시 각 게시글의 댓글 개수를 표시하기 위해 Supabase DB에 다음과 같은 쿼리를 날립니다.
    ```typescript
    supabase.from('comments').select('post_id').in('post_id', postIds)...
    ```
  * 이 쿼리는 DB 단에서 `COUNT`와 `GROUP BY`로 레코드 개수만 집계해서 받아오지 않고, **해당하는 모든 댓글 로우의 `post_id`를 JSON 배열로 전부 전송받아 서버 메모리 단에서 루프(`forEach`)를 돌려 개수를 세는 방식**으로 구현되어 있습니다.
* **Egress 리스크**: 댓글이 누적되고 활성화될수록, 목록을 조회할 때마다 불필요하게 비대해진 댓글 ID JSON 데이터가 PostgREST 응답으로 실려 나가며 상당한 Database Egress 낭비를 초래하게 됩니다.
* **개선 방향 (향후)**: DB SQL단에서 `COUNT` 및 `GROUP BY` 처리가 되도록 쿼리를 변경하거나 Supabase RPC를 통해 가공된 숫자 데이터만 응답받도록 변경하는 것이 매우 권장됩니다.

### 3) RSS XML 생성 쿼리 (`rss.xml`)
* **원인**: 게시판 최신글 50개의 본문 HTML(`content`)이 조인되어 쿼리되므로 1회 호출 시의 응답 크기가 매우 큽니다.
* **리스크**: RSS 리더나 크롤링 봇이 이 경로를 자주 긁어갈 경우, 본문 전체 트래픽이 그대로 누출됩니다.
* **개선 방향 (향후)**: RSS Route 자체에 강력한 서버사이드 캐싱 헤더를 입히거나 Static/ISR 빌드를 적용하여 DB direct 호출 횟수를 감축하는 것이 유용합니다.
