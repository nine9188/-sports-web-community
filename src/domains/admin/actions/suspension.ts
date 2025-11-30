'use server'

import { getSupabaseServer } from '@/shared/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface SuspensionData {
  userId: string
  reason: string
  days: number
}

/**
 * 사용자 계정 정지
 */
export async function suspendUser(data: SuspensionData) {
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

    // 정지 해제 날짜 계산
    const suspendedUntil = new Date()
    suspendedUntil.setDate(suspendedUntil.getDate() + data.days)

    // 사용자 정지 처리
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        is_suspended: true,
        suspended_until: suspendedUntil.toISOString(),
        suspended_reason: data.reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.userId)

    if (updateError) {
      return { success: false, error: '정지 처리 중 오류가 발생했습니다.' }
    }

    // 관련 페이지 재검증
    revalidatePath('/admin/users')
    revalidatePath('/settings/profile')

    return { 
      success: true, 
      message: `사용자가 ${data.days}일간 정지되었습니다.`,
      suspendedUntil: suspendedUntil.toISOString()
    }

  } catch (error) {
    console.error('계정 정지 오류:', error)
    return { success: false, error: '서버 오류가 발생했습니다.' }
  }
}

/**
 * 사용자 계정 정지 해제
 */
export async function unsuspendUser(userId: string) {
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

    // 정지 해제 처리
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        is_suspended: false,
        suspended_until: null,
        suspended_reason: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      return { success: false, error: '정지 해제 중 오류가 발생했습니다.' }
    }

    // 관련 페이지 재검증
    revalidatePath('/admin/users')
    revalidatePath('/settings/profile')

    return { 
      success: true, 
      message: '사용자 정지가 해제되었습니다.'
    }

  } catch (error) {
    console.error('정지 해제 오류:', error)
    return { success: false, error: '서버 오류가 발생했습니다.' }
  }
}

/**
 * 정지된 사용자 목록 조회
 */
export async function getSuspendedUsers() {
  try {
    const supabase = await getSupabaseServer()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nickname, email, is_suspended, suspended_until, suspended_reason, updated_at')
      .eq('is_suspended', true)
      .order('updated_at', { ascending: false })

    if (error) {
      return { success: false, error: '정지된 사용자 목록 조회 실패' }
    }

    return { success: true, data: data || [] }

  } catch (error) {
    console.error('정지된 사용자 목록 조회 오류:', error)
    return { success: false, error: '서버 오류가 발생했습니다.' }
  }
}

/**
 * 사용자 정지 상태 확인
 */
export async function checkUserSuspension(userId: string) {
  try {
    const supabase = await getSupabaseServer()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('is_suspended, suspended_until, suspended_reason')
      .eq('id', userId)
      .single()

    if (error) {
      return { success: false, error: '사용자 정보를 조회할 수 없습니다.' }
    }

    // 타입 캐스팅
    const userData = data as unknown as {
      is_suspended: boolean | null
      suspended_until: string | null
      suspended_reason: string | null
    }

    // 정지 기간이 만료되었는지 확인
    if (userData.is_suspended && userData.suspended_until) {
      const now = new Date()
      const suspendedUntil = new Date(userData.suspended_until)
      
      if (now > suspendedUntil) {
        // 자동으로 정지 해제
        await supabase
          .from('profiles')
          .update({
            is_suspended: false,
            suspended_until: null,
            suspended_reason: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        return { 
          success: true, 
          data: { 
            is_suspended: false, 
            suspended_until: null, 
            suspended_reason: null 
          } 
        }
      }
    }

    return {
      success: true,
      isSuspended: userData.is_suspended || false,
      suspendedUntil: userData.suspended_until,
      suspendedReason: userData.suspended_reason
    }

  } catch (error) {
    console.error('사용자 정지 상태 확인 오류:', error)
    return { success: false, error: '서버 오류가 발생했습니다.' }
  }
}

/**
 * 모든 사용자 목록 조회 (마지막 접속 시간 포함)
 */
export async function getAllUsersWithLastAccess() {
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

    // profiles 테이블에서 사용자 정보 가져오기
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('updated_at', { ascending: false })
      
    if (profilesError) {
      return { success: false, error: '사용자 목록 조회 실패' }
    }

    // 데이터 가공
    const usersWithLastAccess = profiles?.map(profile => {
      const profileData = profile as unknown as {
        id: string
        email: string | null
        nickname: string | null
        full_name: string | null
        is_admin: boolean | null
        updated_at: string | null
        is_suspended: boolean | null
        suspended_until: string | null
        suspended_reason: string | null
      }
      
      return {
        id: profileData.id,
        email: profileData.email || '',
        nickname: profileData.nickname || profileData.full_name || '',
        is_admin: profileData.is_admin || false,
        created_at: profileData.updated_at || '',
        last_sign_in_at: null, // 클라이언트에서 별도 처리
        is_suspended: profileData.is_suspended || false,
        suspended_until: profileData.suspended_until || null,
        suspended_reason: profileData.suspended_reason || null,
      }
    }) || []

    return { success: true, data: usersWithLastAccess }

  } catch (error) {
    console.error('사용자 목록 조회 오류:', error)
    return { success: false, error: '서버 오류가 발생했습니다.' }
  }
} 