'use server'

import { createClient } from '@/shared/api/supabaseServer'

/**
 * 사용자 정지 상태 확인 및 활동 제한
 */
export async function checkSuspensionStatus(userId?: string) {
  try {
    const supabase = await createClient()
    
    // 사용자 ID가 없으면 인증되지 않은 상태
    if (!userId) {
      return { isSuspended: false, suspensionInfo: null }
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('is_suspended, suspended_until, suspended_reason')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('정지 상태 확인 오류:', error)
      return { isSuspended: false, suspensionInfo: null }
    }

    // 타입 캐스팅
    const profileData = data as unknown as {
      is_suspended: boolean | null
      suspended_until: string | null
      suspended_reason: string | null
    }

    // 정지 기간이 만료되었는지 확인
    if (profileData.is_suspended && profileData.suspended_until) {
      const now = new Date()
      const suspendedUntil = new Date(profileData.suspended_until)
      
      // UTC 시간으로 정확히 비교
      if (now.getTime() > suspendedUntil.getTime()) {
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

        return { isSuspended: false, suspensionInfo: null }
      }
    }

    if (profileData.is_suspended) {
      return {
        isSuspended: true,
        suspensionInfo: {
          until: profileData.suspended_until,
          reason: profileData.suspended_reason,
          suspended_until: profileData.suspended_until
        }
      }
    }

    return { isSuspended: false, suspensionInfo: null }

  } catch (error) {
    console.error('정지 상태 확인 오류:', error)
    return { isSuspended: false, suspensionInfo: null }
  }
}

/**
 * 정지된 사용자의 활동을 확인하는 가드 (오류를 던지지 않음)
 */
export async function checkSuspensionGuard(userId?: string) {
  const { isSuspended, suspensionInfo } = await checkSuspensionStatus(userId)
  
  if (isSuspended) {
    const reason = suspensionInfo?.reason || '정책 위반'
    const until = suspensionInfo?.suspended_until ? new Date(suspensionInfo.suspended_until) : null
    
    return {
      isSuspended: true,
      message: `계정이 정지되어 해당 기능을 사용할 수 없습니다.${until ? ` (해제일: ${until.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })})` : ''}`,
      reason
    }
  }
  
  return { isSuspended: false }
}

/**
 * 정지된 사용자의 활동을 차단하는 가드 (기존 방식 - 호환성 유지)
 */
export async function suspensionGuard(userId?: string) {
  const { isSuspended, suspensionInfo } = await checkSuspensionStatus(userId)
  
  if (isSuspended) {
    // 정지 상태라면 오류 발생
    const reason = suspensionInfo?.reason || '정책 위반'
    const until = suspensionInfo?.suspended_until ? new Date(suspensionInfo.suspended_until) : null
    
    throw new Error(`계정이 정지되었습니다. 사유: ${reason}${until ? ` (해제일: ${until.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })})` : ''}`)
  }
  
  return true
} 