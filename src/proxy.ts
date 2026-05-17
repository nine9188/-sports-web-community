import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/shared/types/supabase'

const CANONICAL_HOST = '4590football.com'

const SITE_LAYOUT_SKIP_PATHS = new Set([
  '/about',
  '/contact',
  '/guide',
  '/privacy',
  '/terms',
])

const PUBLIC_CRAWLER_USER_AGENT_PATTERN =
  /(googlebot|adsbot-google|mediapartners-google|gptbot|chatgpt-user|oai-searchbot|claudebot|claude-searchbot|perplexitybot|perplexity-user|google-extended|ccbot|applebot-extended|bytespider|amazonbot|facebookbot|meta-externalagent)/i

function isPublicCrawlerUserAgent(userAgent: string | null) {
  return Boolean(userAgent && PUBLIC_CRAWLER_USER_AGENT_PATTERN.test(userAgent))
}

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(cookie => cookie.name.startsWith('sb-') && cookie.name.includes('auth-token'))
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



export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get('host')?.toLowerCase().split(':')[0]

  if (process.env.NODE_ENV === 'production' && host?.endsWith('.vercel.app')) {
    const canonicalUrl = request.nextUrl.clone()
    canonicalUrl.protocol = 'https'
    canonicalUrl.host = CANONICAL_HOST
    return NextResponse.redirect(canonicalUrl, 308)
  }

  const boardPostMatch = pathname.match(/^\/boards\/[^/]+\/\d+$/)
  if (
    request.method === 'GET' &&
    boardPostMatch &&
    (request.nextUrl.searchParams.has('page') ||
      request.nextUrl.searchParams.has('sort') ||
      request.nextUrl.searchParams.has('from'))
  ) {
    const canonicalUrl = request.nextUrl.clone()
    canonicalUrl.search = ''
    return NextResponse.redirect(canonicalUrl, 301)
  }

  const worthlessPlayerMatch = pathname.match(/^\/livescore\/football\/player\/(\d+)\/([^/]+)$/)
  if (worthlessPlayerMatch) {
    const playerId = Number(worthlessPlayerMatch[1])
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
    if (request.method === 'GET' && isFallbackPlayerSlug) {
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-skip-site-layout', '1')
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    }
    if (!Number.isFinite(playerId) || playerId <= 0 || playerSlug === String(playerId)) {
      return plainNotFoundResponse()
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

  // Redirect legacy team URLs without a slug to the canonical slug URL.
  const teamMatch = pathname.match(/^\/livescore\/football\/team\/(\d+)$/)
  if (teamMatch) {
    const teamId = teamMatch[1]
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const res = await fetch(`${supabaseUrl}/rest/v1/football_teams?team_id=eq.${teamId}&select=slug&limit=1`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any[] = await res.json()
      const slug = data?.[0]?.slug
      if (isUsableTeamSlug(teamId, slug)) {
        const url = request.nextUrl.clone()
        url.pathname = `/livescore/football/team/${teamId}/${encodeURIComponent(slug)}`
        return NextResponse.redirect(url, 301)
      }
    } catch {
      // Let the App Router resolver try API/name fallbacks.
    }
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
    console.error('Proxy error:', error)
    // Continue the request even if auth middleware fails.
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Apply proxy to all requests except:
     * - Next.js static assets
     * - Next.js image optimizer
     * - favicon and static public files
     * - API routes
     * - match detail pages, which do not need proxy-side auth or redirects
     */
    '/((?!_next/static|_next/image|favicon.ico|api|livescore/football/match/|sitemap[^/]*\\.xml|sitemaps|rss\\.xml|robots\\.txt|ai\\.txt|ads\\.txt|llms\\.txt|site\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)',
  ],
} 
