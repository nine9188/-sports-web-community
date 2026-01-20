/**
 * Vitest 테스트 환경 설정
 *
 * 서버 액션 테스트를 위한 모킹 설정
 */
import { vi, beforeEach } from 'vitest';

// ============================================================================
// 환경 변수 설정
// ============================================================================

// Turnstile 테스트용 비밀키
process.env.TURNSTILE_SECRET_KEY = 'test-turnstile-secret-key';

// ============================================================================
// Next.js 모킹
// ============================================================================

// next/cache 모킹
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// next/navigation 모킹
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error('NOT_FOUND');
  }),
}));

// next/headers 모킹
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn(() => []),
  })),
  headers: vi.fn(() => new Map([
    ['x-forwarded-for', '127.0.0.1'],
  ])),
}));

// ============================================================================
// Supabase 모킹
// ============================================================================

// 체이닝 가능한 쿼리 빌더 생성
export function createChainMock() {
  const mock: Record<string, ReturnType<typeof vi.fn>> = {};

  const chainMethods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
    'like', 'ilike', 'is', 'in', 'contains',
    'or', 'and', 'not', 'filter',
    'order', 'limit', 'range', 'offset',
    'single', 'maybeSingle', 'csv',
    'returns', 'throwOnError',
  ];

  chainMethods.forEach(method => {
    mock[method] = vi.fn().mockReturnThis();
  });

  // 기본 반환값 설정
  mock.single = vi.fn().mockResolvedValue({ data: null, error: null });
  mock.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });

  return mock;
}

// Supabase 클라이언트 목
export const mockSupabaseClient = {
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
    getSession: vi.fn(),
    refreshSession: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    resend: vi.fn(),
  },
  from: vi.fn(() => createChainMock()),
  rpc: vi.fn(),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      download: vi.fn(),
      remove: vi.fn(),
      getPublicUrl: vi.fn(),
    })),
  },
};

// Supabase 서버 클라이언트 모킹
vi.mock('@/shared/lib/supabase/server', () => ({
  getSupabaseServer: vi.fn(() => Promise.resolve(mockSupabaseClient)),
  getSupabaseAction: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

// Supabase API 클라이언트 모킹 (레거시)
vi.mock('@/shared/api/supabaseServer', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

// ============================================================================
// 공통 액션 모킹
// ============================================================================

// 로그 액션 모킹
vi.mock('@/shared/actions/log-actions', () => ({
  logAuthEvent: vi.fn(),
  logError: vi.fn(),
}));

// 출석 액션 모킹
vi.mock('@/shared/actions/attendance-actions', () => ({
  recordDailyLogin: vi.fn().mockResolvedValue({ success: true }),
}));

// 알림 액션 모킹
vi.mock('@/domains/notifications/actions/create', () => ({
  createWelcomeNotification: vi.fn().mockResolvedValue({ success: true }),
}));

// 추천 액션 모킹
vi.mock('@/shared/actions/referral-actions', () => ({
  processReferral: vi.fn().mockResolvedValue({ success: true }),
}));

// 로그인 시도 모킹
vi.mock('@/domains/auth/actions/utils/login-attempts', () => ({
  checkLoginAttempts: vi.fn().mockResolvedValue({ isBlocked: false }),
  recordAttempt: vi.fn(),
  clearAttempts: vi.fn(),
}));

// ============================================================================
// 테스트 유틸리티
// ============================================================================

/**
 * 성공 응답 생성
 */
export function mockSuccess<T>(data: T) {
  return { data, error: null };
}

/**
 * 에러 응답 생성
 */
export function mockError(message: string, code?: string) {
  return { data: null, error: { message, code } };
}

/**
 * 테스트용 사용자 생성
 */
export function createMockUser(overrides: Partial<{
  id: string;
  email: string;
  email_confirmed_at: string | null;
}> = {}) {
  return {
    id: 'test-user-id-123',
    email: 'test@example.com',
    email_confirmed_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * 테스트용 프로필 생성
 */
export function createMockProfile(overrides: Partial<{
  id: string;
  email: string;
  username: string;
  nickname: string;
  email_confirmed: boolean;
}> = {}) {
  return {
    id: 'test-user-id-123',
    email: 'test@example.com',
    username: 'testuser',
    nickname: '테스트유저',
    email_confirmed: true,
    ...overrides,
  };
}

/**
 * 테스트용 세션 생성
 */
export function createMockSession(overrides = {}) {
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    ...overrides,
  };
}

// ============================================================================
// 테스트 라이프사이클
// ============================================================================

// 각 테스트 전에 모든 목 초기화
beforeEach(() => {
  vi.clearAllMocks();

  // 기본 응답 재설정
  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: null,
  });

  mockSupabaseClient.auth.getSession.mockResolvedValue({
    data: { session: null },
    error: null,
  });
});
