'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@/app/lib/supabase-browser';
import { Session, User } from '@supabase/supabase-js';
import { rewardUserActivity, checkConsecutiveLogin, ActivityType } from '@/app/utils/activity-rewards';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  refreshUserData: () => Promise<void>;
  updateIcon: (iconId: number) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  refreshUserData: async () => {},
  updateIcon: async () => false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  
  // 아이콘 업데이트 함수
  const updateIcon = useCallback(async (iconId: number): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // 프로필 테이블과 메타데이터 동시 업데이트
      const [metaUpdate, profileUpdate] = await Promise.all([
        // 1. 사용자 메타데이터 업데이트
        supabase.auth.updateUser({
          data: {
            ...user.user_metadata,
            icon_id: iconId
          }
        }),
        
        // 2. 프로필 테이블 업데이트
        supabase.from('profiles').update({
          icon_id: iconId,
          updated_at: new Date().toISOString()
        }).eq('id', user.id)
      ]);
      
      if (metaUpdate.error) {
        console.error('아이콘 메타데이터 업데이트 실패:', metaUpdate.error);
        return false;
      }
      
      if (profileUpdate.error) {
        console.error('아이콘 프로필 업데이트 실패:', profileUpdate.error);
        // 메타데이터는 업데이트됐으므로 UI에는 반영 가능
      }
      
      // 업데이트된 사용자 정보로 상태 갱신
      if (metaUpdate.data.user) {
        setUser(metaUpdate.data.user);
      }
      
      // 아이콘 업데이트 이벤트 발행
      window.dispatchEvent(new CustomEvent('icon-updated', {
        detail: { iconId }
      }));
      
      return true;
    } catch (error) {
      console.error('아이콘 업데이트 중 오류 발생:', error);
      return false;
    }
  }, [user, supabase]);
  
  // 사용자 데이터 새로고침 함수 - 3초 내 중복 호출 방지
  const refreshUserData = useCallback(async () => {
    if (!user) return;
    
    try {
      // 세션 확인 및 새로고침
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        console.error('세션 확인 오류:', sessionError);
        return;
      }
      
      // 최신 사용자 정보 가져오기
      const { data, error } = await supabase.auth.getUser();
      
      if (error || !data.user) {
        console.error('사용자 데이터 가져오기 오류:', error);
        return;
      }
      
      // 사용자 메타데이터 확인
      const currentUser = data.user;
      
      // 프로필 테이블에서 최신 정보 확인 (아이콘 ID만 가져오기)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('icon_id, nickname')
        .eq('id', currentUser.id)
        .single();
        
      if (!profileError && profileData) {
        // 메타데이터와 프로필 테이블 간의 데이터 동기화 (아이콘 ID)
        if (profileData.icon_id && 
            profileData.icon_id !== currentUser.user_metadata?.icon_id) {
          
          // 메타데이터 업데이트
          const { data: updatedUser, error: updateError } = await supabase.auth.updateUser({
            data: {
              ...currentUser.user_metadata,
              icon_id: profileData.icon_id
            }
          });
          
          if (!updateError && updatedUser.user) {
            setUser(updatedUser.user);
            return;
          }
        }
      }
      
      // 기본 업데이트 (프로필 데이터 없는 경우)
      setUser(currentUser);
      
    } catch (error) {
      console.error('사용자 데이터 새로고침 중 오류:', error);
    }
  }, [user, supabase]);
  
  // 초기 세션 로드 부분 수정
  useEffect(() => {
    let mounted = true;
    
    async function getInitialSession() {
      try {
        setIsLoading(true);
        
        // 세션 가져오기 - 추가 옵션으로 새로고침 강제
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        console.log('초기 세션 상태:', sessionData, sessionError);
        
        if (sessionError) {
          throw sessionError;
        }
        
        // 컴포넌트가 마운트된 상태일 때만 상태 업데이트
        if (mounted) {
          if (sessionData?.session) {
            setSession(sessionData.session);
            setUser(sessionData.session.user);
            
            // 세션 유효성 확인
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (!userError && userData.user) {
              console.log('사용자 정보 확인됨:', userData.user);
            }
          } else {
            setSession(null);
            setUser(null);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('세션 초기화 중 오류:', error);
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
      async (event, session) => {
        console.log('Auth 상태 변경:', event, session ? '세션 있음' : '세션 없음');
        if (mounted) {
          if (event === 'SIGNED_IN') {
            setUser(session?.user || null);
            setSession(session);
            
            // 로그인 성공 시 profiles 테이블 데이터 저장/업데이트 시도
            if (session?.user) {
              try {
                const user = session.user;
                const metadata = user.user_metadata || {};
                
                // profiles 테이블 확인
                const { data: profileData, error: profileError } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', user.id)
                  .single();
                
                if (profileError || !profileData) {
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
                    console.error('프로필 생성 오류:', insertError);
                  } else {
                    console.log('프로필 생성 성공');
                  }
                }
              } catch (error) {
                console.error('프로필 처리 중 오류:', error);
              }
            }
            
            // 로그인 보상 처리 (기존 코드 유지)
            if (session?.user?.id) {
              try {
                // 1. 일일 로그인 보상 지급
                await rewardUserActivity(session.user.id, ActivityType.DAILY_LOGIN);
                
                // 2. 연속 로그인 확인 및 보상 지급
                const { reward } = await checkConsecutiveLogin(session.user.id);
                if (reward) {
                  await rewardUserActivity(session.user.id, ActivityType.CONSECUTIVE_LOGIN);
                }
              } catch (error) {
                console.error('로그인 보상 처리 중 오류:', error);
              }
            }
          } else if (event === 'TOKEN_REFRESHED') {
            setUser(session?.user || null);
            setSession(session);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setSession(null);
          }
        }
      }
    );
    
    // 클린업 함수
    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);
  
  // 값을 메모이제이션하여 불필요한 리렌더링 방지
  const value = useMemo(
    () => ({
      user,
      session,
      isLoading,
      refreshUserData,
      updateIcon,
    }),
    [user, session, isLoading, refreshUserData, updateIcon]
  );
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
