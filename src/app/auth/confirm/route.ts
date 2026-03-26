import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseRouteHandler, getSupabaseAdmin } from '@/shared/lib/supabase/server'

/**
 * 이메일 인증 확인 라우트 핸들러
 * Supabase 이메일 인증 링크의 token_hash를 처리합니다.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const rawRedirectTo = searchParams.get('redirect_to') ?? '/'
  // Open Redirect 방지: 상대 경로만 허용
  const redirect_to = rawRedirectTo.startsWith('/') && !rawRedirectTo.startsWith('//') ? rawRedirectTo : '/'

  const origin = process.env.NEXT_PUBLIC_SITE_URL

  if (token_hash && type) {
    try {
      const { supabase } = await getSupabaseRouteHandler(request)

      // 토큰으로 이메일 인증 처리
      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as 'signup' | 'email' | 'recovery' | 'invite'
      })

      if (error) {
        console.error('이메일 인증 실패:', error)
        return NextResponse.redirect(`${origin}/signin?message=이메일+인증에+실패했습니다`)
      }

      // 이메일 인증 성공 시 profiles 업데이트
      if (type === 'signup' || type === 'email') {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const supabaseAdmin = getSupabaseAdmin()
          await supabaseAdmin
            .from('profiles')
            .update({
              email_confirmed: true,
              email_confirmed_at: new Date().toISOString(),
            })
            .eq('id', user.id)
        }
      }

      // 인증 성공 - redirect_to로 리다이렉트
      return NextResponse.redirect(`${origin}${redirect_to}`)
    } catch (error) {
      console.error('이메일 인증 처리 오류:', error)
      return NextResponse.redirect(`${origin}/signin?message=인증+처리+중+오류가+발생했습니다`)
    }
  }

  // 필수 파라미터가 없는 경우
  return NextResponse.redirect(`${origin}/signin?message=인증+정보가+없습니다`)
}
