# HOT Posts Notification - Supabase Edge Function

> **매시간 HOT 게시글을 체크하고 상위 10위 진입 시 알림 발송**

---

## 📋 개요

이 Edge Function은 HOT 게시글 시스템의 핵심 로직을 실행합니다:

1. 최근 7일 게시글 조회
2. HOT 점수 계산 (조회수 × 1 + 좋아요 × 10 + 댓글 × 20) × 시간감쇠
3. 상위 10위 이내 게시글 작성자에게 알림 발송

---

## 🚀 배포 방법

### 1. Supabase CLI 설치

```bash
npm install -g supabase
```

### 2. 프로젝트 연결

```bash
# Supabase 대시보드에서 Project Reference ID 확인
supabase link --project-ref your-project-ref
```

### 3. Edge Function 배포

```bash
# supabase/ 디렉토리에서 실행
cd ~/Desktop/web2/supabase
supabase functions deploy check-hot-posts
```

배포 후 URL:
```
https://your-project-ref.supabase.co/functions/v1/check-hot-posts
```

---

## 🧪 테스트

### 로컬 테스트

```bash
# 로컬 Supabase 시작
supabase start

# Edge Function 로컬 실행
supabase functions serve check-hot-posts

# 별도 터미널에서 호출
curl -X POST http://localhost:54321/functions/v1/check-hot-posts \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

### 프로덕션 테스트

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/check-hot-posts \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

---

## ⏰ pg_cron 설정

Supabase Dashboard → SQL Editor에서 실행:

```sql
-- 1. pg_cron 확장 활성화 (한 번만)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. 매시간 정각에 실행
SELECT cron.schedule(
  'check-hot-posts-hourly',
  '0 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://your-project-ref.supabase.co/functions/v1/check-hot-posts',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    );
  $$
);
```

### Service Role Key 설정

```sql
-- Service Role Key를 설정에 저장
ALTER DATABASE postgres SET app.settings.service_role_key TO 'your-service-role-key';
```

**Service Role Key 확인**: Supabase Dashboard → Settings → API → `service_role` key

### 스케줄 확인

```sql
-- 등록된 Cron 작업 확인
SELECT * FROM cron.job;

-- 실행 로그 확인
SELECT
  jobid,
  jobname,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobname = 'check-hot-posts-hourly'
ORDER BY start_time DESC
LIMIT 10;
```

---

## 📊 응답 형식

### 성공

```json
{
  "success": true,
  "message": "HOT post notifications processed",
  "totalHotPosts": 15,
  "notificationsSent": 3,
  "notificationsFailed": 0,
  "topPosts": [
    {
      "rank": 1,
      "title": "인기 게시글 제목",
      "score": "1234.56"
    }
  ]
}
```

### 실패

```json
{
  "success": false,
  "error": "Error message"
}
```

---

## 🔧 환경 변수

Edge Function에서 자동으로 사용 가능:

- `SUPABASE_URL` - Supabase 프로젝트 URL (자동 주입)
- `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key (자동 주입)

---

## 📈 성능

- **실행 시간**: ~500ms - 2초 (게시글 수에 따라)
- **메모리**: ~50MB
- **비용**: 무료 (500K 호출/월 이내)

---

## 🔐 보안

- Service Role Key 사용 (RLS 우회)
- Authorization 헤더 필수
- HTTPS 통신만 허용

---

## 📝 로그

Supabase Dashboard → Edge Functions → check-hot-posts → Logs에서 확인

로그 예시:
```
[HOT Posts] Starting check...
[HOT Posts] Found 87 posts
[HOT Posts] Calculated scores for 20 posts
[HOT Posts] 5 posts already notified in last 24h
[HOT Posts] 2 notifications to send
[HOT Posts] Notified user for post abc123 (Rank #3)
[HOT Posts] Result: {"success":true,"notificationsSent":2,...}
```

---

## 🐛 트러블슈팅

### 1. Edge Function 호출 실패

**증상**: pg_cron 로그에 오류

**확인**:
```sql
SELECT * FROM cron.job_run_details
WHERE jobname = 'check-hot-posts-hourly'
ORDER BY start_time DESC LIMIT 1;
```

**해결**: Service Role Key 확인

### 2. 알림이 발송되지 않음

**원인**:
- HOT 순위 10위 밖
- 이미 24시간 이내 알림 받음
- 게시글이 7일 이상 경과

**확인**: Edge Function 로그에서 `notificationsToSend` 확인

### 3. Service Role Key 오류

**증상**: `Invalid API key`

**해결**:
```sql
-- Service Role Key 재설정
ALTER DATABASE postgres
SET app.settings.service_role_key TO 'your-correct-service-role-key';
```

---

## 📚 관련 문서

- [Supabase Edge Function 마이그레이션 가이드](../../123/1234/docs/hot-system/supabase-edge-migration.md)
- [HOT 점수 계산 알고리즘](../../123/1234/docs/hot-system/score-calculation.md)
- [알림 시스템 개요](../../123/1234/docs/notifications/system-overview.md)

---

**작성일**: 2025-12-03
**버전**: 1.0.0
**런타임**: Deno
**Supabase Functions 버전**: v1
