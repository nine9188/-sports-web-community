'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { createClient } from '@/app/lib/supabase-browser';
import { Session, User } from '@supabase/supabase-js';
import { rewardUserActivity, checkConsecutiveLogin, ActivityType } from '@/app/utils/activity-rewards';
import { updateUserData } from '@/app/actions/auth-actions';

// 세션 갱신 주기 (15분)
const SESSION_REFRESH_INTERVAL = 15 * 60 * 1000;

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();
  
  // 세션 갱신 함수
  const refreshCurrentSession = useCallback(async () => {
    if (!session?.refresh_token) return;
    
    try {
      // API 라우트를 통해 토큰 갱신
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: session.refresh_token,
        }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success && result.session) {
        setUser(result.session.user);
        setSession(result.session);
        
        // 다음 갱신 일정 설정 (세션 만료 5분 전 또는 기본 주기)
        const expiresAt = result.session.expires_at;
        if (expiresAt) {
          const expiresInMs = (expiresAt - Math.floor(Date.now() / 1000)) * 1000;
          const nextRefresh = Math.max(
            // 만료 5분 전 또는 기본 주기 중 더 빠른 시간
            Math.min(expiresInMs - 5 * 60 * 1000, SESSION_REFRESH_INTERVAL),
            // 최소 1분
            60 * 1000
          );
          
          // 이전 타이머 정리 후 새 타이머 설정
          if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
          }
          
          refreshTimerRef.current = setTimeout(refreshCurrentSession, nextRefresh);
        }
      } else if (response.status === 401) {
        // 인증 만료 또는 실패
        setUser(null);
        setSession(null);
        
        if (refreshTimerRef.current) {
          clearTimeout(refreshTimerRef.current);
          refreshTimerRef.current = null;
        }
      }
    } catch (error) {
      console.error('세션 갱신 중 오류:', error);
    }
  }, [session]);
  
  // 로그아웃 함수
  const logoutUser = useCallback(async () => {
    try {
      // API 라우트를 통해 로그아웃 처리
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setUser(null);
        setSession(null);
        
        // 세션 갱신 타이머 정리
        if (refreshTimerRef.current) {
          clearTimeout(refreshTimerRef.current);
          refreshTimerRef.current = null;
        }
      }
    } catch (error) {
      console.error('로그아웃 중 오류:', error);
    }
  }, []);
  
  // 아이콘 업데이트 함수
  const updateIcon = useCallback(async (iconId: number): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // 서버 액션을 통해 사용자 데이터 업데이트
      const result = await updateUserData(user.id, {
        ...user.user_metadata,
        icon_id: iconId
      });
      
      if (!result.success) {
        return false;
      }
      
      // 업데이트된 사용자 정보로 상태 갱신
      if (result.user) {
        setUser(result.user);
      }
      
      // 아이콘 업데이트 이벤트 발행
      window.dispatchEvent(new CustomEvent('icon-updated', {
        detail: { iconId }
      }));
      
      return true;
    } catch {
      return false;
    }
  }, [user]);
  
  // 사용자 데이터 새로고침 함수
  const refreshUserData = useCallback(async () => {
    if (!user) return;
    
    try {
      // 세션 확인 및 새로고침
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        return;
      }
      
      // 최신 사용자 정보 가져오기
      const { data } = await supabase.auth.getUser();
      
      if (!data.user) {
        return;
      }
      
      // 사용자 메타데이터 확인
      const currentUser = data.user;
      
      // 프로필 테이블에서 최신 정보 확인
      const { data: profileData } = await supabase
        .from('profiles')
        .select('icon_id, nickname')
        .eq('id', currentUser.id)
        .single();
        
      if (profileData) {
        // 메타데이터와 프로필 테이블 간의 데이터 동기화
        if (profileData.icon_id && 
            profileData.icon_id !== currentUser.user_metadata?.icon_id) {
          
          // 서버 액션을 통해 메타데이터 업데이트
          const result = await updateUserData(currentUser.id, {
            ...currentUser.user_metadata,
            icon_id: profileData.icon_id
          });
          
          if (result.success && result.user) {
            setUser(result.user);
            return;
          }
        }
      }
      
      // 기본 업데이트 (프로필 데이터 없는 경우)
      setUser(currentUser);
      
      // 세션 갱신
      await refreshCurrentSession();
      
    } catch {
    }
  }, [user, supabase, refreshCurrentSession]);
  
  // 초기 세션 로드 
  useEffect(() => {
    let mounted = true;
    
    async function getInitialSession() {
      try {
        setIsLoading(true);
        
        // 세션 가져오기
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (!sessionData) {
          throw new Error('세션을 가져오는데 실패했습니다');
        }
        
        // 컴포넌트가 마운트된 상태일 때만 상태 업데이트
        if (mounted) {
          if (sessionData?.session) {
            setSession(sessionData.session);
            setUser(sessionData.session.user);
            
            // 첫 로드 시 API 라우트로 세션 갱신
            await refreshCurrentSession();
            
            // 세션 유효성 확인
            const { data: userData } = await supabase.auth.getUser();
            if (userData?.user) {
              // 유효한 사용자
            }
          } else {
            setSession(null);
            setUser(null);
          }
          setIsLoading(false);
        }
      } catch {
        if (mounted) {
          setSession(null);
          setUser(null);
          setIsLoading(false);
        }
      }
    }
    
    getInitialSession();
    
    // 인증 상태 변화 이벤트 리스너
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (mounted) {
          if (event === 'SIGNED_IN') {
            setUser(newSession?.user || null);
            setSession(newSession);
            
            // 로그인 시 API 라우트로 세션 갱신
            if (newSession?.refresh_token) {
              await refreshCurrentSession();
            }
            
            // 로그인 성공 시 profiles 테이블 데이터 저장/업데이트 시도
            if (newSession?.user) {
              try {
                const user = newSession.user;
                const metadata = user.user_metadata || {};
                
                // profiles 테이블 확인
                const { data: profileData } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', user.id)
                  .single();
                
                if (!profileData) {
                  // 프로필 데이터가 없으면 생성
                  const { error: insertError } = await supabase
                    .from('profiles')
                    .upsert({
                      id: user.id,
                      username: metadata.username || '',
                      email: user.email || '',
                      full_name: metadata.full_name || '',
                      nickname: metadata.nickname || '',
                      updated_at: new Date().toISOString()
                    });
                    
                  if (insertError) {
                  } else {
                  }
                }
              } catch {
                // 프로필 생성 실패 처리
              }
            }
            
            // 로그인 보상 처리
            if (newSession?.user?.id) {
              try {
                // 1. 일일 로그인 보상 지급
                await rewardUserActivity(newSession.user.id, ActivityType.DAILY_LOGIN);
                
                // 2. 연속 로그인 확인 및 보상 지급
                const { reward } = await checkConsecutiveLogin(newSession.user.id);
                if (reward) {
                  await rewardUserActivity(newSession.user.id, ActivityType.CONSECUTIVE_LOGIN);
                }
              } catch {
                // 보상 처리 실패 무시
              }
            }
          } else if (event === 'TOKEN_REFRESHED') {
            // 토큰 갱신 이벤트 처리
            if (newSession) {
              try {
                // API 라우트를 통해 쿠키 갱신
                await refreshCurrentSession();
              } catch (error) {
                console.error('토큰 갱신 중 오류:', error);
              }
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setSession(null);
            
            // 로그아웃 시 타이머 정리
            if (refreshTimerRef.current) {
              clearTimeout(refreshTimerRef.current);
              refreshTimerRef.current = null;
            }
          }
        }
      }
    );
    
    // 클린업 함수
    return () => {
      mounted = false;
      
      // 타이머 정리
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      
      authListener.subscription.unsubscribe();
    };
  }, [supabase, refreshCurrentSession]);
  
  // 값을 메모이제이션하여 불필요한 리렌더링 방지
  const value = useMemo(
    () => ({
      user,
      session,
      isLoading,
      refreshUserData,
      updateIcon,
      logoutUser,
    }),
    [user, session, isLoading, refreshUserData, updateIcon, logoutUser]
  );
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
