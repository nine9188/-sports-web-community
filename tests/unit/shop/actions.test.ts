/**
 * shop/actions.ts 테스트
 *
 * 상점 관련 서버 액션 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getShopCategories,
  getUserPoints,
  getUserItems,
  purchaseItem,
} from '@/domains/shop/actions/actions';
import {
  mockSupabaseClient,
  mockSuccess,
  mockError,
  createMockUser,
} from '../../setup';

// 정지 확인 모킹
vi.mock('@/shared/utils/suspension-guard', () => ({
  checkSuspensionGuard: vi.fn().mockResolvedValue({ isSuspended: false }),
}));

// 로그 액션 모킹
vi.mock('@/shared/actions/log-actions', () => ({
  logUserAction: vi.fn(),
}));

import { checkSuspensionGuard } from '@/shared/utils/suspension-guard';
const mockCheckSuspension = checkSuspensionGuard as ReturnType<typeof vi.fn>;

describe('getShopCategories', () => {
  it('카테고리 목록 조회 성공', async () => {
    const mockCategories = [
      { id: 1, name: '아이콘', slug: 'icons', display_order: 1 },
      { id: 2, name: '닉네임', slug: 'nickname', display_order: 2 },
    ];

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue(mockSuccess(mockCategories)),
    });

    const result = await getShopCategories();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('아이콘');
  });

  it('카테고리 조회 실패 시 에러', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue(mockError('Database error')),
    });

    await expect(getShopCategories()).rejects.toThrow('카테고리 목록 조회 실패');
  });
});

describe('getUserPoints', () => {
  it('사용자 포인트 조회 성공', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(mockSuccess({ points: 5000 })),
    });

    const points = await getUserPoints('user-id');

    expect(points).toBe(5000);
  });

  it('userId 없으면 0 반환', async () => {
    const points = await getUserPoints(undefined);

    expect(points).toBe(0);
  });

  it('조회 실패 시 0 반환', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(mockError('Not found')),
    });

    const points = await getUserPoints('user-id');

    expect(points).toBe(0);
  });
});

describe('getUserItems', () => {
  it('보유 아이템 목록 조회', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue(
        mockSuccess([{ item_id: 1 }, { item_id: 2 }, { item_id: 3 }])
      ),
    });

    const items = await getUserItems('user-id');

    expect(items).toEqual([1, 2, 3]);
  });

  it('userId 없으면 빈 배열 반환', async () => {
    const items = await getUserItems(undefined);

    expect(items).toEqual([]);
  });
});

describe('purchaseItem', () => {
  const mockUser = createMockUser();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckSuspension.mockResolvedValue({ isSuspended: false });
  });

  it('로그인 필요', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue(
      mockSuccess({ user: null })
    );

    await expect(purchaseItem(1)).rejects.toThrow('로그인이 필요합니다');
  });

  it('정지된 계정 구매 차단', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue(
      mockSuccess({ user: mockUser })
    );

    mockCheckSuspension.mockResolvedValue({
      isSuspended: true,
      message: '계정이 정지되었습니다.',
    });

    await expect(purchaseItem(1)).rejects.toThrow('정지');
  });

  it('아이템 구매 성공', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue(
      mockSuccess({ user: mockUser })
    );

    mockSupabaseClient.rpc.mockResolvedValue(
      mockSuccess({ success: true, remaining_points: 4000 })
    );

    const result = await purchaseItem(1);

    expect(result.success).toBe(true);
    expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('purchase_item', {
      p_user_id: mockUser.id,
      p_item_id: 1,
    });
  });

  it('포인트 부족 시 구매 실패', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue(
      mockSuccess({ user: mockUser })
    );

    mockSupabaseClient.rpc.mockResolvedValue(
      mockError('포인트가 부족합니다')
    );

    await expect(purchaseItem(1)).rejects.toThrow('포인트가 부족합니다');
  });

  it('이미 보유한 아이템 구매 실패', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue(
      mockSuccess({ user: mockUser })
    );

    mockSupabaseClient.rpc.mockResolvedValue(
      mockError('이미 보유한 아이템입니다')
    );

    await expect(purchaseItem(1)).rejects.toThrow('이미 보유한 아이템');
  });
});
