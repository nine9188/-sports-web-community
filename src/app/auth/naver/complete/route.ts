import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseRouteHandler } from '@/shared/lib/supabase/server'

/**
 * 네이버 로그인 완료 처리
 * Supabase verify 후 리다이렉트되는 엔드포인트
 * 프로필 확인 후 적절한 페이지로 이동
 */
export async function GET(request: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL

  try {
    const { supabase } = await getSupabaseRouteHandler(request)

    // 현재 세션 확인
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.redirect(`${origin}/signin?message=로그인+세션을+확인할+수+없습니다`)
    }

    // 프로필 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.nickname || profile.nickname.trim() === '') {
      // 닉네임 미설정 - 소셜 회원가입 페이지로
      return NextResponse.redirect(`${origin}/social-signup`)
    }

    // 기존 사용자 - 메인으로
    return NextResponse.redirect(`${origin}/`)
  } catch (error) {
    console.error('네이버 로그인 완료 처리 오류:', error)
    return NextResponse.redirect(`${origin}/signin?message=로그인+처리+중+오류가+발생했습니다`)
  }
}
