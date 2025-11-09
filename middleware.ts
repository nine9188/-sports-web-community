import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/shared/types/supabase'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
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
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name, options) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { pathname } = request.nextUrl

  try {
    // 세션 새로고침 및 사용자 정보 확인 (중요: 쿠키 동기화)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // 세션 유효성 추가 확인 - 임시 비활성화
    // const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (userError) {
      console.warn('미들웨어에서 인증 확인 실패:', { userError })
    }

    // 인증이 필요한 경로들
    const protectedPaths = ['/settings'] // admin은 layout에서 체크하므로 제외
    const authPaths = ['/signin', '/signup', '/auth']

    // 보호된 경로에 비로그인 사용자 접근 시 로그인 페이지로 리다이렉트 (우선 처리)
    if (protectedPaths.some(path => pathname.startsWith(path)) && !user) {
      const redirectUrl = new URL('/signin', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      redirectUrl.searchParams.set('message', '로그인이 필요한 페이지입니다')
      return NextResponse.redirect(redirectUrl)
    }

    // Admin 경로는 layout.tsx에서 체크하므로 여기서는 스킵 (성능 향상)

    // 로그인된 사용자가 인증 페이지 접근 시 홈으로 리다이렉트
    if (authPaths.some(path => pathname.startsWith(path)) && user) {
      const redirectUrl = request.nextUrl.searchParams.get('redirect') || '/'
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }

    // 세션 만료 체크 및 자동 갱신 - 임시 비활성화
    /*
    if (session && session.expires_at) {
      const expiresAt = session.expires_at * 1000 // 밀리초로 변환
      const now = Date.now()
      const timeUntilExpiry = expiresAt - now
      
      // 만료 5분 전이면 토큰 갱신 시도
      if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
        try {
          const { data: { session: refreshedSession }, error: refreshError } = 
            await supabase.auth.refreshSession()
          
          if (refreshError) {
            console.warn('미들웨어에서 토큰 갱신 실패:', refreshError)
          } else if (refreshedSession) {
            console.log('미들웨어에서 토큰 갱신 성공')
          }
        } catch (error) {
          console.error('미들웨어에서 토큰 갱신 중 오류:', error)
        }
      }
    }
    */

  } catch (error) {
    console.error('미들웨어 처리 중 오류:', error)
    // 에러가 발생해도 요청은 계속 진행
  }

  return response
}

export const config = {
  matcher: [
    /*
     * 다음 경로들을 제외한 모든 요청에 미들웨어 적용:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화 파일)
     * - favicon.ico (파비콘)
     * - 정적 파일들 (svg, png, jpg, jpeg, gif, webp)
     * - api routes (API 라우트는 별도 처리)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 