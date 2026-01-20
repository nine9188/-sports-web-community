/**
 * settings/profile.ts 테스트
 *
 * 프로필 관련 서버 액션 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getUserProfile,
  updateProfile,
  updateProfileIcon,
  getUserIcons,
  getCurrentUserIcon,
} from '@/domains/settings/actions/profile';
import {
  mockSupabaseClient,
  mockSuccess,
  mockError,
  createMockUser,
  createMockProfile,
} from '../../setup';

// 알림 액션 모킹
vi.mock('@/domains/notifications/actions/create', () => ({
  createProfileUpdateNotification: vi.fn().mockResolvedValue({ success: true }),
}));

describe('getUserProfile', () => {
  it('프로필 조회 성공', async () => {
    const mockProfile = {
      id: 'user-1',
      nickname: '테스트유저',
      email: 'test@example.com',
      full_name: '홍길동',
      username: 'testuser',
      icon_id: null,
      updated_at: '2024-01-01T00:00:00Z',
    };

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(mockSuccess(mockProfile)),
    });

    const result = await getUserProfile('user-1');

    expect(result).not.toBeNull();
    expect(result?.nickname).toBe('테스트유저');
    expect(result?.email).toBe('test@example.com');
  });

  it('프로필 조회 실패 시 null 반환', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(mockError('Not found')),
    });

    const result = await getUserProfile('nonexistent-user');

    expect(result).toBeNull();
  });
});

describe('updateProfile', () => {
  const mockUser = createMockUser();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('입력 검증', () => {
    it('닉네임 미입력 시 실패', async () => {
      const result = await updateProfile(mockUser.id, {
        nickname: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('최소 2자');
    });

    it('닉네임이 너무 짧으면 실패', async () => {
      const result = await updateProfile(mockUser.id, {
        nickname: 'a',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('최소 2자');
    });

    it('잘못된 사용자명 형식 거부', async () => {
      const result = await updateProfile(mockUser.id, {
        nickname: '테스트유저',
        username: 'test user', // 공백 포함
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('영문자, 숫자, 언더스코어');
    });

    it('특수문자 포함 사용자명 거부', async () => {
      const result = await updateProfile(mockUser.id, {
        nickname: '테스트유저',
        username: 'test@user', // 특수문자 포함
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('영문자, 숫자, 언더스코어');
    });
  });

  describe('권한 확인', () => {
    it('로그인되지 않은 경우 실패', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue(
        mockSuccess({ user: null })
      );

      const result = await updateProfile(mockUser.id, {
        nickname: '새닉네임',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('권한');
    });

    it('타인의 프로필 수정 시도 거부', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue(
        mockSuccess({ user: { ...mockUser, id: 'different-user' } })
      );

      const result = await updateProfile(mockUser.id, {
        nickname: '새닉네임',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('권한');
    });
  });

  describe('프로필 업데이트', () => {
    it('정상적인 프로필 업데이트 성공', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue(
        mockSuccess({ user: mockUser })
      );

      const fromMock = vi.fn();

      // 1. 기존 프로필 조회
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccess({
          nickname: '이전닉네임',
          icon_id: null,
        })),
      });

      // 2. 프로필 업데이트
      fromMock.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(mockSuccess(null)),
      });

      mockSupabaseClient.from = fromMock;

      const result = await updateProfile(mockUser.id, {
        nickname: '새닉네임',
        full_name: '김철수',
        username: 'newuser',
      });

      expect(result.success).toBe(true);
    });

    it('프로필 업데이트 DB 오류', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue(
        mockSuccess({ user: mockUser })
      );

      const fromMock = vi.fn();

      // 1. 기존 프로필 조회
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccess({
          nickname: '이전닉네임',
          icon_id: null,
        })),
      });

      // 2. 프로필 업데이트 실패
      fromMock.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(mockError('Database error')),
      });

      mockSupabaseClient.from = fromMock;

      const result = await updateProfile(mockUser.id, {
        nickname: '새닉네임',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

describe('updateProfileIcon', () => {
  const mockUser = createMockUser();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('권한 확인', () => {
    it('로그인되지 않은 경우 실패', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue(
        mockSuccess({ user: null })
      );

      const result = await updateProfileIcon(mockUser.id, 123);

      expect(result.success).toBe(false);
      expect(result.error).toContain('권한');
    });

    it('타인의 아이콘 수정 시도 거부', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue(
        mockSuccess({ user: { ...mockUser, id: 'different-user' } })
      );

      const result = await updateProfileIcon(mockUser.id, 123);

      expect(result.success).toBe(false);
      expect(result.error).toContain('권한');
    });
  });

  describe('아이콘 업데이트', () => {
    it('정상적인 아이콘 업데이트', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue(
        mockSuccess({ user: mockUser })
      );

      const fromMock = vi.fn();

      // 1. 기존 아이콘 조회
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccess({ icon_id: null })),
      });

      // 2. 아이콘 업데이트
      fromMock.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(mockSuccess(null)),
      });

      mockSupabaseClient.from = fromMock;

      const result = await updateProfileIcon(mockUser.id, 123);

      expect(result.success).toBe(true);
    });

    it('아이콘 초기화 (null로 설정)', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue(
        mockSuccess({ user: mockUser })
      );

      const fromMock = vi.fn();

      // 1. 기존 아이콘 조회
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccess({ icon_id: 123 })),
      });

      // 2. 아이콘 업데이트
      fromMock.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(mockSuccess(null)),
      });

      mockSupabaseClient.from = fromMock;

      const result = await updateProfileIcon(mockUser.id, null);

      expect(result.success).toBe(true);
    });
  });
});

describe('getUserIcons', () => {
  it('사용자 아이콘 목록 조회 성공', async () => {
    const mockIcons = [
      { shop_items: { id: 1, name: '골드 아이콘', image_url: '/icon1.png' } },
      { shop_items: { id: 2, name: '실버 아이콘', image_url: '/icon2.png' } },
    ];

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue(mockSuccess(mockIcons)),
    });

    const result = await getUserIcons('user-1');

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
  });

  it('아이콘이 없는 경우 빈 배열', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue(mockSuccess([])),
    });

    const result = await getUserIcons('user-1');

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(0);
  });

  it('조회 실패 시 에러 반환', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue(mockError('Database error')),
    });

    const result = await getUserIcons('user-1');

    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
  });
});

describe('getCurrentUserIcon', () => {
  it('현재 아이콘 조회 성공', async () => {
    const fromMock = vi.fn();

    // 1. 프로필에서 icon_id 조회
    fromMock.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(mockSuccess({ icon_id: 123 })),
    });

    // 2. 아이콘 정보 조회
    fromMock.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(mockSuccess({
        id: 123,
        name: '골드 아이콘',
        image_url: '/gold-icon.png',
      })),
    });

    mockSupabaseClient.from = fromMock;

    const result = await getCurrentUserIcon('user-1');

    expect(result.success).toBe(true);
    expect(result.data).not.toBeNull();
    expect(result.data?.name).toBe('골드 아이콘');
  });

  it('아이콘이 설정되지 않은 경우 null 반환', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(mockSuccess({ icon_id: null })),
    });

    const result = await getCurrentUserIcon('user-1');

    expect(result.success).toBe(true);
    expect(result.data).toBeNull();
  });

  it('프로필 조회 실패 시 에러 반환', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(mockError('Not found')),
    });

    const result = await getCurrentUserIcon('user-1');

    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
  });
});
