'use server'

import { getSupabaseServer } from '@/shared/lib/supabase/server'
import {
  generateVerificationCode,
  saveVerificationCode,
  verifyCode
} from '@/shared/services/verification'
import { sendVerificationCodeEmail } from '@/shared/services/email'
import { logAuthEvent } from '@/shared/actions/log-actions'
import { validateEmail } from './utils/validation'
import type { UsernameRecoveryResponse } from '../types'

/**
 * 아이디 찾기 - 인증 코드 발송
 *
 * @description
 * 이메일과 이름으로 사용자를 확인하고 인증 코드를 발송합니다.
 *
 * @example
 * ```typescript
 * const result = await sendIdRecoveryCode('user@example.com', '홍길동')
 * if (result.success) {
 *   console.log('인증 코드가 발송되었습니다')
 * }
 * ```
 */
export async function sendIdRecoveryCode(
  email: string,
  fullName: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // 입력 검증
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      return { success: false, error: emailValidation.error }
    }

    if (!fullName || !fullName.trim()) {
      return { success: false, error: '이름을 입력해주세요.' }
    }

    // 이메일과 이름으로 사용자 존재 확인
    const supabase = await getSupabaseServer()
    const { data: user, error } = await supabase
      .from('profiles')
      .select('username, full_name, id')
      .eq('email', email)
      .eq('full_name', fullName)
      .single()

    if (error || !user) {
      // 보안: 실제로 사용자가 없어도 모호한 메시지 반환
      return {
        success: false,
        error: '입력하신 이메일과 이름에 일치하는 계정을 찾을 수 없습니다.'
      }
    }

    // 인증 코드 생성 (6자리)
    const verificationCode = generateVerificationCode()

    // 데이터베이스에 저장 (5분 유효)
    const saveResult = await saveVerificationCode(email, verificationCode, 'id_recovery', 5)
    if (!saveResult.success) {
      return { success: false, error: saveResult.error }
    }

    // 이메일 발송
    const emailResult = await sendVerificationCodeEmail(email, verificationCode)
    if (!emailResult.success) {
      return { success: false, error: '인증 코드 이메일 발송에 실패했습니다.' }
    }

    // 보안 로그 기록
    await logAuthEvent(
      'ID_RECOVERY_CODE_SENT',
      `아이디 찾기 인증 코드 발송: ${email}`,
      user.id,
      true,
      { email, fullName }
    )

    return {
      success: true,
      message: '인증 코드가 이메일로 발송되었습니다.'
    }

  } catch (error) {
    console.error('아이디 찾기 코드 발송 오류:', error)
    return { success: false, error: '인증 코드 발송 중 오류가 발생했습니다.' }
  }
}

/**
 * 아이디 찾기 - 인증 코드 검증 및 아이디 반환
 *
 * @description
 * 인증 코드를 검증하고 사용자의 아이디를 반환합니다.
 *
 * @example
 * ```typescript
 * const result = await findUsernameWithCode('user@example.com', '123456')
 * if (result.success) {
 *   console.log('아이디:', result.username)
 * }
 * ```
 */
export async function findUsernameWithCode(
  email: string,
  code: string
): Promise<UsernameRecoveryResponse> {
  try {
    // 입력 검증
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      return { success: false, error: emailValidation.error }
    }

    if (!code || !code.trim()) {
      return { success: false, error: '인증 코드를 입력해주세요.' }
    }

    // 인증 코드 검증
    const verifyResult = await verifyCode(email, code, 'id_recovery')
    if (!verifyResult.success) {
      return { success: false, error: verifyResult.error }
    }

    // 사용자 정보 조회
    const supabase = await getSupabaseServer()
    const { data: user, error } = await supabase
      .from('profiles')
      .select('username, full_name, id')
      .eq('email', email)
      .single()

    if (error || !user) {
      console.error('사용자 조회 오류:', error)
      return { success: false, error: '계정 정보를 찾을 수 없습니다.' }
    }

    // 아이디 마스킹 (앞 3자리만 보여주고 나머지는 *)
    const username = user.username || ''
    const maskedUsername = username.length > 3
      ? username.substring(0, 3) + '*'.repeat(username.length - 3)
      : username

    // 성공 로그 기록
    await logAuthEvent(
      'ID_RECOVERY_SUCCESS',
      `아이디 찾기 성공: ${email}`,
      user.id,
      true,
      { email, username: user.username }
    )

    return {
      success: true,
      username: user.username || '',
      maskedUsername
    }

  } catch (error) {
    console.error('아이디 찾기 검증 오류:', error)
    return { success: false, error: '아이디 찾기 중 오류가 발생했습니다.' }
  }
}

/**
 * 아이디 찾기 (레거시 - Supabase OTP 사용)
 *
 * @description
 * Supabase의 OTP 검증 기능을 사용하는 레거시 방식입니다.
 * 새 코드에서는 findUsernameWithCode()를 사용하세요.
 *
 * @deprecated findUsernameWithCode()를 사용하세요
 */
export async function findUsername(
  email: string,
  verificationCode: string
): Promise<UsernameRecoveryResponse> {
  try {
    const supabase = await getSupabaseServer()

    // 1. 인증 코드 확인 (OTP 검증)
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: verificationCode,
      type: 'email'
    })

    if (verifyError) {
      return {
        success: false,
        error: '인증 코드가 올바르지 않거나 만료되었습니다.'
      }
    }

    // 2. 사용자 정보 조회
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('email', email)
      .single()

    if (!profile || !profile.username) {
      return {
        success: false,
        error: '사용자 정보를 찾을 수 없습니다.'
      }
    }

    // 아이디 마스킹
    const username = profile.username
    const maskedUsername = username.length > 3
      ? username.substring(0, 3) + '*'.repeat(username.length - 3)
      : username

    return {
      success: true,
      username,
      maskedUsername
    }

  } catch (error) {
    console.error('아이디 찾기 오류:', error)
    return {
      success: false,
      error: '아이디 찾기 중 오류가 발생했습니다.'
    }
  }
}
