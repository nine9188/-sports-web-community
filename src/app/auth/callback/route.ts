import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseRouteHandler } from '@/shared/lib/supabase/server'

/**
 * OAuth 콜백 처리 라우트 핸들러
 * 카카오 로그인 후 인증 코드를 처리하고 세션을 생성합니다.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  // 프로덕션 환경 origin 사용
  const origin = process.env.NEXT_PUBLIC_SITE_URL

  if (code) {
    try {
      // Route Handler용 Supabase 클라이언트 생성
      const { supabase } = await getSupabaseRouteHandler(request)

      // OAuth 코드를 세션으로 교환 - Supabase가 자동으로 쿠키 설정
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('OAuth 세션 교환 실패:', error)
        return NextResponse.redirect(`${origin}/signin?message=OAuth+인증+실패`)
      }

      if (data.user && data.session) {
        console.log('OAuth 로그인 성공:', { userId: data.user.id, email: data.user.email })

        // 기존 프로필 확인
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profile && !profileError) {
          // 프로필은 있지만 닉네임이 없는 경우 (자동 생성된 프로필)
          if (!profile.nickname || profile.nickname.trim() === '') {
            return NextResponse.redirect(`${origin}/social-signup`)
          }

          // 완전한 기존 사용자 - 메인 페이지로 리다이렉트
          return NextResponse.redirect(`${origin}${next}`)
        } else {
          // 신규 사용자 - 소셜 회원가입 페이지로 리다이렉트
          return NextResponse.redirect(`${origin}/social-signup`)
        }
      }
    } catch (error) {
      console.error('OAuth 콜백 처리 오류:', error)
      return NextResponse.redirect(`${origin}/signin?message=로그인+처리+중+오류가+발생했습니다`)
    }
  }

  // 인증 코드가 없는 경우 로그인 페이지로 리다이렉트
  return NextResponse.redirect(`${origin}/signin?message=인증+정보가+없습니다`)
} 