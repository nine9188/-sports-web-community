'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { createClient } from '@/app/lib/supabase-browser';
import { Session, User } from '@supabase/supabase-js';
import { rewardUserActivity, checkConsecutiveLogin, ActivityType } from '@/app/utils/activity-rewards';
import { updateUserData, refreshSession, logout } from '@/app/actions/auth-actions';

// 세션 갱신 주기 (15분)
const SESSION_REFRESH_INTERVAL = 15 * 60 * 1000;

// 이벤트 디바운스를 위한 상수
const AUTH_EVENT_DEBOUNCE = 1000; // 1초

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
  const refreshCurrentSessionRef = useRef<(() => Promise<void>) | null>(null);
  const supabase = createClient();
  
  // 갱신 타이머 설정 함수
  const setupRefreshTimer = useCallback((expiresAt?: number) => {
    if (!expiresAt) return;
    
    const expiresInMs = (expiresAt - Math.floor(Date.now() / 1000)) * 1000;
    const nextRefresh = Math.max(
      // 만료 5분 전 또는 기본 주기 중 더 빠른 시간
      Math.min(expiresInMs - 5 * 60 * 1000, SESSION_REFRESH_INTERVAL),
      // 최소 1분
      60 * 1000
    );
    
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    
    refreshTimerRef.current = setTimeout(() => {
      if (session?.refresh_token && refreshCurrentSessionRef.current) {
        refreshCurrentSessionRef.current();
      }
    }, nextRefresh);
  }, [session]);
  
  // 세션 갱신 함수
  const refreshCurrentSession = useCallback(async () => {
    if (!session?.refresh_token) return;
    
    try {
      // 이전 타이머 정리
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      
      // 서버 액션을 통한 토큰 갱신
      const result = await refreshSession(session.refresh_token);
      
      if (result.success && result.session) {
        // 새로운 세션이 현재 세션과 동일한지 확인 (무한 루프 방지)
        if (session.refresh_token === result.session.refresh_token &&
            session.access_token === result.session.access_token) {
          // 세션이 동일하면 상태 업데이트 없이 다음 갱신만 예약
          setupRefreshTimer(result.session.expires_at);
          return;
        }
        
        setUser(result.session.user);
        setSession(result.session);
        
        // 다음 갱신 일정 설정
        setupRefreshTimer(result.session.expires_at);
      } else {
        // 인증 만료 또는 실패
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error('세션 갱신 중 오류:', error);
    }
  }, [session, setupRefreshTimer]);

  // refreshCurrentSessionRef에 최신 함수 할당
  useEffect(() => {
    refreshCurrentSessionRef.current = refreshCurrentSession;
  }, [refreshCurrentSession]);
  
  // 로그아웃 함수
  const logoutUser = useCallback(async () => {
    try {
      // 서버 액션을 통한 로그아웃
      const result = await logout();
      
      if (result.success) {
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
      // 인증된 사용자 정보 가져오기 (getUser 사용 - 보안 강화)
      const { data, error } = await supabase.auth.getUser();
      
      if (error || !data.user) {
        return;
      }
      
      // 최신 사용자 정보 설정
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
          }
        }
      }
    } catch (error) {
      console.error('사용자 데이터 새로고침 중 오류:', error);
    }
  }, [user, supabase]);
  
  // 초기 세션 로드 
  useEffect(() => {
    let mounted = true;
    let signInDebounceTimer: NodeJS.Timeout | null = null;
    
    async function getInitialSession() {
      try {
        setIsLoading(true);
        
        // 사용자 정보만 가져오기 (세션 없이)
        // getUser()를 사용하여 사용자 정보 확인
        const { data } = await supabase.auth.getUser();
        
        // 컴포넌트가 마운트된 상태일 때만 상태 업데이트
        if (mounted) {
          if (data?.user) {
            // 유효한 사용자 정보가 있을 경우
            setUser(data.user);
            setSession(null); // 세션 정보 없이 진행
          } else {
            // 인증되지 않은 사용자
            setSession(null);
            setUser(null);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('세션 로드 오류:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setIsLoading(false);
        }
      }
    }
    
    getInitialSession();
    
    // 중복 이벤트 처리를 방지하기 위한 함수
    const handleAuthStateChange = async (event: string) => {
      if (mounted) {
        // 이전 디바운스 타이머 취소
        if (signInDebounceTimer) {
          clearTimeout(signInDebounceTimer);
          signInDebounceTimer = null;
        }
        
        if (event === 'SIGNED_IN') {
          console.log('AUTH: SIGNED_IN 이벤트 처리 시작', new Date().toISOString());
          
          // 디바운스 타이머 설정
          signInDebounceTimer = setTimeout(async () => {
            console.log('AUTH: SIGNED_IN 이벤트 처리 실행', new Date().toISOString());
            
            // 인증된 사용자 정보 확인 (getUser 사용 - 보안 강화)
            const { data: userData, error: userError } = await supabase.auth.getUser();
            
            if (!userData?.user || userError) {
              console.error('인증된 사용자 정보를 가져오는데 실패했습니다:', userError);
              return;
            }
            
            // 검증된 사용자 정보 사용
            setUser(userData.user);
            setSession(null); // 세션 정보 사용하지 않음
            
            // API 호출을 최소화하고 필수적인 것만 수행
            try {
              const userId = userData.user.id;
              
              // profiles 테이블 확인 - 없는 경우에만 생성
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', userId)
                .single();
              
              if (profileError || !profileData) {
                // 프로필 데이터가 없으면 생성만 하고 추가 요청은 하지 않음
                const metadata = userData.user.user_metadata || {};
                await supabase
                  .from('profiles')
                  .upsert({
                    id: userId,
                    username: metadata.username || '',
                    email: userData.user.email || '',
                    full_name: metadata.full_name || '',
                    nickname: metadata.nickname || '',
                    updated_at: new Date().toISOString()
                  });
              }
              
              // 로그인 보상 처리는 별도의 지연된 작업으로 실행
              setTimeout(() => {
                try {
                  // 일일 로그인 보상과 연속 로그인 확인
                  rewardUserActivity(userId, ActivityType.DAILY_LOGIN).then(() => {
                    checkConsecutiveLogin(userId).then(({ reward }) => {
                      if (reward) {
                        rewardUserActivity(userId, ActivityType.CONSECUTIVE_LOGIN);
                      }
                    });
                  });
                } catch (error) {
                  console.error('보상 처리 오류:', error);
                }
              }, 2000); // 메인 로그인 처리 후 지연 실행
            } catch (error) {
              console.error('프로필 처리 오류:', error);
            }
          }, AUTH_EVENT_DEBOUNCE);
        } else if (event === 'TOKEN_REFRESHED') {
          // 토큰 갱신 시에는 getUser()를 호출하여 최신 사용자 정보만 갱신
          const { data } = await supabase.auth.getUser();
          if (data?.user) {
            // 사용자 정보만 업데이트
            setUser(data.user);
            // 세션 정보는 사용하지 않음
            setSession(null);
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
    };
    
    // 인증 상태 변화 이벤트 리스너
    const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    
    // 클린업 함수
    return () => {
      mounted = false;
      
      // 타이머 정리
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      
      if (signInDebounceTimer) {
        clearTimeout(signInDebounceTimer);
        signInDebounceTimer = null;
      }
      
      authListener.subscription.unsubscribe();
    };
  }, [supabase, setupRefreshTimer]);
  
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

