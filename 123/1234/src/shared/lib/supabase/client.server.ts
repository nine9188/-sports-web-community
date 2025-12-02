/**
 * 서버용 Supabase 클라이언트
 *
 * @description
 * 서버 환경(Server Components, Server Actions, Route Handlers)에서 사용하는
 * Supabase 클라이언트 생성 함수들
 *
 * @module
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

/**
 * 서버 컴포넌트용 Supabase 클라이언트 (읽기 전용)
 *
 * @description
 * - Server Components, generateMetadata 등에서 사용
 * - 쿠키를 읽을 수만 있고 쓸 수 없음 (읽기 전용)
 * - 세션 확인 및 데이터 조회에 사용
 *
 * @example
 * ```tsx
 * // app/some-page/page.tsx
 * import { getSupabaseServer } from '@/shared/lib/supabase/server'
 *
 * export default async function Page() {
 *   const supabase = await getSupabaseServer()
 *   const { data } = await supabase.from('posts').select('*')
 *   // ...
 * }
 * ```
 *
 * @returns {Promise<SupabaseClient>} Supabase 클라이언트 인스턴스
 */
export async function getSupabaseServer() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // Server Component에서는 쿠키 수정 불가
          // Server Action이나 Route Handler에서만 가능
          // 여기서는 아무 작업도 하지 않음 (읽기 전용)
        },
      },
      auth: {
        // 서버 컴포넌트에서는 자동 토큰 갱신 비활성화
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  )
}

/**
 * Server Action용 Supabase 클라이언트 (읽기/쓰기)
 *
 * @description
 * - Server Actions에서 사용
 * - 쿠키를 읽고 쓸 수 있음
 * - 로그인, 회원가입 등 세션을 변경하는 작업에 사용
 *
 * @example
 * ```tsx
 * 'use server'
 * import { getSupabaseAction } from '@/shared/lib/supabase/server'
 *
 * export async function signIn(email: string, password: string) {
 *   const supabase = await getSupabaseAction()
 *   const { data, error } = await supabase.auth.signInWithPassword({
 *     email,
 *     password,
 *   })
 *   // ...
 * }
 * ```
 *
 * @returns {Promise<SupabaseClient>} Supabase 클라이언트 인스턴스
 */
export async function getSupabaseAction() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // Server Component에서 호출된 경우 쿠키 설정 불가
            // 에러는 로깅만 하고 계속 진행
            console.error('🔴 Server Action에서 쿠키 설정 실패:', error)
          }
        },
      },
      auth: {
        // Server Action에서도 자동 갱신은 비활성화 (클라이언트가 담당)
        // 하지만 로그인 시에는 persistSession: true로 쿠키 저장
        autoRefreshToken: false,
        persistSession: true, // ✅ 로그인 시 쿠키 저장을 위해 true
        detectSessionInUrl: false,
        // PKCE flow 사용 (보안 강화)
        flowType: 'pkce',
      },
    }
  )
}

/**
 * Route Handler용 Supabase 클라이언트
 *
 * @description
 * - Route Handlers (app/api/...)에서 사용
 * - Request/Response 객체를 직접 다룸
 * - OAuth 콜백 등에서 사용
 *
 * @example
 * ```tsx
 * // app/api/auth/callback/route.ts
 * import { NextRequest } from 'next/server'
 * import { getSupabaseRouteHandler } from '@/shared/lib/supabase/server'
 *
 * export async function GET(request: NextRequest) {
 *   const { supabase, response } = await getSupabaseRouteHandler(request)
 *   // ...
 *   return response
 * }
 * ```
 *
 * @param {Request} request - Next.js Request 객체
 * @returns {Promise<{supabase: SupabaseClient, response: Response}>}
 */
export async function getSupabaseRouteHandler(request: Request) {
  const cookieStore = await cookies()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            console.error('🔴 Route Handler에서 쿠키 설정 실패:', error)
          }
        },
      },
    }
  )

  return { supabase }
}

/**
 * 관리자용 Supabase 클라이언트 (RLS 우회)
 *
 * @description
 * - 서비스 역할 키(Service Role Key) 사용
 * - Row Level Security(RLS) 정책을 우회
 * - 관리자 기능에서만 사용
 * - ⚠️ 주의: 매우 강력한 권한이므로 신중하게 사용
 *
 * @example
 * ```tsx
 * 'use server'
 * import { getSupabaseAdmin } from '@/shared/lib/supabase/server'
 * import { requireAdmin } from '@/shared/guards'
 *
 * export async function deleteUser(userId: string) {
 *   // ✅ 반드시 관리자 권한 체크 후 사용
 *   await requireAdmin()
 *
 *   const supabase = getSupabaseAdmin()
 *   await supabase.auth.admin.deleteUser(userId)
 * }
 * ```
 *
 * @returns {SupabaseClient} 관리자 권한 Supabase 클라이언트
 */
export function getSupabaseAdmin() {
  // Service Role Key 확인
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      '❌ SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않았습니다.\n' +
      '.env.local 파일에 SUPABASE_SERVICE_ROLE_KEY를 추가하세요.'
    )
  }

  const { createClient } = require('@supabase/supabase-js')

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
