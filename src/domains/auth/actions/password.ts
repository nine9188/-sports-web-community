'use server'

import { getSupabaseServer, getSupabaseAction } from '@/shared/lib/supabase/server'
import { authGuard } from '@/shared/guards/auth.guard'
import { logAuthEvent } from '@/shared/actions/log-actions'
import {
  generateSecureToken,
  saveVerificationCode,
  verifyResetToken,
  useResetToken as markTokenAsUsed
} from '@/shared/services/verification'
import { sendPasswordResetEmail } from '@/shared/services/email'
import { validatePassword } from './utils/validation'
import type { PasswordResetResponse } from '../types'

/**
 * 비밀번호 재설정 이메일 발송 (기본 Supabase 방식)
 *
 * @description
 * 이메일로 비밀번호 재설정 링크를 발송합니다.
 *
 * @example
 * ```typescript
 * const result = await resetPassword('user@example.com')
 * ```
 */
export async function resetPassword(email: string): Promise<PasswordResetResponse> {
  try {
    const supabase = await getSupabaseServer()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, message: '비밀번호 재설정 이메일이 발송되었습니다.' }

  } catch (error) {
    console.error('비밀번호 재설정 이메일 발송 중 오류:', error)
    return { success: false, error: '비밀번호 재설정 이메일 발송 중 오류가 발생했습니다.' }
  }
}

/**
 * 비밀번호 업데이트 (로그인 상태에서)
 *
 * @description
 * 현재 로그인된 사용자의 비밀번호를 변경합니다.
 * authGuard를 사용하여 인증 체크합니다.
 *
 * @example
 * ```typescript
 * const result = await updatePassword('newPassword123')
 * ```
 */
export async function updatePassword(password: string): Promise<PasswordResetResponse> {
  try {
    // 인증 체크
    const { user } = await authGuard()

    // 비밀번호 검증
    const validation = validatePassword(password)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    const supabase = await getSupabaseServer()

    const { error } = await supabase.auth.updateUser({
      password
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // 성공 로그 기록
    await logAuthEvent(
      'PASSWORD_UPDATE',
      `비밀번호 변경 성공`,
      user.id,
      true,
      { userId: user.id }
    )

    return { success: true, message: '비밀번호가 성공적으로 변경되었습니다.' }

  } catch (error) {
    console.error('비밀번호 업데이트 중 오류:', error)
    return { success: false, error: '비밀번호 업데이트 중 오류가 발생했습니다.' }
  }
}

/**
 * 비밀번호 재설정 링크 발송 (커스텀 - 아이디 기반)
 *
 * @description
 * 아이디(username)로 사용자를 찾아 비밀번호 재설정 링크를 이메일로 발송합니다.
 * 커스텀 토큰 시스템을 사용합니다.
 *
 * @example
 * ```typescript
 * const result = await sendPasswordResetLink('myusername')
 * ```
 */
export async function sendPasswordResetLink(username: string): Promise<PasswordResetResponse> {
  try {
    if (!username || !username.trim()) {
      return { success: false, error: '아이디를 입력해주세요.' }
    }

    // 아이디로 사용자 조회
    const supabase = await getSupabaseServer()
    const { data: user, error } = await supabase
      .from('profiles')
      .select('email, username, full_name')
      .eq('username', username)
      .single()

    if (error || !user || !user.email) {
      return { success: false, error: '입력하신 아이디와 일치하는 계정을 찾을 수 없습니다.' }
    }

    // 보안 토큰 생성
    const resetToken = generateSecureToken()

    // 데이터베이스에 저장 (30분 유효)
    const saveResult = await saveVerificationCode(user.email, resetToken, 'password_reset', 30)
    if (!saveResult.success) {
      return { success: false, error: saveResult.error }
    }

    // 이메일 발송
    const emailResult = await sendPasswordResetEmail(user.email, resetToken, user.username || '')
    if (!emailResult.success) {
      return { success: false, error: '재설정 링크 이메일 발송에 실패했습니다.' }
    }

    // 보안 로그 기록
    await logAuthEvent(
      'PASSWORD_RESET_REQUEST',
      `비밀번호 재설정 요청: ${username}`,
      undefined,
      true,
      { username, email: user.email }
    )

    return {
      success: true,
      message: '비밀번호 재설정 링크를 이메일로 발송했습니다.'
    }

  } catch (error) {
    console.error('비밀번호 재설정 링크 발송 오류:', error)
    return { success: false, error: '비밀번호 재설정 링크 발송 중 오류가 발생했습니다.' }
  }
}

/**
 * 재설정 토큰 검증
 *
 * @description
 * 비밀번호 재설정 링크의 토큰이 유효한지 검증합니다.
 *
 * @example
 * ```typescript
 * const result = await validateResetToken(token)
 * if (result.success) {
 *   console.log('유효한 토큰:', result.email)
 * }
 * ```
 */
export async function validateResetToken(
  token: string
): Promise<{ success: boolean; email?: string; error?: string }> {
  try {
    if (!token || !token.trim()) {
      return { success: false, error: '토큰이 제공되지 않았습니다.' }
    }

    const result = await verifyResetToken(token)
    if (!result.success) {
      return { success: false, error: result.error }
    }

    return {
      success: true,
      email: result.email
    }

  } catch (error) {
    console.error('토큰 검증 오류:', error)
    return { success: false, error: '토큰 검증 중 오류가 발생했습니다.' }
  }
}

/**
 * 토큰을 사용한 비밀번호 재설정
 *
 * @description
 * 재설정 토큰을 검증하고 새 비밀번호로 변경합니다.
 *
 * @example
 * ```typescript
 * const result = await resetPasswordWithToken(token, 'newPassword123')
 * if (result.success) {
 *   console.log('비밀번호가 변경되었습니다')
 * }
 * ```
 */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<PasswordResetResponse> {
  try {
    // 비밀번호 검증
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.error }
    }

    // 토큰 검증
    const tokenResult = await verifyResetToken(token)
    if (!tokenResult.success) {
      return { success: false, error: tokenResult.error }
    }

    const email = tokenResult.email
    if (!email) {
      return { success: false, error: '유효하지 않은 토큰입니다.' }
    }

    const supabase = await getSupabaseAction()

    // 사용자 조회
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' }
    }

    // 비밀번호 업데이트 (관리자 권한 사용)
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('비밀번호 업데이트 오류:', updateError)
      return { success: false, error: '비밀번호 변경에 실패했습니다.' }
    }

    // 토큰 사용 처리
    const tokenUseResult = await markTokenAsUsed(token)
    if (!tokenUseResult.success) {
      console.error('토큰 사용 처리 실패:', tokenUseResult.error)
    }

    // 성공 로그 기록
    await logAuthEvent(
      'PASSWORD_RESET_SUCCESS',
      `비밀번호 재설정 성공: ${user.username}`,
      user.id,
      true,
      { username: user.username, email }
    )

    return { success: true, message: '비밀번호가 성공적으로 변경되었습니다.' }

  } catch (error) {
    console.error('비밀번호 재설정 오류:', error)
    return { success: false, error: '비밀번호 재설정 중 오류가 발생했습니다.' }
  }
}
