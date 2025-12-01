'use server'

import { getSupabaseServer, getSupabaseAction } from '@/shared/lib/supabase/server'
import { logAuthEvent } from '@/shared/actions/log-actions'
import { headers } from 'next/headers'
import { validateEmail, validatePassword, validateUsername, validateNickname } from './utils/validation'
import type { SignUpResponse, AvailabilityCheckResponse } from '../types'
import { createWelcomeNotification } from '@/domains/notifications/actions/create'

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

    // 4. 프로필 생성
    if (metadata) {
      try {
        const profileData = {
          id: data.user.id,
          email: data.user.email,
          username: (metadata.username as string) || null,
          nickname: (metadata.nickname as string) || null,
          full_name: (metadata.full_name as string) || null,
          updated_at: new Date().toISOString()
        }

        console.log('프로필 생성 시도:', { ...profileData, id: data.user.id.substring(0, 8) + '...' })

        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(profileData)

        if (profileError) {
          console.error('프로필 생성 오류:', profileError)
          await logAuthEvent(
            'PROFILE_CREATE_FAILED',
            `프로필 생성 실패: ${email}`,
            data.user.id,
            false,
            { email, username: metadata.username, error: profileError.message }
          )
          // 프로필 생성 실패 시 에러 반환
          return {
            success: false,
            error: '프로필 생성에 실패했습니다. 관리자에게 문의해주세요.'
          }
        }

        console.log('프로필 생성 성공')
      } catch (profileError) {
        console.error('프로필 생성 중 오류:', profileError)
        return {
          success: false,
          error: '프로필 생성 중 오류가 발생했습니다.'
        }
      }
    }

    // 5. 성공 로그 기록
    await logAuthEvent(
      'SIGNUP_SUCCESS',
      `회원가입 성공: ${email}`,
      data.user.id,
      true,
      { email, username: metadata?.username }
    )

    // 6. 환영 알림 발송
    try {
      await createWelcomeNotification({ userId: data.user.id })
      console.log('환영 알림 발송 성공')
    } catch (notificationError) {
      // 알림 발송 실패는 회원가입 성공에 영향 없음
      console.error('환영 알림 발송 실패:', notificationError)
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
 * 인증 이메일 재발송
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
