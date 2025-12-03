-- ================================================================
-- HOT 게시글 알림 시스템 - pg_cron 설정
-- ================================================================
--
-- 이 SQL 파일을 Supabase Dashboard → SQL Editor에서 실행하세요.
--
-- 실행 전 준비사항:
-- 1. Supabase Dashboard → Settings → API에서 Service Role Key 복사
-- 2. Supabase Dashboard → Settings → General에서 Project Reference ID 확인
-- 3. Edge Function 배포 완료 확인
--
-- ================================================================

-- ================================================================
-- Step 1: Service Role Key 저장
-- ================================================================
-- ⚠️ YOUR_SERVICE_ROLE_KEY를 실제 Service Role Key로 교체하세요!
--
ALTER DATABASE postgres
SET app.settings.service_role_key TO 'YOUR_SERVICE_ROLE_KEY';

-- 설정 확인 (비밀키가 저장되었는지 확인)
SELECT current_setting('app.settings.service_role_key') AS service_role_key_status;

-- ================================================================
-- Step 2: pg_cron 확장 활성화
-- ================================================================
-- 한 번만 실행하면 됩니다.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 확장 설치 확인
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- ================================================================
-- Step 3: 기존 Cron 작업 제거 (있다면)
-- ================================================================
-- 이전에 테스트로 등록한 작업이 있다면 제거
SELECT cron.unschedule('check-hot-posts-hourly');

-- ================================================================
-- Step 4: Cron 작업 등록
-- ================================================================
-- ⚠️ YOUR_PROJECT_REF를 실제 프로젝트 ID로 교체하세요!
--
-- 스케줄: 매시간 정각 (0분)
--
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

-- ================================================================
-- Step 5: 등록 확인
-- ================================================================
-- 등록된 Cron 작업 확인
SELECT
  jobid,
  jobname,
  schedule,
  command,
  active,
  nodename,
  nodeport,
  database,
  username
FROM cron.job
WHERE jobname = 'check-hot-posts-hourly';

-- ================================================================
-- Step 6: 즉시 실행 테스트
-- ================================================================
-- 다음 정각까지 기다리지 않고 즉시 실행해서 테스트
SELECT cron.run_job('check-hot-posts-hourly');

-- ================================================================
-- Step 7: 실행 로그 확인
-- ================================================================
-- 최근 10개 실행 로그 확인
SELECT
  jobid,
  jobname,
  runid,
  status,
  return_message,
  start_time,
  end_time,
  (end_time - start_time) AS duration
FROM cron.job_run_details
WHERE jobname = 'check-hot-posts-hourly'
ORDER BY start_time DESC
LIMIT 10;

-- ================================================================
-- 유용한 관리 쿼리
-- ================================================================

-- 모든 Cron 작업 보기
-- SELECT * FROM cron.job;

-- 특정 작업 비활성화
-- UPDATE cron.job SET active = false WHERE jobname = 'check-hot-posts-hourly';

-- 특정 작업 활성화
-- UPDATE cron.job SET active = true WHERE jobname = 'check-hot-posts-hourly';

-- 특정 작업 삭제
-- SELECT cron.unschedule('check-hot-posts-hourly');

-- 최근 24시간 실행 통계
-- SELECT
--   COUNT(*) as total_runs,
--   COUNT(*) FILTER (WHERE status = 'succeeded') as successful,
--   COUNT(*) FILTER (WHERE status = 'failed') as failed,
--   AVG(EXTRACT(EPOCH FROM (end_time - start_time))) as avg_duration_seconds
-- FROM cron.job_run_details
-- WHERE jobname = 'check-hot-posts-hourly'
--   AND start_time >= NOW() - INTERVAL '24 hours';

-- ================================================================
-- 알림 발송 확인
-- ================================================================
-- 최근 24시간 HOT 알림 발송 수 확인
SELECT
  COUNT(*) as hot_notifications,
  COUNT(DISTINCT user_id) as unique_users,
  MIN(created_at) as first_notification,
  MAX(created_at) as last_notification
FROM notifications
WHERE type = 'hot_post'
  AND created_at >= NOW() - INTERVAL '24 hours';

-- 최근 HOT 알림 상세 내역
SELECT
  n.id,
  n.user_id,
  n.title,
  n.message,
  n.created_at,
  n.is_read,
  n.metadata->>'hot_rank' as hot_rank,
  n.metadata->>'hot_score' as hot_score,
  n.metadata->>'post_title' as post_title
FROM notifications n
WHERE n.type = 'hot_post'
ORDER BY n.created_at DESC
LIMIT 20;

-- ================================================================
-- 완료!
-- ================================================================
--
-- ✅ 설정이 완료되었습니다!
--
-- 다음 확인사항:
-- 1. cron.job 테이블에서 작업 등록 확인
-- 2. cron.run_job()로 즉시 실행 테스트
-- 3. cron.job_run_details에서 실행 로그 확인
-- 4. notifications 테이블에서 알림 발송 확인
-- 5. Supabase Dashboard → Edge Functions → Logs에서 실행 로그 확인
--
-- 문제가 있다면:
-- - Service Role Key가 올바른지 확인
-- - Edge Function URL이 올바른지 확인
-- - Edge Function이 배포되었는지 확인
-- - cron.job_run_details의 return_message 확인
--
-- ================================================================
