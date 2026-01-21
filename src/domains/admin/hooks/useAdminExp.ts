'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getExpHistory } from '@/shared/actions/admin-actions';
import { getSupabaseBrowser } from '@/shared/lib/supabase';
import { adminKeys } from '@/shared/constants/queryKeys';
import { calculateLevelFromExp } from '@/shared/utils/level-icons';

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
      adminId,
      user,
      expAmount,
      reason,
    }: {
      adminId: string;
      user: UserInfo;
      expAmount: number;
      reason: string;
    }) => {
      const supabase = getSupabaseBrowser();
      const userExp = user.exp || 0;
      let updatedExp = 0;
      let updatedLevel = 1;

      // 1. RPC 함수 호출 시도
      try {
        const { error } = await supabase.rpc('admin_adjust_exp', {
          admin_id: adminId,
          target_user_id: user.id,
          exp_amount: expAmount,
          reason_text: reason,
        });

        if (error) {
          throw error;
        }

        // RPC 성공했으므로 최신 데이터 조회
        const { data: updatedUserData, error: fetchError } = await supabase
          .from('profiles')
          .select('id, nickname, exp, level')
          .eq('id', user.id)
          .single();

        if (fetchError) {
          updatedExp = Math.max(0, userExp + expAmount);
          updatedLevel = calculateLevelFromExp(updatedExp);
        } else {
          updatedExp = updatedUserData.exp || 0;
          updatedLevel = updatedUserData.level || 1;
        }
      } catch {
        // 2. RPC 실패 시 직접 처리
        updatedExp = Math.max(0, userExp + expAmount);
        updatedLevel = calculateLevelFromExp(updatedExp);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            exp: updatedExp,
            level: updatedLevel,
          })
          .eq('id', user.id);

        if (updateError) {
          throw updateError;
        }

        // 경험치 내역 기록
        await supabase.from('exp_history').insert({
          user_id: user.id,
          exp: expAmount,
          reason: reason,
        });
      }

      return {
        userId: user.id,
        updatedExp,
        updatedLevel,
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.expHistory(variables.user.id),
      });
    },
  });
}
