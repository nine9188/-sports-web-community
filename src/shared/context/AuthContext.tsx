'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { createClient } from '@/shared/api/supabase';
import { Session, User } from '@supabase/supabase-js';
import { updateUserData, refreshSession, signOut } from '@/domains/auth/actions';
import { toast } from 'react-toastify';

// 세션 관리 설정
const SESSION_REFRESH_INTERVAL = 15 * 60 * 1000; // 15분마다 갱신

// 로그인 유지 옵션에 따른 설정
const SESSION_TYPES = {
  NORMAL: {
    // 일반 로그인 (로그인 유지 체크 X) - 24시간 후 자동 로그아웃
    AUTO_LOGOUT_TIME: 24 * 60 * 60 * 1000, // 24시간
    SESSION_WARNING_TIME: 30 * 60 * 1000, // 30분 전 경고
    STORAGE_KEY: 'session_type_normal'
  },
  EXTENDED: {
    // 로그인 유지 (로그인 유지 체크 O) - 30일, idle timeout 없음
    AUTO_LOGOUT_TIME: 30 * 24 * 60 * 60 * 1000, // 30일
    SESSION_WARNING_TIME: 24 * 60 * 60 * 1000, // 1일 전 경고
    STORAGE_KEY: 'session_type_extended'
  }
};

// 기본 JWT 만료 시간 (1시간) - fallback용
const DEFAULT_JWT_EXPIRY = 60 * 60;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  refreshUserData: () => Promise<void>;
  updateIcon: (iconId: number) => Promise<boolean>;
  logoutUser: () => Promise<void>;
  extendSession: () => void;
  timeUntilLogout: number | null;
  setSessionType: (isExtended: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  refreshUserData: async () => {},
  updateIcon: async () => false,
  logoutUser: async () => {},
  extendSession: () => {},
  timeUntilLogout: null,
  setSessionType: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({
  children,
  initialSession = null
}: {
  children: React.ReactNode;
  initialSession?: Session | null;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(initialSession);
  const [isLoading, setIsLoading] = useState(true);

  // 세션 타입 상태 (localStorage에서 읽어옴)
  const [isExtendedSession, setIsExtendedSession] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('keep_login') === 'true';
    }
    return false;
  });

  const [timeUntilLogout, setTimeUntilLogout] = useState<number | null>(null);
  
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoLogoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const warningShownRef = useRef<boolean>(false);
  
  // 함수들을 ref로 저장하여 순환 참조 방지
  const setupRefreshTimerRef = useRef<((expiresAt?: number) => void) | null>(null);
  const setupAutoLogoutTimerRef = useRef<(() => void) | null>(null);
  const refreshCurrentSessionRef = useRef<(() => Promise<void>) | null>(null);
  const logoutUserRef = useRef<(() => Promise<void>) | null>(null);
  const extendSessionRef = useRef<(() => void) | null>(null);
  
  // Supabase 클라이언트를 useMemo로 안정화
  const supabase = useMemo(() => createClient(), []);
  
  // 사용자 활동 감지 및 세션 연장
  const updateLastActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    warningShownRef.current = false;
    
    // 자동 로그아웃 타이머 재설정
    if (autoLogoutTimerRef.current) {
      clearTimeout(autoLogoutTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    
    setTimeUntilLogout(null);
    
    if (user && setupAutoLogoutTimerRef.current) {
      setupAutoLogoutTimerRef.current();
    }
  }, [user]);
  
  // 세션 연장 함수
  const extendSession = useCallback(() => {
    updateLastActivity();
    toast.info('세션이 연장되었습니다.');
  }, [updateLastActivity]);

  // 세션 타입 설정 함수
  const setSessionType = useCallback((isExtended: boolean) => {
    setIsExtendedSession(isExtended);
    if (typeof window !== 'undefined') {
      localStorage.setItem('keep_login', isExtended ? 'true' : 'false');
    }

    // 세션 타입 변경 시 타이머 재설정
    if (user) {
      // 기존 타이머 정리
      if (autoLogoutTimerRef.current) {
        clearTimeout(autoLogoutTimerRef.current);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }

      setTimeUntilLogout(null);
      warningShownRef.current = false;

      // 새로운 세션 타입으로 타이머 재설정
      if (setupAutoLogoutTimerRef.current) {
        setupAutoLogoutTimerRef.current();
      }
    }
  }, [user]);
  
  // 로그아웃 함수
  const logoutUser = useCallback(async () => {
    try {
      // 세션 경고 토스트 닫기
      toast.dismiss('session-warning');
      
      // 모든 타이머 정리
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      if (autoLogoutTimerRef.current) {
        clearTimeout(autoLogoutTimerRef.current);
        autoLogoutTimerRef.current = null;
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      
      setTimeUntilLogout(null);
      
      // 서버 액션을 통한 로그아웃
      const result = await signOut();
      
      if (result.success) {
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error('로그아웃 중 오류:', error);
    }
  }, []);
  
  // 갱신 타이머 설정 함수
  const setupRefreshTimer = useCallback((expiresAt?: number) => {
    // expires_at이 없으면 기본 JWT 만료 시간 사용 (fallback)
    const effectiveExpiresAt = expiresAt || (Math.floor(Date.now() / 1000) + DEFAULT_JWT_EXPIRY);
    
    const expiresInMs = (effectiveExpiresAt - Math.floor(Date.now() / 1000)) * 1000;
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
  }, [session?.refresh_token]);
  
  // 세션 갱신 함수
  const refreshCurrentSession = useCallback(async () => {
    try {
      // 이전 타이머 정리
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      
      // 현재 사용자 인증 확인 (보안 강화)
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        // 인증 실패 시 로그아웃 처리
        setUser(null);
        setSession(null);
        return;
      }
      
      // 세션 정보가 필요한 경우에만 getSession 사용
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession?.refresh_token) return;
      
      // 서버 액션을 통한 토큰 갱신
      const result = await refreshSession(currentSession.refresh_token);
      
      if (result.success && result.session) {
        // 새로운 세션이 현재 세션과 동일한지 확인 (무한 루프 방지)
        if (currentSession.refresh_token === result.session.refresh_token &&
            currentSession.access_token === result.session.access_token) {
          // 세션이 동일하면 상태 업데이트 없이 다음 갱신만 예약
          if (setupRefreshTimerRef.current) {
            setupRefreshTimerRef.current(result.session.expires_at);
          }
          return;
        }
        
        // 갱신된 세션으로 사용자 정보 재확인 (보안 강화)
        const { data: { user: refreshedUser }, error: refreshUserError } = await supabase.auth.getUser();
        
        if (!refreshUserError && refreshedUser) {
          setUser(refreshedUser);
          setSession(result.session);
          
          // 다음 갱신 일정 설정
          if (setupRefreshTimerRef.current) {
            setupRefreshTimerRef.current(result.session.expires_at);
          }
        } else {
          // 사용자 정보 확인 실패 시 로그아웃
          setUser(null);
          setSession(null);
        }
      } else {
        // 인증 만료 또는 실패
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error('세션 갱신 중 오류:', error);
    }
  }, [supabase.auth]);
  
  // 자동 로그아웃 타이머 설정
  const setupAutoLogoutTimer = useCallback(() => {
    // 현재 세션 타입에 따른 설정 선택
    const sessionConfig = isExtendedSession ? SESSION_TYPES.EXTENDED : SESSION_TYPES.NORMAL;
    const { AUTO_LOGOUT_TIME, SESSION_WARNING_TIME } = sessionConfig;

    // 경고 타이머
    warningTimerRef.current = setTimeout(() => {
      if (!warningShownRef.current) {
        warningShownRef.current = true;

        // 카운트다운 시작
        let countdown = SESSION_WARNING_TIME / 1000;
        setTimeUntilLogout(countdown);

        countdownTimerRef.current = setInterval(() => {
          countdown -= 1;
          setTimeUntilLogout(countdown);

          if (countdown <= 0) {
            if (countdownTimerRef.current) {
              clearInterval(countdownTimerRef.current);
            }
          }
        }, 1000);

        // 세션 타입에 따른 경고 메시지
        const warningMessage = isExtendedSession
          ? '1일 후 자동 로그아웃됩니다.'
          : '30분 후 자동 로그아웃됩니다.';

        // 세션 경고 토스트 (프로그레스 바와 함께)
        toast.info(
          <div>
            <p>{warningMessage}</p>
            <button
              onClick={() => {
                extendSessionRef.current?.();
                toast.dismiss('session-warning'); // 세션 연장 시 토스트 닫기
              }}
              className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              세션 연장
            </button>
          </div>,
          {
            toastId: 'session-warning', // 고유 ID 설정
            autoClose: SESSION_WARNING_TIME, // 설정된 경고 시간 후 자동 닫기
            closeOnClick: false,
            draggable: false,
            hideProgressBar: false, // 프로그레스 바 표시
            pauseOnHover: false, // 호버 시 일시정지 비활성화
            pauseOnFocusLoss: false, // 포커스 잃을 때 일시정지 비활성화
          }
        );
      }
    }, AUTO_LOGOUT_TIME - SESSION_WARNING_TIME);

    // 자동 로그아웃 타이머
    autoLogoutTimerRef.current = setTimeout(async () => {
      try {
        // 세션 경고 토스트 닫기
        toast.dismiss('session-warning');
        
        // 모든 타이머 정리
        if (refreshTimerRef.current) {
          clearTimeout(refreshTimerRef.current);
          refreshTimerRef.current = null;
        }
        if (autoLogoutTimerRef.current) {
          clearTimeout(autoLogoutTimerRef.current);
          autoLogoutTimerRef.current = null;
        }
        if (warningTimerRef.current) {
          clearTimeout(warningTimerRef.current);
          warningTimerRef.current = null;
        }
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        
        setTimeUntilLogout(null);
        
        // 백그라운드에서 서버 로그아웃 처리
        await signOut();
        
        // 토스트 알림 표시
        toast.info('장시간 미사용으로 자동 로그아웃됩니다.');
        
        // 토스트 표시 후 페이지 새로고침 (상태 변경 없이)
        // 헤더와 사이드바 모두 새로고침 시에만 로그아웃 상태로 변경됨
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } catch (error) {
        console.error('자동 로그아웃 중 오류:', error);
      }
    }, AUTO_LOGOUT_TIME);
  }, [isExtendedSession]);
  
  // ref에 함수들 할당
  useEffect(() => {
    setupRefreshTimerRef.current = setupRefreshTimer;
    setupAutoLogoutTimerRef.current = setupAutoLogoutTimer;
    refreshCurrentSessionRef.current = refreshCurrentSession;
    logoutUserRef.current = logoutUser;
    extendSessionRef.current = extendSession;
  }, [setupRefreshTimer, setupAutoLogoutTimer, refreshCurrentSession, logoutUser, extendSession]);
  
  // 사용자 활동 감지 이벤트 리스너 설정
  useEffect(() => {
    if (!user) return;
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      updateLastActivity();
    };
    
    // 이벤트 리스너 등록
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });
    
    // 초기 자동 로그아웃 타이머 설정
    if (setupAutoLogoutTimerRef.current) {
      setupAutoLogoutTimerRef.current();
    }
    
    return () => {
      // 이벤트 리스너 제거
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [user, updateLastActivity]);
  
  // 로그인 성공 토스트 처리
  useEffect(() => {
    // 로딩이 완료되고 사용자가 로그인된 상태에서만 체크
    if (!isLoading && user) {
      const loginSuccess = sessionStorage.getItem('login-success');
      if (loginSuccess === 'true') {
        // sessionStorage에서 플래그 제거
        sessionStorage.removeItem('login-success');
        // 토스트 표시
        toast.success('로그인되었습니다.');
      }
    }
  }, [isLoading, user]);
  
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
  
  // 세션 상태 polling (10분마다 세션 유효성 체크) - 성능 최적화
  useEffect(() => {
    if (!user) return;
    
    // polling 간격을 늘려서 성능 향상 (10분 → 15분)
    const pollInterval = setInterval(async () => {
      try {
        // 사용자 인증 상태 확인 (보안 강화)
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        // 인증이 실패했거나 사용자가 없는 경우
        if (userError || !currentUser) {
          setUser(null);
          setSession(null);
          return;
        }
        
        // 세션 정보 확인 (사용자가 인증된 경우에만)
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        // 세션이 변경된 경우 (다른 탭에서 로그인/로그아웃)
        if (session?.access_token !== currentSession?.access_token) {
          setUser(currentUser);
          setSession(currentSession);
        }
      } catch (error) {
        console.error('세션 polling 오류:', error);
      }
    }, 15 * 60 * 1000); // 15분마다 (성능 최적화)
    
    return () => {
      clearInterval(pollInterval);
    };
  }, [user, session?.access_token, supabase.auth]);
  
  // 초기 세션 로드 및 인증 상태 변경 감지
  useEffect(() => {
    let mounted = true;
    
    async function getInitialSession() {
      try {
        setIsLoading(true);

        // 먼저 세션 존재 여부 확인 (네트워크 요청 없이 빠르게)
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (mounted) {
          if (currentSession) {
            // 세션이 있으면 사용자 정보 검증
            const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

            if (!userError && currentUser) {
              // 어드민 사용자인 경우 자동으로 30일 세션 유지 설정
              try {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('is_admin')
                  .eq('id', currentUser.id)
                  .single();

                if (profile?.is_admin) {
                  const currentKeepLogin = localStorage.getItem('keep_login');
                  if (currentKeepLogin !== 'true') {
                    localStorage.setItem('keep_login', 'true');
                    setIsExtendedSession(true);
                  }
                }
              } catch (error) {
                console.error('어드민 상태 확인 오류:', error);
              }

              setUser(currentUser);
              setSession(currentSession);

              // 세션 갱신 타이머 설정
              if (setupRefreshTimerRef.current) {
                setupRefreshTimerRef.current(currentSession.expires_at);
              }

              // 자동 로그아웃 타이머 설정
              if (setupAutoLogoutTimerRef.current) {
                setupAutoLogoutTimerRef.current();
              }
            } else {
              // 세션은 있지만 사용자 검증 실패 → 로그아웃
              console.warn('세션은 있지만 사용자 검증 실패');
              setUser(null);
              setSession(null);
            }
          } else {
            // 세션 없음
            setUser(null);
            setSession(null);
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
    
    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        

        
        if (event === 'SIGNED_IN' && session) {
          // 보안 강화: getUser()로 실제 인증 확인
          const { data: { user: authenticatedUser }, error: userError } = await supabase.auth.getUser();
          
          if (!userError && authenticatedUser) {
            setUser(authenticatedUser);
            setSession(session);
            
            // 세션 갱신 타이머 설정
            if (setupRefreshTimerRef.current) {
              setupRefreshTimerRef.current(session.expires_at);
            }
            
            // 자동 로그아웃 타이머 설정
            if (setupAutoLogoutTimerRef.current) {
              setupAutoLogoutTimerRef.current();
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          setTimeUntilLogout(null);
          
          // 모든 타이머 정리
          if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
          }
          if (autoLogoutTimerRef.current) {
            clearTimeout(autoLogoutTimerRef.current);
            autoLogoutTimerRef.current = null;
          }
          if (warningTimerRef.current) {
            clearTimeout(warningTimerRef.current);
            warningTimerRef.current = null;
          }
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
        } else if (event === 'TOKEN_REFRESHED' && session) {
          // 토큰 갱신 시에도 getUser()로 확인
          const { data: { user: authenticatedUser }, error: userError } = await supabase.auth.getUser();
          
          if (!userError && authenticatedUser) {
            setUser(authenticatedUser);
            setSession(session);
            
            // 새로운 만료 시간으로 타이머 재설정
            if (setupRefreshTimerRef.current) {
              setupRefreshTimerRef.current(session.expires_at);
            }
          }
        }
      }
    );
    
    return () => {
      mounted = false;
      subscription.unsubscribe();
      
      // 모든 타이머 정리
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      if (autoLogoutTimerRef.current) {
        clearTimeout(autoLogoutTimerRef.current);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [supabase.auth, initialSession]);

  const value = {
    user,
    session,
    isLoading,
    refreshUserData,
    updateIcon,
    logoutUser,
    extendSession,
    timeUntilLogout,
    setSessionType,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 