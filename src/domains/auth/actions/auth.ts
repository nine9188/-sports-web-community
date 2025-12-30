'use server'

import { getSupabaseServer, getSupabaseAction } from '@/shared/lib/supabase/server'
import { logAuthEvent, logError } from '@/shared/actions/log-actions'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

import { checkLoginAttempts, recordAttempt, clearAttempts } from './utils/login-attempts'
import { recordDailyLogin } from '@/shared/actions/attendance-actions'
import type { SignInResponse, UserProfile } from '../types'

/**
 * 로그인 (아이디 기반)
 *
 * @description
 * 아이디와 비밀번호로 로그인합니다.
 * - 로그인 시도 제한 (5회 실패 시 15분 차단)
 * - 로그인 성공 시 세션 생성
 * - 보안 로그 기록
 *
 * @example
 * ```typescript
 * const result = await signIn('myusername', 'password123')
 * if (result.success) {
 *   console.log('로그인 성공:', result.data.user)
 * }
 * ```
 */
export async function signIn(
  username: string,
  password: string
): Promise<SignInResponse> {
  try {
    // 1. 입력 검증
    if (!username || !password) {
      return { success: false, error: '아이디와 비밀번호를 입력해주세요.' }
    }

    // 2. 로그인 시도 제한 체크
    const blockCheck = await checkLoginAttempts(username)
    if (blockCheck.isBlocked) {
      return { success: false, error: blockCheck.message }
    }

    const supabase = await getSupabaseAction()

    // 3. 아이디로 이메일 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', username)
      .single()

    if (profileError || !profile?.email) {
      await recordAttempt(username, 'invalid_username')

      await logAuthEvent(
        'LOGIN_FAILED',
        `로그인 실패: 존재하지 않는 사용자명 ${username}`,
        undefined,
        false,
        { username, reason: 'invalid_username' }
      )

      return { success: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' }
    }

    // 4. 로그인 시도
    const { data, error } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password,
    })

    if (error || !data.user || !data.session) {
      await recordAttempt(username, 'invalid_password')

      await logAuthEvent(
        'LOGIN_FAILED',
        `로그인 실패: 잘못된 비밀번호 ${username}`,
        undefined,
        false,
        { username, reason: 'invalid_password', error: error?.message }
      )

      return { success: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' }
    }

    // 5. 로그인 성공 처리
    await clearAttempts(username)

    // 6. 일일 출석 기록 및 보상 (비동기로 처리, 실패해도 로그인은 성공)
    recordDailyLogin(data.user.id).catch(err => {
      console.error('출석 기록 오류:', err)
    })

    await logAuthEvent(
      'LOGIN_SUCCESS',
      `로그인 성공: ${username}`,
      data.user.id,
      true,
      { username, email: profile.email }
    )

    revalidatePath('/', 'layout')

    return {
      success: true,
      data: {
        user: data.user,
        session: data.session
      }
    }

  } catch (error) {
    console.error('로그인 중 오류:', error)

    await logError(
      'LOGIN_SYSTEM_ERROR',
      error instanceof Error ? error : new Error(String(error)),
      undefined,
      { username }
    )

    return { success: false, error: '로그인 중 오류가 발생했습니다.' }
  }
}

/**
 * 로그인 후 리다이렉트
 */
export async function signInAndRedirect(
  username: string,
  password: string,
  redirectTo?: string
): Promise<never> {
  const result = await signIn(username, password)

  if (result.success) {
    redirect(redirectTo || '/')
  }

  // 실패 시에도 로그인 페이지로 리다이렉트 (에러 메시지는 쿼리스트링으로)
  redirect(`/signin?error=${encodeURIComponent(result.error || '로그인 실패')}`)
}

/**
 * 로그아웃
 *
 * @description
 * 현재 세션을 종료하고 로그아웃합니다.
 *
 * @example
 * ```typescript
 * const result = await signOut()
 * if (result.success) {
 *   console.log('로그아웃 성공')
 * }
 * ```
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseAction()

    // 로그아웃 전 사용자 정보 확인
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.auth.signOut()

    if (error) {
      return { success: false, error: error.message }
    }

    // 로그아웃 성공 로그 기록
    if (user) {
      await logAuthEvent(
        'LOGOUT_SUCCESS',
        `로그아웃 성공: ${user.email}`,
        user.id,
        true,
        { email: user.email }
      )
    }

    revalidatePath('/', 'layout')
    return { success: true }

  } catch (error) {
    console.error('로그아웃 중 오류:', error)
    return { success: false, error: '로그아웃 중 오류가 발생했습니다.' }
  }
}

/**
 * 로그아웃 후 리다이렉트
 */
export async function signOutAndRedirect(redirectTo?: string): Promise<never> {
  const result = await signOut()

  if (result.success) {
    redirect(redirectTo || '/')
  }

  // 실패 시에도 홈으로 리다이렉트
  redirect('/')
}

/**
 * 현재 로그인한 사용자 정보 조회
 *
 * @description
 * 현재 로그인한 사용자의 정보와 프로필을 조회합니다.
 * 인증되지 않은 경우 null을 반환합니다.
 *
 * @example
 * ```typescript
 * const { user, profile } = await getCurrentUser()
 * if (user) {
 *   console.log('현재 사용자:', user.email)
 * }
 * ```
 */
export async function getCurrentUser(): Promise<{
  user: User | null
  profile?: UserProfile
}> {
  try {
    const supabase = await getSupabaseServer()

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
      profile: profile as UserProfile
    }
  } catch (error) {
    console.error('사용자 정보 조회 중 오류:', error)
    return { user: null }
  }
}

/**
 * 세션 갱신
 *
 * @description
 * Refresh Token을 사용하여 세션을 갱신합니다.
 *
 * @example
 * ```typescript
 * const result = await refreshSession(refreshToken)
 * if (result.success) {
 *   console.log('세션 갱신 성공')
 * }
 * ```
 */
export async function refreshSession(
  refreshToken: string
): Promise<{ success: boolean; session?: any; error?: string }> {
  try {
    const supabase = await getSupabaseAction()

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    })

    if (error) {
      console.error('세션 갱신 오류:', error)
      return { success: false, error: error.message }
    }

    return { success: true, session: data.session }

  } catch (error) {
    console.error('세션 갱신 중 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '세션 갱신 중 오류가 발생했습니다.'
    }
  }
}
