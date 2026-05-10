'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/shared/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { updateUserData, signOut } from '@/domains/auth/actions';
import { updateProfileIcon } from '@/shared/actions/user';
import { toast } from 'sonner';

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
  const router = useRouter();
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
      const result = await updateUserData(user.id, {});
      if (result.success && result.user) {
        setUser(result.user);
      }
    } catch (error) {
      console.error('사용자 데이터 새로고침 중 오류:', error);
    }
  }, [user]);

  // 아이콘 업데이트 함수
  const updateIcon = useCallback(async (iconId: number): Promise<boolean> => {
    if (!user) return false;

    try {
      const result = await updateProfileIcon(iconId);

      if (!result.success) {
        console.error('아이콘 업데이트 오류:', result.error);
        return false;
      }

      await refreshUserData();
      return true;
    } catch (error) {
      console.error('아이콘 업데이트 중 오류:', error);
      return false;
    }
  }, [user, refreshUserData]);

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

        // getUser()로 JWT 검증 (getSession().user는 신뢰 불가 - Supabase 공식 경고 해소)
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

        if (mounted) {
          if (!userError && currentUser) {
            setUser(currentUser);
            // session은 참고용으로만 보관 (user 검증은 위에서 끝남)
            setSession(null);
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

    void getInitialSession();

    // 인증 상태 변경 감지 (Supabase가 자동으로 세션 갱신 처리)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, currentSession: Session | null) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && currentSession) {
          const { data: { user: authenticatedUser }, error: userError } = await supabase.auth.getUser();

          if (!userError && authenticatedUser) {
            setUser(authenticatedUser);
            setSession(currentSession);
            router.refresh();
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          router.refresh();
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
  }, [supabase, router]);

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
