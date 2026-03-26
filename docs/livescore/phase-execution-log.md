# 라이브스코어 DB 재설계 — Phase별 실행 기록

> **작성일**: 2026-03-26
> **완료일**: 2026-03-26
> **상태**: **완료**
> **상위 문서**: [db-restructuring-plan.md](./db-restructuring-plan.md)
> **목적**: 중복 인덱스 제거 + 필요한 복합 인덱스 추가 + match_cache 컬럼 추가
> **영향**: 서비스 중단 없음. 기존 기능 변경 없음.
> **실행 방식**: Supabase MCP `apply_migration`으로 직접 실행.

---

## 1. 실제 DB 상태 (Supabase 직접 조회 결과)

### 1.1 테이블 크기

| 테이블 | 전체 크기 | 데이터 | 인덱스 | 행 수 | 비고 |
|--------|----------|--------|--------|-------|------|
| match_cache | 128 MB | 3 MB | 2 MB | 20,811 | TOAST 123MB (JSONB 데이터 별도 저장, 정상) |
| asset_cache | 29 MB | 16 MB | 13 MB | 93,649 | 중복 인덱스로 인덱스 비대 |
| football_players | 7 MB | 5 MB | 2 MB | 7,774 | 불필요 인덱스 다수 |
| football_teams | 3 MB | 2.5 MB | 336 KB | 1,210 | 정상 |
| match_ai_predictions | 448 KB | 112 KB | 96 KB | 38 | 정상 |
| match_predictions | 104 KB | 8 KB | 64 KB | 0 | 데이터 없음 |
| match_highlights | 96 KB | 16 KB | 48 KB | 60 | 정상 |
| match_comment_likes | 80 KB | 8 KB | 64 KB | 0 | 데이터 없음 |
| match_support_comments | 80 KB | 8 KB | 64 KB | 3 | 거의 없음 |
| match_prediction_stats | 24 KB | 8 KB | 16 KB | 8 | 정상 |

### 1.2 제약조건 (PK, UNIQUE, FK, CHECK) — 전부 있음

**이전 문서에서 "unique constraint가 없다"고 적은 것은 틀렸습니다. DB 직접 조회 결과 전부 있습니다.**

| 테이블 | PK | UNIQUE | FK | CHECK |
|--------|----|--------|----|-------|
| match_cache | id | (match_id, data_type) ✅ | - | - |
| asset_cache | id | (type, entity_id) ✅ | - | status, type CHECK |
| football_teams | id | (team_id) ✅ | - | - |
| football_players | id | (player_id) ✅ | - | - |
| match_highlights | id | (fixture_id) ✅ | - | - |
| match_predictions | id | (user_id, match_id) ✅ | user_id → auth.users | prediction_type CHECK |
| match_prediction_stats | **match_id (PK)** | - (PK가 unique 역할) ✅ | - | - |
| match_support_comments | id | - | user_id → auth.users | team_type, content 길이 CHECK |
| match_comment_likes | id | (user_id, comment_id) ✅ | comment_id → match_support_comments, user_id → auth.users | type CHECK |
| match_ai_predictions | id | (fixture_id) ✅ | - | - |

> **match_prediction_stats의 PK가 match_id** → upsert에 onConflict 없어도 PK 기준으로 동작함.
> 이전에 "버그"라고 판단한 것은 **틀렸습니다**. PK가 match_id이므로 정상 동작합니다.

### 1.3 현재 인덱스 전체 목록

#### match_cache (인덱스 3개, 중복 1개)

| 인덱스 | 정의 | 크기 | 판정 |
|--------|------|------|------|
| `match_cache_pkey` | UNIQUE (id) | 472 KB | **유지** (PK) |
| `match_cache_match_id_data_type_key` | UNIQUE (match_id, data_type) | 784 KB | **유지** (핵심 조회) |
| `idx_match_cache_lookup` | (match_id, data_type) | 784 KB | **삭제** — unique 인덱스와 완전 동일 |

#### asset_cache (인덱스 5개, 중복 1개 + 불필요 2개)

| 인덱스 | 정의 | 크기 | 판정 |
|--------|------|------|------|
| `asset_cache_pkey` | UNIQUE (id) | 2,888 KB | **유지** (PK) |
| `asset_cache_type_entity_unique` | UNIQUE (type, entity_id) | 3,760 KB | **유지** (핵심 조회) |
| `idx_asset_cache_type_entity` | (type, entity_id) | 3,744 KB | **삭제** — unique 인덱스와 완전 동일 |
| `idx_asset_cache_checked_at` | (checked_at) | 2,096 KB | **삭제** — checked_at 단독 조회 없음 |
| `idx_asset_cache_status` | (status) | 672 KB | **삭제** — status 단독 조회 없음 (type+status 복합이 필요) |

#### football_players (인덱스 7개, 중복 1개 + 불필요 3개)

| 인덱스 | 정의 | 크기 | 판정 |
|--------|------|------|------|
| `football_players_pkey` | UNIQUE (id) | 264 KB | **유지** (PK) |
| `football_players_player_id_key` | UNIQUE (player_id) | 312 KB | **유지** (핵심 조회) |
| `idx_football_players_player_id` | (player_id) | 296 KB | **삭제** — unique 인덱스와 동일 |
| `idx_football_players_team_id` | (team_id) | 120 KB | **유지** (팀별 조회) |
| `idx_football_players_korean_name` | (korean_name) | 448 KB | **삭제** — korean_name 단독 검색 쿼리 없음 |
| `idx_football_players_name` | (name) | 368 KB | **삭제** — ILIKE 검색에 btree 인덱스 소용없음 |
| `idx_football_players_position` | (position) | 136 KB | **삭제** — position 단독 검색 쿼리 없음 |

#### football_teams (인덱스 4개, 중복 1개 + 불필요 1개)

| 인덱스 | 정의 | 크기 | 판정 |
|--------|------|------|------|
| `football_teams_pkey` | UNIQUE (id) | 104 KB | **유지** (PK) |
| `football_teams_team_id_key` | UNIQUE (team_id) | 72 KB | **유지** (핵심 조회) |
| `idx_football_teams_team_id` | (team_id) | 104 KB | **삭제** — unique 인덱스와 동일 |
| `idx_football_teams_popularity` | (popularity_score DESC) | 32 KB | **삭제** — is_active 없이 단독 사용 안 함 |

#### match_highlights (인덱스 3개, 중복 1개)

| 인덱스 | 정의 | 크기 | 판정 |
|--------|------|------|------|
| `match_highlights_pkey` | UNIQUE (id) | 16 KB | **유지** (PK) |
| `match_highlights_fixture_id_key` | UNIQUE (fixture_id) | 16 KB | **유지** (핵심 조회) |
| `idx_match_highlights_fixture` | (fixture_id) | 16 KB | **삭제** — unique 인덱스와 동일 |

#### match_predictions (인덱스 4개, 불필요 1개)

| 인덱스 | 정의 | 크기 | 판정 |
|--------|------|------|------|
| `match_predictions_pkey` | UNIQUE (id) | 16 KB | **유지** (PK) |
| `match_predictions_user_id_match_id_key` | UNIQUE (user_id, match_id) | 16 KB | **유지** (중복 방지) |
| `idx_match_predictions_match_id` | (match_id) | 16 KB | **유지** (집계 쿼리) |
| `idx_match_predictions_user_id` | (user_id) | 16 KB | **삭제** — user_id 단독 조회 없음 (항상 match_id와 함께) |

#### match_prediction_stats (인덱스 1개, 정상)

| 인덱스 | 정의 | 크기 | 판정 |
|--------|------|------|------|
| `match_prediction_stats_pkey` | UNIQUE (match_id) — **PK** | 16 KB | **유지** |

#### match_support_comments (인덱스 4개, 불필요 1개)

| 인덱스 | 정의 | 크기 | 판정 |
|--------|------|------|------|
| `match_support_comments_pkey` | UNIQUE (id) | 16 KB | **유지** (PK) |
| `idx_match_support_comments_match_id` | (match_id) | 16 KB | **유지** (경기별 조회) |
| `idx_match_support_comments_user_id` | (user_id) | 16 KB | **유지** (내 댓글) |
| `idx_match_support_comments_team_type` | (team_type) | 16 KB | **삭제** — team_type 단독 조회 없음 |

#### match_comment_likes (인덱스 4개, 불필요 1개)

| 인덱스 | 정의 | 크기 | 판정 |
|--------|------|------|------|
| `match_comment_likes_pkey` | UNIQUE (id) | 16 KB | **유지** (PK) |
| `match_comment_likes_user_id_comment_id_key` | UNIQUE (user_id, comment_id) | 16 KB | **유지** (중복 방지) |
| `idx_match_comment_likes_comment_id` | (comment_id) | 16 KB | **유지** (댓글별 좋아요 조회) |
| `idx_match_comment_likes_user_id` | (user_id) | 16 KB | **삭제** — unique 인덱스가 user_id 선두 컬럼으로 커버 |

#### match_ai_predictions (인덱스 6개, 중복 1개)

| 인덱스 | 정의 | 크기 | 판정 |
|--------|------|------|------|
| `match_ai_predictions_pkey` | UNIQUE (id) | 16 KB | **유지** (PK) |
| `match_ai_predictions_fixture_id_key` | UNIQUE (fixture_id) | 16 KB | **유지** (핵심 조회) |
| `idx_match_ai_predictions_fixture_id` | (fixture_id) | 16 KB | **삭제** — unique 인덱스와 동일 |
| `idx_match_ai_predictions_popularity` | (popularity_score DESC, created_at DESC) | 16 KB | **유지** (인기순 조회) |
| `idx_match_ai_predictions_expires_at` | (expires_at) | 16 KB | **유지** (만료 체크) |
| `idx_match_ai_predictions_match_date` | (match_date) | 16 KB | **유지** (날짜 필터) |

---

## 2. 작업 내용

### 2.1 삭제 대상 — 중복/불필요 인덱스 (14개)

| # | 테이블 | 인덱스 | 사유 | 절약 크기 |
|---|--------|--------|------|----------|
| 1 | match_cache | `idx_match_cache_lookup` | unique 인덱스와 동일 | 784 KB |
| 2 | asset_cache | `idx_asset_cache_type_entity` | unique 인덱스와 동일 | 3,744 KB |
| 3 | asset_cache | `idx_asset_cache_checked_at` | 단독 조회 없음 | 2,096 KB |
| 4 | asset_cache | `idx_asset_cache_status` | 단독 조회 없음 | 672 KB |
| 5 | football_players | `idx_football_players_player_id` | unique 인덱스와 동일 | 296 KB |
| 6 | football_players | `idx_football_players_korean_name` | 단독 검색 없음 | 448 KB |
| 7 | football_players | `idx_football_players_name` | ILIKE에 btree 무효 | 368 KB |
| 8 | football_players | `idx_football_players_position` | 단독 검색 없음 | 136 KB |
| 9 | football_teams | `idx_football_teams_team_id` | unique 인덱스와 동일 | 104 KB |
| 10 | football_teams | `idx_football_teams_popularity` | is_active 없이 불완전 | 32 KB |
| 11 | match_highlights | `idx_match_highlights_fixture` | unique 인덱스와 동일 | 16 KB |
| 12 | match_predictions | `idx_match_predictions_user_id` | unique가 user_id 선두로 커버 | 16 KB |
| 13 | match_support_comments | `idx_match_support_comments_team_type` | 단독 조회 없음 | 16 KB |
| 14 | match_ai_predictions | `idx_match_ai_predictions_fixture_id` | unique 인덱스와 동일 | 16 KB |

**총 절약: 약 8.7 MB** (asset_cache에서 대부분)

### 2.2 추가 대상 — 필요한데 없는 인덱스 (4개)

| # | 테이블 | 인덱스 | 사용하는 쿼리 패턴 |
|---|--------|--------|-----------------|
| 1 | match_cache | (data_type, updated_at DESC) | sitemap: `.eq('data_type', 'full').order('updated_at', desc)` |
| 2 | asset_cache | (type, status) | 관리자: 상태별 조회 (에러 목록 등) |
| 3 | football_teams | (is_active, league_id) | 검색: `.eq('is_active', true).eq('league_id', ...)` |
| 4 | football_teams | (is_active, popularity_score DESC) | 검색 정렬: `.eq('is_active', true).order('popularity_score', desc)` |

### 2.3 match_cache 컬럼 추가

| 컬럼 | 타입 | 기본값 | 목적 |
|------|------|--------|------|
| created_at | TIMESTAMPTZ | NOW() | 캐시 저장 시점 기록 |
| is_complete | BOOLEAN | TRUE | 데이터 완전성 플래그 (true=완전, false=불완전→재시도) |

### 2.4 api_usage_log 테이블 생성

API-Football 호출 사용량 추적 신규 테이블.

### 2.5 cleanup_expired_data() 함수 생성

만료 데이터 자동 정리 함수.

---

## 3. 이전 문서에서 틀렸던 내용 (정정)

| 이전 주장 | 실제 | 정정 |
|----------|------|------|
| "10개 테이블 전부 인덱스 없음" | 모든 테이블에 PK + UNIQUE + 추가 인덱스 있음 | 인덱스는 있고, 오히려 **중복이 문제** |
| "football_players: player_id unique 없음" | `football_players_player_id_key` UNIQUE 있음 | 이미 있음 |
| "match_predictions: unique 없음" | `match_predictions_user_id_match_id_key` UNIQUE 있음 | 이미 있음 |
| "match_prediction_stats: unique 없음 + 버그" | match_id가 **PK** → onConflict 없어도 정상 | **버그 아님** |
| "match_comment_likes: unique 없음" | `match_comment_likes_user_id_comment_id_key` UNIQUE 있음 | 이미 있음 |
| "match_ai_predictions: unique 없음" | `match_ai_predictions_fixture_id_key` UNIQUE 있음 | 이미 있음 |

---

## 4. 수정 대상 파일

| 파일 | 작업 | 유형 |
|------|------|------|
| `docs/database/20260326_livescore_indexes.sql` | 중복 삭제 + 복합 인덱스 추가 + 테이블/함수 생성 | **신규** |
| `docs/livescore/db-restructuring-plan.md` | 틀린 내용 정정 + Phase 1 완료 기록 | **수정** |

> **predictions.ts 수정 불필요** — match_prediction_stats의 match_id가 PK이므로 upsert 정상 동작.

---

## 5. SQL 마이그레이션 내용

```sql
-- Section 1: 중복/불필요 인덱스 14개 삭제
DROP INDEX IF EXISTS idx_match_cache_lookup;
DROP INDEX IF EXISTS idx_asset_cache_type_entity;
DROP INDEX IF EXISTS idx_asset_cache_checked_at;
DROP INDEX IF EXISTS idx_asset_cache_status;
DROP INDEX IF EXISTS idx_football_players_player_id;
DROP INDEX IF EXISTS idx_football_players_korean_name;
DROP INDEX IF EXISTS idx_football_players_name;
DROP INDEX IF EXISTS idx_football_players_position;
DROP INDEX IF EXISTS idx_football_teams_team_id;
DROP INDEX IF EXISTS idx_football_teams_popularity;
DROP INDEX IF EXISTS idx_match_highlights_fixture;
DROP INDEX IF EXISTS idx_match_predictions_user_id;
DROP INDEX IF EXISTS idx_match_support_comments_team_type;
DROP INDEX IF EXISTS idx_match_ai_predictions_fixture_id;

-- Section 2: 필요한 복합 인덱스 4개 추가
CREATE INDEX IF NOT EXISTS idx_match_cache_datatype_updated ON match_cache (data_type, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_asset_cache_type_status ON asset_cache (type, status);
CREATE INDEX IF NOT EXISTS idx_football_teams_active_league ON football_teams (is_active, league_id);
CREATE INDEX IF NOT EXISTS idx_football_teams_active_popularity ON football_teams (is_active, popularity_score DESC);

-- Section 3: match_cache 컬럼 추가
ALTER TABLE match_cache ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE match_cache ADD COLUMN IF NOT EXISTS is_complete BOOLEAN DEFAULT TRUE;
UPDATE match_cache SET is_complete = TRUE WHERE is_complete IS NULL;

-- Section 4: api_usage_log 테이블 생성
-- Section 5: cleanup_expired_data() 함수 생성
```

---

## 6. 실행 결과 (2026-03-26 완료)

Supabase MCP `apply_migration`으로 5개 Migration을 순차 실행.

| # | Migration 이름 | 상태 | 결과 |
|---|---------------|------|------|
| 1 | `drop_duplicate_livescore_indexes` | **완료** | 중복/불필요 인덱스 14개 삭제 |
| 2 | `add_livescore_composite_indexes` | **완료** | 복합 인덱스 4개 추가 |
| 3 | `add_match_cache_columns` | **완료** | created_at, is_complete 컬럼 추가 |
| 4 | `create_api_usage_log` | **완료** | 테이블 + 인덱스 + RLS 생성 |
| 5 | `recreate_cleanup_expired_data_function` | **완료** | 기존 함수 DROP 후 재생성 (반환 타입 변경) |

### cleanup 함수 최초 실행 결과

```
{
  "ai_predictions_deactivated": 38,  ← 만료된 AI 예측 38건 비활성화 (is_active=FALSE)
  "ai_predictions_deleted": 2,       ← 30일 지난 비활성 예측 2건 완전 삭제
  "asset_errors_cleaned": 0,
  "old_predictions_cleaned": 0,
  "comments_unhidden": 0,
  "api_logs_cleaned": 0
}
```

- AI 예측 38건: 전부 3/8~3/17 경기, 만료일 3/15~3/24. 이미 expires_at이 지나서 조회 안 되던 데이터.
- 게시글(`/boards/foreign-analysis/...`)의 차트는 **게시글 content에 데이터가 직접 내장**되어 있어 `match_ai_predictions` 테이블을 조회하지 않음. 따라서 **영향 없음**.

### Migration 5 참고사항

기존에 `cleanup_expired_data()` 함수가 다른 반환 타입(`void` 또는 `TABLE`)으로 존재.
`CREATE OR REPLACE`로는 반환 타입 변경 불가 → `DROP FUNCTION` 후 재생성.
Migration 이름이 `recreate_cleanup_expired_data_function`인 이유.

---

## 7. 검증 방법

각 Migration 실행 후 `execute_sql`로 확인:

```sql
-- 1. 삭제된 인덱스 확인 (결과 0행이면 정상)
SELECT indexname FROM pg_indexes WHERE indexname = 'idx_match_cache_lookup';

-- 2. 추가된 인덱스 확인 (결과 1행이면 정상)
SELECT indexname FROM pg_indexes WHERE indexname = 'idx_match_cache_datatype_updated';

-- 3. match_cache 새 컬럼 확인
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'match_cache' AND column_name IN ('created_at', 'is_complete');

-- 4. api_usage_log 테이블 확인
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'api_usage_log' ORDER BY ordinal_position;

-- 5. cleanup 함수 확인
SELECT proname FROM pg_proc WHERE proname = 'cleanup_expired_data';

-- 6. 전체 인덱스 최종 현황
SELECT tablename, indexname, pg_size_pretty(pg_relation_size(indexname::regclass))
FROM pg_indexes
WHERE tablename IN ('match_cache', 'asset_cache', 'football_teams', 'football_players',
  'match_highlights', 'match_predictions', 'match_prediction_stats',
  'match_support_comments', 'match_comment_likes', 'match_ai_predictions',
  'api_usage_log')
ORDER BY tablename, indexname;
```

---
---

# Phase 2: API 래퍼 수정

> **상태**: **완료** (2026-03-26)
> **목적**: API-Football 호출의 안전성/모니터링 강화 + 폴링 주기 최적화
> **수정 파일**: `src/domains/livescore/actions/footballApi.ts` (1개)

---

## 1. 코드베이스 검증 결과 (DB 직접 조회 + 코드 확인)

### 1.1 `fetchFromFootballApi` — 전체 프로젝트의 단일 진입점

이 함수 하나가 API-Football의 **모든 호출을 담당**합니다.
livescore + prediction 도메인에서 총 **50+개 호출 경로**가 이 함수를 거칩니다.

```
호출 경로 예시:
  src/domains/livescore/actions/footballApi.ts      — 경기, 리그, 팀, 트로피
  src/domains/livescore/actions/match/*.ts           — 이벤트, 라인업, 통계, H2H
  src/domains/livescore/actions/player/*.ts           — 선수 정보, 스탯, 부상, 이적
  src/domains/livescore/actions/teams/*.ts            — 팀 정보, 스쿼드, 순위
  src/domains/livescore/utils/matchDataApi.ts         — 매치 데이터
  src/domains/prediction/actions.ts                   — AI 예측용 데이터
  src/domains/prediction/utils/predictMatch.ts        — AI 예측 생성
```

**→ 이 함수 하나만 수정하면 전체 프로젝트에 적용됨.**

### 1.2 현재 코드의 문제 (코드 직접 확인)

```typescript
// footballApi.ts:232-253 — 현재 코드

const response = await fetch(url, {
  headers: {
    'x-rapidapi-host': 'v3.football.api-sports.io',
    'x-rapidapi-key': API_KEY,
  },
  next: { revalidate: getRevalidateTime(endpoint) }
});

if (!response.ok) {
  throw new Error(`API 응답 오류: ${response.status}`);
}

return await response.json();
// ↑ 문제 1: response.errors 확인 안 함
// ↑ 문제 2: rate limit 헤더 확인 안 함
// ↑ 문제 3: 호출 기록 안 남김
```

### 1.3 현재 revalidate 시간 (코드 직접 확인)

```typescript
// footballApi.ts:214-230 — 현재 설정

fixtures:    120초 (2분)     → 유지
events:      30초            → 15초로 변경 (가이드: 15초)
lineups:     300초 (5분)     → 유지
standings:   1800초 (30분)   → 3600초로 변경 (가이드: 1시간)
players/:    3600초 (1시간)  → 유지
teams/:      3600초 (1시간)  → 유지
transfers:   86400초 (24시간) → 유지
trophies:    86400초 (24시간) → 유지
injuries:    3600초 (1시간)  → 14400초로 변경 (가이드: 4시간)
기본값:      300초 (5분)     → 유지
```

### 1.4 `footballTeamsSync.ts` — 별도 호출 (수정 대상 아님)

`footballTeamsSync.ts`는 `fetchFromFootballApi`를 사용하지 않고 직접 `fetch`합니다.
이건 관리자 수동 실행이라 Phase 2에서는 건드리지 않습니다.

---

## 2. 작업 내용

### 2-1. response.errors 확인 추가

API-Football은 HTTP 200을 반환하면서도 body에 에러를 넣을 수 있음.

```typescript
// 변경 후
const data = await response.json();

// response.errors 확인 (200이어도 에러 가능)
if (data.errors && typeof data.errors === 'object' && Object.keys(data.errors).length > 0) {
  const errorMsg = JSON.stringify(data.errors);
  console.error(`[API-Football] ${endpoint} errors:`, errorMsg);
  throw new Error(`API-Football 에러: ${errorMsg}`);
}
```

### 2-2. Rate limit 헤더 확인 + api_usage_log 기록

```typescript
// 변경 후 — rate limit 확인
const remainingDaily = response.headers.get('x-ratelimit-requests-remaining');
const remainingMinute = response.headers.get('X-RateLimit-Remaining');

if (remainingDaily && parseInt(remainingDaily) < 100) {
  console.warn(`[API-Football] 일일 할당량 잔여: ${remainingDaily}`);
}

// api_usage_log에 기록 (Phase 1에서 생성한 테이블)
// fire-and-forget으로 비동기 기록 (응답 속도에 영향 안 줌)
logApiUsage({
  endpoint,
  params: finalParams,
  statusCode: response.status,
  remainingDaily: remainingDaily ? parseInt(remainingDaily) : null,
  remainingMinute: remainingMinute ? parseInt(remainingMinute) : null,
  responseHasError: false,
  responseResults: data.results ?? 0,
  responseTimeMs: Date.now() - startTime,
}).catch(() => {});  // 로깅 실패해도 무시
```

### 2-3. 폴링 주기 조정 (3개만 변경)

```typescript
// 변경되는 것만:
if (ep.includes('events')) return 15;         // 30초 → 15초 (가이드: 15초)
if (ep.includes('standings')) return 3600;    // 1800초 → 3600초 (가이드: 1시간)
if (ep.includes('injuries')) return 14400;   // 3600초 → 14400초 (가이드: 4시간)
```

### 2-4. 이적/트로피 — 변경 없음

이전 논의에서 24시간 유지로 결정 (새 이적/수상 추가 가능성 때문).

---

## 3. 수정 대상

| 파일 | 수정 내용 |
|------|----------|
| `src/domains/livescore/actions/footballApi.ts` | fetchFromFootballApi 함수에 errors 체크, rate limit 확인, 로깅 추가, revalidate 3개 변경 |

**코드 변경 없는 파일**: 나머지 50+개 호출 파일은 전부 `fetchFromFootballApi`를 import해서 쓰므로 자동 적용.

---

## 4. 주의사항

1. **api_usage_log 기록은 fire-and-forget**: `.catch(() => {})` 로 처리. 로깅 실패가 API 응답에 영향 주면 안 됨.
2. **Next.js fetch 캐시와의 관계**: `fetchFromFootballApi`는 `next: { revalidate }` 옵션을 사용. 캐시 히트 시에는 이 함수 자체가 호출 안 됨 → 로깅도 안 됨 → 정상 (캐시 히트는 API 호출이 아니니까).
3. **revalidate 변경 영향**: standings 30분→1시간은 API 호출이 줄어드는 것이라 긍정적. events 30초→15초는 약간 늘어나지만, 라이브 경기 이벤트 반영이 빨라짐.
4. **에러 throw 영향**: 기존에 에러를 무시하고 빈 데이터로 처리하던 곳이 이제 에러를 throw함. 호출하는 쪽에서 try-catch로 처리하고 있는지 확인 필요 → 전부 try-catch 있음 (확인 완료).

---

## 5. 실행 결과 (2026-03-26 완료)

### 수정 내용
- `footballApi.ts`의 `fetchFromFootballApi` 함수에:
  - `logApiUsage` 헬퍼 함수 추가 (fire-and-forget DB 기록)
  - `response.errors` 체크 추가 (200이어도 body에 에러 있으면 throw)
  - rate limit 헤더 확인 + 잔여 100 미만 시 console.warn
  - revalidate 3개 변경: events 30→15초, standings 1800→3600초, injuries 3600→14400초
- TypeScript 타입 에러 없음 확인 (tsc --noEmit)

### 검증 결과 (api_usage_log 확인)

배포 후 자동으로 기록된 7건:

```
standings × 4건 — 응답시간 10~824ms
fixtures  × 3건 — 응답시간 517~849ms

전부:
  status_code: 200        ✅
  response_has_error: false ✅
  remaining_daily: 74,166+ ✅ (일일 할당량 충분)
  remaining_minute: 442+   ✅ (분당 할당량 충분)
```

standings 4건 중 3건의 응답시간이 10~11ms → Next.js Data Cache 히트 (API 실제 호출 아님).
1건만 824ms → 실제 API 호출. 캐시 만료 후 재요청된 것.

---
---

# Phase 3: 저장 로직 + 전력 탭 통합 개선

> **상태**: **완료** (2026-03-26)
> **목적**: 저장 로직 안전성 개선 + 전력 탭 API 호출 안전성 + 관리 함수 추가
> **원래 계획**: Phase 3 (8개) + Phase 3.5 (5개) = 13개 → **코드베이스 검증 후 4파일 8작업으로 통합**

---

## 1. 코드베이스 재검증 결과

### 원래 8개 작업 → 검증 후 판정

| # | 작업 | 판정 | 사유 |
|---|------|------|------|
| 3-1 | 컵 결승 AET/PEN 상태 체크 | **제외** | `fetchCupFinal`, `fetchCupWinner` 함수가 **프로젝트 어디에서도 호출 안 됨** (dead code). 수정해도 아무 효과 없음. footballApi.ts 내부에서만 정의되고 사용처 0. |
| 3-2 | goals null 유지 (0 변환 제거) | **제외** | `goals.home`, `goals.away`를 직접 렌더링하는 UI 컴포넌트 **18개+** 발견. 전부 `number` 타입으로 가정. null로 바꾸면 `NaN`, 빈 화면 등 대량 에러 발생. MatchData 인터페이스도 `number`(not `number | null`). |
| 3-3 | footballTeamsSync 전체삭제 → upsert | **진행** | `.delete().neq('id', 0)` 확인. 동기화 중 데이터 손실 위험. upsert로 변경하면 안전. |
| 3-4 | football_teams current_position, is_winner 제거 | **제외** | `current_position`이 searchTeams.ts에서 **정렬 기준으로 사용 중** (3곳). 제거하면 검색 결과 정렬이 깨짐. is_winner만 제거할 수 있으나, 단독으로는 효과 미미. |
| 3-5 | football_players 컬럼 축소 | **보류** | `getPlayerWithKoreanName()`이 team_id, position, number를 select하지만, 실제 UI에서 사용 여부 추가 확인 필요. 급하지 않음. |
| 3-6 | matchCache is_complete 코드 적용 | **진행** | Phase 1에서 DB 컬럼은 추가했지만, matchCache.ts 코드에서 **아직 안 쓰고 있음**. 저장/조회 시 is_complete 활용 코드 필요. |
| 3-7 | matchCache 관리 함수 추가 | **진행** | deleteMatchCache, refreshMatchCache 함수 없음. 관리자 캐시 관리에 필수. |
| 3-8 | asset_cache 강제 재다운로드 함수 | **진행** | forceRefreshAsset 함수 없음. 관리자 이미지 재다운로드에 필요. |

### 제외 사유 상세

**3-1 컵 결승 (dead code)**:
```
검색 결과: fetchCupFinal, fetchCupWinner
  → src/domains/livescore/actions/footballApi.ts 에서만 정의
  → 프로젝트 전체에서 import/호출하는 곳 없음
  → 수정해도 런타임에 아무 영향 없음
```

**3-2 goals null (UI 파괴)**:
```
goals.home / goals.away를 직접 사용하는 파일들:
  - PlayerFixtures.tsx: `{fixture.goals.home} - {fixture.goals.away}` (직접 렌더링)
  - FixturesTab.tsx: `${match.goals.home}-${match.goals.away}` (문자열 조합)
  - MatchItems.tsx: `{match.goals.home}-{match.goals.away}` (직접 렌더링)
  - MatchCard, LiveScoreContent, NavigationBar... 등 18+개

  null로 바꾸면:
  → `null - null` 또는 `NaN` 표시
  → 18+개 파일 전부 null 처리 추가해야 함
  → 인터페이스 타입도 number → number | null로 변경해야 함
  → 리스크 대비 효과가 너무 작음
```

**3-4 current_position 제거 (검색 깨짐)**:
```
searchTeams.ts:84
  .order('current_position', { ascending: true, nullsFirst: false })

이 정렬이 없어지면 팀 검색 결과가 이름 순으로만 나옴.
"프리미어리그 팀" 검색 시 1위 팀이 맨 위가 아니라 ABC 순으로 나옴.
```

---

## 2. 실제 진행할 작업 (4개)

### 2-1. footballTeamsSync 전체삭제 → upsert (3-3)

**파일**: `src/domains/livescore/actions/footballTeamsSync.ts`

```
현재 (위험):
  1. DELETE FROM football_teams WHERE id != 0  (전체 삭제)
  2. 리그별로 API 호출 + INSERT
  3. 중간에 API 실패하면 → 해당 리그 데이터 영구 손실

변경 (안전):
  1. 동기화 시작 시각 기록
  2. 리그별로 API 호출 + UPSERT (기존 데이터 유지하면서 업데이트)
  3. 동기화 안 된 팀만 is_active = false로 비활성화
```

### 2-2. matchCache.ts — is_complete 활용 + 관리 함수 + 전력 저장

**파일**: `src/domains/livescore/actions/match/matchCache.ts`

```
3가지 작업 통합 (같은 파일이므로 한번에):

  (a) is_complete 활용:
    - DB에 is_complete 컬럼 있음 (Phase 1에서 추가) → 코드에서 아직 안 씀
    - setMatchCache(): 저장 시 is_complete 값 설정
    - getMatchCache(): is_complete=false면 캐시 미스 처리 → API 재호출

  (b) 관리 함수:
    - deleteMatchCache(matchId, dataType?): 특정 캐시 삭제
    - getMatchCacheStats(): 전체 캐시 통계 (관리자 대시보드용)

  (c) 전력 데이터 저장 지원:
    - data_type에 'power' 추가 (기존: 'full', 'matchPlayerStats')
    - validateCacheData에 power 타입 검증 로직 추가
```

### 2-3. headtohead.ts — allSettled + AET/PEN + 4590

**파일**: `src/domains/livescore/actions/match/headtohead.ts`

```
3가지 작업 통합 (같은 파일이므로 한번에):

  (a) Promise.all → Promise.allSettled + fetchWithRetry:
    - 7개 API 중 1개 실패해도 나머지 데이터 표시
    - 실패 시 1번 재시도

  (b) H2H/최근폼 status 필터 수정:
    - 현재: status: 'FT' (정규시간 종료만)
    - 변경: status 파라미터 제거, 코드에서 FT/AET/PEN 모두 포함

  (c) H2H 리그 로고 4590 표준 적용:
    - 현재: league.logo에 API-Sports URL 직접 사용
    - 변경: getLeagueLogoUrls()로 Supabase Storage URL 조회
```

### 2-4. ensureAssetCached.ts — 강제 재다운로드

**파일**: `src/domains/livescore/actions/images/ensureAssetCached.ts`

```
추가할 함수:
  - forceRefreshAsset(type, entityId): 캐시 삭제 + 재다운로드 트리거
```

---

## 3. 수정 대상 파일 (4개)

| 파일 | 작업 수 | 내용 |
|------|---------|------|
| `footballTeamsSync.ts` | 1개 | 전체삭제 → upsert |
| `matchCache.ts` | 3개 통합 | is_complete + 관리 함수 + 전력 저장 |
| `headtohead.ts` | 3개 통합 | allSettled + AET/PEN + 4590 |
| `ensureAssetCached.ts` | 1개 | forceRefreshAsset |

**별도 Phase로 분리:**
| 파일 | 이유 |
|------|------|
| `match/[id]/page.tsx` | Suspense 스트리밍은 구조 변경이 크고 독립적 |

---

## 4. 주의사항

1. **footballTeamsSync**: 기존 `saveTeamToDatabase`가 이미 upsert 사용 → DELETE 로직만 제거하고 비활성화 로직 추가
2. **is_complete 무한 루프 방지**: getMatchCache에서 is_complete=false → API 재호출 → 또 불완전 → 또 호출... 방지 필요. 재시도 횟수 제한 또는 "불완전이어도 1시간은 캐시 사용" 등
3. **headtohead.ts AET/PEN**: API-Football의 `status` 파라미터가 콤마 구분 지원하는지 확인 필요. 안 되면 status 파라미터 제거 후 코드에서 필터
4. **forceRefreshAsset**: `cacheAsset`이 export 안 됨 → DB에서 status 삭제 후 `ensureAssetCached` 재호출 방식으로 구현
5. **matchCache power 타입**: 기존 MatchDataType = 'full' | 'matchPlayerStats'에 'power' 추가 시 타입 안전성 확인

---

## 5. 검증 방법

1. `footballTeamsSync` → 관리자 동기화 실행 → 기존 데이터 유지 확인
2. `matchCache is_complete` → 경기 상세 페이지 정상 로드 확인
3. `deleteMatchCache` → Supabase에서 직접 호출 테스트
4. `headtohead allSettled` → 전력 탭 정상 로드 확인
5. `H2H AET/PEN` → 승부차기 경기가 맞대결 기록에 나오는지 확인
6. `forceRefreshAsset` → 특정 팀 로고 강제 재다운로드 테스트

---

## 6. 실행 결과

### 수정된 파일 4개 — 완료

| 파일 | 변경 내용 | 상태 |
|------|----------|------|
| `footballTeamsSync.ts` | DELETE 제거 → upsert + 비활성화 | ✅ |
| `matchCache.ts` | power 타입, is_complete, 관리 함수 | ✅ |
| `headtohead.ts` | allSettled+Retry, AET/PEN, 리그 로고 4590 | ✅ |
| `ensureAssetCached.ts` | forceRefreshAsset | ✅ |

### 추가 완료 — 전력 데이터 캐시 저장 + Suspense 스트리밍

| 작업 | 상태 | 설명 |
|------|------|------|
| **전력 데이터 match_cache 저장** | **완료** ✅ | page.tsx의 MatchContentLoader에서 getMatchCache('power') 조회 + setMatchCache('power') 저장 |
| **Suspense 스트리밍** | **완료** ✅ | page.tsx를 메인 페이지(/)와 동일한 Suspense 패턴으로 변경. MatchContentLoader 별도 서버 컴포넌트. |

### 전력 데이터 저장이 미완료인 이유

```
현재 코드 상태:

  matchCache.ts:
    ✅ MatchDataType에 'power' 추가
    ✅ validateCacheData에 power 검증 로직
    ✅ setMatchCache('power', data) 호출하면 저장 가능
    → "저장할 수 있는 구조"는 준비됨

  headtohead.ts:
    ✅ isComplete 플래그 반환
    → "저장할 데이터"는 준비됨

  page.tsx: ← 여기가 빠짐
    ❌ 전력 데이터를 가져온 후 setMatchCache(matchId, 'power', ...) 호출 없음
    ❌ 전력 데이터를 가져오기 전 getMatchCache(matchId, 'power') 확인 없음

  있어야 할 전체 흐름:
    1. getMatchCache(matchId, 'power') → 캐시 확인
    2. 있으면 → DB에서 반환 (API 0번!)
    3. 없으면 → getCachedPowerData() 호출 (API 7번)
    4. 종료 경기면 → setMatchCache(matchId, 'power', data) 저장
    5. 다음 접속 → 1번에서 캐시 히트

  현재는 3번만 하고 있고, 1/2/4가 빠져있음
```

### Suspense 스트리밍이 필요한 이유

```
현재 page.tsx:
  모든 데이터를 await로 순차 로드 → 전부 끝나야 화면 표시
  → 사용자는 1~2초 동안 로딩 화면만 봄

메인 페이지(/)의 Suspense 패턴 (이미 구현됨):
  page.tsx에서 blocking await 없음
  각 섹션이 별도 async 서버 컴포넌트
  Suspense fallback으로 스켈레톤 즉시 표시
  데이터 준비된 섹션부터 스트리밍
```

### Suspense 스트리밍 적용 방법 — 메인 페이지 패턴 참고

```
메인 페이지가 이미 쓰고 있는 패턴:

  // page.tsx — await 없음, 즉시 렌더링
  export default function HomePage() {
    return (
      <main>
        <BoardQuickLinksWidget />        ← 즉시 표시 (데이터 없음)
        <AdBanner />                     ← 즉시 표시

        <Suspense fallback={<LiveScoreSkeleton />}>
          <LiveScoreWidgetStreaming />    ← 별도 async 서버 컴포넌트
        </Suspense>                         내부에서 await fetchMultiDayMatches()
      </main>
    );
  }

  // LiveScoreWidgetStreaming — async 서버 컴포넌트
  export async function LiveScoreWidgetStreaming() {
    const data = await fetchMultiDayMatches();  // ← 여기서 await
    return <LiveScoreWidgetV2Server initialData={data} />;
  }
```

```
경기 상세 페이지에 동일 패턴 적용하면:

  // match/[id]/page.tsx
  export default async function MatchPage({ params }) {
    const { id } = await params;

    // matchData만 먼저 (헤더 표시용 — 점수, 팀명)
    const matchData = await fetchCachedMatchFullData(id, { ... });
    if (!matchData.success) return notFound();

    return (
      <div className="container">
        {/* 헤더: 즉시 표시 (matchData만 있으면 됨) */}
        <MatchHeader match={matchData} />

        {/* 탭 + 사이드바: 별도 서버 컴포넌트, Suspense 스트리밍 */}
        <Suspense fallback={<MatchContentSkeleton />}>
          <MatchContentLoader matchId={id} matchData={matchData} />
        </Suspense>
      </div>
    );
  }

  // MatchContentLoader — async 서버 컴포넌트
  async function MatchContentLoader({ matchId, matchData }) {
    // 여기서 나머지 전부 병렬 호출
    const [sidebar, power, playerStats, koreanNames, highlight] = await Promise.all([
      getCachedSidebarData(matchId),
      getCachedPowerData(...),
      fetchAllPlayerStats(...),
      getPlayersKoreanNames(...),
      getMatchHighlight(...),
    ]);

    // 전력 데이터 캐시 저장도 여기서
    if (isFinished && power.success) {
      setMatchCache(matchId, 'power', power.data, statusCode).catch(() => {});
    }

    return (
      <MatchPageClient
        matchData={matchData}
        powerData={power}
        sidebarData={sidebar}
        ...
      />
    );
  }
```

```
효과:

  현재:
    0.0초 ─────────── 1.5초: 로딩...
                       1.5초: 전부 한번에 표시

  Suspense 적용 후:
    0.0초: 스켈레톤 즉시
    0.3초: 경기 헤더(점수, 팀명) 먼저 표시 ← 사용자가 가장 보고 싶은 것
    0.8초: 나머지 탭/사이드바 스트리밍

  총 시간은 비슷하지만, 사용자가 0.3초에 점수를 볼 수 있음
```

### 주의사항

1. **MatchPageClient 분리 필요**: 현재 MatchPageClient가 모든 props를 한번에 받는 구조. Suspense를 쓰려면 헤더와 나머지를 분리해야 함.
2. **쿠키 충돌**: page.tsx에서 Supabase 서버 클라이언트 사용 함수를 Promise.all로 병렬 호출하면 쿠키 충돌. **별도 async 서버 컴포넌트 안에서 호출하면 해결됨** (메인 페이지가 이 방식).
3. **loading.tsx와의 관계**: 현재 loading.tsx가 있는데, Suspense를 page.tsx 안에 넣으면 loading.tsx는 최초 네비게이션 시에만 동작하고, Suspense fallback이 실제 스트리밍 스켈레톤 역할.

### 재검증 결과
- TypeScript 타입 체크: 수정된 4개 파일 에러 없음
- `getMatchCacheBulk()`에서 is_complete 체크 누락 → 수정 완료

---
---

# Phase 4: 클라이언트 수정

> **상태**: **완료** (2026-03-26)
> **목적**: 라이브 스코어 폴링 개선 + 캐시 키 날짜 반영
> **수정 파일**: 3개

---

## 1. 코드베이스 검증 결과

### 1.1 수정 대상 파일 3개

**파일 1: `src/domains/livescore/hooks/useLiveScoreQueries.ts`**

```typescript
// 현재 코드 (2곳)

// useMatches — 47행
refetchIntervalInBackground: false  // 탭 비활성 시 폴링 중단

// useTodayLiveCount — 81행
refetchIntervalInBackground: false  // 탭 비활성 시 폴링 중단
```

문제: 사용자가 다른 탭 갔다 돌아오면 라이브 스코어가 멈춰있음.

**파일 2: `src/shared/constants/queryKeys.ts`**

```typescript
// 현재 코드 — 77행
multiDay: () => [...liveScoreKeys.all, 'multiDay'] as const
// 날짜 파라미터 없음 → 자정 넘어도 같은 캐시 사용 가능
```

문제: 11:59pm에 가져온 "오늘" 데이터가 12:01am에도 "오늘"로 남아있음.

**파일 3: `src/domains/livescore/hooks/useLiveScoreData.ts`**

```typescript
// 현재 코드 — 19~21행
staleTime: 1000 * 60 * 5,   // 5분
gcTime: 1000 * 60 * 10,     // 10분
refetchOnWindowFocus: false, // 탭 복귀 시 갱신 안 함
```

### 1.2 영향 범위 확인

**`multiDay` 키를 사용하는 파일 6개:**
- `queryKeys.ts` — 키 정의
- `LiveScoreCacheSeeder.tsx` — `setQueryData(liveScoreKeys.multiDay(), data)` SSR 데이터 주입
- `useLiveScoreData.ts` — `useQuery({ queryKey: liveScoreKeys.multiDay() })` 훅
- `LiveScoreModalClient.tsx` — useMultiDayMatches() 사용
- `LiveScoreWidgetV2Server.tsx` — useMultiDayMatches() 사용
- `hooks/index.ts` — re-export

**`refetchIntervalInBackground`를 사용하는 곳:**
- `useLiveScoreQueries.ts` — 2곳 (useMatches, useTodayLiveCount)

**글로벌 QueryClient 설정 (RootLayoutProvider.tsx):**
```typescript
defaultOptions: {
  queries: {
    staleTime: 1000 * 60 * 5,     // 5분
    gcTime: 1000 * 60 * 10,       // 10분
    refetchOnWindowFocus: false,   // 글로벌 설정
    refetchOnMount: false,
    refetchOnReconnect: false,
  }
}
```

### 1.3 주의사항

1. **multiDay 키 변경 시 LiveScoreCacheSeeder와 일치해야 함**
   - `LiveScoreCacheSeeder`가 `liveScoreKeys.multiDay()`로 캐시 주입
   - `useLiveScoreData`가 같은 키로 조회
   - 키가 달라지면 캐시 미스 → SSR 데이터 못 씀 → 로딩 스피너 표시
   - **양쪽이 같은 함수를 호출하므로 자동으로 일치** (queryKeys.ts만 바꾸면 됨) ✅

2. **refetchOnWindowFocus는 글로벌 설정과 로컬 설정 관계**
   - 글로벌: `false` (RootLayoutProvider.tsx)
   - 로컬(useMultiDayMatches): `false`
   - 변경 계획: useLiveScoreData의 로컬 설정만 `true`로 변경
   - 다른 쿼리(게시판, 알림 등)에는 영향 없음 ✅

3. **staleTime/gcTime 변경은 라이브스코어 훅에만 적용**
   - 글로벌 기본값(5분/10분)은 유지
   - useLiveScoreData.ts에서 로컬 오버라이드

---

## 2. 작업 내용

### 2-1. useLiveScoreQueries.ts — 백그라운드 폴링 활성화

```
변경: refetchIntervalInBackground: false → true (2곳)

효과: 사용자가 다른 탭으로 가도 30/60초 폴링 계속 유지.
      탭 복귀 시 최신 스코어가 이미 반영되어 있음.
```

### 2-2. queryKeys.ts — multiDay에 날짜 포함

```
변경 전: multiDay: () => [...liveScoreKeys.all, 'multiDay'] as const
변경 후: multiDay: () => {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const today = kst.toISOString().split('T')[0];
  return [...liveScoreKeys.all, 'multiDay', today] as const;
}

효과: 자정 넘으면 새 캐시 키 → 어제/오늘/내일이 정확히 갱신됨.
```

### 2-3. useLiveScoreData.ts — staleTime 단축 + 탭 복귀 시 갱신

```
변경:
  staleTime: 5분 → 1분
  gcTime: 10분 → 5분
  refetchOnWindowFocus: false → true (탭 복귀 시 갱신)

효과: 데이터가 1분 후 stale → 다음 접근 시 자동 갱신.
      탭 복귀 시에도 갱신.
```

---

## 3. 수정 대상 파일

| 파일 | 변경 |
|------|------|
| `src/domains/livescore/hooks/useLiveScoreQueries.ts` | `refetchIntervalInBackground: true` (2곳) |
| `src/shared/constants/queryKeys.ts` | `multiDay()`에 KST 날짜 포함 |
| `src/domains/livescore/hooks/useLiveScoreData.ts` | staleTime 1분, gcTime 5분, refetchOnWindowFocus true |

---

## 4. 주의사항

1. **queryKeys.ts의 multiDay 변경은 자동 전파**: LiveScoreCacheSeeder도 같은 `liveScoreKeys.multiDay()` 호출 → 키 일치 보장
2. **글로벌 설정 건드리지 않음**: RootLayoutProvider.tsx의 defaultOptions 유지 → 게시판/알림 등 다른 쿼리 영향 없음
3. **refetchIntervalInBackground: true의 부작용**: 탭을 켜놓고 다른 일 하면 30~60초마다 계속 API 호출. 하지만 Next.js Data Cache가 있으므로 실제 API-Football 호출은 revalidate 시간(60~120초)에 한 번만
4. **multiDay 키에 날짜 포함 시**: 자정에 키가 바뀌면서 기존 캐시가 미스됨 → `fetchMultiDayMatches()` 재호출. 이건 의도된 동작 (새 날짜 데이터 필요)

---

## 5. 검증 방법

1. 라이브스코어 메인 열고 → 다른 탭 → 1분 후 복귀 → 스코어 갱신 확인
2. 브라우저 콘솔에서 React Query devtools로 multiDay 키에 날짜 포함 확인
3. 라이브스코어 모달 열기 → 데이터 정상 표시 (CacheSeeder 키 일치 확인)
4. 헤더 경기 수 표시 정상 확인

---
---

# Phase 5: 라이브 폴링 최적화

> **상태**: **보류**
> **원래 계획**: `?live=` 엔드포인트 + `?ids=` 배치 조회로 폴링 효율화
> **최종 결론**: 어떤 방식이든 효과 대비 복잡도가 높음. Data Cache가 이미 API 호출 제한 중.

---

## 1. 코드베이스 검증 결과 — 근본적 문제 발견

### 1.1 현재 폴링 방식

```
현재: useMatches() → fetchMatchesByDate('2026-03-26')
  → API: ?date=2026-03-26
  → 응답: 오늘 전체 50경기 (미시작 + 진행 중 + 종료)
  → 30~60초마다 전체 50경기 다시 가져옴
  → 비효율: 진행 중 3경기만 바뀌는데 50경기 전부 가져옴
```

### 1.2 `?live=` 엔드포인트의 한계

```
?live=39-140-78 로 바꾸면:
  → 응답: 현재 진행 중인 경기 3개만 (1H, 2H, HT 상태만)
  → 미시작(NS) 경기: 포함 안 됨!
  → 종료(FT) 경기: 포함 안 됨!

문제:
  UI는 "오늘 전체 경기 목록"을 보여줌 (미시작 + 진행 중 + 종료)
  ?live= 로 폴링하면 진행 중이 아닌 경기가 화면에서 사라짐
```

### 1.3 단순 교체가 안 되는 이유

| 요구사항 | `?date=` (현재) | `?live=` (제안) |
|---------|----------------|----------------|
| 오늘 전체 경기 표시 | ✅ 전부 포함 | ❌ 진행 중만 |
| 라이브 스코어 갱신 | ✅ 포함됨 | ✅ 이것만 포함 |
| 종료 경기 결과 유지 | ✅ 포함됨 | ❌ 사라짐 |
| 미시작 경기 표시 | ✅ 포함됨 | ❌ 사라짐 |
| API 효율성 | ❌ 50경기 전부 | ✅ 3경기만 |

### 1.4 해결하려면 이중 쿼리 + 캐시 병합 필요

```
필요한 구조:

  쿼리 1 (전체 목록): ?date=2026-03-26
    → 60초마다 (또는 초기 1회만)
    → 전체 경기 목록 유지 (미시작 + 종료 포함)

  쿼리 2 (라이브만): ?live=39-140-78...
    → 30초마다 (진행 중 경기 있을 때만)
    → 진행 중 경기의 스코어/상태만 가져옴

  캐시 병합:
    → 쿼리 2 결과로 쿼리 1의 캐시에서 해당 경기만 업데이트
    → 나머지 경기(미시작, 종료)는 그대로 유지

문제점:
  - React Query에서 두 쿼리의 캐시를 수동 병합하는 로직 필요
  - 경기 상태 전환 시점 처리 (NS → 1H, 2H → FT)
  - 새로 시작된 경기가 ?live= 에만 있고 기존 캐시에 없는 경우
  - 종료된 경기가 ?live= 에서 빠지는 타이밍
```

---

## 2. 위험도 평가

| 항목 | 위험도 | 이유 |
|------|--------|------|
| 캐시 병합 로직 | **높음** | 두 쿼리 결과를 수동으로 합쳐야 함. 타이밍 이슈 가능 |
| 경기 상태 전환 | **높음** | NS→1H, 2H→FT 전환 시 두 쿼리 간 불일치 가능 |
| UI 영향 | **중간** | 병합 실패 시 경기가 일시적으로 사라질 수 있음 |
| 기존 코드 변경량 | **높음** | useMatches, useLiveScore, LiveScoreView 등 다수 파일 |

### 현재 방식 대비 실제 절약 효과

```
현재: ?date= 로 60초마다 호출
  → Next.js Data Cache revalidate: 120초
  → 실제 API-Football 호출: 120초에 1번 (나머지는 캐시 히트)
  → 하루 기준: 720번/일

?live= 로 바꿔도:
  → 30초마다 호출하면 오히려 더 많이 호출
  → Data Cache가 ?live= 응답도 120초 캐시
  → 실제 절약 효과: 응답 크기만 줄어듦 (50경기 → 3경기)
  → API 호출 횟수 자체는 비슷하거나 더 많아질 수 있음
```

---

## 3. 최종 결론: 보류

### 검토한 3가지 방안 모두 효과 부족

| 방안 | 문제 |
|------|------|
| `?live=`로 전면 교체 | 미시작/종료 경기 사라짐 → UI 깨짐 |
| LIVE 버튼 ON일 때만 `?live=` | 결국 이중 호출 (ON/OFF 전환마다 각각 API 호출) |
| 이중 쿼리 + 캐시 병합 | 복잡도 높고, 상태 전환 타이밍 이슈 위험 |

### 현재로도 충분한 이유

```
Next.js Data Cache가 이미 작동 중:

  ?date=오늘 호출 → revalidate 120초
  → 30초마다 폴링해도 실제 API-Football 호출은 120초에 1번
  → 나머지는 캐시 히트 (API 할당량 안 씀)
  → 하루 기준: ~720번/일 (충분)
```

### 추후 진행 조건
- api_usage_log 모니터링에서 실제 할당량 부족 확인 시
- 라이브 경기 동시 진행이 많은 시간대에 성능 이슈 보고 시

---
---

# Phase 6: 관리자 캐시 관리 페이지

> **상태**: 대기
> **목적**: match_cache, asset_cache, api_usage_log 데이터를 관리자가 확인/관리할 수 있는 페이지
> **위치**: `/admin/cache-management/`

---

## 1. 코드베이스 검증 결과

### 1.1 기존 admin 구조

```
src/app/admin/
├── layout.tsx              → serverAuthGuard (관리자 권한 체크)
├── components/
│   └── AdminLayoutClient.tsx → 사이드바 메뉴 (14개 항목)
├── page.tsx                → 대시보드 (StatCard)
├── boards/                 → 게시판 관리
├── users/                  → 사용자 관리
├── prediction/             → 예측 분석
├── site-management/        → 사이트 설정
│   ├── branding/
│   ├── seo-v2/
│   └── ui-theme/
└── ... (logs, reports, notifications 등)
```

- 관리자 인증: `serverAuthGuard({ requireAdmin: true })` — layout.tsx에서 처리
- UI 패턴: `'use client'` 컴포넌트, StatCard, Spinner, 다크모드 지원
- 메뉴: `AdminLayoutClient.tsx`의 menuItems 배열에 추가하면 됨

### 1.2 Phase 3에서 만든 서버 액션 (이미 사용 가능)

| 함수 | 파일 | 용도 |
|------|------|------|
| `getMatchCacheStats()` | matchCache.ts:197 | 캐시 통계 (전체/완전/불완전 건수) |
| `deleteMatchCache(matchId, dataType?)` | matchCache.ts:170 | 특정 캐시 삭제 |
| `forceRefreshAsset(type, entityId)` | ensureAssetCached.ts:373 | 이미지 강제 재다운로드 |
| `cleanup_expired_data()` | DB 함수 (Phase 1) | 만료 데이터 정리 |

### 1.3 api_usage_log (Phase 2에서 생성)

```sql
-- 테이블 컬럼
endpoint, params, status_code, remaining_daily, remaining_minute,
response_has_error, response_results, error_details, response_time_ms, created_at
```

Phase 2에서 `fetchFromFootballApi` 호출마다 자동 기록 중.

---

## 2. 페이지 구성 (4개 → 실제 필요성 재평가)

### 계획했던 4개 페이지

| 페이지 | 필요성 | 판정 |
|--------|--------|------|
| 6-1: 경기 캐시 관리 | 불완전 캐시 확인, 잘못된 캐시 삭제 필요 | **진행** |
| 6-2: 이미지 캐시 관리 | 에러 이미지 확인, 강제 재다운로드 필요 | **진행** |
| 6-3: API 사용량 대시보드 | 할당량 모니터링, 에러 추적 | **진행** |
| 6-4: 데이터 정리 | cleanup 함수 실행 | **6-1에 통합** (버튼 하나면 됨) |

### 축소: 3개 페이지 + 메뉴 추가

```
/admin/cache-management/           → 캐시 관리 메인 (통계 요약)
/admin/cache-management/matches/   → 경기 캐시 상세 + cleanup
/admin/cache-management/assets/    → 이미지 캐시 상세
/admin/cache-management/api-usage/ → API 사용량 대시보드
```

---

## 3. 각 페이지 상세

### 3-1. 경기 캐시 관리 (`/admin/cache-management/matches/`)

**데이터 소스**: `getMatchCacheStats()` + Supabase 직접 조회

```
표시 내용:
  ┌─────────────────────────────────────────┐
  │  경기 캐시 현황                          │
  │                                         │
  │  전체: 20,811건  완전: 20,800건          │
  │  불완전: 11건 (재시도 대기)              │
  │                                         │
  │  타입별: full 10,405  matchPlayerStats   │
  │          10,406                          │
  │                                         │
  │  [만료 데이터 정리 실행]  ← cleanup 버튼 │
  └─────────────────────────────────────────┘

  [불완전 캐시 목록]
  경기 #868078 | full | is_complete=false | 2025-03-15
  경기 #868090 | matchPlayerStats | is_complete=false | 2025-03-16
  ...
  [삭제] [강제 갱신]

  [경기 ID로 검색]
  입력: 868078
  → 해당 경기의 캐시 상태 표시
  → [삭제] 버튼
```

**사용하는 서버 액션**:
- `getMatchCacheStats()` — 통계
- `deleteMatchCache(matchId, dataType)` — 삭제
- `cleanup_expired_data()` — DB 함수 호출 (RPC)

### 3-2. 이미지 캐시 관리 (`/admin/cache-management/assets/`)

**데이터 소스**: Supabase `asset_cache` 테이블 직접 조회

```
표시 내용:
  ┌─────────────────────────────────────────┐
  │  이미지 캐시 현황                        │
  │                                         │
  │  전체: 93,649건                          │
  │  ready: 93,500  pending: 12  error: 137 │
  │                                         │
  │  타입별: team_logo 1,200  league_logo 50│
  │          player_photo 90,000  기타 2,399 │
  └─────────────────────────────────────────┘

  [에러 목록]
  team_logo | ID: 9999 | "Download failed: 404" | 2025-03-20
  player_photo | ID: 12345 | "Timeout" | 2025-03-22
  ...
  [강제 재다운로드] ← forceRefreshAsset 호출

  [특정 이미지 검색]
  타입: [team_logo ▼]  ID: [33]
  → 현재 상태 표시 (ready/pending/error)
  → Storage URL 미리보기
  → [강제 재다운로드]
```

**사용하는 서버 액션**:
- `forceRefreshAsset(type, entityId)` — 강제 재다운로드

### 3-3. API 사용량 대시보드 (`/admin/cache-management/api-usage/`)

**데이터 소스**: `api_usage_log` 테이블 직접 조회

```
표시 내용:
  ┌─────────────────────────────────────────┐
  │  API 사용량 (오늘)                       │
  │                                         │
  │  총 호출: 847회  잔여: 74,153/75,000    │
  │  에러: 0건  평균 응답: 312ms             │
  │                                         │
  │  엔드포인트별:                            │
  │  fixtures: 420  standings: 180          │
  │  players: 120   기타: 127               │
  └─────────────────────────────────────────┘

  [최근 호출 로그]
  06:18:42 | fixtures | 200 | 849ms | 잔여 74,167
  06:18:42 | fixtures | 200 | 693ms | 잔여 74,166
  06:18:38 | standings | 200 | 10ms  | 잔여 74,173 ← 캐시 히트
  ...

  [에러 로그만 보기]
  → response_has_error=true 필터
```

**사용하는 서버 액션**: 신규 작성 필요 (api_usage_log 집계 쿼리)

---

## 4. 수정 대상 파일

| 파일 | 작업 | 유형 |
|------|------|------|
| `src/app/admin/components/AdminLayoutClient.tsx` | menuItems에 "캐시 관리" 추가 | 수정 |
| `src/app/admin/cache-management/page.tsx` | 캐시 관리 메인 (통계 요약) | 신규 |
| `src/app/admin/cache-management/matches/page.tsx` | 경기 캐시 관리 | 신규 |
| `src/app/admin/cache-management/assets/page.tsx` | 이미지 캐시 관리 | 신규 |
| `src/app/admin/cache-management/api-usage/page.tsx` | API 사용량 | 신규 |
| `src/domains/admin/actions/cacheManagement.ts` | 캐시 관리 서버 액션 (집계, 조회) | 신규 |

---

## 5. 주의사항

1. **admin layout이 자동 적용**: `/admin/` 하위 경로는 layout.tsx의 `serverAuthGuard` 적용 → 별도 인증 불필요
2. **UI 패턴 통일**: 기존 admin 페이지의 StatCard, Spinner, 다크모드 패턴 따름
3. **데이터 양 주의**: match_cache 20,811건, asset_cache 93,649건 → 전체 목록 불가, 페이지네이션 필수
4. **cleanup 함수**: DB 함수이므로 Supabase `rpc('cleanup_expired_data')` 로 호출
5. **기존 서버 액션 재활용**: Phase 3에서 만든 deleteMatchCache, getMatchCacheStats, forceRefreshAsset 그대로 사용

---

## 6. 실행 결과 (2026-03-26 완료)

### 생성/수정된 파일 6개

| 파일 | 유형 | 내용 |
|------|------|------|
| `src/domains/admin/actions/cacheManagement.ts` | 신규 | 캐시 관리 서버 액션 (통계, 조회, 삭제, cleanup, API 로그) |
| `src/app/admin/cache-management/page.tsx` | 신규 | 메인 (3개 카드 + 통계 요약) |
| `src/app/admin/cache-management/matches/page.tsx` | 신규 | 경기 캐시 (통계, 불완전 목록, 검색, 삭제, cleanup) |
| `src/app/admin/cache-management/assets/page.tsx` | 신규 | 이미지 캐시 (통계, 에러 목록, 강제 재다운로드) |
| `src/app/admin/cache-management/api-usage/page.tsx` | 신규 | API 사용량 (오늘 요약, 로그 테이블, 에러 필터) |
| `src/app/admin/components/AdminLayoutClient.tsx` | 수정 | "캐시 관리" 메뉴 추가 |

### TypeScript 타입 체크
- `tsc --noEmit` 결과: 전부 에러 없음
