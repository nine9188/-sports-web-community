'use server'

import { getSupabaseServer } from '@/shared/lib/supabase/server'
import { logSecurityEvent } from '@/shared/actions/log-actions'

/**
 * 로그인 차단 정보
 */
export interface LoginBlockInfo {
  isBlocked: boolean
  blockedUntil: number
  message?: string
}

/**
 * 로그인 시도 체크 결과
 */
export interface LoginAttemptCheck {
  isBlocked: boolean
  message: string
}

/**
 * 로그인 시도 제한 체크 (5회 실패 시 15분 차단)
 */
export async function checkLoginAttempts(username: string): Promise<LoginAttemptCheck> {
  const blockData = await checkLoginBlock(username)

  if (blockData.isBlocked) {
    const now = Date.now()
    const remainingTime = Math.ceil((blockData.blockedUntil - now) / 1000 / 60)

    // 차단된 사용자의 로그인 시도 보안 로그 기록
    await logSecurityEvent(
      'BLOCKED_LOGIN_ATTEMPT',
      `차단된 사용자의 로그인 시도: ${username}`,
      'MEDIUM',
      undefined,
      { username, remainingTime, blockedUntil: blockData.blockedUntil }
    )

    return {
      isBlocked: true,
      message: `너무 많은 로그인 시도로 인해 ${remainingTime}분간 차단되었습니다. 나중에 다시 시도해주세요.`
    }
  }

  return {
    isBlocked: false,
    message: ''
  }
}

/**
 * 로그인 차단 상태 확인 (아이디 기반)
 */
async function checkLoginBlock(username: string): Promise<LoginBlockInfo> {
  const now = Date.now()

  try {
    const supabase = await getSupabaseServer()

    // 최근 15분간의 로그인 시도 기록 조회 (아이디 기반)
    const { data: attempts } = await supabase
      .from('login_attempts')
      .select('*')
      .eq('email', username) // email 필드에 username을 저장
      .gte('created_at', new Date(now - 15 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })

    if (!attempts || attempts.length < 5) {
      return { isBlocked: false, blockedUntil: 0 }
    }

    // 5회 이상 실패 시 15분 차단
    const latestAttempt = attempts[0]
    const attemptTime = latestAttempt.created_at
    if (!attemptTime) {
      return { isBlocked: false, blockedUntil: 0 }
    }

    const blockedUntil = new Date(attemptTime).getTime() + (15 * 60 * 1000)

    return {
      isBlocked: now < blockedUntil,
      blockedUntil
    }
  } catch (error) {
    console.error('로그인 차단 확인 오류:', error)
    return { isBlocked: false, blockedUntil: 0 }
  }
}

/**
 * 로그인 시도 기록
 */
export async function recordAttempt(username: string, reason: 'invalid_username' | 'invalid_password'): Promise<void> {
  try {
    const supabase = await getSupabaseServer()

    await supabase
      .from('login_attempts')
      .insert({
        email: username, // email 필드에 username을 저장
        ip_address: 'unknown', // TODO: 실제 IP 주소 추가
        user_agent: 'unknown', // TODO: 실제 User-Agent 추가
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('로그인 시도 기록 오류:', error)
  }
}

/**
 * 로그인 시도 기록 초기화 (로그인 성공 시)
 */
export async function clearAttempts(username: string): Promise<void> {
  try {
    const supabase = await getSupabaseServer()

    await supabase
      .from('login_attempts')
      .delete()
      .eq('email', username) // email 필드에 username이 저장되어 있음
  } catch (error) {
    console.error('로그인 시도 기록 초기화 오류:', error)
  }
}
