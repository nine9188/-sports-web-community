import { createServerActionClient } from '@/shared/api/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

/**
 * OAuth 콜백 처리 라우트 핸들러
 * 카카오 로그인 후 인증 코드를 처리하고 세션을 생성합니다.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  
  // 배포 환경에서는 환경변수 사용, 개발 환경에서는 요청 origin 사용
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
  
  console.log('🔗 콜백 처리 - 요청 URL:', request.url)
  console.log('🌍 사용할 origin:', origin)

  if (code) {
    try {
      const supabase = await createServerActionClient()
      
      // OAuth 코드를 세션으로 교환
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('OAuth 코드 교환 오류:', error)
        return NextResponse.redirect(`${origin}/signin?message=OAuth+인증+실패`)
      }

      if (data.user && data.session) {
        console.log('🔍 사용자 ID:', data.user.id)
        console.log('✅ 세션 생성 완료:', data.session.access_token ? '토큰 있음' : '토큰 없음')
        
        // 세션 쿠키 설정 강화
        const response = NextResponse.redirect(`${origin}/social-signup`)
        
        // 쿠키에 세션 정보 명시적으로 설정 (브라우저 동기화)
        if (data.session.access_token) {
          response.cookies.set('sb-access-token', data.session.access_token, {
            httpOnly: false, // 클라이언트에서 접근 가능하도록
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7일
          })
        }
        
        if (data.session.refresh_token) {
          response.cookies.set('sb-refresh-token', data.session.refresh_token, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30 // 30일
          })
        }
        
        // 기존 프로필 확인
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        console.log('📋 프로필 조회 결과:', { profile, profileError })

        if (profile && !profileError) {
          // 프로필은 있지만 닉네임이 없는 경우 (자동 생성된 프로필)
          if (!profile.nickname || profile.nickname.trim() === '') {
            console.log('⚠️ 닉네임이 없는 기존 사용자 - 소셜 회원가입 페이지로 이동')
            return response // 이미 social-signup으로 설정됨
          }
          
          // 완전한 기존 사용자 - 메인 페이지로 리다이렉트
          console.log('✅ 완전한 기존 사용자 - 메인 페이지로 이동')
          return NextResponse.redirect(`${origin}${next}`)
        } else {
          // 신규 사용자 - 소셜 회원가입 페이지로 리다이렉트
          console.log('🆕 신규 사용자 - 소셜 회원가입 페이지로 이동')
          return response // 이미 social-signup으로 설정됨
        }
      }
    } catch (error) {
      console.error('콜백 처리 중 오류:', error)
      return NextResponse.redirect(`${origin}/signin?message=로그인+처리+중+오류가+발생했습니다`)
    }
  }

  // 인증 코드가 없는 경우 로그인 페이지로 리다이렉트
  return NextResponse.redirect(`${origin}/signin?message=인증+정보가+없습니다`)
} 