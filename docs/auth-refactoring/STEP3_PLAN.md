# STEP 3 계획: Auth Action 정리

**작성일**: 2025-11-28
**예상 소요**: 2-3일
**상태**: 📋 계획 수립 중

---

## 📋 현재 상황 분석

### 기존 파일 구조
```
domains/auth/
├── actions.ts          # 660줄, 16개 함수
├── actions-custom.ts   # 231줄, 5개 함수
└── components/
    └── KakaoLoginButton.tsx
```

### 문제점
1. **파일이 너무 큼**: `actions.ts` 660줄
2. **명확하지 않은 분리**: `actions.ts` vs `actions-custom.ts`
3. **authGuard 미적용**: 수동으로 인증 체크
4. **일관성 없는 에러 처리**: 각 함수마다 다른 방식
5. **로깅 로직 중복**: 비슷한 로깅 코드 반복

---

## 🎯 목표

### 1. 명확한 기능별 분리
- 로그인/로그아웃
- 회원가입
- 비밀번호 관리
- 프로필 관리
- 소셜 로그인
- 계정 복구

### 2. authGuard 통합
- 수동 인증 체크 제거
- `authGuard()` 사용

### 3. 일관된 에러 처리
- 표준화된 응답 형식
- 명확한 에러 메시지

### 4. 코드 중복 제거
- 공통 유틸리티 함수
- 재사용 가능한 헬퍼

---

## 📁 새로운 구조 (제안)

```
domains/auth/
├── actions/
│   ├── index.ts              # 통합 export
│   ├── auth.ts               # 로그인/로그아웃 (핵심)
│   ├── signup.ts             # 회원가입
│   ├── password.ts           # 비밀번호 관리
│   ├── profile.ts            # 프로필 관리
│   ├── social.ts             # 소셜 로그인 (카카오 등)
│   ├── recovery.ts           # 계정 복구 (아이디/비밀번호 찾기)
│   └── utils/
│       ├── login-attempts.ts # 로그인 시도 제한
│       ├── validation.ts     # 입력 검증
│       └── response.ts       # 표준 응답 형식
├── types/
│   └── index.ts              # 공통 타입 정의
└── components/
    └── KakaoLoginButton.tsx
```

---

## 📊 함수 분류

### 1. auth.ts (로그인/로그아웃)
- `signIn(username, password)` ← `actions.ts:12`
- `signInAndRedirect(email, password, redirectTo)` ← `actions.ts:504`
- `signOut()` ← `actions.ts:275`
- `signOutAndRedirect(redirectTo)` ← `actions.ts:517`
- `getCurrentUser()` ← `actions.ts:309`
- `refreshSession(refreshToken)` ← `actions.ts:370`

### 2. signup.ts (회원가입)
- `signUp(email, password, metadata, turnstileToken)` ← `actions.ts:209`
- `checkUsernameAvailability(username)` ← `actions.ts:530`
- `checkNicknameAvailability(nickname)` ← `actions.ts:567`
- `resendConfirmation(email)` ← `actions.ts:442`

### 3. password.ts (비밀번호 관리)
- `resetPassword(email)` ← `actions.ts:400`
- `updatePassword(password)` ← `actions.ts:421`
- `sendPasswordResetLink(username)` ← `actions-custom.ts:120`
- `validateResetToken(token)` ← `actions-custom.ts:164`
- `resetPasswordWithToken(token, newPassword)` ← `actions-custom.ts:185`

### 4. profile.ts (프로필 관리)
- `updateUserData(userId, metadata)` ← `actions.ts:339`
- `updateSocialUserProfile(userId, profileData)` ← `actions.ts:634`

### 5. social.ts (소셜 로그인)
- `signInWithKakao(redirectTo)` ← `actions.ts:604`

### 6. recovery.ts (계정 복구)
- `findUsername(email, verificationCode)` ← `actions.ts:464`
- `sendIdRecoveryCode(email, fullName)` ← `actions-custom.ts:17`
- `findUsernameWithCode(email, code)` ← `actions-custom.ts:61`

---

## 🔧 공통 유틸리티

### utils/login-attempts.ts
```typescript
// 기존 actions.ts의 헬퍼 함수들
- recordLoginAttempt()
- checkLoginBlock()
- clearLoginAttempts()
```

### utils/validation.ts
```typescript
- validateEmail(email: string)
- validatePassword(password: string)
- validateUsername(username: string)
```

### utils/response.ts
```typescript
export interface AuthResponse<T = void> {
  success: boolean
  data?: T
  error?: string
}

export function successResponse<T>(data?: T): AuthResponse<T>
export function errorResponse(message: string): AuthResponse
```

---

## 🎨 표준 응답 형식

### Before (일관성 없음)
```typescript
// 방식 1
return { error: '에러 메시지' }

// 방식 2
return { success: false, error: '에러 메시지' }

// 방식 3
throw new Error('에러 메시지')
```

### After (통일)
```typescript
// 성공
return { success: true, data: { user } }

// 실패
return { success: false, error: '명확한 에러 메시지' }
```

---

## 🔄 리팩토링 예시

### Before (auth.ts signIn 함수)
```typescript
export async function signIn(username: string, password: string) {
  try {
    const supabase = await getSupabaseAction()

    // 수동으로 프로필 조회
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', username)
      .single()

    if (!profile?.email) {
      return { error: '아이디 또는 비밀번호가 올바르지 않습니다.' }
    }

    // 로그인 시도 제한 체크
    const blockData = await checkLoginBlock(username)
    // ... 100줄 이상의 로직
  } catch (error) {
    // ...
  }
}
```

### After (간소화 + authGuard)
```typescript
import { authGuard } from '@/shared/guards/auth.guard'
import { checkLoginAttempts, recordAttempt } from './utils/login-attempts'
import { successResponse, errorResponse } from './utils/response'

export async function signIn(
  username: string,
  password: string
): Promise<AuthResponse<{ user: User }>> {
  try {
    // 1. 입력 검증
    if (!username || !password) {
      return errorResponse('아이디와 비밀번호를 입력해주세요.')
    }

    // 2. 로그인 시도 제한 체크
    const blockCheck = await checkLoginAttempts(username)
    if (blockCheck.isBlocked) {
      return errorResponse(blockCheck.message)
    }

    // 3. 아이디로 이메일 조회
    const supabase = await getSupabaseAction()
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', username)
      .single()

    if (!profile?.email) {
      await recordAttempt(username, 'invalid_username')
      return errorResponse('아이디 또는 비밀번호가 올바르지 않습니다.')
    }

    // 4. 로그인 시도
    const { data, error } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password,
    })

    if (error || !data.user) {
      await recordAttempt(username, 'invalid_password')
      return errorResponse('아이디 또는 비밀번호가 올바르지 않습니다.')
    }

    // 5. 성공 처리
    await clearAttempts(username)
    await logAuthEvent('LOGIN_SUCCESS', `로그인 성공: ${username}`, data.user.id)

    return successResponse({ user: data.user })

  } catch (error) {
    console.error('로그인 오류:', error)
    return errorResponse('로그인 중 오류가 발생했습니다.')
  }
}
```

**개선점**:
- ✅ 명확한 단계 구분 (1-5)
- ✅ 표준화된 응답 형식
- ✅ 유틸리티 함수로 중복 제거
- ✅ 간결한 에러 처리

---

## 📈 단계별 실행 계획

### Phase 1: 준비 (0.5일)
- [x] 현재 구조 분석
- [ ] 새 구조 생성 (`domains/auth/actions/` 폴더)
- [ ] 유틸리티 함수 작성 (`utils/`)
- [ ] 타입 정의 (`types/`)

### Phase 2: 핵심 기능 (1일)
- [ ] `auth.ts` 작성 (로그인/로그아웃)
- [ ] `signup.ts` 작성 (회원가입)
- [ ] `password.ts` 작성 (비밀번호)
- [ ] 테스트

### Phase 3: 부가 기능 (0.5일)
- [ ] `profile.ts` 작성
- [ ] `social.ts` 작성
- [ ] `recovery.ts` 작성

### Phase 4: 통합 및 검증 (1일)
- [ ] `index.ts` export 정리
- [ ] 기존 코드 사용처 업데이트
- [ ] 기존 파일 백업 및 삭제
- [ ] 전체 테스트

---

## ⚠️ 주의사항

### 1. 호환성 유지
기존 코드를 사용하는 곳이 많으므로, 한 번에 전부 바꾸지 말고 단계적으로:
1. 새 함수 작성
2. 테스트
3. 기존 코드 점진적 마이그레이션

### 2. 로깅 보존
보안 로그, 인증 로그는 매우 중요하므로 반드시 유지

### 3. 에러 메시지
사용자에게 보여지는 메시지 변경 시 주의

---

## 🎯 성공 기준

- [x] 함수별 책임 명확
- [ ] 파일당 200줄 이하
- [ ] authGuard 사용
- [ ] 표준화된 응답 형식
- [ ] 테스트 통과
- [ ] 기존 기능 모두 작동

---

## 💬 다음 단계

1. **승인 후 Phase 1 시작**
   - 유틸리티 함수 작성
   - 타입 정의

2. **우선순위 결정**
   - 어떤 파일부터 리팩토링할지
   - auth.ts (로그인/로그아웃)부터 시작 추천

3. **점진적 마이그레이션**
   - 한 번에 하나씩
   - 테스트 후 다음 단계
