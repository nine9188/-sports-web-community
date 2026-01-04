'use server'

import { getSupabaseServer, getSupabaseAction, getSupabaseAdmin } from '@/shared/lib/supabase/server'
import { logAuthEvent } from '@/shared/actions/log-actions'
import { headers } from 'next/headers'
import { validateEmail, validatePassword, validateUsername, validateNickname } from './utils/validation'
import type { SignUpResponse, AvailabilityCheckResponse } from '../types'
import { createWelcomeNotification } from '@/domains/notifications/actions/create'
import { processReferral } from '@/shared/actions/referral-actions'
import { generateSecureToken, saveVerificationCode, verifyEmailToken, useEmailToken } from '@/shared/services/verification'
import { sendSignupVerificationEmail } from '@/shared/services/email'

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

    // 4. 이메일 미인증 상태로 변경 (커스텀 이메일 인증 사용을 위해)
    // Supabase의 Confirm email이 OFF인 경우 자동으로 인증된 상태가 되므로, 수동으로 미인증 상태로 변경
    try {
      const adminSupabase = getSupabaseAdmin()
      await adminSupabase.auth.admin.updateUserById(data.user.id, {
        email_confirm: false
      })
    } catch (adminError) {
      console.error('이메일 미인증 상태 설정 오류:', adminError)
      // 실패해도 회원가입은 계속 진행
    }

    // 5. 프로필 생성 대기
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

    // 6. 커스텀 인증 이메일 발송
    try {
      const verificationToken = generateSecureToken()

      // 24시간(1440분) 유효
      const saveResult = await saveVerificationCode(email, verificationToken, 'email_verification', 1440)
      if (!saveResult.success) {
        console.error('인증 토큰 저장 실패:', saveResult.error)
      } else {
        const emailResult = await sendSignupVerificationEmail(
          email,
          verificationToken,
          (metadata?.username as string) || (metadata?.nickname as string) || '회원'
        )
        if (!emailResult.success) {
          console.error('인증 이메일 발송 실패:', emailResult.error)
        }
      }
    } catch (emailError) {
      console.error('인증 이메일 발송 중 오류:', emailError)
      // 이메일 발송 실패해도 회원가입은 성공으로 처리
    }

    // 7. 성공 로그 기록
    await logAuthEvent(
      'SIGNUP_SUCCESS',
      `회원가입 성공: ${email}`,
      data.user.id,
      true,
      { email, username: metadata?.username }
    )

    // 8. 환영 알림 발송 (프로필 생성 후에만)
    if (profileExists) {
      try {
        await createWelcomeNotification({ userId: data.user.id })
      } catch (notificationError) {
        // 알림 발송 실패는 회원가입 성공에 영향 없음
        console.error('환영 알림 발송 실패:', notificationError)
      }
    }

    // 9. 추천 코드 처리 (프로필 생성 후에만)
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
 * 커스텀 이메일 시스템 사용.
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

    // 이메일로 사용자 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, nickname')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      return { success: false, error: '해당 이메일로 가입된 계정을 찾을 수 없습니다.' }
    }

    // 새 인증 토큰 생성 및 저장
    const verificationToken = generateSecureToken()
    const saveResult = await saveVerificationCode(email, verificationToken, 'email_verification', 1440)

    if (!saveResult.success) {
      return { success: false, error: '인증 토큰 생성에 실패했습니다.' }
    }

    // 커스텀 인증 이메일 발송
    const emailResult = await sendSignupVerificationEmail(
      email,
      verificationToken,
      profile.username || profile.nickname || '회원'
    )

    if (!emailResult.success) {
      return { success: false, error: '인증 이메일 발송에 실패했습니다.' }
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
 * 커스텀 이메일 시스템 사용.
 */
export async function resendConfirmationByUsername(
  username: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    if (!username || username.trim().length === 0) {
      return { success: false, error: '아이디를 입력해주세요.' }
    }

    const supabase = await getSupabaseServer()

    // 아이디로 사용자 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, username, nickname')
      .eq('username', username.trim())
      .single()

    if (profileError || !profile?.email) {
      return { success: false, error: '해당 아이디를 찾을 수 없습니다.' }
    }

    // 새 인증 토큰 생성 및 저장
    const verificationToken = generateSecureToken()
    const saveResult = await saveVerificationCode(profile.email, verificationToken, 'email_verification', 1440)

    if (!saveResult.success) {
      return { success: false, error: '인증 토큰 생성에 실패했습니다.' }
    }

    // 커스텀 인증 이메일 발송
    const emailResult = await sendSignupVerificationEmail(
      profile.email,
      verificationToken,
      profile.username || profile.nickname || '회원'
    )

    if (!emailResult.success) {
      return { success: false, error: '인증 이메일 발송에 실패했습니다.' }
    }

    return { success: true, message: '인증 이메일이 재발송되었습니다.' }

  } catch (error) {
    console.error('인증 이메일 재발송 중 오류:', error)
    return { success: false, error: '인증 이메일 재발송 중 오류가 발생했습니다.' }
  }
}

/**
 * 이메일 인증 토큰 검증 및 계정 활성화
 *
 * @description
 * 이메일 인증 링크의 토큰을 검증하고 사용자의 이메일을 확인 처리합니다.
 *
 * @example
 * ```typescript
 * const result = await verifyEmailWithToken(token)
 * if (result.success) {
 *   console.log('이메일 인증이 완료되었습니다')
 * }
 * ```
 */
export async function verifyEmailWithToken(
  token: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    if (!token || !token.trim()) {
      return { success: false, error: '인증 토큰이 제공되지 않았습니다.' }
    }

    // 토큰 검증
    const tokenResult = await verifyEmailToken(token)
    if (!tokenResult.success) {
      return { success: false, error: tokenResult.error }
    }

    const email = tokenResult.email
    if (!email) {
      return { success: false, error: '유효하지 않은 인증 토큰입니다.' }
    }

    // 사용자 조회
    const supabase = await getSupabaseServer()

    // 이메일로 사용자 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' }
    }

    // Supabase Auth에서 이메일 확인 처리 (admin API 사용 - service role 필요)
    const adminSupabase = getSupabaseAdmin()
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
      profile.id,
      { email_confirm: true }
    )

    if (updateError) {
      console.error('이메일 확인 처리 오류:', updateError)
      return { success: false, error: '이메일 확인 처리에 실패했습니다.' }
    }

    // 토큰 사용 처리
    const tokenUseResult = await useEmailToken(token)
    if (!tokenUseResult.success) {
      console.error('토큰 사용 처리 실패:', tokenUseResult.error)
    }

    // 성공 로그 기록
    await logAuthEvent(
      'EMAIL_VERIFIED',
      `이메일 인증 완료: ${email}`,
      profile.id,
      true,
      { email, username: profile.username }
    )

    return { success: true, message: '이메일 인증이 완료되었습니다.' }

  } catch (error) {
    console.error('이메일 인증 오류:', error)
    return { success: false, error: '이메일 인증 중 오류가 발생했습니다.' }
  }
}
