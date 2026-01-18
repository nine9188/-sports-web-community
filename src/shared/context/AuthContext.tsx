'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getSupabaseBrowser } from '@/shared/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { updateUserData, signOut } from '@/domains/auth/actions';
import { toast } from 'react-toastify';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  refreshUserData: () => Promise<void>;
  updateIcon: (iconId: number) => Promise<boolean>;
  logoutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  refreshUserData: async () => {},
  updateIcon: async () => false,
  logoutUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({
  children,
  initialSession = null
}: {
  children: React.ReactNode;
  initialSession?: Session | null;
}) {
  // initialSession에서 user를 초기값으로 설정 (서버-클라이언트 동기화)
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null);
  const [session, setSession] = useState<Session | null>(initialSession);
  // initialSession이 있으면 이미 인증된 상태이므로 로딩 완료
  const [isLoading, setIsLoading] = useState(!initialSession);
  const [supabase] = useState(() => {
    // 클라이언트에서만 생성 (SSR 안전)
    if (typeof window === 'undefined') return null;
    return getSupabaseBrowser();
  });

  // 사용자 데이터 새로고침
  const refreshUserData = useCallback(async () => {
    if (!user) return;

    try {
      const result = await updateUserData();
      if (result.success && result.data) {
        setUser(result.data as User);
      }
    } catch (error) {
      console.error('사용자 데이터 새로고침 중 오류:', error);
    }
  }, [user]);

  // 아이콘 업데이트 함수
  const updateIcon = useCallback(async (iconId: number): Promise<boolean> => {
    if (!user || !supabase) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ icon_id: iconId })
        .eq('id', user.id);

      if (error) {
        console.error('아이콘 업데이트 오류:', error);
        return false;
      }

      await refreshUserData();
      return true;
    } catch (error) {
      console.error('아이콘 업데이트 중 오류:', error);
      return false;
    }
  }, [user, supabase, refreshUserData]);

  // 로그아웃
  const logoutUser = useCallback(async () => {
    try {
      await signOut();
      setUser(null);
      setSession(null);
      // 토스트는 호출하는 쪽에서 처리 (중복 방지)
    } catch (error) {
      console.error('로그아웃 오류:', error);
      throw error; // 에러를 다시 던져서 호출하는 쪽에서 처리
    }
  }, []);

  // 초기 세션 로드 및 인증 상태 변경 감지
  useEffect(() => {
    // SSR 중에는 스킵
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    async function getInitialSession() {
      try {
        setIsLoading(true);

        // 세션 확인
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (mounted) {
          if (currentSession) {
            // 사용자 정보 검증
            const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

            if (!userError && currentUser) {
              setUser(currentUser);
              setSession(currentSession);
            } else {
              setUser(null);
              setSession(null);
            }
          } else {
            setUser(null);
            setSession(null);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('초기 세션 로드 오류:', error);
        if (mounted) {
          setUser(null);
          setSession(null);
          setIsLoading(false);
        }
      }
    }

    getInitialSession();

    // 인증 상태 변경 감지 (Supabase가 자동으로 세션 갱신 처리)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && currentSession) {
          const { data: { user: authenticatedUser }, error: userError } = await supabase.auth.getUser();

          if (!userError && authenticatedUser) {
            setUser(authenticatedUser);
            setSession(currentSession);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
        } else if (event === 'TOKEN_REFRESHED' && currentSession) {
          setSession(currentSession);
        } else if (event === 'USER_UPDATED' && currentSession) {
          const { data: { user: updatedUser } } = await supabase.auth.getUser();
          if (updatedUser) {
            setUser(updatedUser);
            setSession(currentSession);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // 로그인 성공 토스트 처리
  useEffect(() => {
    if (!isLoading && user) {
      const loginSuccess = sessionStorage.getItem('login-success');
      if (loginSuccess === 'true') {
        sessionStorage.removeItem('login-success');
        toast.success('로그인되었습니다.');
      }
    }
  }, [isLoading, user]);

  const value = {
    user,
    session,
    isLoading,
    refreshUserData,
    updateIcon,
    logoutUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
