'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/shared/api/supabaseServer'

/**
 * 로그아웃 처리 서버 액션
 * 쿠키 제거 및 Supabase 세션 종료
 */
export async function logout() {
  try {
    const supabase = await createClient()
    
    // Supabase 세션 종료
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('로그아웃 오류:', error)
      return { success: false, error: error.message }
    }
    
    // 모든 경로 재검증 (캐시 초기화)
    revalidatePath('/', 'layout')
    
    return { success: true }
  } catch (error) {
    console.error('로그아웃 처리 중 오류 발생:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '로그아웃 중 오류가 발생했습니다'
    }
  }
}

/**
 * 현재 로그인한 사용자 정보 조회
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { user: null }
    }
    
    // 추가 프로필 정보 가져오기
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    return { 
      user,
      profile
    }
  } catch (error) {
    console.error('사용자 정보 조회 중 오류:', error)
    return { user: null }
  }
}

/**
 * 사용자 메타데이터 업데이트
 */
export async function updateUserData(userId: string, metadata: Record<string, unknown>) {
  try {
    const supabase = await createClient()
    
    // 메타데이터 업데이트
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      { user_metadata: metadata }
    )
    
    if (error) {
      console.error('사용자 데이터 업데이트 오류:', error)
      return { success: false, error: error.message }
    }
    
    return { 
      success: true, 
      user: data.user
    }
  } catch (error) {
    console.error('사용자 데이터 업데이트 중 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '사용자 데이터 업데이트 중 오류가 발생했습니다'
    }
  }
}

/**
 * 세션 갱신
 */
export async function refreshSession(refreshToken: string) {
  try {
    const supabase = await createClient()
    
    // 세션 갱신
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    })
    
    if (error) {
      console.error('세션 갱신 오류:', error)
      return { success: false, error: error.message }
    }
    
    return { 
      success: true, 
      session: data.session
    }
  } catch (error) {
    console.error('세션 갱신 중 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '세션 갱신 중 오류가 발생했습니다'
    }
  }
} 