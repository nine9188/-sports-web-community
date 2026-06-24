import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/shared/types/supabase'

function canonicalHost() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://4590fb.com').host
  } catch {
    return '4590fb.com'
  }
}

const SITE_LAYOUT_SKIP_PATHS = new Set([
  '/about',
  '/contact',
  '/guide',
  '/privacy',
  '/search-engine-check-4590',
  '/terms',
])

// 검색엔진 등 허용된 크롤러 (AI 데이터 수집 봇 제외)
const PUBLIC_CRAWLER_USER_AGENT_PATTERN =
  /(googlebot|google-inspectiontool|googleother|storebot-google|adsbot-google|mediapartners-google|bingbot|yeti|daum|daumoa|kakaotalk|duckduckbot|baiduspider|facebookbot|meta-externalagent)/i

function isPublicCrawlerUserAgent(userAgent: string | null) {
  return Boolean(userAgent && PUBLIC_CRAWLER_USER_AGENT_PATTERN.test(userAgent))
}

// 차단할 봇 목록 (AI 학습 봇, SEO 스크래퍼, 악성 크롤러)
const DISALLOWED_BOT_PATTERN =
  /(semrushbot|mj12bot|claudebot|claude-searchbot|gptbot|chatgpt-user|oai-searchbot|ahrefsbot|dotbot|rogerbot|petalbot|megaindex|blexbot|ccbot|amazonbot|perplexitybot|perplexity-user|google-extended|applebot-extended|bytespider|byte-spider|dataforseabot|seranking|barkrowler|anthropic-ai|cohere-ai|diffbot|img2dataset|omgili|webzio-extended|scrapy|yandexbot|yandex)/i

function isDisallowedBot(userAgent: string | null) {
  return Boolean(userAgent && DISALLOWED_BOT_PATTERN.test(userAgent))
}

const EXPENSIVE_PUBLIC_PATH_PATTERN =
  /^\/(?:livescore\/football(?:$|\/(?:player|team|match|leagues)(?:\/|$))|transfers\/team(?:\/|$)|boards(?:\/|$)|user\/[^/]+(?:\/|$))/

function isLikelyBrowserImpersonator(request: NextRequest) {
  const userAgent = request.headers.get('user-agent')
  if (!userAgent || isPublicCrawlerUserAgent(userAgent)) return false
  const isChromiumUserAgent = /\b(?:Chrome|CriOS|Edg)\//i.test(userAgent)
  if (!isChromiumUserAgent) return false

  const secFetchMode = request.headers.get('sec-fetch-mode')
  const secFetchDest = request.headers.get('sec-fetch-dest')
  const secFetchUser = request.headers.get('sec-fetch-user')
  const secChUa = request.headers.get('sec-ch-ua')
  const acceptLanguage = request.headers.get('accept-language')
  const hasBrowserNavigationHeaders =
    secFetchMode?.toLowerCase() === 'navigate' &&
    secFetchDest?.toLowerCase() === 'document' &&
    secFetchUser === '?1' &&
    Boolean(secChUa) &&
    Boolean(acceptLanguage)

  return !hasBrowserNavigationHeaders
}

function shouldDenyExpensiveBotRequest(request: NextRequest) {
  if (request.method !== 'GET') return false
  if (!EXPENSIVE_PUBLIC_PATH_PATTERN.test(request.nextUrl.pathname)) return false
  const referer = request.headers.get('referer')
  if (referer) {
    try {
      const refererHost = new URL(referer).host.toLowerCase()
      if (
        refererHost === canonicalHost() ||
        refererHost === 'www.4590fb.com' ||
        refererHost === '4590football.com' ||
        refererHost === 'www.4590football.com'
      ) {
        return false
      }
    } catch {
      // Ignore malformed referers and continue with bot checks.
    }
  }
  if (
    request.nextUrl.searchParams.has('_rsc') ||
    request.url.includes('?_rsc=') ||
    request.url.includes('&_rsc=') ||
    request.headers.get('rsc') === '1' ||
    request.headers.get('accept')?.includes('text/x-component')
  ) {
    return false
  }
  if (hasSupabaseAuthCookie(request)) return false

  return isLikelyBrowserImpersonator(request)
}

function botDeniedResponse() {
  return new NextResponse('Forbidden', {
    status: 403,
    headers: {
      'cache-control': 'private, no-store, max-age=0',
      'x-robots-tag': 'noindex, nofollow',
      'x-bot-guard': 'browser-impersonator',
    },
  })
}

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(cookie => cookie.name.startsWith('sb-') && cookie.name.includes('auth-token'))
}

function isSupabaseInvalidRefreshTokenError(error: unknown) {
  if (!error || typeof error !== 'object') return false

  const authError = error as { code?: unknown; message?: unknown }
  const code = typeof authError.code === 'string' ? authError.code : ''
  const message = typeof authError.message === 'string' ? authError.message : ''

  return (
    code === 'refresh_token_not_found' ||
    message.includes('Invalid Refresh Token') ||
    message.includes('Refresh Token Not Found')
  )
}

function clearSupabaseAuthCookies(request: NextRequest, response: NextResponse) {
  for (const cookie of request.cookies.getAll()) {
    if (!cookie.name.startsWith('sb-') || !cookie.name.includes('auth-token')) continue

    request.cookies.delete(cookie.name)
    response.cookies.set(cookie.name, '', {
      path: '/',
      maxAge: 0,
      httpOnly: true,
      sameSite: 'lax',
    })
  }
}

function isUsableTeamSlug(teamId: string | number, slug?: string | null): slug is string {
  const normalized = String(slug ?? '').trim().toLowerCase()
  const normalizedId = String(teamId ?? '').trim().toLowerCase()

  return Boolean(
    normalized &&
    normalized !== 'team' &&
    normalized !== normalizedId &&
    normalized !== `team-${normalizedId}`
  )
}

function isUsablePlayerSlug(playerId: string | number, slug?: string | null): slug is string {
  const normalized = String(slug ?? '').trim().toLowerCase()
  const normalizedId = String(playerId ?? '').trim().toLowerCase()

  return Boolean(
    normalized &&
    normalized !== 'player' &&
    normalized !== normalizedId &&
    normalized !== `player-${normalizedId}`
  )
}

function normalizeRouteSlug(slug?: string | null) {
  try {
    return decodeURIComponent(String(slug ?? '')).trim().toLowerCase()
  } catch {
    return String(slug ?? '').trim().toLowerCase()
  }
}

function shouldSkipSiteLayout(pathname: string) {
  return SITE_LAYOUT_SKIP_PATHS.has(pathname)
}

function plainNotFoundResponse() {
  return new NextResponse(
    `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>Page not found | 4590 Football</title>
  <style>
    body{margin:0;background:#f8fafc;color:#111827;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    .wrap{min-height:100vh;display:flex;justify-content:center;padding:32px 16px;box-sizing:border-box}
    .inner{width:100%;max-width:768px}
    .card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:8px;overflow:hidden}
    .head{padding:24px;border-bottom:1px solid rgba(0,0,0,.05)}
    h1{margin:0;font-size:18px;line-height:1.5}
    .body{padding:48px;text-align:center}
    .code{font-size:80px;font-weight:700;color:#e5e7eb;line-height:1}
    h2{margin:24px 0 8px;font-size:20px}
    p{margin:0;color:#6b7280;font-size:13px}
    a{display:inline-flex;margin-top:32px;padding:10px 24px;border-radius:8px;background:#262626;color:#fff;text-decoration:none;font-size:13px;font-weight:500}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="inner">
      <div class="card">
        <div class="head"><h1>Page not found</h1></div>
        <div class="body">
          <div class="code">404</div>
          <h2>The requested page could not be found.</h2>
          <p>The page may have been deleted or the address may have changed.</p>
          <a href="/">Go to home</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`,
    {
      status: 404,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'x-robots-tag': 'noindex, nofollow',
      },
    }
  )
}



export async function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent')
  if (isDisallowedBot(userAgent)) {
    return new NextResponse('Forbidden', {
      status: 403,
      headers: {
        'cache-control': 'private, no-store, max-age=0',
        'x-robots-tag': 'noindex, nofollow',
        'x-bot-guard': 'disallowed-bot',
      },
    })
  }

  const { pathname } = request.nextUrl
  const host = request.headers.get('host')?.toLowerCase().split(':')[0]

  if (process.env.NODE_ENV === 'production' && host?.endsWith('.vercel.app')) {
    const canonicalUrl = request.nextUrl.clone()
    canonicalUrl.protocol = 'https'
    canonicalUrl.host = canonicalHost()
    return NextResponse.redirect(canonicalUrl, 308)
  }

  if (process.env.NODE_ENV === 'production' && shouldDenyExpensiveBotRequest(request)) {
    return botDeniedResponse()
  }

  const boardPostMatch = pathname.match(/^\/boards\/[^/]+\/\d+$/)
  if (
    request.method === 'GET' &&
    boardPostMatch &&
    (request.nextUrl.searchParams.has('page') ||
      request.nextUrl.searchParams.has('listPage') ||
      request.nextUrl.searchParams.has('sort') ||
      request.nextUrl.searchParams.has('from'))
  ) {
    const canonicalUrl = request.nextUrl.clone()
    canonicalUrl.search = ''
    return NextResponse.redirect(canonicalUrl, 301)
  }

  const worthlessPlayerMatch = pathname.match(/^\/livescore\/football\/player\/(\d+)\/([^/]+)$/)
  if (worthlessPlayerMatch) {
    const playerId = worthlessPlayerMatch[1]
    const playerSlug = worthlessPlayerMatch[2]?.toLowerCase()
    const isFallbackPlayerSlug = playerSlug === 'player' || playerSlug === `player-${playerId}`
    if (request.method !== 'GET' && isFallbackPlayerSlug) {
      return new NextResponse('Not Found', {
        status: 404,
        headers: {
          'x-robots-tag': 'noindex, nofollow',
        },
      })
    }
    if (!Number.isFinite(Number(playerId)) || Number(playerId) <= 0 || playerSlug === String(playerId)) {
      return plainNotFoundResponse()
    }
    if (request.method === 'GET') {
      if (isFallbackPlayerSlug) {
        const requestHeaders = new Headers(request.headers)
        requestHeaders.set('x-skip-site-layout', '1')
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        })
      }
    }
  }

  if (request.method === 'GET' && shouldSkipSiteLayout(pathname)) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-skip-site-layout', '1')
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // Route classification
  const protectedPaths = ['/settings'] // Login required paths.
  const authPaths = ['/signin', '/signup'] // Auth pages should redirect logged-in users.
  // Auth callbacks and social signup must remain accessible during login/signup flow.
  const authExceptionPaths = ['/auth/callback', '/auth/naver', '/social-signup']

  const isProtected = protectedPaths.some(path => pathname.startsWith(path))
  const isAuthPage = authPaths.some(path => pathname.startsWith(path))
  const isAdmin = pathname.startsWith('/admin')
  const isAuthException = authExceptionPaths.some(path => pathname.startsWith(path)) || pathname.startsWith('/auth')
  const hasNicknameCookie = request.cookies.get('has_nickname')?.value === '1'
  const hasAuthCookie = hasSupabaseAuthCookie(request)
  const isPublicCrawler = isPublicCrawlerUserAgent(request.headers.get('user-agent'))

  // Anonymous public traffic does not need a Supabase auth lookup in middleware.
  // This avoids public page timeouts caused by auth verification latency.
  if (!isProtected && !isAuthPage && !isAdmin && !isAuthException && !hasAuthCookie) {
    return NextResponse.next({ request: { headers: request.headers } })
  }

  // Fast path: public pages with a verified nickname cookie skip Supabase auth lookup.
  // This keeps common /boards and /livescore visits from paying auth middleware cost.
  if (!isProtected && !isAuthPage && !isAdmin && !isAuthException && hasNicknameCookie) {
    return NextResponse.next({ request: { headers: request.headers } })
  }

  // Public crawler traffic should not be gated by auth/session refresh work.
  // Protected and admin paths still go through the normal checks below.
  if (!isProtected && !isAuthPage && !isAdmin && !isAuthException && isPublicCrawler) {
    return NextResponse.next({ request: { headers: request.headers } })
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database, 'public', any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
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
        remove(name: string, options: CookieOptions) {
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
        // Disable automatic refresh in middleware; the client handles session refresh.
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    }
  )

  try {
    // Validate the user with getUser so the JWT is checked server-side.
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Protect logged-in-only paths.
    if (isProtected && !user) {
      const redirectUrl = new URL('/signin', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      redirectUrl.searchParams.set('message', 'Login is required')
      return NextResponse.redirect(redirectUrl)
    }

    // 2. Force social-login users without a nickname through the signup completion flow.
    if (user && !isAuthException) {
      if (!hasNicknameCookie) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nickname')
          .eq('id', user.id)
          .single()

        if (!profile || !profile.nickname || profile.nickname.trim() === '') {
          return NextResponse.redirect(new URL('/social-signup', request.url))
        }

        // Cache nickname completion for 24 hours.
        response.cookies.set('has_nickname', '1', {
          path: '/',
          maxAge: 60 * 60 * 24,
          httpOnly: true,
          sameSite: 'lax',
        })
      }
    }

    // 3. Redirect logged-in users away from auth pages.
    if (isAuthPage && user) {
      const redirectUrl = request.nextUrl.searchParams.get('redirect') || '/'
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }

    // 4. Restrict admin pages to admin users.
    if (isAdmin) {
      // Block unauthenticated users.
      if (!user) {
        return NextResponse.redirect(new URL('/', request.url))
      }

      // Check admin permission.
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!profile?.is_admin) {
        // Redirect non-admin users to the home page.
        return NextResponse.redirect(new URL('/', request.url))
      }
    }

  } catch (error) {
    if (isSupabaseInvalidRefreshTokenError(error)) {
      clearSupabaseAuthCookies(request, response)
      return response
    }

    console.error('Proxy error:', error)
    // Continue the request even if auth middleware fails.
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Apply middleware to all requests except:
     * - Next.js static assets
     * - Next.js image optimizer
     * - favicon and static public files
     * - API routes
     */
    '/((?!_next/static|_next/image|favicon.ico|api|sitemap[^/]*\\.xml|sitemaps|rss\\.xml|robots\\.txt|ai\\.txt|ads\\.txt|llms\\.txt|site\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)',
  ],
} 
