'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const createChatUser = useCallback((): ChatUser => {
    if (user) {
      // 로그인된 사용자
      return {
        id: user.id,
        isAuthenticated: true,
        isLocal: false
      };
    } else {
      // 비로그인 사용자 - 로컬 세션 사용
      const session = localChatStorage.getSession();
      if (!session) {
        // 세션이 없으면 새로 생성
        localChatStorage.clearData();
        const newSession = localChatStorage.getSession();
        return {
          id: newSession?.id || 'anonymous',
          isAuthenticated: false,
          isLocal: true
        };
      }
      
      return {
        id: session.id,
        isAuthenticated: false,
        isLocal: true
      };
    }
  }, [user]);

  const refreshUser = useCallback(() => {
    setIsLoading(true);
    const newChatUser = createChatUser();
    setChatUser(newChatUser);
    setIsLoading(false);
  }, [createChatUser]);

  useEffect(() => {
    if (!loading) {
      refreshUser();
    }
  }, [loading, refreshUser]);

  // 사용자 인증 상태가 변경될 때 처리
  useEffect(() => {
    if (!loading && chatUser) {
      const newChatUser = createChatUser();
      
      // 인증 상태가 변경되었는지 확인
      if (newChatUser.isAuthenticated !== chatUser.isAuthenticated) {
        if (newChatUser.isAuthenticated && !chatUser.isAuthenticated) {
          // 비로그인 -> 로그인: 로컬 데이터를 서버로 이전할 수 있는 로직 추가
          // 현재는 단순히 로컬 데이터 유지
          console.log('User logged in, keeping local chat data for potential migration');
        } else if (!newChatUser.isAuthenticated && chatUser.isAuthenticated) {
          // 로그인 -> 비로그인: 새 로컬 세션 생성
          localChatStorage.clearData();
        }
        
        setChatUser(newChatUser);
      }
    }
  }, [user, loading, chatUser, createChatUser]);

  return {
    chatUser,
    isLoading: loading || isLoading,
    refreshUser
  };
}