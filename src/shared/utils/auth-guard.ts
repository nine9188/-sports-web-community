'use server'

import { getSupabaseServer } from '@/shared/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

interface AuthGuardOptions {
  redirectTo?: string
  requireAdmin?: boolean
  logUnauthorizedAccess?: boolean
}

/**
 * 서버 컴포넌트/액션에서 인증을 체크하고 누락된 요청을 감지하는 함수
 */
export async function serverAuthGuard(options: AuthGuardOptions = {}) {
  const {
    redirectTo = '/signin',
    requireAdmin = false,
    logUnauthorizedAccess = true
  } = options

  try {
    const supabase = await getSupabaseServer()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    // 인증 실패 시 로깅 및 리다이렉트
    if (error || !user) {
      if (logUnauthorizedAccess) {
        await logUnauthorizedRequest('AUTH_MISSING', {
          error: error?.message || 'No user found',
          timestamp: new Date().toISOString(),
          redirectTo
        })
      }
      redirect(redirectTo)
    }

    // 관리자 권한 체크
    if (requireAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!profile?.is_admin) {
        if (logUnauthorizedAccess) {
          await logUnauthorizedRequest('ADMIN_REQUIRED', {
            userId: user.id,
            email: user.email || 'No email',
            timestamp: new Date().toISOString()
          })
        }
        redirect('/')
      }
    }

    return user
  } catch (error) {
    if (logUnauthorizedAccess) {
      await logUnauthorizedRequest('AUTH_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    }
    redirect(redirectTo)
  }
}

/**
 * 인증되지 않은 요청을 로깅하는 함수
 */
async function logUnauthorizedRequest(type: string, details: Record<string, string>) {
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

    // 콘솔 로깅 (개발 환경)
    if (process.env.NODE_ENV === 'development') {
      console.warn('🚨 인증되지 않은 요청 감지:', logData)
    }

    // 프로덕션에서는 로깅 서비스로 전송
    if (process.env.NODE_ENV === 'production') {
      console.error('UNAUTHORIZED_ACCESS:', JSON.stringify(logData))
    }

    // 향후 보안 로그 테이블이 생성되면 활성화
    // const supabase = await getSupabaseServer()
    // await supabase
    //   .from('security_logs')
    //   .insert({
    //     event_type: type,
    //     details: logData,
    //     created_at: new Date().toISOString()
    //   })

  } catch (error) {
    console.error('로깅 중 오류:', error)
  }
} 