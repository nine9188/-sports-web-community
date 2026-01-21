'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllUsersWithLastAccess } from '../actions/suspension';
import { getAllUsersEmailStatus, confirmUserEmail } from '../actions/email-verification';
import { getSupabaseBrowser } from '@/shared/lib/supabase';
import { adminKeys } from '@/shared/constants/queryKeys';

interface User {
  id: string;
  email: string;
  nickname: string;
  is_admin: boolean;
  created_at?: string;
  last_sign_in_at?: string | null;
  is_suspended?: boolean;
  suspended_until?: string | null;
  suspended_reason?: string | null;
  email_confirmed?: boolean;
}

async function fetchUsersWithEmailStatus(): Promise<User[]> {
  const [usersResult, emailStatusResult] = await Promise.all([
    getAllUsersWithLastAccess(),
    getAllUsersEmailStatus()
  ]);

  if (!usersResult.success) {
    throw new Error(usersResult.error || '사용자 목록을 불러오는데 실패했습니다.');
  }

  const usersWithEmailStatus = (usersResult.data || []).map(user => ({
    ...user,
    email_confirmed: emailStatusResult.success && emailStatusResult.data
      ? emailStatusResult.data[user.id]?.emailConfirmed ?? false
      : false
  }));

  return usersWithEmailStatus;
}

export function useAdminUsers() {
  return useQuery<User[]>({
    queryKey: adminKeys.users(),
    queryFn: fetchUsersWithEmailStatus,
    staleTime: 1000 * 60 * 2, // 2분
  });
}

export function useToggleAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, currentStatus }: { userId: string; currentStatus: boolean }) => {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', userId);

      if (error) {
        throw new Error(error.message);
      }

      return { userId, newStatus: !currentStatus };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

export function useConfirmEmailMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await confirmUserEmail(userId);

      if (!result.success) {
        throw new Error(result.error || '이메일 인증 처리에 실패했습니다.');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}
