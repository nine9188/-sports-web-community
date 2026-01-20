/**
 * auth/auth.ts 테스트
 *
 * 로그인, 로그아웃 관련 서버 액션 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signIn, signOut, getCurrentUser } from '@/domains/auth/actions/auth';
import {
  mockSupabaseClient,
  mockSuccess,
  mockError,
  createMockUser,
  createMockProfile,
  createMockSession,
} from '../../setup';
import { checkLoginAttempts, recordAttempt, clearAttempts } from '@/domains/auth/actions/utils/login-attempts';

// 타입 캐스팅 for vi.fn()
const mockCheckLoginAttempts = checkLoginAttempts as ReturnType<typeof vi.fn>;
const mockRecordAttempt = recordAttempt as ReturnType<typeof vi.fn>;
const mockClearAttempts = clearAttempts as ReturnType<typeof vi.fn>;

describe('signIn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckLoginAttempts.mockResolvedValue({ isBlocked: false });
  });

  describe('입력 검증', () => {
    it('아이디 미입력 시 실패', async () => {
      const result = await signIn('', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('아이디와 비밀번호를 입력');
    });

    it('비밀번호 미입력 시 실패', async () => {
      const result = await signIn('testuser', '');

      expect(result.success).toBe(false);
      expect(result.error).toContain('아이디와 비밀번호를 입력');
    });
  });

  describe('로그인 시도 제한', () => {
    it('차단된 사용자 로그인 거부', async () => {
      mockCheckLoginAttempts.mockResolvedValue({
        isBlocked: true,
        message: '너무 많은 로그인 시도입니다. 15분 후 다시 시도해주세요.',
      });

      const result = await signIn('testuser', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('너무 많은 로그인 시도');
    });
  });

  describe('사용자 조회', () => {
    it('존재하지 않는 아이디로 로그인 실패', async () => {
      // profiles 테이블에서 사용자 조회 실패
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockError('No rows found')),
      });

      const result = await signIn('nonexistent', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('아이디 또는 비밀번호가 올바르지 않습니다');
      expect(mockRecordAttempt).toHaveBeenCalledWith('nonexistent', 'invalid_username');
    });
  });

  describe('비밀번호 검증', () => {
    it('잘못된 비밀번호로 로그인 실패', async () => {
      const mockProfile = createMockProfile();

      // 프로필 조회 성공
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccess(mockProfile)),
      });

      // 로그인 실패 (비밀번호 오류)
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(
        mockError('Invalid login credentials')
      );

      const result = await signIn('testuser', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toContain('아이디 또는 비밀번호가 올바르지 않습니다');
      expect(mockRecordAttempt).toHaveBeenCalledWith('testuser', 'invalid_password');
    });
  });

  describe('이메일 미인증', () => {
    it('이메일 미인증 사용자 로그인 거부 (Supabase 에러)', async () => {
      const mockProfile = createMockProfile({ email_confirmed: false });

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccess(mockProfile)),
      });

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(
        mockError('Email not confirmed')
      );

      const result = await signIn('testuser', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('이메일 인증이 필요합니다');
      expect(result.needsEmailConfirmation).toBe(true);
    });

    it('이메일 미인증 사용자 로그인 거부 (로그인 후 체크)', async () => {
      const mockProfile = createMockProfile({ email_confirmed: false });
      const mockUser = createMockUser({ email_confirmed_at: null });

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccess(mockProfile)),
      });

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(
        mockSuccess({ user: mockUser, session: createMockSession() })
      );

      mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null });

      const result = await signIn('testuser', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('이메일 인증이 필요합니다');
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('로그인 성공', () => {
    it('정상적인 로그인 성공', async () => {
      const mockProfile = createMockProfile();
      const mockUser = createMockUser();
      const mockSession = createMockSession();

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccess(mockProfile)),
        update: vi.fn().mockReturnThis(),
      });

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(
        mockSuccess({ user: mockUser, session: mockSession })
      );

      const result = await signIn('testuser', 'password123');

      expect(result.success).toBe(true);
      expect(result.data?.user).toBeDefined();
      expect(result.data?.session).toBeDefined();
      expect(mockClearAttempts).toHaveBeenCalledWith('testuser');
    });
  });
});

describe('signOut', () => {
  it('로그아웃 성공', async () => {
    const mockUser = createMockUser();

    mockSupabaseClient.auth.getUser.mockResolvedValue(
      mockSuccess({ user: mockUser })
    );

    mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null });

    const result = await signOut();

    expect(result.success).toBe(true);
    expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
  });

  it('로그아웃 실패 처리', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue(
      mockSuccess({ user: null })
    );

    mockSupabaseClient.auth.signOut.mockResolvedValue({
      error: { message: 'Session not found' },
    });

    const result = await signOut();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Session not found');
  });
});

describe('getCurrentUser', () => {
  it('로그인된 사용자 정보 반환', async () => {
    const mockUser = createMockUser();
    const mockProfile = createMockProfile();

    mockSupabaseClient.auth.getUser.mockResolvedValue(
      mockSuccess({ user: mockUser })
    );

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(mockSuccess(mockProfile)),
    });

    const result = await getCurrentUser();

    expect(result.user).toBeDefined();
    expect(result.user?.id).toBe(mockUser.id);
    expect(result.profile).toBeDefined();
    expect(result.profile?.username).toBe(mockProfile.username);
  });

  it('로그인되지 않은 경우 null 반환', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue(
      mockSuccess({ user: null })
    );

    const result = await getCurrentUser();

    expect(result.user).toBeNull();
    expect(result.profile).toBeUndefined();
  });

  it('에러 발생 시 null 반환', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue(
      mockError('Auth error')
    );

    const result = await getCurrentUser();

    expect(result.user).toBeNull();
  });
});
