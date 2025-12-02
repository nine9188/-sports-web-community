# HOT 게시글 알림 체크 엣지 함수

이 Supabase Edge Function은 주기적으로 실행되어 HOT 게시글 상위권에 진입한 게시글 작성자에게 알림을 발송합니다.

## 🎯 기능

- 7일 슬라이딩 윈도우 기반 HOT 게시글 계산
- 상위 10위 이내 게시글에 대해 알림 발송
- 중복 알림 방지 (24시간 내 동일 게시글 재알림 방지)
- HOT 점수 계산: `(조회수 × 1) + (좋아요 × 10) + (댓글 × 20) × 시간감쇠`

## 📋 설정 방법

### 1. 엣지 함수 배포

```bash
# Supabase CLI 설치 (아직 안 했다면)
npm install -g supabase

# Supabase 프로젝트에 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref YOUR_PROJECT_REF

# 엣지 함수 배포
supabase functions deploy check-hot-posts
```

### 2. Cron Job 설정 (pg_cron 사용)

Supabase 대시보드에서 SQL Editor를 열고 다음 쿼리를 실행:

```sql
-- pg_cron 확장 설치 (아직 안 했다면)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 매 1시간마다 실행되는 크론잡 생성
SELECT cron.schedule(
  'check-hot-posts-hourly',  -- 크론잡 이름
  '0 * * * *',               -- 매 시간 0분에 실행
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-hot-posts',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
    ) as request_id;
  $$
);
```

### 3. 대체: Supabase Platform Cron (추천)

Supabase Platform에서 제공하는 Cron 기능 사용:

1. Supabase 대시보드 → Database → Cron Jobs
2. "Create a new cron job" 클릭
3. 설정:
   - **Name**: `check-hot-posts-hourly`
   - **Schedule**: `0 * * * *` (매 시간)
   - **Command Type**: HTTP Request
   - **URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-hot-posts`
   - **Method**: POST
   - **Headers**:
     ```json
     {
       "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY",
       "Content-Type": "application/json"
     }
     ```

### 4. 수동 테스트

```bash
# 로컬 테스트
supabase functions serve check-hot-posts

# 별도 터미널에서 호출
curl -X POST http://localhost:54321/functions/v1/check-hot-posts \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# 프로덕션 테스트
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-hot-posts \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

## 📊 응답 예시

```json
{
  "message": "HOT post notifications processed",
  "totalHotPosts": 20,
  "notificationsSent": 5,
  "notificationsFailed": 0,
  "topPosts": [
    {
      "rank": 1,
      "title": "손흥민 결승골! 토트넘 2-1 승리",
      "score": "245.67"
    },
    {
      "rank": 2,
      "title": "김민재 맨유전 활약",
      "score": "198.32"
    }
  ]
}
```

## 🔧 커스터마이징

### 알림 발송 기준 변경

상위 10위 → 상위 5위로 변경하려면 `index.ts`의 다음 부분 수정:

```typescript
// Before
const notificationsToSend: HotPost[] = scoredPosts
  .filter((post) => post.hot_rank <= 10 && !notifiedPostIds.has(post.id))

// After
const notificationsToSend: HotPost[] = scoredPosts
  .filter((post) => post.hot_rank <= 5 && !notifiedPostIds.has(post.id))
```

### 실행 주기 변경

**매 30분마다 실행**:
```
*/30 * * * *
```

**매일 오전 9시 실행**:
```
0 9 * * *
```

**매 6시간마다 실행**:
```
0 */6 * * *
```

## 🐛 트러블슈팅

### 1. 함수가 실행되지 않음

- Supabase Functions 로그 확인: Dashboard → Edge Functions → check-hot-posts → Logs
- Service Role Key가 올바른지 확인
- pg_cron이 활성화되어 있는지 확인

### 2. 알림이 발송되지 않음

- `notifications` 테이블에 'hot_post' 타입이 허용되는지 확인 (CHECK constraint)
- 함수 응답의 `notificationsFailed` 카운트 확인
- 게시글 작성자의 `user_id`가 올바른지 확인

### 3. 중복 알림 발송

- 24시간 내 중복 체크 로직이 올바르게 작동하는지 확인
- `existingNotifications` 쿼리 결과 확인

## 📚 관련 문서

- [HOT 점수 계산 가이드](../../src/domains/sidebar/HOT_SCORE_GUIDE.md)
- [인기글 시스템 문서](../../src/domains/sidebar/SIDEBAR_POPULAR_POSTS.md)
- [알림 시스템 문서](../../src/domains/notifications/NOTIFICATION_SYSTEM.md)
