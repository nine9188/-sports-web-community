import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { type Database } from '@/shared/types/supabase'

/**
 * 미들웨어에서 Supabase 세션을 업데이트하는 함수
 * 만료된 Auth 토큰을 새로고침하고 서버 컴포넌트와 브라우저에 전달합니다.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          // 요청에 쿠키 설정 (서버 컴포넌트에서 사용)
          request.cookies.set({
            name,
            value,
            ...options,
          })
          // 응답에 쿠키 설정 (브라우저에서 사용)
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name, options) {
          // 요청에서 쿠키 제거
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          // 응답에서 쿠키 제거
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          supabaseResponse.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // 중요: getUser()를 호출하여 Auth 토큰을 새로고침합니다
  // getSession()은 서버 코드에서 신뢰할 수 없습니다
  await supabase.auth.getUser()

  return supabaseResponse
} 