'use client';

import { getAllUsersWithLastAccess } from '../actions/suspension';
import { getAllUsersEmailStatus, confirmUserEmail } from '../actions/email-verification';
import { toggleAdminStatus } from '@/shared/actions/admin-actions';
import { useAsyncData, useAsyncMutation } from './useLocalAsync';
import { useEffect } from 'react';

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

const listeners = new Set<() => void>();

function notifyUsersChanged() {
  listeners.forEach((listener) => listener());
}

async function fetchUsersWithEmailStatus(): Promise<User[]> {
  const [usersResult, emailStatusResult] = await Promise.all([
    getAllUsersWithLastAccess(),
    getAllUsersEmailStatus(),
  ]);

  if (!usersResult.success) {
    throw new Error(usersResult.error || '사용자 목록을 불러오지 못했습니다.');
  }

  return (usersResult.data || []).map((user) => ({
    ...user,
    email_confirmed: emailStatusResult.success && emailStatusResult.data
      ? emailStatusResult.data[user.id]?.emailConfirmed ?? false
      : false,
  }));
}

export function useAdminUsers() {
  const query = useAsyncData<User[]>(fetchUsersWithEmailStatus);

  useEffect(() => {
    listeners.add(query.refetch);
    return () => {
      listeners.delete(query.refetch);
    };
  }, [query.refetch]);

  return query;
}

export function useToggleAdminMutation() {
  return useAsyncMutation(
    async ({ userId, currentStatus }: { userId: string; currentStatus: boolean }) => {
      const result = await toggleAdminStatus(userId, currentStatus);

      if (!result.success) {
        throw new Error(result.error || '관리자 상태 변경에 실패했습니다.');
      }

      return { userId, newStatus: result.newStatus ?? !currentStatus };
    },
    notifyUsersChanged
  );
}

export function useConfirmEmailMutation() {
  return useAsyncMutation(async (userId: string) => {
    const result = await confirmUserEmail(userId);

    if (!result.success) {
      throw new Error(result.error || '이메일 인증 처리에 실패했습니다.');
    }

    return result;
  }, notifyUsersChanged);
}
