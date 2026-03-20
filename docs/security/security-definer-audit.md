# Security Definer 함수 보안 감사 보고서

> 작성일: 2026-03-19
> 상태: 수정 대기

## 요약

public schema에 **46개의 Security Definer 함수**가 존재하며, **전부 `anon`(비로그인)과 `authenticated` 모두에게 EXECUTE 권한이 부여**되어 있습니다.

Security Definer 함수는 호출자의 권한이 아닌 **함수 생성자(postgres)의 권한으로 실행**되므로 RLS를 완전히 우회합니다. `anon` 사용자가 API를 통해 직접 호출할 수 있으면 인증 없이 데이터 삭제/수정이 가능합니다.

---

## 위험도별 분류

### 심각 (CRITICAL) - 코드에서 미사용, anon 호출 가능

아래 함수들은 **코드에서 `.rpc()`로 호출하지 않지만**, Supabase REST API(`/rest/v1/rpc/함수명`)로 누구나 직접 호출 가능합니다.

| 함수 | 위험 내용 | 코드 호출 |
|------|----------|----------|
| `delete_user_data(user_uuid)` | 아무 사용자의 게시글/댓글/좋아요 전체 삭제 | 없음 |
| `delete_user_posts(user_uuid)` | 아무 사용자의 게시글 전체 삭제 | 없음 |
| `delete_current_user()` | 현재 사용자 계정 삭제 (auth.users 포함) | 없음 |
| `create_youtube_channels_table()` | DDL - 테이블 생성 | 없음 |
| `update_profile_directly(user_id, ...)` | 아무 프로필의 username/email/nickname 수정 | 없음 |
| `get_cron_jobs()` | cron 작업 목록 노출 | 없음 |
| `cleanup_old_logs(days)` | application_logs 삭제 | 없음 |
| `cleanup_expired_predictions()` | match_ai_predictions 삭제 | 없음 |
| `delete_expired_verification_codes()` | verification_codes 삭제 | 없음 |

**조치**: `anon`과 `authenticated` EXECUTE 권한 제거. 서버에서만 `service_role`로 호출.

---

### 높음 (HIGH) - 내부 admin 체크 있지만 anon 호출 가능

| 함수 | 내부 체크 | 코드 호출 위치 |
|------|----------|--------------|
| `admin_adjust_exp(admin_id, target_user_id, ...)` | `profiles.is_admin` 체크 | `shared/actions/admin-actions.ts` (서버 액션) |
| `get_auth_users_info()` | `profiles.is_admin` 체크 | 서버 액션 |
| `get_users_with_last_access()` | `profiles.is_admin` 체크 | 서버 액션 |
| `get_application_logs(...)` | 내부 체크 | 서버 액션 |
| `get_application_logs_count(...)` | 내부 체크 | 서버 액션 |
| `get_log_statistics(period)` | 내부 체크 | 서버 액션 |
| `get_user_last_sign_in(user_id)` | `profiles.is_admin` 체크 | 서버 액션 |
| `save_match_prediction(...)` | 없음 | 서버 전용 |

**조치**: `anon` EXECUTE 권한 제거. 내부 admin 체크는 있지만 방어층이 하나뿐이므로 권한도 제한해야 함.

---

### 보통 (MEDIUM) - user_id 파라미터 조작 가능

| 함수 | 위험 | 코드 호출 위치 |
|------|------|--------------|
| `toggle_post_like(post_id, user_id)` | 다른 사용자로 좋아요 조작 | 코드에서 미사용 (서버 액션으로 대체됨) |
| `toggle_post_dislike(post_id, user_id)` | 다른 사용자로 싫어요 조작 | 코드에서 미사용 |
| `purchase_item(user_id, item_id)` | 다른 사용자 포인트로 구매 | `shop/actions/actions.ts` (서버 액션) |
| `purchase_profile_icon(user_id, icon_id)` | 다른 사용자 포인트로 구매 | 코드에서 미사용 |
| `change_profile_icon(user_id, icon_id)` | 다른 사용자 아이콘 변경 | 코드에서 미사용 |
| `increment_referral_count(user_id)` | 아무 사용자 추천수 증가 | `shared/actions/referral-actions.ts` (서버 액션) |
| `update_post_with_board(id, ...)` | auth.uid() 체크 없음 | 코드에서 미사용 |
| `increment_view_count(post_id)` | 조회수 무한 증가 가능 | `boards/actions/getPostDetails.ts` (서버 액션) |
| `increment_prediction_views(fixture_id)` | 조회수 조작 | 코드에서 미사용 |
| `update_match_prediction_stats(match_id)` | 통계 조작 | 코드에서 미사용 |

**조치**: `anon` EXECUTE 제거. 함수 내부에서 `auth.uid()` 검증 추가 권장 (user_id 파라미터 대신 `auth.uid()` 사용).

---

### 낮음 (LOW) - 트리거 함수 (직접 호출 불필요)

| 함수 | 용도 |
|------|------|
| `handle_new_user()` | 회원가입 시 프로필 자동 생성 트리거 |
| `handle_email_confirmation()` | 이메일 확인 트리거 |
| `assign_default_profile_icon()` | 기본 아이콘 할당 트리거 |
| `update_comment_likes_count()` | 댓글 좋아요 수 업데이트 트리거 |
| `update_notice_created_at()` | 공지 시간 업데이트 트리거 |

**조치**: `anon`과 `authenticated` EXECUTE 권한 제거. 트리거는 테이블 이벤트로 자동 실행되므로 직접 호출 권한 불필요.

---

### 안전 (OK) - Security Definer 필요 + 위험 낮음

| 함수 | 용도 | 이유 |
|------|------|------|
| `count_search_posts(...)` | 검색 결과 수 | 공개 데이터, 읽기 전용 |
| `search_posts_by_content(...)` | 게시글 검색 | 공개 데이터, 읽기 전용 |
| `get_match_prediction(fixture_id)` | 경기 예측 조회 | 공개 데이터, 읽기 전용 |
| `get_user_profile_direct(user_id)` | 프로필 조회 | 공개 데이터, 읽기 전용 |
| `is_admin()` | 관리자 여부 확인 | auth.uid() 사용, 읽기 전용 |
| `is_admin_for_notice_board(board_uuid)` | 공지 게시판 관리자 확인 | 읽기 전용 |
| `get_user_last_signin(user_id)` | 마지막 로그인 시간 | auth.users 접근 필요 |
| `update_post_like_count(post_id)` | 좋아요 수 동기화 | 내부 집계 |
| 로깅 함수들 (`log_event`, `log_error`, `log_api_request`, `log_user_action`, `log_system_event`, `insert_application_log`) | 로그 기록 | INSERT 전용 |

**조치**: `anon` EXECUTE는 제거 권장하나, 일부 공개 조회 함수는 유지 가능.

---

## 코드 호출 현황 요약

### 서버 액션에서만 호출 (안전한 패턴)
```
shared/actions/admin-actions.ts  → admin_adjust_exp, admin_adjust_points
shared/actions/referral-actions.ts → increment_referral_count
domains/shop/actions/actions.ts  → purchase_item
domains/boards/actions/getPostDetails.ts → increment_view_count
domains/boards/actions/posts/search.ts → count_search_posts, search_posts_by_content
domains/boards/actions/comments/likes.ts → decrement_comment_count, increment_comment_count
```

### 클라이언트에서 직접 호출: **0건**
이전 작업에서 모든 `.rpc()` 호출을 서버 액션으로 이관 완료.

### 코드에서 미사용 (Supabase에만 존재)
```
delete_user_data, delete_user_posts, delete_current_user,
create_youtube_channels_table, update_profile_directly, get_cron_jobs,
toggle_post_like, toggle_post_dislike, purchase_profile_icon,
change_profile_icon, save_match_prediction, update_post_with_board,
increment_prediction_views, update_match_prediction_stats,
cleanup_old_logs, cleanup_expired_predictions, delete_expired_verification_codes
```

---

## 수정 계획

### Phase 1: anon EXECUTE 권한 제거 (즉시)

모든 Security Definer 함수에서 `anon` 권한 제거:

```sql
REVOKE EXECUTE ON FUNCTION public.함수명 FROM anon;
```

### Phase 2: 미사용 함수 정리 (권장)

코드에서 호출하지 않는 함수 삭제 또는 비활성화:
- `delete_user_data`, `delete_user_posts`, `delete_current_user`
- `create_youtube_channels_table`
- `update_profile_directly`
- `toggle_post_like`, `toggle_post_dislike` (서버 액션으로 대체됨)
- `change_profile_icon`, `purchase_profile_icon` (서버 액션으로 대체됨)

### Phase 3: 함수 내부 보안 강화 (권장)

user_id 파라미터를 받는 함수에서 `auth.uid()` 검증 추가:
```sql
IF user_id != auth.uid() THEN
  RAISE EXCEPTION 'Unauthorized';
END IF;
```

---

## 수정 완료 항목 (2026-03-19)

### Storage
- [x] coachs/leagues/players/teams/venues public INSERT/UPDATE 제거 → service_role 전용
- [x] post-images, post-videos, emoticon-submissions, profile-icons, avatars 파일 크기/MIME 제한 추가
- [x] emoticon-submissions DELETE 정책 추가, profile-icons DELETE 정책 추가

### DB RLS
- [x] comment_bot_config, comment_bot_logs RLS 활성화 + 관리자 정책 추가

### Views
- [x] emoticon_pack_summary, match_support_stats, popular_searches → Security Invoker 전환

### 코드
- [x] 클라이언트 직접 DB 쿼리 11개 파일 → 서버 액션 전환

### Security Definer 함수
- [x] Phase 1: 전체 46개 함수에서 `anon` EXECUTE 권한 제거 (anon 접근 가능: 46 → 0)
- [x] Phase 2: 미사용 위험 함수 16개 삭제 (46 → 30개)
  - 삭제 목록: `delete_user_data`, `delete_user_posts`, `delete_current_user`, `create_youtube_channels_table`, `update_profile_directly`, `get_cron_jobs`, `toggle_post_like`, `toggle_post_dislike`, `purchase_profile_icon`, `change_profile_icon`, `update_post_with_board`, `increment_prediction_views`, `update_match_prediction_stats`, `cleanup_old_logs`, `cleanup_expired_predictions`, `delete_expired_verification_codes`
- [x] Phase 3: user_id 파라미터 함수 내부 보안 강화
  - `purchase_item`: `auth.uid()` 검증 추가 (본인만 구매 가능)
  - `increment_referral_count`: service_role 외 직접 호출 차단
- [x] 트리거 함수 5개: `anon` + `authenticated` EXECUTE 모두 제거
