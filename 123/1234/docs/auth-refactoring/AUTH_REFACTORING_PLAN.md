# 🔄 인증 시스템 리팩토링 계획

## 📊 현재 상태 분석: 왜 스파게티인가?

### 🍝 문제점 1: 인증 체크가 사방팔방 흩어져 있음

```
현재 구조:
❌ middleware.ts         → 일부만 체크 (admin은 스킵)
❌ app/admin/layout.tsx  → 체크 안함
❌ AdminLayoutClient.tsx → 클라이언트에서만 체크
❌ auth-guard.ts         → 있는데 안 씀
❌ admin-actions.ts      → 각자 체크
❌ settings/actions/auth.ts → 또 각자 체크
```

**문제**: 누가 어디서 어떻게 체크하는지 모름!

---

### 🍝 문제점 2: Supabase 클라이언트가 3개나 됨

```typescript
// 1. supabase.ts - 클라이언트용
export function createClient() { /* 싱글톤 */ }

// 2. supabaseServer.ts - 서버용 (읽기 전용)
export const createClient = async () => { /* 쿠키 읽기만 */ }

// 3. supabaseServer.ts - 서버 액션용 (쓰기 가능)
export const createServerActionClient = async () => { /* 쿠키 쓰기 */ }

// 4. supabaseServer.ts - 미들웨어용
export const createMiddlewareClient = (request: Request) => { /* ... */ }

// 5. supabaseServer.ts - 관리자용
export const createAdminClient = () => { /* RLS 우회 */ }
```

**문제**:
- 어디서 뭘 써야 하는지 헷갈림
- 실수로 잘못된 클라이언트 사용하면 보안 구멍
- 일관성 없음

---

### 🍝 문제점 3: 권한 체크 로직이 중복됨

```typescript
// admin-actions.ts
async function checkAdminPermission() {
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  // ...
}

// auth-guard.ts
export async function serverAuthGuard(options) {
  const { data: { user } } = await supabase.auth.getUser()
  if (requireAdmin) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    // ...
  }
}

// settings/actions/auth.ts (비밀번호 변경)
const { data: { user } } = await supabase.auth.getUser()
// 또 체크...

// AuthContext.tsx (클라이언트)
const { data: { user } } = await supabase.auth.getUser()
// 또또 체크...
```

**문제**: 같은 코드가 5군데 이상!

---

### 🍝 문제점 4: 세션 관리가 3군데서 따로 놈

```typescript
// 1. AuthContext.tsx (클라이언트)
- 15분마다 갱신
- 24시간/30일 자동 로그아웃
- 활동 감지
- 카운트다운

// 2. middleware.ts (서버)
- 세션 체크 (주석 처리된 갱신 코드)
- 토큰 만료 5분 전 갱신 (비활성화)

// 3. domains/auth/actions.ts
- refreshSession() 함수
- 하지만 AuthContext에서만 호출
```

**문제**:
- 클라이언트와 서버가 따로 놈
- 코드 중복
- 동기화 안됨

---

### 🍝 문제점 5: 로그인 플로우가 너무 복잡

```
일반 로그인:
Client → signIn() → createServerActionClient → Supabase
  ↓
Cookie 저장 (되는지 안되는지 모름)
  ↓
revalidatePath('/')
  ↓
Client에서 AuthContext가 감지
  ↓
onAuthStateChange 이벤트
  ↓
getUser() 다시 호출 (보안 강화?)
  ↓
상태 업데이트
  ↓
15분 타이머 설정
  ↓
24시간 타이머 설정
  ↓
활동 감지 이벤트 리스너 등록
```

**문제**:
- 단계가 너무 많음
- 어디서 실패했는지 디버깅 어려움
- 성능 저하

---

## ✅ 올바른 구조: 계층화된 인증 시스템

### 🎯 목표
1. **단일 진실 공급원** (Single Source of Truth)
2. **명확한 책임 분리** (Separation of Concerns)
3. **코드 재사용** (DRY - Don't Repeat Yourself)
4. **타입 안전성** (Type Safety)
5. **테스트 가능** (Testable)

---

## 📐 새로운 아키텍처

### Layer 1: Infrastructure (최하위 - DB/API)

```
src/shared/lib/
├── supabase/
│   ├── client.ts          # 싱글톤 클라이언트 팩토리
│   ├── types.ts           # Supabase 타입
│   └── config.ts          # 설정
```

```typescript
// src/shared/lib/supabase/client.ts
import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { type Database } from './types';

export type SupabaseClient = ReturnType<typeof createBrowserClient<Database>>;

// ✅ 클라이언트용 (브라우저)
let browserClient: SupabaseClient | undefined;

export function getSupabaseBrowserClient() {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseBrowserClient는 브라우저에서만 사용 가능');
  }

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  return browserClient;
}

// ✅ 서버용 (Server Components, Route Handlers)
export async function getSupabaseServerClient(
  cookieStore: Awaited<ReturnType<typeof cookies>>
) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Server Component에서는 쿠키 설정 불가 (무시)
          }
        },
      },
    }
  );
}

// ✅ 관리자용 (RLS 우회)
export function getSupabaseAdminClient() {
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

---

### Layer 2: Domain (비즈니스 로직)

```
src/domains/auth/
├── services/
│   ├── auth.service.ts       # 인증 비즈니스 로직
│   ├── session.service.ts    # 세션 관리
│   └── permission.service.ts # 권한 관리
├── repositories/
│   ├── user.repository.ts    # 사용자 DB 접근
│   └── auth.repository.ts    # 인증 DB 접근
├── types/
│   ├── user.types.ts
│   └── session.types.ts
└── utils/
    ├── validators.ts
    └── errors.ts
```

```typescript
// src/domains/auth/services/auth.service.ts
import { getSupabaseServerClient } from '@/shared/lib/supabase/client';
import { UserRepository } from '../repositories/user.repository';
import { SessionService } from './session.service';
import { AuthError, InvalidCredentialsError } from '../utils/errors';

export class AuthService {
  constructor(
    private userRepo: UserRepository,
    private sessionService: SessionService
  ) {}

  /**
   * 사용자 로그인 (아이디 기반)
   */
  async signIn(username: string, password: string) {
    try {
      // 1. 로그인 시도 제한 체크
      await this.checkLoginAttempts(username);

      // 2. 아이디로 이메일 조회
      const email = await this.userRepo.getEmailByUsername(username);
      if (!email) {
        await this.recordLoginAttempt(username, false);
        throw new InvalidCredentialsError();
      }

      // 3. Supabase 인증
      const cookieStore = await cookies();
      const supabase = await getSupabaseServerClient(cookieStore);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        await this.recordLoginAttempt(username, false);
        throw new InvalidCredentialsError();
      }

      // 4. 로그인 성공 처리
      await this.recordLoginAttempt(username, true);
      await this.sessionService.setupSession(data.session);

      return data;
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError('로그인 중 오류가 발생했습니다.');
    }
  }

  /**
   * 현재 사용자 조회
   */
  async getCurrentUser() {
    const cookieStore = await cookies();
    const supabase = await getSupabaseServerClient(cookieStore);

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) return null;

    // 프로필 정보와 합쳐서 반환
    const profile = await this.userRepo.getProfileById(user.id);

    return {
      ...user,
      profile,
    };
  }

  /**
   * 로그아웃
   */
  async signOut() {
    const cookieStore = await cookies();
    const supabase = await getSupabaseServerClient(cookieStore);

    const { error } = await supabase.auth.signOut();
    if (error) throw new AuthError('로그아웃 실패');

    await this.sessionService.clearSession();
  }

  // ... 기타 메서드
}
```

```typescript
// src/domains/auth/services/permission.service.ts
export class PermissionService {
  constructor(private userRepo: UserRepository) {}

  /**
   * 관리자 권한 확인 (캐시 포함)
   */
  async isAdmin(userId: string): Promise<boolean> {
    // 캐시 확인 (5분)
    const cached = this.cache.get(`admin:${userId}`);
    if (cached !== undefined) return cached;

    // DB 조회
    const profile = await this.userRepo.getProfileById(userId);
    const isAdmin = profile?.is_admin ?? false;

    // 캐시 저장
    this.cache.set(`admin:${userId}`, isAdmin, 300); // 5분

    return isAdmin;
  }

  /**
   * 관리자 권한 체크 (에러 발생)
   */
  async requireAdmin(userId: string) {
    const isAdmin = await this.isAdmin(userId);
    if (!isAdmin) {
      throw new PermissionError('관리자 권한이 필요합니다.');
    }
  }

  /**
   * 사용자 인증 체크
   */
  async requireAuth(userId?: string | null) {
    if (!userId) {
      throw new AuthenticationError('로그인이 필요합니다.');
    }
  }
}
```

---

### Layer 3: Application (Server Actions)

```
src/domains/auth/
├── actions/
│   ├── sign-in.action.ts
│   ├── sign-out.action.ts
│   ├── sign-up.action.ts
│   └── update-profile.action.ts
```

```typescript
// src/domains/auth/actions/sign-in.action.ts
'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { AuthService } from '../services/auth.service';
import { UserRepository } from '../repositories/user.repository';
import { SessionService } from '../services/session.service';

/**
 * 로그인 Server Action
 */
export async function signInAction(username: string, password: string) {
  // ✅ 의존성 주입 (테스트 가능)
  const authService = new AuthService(
    new UserRepository(),
    new SessionService()
  );

  try {
    const data = await authService.signIn(username, password);

    // ✅ 캐시 무효화
    revalidatePath('/', 'layout');

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '로그인 실패',
    };
  }
}

/**
 * 로그인 후 리다이렉트
 */
export async function signInAndRedirect(
  username: string,
  password: string,
  redirectTo = '/'
) {
  const result = await signInAction(username, password);

  if (result.success) {
    redirect(redirectTo);
  }

  return result;
}
```

---

### Layer 4: Presentation (Guards & Middleware)

```
src/shared/guards/
├── server-auth.guard.ts    # 서버 컴포넌트용
├── middleware-auth.guard.ts # 미들웨어용
└── use-auth.guard.ts       # 클라이언트 훅
```

```typescript
// src/shared/guards/server-auth.guard.ts
import { redirect } from 'next/navigation';
import { AuthService } from '@/domains/auth/services/auth.service';
import { PermissionService } from '@/domains/auth/services/permission.service';

export interface AuthGuardOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
}

/**
 * ✅ 서버 컴포넌트/Server Action용 인증 가드
 *
 * @example
 * // 로그인만 필요
 * const user = await serverAuthGuard();
 *
 * // 관리자 권한 필요
 * const admin = await serverAuthGuard({ requireAdmin: true });
 */
export async function serverAuthGuard(options: AuthGuardOptions = {}) {
  const {
    requireAuth = true,
    requireAdmin = false,
    redirectTo = '/signin',
  } = options;

  const authService = new AuthService(/* ... */);
  const permissionService = new PermissionService(/* ... */);

  // 1. 사용자 인증 확인
  const user = await authService.getCurrentUser();

  if (requireAuth && !user) {
    redirect(redirectTo);
  }

  // 2. 관리자 권한 확인
  if (requireAdmin && user) {
    try {
      await permissionService.requireAdmin(user.id);
    } catch (error) {
      redirect('/');
    }
  }

  return user;
}
```

```typescript
// middleware.ts (간소화)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { middlewareAuthGuard } from '@/shared/guards/middleware-auth.guard';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ✅ 간단한 라우팅 규칙
  const routes = {
    public: ['/signin', '/signup', '/'],
    protected: ['/settings', '/boards/create'],
    admin: ['/admin'],
  };

  // Public 경로는 통과
  if (routes.public.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Protected 경로는 로그인 체크
  if (routes.protected.some(route => pathname.startsWith(route))) {
    return middlewareAuthGuard(request, { requireAuth: true });
  }

  // Admin 경로는 관리자 체크
  if (routes.admin.some(route => pathname.startsWith(route))) {
    return middlewareAuthGuard(request, { requireAdmin: true });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

---

### Layer 5: UI (클라이언트 컴포넌트)

```typescript
// src/shared/context/AuthContext.tsx (간소화)
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/shared/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // 인증 상태 변경 감지 (한 곳에서만!)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

---

## 📁 최종 파일 구조

```
src/
├── shared/
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts          # ✅ Supabase 클라이언트 팩토리 (1개)
│   │       ├── types.ts
│   │       └── config.ts
│   ├── guards/
│   │   ├── server-auth.guard.ts   # ✅ 서버용 가드
│   │   └── middleware-auth.guard.ts # ✅ 미들웨어용 가드
│   └── context/
│       └── AuthContext.tsx        # ✅ 클라이언트 상태 관리 (간소화)
│
├── domains/
│   └── auth/
│       ├── services/              # ✅ 비즈니스 로직
│       │   ├── auth.service.ts
│       │   ├── session.service.ts
│       │   └── permission.service.ts
│       ├── repositories/          # ✅ 데이터 접근
│       │   ├── user.repository.ts
│       │   └── auth.repository.ts
│       ├── actions/               # ✅ Server Actions (얇은 레이어)
│       │   ├── sign-in.action.ts
│       │   ├── sign-out.action.ts
│       │   └── update-profile.action.ts
│       ├── types/
│       │   ├── user.types.ts
│       │   └── session.types.ts
│       └── utils/
│           ├── validators.ts
│           └── errors.ts
│
├── app/
│   ├── admin/
│   │   └── layout.tsx             # ✅ serverAuthGuard({ requireAdmin: true })
│   ├── settings/
│   │   └── layout.tsx             # ✅ serverAuthGuard()
│   └── ...
│
└── middleware.ts                   # ✅ 간소화된 라우팅 로직
```

---

## 🔄 마이그레이션 계획

### Phase 1: Infrastructure (1-2일)
1. `shared/lib/supabase/client.ts` 생성
2. 기존 `supabase.ts`, `supabaseServer.ts` 내용 통합
3. 테스트 작성

### Phase 2: Domain Layer (3-5일)
1. `domains/auth/services/` 생성
2. 기존 `actions.ts` 로직을 서비스로 이동
3. `repositories/` 생성 (DB 접근 분리)
4. 에러 클래스 정의

### Phase 3: Guards (1-2일)
1. `serverAuthGuard` 구현
2. `middlewareAuthGuard` 구현
3. 기존 `auth-guard.ts` 대체

### Phase 4: Application Layer (2-3일)
1. Server Actions를 얇은 래퍼로 변경
2. 서비스 호출만 하도록 수정

### Phase 5: UI Layer (1-2일)
1. `AuthContext` 간소화
2. 불필요한 로직 제거
3. 세션 갱신을 서버에 위임

### Phase 6: Cleanup (1일)
1. 기존 파일 삭제
2. Import 경로 수정
3. 전체 테스트

---

## 🎯 개선 효과

### Before (현재)
```typescript
// 어드민 페이지 - 권한 체크 없음
export default function AdminLayout({ children }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}

// 포인트 업데이트 - 권한 체크 중복
export async function updateUserPoints(userId, points, reason) {
  const supabase = await createServerActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('인증 필요');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) throw new Error('권한 필요');

  // 실제 로직
  await supabase.from('profiles').update({ points }).eq('id', userId);
}
```

### After (개선)
```typescript
// 어드민 레이아웃 - 명확한 권한 체크
export default async function AdminLayout({ children }) {
  await serverAuthGuard({ requireAdmin: true });
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}

// 포인트 업데이트 - 깔끔한 로직
export async function updateUserPoints(userId, points, reason) {
  // ✅ 1줄로 권한 체크
  await serverAuthGuard({ requireAdmin: true });

  // ✅ 비즈니스 로직에 집중
  const pointService = new PointService();
  await pointService.updatePoints(userId, points, reason);
}
```

---

## 💰 비용 대비 효과

### 현재 시스템의 문제
- 🐛 버그 발생 확률: **높음**
- 🔧 유지보수성: **매우 낮음**
- 🚀 개발 속도: **느림** (매번 복붙)
- 🔒 보안: **취약함** (체크 빠뜨림)
- 📚 온보딩: **어려움** (이해 못함)

### 개선 후
- 🐛 버그 발생 확률: **낮음**
- 🔧 유지보수성: **높음** (한 곳만 수정)
- 🚀 개발 속도: **빠름** (한 줄로 해결)
- 🔒 보안: **강화** (자동 체크)
- 📚 온보딩: **쉬움** (명확한 구조)

---

## 🚀 즉시 시작할 수 있는 Quick Win

### 1. serverAuthGuard 먼저 구현 (2시간)

```typescript
// src/shared/guards/server-auth.guard.ts
'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function serverAuthGuard(options: {
  requireAdmin?: boolean;
  redirectTo?: string;
} = {}) {
  const { requireAdmin = false, redirectTo = '/signin' } = options;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(redirectTo);

  if (requireAdmin) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) redirect('/');
  }

  return user;
}
```

### 2. 어드민 레이아웃에 즉시 적용 (5분)

```typescript
// app/admin/layout.tsx
import { serverAuthGuard } from '@/shared/guards/server-auth.guard';

export default async function AdminLayout({ children }) {
  await serverAuthGuard({ requireAdmin: true });
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
```

### 3. 다른 곳에도 적용

```typescript
// app/settings/layout.tsx
export default async function SettingsLayout({ children }) {
  await serverAuthGuard();
  return children;
}

// domains/admin/actions/points.ts
export async function updateUserPoints(userId, points) {
  await serverAuthGuard({ requireAdmin: true });
  // ... 로직
}
```

---

## 📊 결론

### 현재 상태: 🍝 스파게티
- 인증 체크가 여기저기 흩어짐
- Supabase 클라이언트 5개
- 권한 체크 코드 중복
- 세션 관리 3군데서 따로 놂
- 로그인 플로우 복잡

### 개선 방향: 🏗️ 계층화된 아키텍처
- ✅ 단일 진실 공급원
- ✅ 명확한 책임 분리
- ✅ 코드 재사용
- ✅ 타입 안전성
- ✅ 테스트 가능

### 우선순위
1. **즉시**: `serverAuthGuard` 구현 및 적용 (보안 긴급)
2. **1주일**: Service Layer 구현 (유지보수성)
3. **2주일**: Repository 분리 (테스트 가능성)
4. **1개월**: 전체 마이그레이션 완료

---

**어떻게 진행하시겠어요?**
1. 전체 리팩토링 (2-3주 소요, 완벽한 구조)
2. 점진적 개선 (Quick Win부터 시작, 단계별 진행)
3. 보안 긴급 패치만 (serverAuthGuard만 먼저 적용)
