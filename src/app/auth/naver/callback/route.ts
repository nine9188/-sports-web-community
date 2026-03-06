import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/shared/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * 네이버 OAuth 콜백 처리
 * 1. 인증 코드로 액세스 토큰 교환
 * 2. 네이버 사용자 정보 조회
 * 3. Supabase에 사용자 생성/로그인
 * 4. 서버에서 직접 세션 쿠키 설정
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

    // 3. Supabase admin으로 사용자 처리
    const supabaseAdmin = getSupabaseAdmin()
    const naverId = naverUser.id
    const email = naverUser.email || `naver_${naverId}@naver-oauth.local`

    // 네이버 ID로 기존 사용자 찾기 (auth.users의 app_metadata)
    const { data: { users: allUsers } } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const existingUser = allUsers?.find(
      (u: any) => u.app_metadata?.provider === 'naver' && u.app_metadata?.naver_id === naverId
    )

    let userId: string
    let userEmail: string

    if (existingUser) {
      userId = existingUser.id
      userEmail = existingUser.email!

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
      userEmail = email
    }

    // 4. 매직링크 생성 후 서버에서 직접 verify하여 세션 획득
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
    })

    if (linkError || !linkData) {
      console.error('매직링크 생성 실패:', linkError)
      return NextResponse.redirect(`${origin}/signin?message=로그인+처리+중+오류가+발생했습니다`)
    }

    const tokenHash = linkData.properties?.hashed_token
    if (!tokenHash) {
      console.error('토큰 해시를 찾을 수 없습니다')
      return NextResponse.redirect(`${origin}/signin?message=로그인+처리+중+오류가+발생했습니다`)
    }

    // 서버에서 직접 Supabase verify API 호출하여 세션 획득
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const verifyRes = await fetch(`${supabaseUrl}/auth/v1/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({
        token_hash: tokenHash,
        type: 'magiclink',
      }),
    })

    const session = await verifyRes.json()

    if (!session.access_token || !session.refresh_token) {
      console.error('세션 획득 실패:', session)
      return NextResponse.redirect(`${origin}/signin?message=로그인+세션+생성에+실패했습니다`)
    }

    // 5. 쿠키에 세션 설정
    const cookieStore = await cookies()
    const response = NextResponse.redirect(`${origin}/auth/naver/complete`)

    // Supabase SSR 쿠키 설정
    const cookieName = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`

    // base64로 인코딩된 세션 데이터를 chunked 쿠키로 설정
    const sessionStr = JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      expires_in: session.expires_in,
      token_type: session.token_type,
      user: session.user,
    })

    // Supabase SSR은 base64로 인코딩 후 청크로 나눔
    const encoded = Buffer.from(sessionStr).toString('base64')
    const chunkSize = 3180 // Supabase SSR 기본 청크 크기
    const chunks = []
    for (let i = 0; i < encoded.length; i += chunkSize) {
      chunks.push(encoded.slice(i, i + chunkSize))
    }

    const cookieOptions = {
      path: '/',
      httpOnly: false,
      secure: true,
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 365, // 1년
    }

    if (chunks.length === 1) {
      response.cookies.set(`${cookieName}`, `base64-${encoded}`, cookieOptions)
    } else {
      chunks.forEach((chunk, i) => {
        response.cookies.set(`${cookieName}.${i}`, `base64-${chunk}`, cookieOptions)
      })
    }

    return response
  } catch (error) {
    console.error('네이버 콜백 처리 오류:', error)
    return NextResponse.redirect(`${origin}/signin?message=네이버+로그인+처리+중+오류가+발생했습니다`)
  }
}
