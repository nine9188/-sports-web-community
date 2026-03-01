import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/shared/types/supabase'

// Supabase 세션 조회를 스킵할 봇 목록
const BOT_USER_AGENTS = [
  'Amazonbot',
  'Googlebot',
  'Bingbot',
  'YandexBot',
  'Baiduspider',
  'DuckDuckBot',
  'Slurp',
  'SemrushBot',
  'AhrefsBot',
  'MJ12bot',
  'DotBot',
  'PetalBot',
  'GPTBot',
  'ChatGPT-User',
  'CCBot',
  'anthropic-ai',
  'Claude-Web',
  'facebookexternalhit',
  'Twitterbot',
  'LinkedInBot',
  'bytespider',
  'python-requests',
  'Go-http-client',
  'curl',
  'wget',
  'Scrapy',
]

// robots.txt에서 Disallow: / 로 차단한 봇 → 403 반환
const BLOCKED_BOTS = [
  'Amazonbot',
  'GPTBot',
  'ChatGPT-User',
  'CCBot',
  'anthropic-ai',
  'Claude-Web',
  'SemrushBot',
  'AhrefsBot',
  'MJ12bot',
  'DotBot',
  'PetalBot',
  'bytespider',
  'python-requests',
  'Go-http-client',
  'Scrapy',
]

function detectBot(ua: string | null): { isBot: boolean; isBlocked: boolean } {
  if (!ua) return { isBot: true, isBlocked: true } // UA 없으면 차단
  const lowerUA = ua.toLowerCase()
  const isBot = BOT_USER_AGENTS.some(bot => lowerUA.includes(bot.toLowerCase()))
  const isBlocked = BLOCKED_BOTS.some(bot => lowerUA.includes(bot.toLowerCase()))
  return { isBot, isBlocked }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const userAgent = request.headers.get('user-agent')
  const { isBot, isBlocked } = detectBot(userAgent)

  // 차단 대상 봇 → 즉시 403 반환 (Supabase 호출 없음)
  if (isBlocked) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // /test/* 경로는 프로덕션에서 차단 (API-Sports 쿼타 보호)
  if (pathname.startsWith('/test') && process.env.NODE_ENV === 'production') {
    return new NextResponse('Not Found', { status: 404 })
  }

  // SEO 봇 (Googlebot 등) → 페이지는 보여주되 Supabase 세션 조회 스킵
  if (isBot) {
    return NextResponse.next()
  }

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
      auth: {
        // 미들웨어에서 자동 갱신 비활성화 (클라이언트가 담당)
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    }
  )

  try {
    // 세션 조회 (토큰 갱신 없이 현재 세션만 확인)
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user || null

    // 경로 분류
    const protectedPaths = ['/settings'] // 로그인 필요 경로
    const authPaths = ['/signin', '/signup', '/auth'] // 인증 페이지

    // 1. 보호된 경로 접근 제어 (비로그인 사용자 차단)
    if (protectedPaths.some(path => pathname.startsWith(path)) && !user) {
      const redirectUrl = new URL('/signin', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      redirectUrl.searchParams.set('message', '로그인이 필요한 페이지입니다')
      return NextResponse.redirect(redirectUrl)
    }

    // 2. 로그인 사용자의 인증 페이지 접근 방지
    if (authPaths.some(path => pathname.startsWith(path)) && user) {
      const redirectUrl = request.nextUrl.searchParams.get('redirect') || '/'
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }

    // 3. 관리자 페이지 접근 제어
    if (pathname.startsWith('/admin')) {
      // 비로그인 사용자 차단
      if (!user) {
        return NextResponse.redirect(new URL('/', request.url))
      }

      // 관리자 권한 확인
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!profile?.is_admin) {
        // 관리자가 아니면 메인으로 리다이렉트
        return NextResponse.redirect(new URL('/', request.url))
      }
    }

  } catch (error) {
    console.error('미들웨어 처리 중 오류:', error)
    // 에러 발생 시에도 요청 계속 진행
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