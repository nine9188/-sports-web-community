import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/shared/lib/supabase/server'
import { cookies } from 'next/headers'

/**
 * 네이버 OAuth 콜백 처리
 * 1. 인증 코드로 액세스 토큰 교환
 * 2. 네이버 사용자 정보 조회
 * 3. Supabase에 사용자 생성/로그인
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const origin = process.env.NEXT_PUBLIC_SITE_URL

  if (error || !code) {
    return NextResponse.redirect(`${origin}/signin?message=네이버+로그인이+취소되었습니다`)
  }

  try {
    // 1. 액세스 토큰 교환
    const tokenRes = await fetch('https://nid.naver.com/oauth2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.NAVER_CLIENT_ID!,
        client_secret: process.env.NAVER_CLIENT_SECRET!,
        code,
        state: state || '',
      }),
    })

    const tokenData = await tokenRes.json()

    if (tokenData.error || !tokenData.access_token) {
      console.error('네이버 토큰 교환 실패:', tokenData)
      return NextResponse.redirect(`${origin}/signin?message=네이버+인증에+실패했습니다`)
    }

    // 2. 네이버 사용자 정보 조회
    const profileRes = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    const profileData = await profileRes.json()

    if (profileData.resultcode !== '00' || !profileData.response) {
      console.error('네이버 프로필 조회 실패:', profileData)
      return NextResponse.redirect(`${origin}/signin?message=네이버+사용자+정보를+가져올+수+없습니다`)
    }

    const naverUser = profileData.response
    // naverUser: { id, email, nickname, profile_image, name, ... }

    // 3. Supabase admin으로 사용자 처리
    const supabaseAdmin = getSupabaseAdmin()

    // 네이버 ID로 기존 사용자 찾기
    const naverId = naverUser.id
    const email = naverUser.email || `naver_${naverId}@naver-oauth.local`

    // 기존 사용자 조회 (email 기반)
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(
      (u: any) =>
        u.app_metadata?.provider === 'naver' && u.app_metadata?.naver_id === naverId
    ) || existingUsers?.users?.find(
      (u: any) => u.email === email && u.app_metadata?.provider === 'naver'
    )

    let userId: string

    if (existingUser) {
      // 기존 사용자 - 세션 생성을 위해 매직 링크 방식 사용
      userId = existingUser.id

      // 사용자 메타데이터 업데이트
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          full_name: naverUser.name || naverUser.nickname,
          avatar_url: naverUser.profile_image,
          naver_id: naverId,
        },
      })
    } else {
      // 신규 사용자 생성
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        app_metadata: {
          provider: 'naver',
          naver_id: naverId,
        },
        user_metadata: {
          full_name: naverUser.name || naverUser.nickname,
          avatar_url: naverUser.profile_image,
          naver_id: naverId,
        },
      })

      if (createError || !newUser.user) {
        console.error('네이버 사용자 생성 실패:', createError)
        return NextResponse.redirect(`${origin}/signin?message=회원가입+처리+중+오류가+발생했습니다`)
      }

      userId = newUser.user.id
    }

    // 4. 세션 생성 - generateLink로 매직 링크 생성 후 리다이렉트
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })

    if (linkError || !linkData) {
      console.error('세션 생성 실패:', linkError)
      return NextResponse.redirect(`${origin}/signin?message=로그인+처리+중+오류가+발생했습니다`)
    }

    // PKCE 토큰 해싱 속성 추출
    const tokenHash = linkData.properties?.hashed_token
    if (!tokenHash) {
      console.error('토큰 해시를 찾을 수 없습니다')
      return NextResponse.redirect(`${origin}/signin?message=로그인+처리+중+오류가+발생했습니다`)
    }

    // Supabase verify 엔드포인트로 리다이렉트하여 세션 쿠키 설정
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const verifyUrl = `${supabaseUrl}/auth/v1/verify?token=${tokenHash}&type=magiclink&redirect_to=${origin}/auth/naver/complete`

    return NextResponse.redirect(verifyUrl)
  } catch (error) {
    console.error('네이버 콜백 처리 오류:', error)
    return NextResponse.redirect(`${origin}/signin?message=네이버+로그인+처리+중+오류가+발생했습니다`)
  }
}
