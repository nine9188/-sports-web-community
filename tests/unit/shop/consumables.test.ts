/**
 * shop/consumables.ts 테스트
 *
 * 소모품 아이템 사용 관련 서버 액션 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  useNicknameTicket,
  hasNicknameTicket,
  getNicknameTicketCount,
} from '@/domains/shop/actions/consumables';
import {
  mockSupabaseClient,
  mockSuccess,
  mockError,
  createMockUser,
} from '../../setup';

// 알림 생성 모킹
vi.mock('@/domains/notifications/actions/create', () => ({
  createProfileUpdateNotification: vi.fn().mockResolvedValue({ success: true }),
}));

describe('useNicknameTicket', () => {
  const mockUser = createMockUser();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('인증 확인', () => {
    it('로그인 필요', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue(
        mockSuccess({ user: null })
      );

      const result = await useNicknameTicket('새닉네임');

      expect(result.success).toBe(false);
      expect(result.error).toContain('로그인');
    });
  });

  describe('닉네임 유효성 검사', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue(
        mockSuccess({ user: mockUser })
      );
    });

    it('짧은 닉네임 거부', async () => {
      const result = await useNicknameTicket('a');

      expect(result.success).toBe(false);
      expect(result.error).toContain('최소 2자');
    });

    it('긴 닉네임 거부', async () => {
      const result = await useNicknameTicket('a'.repeat(21));

      expect(result.success).toBe(false);
      expect(result.error).toContain('최대 20자');
    });

    it('금지어 포함 닉네임 거부', async () => {
      const result = await useNicknameTicket('admin123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('사용할 수 없는');
    });

    it('관리자 포함 닉네임 거부', async () => {
      const result = await useNicknameTicket('관리자테스트');

      expect(result.success).toBe(false);
      expect(result.error).toContain('사용할 수 없는');
    });
  });

  describe('닉네임 중복 체크', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue(
        mockSuccess({ user: mockUser })
      );
    });

    it('중복된 닉네임 거부', async () => {
      // 중복 닉네임 존재
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue(mockSuccess({ id: 'other-user' })),
      });

      const result = await useNicknameTicket('중복닉네임');

      expect(result.success).toBe(false);
      expect(result.error).toContain('이미 사용 중');
    });
  });

  describe('변경권 보유 확인', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue(
        mockSuccess({ user: mockUser })
      );
    });

    it('변경권 미보유 시 실패', async () => {
      // 닉네임 중복 체크 통과
      const fromMock = vi.fn();
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue(mockSuccess(null)),
      });
      // 변경권 조회 실패
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue(mockSuccess(null)),
      });

      mockSupabaseClient.from = fromMock;

      const result = await useNicknameTicket('새닉네임');

      expect(result.success).toBe(false);
      expect(result.error).toContain('닉네임 변경권이 없습니다');
    });
  });

  describe('닉네임 변경 성공', () => {
    it('정상적인 닉네임 변경', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue(
        mockSuccess({ user: mockUser })
      );

      const fromMock = vi.fn();

      // 1. 닉네임 중복 체크
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue(mockSuccess(null)),
      });

      // 2. 변경권 보유 확인
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue(mockSuccess({
          id: 'user-item-1',
          item_id: 100,
          shop_items: { consumable_type: 'nickname_change' },
        })),
      });

      // 3. 현재 프로필 조회
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccess({ nickname: '이전닉네임' })),
      });

      // 4. 닉네임 업데이트
      fromMock.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(mockSuccess({})),
      });

      // 5. 사용 기록 저장
      fromMock.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue(mockSuccess({})),
      });

      // 6. 티켓 삭제
      fromMock.mockReturnValueOnce({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(mockSuccess({})),
      });

      mockSupabaseClient.from = fromMock;

      const result = await useNicknameTicket('새닉네임');

      expect(result.success).toBe(true);
      expect(result.newNickname).toBe('새닉네임');
    });

    it('같은 닉네임으로 변경 시도 거부', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue(
        mockSuccess({ user: mockUser })
      );

      const fromMock = vi.fn();

      // 1. 닉네임 중복 체크 (본인 제외하면 없음)
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue(mockSuccess(null)),
      });

      // 2. 변경권 보유 확인
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue(mockSuccess({
          id: 'user-item-1',
          item_id: 100,
        })),
      });

      // 3. 현재 프로필 조회 (같은 닉네임)
      fromMock.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccess({ nickname: '같은닉네임' })),
      });

      mockSupabaseClient.from = fromMock;

      const result = await useNicknameTicket('같은닉네임');

      expect(result.success).toBe(false);
      expect(result.error).toContain('현재 닉네임과 동일');
    });
  });
});

describe('hasNicknameTicket', () => {
  it('변경권 보유 시 true', async () => {
    const mockUser = createMockUser();

    mockSupabaseClient.auth.getUser.mockResolvedValue(
      mockSuccess({ user: mockUser })
    );

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue(mockSuccess({ id: 'user-item-1' })),
    });

    const result = await hasNicknameTicket();

    expect(result).toBe(true);
  });

  it('변경권 미보유 시 false', async () => {
    const mockUser = createMockUser();

    mockSupabaseClient.auth.getUser.mockResolvedValue(
      mockSuccess({ user: mockUser })
    );

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue(mockSuccess(null)),
    });

    const result = await hasNicknameTicket();

    expect(result).toBe(false);
  });

  it('로그인 안됨 시 false', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue(
      mockSuccess({ user: null })
    );

    const result = await hasNicknameTicket();

    expect(result).toBe(false);
  });
});

describe('getNicknameTicketCount', () => {
  it('변경권 개수 반환', async () => {
    const mockUser = createMockUser();

    mockSupabaseClient.auth.getUser.mockResolvedValue(
      mockSuccess({ user: mockUser })
    );

    // count: 'exact' 사용 시 eq가 { count, error }를 반환해야 함
    const eqMock = vi.fn().mockResolvedValue({ count: 3, error: null });
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: eqMock,
        }),
      }),
    });

    const count = await getNicknameTicketCount();

    expect(count).toBe(3);
  });

  it('로그인 안됨 시 0', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue(
      mockSuccess({ user: null })
    );

    const count = await getNicknameTicketCount();

    expect(count).toBe(0);
  });

  it('userId 직접 전달', async () => {
    const eqMock = vi.fn().mockResolvedValue({ count: 5, error: null });
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: eqMock,
        }),
      }),
    });

    const count = await getNicknameTicketCount('specific-user-id');

    expect(count).toBe(5);
  });
});
