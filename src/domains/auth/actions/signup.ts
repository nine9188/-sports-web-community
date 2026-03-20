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
      // Supabase 에러 메시지를 사용자에게 직접 노출하지 않음
      const userMessage = error.message?.includes('already registered')
        ? '이미 등록된 이메일입니다.'
        : '회원가입 처리 중 오류가 발생했습니다.'
      return { success: false, error: userMessage }
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

/**
 * 소셜 로그인 사용자 프로필 확인
 *
 * @description
 * 소셜 로그인 사용자가 이미 프로필(닉네임)을 설정했는지 확인합니다.
 *
 * @example
 * ```typescript
 * const result = await checkSocialProfile()
 * if (result.hasProfile) {
 *   // 이미 프로필 설정 완료
 * }
 * ```
 */
export async function checkSocialProfile(): Promise<{ hasProfile: boolean }> {
  try {
    const supabase = await getSupabaseServer()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { hasProfile: false }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('id', user.id)
      .single()

    const hasProfile = !!(profile && profile.nickname && profile.nickname.trim() !== '')

    return { hasProfile }

  } catch (error) {
    console.error('소셜 프로필 확인 중 오류:', error)
    return { hasProfile: false }
  }
}

/**
 * 소셜 로그인 회원가입 완료
 *
 * @description
 * 소셜 로그인 사용자의 프로필을 생성/업데이트합니다.
 * username을 자동 생성하고, 닉네임/생년월일/추천코드를 설정합니다.
 *
 * @example
 * ```typescript
 * const result = await completeSocialSignup({
 *   nickname: '닉네임',
 *   birthDate: '2000.01.01',
 *   referralCode: 'a1b2c3d4'
 * })
 * ```
 */
export async function completeSocialSignup({
  nickname,
  birthDate,
  referralCode,
}: {
  nickname: string
  birthDate: string
  referralCode?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    // 닉네임 검증
    const nicknameValidation = validateNickname(nickname)
    if (!nicknameValidation.valid) {
      return { success: false, error: nicknameValidation.error }
    }

    const supabase = await getSupabaseServer()

    // 1. 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: '로그인 정보를 찾을 수 없습니다.' }
    }

    // 2. 닉네임 중복 확인
    const { data: existingNickname } = await supabase
      .from('profiles')
      .select('id')
      .eq('nickname', nickname.trim())
      .neq('id', user.id)
      .limit(1)

    if (existingNickname && existingNickname.length > 0) {
      return { success: false, error: '이미 사용 중인 닉네임입니다.' }
    }

    // 3. username 자동 생성
    const provider = user.app_metadata?.provider || 'social'
    const baseUsername = `${provider}_${user.id.slice(0, 8)}`
    let username = baseUsername
    let counter = 1

    while (true) {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', user.id)
        .single()

      if (!existingUser) break

      username = `${baseUsername}_${counter}`
      counter++

      if (counter > 50) {
        username = `${baseUsername}_${Date.now()}`
        break
      }
    }

    // 4. 프로필 upsert
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        username,
        nickname: nickname.trim(),
        full_name: user.user_metadata?.name || user.user_metadata?.full_name || null,
        birth_date: birthDate ? birthDate.replace(/\./g, '-') : null,
        ...(referralCode?.trim() ? { referral_code: referralCode.trim() } : {}),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })

    if (upsertError) {
      console.error('프로필 생성 오류:', upsertError)
      return { success: false, error: '회원가입 중 오류가 발생했습니다.' }
    }

    // 5. 환영 알림 발송
    try {
      await createWelcomeNotification({ userId: user.id })
    } catch (e) {
      console.error('환영 알림 발송 실패:', e)
    }

    // 6. 추천 코드 처리
    if (referralCode?.trim()) {
      try {
        const referralResult = await processReferral(user.id, referralCode.trim())
        if (!referralResult.success) {
          console.error('추천 처리 실패:', referralResult.error)
        }
      } catch (referralError) {
        console.error('추천 처리 중 오류:', referralError)
      }
    }

    return { success: true }

  } catch (error) {
    console.error('소셜 회원가입 완료 중 오류:', error)
    return { success: false, error: '회원가입 중 오류가 발생했습니다.' }
  }
}
