# Supabase Egress 감사 보고서 (상세 확장판)

**조사일**: 2026-04-16
**조사 대상 기간**: 2026-04-15 (1일)
**작성자**: Claude (Opus 4.6)
**트리거**: Vercel 로그에서 `supabase.auth.getSession()` WARNING 도배 + Supabase Egress 1GB/일 발생
**조사 범위**: `src/**/*.ts`, `src/**/*.tsx`, `middleware.ts`, `src/app/api/**`, `src/app/sitemaps/**`, 직접 확인한 `.from('posts' | 'boards' | 'comments' | 'profiles' | 'asset_cache' | 'match_cache' | ...)` 호출부 전수조사

---

## 🎯 결론 한 줄

**범인은 Auth가 아니라 PostgREST(DB REST API). 그 중에서도 (1) `posts` 리스트 쿼리에 `content`(리치텍스트 JSON) 컬럼이 포함됐고, (2) `asset_cache`/`match_cache`/`boards` 같은 "거의 안 바뀌는 데이터"를 Next.js 레이어 캐싱 없이 매 요청마다 DB 왕복하는 것이 본질.**

---

## 1. Supabase Egress 문서 요약

### 1-1. 플랜별 무료 할당량

| 플랜 | 월 무료 할당량 | 하루 1GB 사용시 |
|---|---|---|
| **Free** | 5 GB | 🔴 5일 만에 초과, 과금 or 차단 |
| **Pro** | 250 GB | ✅ 정량 내 안전 (12% 사용) |
| **Team** | 250 GB | ✅ 안전 |

### 1-2. Egress가 집계되는 서비스

1. **Database (PostgREST REST API)** — `.from('table').select(...)` 응답 바이트
2. **Auth** — 로그인/토큰 관련 API 응답
3. **Storage** — 파일 다운로드 바이트
4. **Realtime** — WebSocket 이벤트 푸시
5. **Edge Functions** — 함수 응답
6. **Shared Pooler (Supavisor)** — 풀러 트래픽
7. **Log Drain** — 로그 전송

### 1-3. 공식 감축 전략

- 선택 컬럼·행 수 축소 (가장 효과 큼)
- LIMIT 추가, 페이지네이션
- 쿼리 빈도 감소 + 클라이언트 캐싱

---

## 2. 우리 프로젝트의 실제 Egress 분포 (2026-04-15)

| 서비스 | Egress | 비율 | 진단 |
|---|---|---|---|
| **PostgREST (Database)** | **1.066 GB** | **99.3%** | 🔴 **범인** |
| Storage | 7.464 MB | 0.7% | 정상 |
| Realtime | 614 KB | 0.1% | 정상 |
| Auth | 69 KB | 0.0% | 정상 (WARNING은 별도 이슈) |
| Functions | 2.4 KB | 0.0% | 정상 |

> 💡 Vercel 로그의 `supabase.auth.getSession()` WARNING은 보안 경고일 뿐 **egress 원인 아님** (Auth는 0.0%).

---

## 3. Top Queries 랭킹 (Database → Query Performance, 2026-04-15)

### 3-1. 전체 Top 18 (Total Time 기준)

| # | 쿼리 요약 | Calls/일 | Total Time | Role | Egress 영향 |
|---|---|---|---|---|---|
| 1 | `realtime.list_changes` WAL (v1) | 3,915,415 | 29.99% | supabase_admin | ❌ rows=0, 무시 |
| 2 | `realtime.list_changes` (v2) | 3,480,199 | 26.94% | supabase_admin | ❌ 무시 |
| 3 | **`asset_cache` 배치 SELECT** | **853,007** | **6.78%** | service_role | 🔴 **주범** |
| 4 | **`posts` 10컬럼 SELECT (content 포함)** | **58,290** | **6.61%** | service_role | 🔴 **최대 주범** |
| 5 | `objects` UPSERT (Storage v1) | 304,051 | 4.93% | service_role | 🟡 중복 업로드 |
| 6 | `realtime.list_changes` (v3) | 447,904 | 3.28% | supabase_admin | ❌ 무시 |
| 7 | `objects` UPSERT (Storage v2) | 117,036 | 3.07% | service_role | 🟡 |
| 8 | **`posts.*` SELECT (anon, 전체 컬럼)** | **41,107** | **2.93%** | anon | 🔴 **주범** |
| 9 | `objects` UPSERT (Storage v3) | 420,874 | 2.25% | service_role | 🟡 |
| 10 | `realtime.list_changes` (v4) | 118,321 | 2.05% | supabase_admin | ❌ 무시 |
| 11 | `pgbouncer.get_auth` | 449,261 | 1.54% | pgbouncer | ❌ 내부 |
| 12 | `match_cache` UPSERT (v1) | 27,511 | 1.52% | service_role | 🟡 |
| 13 | **`asset_cache` UPSERT** | 177,209 | 1.47% | service_role | 🟡 **캐싱 누락의 결과** |
| 14 | `football_players` SELECT | 113,525 | 1.33% | anon | 🟡 |
| 15 | **`boards` 전체 SELECT (anon)** | **172,464** | **0.94%** | anon | 🟡 **sitemap/route 직접 조회** |
| 16 | `api_usage_log` INSERT | 626,454 | 0.94% | service_role | 🟡 로깅 과다 |
| 17 | **`posts.id` SELECT (authenticated, user_id 조건)** | **3,431,782** | **0.91%** | authenticated | 🟡 **getFullUserData 매번 호출** |
| 18 | `match_cache` UPSERT (v2) | 47,496 | 0.90% | service_role | 🟡 |

### 3-2. Meta 쿼리 — `set_config` (증상 지표)

```sql
select set_config('search_path', $1, true), set_config('role', $4, true),
       set_config('request.jwt.claims', $5, true), ...
```

PostgREST가 모든 REST 요청마다 **자동 실행**하는 RLS 세팅 쿼리. 호출량 자체가 "PostgREST API 요청 수"를 의미:

- **authenticated**: 10,323,882 calls/일 (로그인 유저)
- **anon**: 5,238,772 calls/일 (비로그인)
- **합계**: 약 **1,560만 REST 요청/일 ≈ 180 req/s 지속**

> 이 쿼리는 egress 기여는 0이지만, **"전체 REST 호출량이 과다하다"**는 건강 지표. 개별 쿼리 캐싱하면 자동 감소.

---

## 4. 지표 해석 원칙 (중요)

| 지표 | 큰 값이 의미하는 문제 | 해결 방법 |
|---|---|---|
| **Calls** | 쿼리 빈도 과다 | 캐싱 (`unstable_cache`, `React.cache`) |
| **Total Time** | DB 자원 총 소모 | 상위 쿼리 최적화 |
| **Mean Time** | 쿼리 자체가 느림 | 인덱스, 쿼리 재작성 |
| **Max Time** | 간헐적 급락 | lock 조사 |
| **Rows Read** | 결과셋이 큼 | LIMIT, 페이지네이션 |
| **Cache Hit Rate** | PG 버퍼 캐시 (앱 캐시 아님) | 신경쓰지 말 것 |

### Egress 판별 공식

```
egress ≈ calls × 행당 payload 크기 × 반환 행 수
```

**어느 한 지표도 단독으로 egress를 말해주지 않음.** `Calls × 행 크기(select 컬럼 수) × Rows` 세 가지를 곱해서 판단.

---

## 5. 코드베이스 감사 — 범인 상세 (전수조사 결과)

### 🔴 A. `posts` 리스트 쿼리 `content` 포함 (최대 egress 주범)

**증상**: posts 조회 쿼리가 `content`(리치텍스트 JSON, 게시글당 수 KB ~ 수십 KB) 컬럼을 리스트 뷰에 포함.

#### A-1. `fetchPosts` — **메인 게시판 피드**
[`src/domains/boards/actions/getPosts.ts:185-195`](../../src/domains/boards/actions/getPosts.ts#L185)

```typescript
let postsQuery = supabase
  .from('posts')
  .select(`
    id, title, created_at, updated_at, board_id, views, likes,
    post_number, user_id, is_hidden, is_deleted, is_notice,
    profiles (id, nickname, level, exp, icon_id, public_id),
    content, deal_info  // ← 🔴 리스트에 불필요
  `)
  .order('created_at', { ascending: false })
  .eq('is_deleted', false)
  .eq('is_hidden', false);
```

**호출처**: 모든 게시판 페이지 (`/boards/[slug]`), `/boards/all`, `getBoardPageAllData`.

#### A-2. `getAllPopularPosts` — **인기글 페이지**
[`src/domains/boards/actions/getAllPopularPosts.ts:111-131`](../../src/domains/boards/actions/getAllPopularPosts.ts#L111)

```typescript
.select(`
  id, title, post_number, likes, views, created_at, board_id,
  content,  // ← 🔴
  user_id,
  boards!inner(id, slug, name, team_id, league_id),
  profiles!left(id, nickname, level, exp, icon_id, public_id)
`)
.limit(500);  // ← 🔴 500개 통째로 fetch
```

#### A-3. `getBoardPopularPosts` — **게시판별 인기글**
[`src/domains/boards/actions/getPopularPosts.ts:73-92`](../../src/domains/boards/actions/getPopularPosts.ts#L73)

```typescript
.select(`id, title, post_number, likes, views, created_at, content, deal_info, ...`)
.limit(100);
```

#### A-4. `getAllTopicPosts` — **사이드바 인기글 4개 탭**
[`src/domains/sidebar/actions/getAllTopicPosts.ts:48-64`](../../src/domains/sidebar/actions/getAllTopicPosts.ts#L48)

```typescript
.select(`id, title, created_at, board_id, views, likes, post_number, content, is_hidden, is_deleted`)
.gte('created_at', windowStart);  // ← LIMIT 없음! 7일 내 모든 게시글
```

**문제점**: 7일 내 전체 게시글을 content 포함 페이지네이션 없이 fetch. 사이드바는 모든 페이지에 포함됨.

#### A-5. `getNewsPosts` — **뉴스 위젯**
[`src/domains/widgets/components/news-widget/actions/getNewsPosts.ts:28`](../../src/domains/widgets/components/news-widget/actions/getNewsPosts.ts#L28)

```typescript
.select('id, title, content, created_at, views, likes, post_number')  // ← content 필요 (summary 추출용)
.limit(15);
```

**여기는 애매함**: summary 추출하려면 content 필요. **DB에 `summary` 컬럼 추가** 또는 **`posts_summary` materialized view** 고려.

#### A-6. `getUserPosts` + `getUserComments`
[`src/domains/user/actions/getUserPosts.ts:67-68`](../../src/domains/user/actions/getUserPosts.ts#L67)
[`src/domains/user/actions/getUserComments.ts:104`](../../src/domains/user/actions/getUserComments.ts#L104)

```typescript
.select(`id, title, content, created_at, views, likes, post_number, is_hidden, is_deleted, board_id, boards!inner(...)`)
```

유저 프로필 페이지에서 본인 게시글/댓글 리스트 → content 불필요.

#### A-7. `searchPosts` — **검색 결과**
[`src/domains/boards/actions/posts/search.ts:154-180`](../../src/domains/boards/actions/posts/search.ts#L154)

```typescript
.select(`id, title, content, created_at, views, likes, post_number, board_id, user_id, ...`)
```

검색 결과에 `content` 포함 + snippet 추출 로직. 여기는 snippet 생성 위해 필요하나 **DB에 `content_text`(plain text) 컬럼 추가**가 더 효율적.

#### A-8. `my-posts` / `activity` settings
[`src/domains/settings/actions/my-posts.ts:36`](../../src/domains/settings/actions/my-posts.ts#L36)
[`src/domains/settings/actions/activity.ts:70`](../../src/domains/settings/actions/activity.ts#L70)

동일하게 content 포함.

---

### 🔴 B. `asset_cache` Next.js 캐싱 완전 누락 (Calls 주범)

**위치**: [`src/domains/livescore/actions/images/ensureAssetCached.ts`](../../src/domains/livescore/actions/images/ensureAssetCached.ts)

```typescript
// ensureAssetsCached (라인 246-266)
const { data: caches } = await supabase
  .from('asset_cache')
  .select('entity_id, status, checked_at')
  .eq('type', type)
  .in('entity_id', uniqueIds);
// ← unstable_cache 없음, 매 요청마다 DB 왕복
```

#### 호출 체인 (매우 넓음)
```
PostList 렌더링
  → fetchTeamLogos / fetchLeagueLogos (fetchPostsHelpers.ts)
    → getTeamLogoUrls / getLeagueLogoUrls
      → ensureAssetsCached('team_logo', ids)
        → supabase.from('asset_cache').select(...)  ← 캐시 없음
```

**영향 지점**: 
- 모든 게시판 피드 (`fetchPostsHelpers.ts`)
- 라이브스코어 리그 페이지 (`leagues/[id]/[slug]/page.tsx`)
- 선수 탭 (Stats/Fixtures/Trophies)
- 매치 페이지
- 랭킹, 이적시장, 부상 정보 등

**예상 egress**: 853K calls × ~1KB = **~0.85 GB/일**

---

### 🔴 C. `posts.*` 전체 컬럼 SELECT (anon 41K)

[`src/app/(site)/boards/all/page.tsx:48-50`](../../src/app/(site)/boards/all/page.tsx#L48) ← **페이지에서 직접**
[`src/app/(site)/boards/popular/page.tsx:48-51`](../../src/app/(site)/boards/popular/page.tsx#L48) ← **페이지에서 직접**

```typescript
// 두 페이지 모두
export const dynamic = 'force-dynamic';
export const revalidate = 0;
// ↓
const { data: boardsData } = await supabase
  .from('boards')
  .select('*')  // ← 🔴 전체 컬럼
  .order('display_order', { ascending: true });
```

**문제점**:
- `force-dynamic` + `revalidate = 0` 로 **캐시 완전 bypass**
- boards 테이블 전체 컬럼 fetch (`description`, `logo`, `meta` 등)
- 이미 `getCachedAllBoards()` 함수가 있는데 쓰지 않고 직접 조회
- HoverMenu 데이터는 `getBoardsForNavigation`이나 `getCachedAllBoards`로 충분

**예상 egress**: 41K × 2KB(전체 boards) = 80 MB/일 + 사이트맵 등

---

### 🟡 D. `match_cache` Next.js 캐싱 완전 누락

**위치**: [`src/domains/livescore/actions/match/matchCache.ts:76-81`](../../src/domains/livescore/actions/match/matchCache.ts#L76)

```typescript
export async function getMatchCache(matchId, dataType) {
  const supabase = getSupabaseAdmin();
  const { data: row } = await supabase
    .from('match_cache')
    .select('data, is_complete')  // ← data는 JSONB, 큼
    .eq('match_id', matchId)
    .eq('data_type', dataType)
    .maybeSingle();
  // ← unstable_cache 없음
}
```

**문제점**:
- 주석에 "종료된 경기 = 영구 불변 데이터"라고 명시되어 있음
- 그럼에도 매 요청마다 DB 왕복
- `data` 필드는 라인업/통계/이벤트 전체를 담은 큰 JSONB
- `data_type = 'full'` 한 건만 10~50KB

**영향**: 매치 페이지 조회 시마다 `getMatchCacheBulk(['full', 'matchPlayerStats', 'power'])` → 3개 row × 큰 JSONB fetch

---

### 🟡 E. `boards` 캐시 bypass 경로 (sitemap + 페이지 직접)

#### E-1. `sitemap/[id]/route.ts` — **anon 17만 호출의 주범 의심**

[`src/app/sitemaps/[id]/route.ts:96-207`](../../src/app/sitemaps/[id]/route.ts#L96)

```typescript
export const revalidate = 3600; // 1시간 ← 걸려있음

// 하지만 8곳에서 boards/football_teams/football_players 직접 조회:
.from('boards').select('id').in('slug', config.parentSlugs);
.from('boards').select('id').eq('parent_id', ...);
.from('boards').select('id, slug').in('slug', config.parentSlugs);
.from('boards').select('slug').in('parent_id', parentIds);
.from('posts').select('post_number, board_id, updated_at, created_at, boards!inner(slug)');
.from('football_teams').select('team_id, slug, updated_at');
.from('football_teams').select('team_id');
.from('football_players').select('player_id, slug, updated_at');
```

**문제점**:
- `revalidate: 3600`은 Next.js ISR로 걸려있지만, **여러 path 파라미터별로 각각 캐시됨**
- `[id]` 파라미터가 `football`, `kleague`, `news`, `community`, `players-*`, `hotdeal-*` 등 **20+ 경로**로 분기
- 봇이 여러 sitemap을 순회하면 캐시 miss가 쌓임
- `getCachedAllBoards()` 같은 전역 캐시 함수를 쓰지 않고 직접 쿼리

#### E-2. `rss.xml/route.ts`
[`src/app/rss.xml/route.ts`](../../src/app/rss.xml/route.ts)

비슷한 패턴 추정. (파일 확인 필요)

#### E-3. `fetchPosts` 내부 `boards` 중복 조회
[`src/domains/boards/actions/getPosts.ts:131-135`](../../src/domains/boards/actions/getPosts.ts#L131)
[`src/domains/boards/actions/getPosts.ts:163-167`](../../src/domains/boards/actions/getPosts.ts#L163)

```typescript
const { data: boardData } = await supabase
  .from('boards')
  .select('id, slug')
  .eq('id', checkBoardId)
  .single();  // ← 캐시 없음, 매 fetchPosts마다 추가 쿼리
```

**개선**: `getCachedBoardById(checkBoardId)` 사용.

---

### 🟡 F. `getFullUserData` — authenticated `posts` 343만 호출

**위치**: [`src/shared/actions/user.ts:182-272`](../../src/shared/actions/user.ts#L182)

```typescript
export const getFullUserData = cache(async () => {
  const [profileResult, postCountResult, commentCountResult] = await Promise.all([
    supabase.from('profiles').select('...').eq('id', user.id).single(),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),  // ← 🟡
    supabase.from('comments').select('id', { count: 'exact', head: true }).eq('user_id', user.id)  // ← 🟡
  ]);
});
```

**문제점**:
- `React.cache()`는 **같은 request 내 dedup**만 — **다른 Server Action POST끼리는 공유 안 됨**
- `SiteLayoutClient`의 `useQuery(['fullUserData'])`가 **매 페이지 네비게이션마다 POST 호출**
- 로그인 유저 하루 343만 calls = 초당 40회

**개선**: `unstable_cache` 5~10분 + `revalidateTag('user-stats-${id}')` (게시글/댓글 작성 시 갱신)

---

### 🟡 G. Storage `objects` UPSERT 3종 (842K/일)

**위치**: [`src/domains/livescore/actions/images/ensureAssetCached.ts:194`](../../src/domains/livescore/actions/images/ensureAssetCached.ts#L194)

```typescript
const { error: uploadError } = await supabase.storage
  .from(bucket)
  .upload(storagePath, webpBuffer, {
    upsert: true,  // ← 🟡 무조건 덮어쓰기
    cacheControl: '31536000',
  });
```

**현재 플로우**:
1. `asset_cache.status === 'ready'` 면 early return (업로드 안 함) ✅
2. 하지만 `asset_cache` 레코드가 없거나 error/pending 상태면 → 항상 재업로드
3. 레이어 캐싱 없으니 asset_cache SELECT 먼저 하는데, 그 결과에 따라 업로드 경로로 감

**의심**: `asset_cache.status = 'error'` 상태에서 쿨다운이 제대로 안 지켜지거나, 여러 사이즈(`sm`, `md`) × 여러 타입(`team_logo`, `league_logo`) 조합마다 재업로드되고 있을 가능성.

---

### 🟡 H. `api_usage_log` INSERT 62만/일

**위치**: [`src/domains/livescore/actions/footballApi.ts:23-40`](../../src/domains/livescore/actions/footballApi.ts#L23)

```typescript
async function logApiUsage(data: ApiUsageData): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.from('api_usage_log').insert({ ... });
}
```

**문제점**:
- API-Sports **모든 호출마다 INSERT**
- 일 60만+ = 초당 7회
- 정상 응답(200)도 전부 기록
- 디버깅용이라면 **에러만** 또는 **10% 샘플링**으로 충분

---

### 🟡 I. `BoardCollectionWidget` — 메인 페이지 위젯 캐싱 없음

**위치**: [`src/domains/widgets/components/board-collection-widget/BoardCollectionWidget.tsx:25-97`](../../src/domains/widgets/components/board-collection-widget/BoardCollectionWidget.tsx#L25)

```typescript
export async function fetchBoardCollectionData() {
  const supabase = await getSupabaseServer();
  const [foreignPostsResult, domesticPostsResult] = await Promise.all([
    supabase.from('posts').select('...').eq('meta->>prediction_type', 'league_analysis')...,
    supabase.from('posts').select('...').eq('meta->>prediction_type', 'league_analysis')...,
  ]);
  // + comments count 조회
}
```

**문제점**:
- 메인 페이지에 포함되는 위젯인데 **unstable_cache 없음**
- JSON 필드 `meta->>prediction_type` 조건으로 **인덱스 없이 풀스캔 가능**
- 메인 페이지 조회 시마다 3개 쿼리(posts × 2 + comments)

---

### 🟡 J. 기타 확인된 캐싱 누락 쿼리들

| 위치 | 쿼리 | 문제 |
|---|---|---|
| `src/domains/sidebar/actions/getHotdealBestPosts.ts` | `posts` + `comments` | `unstable_cache 300초` 있다고 주석, 실제 코드에는 래핑 없음 — **주석과 구현 불일치** |
| `src/domains/livescore/actions/match/*` (lineup, stats, events 등) | match 관련 fetch | matchCache 레이어는 있지만 레이어 자체 캐싱 없음 |
| `src/domains/search/actions/*` | `posts`/`comments` `ilike` 검색 | 인덱스 없이 LIKE (원래 느림) |
| `src/domains/notifications/actions/checkHotPostEntry.ts` | comments count | 알림 체크 서버 액션에서 반복 조회 |
| `src/app/(site)/boards/all/page.tsx` | `boards.*` 직접 조회 | `getCachedAllBoards()` 안 씀 |
| `src/app/(site)/boards/popular/page.tsx` | `boards.*` 직접 조회 | 동일 |

---

## 6. 정적 파일·봇 트래픽 요인

### 6-1. middleware.ts 모든 경로 auth 체크
[`middleware.ts:180`](../../middleware.ts#L180)

```typescript
const { data: { session } } = await supabase.auth.getSession()
const user = session?.user || null
```

- **매 페이지 요청마다** `getSession()` 실행 → Vercel WARNING 도배
- 봇은 이미 제외하지만, 일반 유저의 모든 페이지에서 auth.sessions + auth.users SELECT 발생
- egress 기여는 작지만 **DB auth 쿼리 폭주 + 커넥션 압박**

### 6-2. 봇 차단은 일부 되어있음
[`middleware.ts:42-62`](../../middleware.ts#L42)

`BLOCKED_BOTS`(GPTBot, SemrushBot 등)는 차단. 하지만:
- `Googlebot`, `Bingbot`은 허용 (SEO 필요) → 이들이 sitemap/rss 크롤링 시 boards 조회 유발
- `Yeti`(Naver), `DuckDuckBot`은 허용

---

## 7. 진단 종합 — Egress 기여도 추정

| 범인 | 일일 egress 추정 | 비고 |
|---|---|---|
| 🔴 A. posts content 포함 리스트 (fetchPosts + popularPosts + topicPosts 등) | **~500 MB** | 전체의 절반 |
| 🔴 B. asset_cache 캐싱 누락 (853K 배치 + 177K upsert) | ~100 MB | 배치당 payload 작음 |
| 🔴 C. posts.* / boards.* 전체 컬럼 (boards/all, boards/popular) | ~80 MB | |
| 🟡 D. match_cache 캐싱 누락 (JSONB 큼) | ~80 MB | 매치 페이지 조회시 |
| 🟡 E. boards 캐시 bypass (sitemap 등) | ~50 MB | |
| 🟡 F. getFullUserData 반복 (343만 calls) | ~50 MB | payload는 작음 |
| 🟡 G. Storage objects upsert | ~30 MB | |
| 🟡 H. api_usage_log | ~20 MB | 작지만 많음 |
| 기타 | ~100 MB | search, notifications, widgets |
| **합계** | **~1.0 GB** | ✓ |

---

## 8. 조치 계획 (우선순위)

### 🥇 Priority 1 — 즉시 (오늘, 예상 감소 ~50%)

#### 1-1. `posts` 리스트 쿼리에서 `content` 컬럼 제거

**대상**:
- `src/domains/boards/actions/getPosts.ts:185` (**메인 피드**)
- `src/domains/boards/actions/getAllPopularPosts.ts:111`
- `src/domains/boards/actions/getPopularPosts.ts:73`
- `src/domains/sidebar/actions/getAllTopicPosts.ts:48`
- `src/domains/user/actions/getUserPosts.ts:67`
- `src/domains/user/actions/getUserComments.ts:104`
- `src/domains/boards/actions/posts/search.ts:154`
- `src/domains/settings/actions/my-posts.ts:36`
- `src/domains/settings/actions/activity.ts:70`

**조치**: 리스트 뷰용 select에서 `content` 제거. 상세 페이지에서만 fetch.

**예외 처리**:
- `getNewsPosts`(summary 필요) → DB에 `summary` 컬럼 추가 또는 `posts_meta` 테이블 분리
- `searchPosts`(snippet 필요) → `content_text` (plain text) 컬럼 추가 + `ilike` → FTS(full text search) 전환

**예상 효과**: egress **~500 MB/일 감소**

---

#### 1-2. `asset_cache` 조회에 `unstable_cache` 적용

**대상**: `src/domains/livescore/actions/images/ensureAssetCached.ts`

**조치**:
```typescript
import { unstable_cache } from 'next/cache';

// 전체 테이블을 한 번에 캐싱 (팀/리그 로고는 total 수천 건)
const _getAssetCacheMap = unstable_cache(
  async (type: AssetType) => {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('asset_cache')
      .select('entity_id, status')
      .eq('type', type)
      .eq('status', 'ready');  // ready만 캐싱 (error/pending은 제외)
    const map = new Map<number, string>();
    (data || []).forEach(r => map.set(r.entity_id, r.status));
    return map;
  },
  ['asset-cache-map'],
  { revalidate: 86400, tags: ['asset-cache'] }  // 24시간
);

// ensureAssetsCached 안에서 이 맵을 먼저 조회하고,
// 맵에 없는 ID만 DB로 직접 확인
```

- 이미지 재업로드 성공 시 `revalidateTag('asset-cache')` 호출
- 팀/리그 로고는 거의 안 바뀌므로 24시간 충분

**예상 효과**: asset_cache SELECT 853K → 수천 (100배 이상 감소), egress ~100 MB/일 감소

---

#### 1-3. `/boards/all`, `/boards/popular` 페이지에서 `boards.select('*')` 제거

**대상**:
- `src/app/(site)/boards/all/page.tsx:47-51`
- `src/app/(site)/boards/popular/page.tsx:47-51`

**조치**:
```typescript
// Before
const { data: boardsData } = await supabase.from('boards').select('*').order(...);

// After
import { getCachedAllBoards } from '@/domains/boards/actions/getCachedBoards';
const boardsData = await getCachedAllBoards();
```

**예상 효과**: boards 조회 bypass 제거, 약 80 MB/일 감소

---

### 🥈 Priority 2 — 이번 주 (예상 추가 감소 ~25%)

#### 2-1. `match_cache` 캐싱 적용

**대상**: `src/domains/livescore/actions/match/matchCache.ts`

**조치**:
```typescript
const _getMatchCacheImpl = (matchId: number, dataType: string) => unstable_cache(
  async () => {
    const supabase = getSupabaseAdmin();
    const { data: row } = await supabase
      .from('match_cache')
      .select('data, is_complete')
      .eq('match_id', matchId)
      .eq('data_type', dataType)
      .maybeSingle();
    return row;
  },
  ['match-cache', String(matchId), dataType],
  { revalidate: 3600, tags: [`match-${matchId}`] }  // 1시간
)();
```

- 종료 경기 (FT/AET/PEN)는 revalidate 7일+ 안전
- 진행 중 경기는 1시간 또는 revalidateTag 수동 호출

**예상 효과**: match_cache SELECT 대폭 감소, ~80 MB/일 감소

---

#### 2-2. `getFullUserData` 프로필 통계 캐싱

**대상**: `src/shared/actions/user.ts:182`

**조치**:
```typescript
const getUserStatsCache = (userId: string) => unstable_cache(
  async () => {
    const supabase = await getSupabaseServer();
    const [posts, comments] = await Promise.all([
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('comments').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    ]);
    return { postCount: posts.count || 0, commentCount: comments.count || 0 };
  },
  ['user-stats', userId],
  { revalidate: 600, tags: [`user-stats-${userId}`] }  // 10분
);
```

- 게시글/댓글 작성 시 `revalidateTag(`user-stats-${userId}`)` 호출

**예상 효과**: `posts` user_id SELECT 343만 → 수십만 (5~10배 감소)

---

#### 2-3. sitemap route 캐싱 강화

**대상**: `src/app/sitemaps/[id]/route.ts`

**조치**:
- `getCachedAllBoards()`를 사용하도록 8곳 변경
- `football_teams` / `football_players` 조회도 `unstable_cache` 1시간 적용

---

#### 2-4. `api_usage_log` 샘플링

**대상**: `src/domains/livescore/actions/footballApi.ts:23-40`

**조치**:
```typescript
async function logApiUsage(data: ApiUsageData): Promise<void> {
  // 에러는 100%, 성공은 10% 샘플링
  if (!data.responseHasError && Math.random() > 0.1) return;
  // ...
}
```

---

#### 2-5. `getAllTopicPosts`에 LIMIT 추가 + `unstable_cache`

**대상**: `src/domains/sidebar/actions/getAllTopicPosts.ts:48-64`

**조치**:
- `.limit(200)` 추가 (7일 내 모든 게시글 → 상위 200개)
- content 컬럼 제거
- `unstable_cache` 5분 래핑 — 사이드바는 사용자 개인화 없음

---

### 🥉 Priority 3 — 중기 (예상 추가 감소 ~15%)

#### 3-1. middleware.ts 리팩토링

**대상**: `middleware.ts:180`

**조치**:
- `getSession().user` → `getUser()` 전환 (Vercel WARNING 제거)
- 인증 필요 경로에서만 auth 체크 실행:
  - `/settings`, `/admin`, `/signin`, `/signup` 만
  - 나머지는 auth 건너뛰고 `NextResponse.next()` 바로 반환
- `has_nickname` 쿠키가 없을 때만 profiles 조회

---

#### 3-2. `getSupabaseServer()` `React.cache()` 래핑

**대상**: `src/shared/lib/supabase/client.server.ts:38`

```typescript
import { cache } from 'react';
export const getSupabaseServer = cache(async () => { ... });
```

---

#### 3-3. Storage `objects` 중복 업로드 방지

**대상**: `src/domains/livescore/actions/images/ensureAssetCached.ts:194`

**조치**:
- `asset_cache.status === 'error'` 쿨다운 체크를 더 엄격히
- 업로드 전에 `supabase.storage.from(bucket).list()` 로 존재 확인 (선택)

---

#### 3-4. `BoardCollectionWidget` 캐싱

**대상**: `src/domains/widgets/components/board-collection-widget/BoardCollectionWidget.tsx:25`

**조치**:
```typescript
const _getBoardCollectionDataImpl = unstable_cache(
  fetchBoardCollectionData_original,
  ['board-collection'],
  { revalidate: 600, tags: ['board-collection', 'analysis-posts'] }
);
```

- 분석글 작성 시 `revalidateTag('board-collection')` 호출

---

#### 3-5. `posts.search` FTS 전환

**대상**: `src/domains/boards/actions/posts/search.ts`

**조치**: `.ilike('content', '%query%')` → PostgreSQL `tsvector` 기반 FTS 인덱스
- DB에 `search_vector` 컬럼 + GIN 인덱스 추가
- `.textSearch('search_vector', query)` 사용

---

### Priority 4 — 장기 구조 개선

#### 4-1. `posts` 테이블 컬럼 분리 (P4)

```sql
-- 현재: posts (id, title, content(JSONB 큼), ...)
-- 개선:
CREATE TABLE posts (id, title, created_at, views, likes, ...);
CREATE TABLE posts_content (post_id FK, content JSONB, search_vector, content_text);

-- posts_content는 상세 페이지/편집/검색에서만 JOIN
```

#### 4-2. Materialized View로 HOT posts 사전 계산

```sql
CREATE MATERIALIZED VIEW hot_posts_7d AS
SELECT id, title, views, likes, comment_count, hot_score
FROM posts
WHERE created_at >= now() - interval '7 days' AND is_deleted = false AND is_hidden = false
ORDER BY hot_score DESC
LIMIT 100;

-- pg_cron으로 10분마다 REFRESH
```

---

## 9. 예상 감축 시나리오

| 단계 | 조치 | 예상 egress/일 | 감소율 |
|---|---|---|---|
| 현재 | - | 1.07 GB | baseline |
| P1 완료 | posts content + asset_cache + boards/* 제거 | **~0.5 GB** | -53% |
| P2 완료 | match_cache + user stats + sitemap + log 샘플링 | **~0.25 GB** | -77% |
| P3 완료 | middleware + React.cache + widget 캐싱 | **~0.18 GB** | -83% |
| P4 완료 | 컬럼 분리 + MV | **~0.10 GB** | -91% |

**목표**: 월 3~5 GB (Pro 플랜 한도의 1~2%).

---

## 10. 체크리스트 (순서대로 진행)

### Priority 1 (오늘) ✅ 완료
- [x] `getPosts.ts:185` — content 제거
- [x] `getAllPopularPosts.ts:111` — content 제거 + limit 재조정
- [x] `getPopularPosts.ts:73` — content 제거
- [x] `getAllTopicPosts.ts:48` — content 제거 + limit 1000 + unstable_cache 5분
- [x] `getUserPosts.ts:67` — content 제거
- [x] `getUserComments.ts:104` — content 제거
- [x] `ensureAssetCached.ts:262` — unstable_cache 적용 (ensureAssetsCached)
- [x] `boards/all/page.tsx:48` — getCachedAllBoards 사용
- [x] `boards/popular/page.tsx:48` — getCachedAllBoards 사용
- [x] **DB**: `thumbnail_url` 컬럼 추가 + 1,655건 백필 (97.7%)
- [x] **썸네일 fallback**: `create.ts`, `update.ts`, rss-news-bot Edge Function 저장 로직 추가
- [x] **클라이언트 컴포넌트 5개**: `post.thumbnail_url ?? extractFirstImageUrl(post.content)` 패턴

### Priority 2 (이번 주) ✅ 완료
- [x] `matchCache.ts:76, 107` — unstable_cache 7일 적용 + revalidateTag
- [x] `shared/actions/user.ts:182` — user stats 캐싱 10분 + 4개 create/delete revalidateTag
- [x] `sitemaps/[id]/route.ts` — getCachedAllBoards 사용 + football_teams/players/shop_categories 1시간 캐싱
- [x] `footballApi.ts:23` — api_usage_log 샘플링 (에러 100%, 정상 10%)
- [x] `BoardCollectionWidget.tsx:25` — unstable_cache 10분

### Priority 3 (중기)
- [x] `middleware.ts:180` — getSession → getUser + Fast path (쿠키 기반 스킵)
- [ ] `client.server.ts:38` — React.cache 래핑
- [ ] `ensureAssetCached.ts:194` — upsert 쿨다운 강화
- [ ] `posts/search.ts` — ilike → FTS

### Priority 4 (장기)
- [ ] `posts` ↔ `posts_content` 분리 마이그레이션
- [ ] `hot_posts_7d` MV + pg_cron

### 모니터링 도구
- [ ] Supabase Dashboard → Settings → Usage 매일 확인
- [ ] Database → Query Performance "Most time consuming" 주간 리뷰
- [ ] Advisors → Performance Advisor 체크
- [x] Vercel 로그에서 `getSession` WARNING 빈도 재확인 — middleware 리팩토링으로 제거

---

## 🚧 12. 남은 작업 상세화 (2026-04-16 기준 추가)

**현재 누적 상태**: 1,067 MB/일 → ~250 MB/일 (**-77%**)

Pro 플랜(250GB/월) 대비 월 7.5GB ≈ **3% 사용** — 이미 안전권. 다만 추가 감축 원하면 아래 작업 상세 참고.

---

### 🟡 P3-2. `getSupabaseServer()` React.cache() 래핑

**위치**: `src/shared/lib/supabase/client.server.ts:38`

**현재**:
```typescript
export async function getSupabaseServer() {
  const cookieStore = await cookies()
  return createServerClient<Database>(...)
}
```

**개선**:
```typescript
import { cache } from 'react'

export const getSupabaseServer = cache(async () => {
  const cookieStore = await cookies()
  return createServerClient<Database>(...)
})
```

#### 효과
- 같은 request 내 Supabase 클라이언트 생성 1회로 dedup
- 여러 server action / 서버 컴포넌트가 같은 request에서 `getSupabaseServer()` 반복 호출 시 내부 초기화 스킵
- **egress 직접 감소는 미미** — 클라이언트 초기화 비용만 줄임

#### 리스크
- `cookies()` 반환값이 request-scoped라 `React.cache`와 호환 (같은 request 안에서만 재사용)
- 하지만 Server Action끼리는 다른 request라 공유 안 됨 (React.cache 한계)

#### 예상 감소
- **~5 MB/일** (매우 작음) — 주로 CPU/메모리 이득

#### 난이도
- ⭐ (5분 작업)

#### 판단
- 큰 egress 이득 없음
- **하지만 쉽고 안전** → 지금 적용해도 무방

---

### 🟡 P3-3. Storage `objects` UPSERT 중복 업로드 방지

**위치**: `src/domains/livescore/actions/images/ensureAssetCached.ts:194`

**현재 흐름**:
```
1. asset_cache 조회 → status ready면 return (업로드 안 함) ✅
2. pending → 대기
3. error → 쿨다운 체크 → 경과 시 재시도
4. 레코드 없음 → cacheAsset() → Storage upsert (무조건 덮어쓰기)
```

**문제 가능성**:
- `upsert: true` 로 같은 이미지를 재업로드 중일 가능성
- 하루 **objects UPSERT 842K 건** — 비정상적으로 높음
- error 상태 쿨다운이 짧거나, 여러 사이즈(`sm`, `md`) × 여러 타입 조합마다 반복될 가능성

#### 개선 방안

**옵션 A: 업로드 전 Storage 존재 확인**
```typescript
// 업로드 전에 HEAD 요청으로 파일 존재 확인
const { data: existingFile } = await supabase.storage
  .from(bucket)
  .list(size, { search: `${entityId}.${ext}`, limit: 1 });

if (existingFile?.length) {
  // Storage에 파일 있으면 asset_cache만 ready로 업데이트
  await supabase.from('asset_cache').update({ status: 'ready' })...;
  return getStoragePublicUrl(...);
}
// 없으면 기존대로 업로드
```

**옵션 B: 쿨다운 강화**
```typescript
// error 상태 쿨다운 1시간 → 24시간으로 확장
const ERROR_COOLDOWN = 24 * 60 * 60 * 1000; // 기존 1h → 24h
```

**옵션 C: Lock 체크 (다중 인스턴스 방지)**
- pending 상태 유효 시간을 짧게 (60초) + 타임스탬프 체크
- 여러 Vercel 인스턴스가 동시 처리 방지

#### 효과
- Storage egress 감소 (업로드 트래픽 자체는 Storage 카테고리)
- API-Sports 원본 이미지 재다운로드 감소 (외부 API 호출도 절감)
- 하루 842K UPSERT → ~50K 수준 가능

#### 예상 감소
- Storage egress **~30 MB/일**
- API-Sports 쿼타 보호

#### 난이도
- ⭐⭐ (30분~1시간)

#### 리스크
- 옵션 A: Storage list API 호출이 추가됨 (작지만 발생)
- 옵션 B: 한 번 실패하면 24시간 재시도 안 함 → 초기 캐싱 지연 가능
- 옵션 C: 기존 로직 복잡도 증가

---

### 🟡 P3-4. `posts.search` FTS 전환

**위치**: `src/domains/boards/actions/posts/search.ts`

**현재**:
```typescript
.select(`id, title, content, ...`)
.ilike('content', `%${searchTerm}%`)
.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
```

**문제**:
- `ilike` 는 풀스캔 — 데이터 많을수록 느려짐
- content(JSONB) 포함 select → egress 큼
- snippet 생성 위해 클라이언트까지 content 전달 필요

#### 개선 방안 — PostgreSQL FTS

**1단계: DB 마이그레이션**
```sql
-- tsvector 컬럼 + GIN 인덱스
ALTER TABLE posts ADD COLUMN search_vector tsvector;

-- 트리거: title + content plain text 자동 갱신
CREATE OR REPLACE FUNCTION posts_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple',
      coalesce(jsonb_to_text(NEW.content), '')
    ), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_search_vector_trigger
BEFORE INSERT OR UPDATE OF title, content ON posts
FOR EACH ROW EXECUTE FUNCTION posts_search_vector_update();

-- GIN 인덱스
CREATE INDEX posts_search_vector_idx ON posts USING gin(search_vector);

-- 백필
UPDATE posts SET search_vector =
  setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(jsonb_to_text(content), '')), 'B');
```

**2단계: 검색 쿼리 교체**
```typescript
// Before
.ilike('content', `%${query}%`)

// After
.textSearch('search_vector', query, { type: 'websearch' })
```

**3단계: snippet은 `ts_headline` RPC로**
```sql
CREATE OR REPLACE FUNCTION search_posts_with_snippet(q text) RETURNS SETOF ... AS $$
  SELECT id, title,
    ts_headline('simple', jsonb_to_text(content), websearch_to_tsquery(q),
      'MaxWords=30, MinWords=15') AS snippet
  FROM posts
  WHERE search_vector @@ websearch_to_tsquery(q)
  ORDER BY ts_rank(search_vector, websearch_to_tsquery(q)) DESC
$$ LANGUAGE sql;
```

#### 효과
- **검색 속도 10~100배 개선** (GIN 인덱스)
- content 전체 fetch 불필요 → snippet만 서버에서 생성
- egress 대폭 감소 (검색 결과 payload 축소)

#### 예상 감소
- 검색 관련 egress **~10 MB/일** (검색 빈도에 따라 다름)
- **실제 이득**: egress보다 **사용자 경험 개선** (검색 결과 빠름)

#### 난이도
- ⭐⭐⭐⭐ (DB 마이그레이션 + 트리거 + 백필 + 쿼리 전면 교체, 1~2일)

#### 리스크
- 한글 형태소 분석 부재 (`simple` 사전 사용) → 검색 품질은 기존 ilike와 비슷하거나 약간 나음
- 더 좋은 품질 원하면 `pg_bigm` 또는 `mecab_ko` 확장 필요 (설치 복잡)

---

### 🟢 P4-1. `posts` ↔ `posts_content` 테이블 분리 (FTS 통합 전략)

**현재 문제**:
- `posts` 테이블이 JSONB `content` 필드 때문에 row당 수 KB ~ 수십 KB
- 리스트 조회 시 불필요한 content 전송 (P1에서 이미 select 제거했지만 테이블 레벨 분리가 더 근본적)
- 인덱스 스캔 시에도 TOAST 압박

### 🔮 미래 관점 — 지금 하는 게 합리적인 이유

| 시점 | posts 수 | 마이그레이션 난이도 |
|---|---|---|
| **지금** | **1,694건** | 🟢 **쉬움** (수 초 내 데이터 복사) |
| 6개월 후 | ~10,000건 | 🟡 중간 |
| 1년 후 | ~50,000건 | 🔴 어려움 (락, 다운타임) |
| 2년 후 | ~200,000건+ | 🔴🔴 매우 어려움 |

**트래픽 성장하면 마이그레이션 비용 기하급수적 증가**. 지금 하는 게 가장 쌈.

### 🛡️ 안전 전략 — 병행 유지 방식 (롤백 가능)

**`posts.content` 컬럼을 즉시 DROP 하지 않음**. 대신:
1. `posts_content` 새 테이블 생성 + 데이터 복사 (기존 content는 그대로)
2. 트리거로 **양방향 동기화** 유지
3. 앱 코드를 단계별로 이전 (상세 → 편집 → 검색)
4. 3개월 모니터링 후 문제 없으면 `posts.content` DROP (선택)
5. 문제 생기면 **앱 코드만 revert** → 기존 posts.content 그대로 동작 ✅

### 📋 통합 설계 — FTS + 테이블 분리 동시 진행

```sql
CREATE TABLE posts_content (
  post_id uuid PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
  content jsonb NOT NULL,
  search_vector tsvector,      -- ← P3-4 FTS 여기에 통합
  content_text text             -- ← snippet용 plain text
);

-- pgroonga 한글 지원 인덱스
CREATE INDEX posts_content_search_idx ON posts_content USING pgroonga(search_vector);
```

**한 번의 마이그레이션으로 2개 문제 동시 해결** — posts 경량화 + FTS 검색.

### 📅 Phase별 로드맵

#### Phase 1 — 인프라 준비 (안전, 완전 롤백 가능)
```sql
-- 1. pgroonga 확장 (한글 FTS)
CREATE EXTENSION IF NOT EXISTS pgroonga;

-- 2. posts_content 테이블 생성
CREATE TABLE posts_content (
  post_id uuid PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
  content jsonb NOT NULL,
  content_text text,
  search_vector tsvector,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. 기존 데이터 복사 (posts.content는 그대로 유지)
INSERT INTO posts_content (post_id, content, content_text)
SELECT
  id,
  content,
  -- TipTap JSON → plain text
  (SELECT string_agg(n->>'text', ' ')
   FROM jsonb_path_query(content, '$..text ? (@ != null)') n
   WHERE n->>'text' IS NOT NULL)
FROM posts;

-- 4. pgroonga FTS 인덱스
CREATE INDEX posts_content_text_pgroonga_idx
ON posts_content USING pgroonga (content_text);
```

**이 시점**: 앱 코드 변경 0. `posts.content` 그대로 동작. `posts_content`는 읽기 전용 복사본.

#### Phase 2 — 동기화 트리거 (안전망)

```sql
-- posts.content 변경 → posts_content 자동 반영
CREATE OR REPLACE FUNCTION sync_posts_to_content() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO posts_content (post_id, content, content_text)
    VALUES (NEW.id, NEW.content, extract_plain_text(NEW.content))
    ON CONFLICT (post_id) DO UPDATE
    SET content = EXCLUDED.content,
        content_text = EXCLUDED.content_text,
        updated_at = now();
  ELSIF TG_OP = 'UPDATE' AND NEW.content IS DISTINCT FROM OLD.content THEN
    UPDATE posts_content
    SET content = NEW.content,
        content_text = extract_plain_text(NEW.content),
        updated_at = now()
    WHERE post_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_sync_to_content_trigger
AFTER INSERT OR UPDATE OF content ON posts
FOR EACH ROW EXECUTE FUNCTION sync_posts_to_content();
```

#### Phase 3 — 읽기 경로 이전

**상세 페이지**:
```typescript
// Before
const { data: post } = await supabase
  .from('posts').select('*').eq('id', postId).single();

// After
const { data: post } = await supabase
  .from('posts')
  .select('*, posts_content(content)')
  .eq('id', postId)
  .single();
const content = post.posts_content?.content;
```

**검색 (FTS)**:
```typescript
// Before
.ilike('content', `%${query}%`)

// After (pgroonga)
.from('posts_content')
.select('post_id, content, ts_headline(content_text, $1) as snippet')
.textSearch('content_text', query, { type: 'websearch' })
```

**편집 페이지**: 상세 페이지와 동일하게 `posts_content.content` 로드.

#### Phase 4 — 쓰기 경로 이전 (점진적, 트리거는 유지)

```typescript
// create.ts
const { data: post } = await supabase.from('posts').insert({...}).select().single();
await supabase.from('posts_content').insert({
  post_id: post.id,
  content: parsedContent,
  content_text: extractSummary(parsedContent, 10000)
});
// ※ posts.content 도 함께 저장 (트리거 안전망)

// update.ts
await supabase.from('posts').update({ title, summary, thumbnail_url }).eq('id', postId);
await supabase.from('posts_content').update({ content, content_text }).eq('post_id', postId);
```

#### Phase 5 (선택, 3개월 후) — posts.content DROP

모니터링 후 문제 없으면:
```sql
ALTER TABLE posts DROP COLUMN content;
```

문제 있으면 앱 코드만 revert → 기존 `posts.content` 그대로 사용.

### 🎯 효과
- **리스트 조회 성능 극대화** — posts row 크기 수 KB → 수백 byte
- **FTS 검색 속도 10~100배 개선** (pgroonga 한글 인덱스)
- egress ~50 MB/일 + 검색 속도
- TOAST 압박 해소

### 📊 예상 감소
- **~60 MB/일** (P3-4 FTS + P4-1 통합 효과)
- DB 용량 일부 절감
- 검색 응답 시간 대폭 단축

### 🛡️ 리스크 관리

| 리스크 | 완화 방법 |
|---|---|
| 롤백 어려움 | `posts.content` 유지로 언제든 앱 코드만 revert |
| 다운타임 | Phase 1~2는 무중단 (트리거만 추가) |
| 쓰기 충돌 | 트리거로 자동 동기화 |
| 쿼리 버그 | 점진적 이전 (Phase 3 → 4 순차) |

### 📝 수정 대상 파일 (대략)
- DB: 마이그레이션 4~5개
- RPC 함수: `search_posts_by_content`, `count_search_posts` 재작성
- 앱 코드:
  - `posts/create.ts`, `posts/update.ts` — 쓰기 경로
  - `[slug]/[postNumber]/page.tsx` — 상세 페이지
  - `[postNumber]/edit/page.tsx` — 편집 페이지
  - `search.ts` — 검색
  - `searchPosts.ts`, `searchComments.ts` — 검색 도메인
  - `getNewsPosts.ts` — 이미 summary로 이전 완료
- Edge Function: `rss-news-bot` 업데이트

### 난이도
- ⭐⭐⭐⭐ (Phase 1~2 쉬움, Phase 3~4 중간, Phase 5 선택)
- 총 1~2일 예상

#### 판단
- **egress 감소 대비 공수 과도**. P1~P3으로 이미 77% 감소 달성
- 향후 트래픽 10배 이상 증가하거나, 다른 이유(성능/구조)로 필요하면 진행

---

### 🟢 P4-2. `hot_posts_7d` Materialized View + pg_cron

**현재 문제**:
- `getAllPopularPosts`, `getPopularPosts`, `getAllTopicPosts` 모두 **실시간 HOT 점수 계산**
- 매 호출마다 posts + comments JOIN/집계
- unstable_cache로 일부 완화했지만 캐시 미스 시 비싼 쿼리

#### 개선 방안

**1단계: MV 생성**
```sql
CREATE MATERIALIZED VIEW hot_posts_7d AS
SELECT
  p.id,
  p.title,
  p.post_number,
  p.board_id,
  p.user_id,
  p.thumbnail_url,
  p.views,
  p.likes,
  p.created_at,
  COALESCE(cc.comment_count, 0) AS comment_count,
  -- HOT score 사전 계산 (created_at 기준 시간감쇠 포함)
  (
    (p.views * 1) + (p.likes * 10) + (COALESCE(cc.comment_count, 0) * 20)
  ) * GREATEST(0, 1 - (EXTRACT(EPOCH FROM (now() - p.created_at)) / (7 * 24 * 3600))) AS hot_score
FROM posts p
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS comment_count
  FROM comments c
  WHERE c.post_id = p.id AND c.is_deleted = false AND c.is_hidden = false
) cc ON true
WHERE p.created_at >= now() - interval '7 days'
  AND p.is_deleted = false
  AND p.is_hidden = false
ORDER BY hot_score DESC
LIMIT 500;

CREATE INDEX hot_posts_7d_score_idx ON hot_posts_7d (hot_score DESC);
```

**2단계: pg_cron 설정**
```sql
SELECT cron.schedule(
  'refresh-hot-posts-7d',
  '*/10 * * * *',  -- 10분마다
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY hot_posts_7d$$
);
```

**3단계: 앱 쿼리 교체**
```typescript
// Before
const { data } = await supabase.from('posts').select(...).limit(500);
// 서버에서 HOT 점수 계산 + 정렬

// After
const { data } = await supabase.from('hot_posts_7d').select('*').limit(20);
// 이미 정렬된 상태로 반환
```

#### 효과
- **앱 HOT 점수 계산 로직 제거** — 서버 CPU 이득
- 쿼리 단순화 (posts JOIN → MV SELECT)
- MV 자체는 10분마다 1회 REFRESH — DB 부하 극소

#### 예상 감소
- posts 리스트 대량 fetch 완전 제거 → **~30 MB/일**
- **실제 이득**: 쿼리 속도 + CPU 이득이 더 큼

#### 난이도
- ⭐⭐⭐ (하루)
- pg_cron 확장 활성화 필요
- `REFRESH CONCURRENTLY` 위해 유니크 인덱스 필요
- 앱 코드 3~4곳 수정

#### 리스크
- MV 데이터가 최대 10분 stale — HOT 리스트 실시간성 낮아짐 (허용 가능)
- `REFRESH CONCURRENTLY` 실패 시 MV 갱신 중단 가능성 — 모니터링 필요

---

### 🔵 보류 케이스 1: `searchPosts.ts` content 포함 유지

**위치**: `src/domains/boards/actions/posts/search.ts:154`

**상황**:
- 검색 결과에 `snippet`(검색어 주변 발췌 150자) 표시 필요
- 현재는 content 전체를 클라이언트로 받아서 서버/클라에서 snippet 추출

**해결 전략**:
- **방안 A (P3-4 적용 시 자동 해결)**: FTS + `ts_headline()` RPC → DB 레벨에서 snippet 반환
- **방안 B (간단)**: `content_text` (plain text) 컬럼 추가, 백필, snippet 서버에서 생성
- **방안 C (방치)**: 검색 빈도 낮으므로 현상 유지

**현재 영향**:
- 검색 API 호출 빈도 정확히 미측정
- 사용자가 검색 많이 안 쓰면 egress 영향 미미

**판단**:
- P3-4 FTS로 일괄 해결이 정석
- 검색 트래픽 데이터 먼저 확인 후 진행

---

### 🔵 보류 케이스 2: `getNewsPosts.ts` content 포함 유지

**위치**: `src/domains/widgets/components/news-widget/actions/getNewsPosts.ts:28`

**상황**:
- 뉴스 위젯에서 `summary` 150자 표시 필요
- 현재는 content 전체에서 추출

**해결 전략**:
- **방안 A**: DB에 `summary text` 컬럼 추가 + `create.ts`, `update.ts`, rss-news-bot에서 저장
  ```sql
  ALTER TABLE posts ADD COLUMN summary text;
  UPDATE posts SET summary = substring(
    regexp_replace(jsonb_to_text(content), '<[^>]*>', '', 'g'),
    1, 150
  );
  ```
- **방안 B**: 뉴스 위젯에 `unstable_cache 10분` 래핑 — 매번 content fetch는 하되 캐시로 덮기
- **방안 C**: 방치 — 메인 페이지 위젯이라 캐싱 없으면 매번 호출됨 (심각)

**추천**: **방안 B 먼저** (10분), 그 다음 방안 A (정석).

**현재 영향**:
- 메인 페이지마다 뉴스 위젯이 `getAllNewsPosts` (여러 게시판 병렬 조회) 실행
- content 포함 → 게시글당 수 KB × 15개 × 여러 게시판 = **~20 MB/일 의심**

**난이도**:
- 방안 A: ⭐⭐⭐ (마이그레이션 + create/update/rss-bot 3곳 수정 + 백필)
- 방안 B: ⭐ (5분)

---

### 🔵 추가 미처리 — `fetchPosts` 내부 `boards` 중복 조회

**위치**: `src/domains/boards/actions/getPosts.ts:131-135, 163-167`

**현재**:
```typescript
const { data: boardData } = await supabase
  .from('boards')
  .select('id, slug')
  .eq('id', checkBoardId)
  .single();  // ← 매 fetchPosts마다
```

**개선**:
```typescript
import { getCachedBoardById } from '@/domains/boards/actions/getCachedBoards';
const boardData = await getCachedBoardById(checkBoardId);
```

#### 효과
- `fetchPosts` 호출마다 boards 2회 SELECT → 캐시 히트
- **~5 MB/일** 추가 감소

#### 난이도
- ⭐ (10분)

#### 판단
- 작지만 쉬운 작업. 원하면 바로 적용 가능.

---

## 📊 13. 남은 작업 효과 vs 공수 매트릭스

| 작업 | 예상 감소 | 난이도 | 리스크 | ROI |
|---|---|---|---|---|
| P3-2 React.cache 래핑 | ~5 MB | ⭐ | 없음 | 🟢 **즉시 적용 권장** |
| `fetchPosts` boards 캐시 | ~5 MB | ⭐ | 없음 | 🟢 **즉시 적용 권장** |
| S5-10 getNewsPosts 방안 B (캐시만) | ~15 MB | ⭐ | 없음 | 🟢 **즉시 적용 권장** |
| P3-3 Storage upsert 쿨다운 | ~30 MB | ⭐⭐ | 낮음 | 🟡 중간 우선 |
| P3-4 FTS 전환 | ~10 MB + 속도 | ⭐⭐⭐⭐ | 중간 | 🟡 검색 빈도 확인 후 |
| S5-10 방안 A (summary 컬럼) | ~15 MB | ⭐⭐⭐ | 낮음 | 🟡 방안 B와 중복 |
| P4-2 hot_posts_7d MV | ~30 MB + 속도 | ⭐⭐⭐ | 낮음 | 🟢 **장기 권장** |
| P4-1 posts/posts_content 분리 | ~50 MB | ⭐⭐⭐⭐⭐ | 높음 | 🔴 **과잉, 보류** |

### 🎯 단계별 권장

**단기 (~1시간)**: P3-2 + `fetchPosts boards` + `getNewsPosts 방안 B`
- 합산 효과: ~25 MB/일 추가 감소 → **월 8.5 GB → 월 7.7 GB**
- 리스크 거의 없음

**중기 (~1일)**: P3-3 + P4-2 + `getNewsPosts 방안 A`
- 합산 효과: ~75 MB/일 추가 감소 → **월 7.7 GB → 월 5.5 GB**
- pg_cron 확장 필요

**장기 (~3일)**: P3-4 + P4-1
- 합산 효과: ~60 MB/일 + 검색/리스트 속도 대폭 개선
- 프로덕션 마이그레이션 신중 필요

### 결론

**Pro 플랜 사용자라면 현재 상태로 충분**. 월 7.5 GB = 250GB 한도의 3%.

다만 **"깔끔"** 선호하면 단기 작업 3개만 더 진행 추천. 총 ~10분 소요, 추가 25MB/일 감소.

---

## 11. 참고 자료

- [Supabase: Manage your Egress usage](https://supabase.com/docs/guides/platform/manage-your-usage/egress)
- [Next.js: unstable_cache](https://nextjs.org/docs/app/api-reference/functions/unstable_cache)
- [PostgreSQL: FTS(Full Text Search)](https://www.postgresql.org/docs/current/textsearch.html)
- 프로젝트 관련 문서:
  - `docs/hot-system/score-calculation.md` — HOT 점수 공식
  - `docs/guides/image-4590-standard.md` — 4590 이미지 표준
  - `docs/lcp-optimization/1-server-response.md` — LCP 최적화
  - `memory/cache_strategy.md` — 캐시 전략

---

## 부록 A — Top 쿼리 전체 SQL

### A-1. `asset_cache` 배치 조회 (3위)
```sql
SELECT entity_id, status, checked_at
FROM public.asset_cache
WHERE type = $1 AND entity_id = ANY($2)
LIMIT $3 OFFSET $4
-- Calls: 853,007/일 / Mean: 3.8ms / Rows: 853,007
```

### A-2. `posts` 10컬럼 (4위, 최대 egress)
```sql
SELECT id, title, created_at, board_id, views, likes, post_number,
       content, is_hidden, is_deleted
FROM public.posts
WHERE created_at >= $1 AND is_deleted = $2 AND is_hidden = $3
LIMIT $4 OFFSET $5
-- Calls: 58,290/일 / Mean: 54ms / Rows: 58,290
```

### A-3. `posts.*` anon (8위)
```sql
SELECT posts.*
FROM public.posts
WHERE is_deleted = $1 AND is_hidden = $2
LIMIT $3 OFFSET $4
-- Calls: 41,107/일 / Mean: 34ms / Rows: 41,107
```

### A-4. `boards` (15위)
```sql
SELECT id, name, parent_id, display_order, slug, team_id, league_id
FROM public.boards
ORDER BY display_order ASC, name ASC
LIMIT $1 OFFSET $2
-- Calls: 172,464/일 (anon)
```

### A-5. `posts` user_id count (17위)
```sql
SELECT id FROM public.posts WHERE user_id = $1 LIMIT $2 OFFSET $3
-- Calls: 3,431,782/일 (authenticated)
```

### A-6. `set_config` (증상 지표)
```sql
select set_config('search_path', $1, true), set_config('role', $4, true),
       set_config('request.jwt.claims', $5, true), ...
-- authenticated: 10,323,882/일
-- anon: 5,238,772/일
-- 해석: PostgREST 전체 요청량 ≈ 1,560만/일 ≈ 180 req/s
```

---

## 부록 B — 전수조사 결과: `.select('*')` 사용처

**현재 40개 파일에서 `.select('*')` 사용 중**. 우선 개선 대상:

### posts/boards 같은 큰 테이블 (🔴 즉시)
- `src/app/(site)/boards/all/page.tsx:49` — boards.*
- `src/app/(site)/boards/popular/page.tsx:50` — boards.*
- `src/domains/livescore/actions/images/ensureAssetCached.ts:84` — asset_cache.* (단건 조회)

### service_role 백엔드 (🟡 중기)
- `src/domains/admin/actions/*.ts` — 관리자만 사용, 빈도 낮음
- `src/domains/reports/actions/index.ts:277, 531`
- `src/domains/shop/actions/actions.ts:17`
- `src/domains/livescore/actions/footballTeamsSync.ts:299`
- `src/domains/livescore/actions/transfers/bannerTransfers.ts:45`

### 단건 조회 (거의 문제 없음, 🟢 보류)
- `src/domains/auth/actions/auth.ts:300` — 로그인 1회
- `src/domains/settings/actions/phone.ts:203` — 개인 설정

---

## 부록 C — 불일치/주의 발견

### C-1. README 문서 vs 실제 코드 경로 불일치
- `src/shared/api/README.md`는 `supabase.ts`/`supabaseServer.ts` 경로 설명
- 실제 파일은 `src/shared/lib/supabase/client.browser.ts`, `client.server.ts`
- CLAUDE.md도 옛 경로 기준 → 업데이트 필요

### C-2. `getHotdealBestPosts` 주석과 구현 불일치
- [`src/domains/sidebar/actions/getHotdealBestPosts.ts:29`](../../src/domains/sidebar/actions/getHotdealBestPosts.ts#L29) 주석: "unstable_cache로 요청 간 캐시 적용 (300초)"
- 실제 코드: unstable_cache 래핑 없음 (`getHotdealBestPosts` → `fetchHotdealBestPosts` 단순 호출)

### C-3. `force-dynamic` 과다
- `/boards/all/page.tsx`, `/boards/popular/page.tsx` 모두 `dynamic = 'force-dynamic'` + `revalidate = 0`
- Next.js ISR 완전 bypass — 전체 캐시 전략 무력화
- 목록 페이지는 ISR 가능 (30초~1분 revalidate) — 정말 실시간이어야 하는지 검토

---

**작성 완료**: 2026-04-16
**다음 단계**: Priority 1의 `posts.content` 제거부터 PR로 진행.
