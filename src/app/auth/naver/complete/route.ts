import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseRouteHandler } from '@/shared/lib/supabase/server'

/**
 * 네이버 로그인 완료 - 프로필 확인 후 리다이렉트
 */
export async function GET(request: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL

  try {
    const { supabase } = await getSupabaseRouteHandler(request)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(`${origin}/signin?message=로그인+세션을+확인할+수+없습니다`)
    }

    // 프로필 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.nickname || profile.nickname.trim() === '') {
      return NextResponse.redirect(`${origin}/social-signup`)
    }

    return NextResponse.redirect(`${origin}/`)
  } catch (error) {
    console.error('네이버 로그인 완료 처리 오류:', error)
    return NextResponse.redirect(`${origin}/signin?message=로그인+처리+중+오류가+발생했습니다`)
  }
}
