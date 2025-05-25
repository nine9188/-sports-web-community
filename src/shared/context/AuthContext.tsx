'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { createClient } from '@/shared/api/supabase';
import { Session, User } from '@supabase/supabase-js';
import { rewardUserActivity, checkConsecutiveLogin, ActivityTypeValues } from '@/shared/utils/activity-rewards-client';
import { updateUserData, refreshSession, logout } from '@/shared/actions/auth-actions';

// 세션 갱신 주기 (15분)
const SESSION_REFRESH_INTERVAL = 15 * 60 * 1000;

// 인증 이벤트 디바운스 타임아웃 (2초)
const AUTH_SIGNIN_DEBOUNCE = 2000;

// 최근 처리된 이벤트 시간 캐싱 기간 (초)
const EVENT_CACHE_EXPIRY = 30;

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
  // 이벤트 캐싱을 위한 참조 객체
  const eventCacheRef = useRef<{[key: string]: number}>({});
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
        
        // 이벤트 캐시 정리
        eventCacheRef.current = {};
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
  
  // 이벤트 캐시 검사 및 업데이트 함수
  const checkAndUpdateEventCache = useCallback((eventType: string, userId?: string): boolean => {
    const now = Math.floor(Date.now() / 1000);
    const cacheKey = `${eventType}_${userId || ''}`;
    
    // 캐시된 이벤트 확인
    const lastProcessed = eventCacheRef.current[cacheKey];
    
    if (lastProcessed && now - lastProcessed < EVENT_CACHE_EXPIRY) {
      // 캐시 기간 내에 이미 처리된 이벤트
      if (process.env.NODE_ENV === 'development') {
        console.debug(`이벤트 중복 차단: ${cacheKey}, 마지막 처리: ${new Date(lastProcessed * 1000).toISOString()}`);
      }
      return false;
    }
    
    // 이벤트 캐시 업데이트
    eventCacheRef.current[cacheKey] = now;
    return true;
  }, []);
  
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
            
            // 초기 로드 시 이벤트 캐시 설정 (과도한 보상 처리 방지)
            eventCacheRef.current[`SIGNED_IN_${data.user.id}`] = Math.floor(Date.now() / 1000);
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
      if (!mounted) return;
        
      // 이전 디바운스 타이머 취소
      if (signInDebounceTimer) {
        clearTimeout(signInDebounceTimer);
        signInDebounceTimer = null;
      }
      
      if (event === 'SIGNED_IN') {
        // 임시 사용자 정보 확인 (캐시 키 생성용)
        try {
          const { data: tempUserData } = await supabase.auth.getUser();
          const userId = tempUserData?.user?.id;
          
          // 사용자 ID가 있고 이벤트가 캐시되어 있지 않은 경우에만 처리
          if (userId && checkAndUpdateEventCache('SIGNED_IN', userId)) {
            if (process.env.NODE_ENV === 'development') {
              console.log('AUTH: SIGNED_IN 이벤트 처리 시작', new Date().toISOString());
            }
            
            // requestAnimationFrame을 사용하여 메인 스레드 블로킹 방지
            requestAnimationFrame(() => {
              // 디바운스 타이머 설정 (시간 증가)
              signInDebounceTimer = setTimeout(async () => {
                if (process.env.NODE_ENV === 'development') {
                  console.log('AUTH: SIGNED_IN 이벤트 처리 실행', new Date().toISOString());
                }
                
                try {
                  // 인증된 사용자 정보 확인 (getUser 사용 - 보안 강화)
                  const { data: userData, error: userError } = await supabase.auth.getUser();
                  
                  if (!userData?.user || userError) {
                    console.error('인증된 사용자 정보를 가져오는데 실패했습니다:', userError);
                    return;
                  }
                  
                  // 검증된 사용자 정보 사용
                  setUser(userData.user);
                  setSession(null); // 세션 정보 사용하지 않음
                  
                  // 프로필 처리 최적화
                  const userId = userData.user.id;
                  
                  // 필수적인 처리만 하고 보상 로직은 별도 처리
                  // 메인 스레드 블로킹 방지를 위해 약간의 지연 추가
                  setTimeout(() => {
                    handleUserRewards(userId);
                  }, 0);
                } catch (error) {
                  console.error('인증 상태 변경 처리 오류:', error);
                }
              }, AUTH_SIGNIN_DEBOUNCE); // 디바운스 시간 증가 (2초)
            });
          } else {
            // 중복 이벤트 무시 (로그 없음)
          }
        } catch (error) {
          console.error('임시 사용자 정보 확인 오류:', error);
        }
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
        
        // 이벤트 캐시 정리
        eventCacheRef.current = {};
        
        // 로그아웃 시 타이머 정리
        if (refreshTimerRef.current) {
          clearTimeout(refreshTimerRef.current);
          refreshTimerRef.current = null;
        }
      }
    };
    
    // 별도 함수로 보상 처리 분리
    const handleUserRewards = async (userId: string) => {
      // 메모리 사용량 및 계산 최적화를 위한 변수
      let profileData, profileError, userData;
      
      try {
        // 이미 보상을 받았는지 확인 (먼저 확인하여 불필요한 DB 작업 방지)
        const supabase = createClient();
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        // 오늘 로그인 보상을 이미 받았는지 확인
        const { count: rewardCount, error: countError } = await supabase
          .from('exp_history')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('reason', '하루 최초 로그인')
          .gte('created_at', todayStart.toISOString())
          .lt('created_at', new Date(todayStart.getTime() + 24 * 60 * 60 * 1000).toISOString());
          
        if (countError) {
          console.error('보상 내역 확인 오류:', countError);
          return;
        }
        
        // 이미 보상을 받은 경우 처리 중단
        if (rewardCount && rewardCount > 0) {
          if (process.env.NODE_ENV === 'development') {
            console.debug(`사용자(${userId})는 이미 오늘의 로그인 보상을 받았습니다.`);
          }
          return;
        }
        
        // 프로필 체크 및 필요시 생성 로직은 유지
        const profileResult = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .single();
          
        profileData = profileResult.data;
        profileError = profileResult.error;
        
        if (profileError || !profileData) {
          // 프로필 데이터가 없으면 생성만 하고 추가 요청은 하지 않음
          const userResult = await supabase.auth.getUser();
          userData = userResult.data;
          
          if (userData?.user) {
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
        }
        
        // 로그인 보상 처리는 별도 실행
        if (!rewardCount || rewardCount === 0) {
          // 지연 시간을 더 길게 설정하여 메인 스레드 블로킹 최소화
          setTimeout(() => {
            // 성능 최적화: Promise.all을 사용하여 parallel 처리
            Promise.all([
              rewardUserActivity(userId, ActivityTypeValues.DAILY_LOGIN),
              checkConsecutiveLogin(userId)
            ]).then(([, consecutiveResult]) => { // 첫 번째 결과는 사용하지 않으므로 생략
              const { reward } = consecutiveResult;
              if (reward) {
                // 추가 지연으로 메인 스레드 블로킹 방지
                setTimeout(() => {
                  rewardUserActivity(userId, ActivityTypeValues.CONSECUTIVE_LOGIN);
                }, 500);
              }
            }).catch(error => {
              console.error('보상 처리 오류:', error);
            });
          }, 2500);
        }
      } catch (error) {
        console.error('프로필/보상 처리 오류:', error);
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
  }, [supabase, setupRefreshTimer, checkAndUpdateEventCache]);
  
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