# 🔐 로그인 및 인증 시스템 종합 보안 리뷰

> **작성일**: 2025-11-27
> **대상**: Next.js 15 스포츠 커뮤니티 플랫폼
> **검토 범위**: 로그인, 프로필 관리, 어드민 권한 체계

---

## 📋 목차

1. [전체 아키텍처 개요](#1-전체-아키텍처-개요)
2. [심각한 보안 취약점 (Critical)](#2-심각한-보안-취약점-critical)
3. [중요 보안 이슈 (High)](#3-중요-보안-이슈-high)
4. [중간 수준 이슈 (Medium)](#4-중간-수준-이슈-medium)
5. [개선 권장사항 (Low)](#5-개선-권장사항-low)
6. [긍정적인 부분](#6-긍정적인-부분)
7. [즉시 수정 필요 항목](#7-즉시-수정-필요-항목)

---

## 1. 전체 아키텍처 개요

### 1.1 인증 플로우

```
[Client]
   ↓
[로그인 폼] → [domains/auth/actions.ts::signIn()]
   ↓
[Server Action] → Supabase Auth (signInWithPassword)
   ↓
[세션 생성] → 쿠키 저장 (createServerActionClient)
   ↓
[AuthContext] → 클라이언트 상태 관리
   ↓
[자동 갱신] → 15분마다 토큰 갱신
```

### 1.2 주요 파일 구조

```
src/
├── domains/auth/
│   ├── actions.ts                    # 인증 관련 Server Actions
│   └── components/
│       └── KakaoLoginButton.tsx      # 소셜 로그인
├── app/
│   ├── auth/callback/route.ts        # OAuth 콜백 처리
│   ├── admin/
│   │   ├── layout.tsx               # 어드민 레이아웃
│   │   └── components/AdminLayoutClient.tsx
│   └── settings/profile/page.tsx    # 프로필 설정
├── shared/
│   ├── api/
│   │   ├── supabase.ts              # 클라이언트용
│   │   └── supabaseServer.ts        # 서버용
│   ├── context/AuthContext.tsx       # 인증 컨텍스트
│   ├── utils/auth-guard.ts          # 인증 가드
│   └── actions/admin-actions.ts     # 어드민 액션
└── middleware.ts                     # 미들웨어
```

---

## 2. 심각한 보안 취약점 (Critical)

### 🚨 2.1 어드민 페이지 접근 제어 부재

**위치**: `app/admin/layout.tsx`, `app/admin/components/AdminLayoutClient.tsx`

**문제점**:
```tsx
// app/admin/layout.tsx - 어떤 인증도 없음!
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayoutClient>
      {children}
    </AdminLayoutClient>
  );
}
```

```tsx
// AdminLayoutClient.tsx - 클라이언트에서만 체크
export default function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const { user, setSessionType } = useAuth();

  // ❌ 서버 검증 없이 클라이언트 user만 확인
  // ❌ is_admin 체크 없음!
  // ❌ 로그인하지 않아도 페이지 렌더링됨

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ... */}
      {children}
    </div>
  );
}
```

**취약점**:
1. **인증 체크 없음**: 로그인 여부조차 확인하지 않음
2. **권한 체크 없음**: `is_admin` 필드 검증 없음
3. **클라이언트 의존**: 클라이언트 측 데이터만 신뢰
4. **직접 URL 접근 가능**: `/admin` 경로에 누구나 접근 가능

**공격 시나리오**:
```bash
# 1. 로그아웃 상태에서 직접 접근
curl https://your-site.com/admin
# → 어드민 페이지가 렌더링됨 (user가 null이지만 페이지는 보임)

# 2. 일반 사용자가 브라우저 개발자 도구로 조작
localStorage.setItem('keep_login', 'true');
# → 어드민 기능 접근 가능

# 3. SSR 우회
# 서버 컴포넌트에서 검증하지 않으므로 HTML이 노출됨
```

**즉시 필요한 수정**:
```tsx
// app/admin/layout.tsx
import { serverAuthGuard } from '@/shared/utils/auth-guard';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ 서버 측에서 어드민 권한 체크
  await serverAuthGuard({
    requireAdmin: true,
    redirectTo: '/',
    logUnauthorizedAccess: true
  });

  return (
    <AdminLayoutClient>
      {children}
    </AdminLayoutClient>
  );
}
```

**위험도**: **CRITICAL** ⚠️
**영향**: 전체 관리자 페이지가 무방비 상태

---

### 🚨 2.2 로그인 시도 제한 우회 가능

**위치**: `domains/auth/actions.ts`

**문제점**:
```typescript
// Line 141: email 필드에 username을 저장 (테이블 설계 오류)
const { data: attempts } = await supabase
  .from('login_attempts')
  .select('*')
  .eq('email', username) // ❌ username을 email 필드에 저장
  .gte('created_at', new Date(now - 15 * 60 * 1000).toISOString())

// Line 179: IP 주소와 User-Agent가 항상 'unknown'
await supabase
  .from('login_attempts')
  .insert({
    email: username,
    ip_address: 'unknown',  // ❌ 실제 IP 저장 안함
    user_agent: 'unknown',  // ❌ 실제 User-Agent 저장 안함
    created_at: new Date().toISOString()
  });
```

**취약점**:
1. **테이블 필드 오용**: `email` 필드에 `username` 저장 → 혼란 야기
2. **IP 추적 불가**: 항상 `'unknown'`으로 저장
3. **User-Agent 미저장**: 봇 탐지 불가
4. **세션 기반 차단 없음**: 쿠키/세션 초기화로 우회 가능

**공격 시나리오**:
```python
# 공격자가 무한 로그인 시도 가능
for i in range(1000):
    # 매번 다른 세션으로 5회씩 시도
    session = requests.Session()
    for attempt in range(5):
        session.post('/api/login', data={'username': 'target', 'password': 'guess'})
    # 5회 후 세션 초기화하면 차단 우회
    session.close()
```

**권장 수정**:
```typescript
// 1. 테이블 구조 개선
// login_attempts 테이블에 username 컬럼 추가

// 2. 실제 IP와 User-Agent 저장
async function recordLoginAttempt(username: string): Promise<void> {
  try {
    const supabase = await createClient();
    const headersList = await headers();

    // ✅ 실제 IP 주소 추출
    const ip = headersList.get('x-forwarded-for')?.split(',')[0].trim() ||
               headersList.get('x-real-ip') ||
               'unknown';

    // ✅ 실제 User-Agent 추출
    const userAgent = headersList.get('user-agent') || 'unknown';

    await supabase
      .from('login_attempts')
      .insert({
        username,        // ✅ username 필드에 저장
        ip_address: ip,
        user_agent: userAgent,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('로그인 시도 기록 오류:', error);
  }
}

// 3. IP 기반 차단 추가
async function checkLoginBlock(username: string, ip: string) {
  // username + IP 조합으로 차단 체크
  const { data: attempts } = await supabase
    .from('login_attempts')
    .select('*')
    .eq('username', username)
    .eq('ip_address', ip)
    .gte('created_at', new Date(now - 15 * 60 * 1000).toISOString());

  if (attempts && attempts.length >= 5) {
    return { isBlocked: true, blockedUntil: calculateBlockTime() };
  }

  return { isBlocked: false, blockedUntil: 0 };
}
```

**위험도**: **CRITICAL** ⚠️
**영향**: 무차별 대입 공격(Brute Force) 취약

---

### 🚨 2.3 관리자 권한 우회 가능 (Race Condition)

**위치**: `shared/actions/admin-actions.ts`

**문제점**:
```typescript
// Line 6-26: TOCTOU (Time-of-check to time-of-use) 취약점
async function checkAdminPermission() {
  const supabase = await createServerActionClient()

  // 1. 사용자 인증 확인
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('인증되지 않은 사용자입니다.')
  }

  // 2. 관리자 권한 확인 (별도 쿼리)
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  // ❌ 이 사이에 권한이 변경될 수 있음!

  if (!profile?.is_admin) {
    throw new Error('관리자 권한이 필요합니다.')
  }

  return { user, supabase } // ✅ 여기서 반환된 supabase로 작업
}

// Line 93: 권한 체크 후 실제 작업 사이에 시간차
export async function updateUserPoints(userId: string, points: number, reason: string) {
  const { supabase } = await checkAdminPermission(); // 여기서 체크

  // ❌ 이 사이에 관리자 권한이 박탈될 수 있음

  const { error } = await supabase
    .from('profiles')
    .update({ points })
    .eq('id', userId); // 여기서 실행
}
```

**취약점**:
1. **TOCTOU 취약점**: 체크 시점과 사용 시점 사이의 시간차
2. **권한 재검증 없음**: 한 번 체크하면 이후 신뢰
3. **트랜잭션 미사용**: 원자성 보장 안됨

**공격 시나리오**:
```javascript
// 공격자가 관리자 계정 탈취 후
async function exploit() {
  // 1. 관리자로 요청 시작
  const promise = updateUserPoints('victim_id', 999999, 'hack');

  // 2. 즉시 다른 브라우저에서 관리자 권한 제거 요청
  await fetch('/api/revoke-admin', { method: 'POST' });

  // 3. 원래 요청은 계속 진행됨 (이미 checkAdminPermission 통과)
  await promise; // ✅ 성공! (권한 없는데도 실행됨)
}
```

**권장 수정**:
```typescript
// RLS (Row Level Security) 정책으로 DB 레벨에서 보호
CREATE POLICY "admin_only_points_update" ON profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles AS admin
    WHERE admin.id = auth.uid()
    AND admin.is_admin = true
  )
);

// 또는 함수 내에서 재검증
export async function updateUserPoints(userId: string, points: number, reason: string) {
  const supabase = await createServerActionClient();

  // ✅ 작업 직전에 다시 한 번 권한 체크
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    throw new Error('관리자 권한이 필요합니다.');
  }

  // ✅ 바로 실행 (시간차 최소화)
  const { error } = await supabase
    .from('profiles')
    .update({ points })
    .eq('id', userId);

  if (error) throw error;
}
```

**위험도**: **HIGH** 🔴
**영향**: 권한 없이 관리자 작업 수행 가능

---

## 3. 중요 보안 이슈 (High)

### 🔴 3.1 프로필 수정 불가능 (사용자 경험 문제)

**위치**: `domains/settings/components/profile/ProfileForm.tsx`

**문제점**:
```tsx
// Line 18-90: 모든 필드가 disabled
export default function ProfileForm({ initialData }: ProfileFormProps) {
  return (
    <div className="space-y-4">
      {/* 이메일 - disabled */}
      <input
        type="email"
        value={initialData.email || ''}
        disabled  // ❌ 수정 불가
        className="... cursor-not-allowed"
      />

      {/* 이름 - disabled */}
      <input
        type="text"
        value={initialData.full_name || ''}
        disabled  // ❌ 수정 불가
      />

      {/* 닉네임 - disabled */}
      <input
        type="text"
        value={initialData.nickname || ''}
        disabled  // ❌ 수정 불가
      />
    </div>
  );
}
```

**문제**:
1. **닉네임 변경 불가**: 사용자가 가장 많이 변경하고 싶어하는 필드
2. **이메일 변경 불가**: 이메일은 disabled가 맞지만 설명 필요
3. **저장 버튼 없음**: UI가 불완전함
4. **사용자 혼란**: "왜 수정이 안되지?" → 이탈 가능성

**위험도**: **HIGH** 🔴
**영향**: 사용자 경험 저하, 이탈률 증가

---

### 🔴 3.2 비밀번호 변경 시 현재 세션 유지 (세션 하이재킹 위험)

**위치**: `domains/settings/actions/auth.ts`

**문제점**:
```typescript
// Line 88-101: 비밀번호 변경 후 세션 그대로 유지
export async function changePassword(
  currentPassword: string,
  newPassword: string,
  turnstileToken: string
) {
  // 1. 현재 비밀번호 확인
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email as string,
    password: currentPassword,
  });

  // 2. 비밀번호 변경
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  // ❌ 다른 기기의 세션을 무효화하지 않음!
  // ❌ 현재 세션도 갱신하지 않음!

  return { success: true };
}
```

**취약점**:
1. **다른 기기 세션 유지**: 공격자가 이미 로그인한 경우 계속 접근 가능
2. **Refresh Token 미갱신**: 기존 토큰으로 계속 인증 가능
3. **감사 로그 없음**: 누가 언제 비밀번호를 변경했는지 기록 없음

**공격 시나리오**:
```
1. 공격자가 피해자 계정 탈취 (스타벅스 공용 PC 등)
2. 피해자가 집에서 비밀번호 변경
3. ❌ 공격자의 세션은 여전히 유효함!
4. 공격자가 계속 피해자 계정 사용 가능
```

**위험도**: **HIGH** 🔴
**영향**: 계정 탈취 후 복구 불가

---

### 🔴 3.3 OAuth 콜백 CSRF 취약점

**위치**: `app/auth/callback/route.ts`

**문제점**:
```typescript
// Line 10-14: state 파라미터 검증 없음
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  // ❌ state 파라미터 검증 없음!
  // ❌ CSRF 토큰 확인 없음!

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    // ...
  }
}
```

**취약점**:
1. **CSRF 공격 가능**: `state` 파라미터로 요청 출처 검증 안함
2. **코드 재사용 가능**: 한 번 사용한 `code` 재검증 없음
3. **Referer 검증 없음**: 어디서 온 요청인지 확인 안함

**공격 시나리오**:
```html
<!-- 공격자가 피해자에게 이 링크 전송 -->
<a href="https://your-site.com/auth/callback?code=STOLEN_CODE&next=/admin">
  무료 포인트 받기!
</a>

<!-- 피해자가 클릭하면 공격자의 계정으로 로그인됨 -->
```

**위험도**: **HIGH** 🔴
**영향**: 계정 탈취, 세션 하이재킹

---

## 4. 중간 수준 이슈 (Medium)

### 🟡 4.1 세션 만료 시간이 너무 김

**위치**: `shared/context/AuthContext.tsx`

**문제점**:
```typescript
// Line 14-26: 세션 타입 설정
const SESSION_TYPES = {
  NORMAL: {
    AUTO_LOGOUT_TIME: 24 * 60 * 60 * 1000, // ❌ 24시간
    SESSION_WARNING_TIME: 30 * 60 * 1000,
    STORAGE_KEY: 'session_type_normal'
  },
  EXTENDED: {
    AUTO_LOGOUT_TIME: 30 * 24 * 60 * 60 * 1000, // ❌ 30일
    SESSION_WARNING_TIME: 24 * 60 * 60 * 1000,
    STORAGE_KEY: 'session_type_extended'
  }
};
```

**문제**:
1. **일반 로그인 24시간**: 너무 긴 유효기간 (권장: 2-8시간)
2. **확장 로그인 30일**: 금융 앱 수준 보안 필요하면 과도함
3. **활동 없어도 유지**: idle timeout 없음

**위험도**: **MEDIUM** 🟡
**영향**: 공용 PC 사용 시 보안 위험

---

### 🟡 4.2 Middleware에서 Admin 체크 스킵

**위치**: `middleware.ts`

**문제점**:
```typescript
// Line 88: 어드민 경로 체크 스킵
// Admin 경로는 layout.tsx에서 체크하므로 여기서는 스킵 (성능 향상)

// Line 77: protectedPaths에 admin 없음
const protectedPaths = ['/settings'] // admin은 layout에서 체크하므로 제외
```

**문제**:
- Layout에서 체크한다고 했지만 실제로는 체크 안함 (위의 2.1 참고)
- Middleware는 가장 먼저 실행되는 곳이므로 여기서 막는 게 정석
- "성능 향상"이라고 주석이 있지만 실제로는 보안 약화

**위험도**: **MEDIUM** 🟡
**영향**: 레이아웃 체크 실패 시 어드민 페이지 노출

---

### 🟡 4.3 에러 메시지가 너무 구체적

**위치**: `domains/settings/actions/auth.ts`

**문제점**:
```typescript
// Line 95
if (signInError) {
  return { success: false, error: '현재 비밀번호가 올바르지 않습니다.' };
  // ❌ 비밀번호가 틀렸다는 걸 명시적으로 알려줌
}
```

**문제**:
- 공격자가 비밀번호만 틀렸다는 걸 확인 가능
- 열거 공격(Enumeration Attack)에 사용 가능

**위험도**: **MEDIUM** 🟡
**영향**: 계정 열거 공격 가능

---

## 5. 개선 권장사항 (Low)

### 🟢 5.1 로깅 시스템 개선

**현재 상태**:
- `console.log`, `console.error` 남발
- 구조화되지 않은 로그
- 민감한 정보 노출 가능성

---

### 🟢 5.2 Rate Limiting 추가

**현재**: 로그인 시도 제한만 있음

**권장**: API 전체에 Rate Limiting 적용

---

### 🟢 5.3 보안 헤더 추가

**권장**: X-Frame-Options, CSP, HSTS 등 보안 헤더 추가

---

## 6. 긍정적인 부분

### ✅ 잘 구현된 부분

1. **Supabase SSR 올바른 사용**
   - 서버/클라이언트 클라이언트 분리 잘됨
   - `createServerActionClient`로 쿠키 설정 가능

2. **Server Actions 활용**
   - API Routes 대신 Server Actions 사용
   - `'use server'` 지시어 일관성

3. **로그인 시도 제한**
   - 5회 실패 시 15분 차단 (개선 필요하지만 기본은 있음)

4. **세션 갱신 로직**
   - AuthContext에서 15분마다 자동 갱신
   - 토큰 만료 5분 전 갱신

5. **Turnstile 캡차 적용**
   - 회원가입, 비밀번호 변경 시 봇 방지

6. **에러 메시지 통일**
   - 로그인 실패 시 "아이디 또는 비밀번호가 올바르지 않습니다"로 통일

---

## 7. 즉시 수정 필요 항목

### ⚠️ 우선순위 1 (긴급 - 24시간 이내)

1. **어드민 레이아웃에 권한 체크 추가**
   ```typescript
   // app/admin/layout.tsx
   import { serverAuthGuard } from '@/shared/utils/auth-guard';

   export default async function AdminLayout({ children }) {
     await serverAuthGuard({ requireAdmin: true });
     return <AdminLayoutClient>{children}</AdminLayoutClient>;
   }
   ```

2. **로그인 시도 제한 IP 추적**
   - `headers()`에서 실제 IP 추출
   - `x-forwarded-for` 또는 `x-real-ip` 헤더 사용

3. **OAuth 콜백 CSRF 방지**
   - `state` 파라미터 검증 로직 추가

### 🔴 우선순위 2 (중요 - 1주일 이내)

4. **프로필 수정 기능 구현**
5. **비밀번호 변경 시 세션 갱신**
6. **Middleware에서 Admin 체크**

### 🟡 우선순위 3 (권장 - 1개월 이내)

7. **세션 만료 시간 단축**
8. **Rate Limiting 추가**
9. **보안 헤더 추가**
10. **로깅 시스템 개선**

---

## 8. 체크리스트

### 즉시 확인 필요

- [ ] `/admin` 경로에 로그아웃 상태로 접근 가능한지 테스트
- [ ] 일반 사용자 계정으로 `/admin` 접근 가능한지 테스트
- [ ] 로그인 5회 실패 후 IP 변경하면 계속 시도 가능한지 테스트
- [ ] 비밀번호 변경 후 다른 기기에서 세션 유지되는지 테스트
- [ ] OAuth 콜백에 임의의 `code` 넣어서 요청 가능한지 테스트

### 장기 개선 사항

- [ ] 전체 API에 Rate Limiting 적용
- [ ] 보안 헤더 설정
- [ ] 로깅 시스템 구조화
- [ ] 2FA (Two-Factor Authentication) 도입 검토
- [ ] 세션 관리 개선 (Redis 사용 고려)

---

## 9. 참고 자료

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [Supabase Auth Best Practices](https://supabase.com/docs/guides/auth/security-best-practices)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [CWE-306: Missing Authentication for Critical Function](https://cwe.mitre.org/data/definitions/306.html)

---

**작성자**: Claude Code
**최종 업데이트**: 2025-11-27
**문서 버전**: 1.0
