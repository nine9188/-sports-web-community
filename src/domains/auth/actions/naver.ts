'use server'

import crypto from 'crypto'

/**
 * 네이버 로그인 URL 생성
 * Supabase에 네이버가 기본 provider로 없으므로 직접 OAuth 플로우 구현
 */
export async function signInWithNaver(): Promise<{ url?: string; error?: string }> {
  try {
    const clientId = process.env.NAVER_CLIENT_ID
    if (!clientId) {
      return { error: '네이버 로그인 설정이 되어있지 않습니다.' }
    }

    const state = crypto.randomBytes(16).toString('hex')
    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/naver/callback`

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
    })

    const url = `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`

    return { url }
  } catch (error) {
    console.error('네이버 로그인 URL 생성 오류:', error)
    return { error: '네이버 로그인을 시작할 수 없습니다.' }
  }
}
