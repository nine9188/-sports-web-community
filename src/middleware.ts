import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 인증이 필요 없는 공개 경로들
  const publicPaths = [
    '/signin', 
    '/signup', 
    '/auth/callback', 
    '/help/account-recovery',
    '/_next',
    '/favicon.ico'
  ];
  
  // 인증이 반드시 필요한 경로들 - 여기에 보호가 필요한 경로만 추가
  const protectedPaths = [
    '/settings',
    '/profile',
    '/my-account',
    '/dashboard',
    '/admin'
  ];
  
  // 현재 경로가 보호된 경로인지 확인
  const isProtectedPath = protectedPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  );
  
  // 현재 경로가 공개 경로인지 확인
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/') || pathname.startsWith('/_next/')
  );
  
  // 보호된 경로가 아니면 인증 검사 없이 통과
  if (!isProtectedPath || isPublicPath) {
    return NextResponse.next();
  }
  
  const response = NextResponse.next();
  
  // 서버 클라이언트 생성
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set(name, value, options);
        },
        remove(name, options) {
          response.cookies.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );
  
  // 인증된 사용자 정보 확인 (getUser 사용 - 보안 강화)
  const { data: { user }, error } = await supabase.auth.getUser();
  
  // 보호된 경로에 접근하려는 인증되지 않은 사용자는 로그인 페이지로 리디렉션
  if ((!user || error) && isProtectedPath) {
    const redirectUrl = new URL('/signin', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  // /boards/[slug]/write 경로 확인
  if (pathname.match(/^\/boards\/[^\/]+\/write$/)) {
    // /boards/[slug]/create 로 리디렉션
    const slug = pathname.split('/')[2];
    const redirectUrl = new URL(`/boards/${slug}/create`, request.url);
    return NextResponse.redirect(redirectUrl);
  }
  
  return response;
}

// 미들웨어를 적용할 경로 지정
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}; 