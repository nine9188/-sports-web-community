import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/shared/api/middleware';
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
  
  // /boards/[slug]/write 경로 확인
  if (pathname.match(/^\/boards\/[^\/]+\/write$/)) {
    // /boards/[slug]/create 로 리디렉션
    const slug = pathname.split('/')[2];
    const redirectUrl = new URL(`/boards/${slug}/create`, request.url);
    return NextResponse.redirect(redirectUrl);
  }
  
  // 세션 업데이트 (Auth 토큰 새로고침)
  const response = await updateSession(request);
  
  // 보호된 경로가 아니거나 공개 경로면 인증 검사 없이 통과
  if (!isProtectedPath || isPublicPath) {
    return response;
  }
  
  // 보호된 경로에 대해서만 인증 확인
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set() {
          // 미들웨어에서는 쿠키 설정하지 않음 (updateSession에서 처리됨)
        },
        remove() {
          // 미들웨어에서는 쿠키 제거하지 않음 (updateSession에서 처리됨)
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
  
  return response;
}

// 미들웨어를 적용할 경로 지정
export const config = {
  matcher: [
    /*
     * 다음으로 시작하는 경로를 제외한 모든 요청 경로와 매치:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화 파일)
     * - favicon.ico (파비콘 파일)
     * 더 많은 경로를 포함하려면 이 패턴을 수정하세요.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 