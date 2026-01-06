'use server'

import { getSupabaseServer, getSupabaseAction } from '@/shared/lib/supabase/server'
import { logAuthEvent } from '@/shared/actions/log-actions'
import { headers } from 'next/headers'
import { validateEmail, validatePassword, validateUsername, validateNickname } from './utils/validation'
import type { SignUpResponse, AvailabilityCheckResponse } from '../types'
import { createWelcomeNotification } from '@/domains/notifications/actions/create'
import { processReferral } from '@/shared/actions/referral-actions'

/**
 * 회원가입
 *
 * @description
 * 이메일과 비밀번호로 회원가입합니다.
 * - Turnstile 캡차 검증
 * - 이메일 인증 필요
 * - 프로필 자동 생성
 *
 * @example
 * ```typescript
 * const result = await signUp('user@example.com', 'password123', {
 *   username: 'myusername',
 *   nickname: '닉네임',
 *   full_name: '홍길동'
 * }, turnstileToken)
 * ```
 */
export async function signUp(
  email: string,
  password: string,
  metadata?: Record<string, unknown>,
  turnstileToken?: string
): Promise<SignUpResponse> {
  try {
    // 1. 입력 검증
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      return { success: false, error: emailValidation.error }
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.error }
    }

    // 2. Turnstile 캡차 검증
    const secret = process.env.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET
    if (!secret) {
      return { success: false, error: '서버 설정 오류: 캡차 비밀키가 없습니다.' }
    }

    if (!turnstileToken) {
      return { success: false, error: '보안 확인이 필요합니다.' }
    }

    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim()
    const body = new URLSearchParams({ secret, response: turnstileToken })
    if (ip) body.set('remoteip', ip)

    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body
    })
    const verify = await resp.json()

    if (!verify?.success) {
      return { success: false, error: '보안 확인에 실패했습니다. 새로고침 후 다시 시도해주세요.' }
    }

    // 3. 회원가입 처리
    const supabase = await getSupabaseAction()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata || {}
      }
    })

    if (error) {
      await logAuthEvent(
        'SIGNUP_FAILED',
        `회원가입 실패: ${email}`,
        undefined,
        false,
        { email, reason: error.message }
      )
      return { success: false, error: error.message }
    }

    if (!data.user) {
      return { success: false, error: '회원가입 처리 중 오류가 발생했습니다.' }
    }

    // 4. 프로필 생성 대기
    const waitForProfile = async (userId: string, maxRetries = 10): Promise<boolean> => {
      for (let i = 0; i < maxRetries; i++) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle()

        if (profile) return true
        await new Promise(resolve => setTimeout(resolve, 200)) // 200ms 대기
      }
      return false
    }

    const profileExists = await waitForProfile(data.user.id)
    if (!profileExists) {
      console.error('프로필 생성 대기 시간 초과')
    }

    // 5. 성공 로그 기록
    await logAuthEvent(
      'SIGNUP_SUCCESS',
      `회원가입 성공: ${email}`,
      data.user.id,
      true,
      { email, username: metadata?.username }
    )

    // 6. 환영 알림 발송 (프로필 생성 후에만)
    if (profileExists) {
      try {
        await createWelcomeNotification({ userId: data.user.id })
      } catch (notificationError) {
        // 알림 발송 실패는 회원가입 성공에 영향 없음
        console.error('환영 알림 발송 실패:', notificationError)
      }
    }

    // 7. 추천 코드 처리 (프로필 생성 후에만)
    if (profileExists && metadata?.referral_code) {
      try {
        const referralResult = await processReferral(
          data.user.id,
          metadata.referral_code as string
        )
        if (!referralResult.success) {
          // 추천 처리 실패는 회원가입 성공에 영향 없음
          console.error('추천 처리 실패:', referralResult.error)
        }
      } catch (referralError) {
        console.error('추천 처리 중 오류:', referralError)
      }
    }

    return {
      success: true,
      data: { user: data.user }
    }

  } catch (error) {
    console.error('회원가입 중 오류:', error)
    return { success: false, error: '회원가입 중 오류가 발생했습니다.' }
  }
}

/**
 * 이메일 중복 확인
 *
 * @description
 * 이메일이 이미 사용 중인지 확인합니다.
 *
 * @example
 * ```typescript
 * const result = await checkEmailAvailability('user@example.com')
 * if (result.available) {
 *   console.log('사용 가능한 이메일입니다')
 * }
 * ```
 */
export async function checkEmailAvailability(
  email: string
): Promise<AvailabilityCheckResponse> {
  try {
    // 입력 검증
    const validation = validateEmail(email)
    if (!validation.valid) {
      return { available: false, message: validation.error }
    }

    const supabase = await getSupabaseServer()

    // auth.users 테이블은 직접 조회할 수 없으므로 profiles 테이블에서 확인
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .limit(1)

    if (error) {
      console.error('이메일 중복 확인 오류:', error)
      return { available: false, message: '이메일 확인 중 오류가 발생했습니다.' }
    }

    const available = !data || data.length === 0

    return {
      available,
      message: available ? '사용 가능한 이메일입니다.' : '이미 사용 중인 이메일입니다.'
    }

  } catch (error) {
    console.error('이메일 중복 확인 중 오류:', error)
    return { available: false, message: '이메일 확인 중 오류가 발생했습니다.' }
  }
}

/**
 * 아이디 중복 확인
 *
 * @description
 * 아이디(username)가 사용 가능한지 확인합니다.
 *
 * @example
 * ```typescript
 * const result = await checkUsernameAvailability('myusername')
 * if (result.available) {
 *   console.log('사용 가능한 아이디입니다')
 * }
 * ```
 */
export async function checkUsernameAvailability(
  username: string
): Promise<AvailabilityCheckResponse> {
  try {
    // 입력 검증
    const validation = validateUsername(username)
    if (!validation.valid) {
      return { available: false, message: validation.error }
    }

    const supabase = await getSupabaseServer()

    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .limit(1)

    if (error) {
      console.error('아이디 중복 확인 오류:', error)
      return { available: false, message: '아이디 확인 중 오류가 발생했습니다.' }
    }

    const available = !data || data.length === 0

    return {
      available,
      message: available ? '사용 가능한 아이디입니다.' : '이미 사용 중인 아이디입니다.'
    }

  } catch (error) {
    console.error('아이디 중복 확인 중 오류:', error)
    return { available: false, message: '아이디 확인 중 오류가 발생했습니다.' }
  }
}

/**
 * 닉네임 중복 확인
 *
 * @description
 * 닉네임이 사용 가능한지 확인합니다.
 *
 * @example
 * ```typescript
 * const result = await checkNicknameAvailability('내닉네임')
 * if (result.available) {
 *   console.log('사용 가능한 닉네임입니다')
 * }
 * ```
 */
export async function checkNicknameAvailability(
  nickname: string
): Promise<AvailabilityCheckResponse> {
  try {
    // 입력 검증
    const validation = validateNickname(nickname)
    if (!validation.valid) {
      return { available: false, message: validation.error }
    }

    const supabase = await getSupabaseServer()

    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('nickname', nickname)
      .limit(1)

    if (error) {
      console.error('닉네임 중복 확인 오류:', error)
      return { available: false, message: '닉네임 확인 중 오류가 발생했습니다.' }
    }

    const available = !data || data.length === 0

    return {
      available,
      message: available ? '사용 가능한 닉네임입니다.' : '이미 사용 중인 닉네임입니다.'
    }

  } catch (error) {
    console.error('닉네임 중복 확인 중 오류:', error)
    return { available: false, message: '닉네임 확인 중 오류가 발생했습니다.' }
  }
}

/**
 * 인증 이메일 재발송 (이메일로)
 *
 * @description
 * 회원가입 시 받지 못한 인증 이메일을 재발송합니다.
 *
 * @example
 * ```typescript
 * const result = await resendConfirmation('user@example.com')
 * if (result.success) {
 *   console.log('인증 이메일이 재발송되었습니다')
 * }
 * ```
 */
export async function resendConfirmation(
  email: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      return { success: false, error: emailValidation.error }
    }

    const supabase = await getSupabaseServer()

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, message: '인증 이메일이 재발송되었습니다.' }

  } catch (error) {
    console.error('인증 이메일 재발송 중 오류:', error)
    return { success: false, error: '인증 이메일 재발송 중 오류가 발생했습니다.' }
  }
}

/**
 * 인증 이메일 재발송 (아이디로)
 *
 * @description
 * 아이디(username)를 사용하여 이메일로 인증 이메일을 재발송합니다.
 */
export async function resendConfirmationByUsername(
  username: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    if (!username || username.trim().length === 0) {
      return { success: false, error: '아이디를 입력해주세요.' }
    }

    const supabase = await getSupabaseServer()

    // 아이디로 이메일 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', username.trim())
      .single()

    if (profileError || !profile?.email) {
      return { success: false, error: '해당 아이디를 찾을 수 없습니다.' }
    }

    // 이메일 재발송
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: profile.email,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, message: '인증 이메일이 재발송되었습니다.' }

  } catch (error) {
    console.error('인증 이메일 재발송 중 오류:', error)
    return { success: false, error: '인증 이메일 재발송 중 오류가 발생했습니다.' }
  }
}
