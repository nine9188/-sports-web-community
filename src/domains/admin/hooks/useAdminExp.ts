'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getExpHistory, adminAdjustExp } from '@/shared/actions/admin-actions';
import { adminKeys } from '@/shared/constants/queryKeys';

interface ExpHistoryItem {
  id: string;
  userId: string;
  exp: number;
  reason: string;
  createdAt: string;
}

interface UserInfo {
  id: string;
  nickname?: string;
  exp?: number;
  level?: number;
}

/**
 * 경험치 내역 조회 훅
 */
export function useAdminExpHistory(userId: string | null, limit: number = 50) {
  return useQuery<ExpHistoryItem[]>({
    queryKey: adminKeys.expHistory(userId || ''),
    queryFn: async () => {
      if (!userId) return [];

      const result = await getExpHistory(limit);

      if (!result.success || !result.history) {
        throw new Error(result.error || '경험치 내역 조회에 실패했습니다.');
      }

      // 특정 사용자의 내역만 필터링
      return result.history.filter((item) => item.userId === userId);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2분
  });
}

/**
 * 경험치 조정 mutation
 */
export function useAdjustExpMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      user,
      expAmount,
      reason,
    }: {
      adminId: string;
      user: UserInfo;
      expAmount: number;
      reason: string;
    }) => {
      const result = await adminAdjustExp(user.id, expAmount, reason);

      if (!result.success) {
        throw new Error(result.error || '경험치 조정에 실패했습니다.');
      }

      return {
        userId: user.id,
        updatedExp: result.updatedExp ?? 0,
        updatedLevel: result.updatedLevel ?? 1,
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.expHistory(variables.user.id),
      });
    },
  });
}
