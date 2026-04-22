'use server'

import { getSupabaseServer } from '@/shared/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import type { User } from '@supabase/supabase-js'

/**
 * 인증 가드 옵션
 */
export interface AuthGuardOptions {
  /** 인증 실패 시 리다이렉트할 경로 (기본: /signin) */
  redirectTo?: string
  /** 관리자 권한 필요 여부 (기본: false) */
  requireAdmin?: boolean
  /** 정지 여부 체크 (기본: true) */
  checkSuspension?: boolean
  /** 무단 접근 로깅 여부 (기본: true) */
  logUnauthorizedAccess?: boolean
}

/**
 * 인증 가드 결과
 */
export interface AuthGuardResult {
  /** 인증된 사용자 정보 */
  user: User
  /** 사용자 프로필 */
  profile: {
    id: string
    is_admin: boolean
    is_suspended: boolean
    suspended_until: string | null
    suspended_reason: string | null
  }
}

/**
 * 정지 정보
 */
interface SuspensionInfo {
  reason: string
  until: string | null
  message: string
}

/**
 * 통합 인증 가드
 *
 * @description
 * 서버 컴포넌트/액션에서 사용자 인증, 관리자 권한, 정지 상태를 체크합니다.
 *
 * @example
 * ```typescript
 * // 기본 인증 체크
 * const { user, profile } = await authGuard()
 *
 * // 관리자 전용 페이지
 * const { user } = await authGuard({ requireAdmin: true })
 *
 * // 정지 체크 생략
 * const { user } = await authGuard({ checkSuspension: false })
 * ```
 */
export async function authGuard(
  options: AuthGuardOptions = {}
): Promise<AuthGuardResult> {
  const {
    redirectTo = '/signin',
    requireAdmin = false,
    checkSuspension = true,
    logUnauthorizedAccess = true
  } = options

  try {
    const supabase = await getSupabaseServer()

    // 1. 사용자 인증 체크
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      if (logUnauthorizedAccess) {
        await logUnauthorizedRequest('AUTH_MISSING', {
          error: authError?.message || 'No user found',
          redirectTo
        })
      }
      redirect(redirectTo)
    }

    // 2. 프로필 정보 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, is_admin, is_suspended, suspended_until, suspended_reason')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      if (logUnauthorizedAccess) {
        await logUnauthorizedRequest('PROFILE_NOT_FOUND', {
          userId: user.id,
          error: profileError?.message || 'Profile not found'
        })
      }
      redirect(redirectTo)
    }

    // 타입 캐스팅
    const typedProfile = profile as unknown as {
      id: string
      is_admin: boolean
      is_suspended: boolean
      suspended_until: string | null
      suspended_reason: string | null
    }

    // 3. 정지 상태 체크
    if (checkSuspension) {
      const suspensionInfo = await checkAndHandleSuspension(
        user.id,
        typedProfile,
        supabase
      )

      if (suspensionInfo) {
        if (logUnauthorizedAccess) {
          await logUnauthorizedRequest('USER_SUSPENDED', {
            userId: user.id,
            reason: suspensionInfo.reason,
            until: suspensionInfo.until || 'permanent'
          })
        }
        // 정지된 사용자는 홈으로 리다이렉트 (에러 메시지는 클라이언트에서 처리)
        redirect('/?suspended=true')
      }
    }

    // 4. 관리자 권한 체크
    if (requireAdmin && !typedProfile.is_admin) {
      if (logUnauthorizedAccess) {
        await logUnauthorizedRequest('ADMIN_REQUIRED', {
          userId: user.id,
          email: user.email || 'No email'
        })
      }
      redirect('/')
    }

    return {
      user,
      profile: typedProfile
    }

  } catch (error) {
    // redirect()는 에러를 던지므로, 그 외의 에러만 처리
    if (error && typeof error === 'object' && 'digest' in error) {
      // Next.js redirect error - 다시 던짐
      throw error
    }

    // 기타 에러
    if (logUnauthorizedAccess) {
      await logUnauthorizedRequest('AUTH_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    redirect(redirectTo)
  }
}

/**
 * 정지 상태 확인 및 자동 해제 처리
 */
async function checkAndHandleSuspension(
  userId: string,
  profile: {
    is_suspended: boolean
    suspended_until: string | null
    suspended_reason: string | null
  },
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>
): Promise<SuspensionInfo | null> {
  // 정지되지 않은 경우
  if (!profile.is_suspended) {
    return null
  }

  // 정지 기간이 있는 경우 만료 확인
  if (profile.suspended_until) {
    const now = new Date()
    const suspendedUntil = new Date(profile.suspended_until)

    // 정지 기간이 만료된 경우 자동 해제
    if (now.getTime() > suspendedUntil.getTime()) {
      await supabase
        .from('profiles')
        .update({
          is_suspended: false,
          suspended_until: null,
          suspended_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      return null // 정지 해제됨
    }
  }

  // 여전히 정지 상태
  const reason = profile.suspended_reason || '정책 위반'
  const until = profile.suspended_until
  const untilDate = until ? new Date(until) : null

  return {
    reason,
    until,
    message: `계정이 정지되어 해당 기능을 사용할 수 없습니다.${
      untilDate
        ? ` (해제일: ${untilDate.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })})`
        : ''
    }`
  }
}

/**
 * 인증되지 않은 요청 로깅
 */
async function logUnauthorizedRequest(
  type: string,
  details: Record<string, string>
): Promise<void> {
  try {
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || 'Unknown'
    const referer = headersList.get('referer') || 'Unknown'
    const ip = headersList.get('x-forwarded-for') ||
               headersList.get('x-real-ip') ||
               'Unknown'

    const logData = {
      type,
      details,
      request_info: {
        user_agent: userAgent,
        referer,
        ip,
        timestamp: new Date().toISOString()
      }
    }

    // 개발 환경: 콘솔 경고
    if (process.env.NODE_ENV === 'development') {
      console.warn('🚨 인증되지 않은 요청:', logData)
    }

    // 프로덕션: 에러 로그
    if (process.env.NODE_ENV === 'production') {
      console.error('UNAUTHORIZED_ACCESS:', JSON.stringify(logData))
    }

  } catch (error) {
    console.error('로깅 중 오류:', error)
  }
}

