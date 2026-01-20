/**
 * auth/signup.ts 테스트
 *
 * 회원가입 관련 서버 액션 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  signUp,
  checkEmailAvailability,
  checkUsernameAvailability,
  checkNicknameAvailability,
  resendConfirmation,
} from '@/domains/auth/actions/signup';
import {
  mockSupabaseClient,
  mockSuccess,
  mockError,
  createMockUser,
} from '../../setup';

// Turnstile 검증을 위한 fetch 모킹
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('signUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 기본적으로 Turnstile 검증 성공
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    });
  });

  describe('입력 검증', () => {
    it('유효하지 않은 이메일 형식 거부', async () => {
      const result = await signUp('invalid-email', 'Password123!', {}, 'token');

      expect(result.success).toBe(false);
      expect(result.error).toContain('이메일');
    });

    it('짧은 비밀번호 거부', async () => {
      const result = await signUp('test@example.com', '123', {}, 'token');

      expect(result.success).toBe(false);
      expect(result.error).toContain('비밀번호');
    });
  });

  describe('Turnstile 캡차 검증', () => {
    it('캡차 토큰 없이 회원가입 거부', async () => {
      const result = await signUp('test@example.com', 'Password123!', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('보안 확인');
    });

    it('캡차 검증 실패 시 회원가입 거부', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ success: false }),
      });

      const result = await signUp('test@example.com', 'Password123!', {}, 'invalid-token');

      expect(result.success).toBe(false);
      expect(result.error).toContain('보안 확인에 실패');
    });
  });

  describe('회원가입 처리', () => {
    it('회원가입 성공', async () => {
      const mockUser = createMockUser({ email_confirmed_at: null });

      mockSupabaseClient.auth.signUp.mockResolvedValue(
        mockSuccess({ user: mockUser, session: null })
      );

      // 프로필 생성 대기 (waitForProfile)
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue(mockSuccess({ id: mockUser.id })),
      });

      const result = await signUp(
        'test@example.com',
        'Password123!',
        { username: 'newuser', nickname: '새유저' },
        'valid-token'
      );

      expect(result.success).toBe(true);
      expect(result.data?.user).toBeDefined();
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!',
        options: {
          data: { username: 'newuser', nickname: '새유저' },
        },
      });
    });

    it('이메일 중복 시 회원가입 실패', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValue(
        mockError('User already registered')
      );

      const result = await signUp('existing@example.com', 'Password123!', {}, 'token');

      expect(result.success).toBe(false);
      expect(result.error).toContain('already registered');
    });
  });
});

describe('checkEmailAvailability', () => {
  it('사용 가능한 이메일', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(mockSuccess([])),
    });

    const result = await checkEmailAvailability('new@example.com');

    expect(result.available).toBe(true);
    expect(result.message).toContain('사용 가능');
  });

  it('이미 사용 중인 이메일', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(mockSuccess([{ id: 'existing-user' }])),
    });

    const result = await checkEmailAvailability('existing@example.com');

    expect(result.available).toBe(false);
    expect(result.message).toContain('이미 사용 중');
  });

  it('유효하지 않은 이메일 형식', async () => {
    const result = await checkEmailAvailability('invalid-email');

    expect(result.available).toBe(false);
    expect(result.message).toBeDefined();
  });
});

describe('checkUsernameAvailability', () => {
  it('사용 가능한 아이디', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(mockSuccess([])),
    });

    const result = await checkUsernameAvailability('newusername');

    expect(result.available).toBe(true);
    expect(result.message).toContain('사용 가능');
  });

  it('이미 사용 중인 아이디', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(mockSuccess([{ id: 'existing-user' }])),
    });

    const result = await checkUsernameAvailability('existinguser');

    expect(result.available).toBe(false);
    expect(result.message).toContain('이미 사용 중');
  });
});

describe('checkNicknameAvailability', () => {
  it('사용 가능한 닉네임', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(mockSuccess([])),
    });

    const result = await checkNicknameAvailability('새닉네임');

    expect(result.available).toBe(true);
    expect(result.message).toContain('사용 가능');
  });

  it('이미 사용 중인 닉네임', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(mockSuccess([{ id: 'existing-user' }])),
    });

    const result = await checkNicknameAvailability('기존닉네임');

    expect(result.available).toBe(false);
    expect(result.message).toContain('이미 사용 중');
  });
});

describe('resendConfirmation', () => {
  it('인증 이메일 재발송 성공', async () => {
    mockSupabaseClient.auth.resend.mockResolvedValue({ error: null });

    const result = await resendConfirmation('test@example.com');

    expect(result.success).toBe(true);
    expect(result.message).toContain('재발송');
    expect(mockSupabaseClient.auth.resend).toHaveBeenCalledWith({
      type: 'signup',
      email: 'test@example.com',
    });
  });

  it('잘못된 이메일로 재발송 실패', async () => {
    const result = await resendConfirmation('invalid-email');

    expect(result.success).toBe(false);
  });

  it('재발송 중 오류 처리', async () => {
    mockSupabaseClient.auth.resend.mockResolvedValue({
      error: { message: 'Rate limit exceeded' },
    });

    const result = await resendConfirmation('test@example.com');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Rate limit');
  });
});
