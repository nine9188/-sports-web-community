'use server'

import { createClient } from '@/shared/api/supabaseServer'
import { revalidatePath } from 'next/cache'

/**
 * 사용자 로그인 처리 서버 액션
 */
export async function signIn(email: string, password: string) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/', 'layout')
    return { data }
  } catch {
    return { error: '로그인 중 오류가 발생했습니다.' }
  }
}

/**
 * 사용자 로그아웃 처리 서버 액션
 */
export async function signOut() {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch {
    return { error: '로그아웃 중 오류가 발생했습니다.' }
  }
}

/**
 * 아이디 찾기 처리 서버 액션
 */
export async function findUsername(email: string, verificationCode: string) {
  try {
    const supabase = await createClient()
    
    // 1. 인증 코드 확인 (OTP 검증)
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: verificationCode,
      type: 'email'
    })
    
    if (verifyError) {
      return { error: '인증 코드가 올바르지 않습니다' }
    }
    
    // 2. 이메일로 사용자 정보 조회
    const { data, error } = await supabase
      .from('profiles')
      .select('username, full_name')
      .eq('email', email)
      .single()
    
    if (error || !data) {
      return { error: '입력하신 정보와 일치하는 계정을 찾을 수 없습니다' }
    }
    
    return { 
      success: true, 
      username: data.username, 
      fullName: data.full_name 
    }
  } catch (error) {
    console.error('아이디 찾기 오류:', error)
    return { error: '계정 정보를 찾는 중 오류가 발생했습니다' }
  }
}

export async function signUp(email: string, password: string) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      return { error: error.message }
    }

    return { data }
  } catch {
    return { error: '회원가입 중 오류가 발생했습니다.' }
  }
} 