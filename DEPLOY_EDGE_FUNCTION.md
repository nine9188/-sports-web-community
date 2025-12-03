# 🚀 HOT 알림 Edge Function 배포 가이드

> **Supabase Edge Function + pg_cron 설정 완전 가이드**

---

## 📋 사전 준비

### 1. Supabase CLI 설치

```bash
npm install -g supabase
```

### 2. Supabase 프로젝트 정보 확인

Supabase Dashboard에서 확인:
- **Project Reference ID**: Settings → General → Reference ID
- **Service Role Key**: Settings → API → `service_role` secret key

---

## 🎯 Step 1: Supabase 프로젝트 연결

```bash
# web2 폴더로 이동
cd ~/Desktop/web2

# Supabase 프로젝트 연결
supabase link --project-ref YOUR_PROJECT_REF

# Access Token 입력 요청 시:
# Supabase Dashboard → Account → Access Tokens에서 생성
```

---

## 🚀 Step 2: Edge Function 배포

```bash
# Edge Function 배포
supabase functions deploy check-hot-posts

# 배포 성공 시 출력:
# Deployed Function check-hot-posts on project YOUR_PROJECT_REF
# URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-hot-posts
```

---

## 🧪 Step 3: 배포 테스트

### 방법 1: curl 사용

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-hot-posts \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

### 방법 2: Supabase Dashboard

1. Dashboard → Edge Functions → check-hot-posts
2. "Invoke Function" 버튼 클릭
3. 결과 확인

---

## ⏰ Step 4: pg_cron 설정

### 4-1. Service Role Key 설정

Supabase Dashboard → SQL Editor에서 실행:

```sql
-- Service Role Key를 데이터베이스 설정에 저장
ALTER DATABASE postgres
SET app.settings.service_role_key TO 'YOUR_SERVICE_ROLE_KEY';

-- 설정 확인
SELECT current_setting('app.settings.service_role_key');
```

**중요**: `YOUR_SERVICE_ROLE_KEY`를 실제 Service Role Key로 교체!

### 4-2. pg_cron 확장 활성화

```sql
-- pg_cron 확장 활성화 (한 번만 실행)
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### 4-3. Cron 작업 등록

```sql
-- 매시간 정각에 Edge Function 호출
SELECT cron.schedule(
  'check-hot-posts-hourly',           -- 작업 이름
  '0 * * * *',                         -- 스케줄: 매시간 0분
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-hot-posts',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    );
  $$
);
```

**중요**: `YOUR_PROJECT_REF`를 실제 프로젝트 ID로 교체!

### 4-4. 등록 확인

```sql
-- 등록된 Cron 작업 확인
SELECT
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job;

-- 결과 예시:
-- jobid | jobname                  | schedule    | command         | active
-- ------|--------------------------|-------------|-----------------|-------
-- 1     | check-hot-posts-hourly   | 0 * * * *   | SELECT net.http | t
```

---

## ✅ Step 5: 동작 확인

### 5-1. 수동 실행 테스트

```sql
-- Cron 작업 즉시 실행
SELECT cron.run_job('check-hot-posts-hourly');
```

### 5-2. 실행 로그 확인

```sql
-- 최근 10개 실행 로그
SELECT
  jobid,
  jobname,
  runid,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobname = 'check-hot-posts-hourly'
ORDER BY start_time DESC
LIMIT 10;
```

### 5-3. Edge Function 로그 확인

Supabase Dashboard:
1. Edge Functions 탭 클릭
2. check-hot-posts 선택
3. Logs 탭에서 실시간 로그 확인

로그 예시:
```
[HOT Posts] Starting check...
[HOT Posts] Found 87 posts
[HOT Posts] Calculated scores for 20 posts
[HOT Posts] 2 notifications to send
[HOT Posts] Notified user for post abc123 (Rank #3)
[HOT Posts] Result: {"success":true,"notificationsSent":2}
```

---

## 🔧 Step 6: Vercel Cron 제거 (선택)

기존 Vercel Cron이 작동 중이라면 제거:

```bash
# 123/1234 폴더로 이동
cd ~/Desktop/web2/123/1234

# vercel.json 수정
# "crons": [] 으로 변경 또는 파일 삭제

# Next.js API Route 삭제 (선택)
rm -rf src/app/api/cron/check-hot-posts

# 변경사항 커밋
git add .
git commit -m "chore: Vercel Cron → Supabase Edge Function 마이그레이션"
git push origin main
```

---

## 🐛 트러블슈팅

### 문제 1: "Invalid API key" 오류

**원인**: Service Role Key가 잘못됨

**해결**:
```sql
-- Service Role Key 재설정
ALTER DATABASE postgres
SET app.settings.service_role_key TO 'CORRECT_SERVICE_ROLE_KEY';

-- 확인
SELECT current_setting('app.settings.service_role_key');
```

### 문제 2: Cron 작업이 실행되지 않음

**원인**: pg_cron이 비활성화됨

**확인**:
```sql
SELECT * FROM cron.job WHERE jobname = 'check-hot-posts-hourly';
```

**해결**:
```sql
-- 작업이 비활성화되어 있다면
UPDATE cron.job
SET active = true
WHERE jobname = 'check-hot-posts-hourly';
```

### 문제 3: Edge Function이 타임아웃

**원인**: 게시글이 너무 많음

**해결**: `index.ts`의 `limit(100)` 값 조정

### 문제 4: 알림이 발송되지 않음

**확인 사항**:
1. HOT 순위 10위 이내인지
2. 24시간 이내 이미 알림 받지 않았는지
3. 게시글이 7일 이내인지

**로그 확인**:
```sql
SELECT * FROM cron.job_run_details
WHERE jobname = 'check-hot-posts-hourly'
ORDER BY start_time DESC LIMIT 1;
```

---

## 📊 모니터링

### Cron 작업 상태

```sql
-- 최근 24시간 실행 통계
SELECT
  COUNT(*) as total_runs,
  COUNT(*) FILTER (WHERE status = 'succeeded') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed
FROM cron.job_run_details
WHERE jobname = 'check-hot-posts-hourly'
  AND start_time >= NOW() - INTERVAL '24 hours';
```

### 알림 발송 통계

```sql
-- 최근 24시간 HOT 알림 발송 수
SELECT COUNT(*) as hot_notifications
FROM notifications
WHERE type = 'hot_post'
  AND created_at >= NOW() - INTERVAL '24 hours';
```

---

## 🔄 업데이트 방법

Edge Function 코드 수정 후:

```bash
# 1. 코드 수정
# supabase/functions/check-hot-posts/index.ts 편집

# 2. 재배포
cd ~/Desktop/web2
supabase functions deploy check-hot-posts

# 3. 테스트
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-hot-posts \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

## 📝 체크리스트

배포 완료 확인:

- [ ] Supabase CLI 설치 완료
- [ ] 프로젝트 연결 완료 (`supabase link`)
- [ ] Edge Function 배포 완료
- [ ] 배포 테스트 성공
- [ ] Service Role Key 설정 완료
- [ ] pg_cron 확장 활성화 완료
- [ ] Cron 작업 등록 완료
- [ ] 수동 실행 테스트 성공
- [ ] 실행 로그 확인 완료
- [ ] Vercel Cron 제거 완료 (선택)

---

## 📚 관련 문서

- [Supabase Edge Function 마이그레이션 가이드](./docs/hot-system/supabase-edge-migration.md)
- [Edge Function README](../supabase/functions/check-hot-posts/README.md)
- [HOT 점수 계산 알고리즘](./docs/hot-system/score-calculation.md)

---

**작성일**: 2025-12-03
**최종 업데이트**: 2025-12-03
**버전**: 1.0.0
