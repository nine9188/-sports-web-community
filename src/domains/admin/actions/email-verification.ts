'use server'

import { getSupabaseServer, getSupabaseAdmin } from '@/shared/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * 사용자 이메일 인증 상태 확인
 */
export async function checkEmailVerification(userId: string) {
  try {
    const supabase = getSupabaseAdmin()

    // auth.users에서 이메일 인증 상태 조회
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', userId)
      .single()

    if (error || !data?.email) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' }
    }

    // auth.users 테이블에서 직접 조회 (admin client로 RPC 사용)
    const { data: authUser, error: authError } = await supabase.rpc(
      'get_user_email_confirmed',
      { user_id: userId }
    )

    if (authError) {
      // RPC가 없으면 SQL로 직접 조회
      return { success: true, emailConfirmed: null, error: 'RPC 함수가 필요합니다.' }
    }

    return {
      success: true,
      emailConfirmed: authUser?.email_confirmed_at !== null
    }

  } catch (error) {
    console.error('이메일 인증 상태 확인 오류:', error)
    return { success: false, error: '서버 오류가 발생했습니다.' }
  }
}

/**
 * 관리자가 사용자 이메일 인증 처리 (auth.users 테이블 직접 업데이트)
 */
export async function confirmUserEmail(userId: string) {
  try {
    const supabase = await getSupabaseServer()

    // 현재 관리자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '인증이 필요합니다.' }
    }

    // 관리자 권한 확인
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!adminProfile?.is_admin) {
      return { success: false, error: '관리자 권한이 필요합니다.' }
    }

    // Admin 클라이언트로 auth.users 업데이트
    const adminSupabase = getSupabaseAdmin()

    // auth.admin.updateUserById 사용
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
      userId,
      { email_confirm: true }
    )

    if (updateError) {
      console.error('이메일 인증 처리 오류:', updateError)
      return { success: false, error: '이메일 인증 처리 중 오류가 발생했습니다.' }
    }

    // profiles 테이블도 동기화
    await adminSupabase
      .from('profiles')
      .update({
        email_confirmed: true,
        email_confirmed_at: new Date().toISOString()
      })
      .eq('id', userId)

    // 관련 페이지 재검증
    revalidatePath('/admin/users')

    return {
      success: true,
      message: '이메일 인증이 완료되었습니다.'
    }

  } catch (error) {
    console.error('이메일 인증 처리 오류:', error)
    return { success: false, error: '서버 오류가 발생했습니다.' }
  }
}

/**
 * 모든 사용자의 이메일 인증 상태 조회 (관리자용)
 */
export async function getAllUsersEmailStatus() {
  try {
    const supabase = await getSupabaseServer()

    // 현재 사용자가 관리자인지 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '인증이 필요합니다.' }
    }

    // 관리자 권한 확인
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!adminProfile?.is_admin) {
      return { success: false, error: '관리자 권한이 필요합니다.' }
    }

    // Admin 클라이언트로 사용자 목록 조회
    const adminSupabase = getSupabaseAdmin()

    const { data: authUsers, error: listError } = await adminSupabase.auth.admin.listUsers()

    if (listError) {
      console.error('사용자 목록 조회 오류:', listError)
      return { success: false, error: '사용자 목록 조회 실패' }
    }

    // email_confirmed_at 정보를 맵으로 변환
    const emailStatusMap: Record<string, { emailConfirmed: boolean; emailConfirmedAt: string | null }> = {}

    authUsers.users.forEach(authUser => {
      emailStatusMap[authUser.id] = {
        emailConfirmed: authUser.email_confirmed_at !== null,
        emailConfirmedAt: authUser.email_confirmed_at || null
      }
    })

    return { success: true, data: emailStatusMap }

  } catch (error) {
    console.error('이메일 상태 조회 오류:', error)
    return { success: false, error: '서버 오류가 발생했습니다.' }
  }
}
