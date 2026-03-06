'use server'

import { getSupabaseAction } from '@/shared/lib/supabase/server'
import { logAuthEvent } from '@/shared/actions/log-actions'

/**
 * 카카오 로그인
 *
 * @description
 * 카카오 OAuth 로그인을 시작합니다.
 * 로그인 성공 후 redirectTo URL로 이동합니다.
 *
 * @param redirectTo - 로그인 성공 후 이동할 URL
 *
 * @example
 * ```typescript
 * const result = await signInWithKakao('/dashboard')
 * if (result.url) {
 *   // 브라우저를 카카오 로그인 페이지로 리다이렉트
 *   window.location.href = result.url
 * }
 * ```
 */
export async function signInWithKakao(
  redirectTo: string
): Promise<{ data?: any; url?: string; error?: string }> {
  try {
    const supabase = await getSupabaseAction()

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo,
        queryParams: {
          prompt: 'consent', // 항상 동의 화면 표시
          approval_prompt: 'force' // 강제 동의 화면 (카카오 전용)
        }
      },
    })

    if (error) {
      // 카카오 로그인 시도 실패 로그
      await logAuthEvent(
        'KAKAO_LOGIN_ERROR',
        `카카오 로그인 오류: ${error.message}`,
        undefined,
        false,
        { error: error.message }
      )

      return { error: '카카오 로그인 중 오류가 발생했습니다.' }
    }

    // 카카오 로그인 시작 로그
    await logAuthEvent(
      'KAKAO_LOGIN_START',
      `카카오 로그인 시작`,
      undefined,
      true,
      { redirectTo }
    )

    return { data, url: data.url }

  } catch (error) {
    console.error('카카오 로그인 시작 오류:', error)

    await logAuthEvent(
      'KAKAO_LOGIN_ERROR',
      `카카오 로그인 예외: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      undefined,
      false,
      { error: error instanceof Error ? error.message : 'Unknown error' }
    )

    return { error: '카카오 로그인을 시작할 수 없습니다.' }
  }
}

/**
 * 구글 로그인
 */
export async function signInWithGoogle(
  redirectTo: string
): Promise<{ data?: any; url?: string; error?: string }> {
  try {
    const supabase = await getSupabaseAction()

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      },
    })

    if (error) {
      await logAuthEvent('GOOGLE_LOGIN_ERROR', `구글 로그인 오류: ${error.message}`, undefined, false, { error: error.message })
      return { error: '구글 로그인 중 오류가 발생했습니다.' }
    }

    await logAuthEvent('GOOGLE_LOGIN_START', `구글 로그인 시작`, undefined, true, { redirectTo })
    return { data, url: data.url }

  } catch (error) {
    console.error('구글 로그인 시작 오류:', error)
    await logAuthEvent('GOOGLE_LOGIN_ERROR', `구글 로그인 예외: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, undefined, false, { error: error instanceof Error ? error.message : 'Unknown error' })
    return { error: '구글 로그인을 시작할 수 없습니다.' }
  }
}

/**
 * 디스코드 로그인
 */
export async function signInWithDiscord(
  redirectTo: string
): Promise<{ data?: any; url?: string; error?: string }> {
  try {
    const supabase = await getSupabaseAction()

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo },
    })

    if (error) {
      await logAuthEvent('DISCORD_LOGIN_ERROR', `디스코드 로그인 오류: ${error.message}`, undefined, false, { error: error.message })
      return { error: '디스코드 로그인 중 오류가 발생했습니다.' }
    }

    await logAuthEvent('DISCORD_LOGIN_START', `디스코드 로그인 시작`, undefined, true, { redirectTo })
    return { data, url: data.url }

  } catch (error) {
    console.error('디스코드 로그인 시작 오류:', error)
    await logAuthEvent('DISCORD_LOGIN_ERROR', `디스코드 로그인 예외: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, undefined, false, { error: error instanceof Error ? error.message : 'Unknown error' })
    return { error: '디스코드 로그인을 시작할 수 없습니다.' }
  }
}

/**
 * Apple 로그인
 */
export async function signInWithApple(
  redirectTo: string
): Promise<{ data?: any; url?: string; error?: string }> {
  try {
    const supabase = await getSupabaseAction()

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo },
    })

    if (error) {
      await logAuthEvent('APPLE_LOGIN_ERROR', `Apple 로그인 오류: ${error.message}`, undefined, false, { error: error.message })
      return { error: 'Apple 로그인 중 오류가 발생했습니다.' }
    }

    await logAuthEvent('APPLE_LOGIN_START', `Apple 로그인 시작`, undefined, true, { redirectTo })
    return { data, url: data.url }

  } catch (error) {
    console.error('Apple 로그인 시작 오류:', error)
    await logAuthEvent('APPLE_LOGIN_ERROR', `Apple 로그인 예외: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, undefined, false, { error: error instanceof Error ? error.message : 'Unknown error' })
    return { error: 'Apple 로그인을 시작할 수 없습니다.' }
  }
}
