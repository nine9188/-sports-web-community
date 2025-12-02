# STEP 2 완료: 인증 가드 통합

**작성일**: 2025-11-28
**작업 시간**: 약 1시간
**상태**: ✅ 완료

---

## 📋 작업 개요

### 목표
분산된 인증 가드 함수들(`auth-guard.ts`, `suspension-guard.ts`)을 하나의 통합 가드로 통합

### 성과
- ✅ 새로운 `authGuard()` 함수 생성
- ✅ 인증 + 정지 + 관리자 체크 통합
- ✅ 명확한 타입 정의
- ✅ 프로필 정보 반환

---

## 📁 생성된 파일

### `src/shared/guards/auth.guard.ts` (311줄)

**주요 함수**:
1. **`authGuard(options)`** - 통합 인증 가드 (메인)
2. **`serverAuthGuard(options)`** - 레거시 호환용 (deprecated)

**기능**:
- ✅ 사용자 인증 체크
- ✅ 프로필 정보 조회
- ✅ 정지 상태 자동 체크 및 해제
- ✅ 관리자 권한 체크
- ✅ 무단 접근 로깅

---

## 🎯 주요 개선 사항

### 1. 통합 인터페이스

**Before (기존)**:
```typescript
// auth-guard.ts
const user = await serverAuthGuard({ requireAdmin: true })

// suspension-guard.ts (별도 호출 필요)
const check = await checkSuspensionGuard(user.id)
if (check.isSuspended) {
  return { error: check.message }
}
```

**After (신규)**:
```typescript
// 모든 체크를 한 번에!
const { user, profile } = await authGuard({
  requireAdmin: true,
  checkSuspension: true  // 기본값
})
// profile.is_suspended 자동 체크됨
```

### 2. 명확한 타입 정의

```typescript
export interface AuthGuardOptions {
  redirectTo?: string        // 기본: /signin
  requireAdmin?: boolean     // 기본: false
  checkSuspension?: boolean  // 기본: true
  logUnauthorizedAccess?: boolean  // 기본: true
}

export interface AuthGuardResult {
  user: User
  profile: {
    id: string
    is_admin: boolean
    is_suspended: boolean
    suspended_until: string | null
    suspended_reason: string | null
  }
}
```

### 3. 프로필 정보 반환

기존에는 User만 반환했지만, 이제는 프로필 정보도 함께 반환:
```typescript
const { user, profile } = await authGuard()

// 바로 사용 가능
if (profile.is_admin) {
  // 관리자 전용 로직
}
```

### 4. 자동 정지 해제

정지 기간이 만료된 경우 자동으로 해제:
```typescript
// suspended_until이 현재 시간보다 이전이면
// 자동으로 is_suspended = false 업데이트
```

---

## 📊 기능 비교

| 기능 | 기존 | 신규 |
|------|------|------|
| 인증 체크 | ✅ `auth-guard.ts` | ✅ `authGuard()` |
| 정지 체크 | ✅ `suspension-guard.ts` (별도) | ✅ `authGuard()` (통합) |
| 관리자 체크 | ✅ `auth-guard.ts` | ✅ `authGuard()` |
| 프로필 반환 | ❌ | ✅ |
| 자동 정지 해제 | ✅ | ✅ |
| 로깅 | ✅ | ✅ (개선됨) |
| 타입 안전성 | ⚠️ 부분적 | ✅ 완전 |

---

## 🔄 마이그레이션 가이드

### 기본 사용

**Before**:
```typescript
import { serverAuthGuard } from '@/shared/utils/auth-guard'
import { checkSuspensionGuard } from '@/shared/utils/suspension-guard'

const user = await serverAuthGuard()
const check = await checkSuspensionGuard(user.id)
if (check.isSuspended) {
  return { error: check.message }
}
```

**After**:
```typescript
import { authGuard } from '@/shared/guards/auth.guard'

const { user, profile } = await authGuard()
// 정지 체크 자동 완료 (정지된 경우 redirect됨)
```

### 관리자 페이지

**Before**:
```typescript
const user = await serverAuthGuard({ requireAdmin: true })
```

**After**:
```typescript
const { user, profile } = await authGuard({ requireAdmin: true })
// 똑같이 작동!
```

### 정지 체크 생략

```typescript
// 정지 체크를 하지 않고 인증만 확인
const { user } = await authGuard({ checkSuspension: false })
```

---

## ⚠️ 주의사항

### 1. 레거시 코드 호환성

기존 `serverAuthGuard()`를 사용하는 코드는 계속 작동합니다:
```typescript
// 이전 방식도 여전히 작동 (deprecated)
const user = await serverAuthGuard()
```

하지만 새 코드에서는 `authGuard()`를 사용하세요.

### 2. 리다이렉트 동작

`authGuard()`는 인증 실패 시 Next.js `redirect()`를 사용합니다:
- 인증 실패 → `/signin`으로 리다이렉트
- 관리자 아님 → `/`로 리다이렉트
- 정지된 사용자 → `/?suspended=true`로 리다이렉트

### 3. 에러 처리

`redirect()`는 Next.js에서 에러를 던지므로, try-catch로 잡지 마세요:
```typescript
// ❌ 잘못된 사용
try {
  const { user } = await authGuard()
} catch (error) {
  // redirect error도 여기서 잡힙니다!
}

// ✅ 올바른 사용
const { user } = await authGuard()
// 인증 실패 시 자동 리다이렉트됨
```

---

## 📁 파일 위치

### 새 파일
- **통합 가드**: `src/shared/guards/auth.guard.ts` (311줄)

### 기존 파일 (유지됨)
- `src/shared/utils/auth-guard.ts` (118줄) - 레거시 호환용
- `src/shared/utils/suspension-guard.ts` (111줄) - 레거시 호환용

**참고**: 기존 파일은 **삭제하지 않음** (호환성 유지)

---

## 🚀 다음 단계

### STEP 3에서 실제 적용

STEP 2는 **가드 함수 생성**까지만 완료했습니다.
실제로 기존 코드를 새 가드로 교체하는 작업은 **STEP 3 (Auth Action 정리)**에서 진행합니다.

**이유**:
- 각 action마다 로직이 다름
- 일괄 교체보다 리팩토링하면서 교체가 효율적
- 테스트와 검증이 필요

### 적용 대상 파일 (9개)

STEP 3에서 다음 파일들을 리팩토링하면서 새 가드 적용:
1. `domains/boards/actions/posts/create.ts`
2. `domains/boards/actions/posts/update.ts`
3. `domains/boards/actions/posts/likes.ts`
4. `domains/boards/actions/comments/create.ts`
5. `domains/boards/actions/comments/update.ts`
6. `domains/shop/actions/actions.ts`
7. `app/admin/shop/page.tsx`
8. `app/settings/my-comments/page.tsx`
9. `app/settings/profile/page.tsx`

---

## ✅ 체크리스트

- [x] `authGuard()` 함수 생성
- [x] 타입 정의 완료
- [x] 정지 체크 통합
- [x] 관리자 체크 통합
- [x] 프로필 정보 반환
- [x] 로깅 기능 유지
- [x] 레거시 호환성 확보
- [ ] 실제 코드에 적용 (STEP 3에서 진행)
- [ ] 테스트 (STEP 6에서 진행)

---

## 💡 핵심 가치

### Before (분산)
- 인증: `auth-guard.ts`
- 정지: `suspension-guard.ts`
- 별도 호출 필요
- 타입 안전성 부족

### After (통합)
- 모든 체크: `auth.guard.ts` 하나로
- 한 번 호출로 완료
- 완전한 타입 안전성
- 프로필 정보 포함

**결과**: 코드 간결성 ↑, 유지보수성 ↑, 안정성 ↑
