# 핵심 서버 액션 테스트 전략

## 1. 개요

서버 액션에 대한 단위 테스트 작성 전략 문서입니다.

**작성일:** 2026-01-19
**관련 태스크:** #12 (code-review-2026-01-17.md)
**목표:** 핵심 서버 액션의 안정성 확보
**테스트 프레임워크:** Vitest

---

## 2. 현재 상태 분석

### 2.1 서버 액션 현황

| 도메인 | 파일 수 | 중요도 |
|--------|---------|--------|
| livescore | 31 | 중 |
| boards | 22 | 상 |
| settings | 10 | 중 |
| search | 8 | 하 |
| auth | 7 | **최상** |
| widgets | 6 | 하 |
| sidebar | 5 | 하 |
| notifications | 5 | 중 |
| user | 3 | 중 |
| prediction | 3 | 하 |
| chatbot | 3 | 하 |
| shop | 2 | **상** |
| admin | 2 | 중 |
| 기타 | 5 | 하 |
| **총계** | **113개** | |

### 2.2 테스트 환경 현황

```
vitest.config.ts  ✅ 존재
tests/setup.ts    ✅ 완료
tests/unit/**     ✅ 완료 (7개 파일)
테스트 개수       ✅ 106개 (전체 통과)
```

---

## 3. 우선순위 기준

### 3.1 테스트 우선순위 결정 요소

| 요소 | 가중치 | 설명 |
|------|--------|------|
| 보안 관련 | 5 | 인증, 권한, 데이터 보호 |
| 금전 관련 | 5 | 결제, 포인트, 상품 |
| 사용 빈도 | 4 | DAU 기준 호출 빈도 |
| 데이터 변경 | 3 | CREATE/UPDATE/DELETE |
| 복잡도 | 2 | 비즈니스 로직 복잡성 |

### 3.2 우선순위 분류

```
P0 (즉시): 보안 + 금전 관련
├── auth/auth.ts (로그인/로그아웃)
├── auth/signup.ts (회원가입)
├── auth/password.ts (비밀번호)
├── shop/actions.ts (구매)
└── shop/consumables.ts (소비)

P1 (높음): 핵심 CRUD
├── boards/posts/create.ts
├── boards/posts/delete.ts
├── boards/comments/create.ts
├── boards/comments/delete.ts
└── settings/profile.ts

P2 (중간): 주요 조회
├── boards/getPosts.ts
├── boards/getPostDetails.ts
├── notifications/get.ts
└── user/getPublicProfile.ts

P3 (낮음): 기타
├── search/*
├── sidebar/*
└── widgets/*
```

---

## 4. 테스트 대상 상세 (P0 + P1)

### 4.1 P0: 인증 관련 (auth)

| 파일 | 함수 | 테스트 케이스 |
|------|------|---------------|
| `auth.ts` | `signIn()` | 성공, 잘못된 비밀번호, 존재하지 않는 유저, 정지된 계정 |
| `auth.ts` | `signOut()` | 성공, 세션 없음 |
| `signup.ts` | `signUp()` | 성공, 중복 이메일, 중복 닉네임, 유효성 실패 |
| `password.ts` | `changePassword()` | 성공, 현재 비밀번호 불일치, 새 비밀번호 유효성 |
| `password.ts` | `resetPassword()` | 성공, 만료된 토큰, 잘못된 토큰 |
| `recovery.ts` | `sendRecoveryEmail()` | 성공, 존재하지 않는 이메일 |

### 4.2 P0: 상점 관련 (shop)

| 파일 | 함수 | 테스트 케이스 |
|------|------|---------------|
| `actions.ts` | `purchaseItem()` | 성공, 포인트 부족, 품절, 이미 소유 |
| `actions.ts` | `getShopItems()` | 성공, 카테고리 필터 |
| `consumables.ts` | `useConsumable()` | 성공, 미소유, 사용 조건 불충족 |

### 4.3 P1: 게시판 관련 (boards)

| 파일 | 함수 | 테스트 케이스 |
|------|------|---------------|
| `posts/create.ts` | `createPost()` | 성공, 권한 없음, 유효성 실패, 금지어 포함 |
| `posts/delete.ts` | `deletePost()` | 성공, 권한 없음, 이미 삭제됨 |
| `posts/update.ts` | `updatePost()` | 성공, 권한 없음, 유효성 실패 |
| `posts/likes.ts` | `togglePostLike()` | 좋아요 추가, 좋아요 취소 |
| `comments/create.ts` | `createComment()` | 성공, 권한 없음, 게시글 없음 |
| `comments/delete.ts` | `deleteComment()` | 성공, 권한 없음 |

### 4.4 P1: 설정 관련 (settings)

| 파일 | 함수 | 테스트 케이스 |
|------|------|---------------|
| `profile.ts` | `updateProfile()` | 성공, 중복 닉네임, 유효성 실패 |
| `account.ts` | `deleteAccount()` | 성공, 비밀번호 불일치 |

---

## 5. 테스트 환경 설정

### 5.1 필요 파일 구조

```
tests/
├── setup.ts                    # 테스트 환경 설정
├── mocks/
│   ├── supabase.ts            # Supabase 클라이언트 목
│   └── next-headers.ts        # cookies, headers 목
└── unit/
    ├── auth/
    │   ├── auth.test.ts
    │   ├── signup.test.ts
    │   └── password.test.ts
    ├── shop/
    │   ├── actions.test.ts
    │   └── consumables.test.ts
    ├── boards/
    │   ├── posts/
    │   │   ├── create.test.ts
    │   │   ├── delete.test.ts
    │   │   └── likes.test.ts
    │   └── comments/
    │       ├── create.test.ts
    │       └── delete.test.ts
    └── settings/
        └── profile.test.ts
```

### 5.2 setup.ts 내용

```typescript
// tests/setup.ts
import { vi } from 'vitest';

// Next.js 서버 컴포넌트 모킹
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn(() => new Map()),
}));

// Supabase 클라이언트 모킹
vi.mock('@/shared/api/supabaseServer', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// 기본 Supabase 목 객체
export const mockSupabaseClient = {
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  })),
};

// 테스트 유틸리티
export function createMockUser(overrides = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    ...overrides,
  };
}

export function createMockPost(overrides = {}) {
  return {
    id: 1,
    title: 'Test Post',
    content: 'Test Content',
    user_id: 'test-user-id',
    ...overrides,
  };
}
```

### 5.3 Supabase Mock 패턴

```typescript
// tests/mocks/supabase.ts
import { vi } from 'vitest';

export function createSupabaseMock() {
  const chainMock = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  };

  return {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(() => chainMock),
    rpc: vi.fn(),
  };
}

// 성공 응답 헬퍼
export function mockSuccess<T>(data: T) {
  return { data, error: null };
}

// 에러 응답 헬퍼
export function mockError(message: string, code?: string) {
  return { data: null, error: { message, code } };
}
```

---

## 6. 테스트 작성 예시

### 6.1 인증 테스트 예시

```typescript
// tests/unit/auth/auth.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signIn, signOut } from '@/domains/auth/actions/auth';
import { mockSupabaseClient } from '../../setup';

describe('signIn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('올바른 자격 증명으로 로그인 성공', async () => {
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'user-1' }, session: {} },
      error: null,
    });

    const result = await signIn({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(true);
    expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('잘못된 비밀번호로 로그인 실패', async () => {
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    });

    const result = await signIn({
      email: 'test@example.com',
      password: 'wrongpassword',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid');
  });

  it('정지된 계정 로그인 차단', async () => {
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'user-1' }, session: {} },
      error: null,
    });

    // 프로필에서 정지 상태 확인
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { is_suspended: true, suspension_reason: '규정 위반' },
        error: null,
      }),
    });

    const result = await signIn({
      email: 'suspended@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('정지');
  });
});
```

### 6.2 게시글 생성 테스트 예시

```typescript
// tests/unit/boards/posts/create.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPost } from '@/domains/boards/actions/posts/create';
import { mockSupabaseClient, createMockUser } from '../../../setup';

describe('createPost', () => {
  const mockUser = createMockUser();

  beforeEach(() => {
    vi.clearAllMocks();
    // 기본: 인증된 사용자
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  it('정상적인 게시글 생성', async () => {
    mockSupabaseClient.from.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 1, post_number: 1 },
        error: null,
      }),
    });

    const result = await createPost({
      boardSlug: 'free',
      title: '테스트 제목',
      content: '테스트 내용',
    });

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe(1);
  });

  it('로그인하지 않은 사용자 차단', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await createPost({
      boardSlug: 'free',
      title: '테스트',
      content: '내용',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('로그인');
  });

  it('제목 유효성 검사 실패', async () => {
    const result = await createPost({
      boardSlug: 'free',
      title: '', // 빈 제목
      content: '내용',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('제목');
  });

  it('금지어 포함 시 차단', async () => {
    // 금지어 목록 조회 모킹
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { banned_words: ['금지어1', '금지어2'] },
        error: null,
      }),
    });

    const result = await createPost({
      boardSlug: 'free',
      title: '금지어1 포함 제목',
      content: '내용',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('금지');
  });
});
```

---

## 7. 구현 계획

### Phase 1: 테스트 환경 구축 (Day 1)

- [ ] `tests/setup.ts` 생성
- [ ] `tests/mocks/supabase.ts` 생성
- [ ] `tests/mocks/next-headers.ts` 생성
- [ ] 테스트 실행 확인 (`npm run test`)

### Phase 2: P0 테스트 작성 (Day 2-3)

- [ ] `auth/auth.test.ts` (signIn, signOut)
- [ ] `auth/signup.test.ts`
- [ ] `auth/password.test.ts`
- [ ] `shop/actions.test.ts`
- [ ] `shop/consumables.test.ts`

### Phase 3: P1 테스트 작성 (Day 4-5)

- [ ] `boards/posts/create.test.ts`
- [ ] `boards/posts/delete.test.ts`
- [ ] `boards/comments/create.test.ts`
- [ ] `boards/comments/delete.test.ts`
- [ ] `settings/profile.test.ts`

### Phase 4: 검증 및 CI 연동 (Day 6)

- [ ] 전체 테스트 실행
- [ ] 커버리지 확인
- [ ] (옵션) GitHub Actions CI 연동

---

## 8. 성공 기준

| 항목 | 목표 |
|------|------|
| P0 테스트 커버리지 | 80%+ |
| P1 테스트 커버리지 | 60%+ |
| 테스트 통과율 | 100% |
| CI 연동 | (옵션) |

---

## 9. 체크리스트

### 환경 구축
- [x] `tests/setup.ts` 생성
- [x] Supabase 모킹 (setup.ts 내 통합)
- [x] 테스트 실행 확인

### P0 테스트
- [x] `auth/auth.test.ts` (13개 테스트)
- [x] `auth/signup.test.ts` (16개 테스트)
- [ ] `auth/password.test.ts` (추후 작업)
- [x] `shop/actions.test.ts` (12개 테스트)
- [x] `shop/consumables.test.ts` (15개 테스트)

### P1 테스트
- [x] `boards/posts.test.ts` (17개 테스트) - create, delete 포함
- [x] `boards/comments.test.ts` (13개 테스트) - create, delete 포함
- [x] `settings/profile.test.ts` (20개 테스트)

---

## 10. 결과 요약

| 구분 | 파일 | 테스트 수 | 상태 |
|------|------|-----------|------|
| 환경 | `tests/setup.ts` | - | ✅ 완료 |
| P0 | `auth/auth.test.ts` | 13 | ✅ 완료 |
| P0 | `auth/signup.test.ts` | 16 | ✅ 완료 |
| P0 | `shop/actions.test.ts` | 12 | ✅ 완료 |
| P0 | `shop/consumables.test.ts` | 15 | ✅ 완료 |
| P1 | `boards/posts.test.ts` | 17 | ✅ 완료 |
| P1 | `boards/comments.test.ts` | 13 | ✅ 완료 |
| P1 | `settings/profile.test.ts` | 20 | ✅ 완료 |
| **총계** | **7개 파일** | **106개** | **✅ 100% 통과** |

---

*작성일: 2026-01-19*
*완료일: 2026-01-19*
*태스크: #12 핵심 서버 액션 테스트*
*상태: ✅ 완료*
