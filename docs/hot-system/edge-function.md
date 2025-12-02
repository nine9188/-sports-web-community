# ⚠️ 이 문서는 더 이상 사용되지 않습니다

이전에는 **Supabase Edge Functions**를 사용했지만, 현재는 **Next.js Server Actions**로 변경되었습니다.

---

## ✅ 새로운 배포 방식

**[Server Actions 배포 가이드](./server-action-deployment.md)**를 참고하세요!

### 주요 변경 사항

| 항목 | 이전 (Edge Functions) | 현재 (Server Actions) |
|------|----------------------|----------------------|
| **코드 위치** | `supabase/functions/check-hot-posts/` | `src/domains/notifications/actions/checkHotPosts.ts` |
| **API 엔드포인트** | `supabase functions deploy` | `src/app/api/cron/check-hot-posts/route.ts` |
| **배포 방법** | Supabase CLI | Vercel 자동 배포 |
| **크론 설정** | pg_cron 수동 설정 | `vercel.json` 파일 |
| **실행 주기** | Supabase Cron | Vercel Cron Jobs |

---

## 🚀 빠른 마이그레이션

### 1. 기존 Edge Function 제거 (이미 완료)

```bash
# 더 이상 필요 없음
rm -rf supabase/functions/check-hot-posts
```

### 2. 새로운 Server Action 사용

코드 위치:
- **Server Action**: `src/domains/notifications/actions/checkHotPosts.ts`
- **API Route**: `src/app/api/cron/check-hot-posts/route.ts`
- **Cron 설정**: `vercel.json`

### 3. 배포

```bash
# Vercel에 배포
vercel --prod

# 자동으로 Cron Job 활성화됨!
```

---

## 📚 관련 문서

- ✅ **[Server Actions 배포 가이드 (최신)](./server-action-deployment.md)**
- [HOT 점수 계산 알고리즘](./score-calculation.md)
- [알림 시스템 개요](../notifications/system-overview.md)
- [테스트 가이드](../guides/testing-hot-notifications.md)

---

**마지막 업데이트**: 2025-12-03
**상태**: ❌ 더 이상 사용 안 함 (Deprecated)
