'use server'

import { getSupabaseServer, getSupabaseAction } from '@/shared/lib/supabase/server'
import { authGuard } from '@/shared/guards/auth.guard'
import { logAuthEvent } from '@/shared/actions/log-actions'
import { revalidatePath } from 'next/cache'

/**
 * 사용자 메타데이터 업데이트
 *
 * @description
 * 사용자의 Auth 메타데이터를 업데이트합니다.
 * authGuard를 사용하여 인증 및 권한을 체크합니다.
 *
 * @example
 * ```typescript
 * const result = await updateUserData(userId, {
 *   avatar_url: 'https://...',
 *   preferences: { theme: 'dark' }
 * })
 * ```
 */
export async function updateUserData(
  userId: string,
  metadata: Record<string, unknown>
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    // 인증 체크 (관리자 또는 본인만 가능)
    const { user: currentUser, profile } = await authGuard()

    // 본인 또는 관리자만 수정 가능
    if (currentUser.id !== userId && !profile.is_admin) {
      return {
        success: false,
        error: '권한이 없습니다.'
      }
    }

    const supabase = await getSupabaseServer()

    // 메타데이터 업데이트
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      { user_metadata: metadata }
    )

    if (error) {
      console.error('사용자 데이터 업데이트 오류:', error)
      return { success: false, error: error.message }
    }

    // 성공 로그 기록
    await logAuthEvent(
      'USER_METADATA_UPDATE',
      `사용자 메타데이터 업데이트: ${userId}`,
      currentUser.id,
      true,
      { targetUserId: userId, metadata: Object.keys(metadata) }
    )

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
 * 소셜 로그인 사용자 프로필 업데이트
 *
 * @description
 * 소셜 로그인으로 가입한 사용자의 프로필 정보를 업데이트합니다.
 * authGuard를 사용하여 인증 및 권한을 체크합니다.
 *
 * @example
 * ```typescript
 * const result = await updateSocialUserProfile(userId, {
 *   nickname: '새닉네임',
 *   username: 'newusername',
 *   full_name: '홍길동'
 * })
 * ```
 */
export async function updateSocialUserProfile(
  userId: string,
  profileData: {
    nickname?: string
    full_name?: string
    username?: string
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // 인증 체크 (본인만 가능)
    const { user: currentUser, profile } = await authGuard()

    // 본인 또는 관리자만 수정 가능
    if (currentUser.id !== userId && !profile.is_admin) {
      return {
        success: false,
        error: '권한이 없습니다.'
      }
    }

    // 입력 검증 (빈 값 필터링)
    const filteredData = Object.fromEntries(
      Object.entries(profileData).filter(([_, value]) => value !== undefined && value !== '')
    )

    if (Object.keys(filteredData).length === 0) {
      return {
        success: false,
        error: '업데이트할 데이터가 없습니다.'
      }
    }

    const supabase = await getSupabaseAction()

    const { error } = await supabase
      .from('profiles')
      .update({
        ...filteredData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('소셜 사용자 프로필 업데이트 오류:', error)
      return { success: false, error: '프로필 업데이트 중 오류가 발생했습니다.' }
    }

    // 성공 로그 기록
    await logAuthEvent(
      'PROFILE_UPDATE',
      `프로필 업데이트: ${userId}`,
      currentUser.id,
      true,
      { targetUserId: userId, updatedFields: Object.keys(filteredData) }
    )

    revalidatePath('/', 'layout')
    return { success: true }

  } catch (error) {
    console.error('소셜 사용자 프로필 업데이트 오류:', error)
    return { success: false, error: '프로필 업데이트를 완료할 수 없습니다.' }
  }
}
