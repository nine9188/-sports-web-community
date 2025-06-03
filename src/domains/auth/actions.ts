'use server'

import { createClient } from '@/shared/api/supabaseServer'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

/**
 * 사용자 로그인 처리 서버 액션
 */
export async function signIn(email: string, password: string) {
  try {
    const supabase = await createClient()
    
    // 로그인 시도 제한 확인
    const now = Date.now();
    
    // 차단 상태 확인 (15분 차단)
    const blockData = await checkLoginBlock(email);
    if (blockData.isBlocked) {
      const remainingTime = Math.ceil((blockData.blockedUntil - now) / 1000 / 60);
      return { 
        error: `너무 많은 로그인 시도로 인해 ${remainingTime}분간 차단되었습니다. 나중에 다시 시도해주세요.` 
      };
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // 로그인 실패 시 시도 횟수 증가
      await recordLoginAttempt(email);
      return { error: error.message }
    }

    // 로그인 성공 시 시도 기록 초기화
    await clearLoginAttempts(email);
    
    // 다중 로그인 차단 - 기존 세션 무효화
    if (data.user) {
      await handleSingleDeviceLogin(data.user.id);
    }

    revalidatePath('/', 'layout')
    return { data, success: true }
  } catch {
    return { error: '로그인 중 오류가 발생했습니다.' }
  }
}

/**
 * 로그인 차단 상태 확인
 */
async function checkLoginBlock(email: string): Promise<{ isBlocked: boolean; blockedUntil: number }> {
  const now = Date.now();
  
  try {
    const supabase = await createClient();
    
    // 최근 15분간의 로그인 시도 기록 조회
    const { data: attempts } = await supabase
      .from('login_attempts')
      .select('*')
      .eq('email', email)
      .gte('created_at', new Date(now - 15 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });
    
    if (!attempts || attempts.length < 5) {
      return { isBlocked: false, blockedUntil: 0 };
    }
    
    // 5회 이상 실패 시 15분 차단
    const latestAttempt = attempts[0];
    const attemptTime = latestAttempt.created_at;
    if (!attemptTime) {
      return { isBlocked: false, blockedUntil: 0 };
    }
    
    const blockedUntil = new Date(attemptTime).getTime() + (15 * 60 * 1000);
    
    return {
      isBlocked: now < blockedUntil,
      blockedUntil
    };
  } catch (error) {
    console.error('로그인 차단 확인 오류:', error);
    return { isBlocked: false, blockedUntil: 0 };
  }
}

/**
 * 로그인 시도 기록
 */
async function recordLoginAttempt(email: string): Promise<void> {
  try {
    const supabase = await createClient();
    
    await supabase
      .from('login_attempts')
      .insert({
        email,
        ip_address: 'unknown', // 실제 구현 시 IP 주소 추가
        user_agent: 'unknown', // 실제 구현 시 User-Agent 추가
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('로그인 시도 기록 오류:', error);
  }
}

/**
 * 로그인 시도 기록 초기화
 */
async function clearLoginAttempts(email: string): Promise<void> {
  try {
    const supabase = await createClient();
    
    await supabase
      .from('login_attempts')
      .delete()
      .eq('email', email);
  } catch (error) {
    console.error('로그인 시도 기록 초기화 오류:', error);
  }
}

/**
 * 단일 디바이스 로그인 처리 (다중 로그인 차단)
 */
async function handleSingleDeviceLogin(userId: string) {
  try {
    const supabase = await createClient();
    const now = new Date().toISOString();
    const sessionId = generateSessionId();
    
    // 기존 활성 세션 확인
    const { data: existingSessions } = await supabase
      .from('user_sessions')
      .select('session_id, created_at')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    // 기존 세션들을 비활성화
    if (existingSessions && existingSessions.length > 0) {
      await supabase
        .from('user_sessions')
        .update({ 
          is_active: false, 
          ended_at: now 
        })
        .eq('user_id', userId)
        .eq('is_active', true);
      
      console.log(`사용자 ${userId}의 기존 세션 ${existingSessions.length}개를 무효화했습니다.`);
    }
    
    // 새 세션 기록
    await supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        session_id: sessionId,
        created_at: now,
        last_activity: now,
        is_active: true
      });
    
    // 세션 ID를 로컬 스토리지에 저장 (클라이언트에서 확인용)
    if (typeof window !== 'undefined') {
      localStorage.setItem('current_session_id', sessionId);
    }
    
  } catch (error) {
    console.error('단일 디바이스 로그인 처리 오류:', error);
  }
}

/**
 * 세션 ID 생성
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 현재 세션 유효성 확인
 */
export async function validateCurrentSession() {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { valid: false, reason: 'no_user' };
    
    // 클라이언트에서 세션 ID 확인
    const currentSessionId = typeof window !== 'undefined' 
      ? localStorage.getItem('current_session_id') 
      : null;
    
    if (!currentSessionId) return { valid: false, reason: 'no_session_id' };
    
    // 서버에서 세션 유효성 확인
    const { data: sessionData } = await supabase
      .from('user_sessions')
      .select('is_active, created_at')
      .eq('user_id', user.id)
      .eq('session_id', currentSessionId)
      .eq('is_active', true)
      .single();
    
    if (!sessionData) {
      // 다른 디바이스에서 로그인했음을 의미
      return { valid: false, reason: 'session_invalidated' };
    }
    
    // 세션 활동 시간 업데이트
    await supabase
      .from('user_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('session_id', currentSessionId);
    
    return { valid: true };
    
  } catch (error) {
    console.error('세션 유효성 확인 오류:', error);
    return { valid: false, reason: 'error' };
  }
}

/**
 * 사용자 회원가입 처리 서버 액션
 */
export async function signUp(email: string, password: string, metadata?: Record<string, unknown>) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata || {}
      }
    })

    if (error) {
      return { error: error.message }
    }

    // 회원가입 성공 시 프로필 생성
    if (data.user && metadata) {
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: data.user.email,
            username: metadata.username as string || null,
            nickname: metadata.nickname as string || null,
            full_name: metadata.full_name as string || null,
            updated_at: new Date().toISOString()
          })
        
        if (profileError) {
          console.error('프로필 생성 오류:', profileError)
          // 프로필 생성 실패해도 회원가입은 성공으로 처리
          // 사용자가 나중에 프로필을 설정할 수 있음
        }
      } catch (profileError) {
        console.error('프로필 생성 중 오류:', profileError)
      }
    }

    return { data, success: true }
  } catch {
    return { error: '회원가입 중 오류가 발생했습니다.' }
  }
}

/**
 * 사용자 로그아웃 처리 서버 액션
 */
export async function signOut() {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { error: '로그아웃 중 오류가 발생했습니다.' }
  }
}

/**
 * 현재 로그인한 사용자 정보 조회
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { user: null }
    }
    
    // 추가 프로필 정보 가져오기
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    return { 
      user,
      profile
    }
  } catch (error) {
    console.error('사용자 정보 조회 중 오류:', error)
    return { user: null }
  }
}

/**
 * 사용자 메타데이터 업데이트
 */
export async function updateUserData(userId: string, metadata: Record<string, unknown>) {
  try {
    const supabase = await createClient()
    
    // 메타데이터 업데이트
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      { user_metadata: metadata }
    )
    
    if (error) {
      console.error('사용자 데이터 업데이트 오류:', error)
      return { success: false, error: error.message }
    }
    
    return { 
      success: true, 
      user: data.user
    }
  } catch (error) {
    console.error('사용자 데이터 업데이트 중 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '사용자 데이터 업데이트 중 오류가 발생했습니다'
    }
  }
}

/**
 * 세션 갱신
 */
export async function refreshSession(refreshToken: string) {
  try {
    const supabase = await createClient()
    
    // 세션 갱신
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    })
    
    if (error) {
      console.error('세션 갱신 오류:', error)
      return { success: false, error: error.message }
    }
    
    return { 
      success: true, 
      session: data.session
    }
  } catch (error) {
    console.error('세션 갱신 중 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '세션 갱신 중 오류가 발생했습니다'
    }
  }
}

/**
 * 비밀번호 재설정 이메일 발송
 */
export async function resetPassword(email: string) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
    })
    
    if (error) {
      return { error: error.message }
    }
    
    return { success: true, message: '비밀번호 재설정 이메일이 발송되었습니다.' }
  } catch {
    return { error: '비밀번호 재설정 이메일 발송 중 오류가 발생했습니다.' }
  }
}

/**
 * 비밀번호 업데이트
 */
export async function updatePassword(password: string) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.updateUser({
      password
    })
    
    if (error) {
      return { error: error.message }
    }
    
    return { success: true, message: '비밀번호가 성공적으로 변경되었습니다.' }
  } catch {
    return { error: '비밀번호 변경 중 오류가 발생했습니다.' }
  }
}

/**
 * 이메일 인증 재발송
 */
export async function resendConfirmation(email: string) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    })
    
    if (error) {
      return { error: error.message }
    }
    
    return { success: true, message: '인증 이메일이 재발송되었습니다.' }
  } catch {
    return { error: '인증 이메일 재발송 중 오류가 발생했습니다.' }
  }
}

/**
 * 아이디 찾기 처리 서버 액션
 */
export async function findUsername(email: string, verificationCode: string) {
  try {
    const supabase = await createClient()
    
    // 1. 인증 코드 확인 (OTP 검증)
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: verificationCode,
      type: 'email'
    })
    
    if (verifyError) {
      return { error: '인증 코드가 올바르지 않습니다' }
    }
    
    // 2. 이메일로 사용자 정보 조회
    const { data, error } = await supabase
      .from('profiles')
      .select('username, full_name')
      .eq('email', email)
      .single()
    
    if (error || !data) {
      return { error: '입력하신 정보와 일치하는 계정을 찾을 수 없습니다' }
    }
    
    return { 
      success: true, 
      username: data.username, 
      fullName: data.full_name 
    }
  } catch (error) {
    console.error('아이디 찾기 오류:', error)
    return { error: '계정 정보를 찾는 중 오류가 발생했습니다' }
  }
}

/**
 * 로그인 후 리다이렉트 처리
 */
export async function signInAndRedirect(email: string, password: string, redirectTo?: string) {
  const result = await signIn(email, password)
  
  if (result.success) {
    redirect(redirectTo || '/')
  }
  
  return result
}

/**
 * 로그아웃 후 리다이렉트 처리
 */
export async function signOutAndRedirect(redirectTo?: string) {
  const result = await signOut()
  
  if (result.success) {
    redirect(redirectTo || '/')
  }
  
  return result
}

/**
 * 사용자명(아이디) 중복 확인 서버 액션
 */
export async function checkUsernameAvailability(username: string) {
  try {
    if (!username || username.length < 4) {
      return { available: false, error: '아이디는 최소 4자 이상이어야 합니다.' }
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { available: false, error: '아이디는 영문, 숫자, 언더스코어(_)만 사용 가능합니다.' }
    }
    
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .limit(1)
    
    if (error) {
      console.error('아이디 중복 확인 오류:', error)
      return { available: false, error: '아이디 확인 중 오류가 발생했습니다.' }
    }
    
    const available = !data || data.length === 0
    return { 
      available, 
      message: available ? '사용 가능한 아이디입니다.' : '이미 사용 중인 아이디입니다.' 
    }
  } catch (error) {
    console.error('아이디 중복 확인 중 오류:', error)
    return { available: false, error: '아이디 확인 중 오류가 발생했습니다.' }
  }
}

/**
 * 닉네임 중복 확인 서버 액션
 */
export async function checkNicknameAvailability(nickname: string) {
  try {
    if (!nickname || nickname.length < 2) {
      return { available: false, error: '닉네임은 최소 2자 이상이어야 합니다.' }
    }
    
    if (!/^[a-zA-Z0-9가-힣_]+$/.test(nickname)) {
      return { available: false, error: '닉네임은 영문, 숫자, 한글, 언더스코어(_)만 사용 가능합니다.' }
    }
    
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('nickname', nickname)
      .limit(1)

    if (error) {
      console.error('닉네임 중복 확인 오류:', error)
      return { available: false, error: '닉네임 확인 중 오류가 발생했습니다.' }
    }
    
    const available = !data || data.length === 0
    return { 
      available, 
      message: available ? '사용 가능한 닉네임입니다.' : '이미 사용 중인 닉네임입니다.' 
    }
  } catch (error) {
    console.error('닉네임 중복 확인 중 오류:', error)
    return { available: false, error: '닉네임 확인 중 오류가 발생했습니다.' }
  }
} 