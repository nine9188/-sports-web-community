# 트리거 감사 및 정리 계획

> 작성일: 2026-03-19
> 상태: 검토 중

## 현황

public schema에 **11개 트리거** (활성 9개, 비활성 2개, 중복 1개)가 존재합니다.

---

## 트리거별 분석

### 1. Auth 트리거 (유지 권장)

트리거가 **유일한 방법**인 케이스. `auth.users`는 Supabase 내부 테이블이라 서버 액션에서 이벤트를 잡을 수 없습니다.

| 트리거 | 테이블 | 이벤트 | 함수 | 판단 |
|--------|--------|--------|------|------|
| `on_auth_user_created` | `auth.users` | AFTER INSERT | `handle_new_user()` | **유지** |
| `on_email_confirmed` | `auth.users` | AFTER UPDATE | `handle_email_confirmation()` | **유지** |

**`handle_new_user()`**: 회원가입 시 `profiles` 행 자동 생성. 이 트리거가 없으면 회원가입 후 프로필이 없어 앱이 깨집니다.

**`handle_email_confirmation()`**: 이메일 인증 시 `profiles.email_confirmed` 업데이트. auth.users의 변경을 감지해야 하므로 트리거가 필수.

---

### 2. 검색 벡터 트리거 (유지 권장)

PostgreSQL full-text search의 표준 패턴. 데이터 삽입/수정 시 자동으로 tsvector를 갱신합니다.

| 트리거 | 테이블 | 이벤트 | 함수 |
|--------|--------|--------|------|
| `trigger_update_football_players_search_vector` | `football_players` | BEFORE INSERT/UPDATE | `update_football_players_search_vector()` |
| `trigger_update_football_teams_search_vector` | `football_teams` | BEFORE INSERT/UPDATE | `update_football_teams_search_vector()` |

**유지 이유**: 검색 벡터는 매 INSERT/UPDATE마다 반드시 동기화되어야 합니다. 서버 액션으로 옮기면 누락 위험이 있고, 트리거가 가장 안정적입니다.

---

### 3. updated_at 자동 갱신 트리거 (제거 가능)

| 트리거 | 테이블 | 함수 | 판단 |
|--------|--------|------|------|
| `trigger_update_football_teams_updated_at` | `football_teams` | `update_football_teams_updated_at()` | **제거 가능** |
| `update_match_ai_predictions_updated_at` | `match_ai_predictions` | `update_match_ai_predictions_updated_at()` | **제거 가능** |
| `trigger_update_reports_updated_at` | `reports` | `update_reports_updated_at()` | **제거 가능** |

**제거 이유**:
- 함수 내용이 `NEW.updated_at = NOW(); RETURN NEW;` 한 줄
- 서버 액션에서 UPDATE 시 `updated_at: new Date().toISOString()` 명시하면 동일
- 또는 Supabase `DEFAULT now()`가 이미 설정되어 있음 (단, DEFAULT는 INSERT에만 적용되고 UPDATE에는 적용 안 됨)

**대안 A - 서버 액션에서 처리**:
```typescript
// 서버 액션에서 UPDATE 시 항상 포함
await supabase.from('reports').update({
  ...data,
  updated_at: new Date().toISOString()
}).eq('id', id);
```

**대안 B - 트리거 유지 (안전)**:
서버 액션에서 빠뜨릴 위험이 있으므로 트리거를 유지하는 것이 더 안전. 성능 영향도 거의 없음.

**권장**: 현재 서버 액션에서 이미 `updated_at`를 명시하는 곳이 있다면 트리거 제거. 아니면 유지.

---

### 4. 좋아요 수 동기화 트리거 (대안 있음)

| 트리거 | 테이블 | 이벤트 | 함수 | 판단 |
|--------|--------|--------|------|------|
| `on_like_changed` | `post_likes` | AFTER INSERT/DELETE | `update_post_like_count()` | **대안 검토** |

**현재 동작**: `post_likes`에 INSERT/DELETE 발생 시 `posts.likes`를 +1/-1.

**대안 A - 서버 액션에서 처리** (권장):
```typescript
// 좋아요 토글 서버 액션에서 직접 카운트 업데이트
await supabase.from('posts').update({
  likes: currentLikes + 1
}).eq('id', postId);
```
장점: 트리거 의존성 제거, 로직이 코드에서 명확하게 보임
단점: 서버 액션을 거치지 않는 경우(예: 직접 SQL) 카운트 불일치 가능

**대안 B - 실시간 COUNT 쿼리**:
```sql
SELECT COUNT(*) FROM post_likes WHERE post_id = ?
```
장점: 항상 정확, 트리거/비정규화 불필요
단점: 게시글 목록에서 N+1 쿼리 발생, 성능 영향

**대안 C - 트리거 유지** (현재):
장점: 데이터 일관성 자동 보장
단점: 트리거 체인으로 디버깅 어려움

**권장**: 현재 서버 액션에서 좋아요 처리하므로 **서버 액션에서 카운트 업데이트 + 트리거 유지(안전망)**. 나중에 안정화되면 트리거 제거.

---

### 5. 공지 자동 설정 트리거 (서버 액션 대체 가능)

| 트리거 | 테이블 | 이벤트 | 함수 | 판단 |
|--------|--------|--------|------|------|
| `trigger_auto_notice_for_notice_board` | `posts` | BEFORE INSERT | `auto_set_notice_for_notice_board()` | **중복 - 삭제** |
| `trigger_auto_set_notice_for_notice_board` | `posts` | BEFORE INSERT | `auto_set_notice_for_notice_board()` | **대안 검토** |
| `trigger_update_notice_created_at` | `posts` | BEFORE UPDATE | `update_notice_created_at()` | **대안 검토** |

**중복 문제**: `trigger_auto_notice_for_notice_board`와 `trigger_auto_set_notice_for_notice_board`가 동일 함수를 실행. 하나는 반드시 삭제.

**현재 동작**:
- `auto_set_notice_for_notice_board()`: 'notice' 게시판에 글 작성 시 자동으로 `is_notice=true` 설정
- `update_notice_created_at()`: 게시글이 공지로 설정/해제될 때 `notice_created_at` 관리

**대안 - 서버 액션에서 처리**:
```typescript
// 게시글 작성 서버 액션에서
const board = await getBoard(boardId);
if (board.slug === 'notice') {
  postData.is_notice = true;
  postData.notice_created_at = new Date().toISOString();
  postData.notice_type = postData.notice_type || 'global';
}
```

**권장**: 서버 액션에서 게시글 작성/수정 시 처리하고, 트리거는 안전망으로 당분간 유지.

---

### 6. 비활성/미사용 (즉시 삭제)

| 트리거 | 테이블 | 상태 | 판단 |
|--------|--------|------|------|
| `trigger_update_comment_likes_count` | `match_comment_likes` | **비활성(D)** | **삭제** |

**삭제 이유**: 비활성 상태로 동작하지 않음. 필요하면 다시 만들 수 있음.

### 7. 미사용 트리거 함수 (함수만 존재, 트리거 없음)

| 함수 | 연결된 트리거 | 판단 |
|------|-------------|------|
| `assign_default_profile_icon()` | 없음 | **삭제** |
| `update_post_like_count(post_id uuid)` (파라미터 있는 버전) | 없음 (트리거는 파라미터 없는 버전 사용) | **삭제** |

---

## 정리 작업 요약

### 즉시 실행 (부작용 없음)

```sql
-- 1. 중복 트리거 삭제
DROP TRIGGER IF EXISTS trigger_auto_notice_for_notice_board ON posts;

-- 2. 비활성 트리거 + 함수 삭제
DROP TRIGGER IF EXISTS trigger_update_comment_likes_count ON match_comment_likes;

-- 3. 미사용 트리거 함수 삭제
DROP FUNCTION IF EXISTS assign_default_profile_icon();
DROP FUNCTION IF EXISTS update_post_like_count(uuid);  -- 파라미터 있는 버전
```

---

## 수정 완료 (2026-03-19)

### 삭제된 트리거 + 함수

| 대상 | 이유 |
|------|------|
| `trigger_auto_notice_for_notice_board` (posts) | 중복 트리거 |
| `trigger_auto_set_notice_for_notice_board` (posts) | 서버 액션 `setNotice.ts`에서 이미 처리 |
| `auto_set_notice_for_notice_board()` | 위 트리거 함수 |
| `trigger_update_notice_created_at` (posts) | 서버 액션 `setNotice.ts`에서 이미 처리 |
| `update_notice_created_at()` | 위 트리거 함수 |
| `on_like_changed` (post_likes) | 서버 액션 `likes.ts`에서 이미 직접 카운트 관리 (트리거와 중복 동작) |
| `update_post_like_count()` | 위 트리거 함수 (파라미터 없는 버전) |
| `update_post_like_count(uuid)` | 미사용 함수 (파라미터 있는 버전) |
| `trigger_update_comment_likes_count` (match_comment_likes) | 비활성 상태(D) |
| `update_comment_likes_count()` | 위 트리거 함수 |
| `assign_default_profile_icon()` | 트리거 연결 없음, 미사용 |

### 현재 남은 트리거 (7개, 전부 활성)

| 테이블 | 트리거 | 함수 | 유지 이유 |
|--------|--------|------|----------|
| `auth.users` | `on_auth_user_created` | `handle_new_user()` | auth 테이블은 트리거만 가능 |
| `auth.users` | `on_email_confirmed` | `handle_email_confirmation()` | auth 테이블은 트리거만 가능 |
| `football_players` | `trigger_update_..._search_vector` | `update_football_players_search_vector()` | 검색 벡터 자동 갱신 (표준 패턴) |
| `football_teams` | `trigger_update_..._search_vector` | `update_football_teams_search_vector()` | 검색 벡터 자동 갱신 (표준 패턴) |
| `football_teams` | `trigger_update_..._updated_at` | `update_football_teams_updated_at()` | service_role만 UPDATE, 안전망 |
| `match_ai_predictions` | `update_..._updated_at` | `update_match_ai_predictions_updated_at()` | service_role만 UPDATE, 안전망 |
| `reports` | `trigger_update_reports_updated_at` | `update_reports_updated_at()` | 관리자만 UPDATE, 안전망 |
