# 🔄 인증 시스템 단계별 리팩토링 실행 계획

## 📊 현재 파일 현황 분석

### 🗂️ 현재 파일 구조

```
src/
├── shared/
│   ├── api/
│   │   ├── auth.ts                    # 79줄 - 미들웨어용 세션 업데이트
│   │   ├── supabase.ts                # 43줄 - 클라이언트용 (싱글톤)
│   │   └── supabaseServer.ts          # 159줄 - 서버용 (5개 함수)
│   ├── context/
│   │   └── AuthContext.tsx            # 715줄 - 클라이언트 상태 관리
│   ├── utils/
│   │   ├── auth-guard.ts              # 118줄 - 서버 인증 가드
│   │   └── suspension-guard.ts        # ??? - 정지 상태 확인
│   └── actions/
│       └── admin-actions.ts           # 260줄 - 관리자 권한 체크 중복
│
├── domains/
│   ├── auth/
│   │   ├── actions.ts                 # 661줄 - 메인 인증 로직
│   │   ├── actions-custom.ts          # 232줄 - 아이디/비밀번호 찾기
│   │   └── components/
│   │       └── KakaoLoginButton.tsx   # ??? - 카카오 로그인
│   └── settings/
│       └── actions/auth.ts            # 120줄 - 비밀번호 변경
│
├── app/
│   ├── auth/callback/route.ts         # 84줄 - OAuth 콜백
│   ├── admin/
│   │   ├── layout.tsx                 # 13줄 - 권한 체크 없음!
│   │   └── components/AdminLayoutClient.tsx  # 클라이언트 체크만
│   └── settings/
│       └── profile/page.tsx           # 57줄 - 프로필 페이지
│
└── middleware.ts                       # 141줄 - 라우트 보호
```

---

## 🎯 리팩토링 목표

### ❌ 제거할 것
1. 중복된 Supabase 클라이언트 생성 코드
2. 여기저기 흩어진 권한 체크 로직
3. 불필요하게 복잡한 세션 관리

### ✅ 통합할 것
1. **Supabase 클라이언트**: 5개 → 3개로 통합
2. **인증 로직**: 3곳 → 1곳으로 통합
3. **권한 체크**: 여러 곳 → 통합 가드로

### 🔧 개선할 것
1. 명확한 계층 구조
2. 타입 안전성
3. 에러 처리 일관성

---

## 📅 단계별 실행 계획

---

## 🚀 STEP 1: Supabase 클라이언트 통합 (1-2일)

### 목표
5개의 Supabase 클라이언트 생성 함수를 3개로 통합하고 명확한 네이밍

### 작업 파일

#### ✅ 생성할 파일
```
src/shared/lib/supabase/
├── client.browser.ts       # 브라우저용 (기존 supabase.ts 대체)
├── client.server.ts        # 서버용 (기존 supabaseServer.ts 대체)
├── types.ts                # Supabase 타입 (기존 shared/types/supabase.ts 이동)
└── index.ts                # Public API
```

#### 🔄 수정할 파일
```
수정 필요 (import 경로만):
- src/domains/auth/actions.ts
- src/domains/auth/actions-custom.ts
- src/domains/settings/actions/auth.ts
- src/shared/actions/admin-actions.ts
- src/shared/context/AuthContext.tsx
- src/app/auth/callback/route.ts
```

#### ❌ 삭제할 파일
```
삭제:
- src/shared/api/supabase.ts          → client.browser.ts로 대체
- src/shared/api/supabaseServer.ts    → client.server.ts로 대체
- src/shared/api/auth.ts              → middleware.ts에 인라인으로 이동
```

### 구현 상세

#### 📄 `src/shared/lib/supabase/client.browser.ts`
```typescript
'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

/**
 * 브라우저용 Supabase 클라이언트 (싱글톤)
 * 클라이언트 컴포넌트에서만 사용
 */
export function getSupabaseBrowser() {
  if (typeof window === 'undefined') {
    throw new Error('❌ getSupabaseBrowser는 브라우저에서만 사용 가능합니다.');
  }

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  return browserClient;
}
```

#### 📄 `src/shared/lib/supabase/client.server.ts`
```typescript
'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';

/**
 * 서버 컴포넌트용 Supabase 클라이언트 (읽기 전용)
 */
export async function getSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}, // 읽기 전용
      },
    }
  );
}

/**
 * Server Action용 Supabase 클라이언트 (읽기/쓰기)
 */
export async function getSupabaseAction() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            console.error('🔴 쿠키 설정 실패:', error);
          }
        },
      },
      auth: {
        persistSession: true,
        flowType: 'pkce',
      },
    }
  );
}

/**
 * 관리자용 Supabase 클라이언트 (RLS 우회)
 */
export function getSupabaseAdmin() {
  const { createClient } = require('@supabase/supabase-js');

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
```

#### 📄 `src/shared/lib/supabase/index.ts`
```typescript
// Public API
export { getSupabaseBrowser } from './client.browser';
export { getSupabaseServer, getSupabaseAction, getSupabaseAdmin } from './client.server';
export type { Database } from './types';
```

### 마이그레이션 가이드

| 기존 코드 | 새로운 코드 |
|---------|----------|
| `import { createClient } from '@/shared/api/supabase'` | `import { getSupabaseBrowser } from '@/shared/lib/supabase'` |
| `const supabase = createClient()` | `const supabase = getSupabaseBrowser()` |
| `import { createClient } from '@/shared/api/supabaseServer'` | `import { getSupabaseServer } from '@/shared/lib/supabase'` |
| `const supabase = await createClient()` | `const supabase = await getSupabaseServer()` |
| `import { createServerActionClient }` | `import { getSupabaseAction }` |
| `const supabase = await createServerActionClient()` | `const supabase = await getSupabaseAction()` |

---

## 🛡️ STEP 2: 인증 가드 통합 (1일)

### 목표
여기저기 흩어진 권한 체크를 하나의 가드로 통합

### 작업 파일

#### ✅ 생성할 파일
```
src/shared/guards/
├── auth.guard.ts           # 통합 인증 가드
├── types.ts                # 가드 타입
└── index.ts                # Public API
```

#### 🔄 수정할 파일 (가드 적용)
```
즉시 수정:
- src/app/admin/layout.tsx              # serverAuthGuard({ requireAdmin: true })
- src/app/settings/profile/page.tsx     # serverAuthGuard()
- src/domains/admin/actions/suspension.ts  # requireAdmin()
```

#### ❌ 삭제할 파일
```
삭제:
- src/shared/utils/auth-guard.ts        → guards/auth.guard.ts로 대체
```

#### ⚠️ 유지할 파일
```
유지 (별도 기능):
- src/shared/utils/suspension-guard.ts  # 계정 정지 체크 (별도 기능)
```

### 구현 상세

#### 📄 `src/shared/guards/auth.guard.ts`
```typescript
'use server';

import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/shared/lib/supabase';
import { AuthError, PermissionError } from './errors';

export interface AuthGuardOptions {
  /**
   * 로그인 필수 여부 (기본: true)
   */
  requireAuth?: boolean;

  /**
   * 관리자 권한 필수 여부 (기본: false)
   */
  requireAdmin?: boolean;

  /**
   * 인증 실패 시 리다이렉트 경로 (기본: /signin)
   */
  redirectTo?: string;

  /**
   * 권한 없음 시 리다이렉트 경로 (기본: /)
   */
  forbiddenRedirectTo?: string;
}

/**
 * ✅ 통합 인증 가드
 *
 * 서버 컴포넌트, Server Action, Route Handler에서 사용
 *
 * @example
 * // 로그인만 필요
 * const user = await serverAuthGuard();
 *
 * // 관리자 권한 필요
 * const admin = await serverAuthGuard({ requireAdmin: true });
 *
 * // 커스텀 리다이렉트
 * const user = await serverAuthGuard({ redirectTo: '/login' });
 */
export async function serverAuthGuard(options: AuthGuardOptions = {}) {
  const {
    requireAuth = true,
    requireAdmin = false,
    redirectTo = '/signin',
    forbiddenRedirectTo = '/',
  } = options;

  try {
    const supabase = await getSupabaseServer();

    // 1. 사용자 인증 확인
    const { data: { user }, error } = await supabase.auth.getUser();

    if (requireAuth && (error || !user)) {
      redirect(redirectTo);
    }

    if (!user) {
      return null;
    }

    // 2. 관리자 권한 확인
    if (requireAdmin) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.is_admin) {
        redirect(forbiddenRedirectTo);
      }
    }

    return user;
  } catch (error) {
    // redirect()는 에러를 던지므로 여기서 catch
    throw error;
  }
}

/**
 * 관리자 권한 필수 (에러 발생, 리다이렉트 없음)
 * Server Action 내부에서 사용
 */
export async function requireAdmin() {
  const supabase = await getSupabaseServer();

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new AuthError('로그인이 필요합니다.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.is_admin) {
    throw new PermissionError('관리자 권한이 필요합니다.');
  }

  return user;
}

/**
 * 로그인 필수 (에러 발생, 리다이렉트 없음)
 */
export async function requireAuth() {
  const supabase = await getSupabaseServer();

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new AuthError('로그인이 필요합니다.');
  }

  return user;
}
```

#### 📄 `src/shared/guards/errors.ts`
```typescript
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}
```

---

## 🏗️ STEP 3: 인증 액션 정리 (2-3일)

### 목표
3개 파일에 흩어진 인증 로직을 도메인별로 정리

### 작업 파일

#### 🔄 기존 파일 정리
```
src/domains/auth/actions/
├── sign-in.ts              # actions.ts에서 signIn만 분리
├── sign-out.ts             # actions.ts에서 signOut만 분리
├── sign-up.ts              # actions.ts에서 signUp만 분리
├── oauth.ts                # actions.ts에서 카카오 로그인 분리
├── password.ts             # actions.ts + actions-custom.ts 통합
├── username.ts             # actions-custom.ts 아이디 찾기
├── profile.ts              # actions.ts 프로필 관련
└── index.ts                # Public API
```

#### ❌ 삭제할 파일
```
삭제 (분리 후):
- src/domains/auth/actions.ts          # 661줄 → 7개 파일로 분리
- src/domains/auth/actions-custom.ts   # 232줄 → password.ts, username.ts로 통합
```

#### 🔄 수정할 파일
```
settings에서 auth 분리:
- src/domains/settings/actions/auth.ts  # → domains/auth/actions/password.ts로 통합
```

### 구현 예시

#### 📄 `src/domains/auth/actions/sign-in.ts`
```typescript
'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSupabaseAction } from '@/shared/lib/supabase';

/**
 * 로그인 (아이디 기반)
 */
export async function signIn(username: string, password: string) {
  try {
    const supabase = await getSupabaseAction();

    // 1. 아이디로 이메일 조회
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', username)
      .single();

    if (!profile?.email) {
      return { error: '아이디 또는 비밀번호가 올바르지 않습니다.' };
    }

    // 2. 로그인
    const { data, error } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password,
    });

    if (error) {
      return { error: '아이디 또는 비밀번호가 올바르지 않습니다.' };
    }

    // 3. 캐시 무효화
    revalidatePath('/', 'layout');

    return { success: true, data };
  } catch (error) {
    return { error: '로그인 중 오류가 발생했습니다.' };
  }
}

/**
 * 로그인 + 리다이렉트
 */
export async function signInAndRedirect(
  username: string,
  password: string,
  redirectTo = '/'
) {
  const result = await signIn(username, password);

  if (result.success) {
    redirect(redirectTo);
  }

  return result;
}
```

#### 📄 `src/domains/auth/actions/index.ts`
```typescript
// Public API
export { signIn, signInAndRedirect } from './sign-in';
export { signOut, signOutAndRedirect } from './sign-out';
export { signUp } from './sign-up';
export { signInWithKakao } from './oauth';
export { changePassword, resetPassword, sendPasswordResetLink } from './password';
export { findUsername, sendUsernameRecoveryCode } from './username';
export { getCurrentUser, updateProfile } from './profile';
```

---

## 🎨 STEP 4: AuthContext 간소화 (1일)

### 목표
715줄의 복잡한 AuthContext를 200줄 이하로 간소화

### 작업 파일

#### 🔄 수정할 파일
```
대폭 간소화:
- src/shared/context/AuthContext.tsx    # 715줄 → 200줄 이하로
```

### 개선 방향

#### ❌ 제거할 것
```typescript
// 1. 서버에서 관리해야 할 로직
- 세션 갱신 로직 (서버가 자동으로 처리)
- 자동 로그아웃 타이머 (서버에서 처리)
- 활동 감지 이벤트 리스너 (과도함)

// 2. 중복 로직
- getUser() 여러 번 호출
- 프로필 정보 동기화 (서버에서 처리)

// 3. 복잡한 상태 관리
- timeUntilLogout
- warningShownRef
- 여러 개의 useRef
```

#### ✅ 유지할 것
```typescript
// 핵심만 남김
- 현재 사용자 상태 (user)
- 로딩 상태 (isLoading)
- 로그아웃 함수
- onAuthStateChange 구독
```

---

## 🚦 STEP 5: Middleware 간소화 (0.5일)

### 목표
141줄의 middleware를 80줄 이하로 간소화

### 작업 파일

#### 🔄 수정할 파일
```
간소화:
- middleware.ts                         # 141줄 → 80줄 이하로
```

#### ❌ 삭제할 부분
```typescript
// 주석 처리된 세션 갱신 코드 (97-119줄) 삭제
```

---

## 🧪 STEP 6: 테스트 및 검증 (1일)

### 테스트 체크리스트

#### 기능 테스트
- [ ] 일반 로그인
- [ ] 로그인 유지 체크
- [ ] 로그아웃
- [ ] 카카오 로그인
- [ ] 비밀번호 변경
- [ ] 아이디 찾기
- [ ] 비밀번호 재설정

#### 권한 테스트
- [ ] 로그아웃 상태에서 `/admin` 접근 → 리다이렉트
- [ ] 일반 사용자로 `/admin` 접근 → 리다이렉트
- [ ] 관리자로 `/admin` 접근 → 성공
- [ ] 로그아웃 상태에서 `/settings` 접근 → 리다이렉트

#### 세션 테스트
- [ ] 페이지 새로고침 후 로그인 유지
- [ ] 브라우저 재시작 후 로그인 유지 (로그인 유지 체크 시)
- [ ] 다른 탭에서 로그아웃 → 현재 탭도 로그아웃

---

## 📊 최종 파일 구조

```
src/
├── shared/
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.browser.ts       ✅ NEW (브라우저용)
│   │       ├── client.server.ts        ✅ NEW (서버용)
│   │       ├── types.ts                🔄 MOVED (기존 shared/types/supabase.ts)
│   │       └── index.ts                ✅ NEW (Public API)
│   ├── guards/
│   │   ├── auth.guard.ts               ✅ NEW (통합 가드)
│   │   ├── errors.ts                   ✅ NEW (에러 클래스)
│   │   └── index.ts                    ✅ NEW (Public API)
│   ├── context/
│   │   └── AuthContext.tsx             🔧 SIMPLIFIED (715 → 200줄)
│   └── utils/
│       └── suspension-guard.ts         ✅ KEEP (별도 기능)
│
├── domains/
│   └── auth/
│       ├── actions/
│       │   ├── sign-in.ts              ✅ NEW (분리)
│       │   ├── sign-out.ts             ✅ NEW (분리)
│       │   ├── sign-up.ts              ✅ NEW (분리)
│       │   ├── oauth.ts                ✅ NEW (분리)
│       │   ├── password.ts             ✅ NEW (통합)
│       │   ├── username.ts             ✅ NEW (분리)
│       │   ├── profile.ts              ✅ NEW (분리)
│       │   └── index.ts                ✅ NEW (Public API)
│       └── components/
│           └── KakaoLoginButton.tsx    ✅ KEEP
│
├── app/
│   ├── auth/callback/route.ts          🔧 UPDATE (import 경로)
│   ├── admin/
│   │   └── layout.tsx                  🔧 FIX (serverAuthGuard 추가)
│   └── settings/
│       └── profile/page.tsx            🔧 FIX (serverAuthGuard 추가)
│
└── middleware.ts                        🔧 SIMPLIFIED (141 → 80줄)

❌ 삭제할 파일:
- src/shared/api/auth.ts
- src/shared/api/supabase.ts
- src/shared/api/supabaseServer.ts
- src/shared/utils/auth-guard.ts
- src/domains/auth/actions.ts
- src/domains/auth/actions-custom.ts
- src/domains/settings/actions/auth.ts
```

---

## 📅 전체 일정

| 단계 | 작업 | 소요 시간 | 누적 |
|-----|------|----------|------|
| STEP 1 | Supabase 클라이언트 통합 | 1-2일 | 1-2일 |
| STEP 2 | 인증 가드 통합 | 1일 | 2-3일 |
| STEP 3 | 인증 액션 정리 | 2-3일 | 4-6일 |
| STEP 4 | AuthContext 간소화 | 1일 | 5-7일 |
| STEP 5 | Middleware 간소화 | 0.5일 | 5.5-7.5일 |
| STEP 6 | 테스트 및 검증 | 1일 | 6.5-8.5일 |

**예상 총 소요 시간**: 7-9일 (실제 업무 기준)

---

## 🚀 시작 방법

### Option 1: 전체 진행
```bash
# STEP 1부터 순서대로 진행
```

### Option 2: 긴급 패치 먼저
```bash
# STEP 2만 먼저 (보안 긴급)
# 나머지는 이후에
```

### Option 3: 병렬 진행
```bash
# STEP 1 + STEP 2 동시 진행 (1명 이상인 경우)
```

---

## 💡 다음 단계

이 계획서에 동의하시면:
1. **STEP 1부터 시작**: 제가 파일 생성 및 마이그레이션 도와드림
2. **일부 수정**: 계획 조정
3. **다른 접근**: 대안 제시

**어떻게 진행하시겠어요?**
