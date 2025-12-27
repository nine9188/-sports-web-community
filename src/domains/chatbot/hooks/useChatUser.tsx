'use client';

import { useMemo } from 'react';
import { useAuth } from '@/shared/context/AuthContext';
import { ChatUser } from '../types';
import { localChatStorage } from '../actions/localStorageActions';

interface UseChatUserReturn {
  chatUser: ChatUser | null;
  isLoading: boolean;
  refreshUser: () => void;
}

export function useChatUser(): UseChatUserReturn {
  const { user, loading } = useAuth();

  // useMemo로 chatUser를 안정적으로 계산 (무한 루프 방지)
  const chatUser = useMemo<ChatUser | null>(() => {
    if (loading) return null;

    if (user) {
      return {
        id: user.id,
        isAuthenticated: true,
        isLocal: false
      };
    }

    // 비로그인 - 로컬 세션
    const session = localChatStorage.getSession();
    return {
      id: session?.id || 'anonymous',
      isAuthenticated: false,
      isLocal: true
    };
  }, [user, loading]);

  const refreshUser = () => {
    // no-op - useMemo가 자동으로 처리
  };

  return {
    chatUser,
    isLoading: loading,
    refreshUser
  };
}
