# 이메일 인증 시스템

이 문서는 회원가입 시 이메일 인증이 어떻게 관리되는지 설명합니다.

## 개요

사용자가 회원가입 시 이메일 인증을 완료해야만 로그인할 수 있습니다.

### 인증 상태 저장 위치

| 테이블 | 컬럼 | 설명 |
|--------|------|------|
| `auth.users` | `email_confirmed_at` | **실제 인증 상태** (Supabase Auth 관리) |
| `public.profiles` | `email_confirmed` | 동기화용 (참고용) |
| `public.profiles` | `email_confirmed_at` | 동기화용 (참고용) |

> **중요**: Supabase Auth는 `auth.users.email_confirmed_at`을 기준으로 인증 여부를 판단합니다. `profiles` 테이블은 편의를 위한 동기화 데이터입니다.

---

## 플로우 다이어그램

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           회원가입 플로우                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. 사용자 회원가입 요청                                                      │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────────┐                                                       │
│  │  signup.ts       │  Turnstile 캡차 검증                                   │
│  │  signUp()        │  → supabase.auth.signUp() 호출                        │
│  └────────┬─────────┘                                                       │
│           │                                                                 │
│           ▼                                                                 │
│  ┌──────────────────┐                                                       │
│  │  auth.users      │  새 사용자 레코드 생성                                  │
│  │  (INSERT)        │  email_confirmed_at = NULL                            │
│  └────────┬─────────┘                                                       │
│           │                                                                 │
│           ▼  트리거: on_auth_user_created                                   │
│  ┌──────────────────┐                                                       │
│  │handle_new_user() │  profiles 테이블에 레코드 생성                          │
│  │                  │  - id, email, username, nickname                      │
│  │                  │  - public_id (8자 hex 자동 생성)                       │
│  │                  │  - email_confirmed = false (기본값)                    │
│  └────────┬─────────┘                                                       │
│           │                                                                 │
│           ▼                                                                 │
│  ┌──────────────────┐                                                       │
│  │  Supabase        │  인증 이메일 자동 발송                                  │
│  │  Email Service   │  (Supabase 대시보드 설정)                              │
│  └──────────────────┘                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           이메일 인증 플로우                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  2. 사용자가 이메일의 인증 링크 클릭                                           │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────────┐                                                       │
│  │  auth.users      │  email_confirmed_at = NOW()                           │
│  │  (UPDATE)        │                                                       │
│  └────────┬─────────┘                                                       │
│           │                                                                 │
│           ▼  트리거: on_email_confirmed                                     │
│  ┌────────────────────────┐                                                 │
│  │handle_email_           │  profiles 테이블 동기화                          │
│  │  confirmation()        │  - email_confirmed = true                       │
│  │                        │  - email_confirmed_at = 인증 시간               │
│  └────────────────────────┘                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           로그인 플로우                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  3. 사용자 로그인 시도                                                        │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────────┐                                                       │
│  │  auth.ts         │  1. 아이디로 profiles에서 email 조회                   │
│  │  signIn()        │  2. supabase.auth.signInWithPassword() 호출           │
│  └────────┬─────────┘                                                       │
│           │                                                                 │
│           ▼                                                                 │
│  ┌──────────────────────────────────────────┐                               │
│  │  Supabase Auth 응답 확인                   │                               │
│  │                                          │                               │
│  │  에러 메시지에 "email not confirmed" 포함? │                               │
│  └────────┬─────────────────┬───────────────┘                               │
│           │ YES             │ NO                                            │
│           ▼                 ▼                                               │
│  ┌────────────────┐  ┌─────────────────────┐                                │
│  │ 로그인 차단     │  │ 추가 확인:           │                                │
│  │ needsEmail     │  │ user.email_         │                                │
│  │ Confirmation   │  │ confirmed_at 존재?  │                                │
│  │ = true         │  └──────┬──────────────┘                                │
│  └────────────────┘         │                                               │
│                             ▼                                               │
│                   ┌─────────────────────┐                                   │
│                   │ YES: 로그인 성공     │                                   │
│                   │ NO: 로그인 차단      │                                   │
│                   └─────────────────────┘                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 데이터베이스 구조

### auth.users 테이블 (Supabase 관리)

```sql
-- Supabase Auth가 자동으로 관리하는 테이블
-- email_confirmed_at이 NULL이면 미인증 상태
CREATE TABLE auth.users (
  id UUID PRIMARY KEY,
  email TEXT,
  email_confirmed_at TIMESTAMPTZ,  -- 이메일 인증 완료 시간 (NULL = 미인증)
  -- ... 기타 컬럼
);
```

### profiles 테이블

```sql
-- 이메일 인증 관련 컬럼
email TEXT,
email_confirmed BOOLEAN DEFAULT false,      -- 인증 여부 (동기화용)
email_confirmed_at TIMESTAMPTZ,             -- 인증 시간 (동기화용)
```

### 트리거 함수

#### 1. handle_new_user() - 회원가입 시

```sql
-- 트리거: on_auth_user_created (INSERT on auth.users)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, full_name, nickname, public_id)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'nickname',
    substr(md5(random()::text), 1, 8)  -- 추천 코드용 public_id 자동 생성
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    nickname = EXCLUDED.nickname;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### 2. handle_email_confirmation() - 이메일 인증 시

```sql
-- 트리거: on_email_confirmed (UPDATE on auth.users)
CREATE OR REPLACE FUNCTION handle_email_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- 이메일이 새로 확인된 경우 (이전에 NULL이었고 이제 값이 있는 경우)
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.profiles
    SET
      email_confirmed = true,
      email_confirmed_at = NEW.email_confirmed_at
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 서버 액션

### 1. 회원가입 (`signup.ts`)

| 함수 | 설명 |
|------|------|
| `signUp()` | 회원가입 처리, Supabase Auth가 자동으로 인증 이메일 발송 |
| `resendConfirmation(email)` | 이메일로 인증 메일 재발송 |
| `resendConfirmationByUsername(username)` | 아이디로 인증 메일 재발송 |

### 2. 로그인 (`auth.ts`)

| 함수 | 설명 |
|------|------|
| `signIn()` | 로그인 시 이메일 인증 여부 확인, 미인증 시 `needsEmailConfirmation: true` 반환 |

```typescript
// 로그인 응답 타입
interface SignInResponse {
  success: boolean
  data?: { user: User; session: Session }
  error?: string
  needsEmailConfirmation?: boolean  // 이메일 인증 필요 여부
}
```

### 3. 관리자 기능 (`email-verification.ts`)

| 함수 | 설명 |
|------|------|
| `confirmUserEmail(userId)` | 관리자가 수동으로 이메일 인증 처리 |
| `getAllUsersEmailStatus()` | 모든 사용자의 이메일 인증 상태 조회 |

```typescript
// 관리자가 이메일 인증 처리
const result = await confirmUserEmail(userId)

// 내부적으로 다음을 수행:
// 1. adminSupabase.auth.admin.updateUserById(userId, { email_confirm: true })
// 2. profiles 테이블 동기화
```

---

## UI 컴포넌트

### 로그인 페이지 (`signin/page.tsx`)

미인증 사용자가 로그인 시도 시:

```tsx
{needsEmailConfirmation && (
  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
    <AlertCircle className="w-5 h-5 text-yellow-600" />
    <p>이메일 인증이 필요합니다</p>
    <p>회원가입 시 입력한 이메일로 발송된 인증 메일을 확인해주세요.</p>
    <button onClick={handleResendEmail}>
      {resendingEmail ? '발송 중...' : '인증 이메일 재발송'}
    </button>
  </div>
)}
```

### 관리자 페이지 (`admin/users/page.tsx`)

- 사용자 목록에 이메일 인증 상태 뱃지 표시
- 미인증 사용자에게 "이메일 인증 처리" 버튼 표시

---

## 인증 방법 비교

| 방법 | 설명 | 사용 시점 |
|------|------|----------|
| **자동 인증** | 사용자가 이메일 링크 클릭 | 일반적인 경우 |
| **수동 인증** | 관리자가 관리 페이지에서 처리 | 이메일 수신 불가, 테스트 계정 등 |
| **SQL 직접 수정** | `UPDATE auth.users SET email_confirmed_at = NOW()` | 긴급 상황 |

---

## 관련 파일

```
src/
├── domains/
│   ├── auth/
│   │   ├── actions/
│   │   │   ├── signup.ts          # 회원가입, 인증 이메일 재발송
│   │   │   └── auth.ts            # 로그인 시 인증 체크
│   │   └── types/
│   │       └── index.ts           # SignInResponse (needsEmailConfirmation)
│   └── admin/
│       └── actions/
│           └── email-verification.ts  # 관리자 수동 인증
├── app/
│   ├── (auth)/
│   │   └── signin/
│   │       └── page.tsx           # 로그인 페이지 (인증 필요 UI)
│   └── admin/
│       └── users/
│           └── page.tsx           # 관리자 사용자 관리
```

---

## 마이그레이션 히스토리

| 마이그레이션 | 설명 |
|-------------|------|
| `add_email_confirmed_to_profiles` | profiles 테이블에 email_confirmed, email_confirmed_at 컬럼 추가 |
| `fix_handle_new_user_add_public_id` | handle_new_user 트리거에 public_id 생성 추가 |

---

## 트러블슈팅

### 1. "아이디 또는 비밀번호가 올바르지 않습니다" (실제로는 이메일 미인증)

**원인**: Supabase Auth가 미인증 사용자 로그인 시 `Email not confirmed` 에러를 반환하는데, 이를 제대로 처리하지 않음

**해결**: `auth.ts`에서 에러 메시지를 먼저 체크
```typescript
if (errorMsg.includes('email not confirmed')) {
  return { needsEmailConfirmation: true, ... }
}
```

### 2. profiles.email_confirmed를 true로 변경해도 로그인 안됨

**원인**: 실제 인증 상태는 `auth.users.email_confirmed_at`에서 확인

**해결**: SQL Editor에서 auth.users 직접 수정 또는 관리자 페이지에서 "이메일 인증 처리" 버튼 사용
```sql
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = '이메일주소';
```

### 3. 인증 이메일이 오지 않음

**확인 사항**:
1. Supabase 대시보드 > Authentication > Email Templates 설정 확인
2. 스팸 폴더 확인
3. 로그인 페이지에서 "인증 이메일 재발송" 버튼 사용

---

## Supabase 대시보드 설정

### Authentication > Email Templates

인증 이메일 템플릿 설정:
- Subject: 이메일 제목
- Message: 이메일 본문 ({{ .ConfirmationURL }} 변수 포함)

### Authentication > URL Configuration

- Site URL: 인증 후 리다이렉트될 URL
- Redirect URLs: 허용된 리다이렉트 URL 목록
