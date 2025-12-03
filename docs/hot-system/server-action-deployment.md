# ⚠️ HOT 알림 시스템 배포 가이드 (Server Actions) - Deprecated

> **2025-12-03 업데이트**: 이 방식은 더 이상 사용되지 않습니다. Vercel Hobby 플랜의 일 1회 실행 제한으로 인해 **Supabase Edge Functions + pg_cron**으로 마이그레이션되었습니다.
>
> **새로운 가이드**: [Supabase Edge Function 마이그레이션 가이드](./supabase-edge-migration.md)

---

## 📋 이전 방식 (참고용)

HOT 게시글 알림 시스템은 **Next.js Server Actions**와 **Vercel Cron Jobs**를 사용했습니다.

---

## 🎯 시스템 구조

```
src/
├── domains/notifications/actions/
│   └── checkHotPosts.ts              # Server Action (핵심 로직)
│
└── app/api/cron/check-hot-posts/
    └── route.ts                       # Cron Job API Route

vercel.json                            # Cron 스케줄 설정
```

---

## 📋 설정 방법

### 1. 환경 변수 설정

`.env.local`에 Cron Secret 추가:

```bash
# Cron Job Secret (보안용)
CRON_SECRET=your-super-secret-key-here
```

**Vercel 프로젝트 설정**에도 동일하게 추가:
1. Vercel Dashboard → 프로젝트 선택
2. Settings → Environment Variables
3. `CRON_SECRET` 추가 (Production, Preview, Development 모두)

---

### 2. Vercel Cron 설정 확인

`vercel.json` 파일에 이미 설정되어 있습니다:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-hot-posts",
      "schedule": "0 * * * *"
    }
  ]
}
```

**스케줄**: `0 * * * *` = 매 시간 정각에 실행

---

### 3. 배포

```bash
# Vercel에 배포
vercel --prod

# 또는 Git push (자동 배포 설정된 경우)
git push origin main
```

배포 후 Vercel Dashboard에서 Cron Jobs가 활성화됩니다.

---

## 🧪 테스트

### 로컬 테스트

```bash
# 개발 서버 실행
npm run dev

# 별도 터미널에서 API 호출
curl http://localhost:3000/api/cron/check-hot-posts \
  -H "Authorization: Bearer your-super-secret-key-here"
```

### 프로덕션 수동 실행

```bash
curl https://your-domain.vercel.app/api/cron/check-hot-posts \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 📊 응답 형식

성공 시:

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

실패 시:

```json
{
  "success": false,
  "error": "Error message here"
}
```

---

## 🔧 Cron 스케줄 변경

`vercel.json`에서 스케줄 수정:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-hot-posts",
      "schedule": "0 */2 * * *"  // 2시간마다
    }
  ]
}
```

**Cron 표현식**:
- `0 * * * *` - 매 시간 (권장)
- `0 */2 * * *` - 2시간마다
- `0 0 * * *` - 매일 자정
- `0 9,21 * * *` - 매일 9시, 21시

변경 후 재배포 필요!

---

## 🔐 보안

1. **CRON_SECRET**: 반드시 강력한 비밀키 사용
2. **Authorization Header**: 모든 요청에 필수
3. **Vercel Only**: Vercel 환경에서만 작동 (외부 접근 불가)

---

## 📚 관련 문서

- [HOT 점수 계산 알고리즘](./score-calculation.md)
- [알림 시스템 개요](../notifications/system-overview.md)
- [테스트 가이드](../guides/testing-hot-notifications.md)

---

## 🆚 방식 비교

| 항목 | Edge Functions (이전) | Server Actions (이 방식) | Supabase Edge + pg_cron (현재) |
|------|---------------------|---------------------|----------------------------|
| 배포 | Supabase CLI 필요 | Vercel 자동 배포 ✅ | Supabase CLI 필요 |
| 크론 설정 | pg_cron 수동 설정 | vercel.json 한 줄 ✅ | pg_cron 수동 설정 |
| 코드 위치 | supabase/functions/ | src/domains/notifications/ ✅ | supabase/functions/ |
| 테스트 | Supabase 환경 필요 | 로컬에서 바로 가능 ✅ | Supabase 환경 필요 |
| 유지보수 | 별도 관리 | 프로젝트 코드와 통합 ✅ | 별도 관리 |
| **실행 주기** | 시간당 가능 ✅ | **일 1회만** ❌ | **시간당 가능** ✅ |

**Vercel Hobby 플랜의 크론 제한으로 인해 Supabase로 재마이그레이션되었습니다.**

---

## 🔄 Supabase로 마이그레이션

현재 HOT 알림은 **시간당 실행**이 필요하므로 Supabase Edge Functions를 사용합니다.

마이그레이션 가이드: [Supabase Edge Function 마이그레이션 가이드](./supabase-edge-migration.md)

---

**작성일**: 2025-12-03
**최종 업데이트**: 2025-12-03
**버전**: 2.0.0 (Server Actions - Deprecated)
**상태**: ❌ 더 이상 사용 안 함
