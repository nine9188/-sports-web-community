# ✅ Supabase Edge Functions + pg_cron (현재 방식)

> **2025-12-03 업데이트**: Vercel Cron (일 1회 제한) → Supabase Edge Functions (시간당 실행) 마이그레이션 완료

---

## 🎯 현재 아키텍처

### HOT 알림 시스템 구조

```
Supabase pg_cron (매시간 0분)
    ↓
    ↓ HTTP POST
    ↓
Supabase Edge Function
(check-hot-posts)
    ↓
    ↓ HOT 점수 계산
    ↓ 상위 10위 확인
    ↓
Supabase Database
(notifications 테이블에 삽입)
```

### 주요 구성 요소

| 구성 요소 | 위치 | 설명 |
|---------|-----|-----|
| **Edge Function** | `supabase/functions/check-hot-posts/index.ts` | HOT 점수 계산 및 알림 발송 로직 |
| **pg_cron 설정** | Supabase SQL Editor | 매시간 정각 실행 스케줄 |
| **배포 가이드** | `DEPLOY_EDGE_FUNCTION.md` | 단계별 배포 체크리스트 |
| **마이그레이션 가이드** | `supabase-edge-migration.md` | Vercel → Supabase 전환 가이드 |

---

## 🚀 빠른 시작

### 1. Supabase CLI 설치

```bash
npm install -g supabase
```

### 2. 프로젝트 연결

```bash
cd ~/Desktop/web2
supabase link --project-ref YOUR_PROJECT_REF
```

### 3. Edge Function 배포

```bash
supabase functions deploy check-hot-posts
```

### 4. pg_cron 설정

Supabase Dashboard → SQL Editor에서 실행:

```sql
-- Service Role Key 저장
ALTER DATABASE postgres
SET app.settings.service_role_key TO 'YOUR_SERVICE_ROLE_KEY';

-- pg_cron 활성화
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 매시간 실행 스케줄 등록
SELECT cron.schedule(
  'check-hot-posts-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
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

---

## 📊 Vercel Cron과 비교

| 항목 | Vercel Cron (이전) | Supabase Edge Function (현재) |
|------|------------------|---------------------------|
| **실행 주기** | 하루 1회 (Hobby 플랜) | 시간당 1회 (무료) ✅ |
| **배포 방법** | Vercel 자동 배포 | Supabase CLI |
| **코드 위치** | `src/app/api/cron/` | `supabase/functions/` |
| **크론 설정** | `vercel.json` | SQL (pg_cron) |
| **실행 환경** | Vercel Serverless | Supabase Edge (Deno) |
| **비용** | 무료 (제한적) | 무료 (500K 호출/월) ✅ |
| **DB 접근** | Supabase 클라이언트 | 네이티브 SQL 접근 ✅ |

---

## 📚 상세 문서

- ✅ **[Supabase Edge Function 마이그레이션 가이드](./supabase-edge-migration.md)** - 전체 마이그레이션 과정
- ✅ **[배포 가이드](../../DEPLOY_EDGE_FUNCTION.md)** - 단계별 배포 체크리스트
- ✅ **[Edge Function README](../../supabase/functions/check-hot-posts/README.md)** - 함수 사용법 및 테스트
- [HOT 점수 계산 알고리즘](./score-calculation.md) - 점수 계산 로직
- [알림 시스템 개요](../notifications/system-overview.md) - 전체 알림 시스템
- [Server Actions 방식 (Deprecated)](./server-action-deployment.md) - 이전 Vercel Cron 방식

---

## 🔧 주요 파일

```
web2/
├── supabase/
│   ├── functions/
│   │   └── check-hot-posts/
│   │       ├── index.ts           # Edge Function 메인 코드
│   │       └── README.md          # 함수 문서
│   └── pg_cron_setup.sql          # pg_cron 설정 SQL 스크립트
│
├── DEPLOY_EDGE_FUNCTION.md        # 배포 가이드
│
└── 123/1234/
    └── docs/
        └── hot-system/
            ├── edge-function.md            # 이 문서
            ├── supabase-edge-migration.md  # 마이그레이션 가이드
            ├── server-action-deployment.md # (Deprecated) Vercel Cron
            └── score-calculation.md        # 점수 계산 알고리즘
```

---

**마지막 업데이트**: 2025-12-03
**상태**: ✅ 현재 사용 중 (Active)
**버전**: 3.0.0 (Supabase Edge Functions)
