# ✅ HOT 알림 시스템 마이그레이션 완료

> **Vercel Cron → Supabase Edge Functions + pg_cron**

**완료 시각**: 2025-12-03
**버전**: 3.0.0

---

## 🎉 마이그레이션 완료!

HOT 게시글 알림 시스템이 성공적으로 Supabase Edge Functions로 마이그레이션되었습니다.

### 주요 변경사항

| 항목 | 이전 (Vercel Cron) | 현재 (Supabase) |
|------|-------------------|----------------|
| **실행 주기** | 일 1회 (Hobby 플랜 제한) | **시간당 1회** ✅ |
| **비용** | 무료 (제한적) | 무료 (500K 호출/월) ✅ |
| **크론 설정** | vercel.json | pg_cron (SQL) |
| **함수 위치** | src/app/api/cron/ | supabase/functions/ |
| **런타임** | Node.js | Deno |

---

## 📁 생성된 파일

### 1. Edge Function 구현
- **`supabase/functions/check-hot-posts/index.ts`** (268 lines)
  - HOT 점수 계산 로직
  - 상위 10위 알림 발송
  - 24시간 중복 체크

- **`supabase/functions/check-hot-posts/README.md`**
  - 배포 방법
  - 테스트 가이드
  - 트러블슈팅

### 2. 배포 가이드
- **`DEPLOY_EDGE_FUNCTION.md`** (루트)
  - 단계별 배포 체크리스트
  - Supabase CLI 설정
  - pg_cron 설정 SQL

- **`supabase/pg_cron_setup.sql`**
  - 실행 가능한 SQL 스크립트
  - Service Role Key 설정
  - Cron 작업 등록
  - 모니터링 쿼리

### 3. 문서 업데이트
- **`123/1234/docs/hot-system/edge-function.md`** (업데이트)
  - ✅ 현재 사용 중 (Active)
  - Supabase Edge Functions 문서

- **`123/1234/docs/hot-system/server-action-deployment.md`** (업데이트)
  - ⚠️ Deprecated 표시 추가
  - 새로운 가이드 링크

- **`123/1234/docs/hot-system/supabase-edge-migration.md`** (신규)
  - 완전한 마이그레이션 가이드
  - 아키텍처 비교
  - 성능 분석

### 4. 기존 파일 수정
- **`123/1234/vercel.json`**
  - `"crons": []` (비활성화)

- **`123/1234/src/app/api/cron/check-hot-posts/route.ts`**
  - ⚠️ DEPRECATED 주석 추가
  - 수동 테스트용으로만 유지

---

## 🚀 다음 단계 (배포 필요)

마이그레이션 준비는 완료되었습니다. 이제 실제 배포를 진행하세요:

### Step 1: Supabase CLI 설치

```bash
npm install -g supabase
```

### Step 2: Supabase 프로젝트 연결

```bash
cd ~/Desktop/web2
supabase link --project-ref YOUR_PROJECT_REF
```

**Project Reference ID 확인**: Supabase Dashboard → Settings → General → Reference ID

### Step 3: Edge Function 배포

```bash
supabase functions deploy check-hot-posts
```

배포 성공 시 URL이 표시됩니다:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-hot-posts
```

### Step 4: pg_cron 설정

1. **Supabase Dashboard** 접속
2. **SQL Editor** 탭 클릭
3. **`supabase/pg_cron_setup.sql`** 파일 열기
4. 다음 2개 값 교체:
   - `YOUR_SERVICE_ROLE_KEY` → Settings → API → service_role key
   - `YOUR_PROJECT_REF` → Settings → General → Reference ID
5. 전체 SQL 실행

### Step 5: 테스트

#### 5-1. 즉시 실행

SQL Editor에서:
```sql
SELECT cron.run_job('check-hot-posts-hourly');
```

#### 5-2. 실행 로그 확인

```sql
SELECT * FROM cron.job_run_details
WHERE jobname = 'check-hot-posts-hourly'
ORDER BY start_time DESC LIMIT 5;
```

#### 5-3. Edge Function 로그 확인

Supabase Dashboard → Edge Functions → check-hot-posts → Logs

#### 5-4. 알림 확인

```sql
SELECT * FROM notifications
WHERE type = 'hot_post'
ORDER BY created_at DESC LIMIT 10;
```

### Step 6: Vercel 재배포 (vercel.json 변경 적용)

```bash
cd ~/Desktop/web2/123/1234
./deploy.sh "chore: Vercel Cron 제거, Supabase Edge Function 마이그레이션"
```

---

## 📊 예상 결과

### 실행 주기
- **이전**: 매일 자정 1회 (00:00 UTC)
- **현재**: **매시간 정각** (00:00, 01:00, 02:00, ...)

### HOT 알림 발송
- 최근 7일 게시글 중 HOT 점수 상위 10위
- 24시간 이내 중복 알림 방지
- 시간당 실행으로 더 빠른 알림 전달 ✅

### 성능
- 실행 시간: 500ms ~ 2초
- 메모리: ~50MB
- 비용: 무료 (500K 호출/월 이내)

---

## 📚 참고 문서

### 배포 가이드
- [DEPLOY_EDGE_FUNCTION.md](./DEPLOY_EDGE_FUNCTION.md) - 단계별 배포 체크리스트
- [supabase/pg_cron_setup.sql](./supabase/pg_cron_setup.sql) - 실행 가능한 SQL 스크립트

### 기술 문서
- [Edge Function README](./supabase/functions/check-hot-posts/README.md) - 함수 사용법
- [마이그레이션 가이드](./123/1234/docs/hot-system/supabase-edge-migration.md) - 완전한 마이그레이션 문서
- [HOT 점수 계산](./123/1234/docs/hot-system/score-calculation.md) - 알고리즘 상세

### 아키텍처
- [현재 방식](./123/1234/docs/hot-system/edge-function.md) - Supabase Edge Functions ✅
- [이전 방식](./123/1234/docs/hot-system/server-action-deployment.md) - Vercel Cron (Deprecated)

---

## 🔍 마이그레이션 체크리스트

- [x] Edge Function 코드 작성
- [x] Edge Function README 작성
- [x] pg_cron 설정 SQL 작성
- [x] 배포 가이드 작성
- [x] 마이그레이션 문서 작성
- [x] 기존 문서 업데이트 (Deprecated 표시)
- [x] vercel.json에서 cron 제거
- [x] API Route에 Deprecated 주석 추가
- [ ] **Supabase CLI로 Edge Function 배포**
- [ ] **pg_cron 설정 실행**
- [ ] **배포 테스트 및 로그 확인**
- [ ] **Vercel 재배포 (변경사항 적용)**

---

## 🎯 완료 후 확인사항

배포 후 다음을 확인하세요:

1. **Cron 작업 등록 확인**
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'check-hot-posts-hourly';
   ```

2. **다음 정각에 자동 실행 확인**
   - 매시간 0분에 자동 실행됩니다
   - 로그에서 실행 기록 확인

3. **알림 발송 확인**
   ```sql
   SELECT COUNT(*) FROM notifications
   WHERE type = 'hot_post'
   AND created_at >= NOW() - INTERVAL '24 hours';
   ```

4. **Vercel Cron 비활성화 확인**
   - Vercel Dashboard → Cron Jobs 탭
   - check-hot-posts 작업이 제거되었는지 확인

---

## 💡 트러블슈팅

### 문제: Edge Function 배포 실패
```bash
# Supabase 프로젝트 재연결
supabase link --project-ref YOUR_PROJECT_REF
```

### 문제: pg_cron 작업이 실행되지 않음
```sql
-- 작업 활성화 상태 확인
SELECT * FROM cron.job WHERE jobname = 'check-hot-posts-hourly';

-- 비활성화되어 있다면
UPDATE cron.job SET active = true WHERE jobname = 'check-hot-posts-hourly';
```

### 문제: Service Role Key 오류
```sql
-- Service Role Key 재설정
ALTER DATABASE postgres
SET app.settings.service_role_key TO 'CORRECT_SERVICE_ROLE_KEY';

-- 확인
SELECT current_setting('app.settings.service_role_key');
```

### 문제: 알림이 발송되지 않음
- HOT 순위 10위 이내인지 확인
- 24시간 이내 이미 알림 받지 않았는지 확인
- Edge Function 로그 확인 (Supabase Dashboard)

---

## 🎊 마이그레이션 완료!

모든 준비가 완료되었습니다.

**다음 명령어로 배포를 시작하세요**:

```bash
# 1. Edge Function 배포
cd ~/Desktop/web2
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy check-hot-posts

# 2. pg_cron 설정 (Supabase SQL Editor에서)
# supabase/pg_cron_setup.sql 실행

# 3. Vercel 재배포
cd ~/Desktop/web2/123/1234
./deploy.sh "chore: Migrate to Supabase Edge Functions"
```

---

**작성일**: 2025-12-03
**버전**: 3.0.0
**상태**: ✅ 마이그레이션 준비 완료
