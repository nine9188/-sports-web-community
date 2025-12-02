'use server'

import { getSupabaseServer, getSupabaseAction } from '@/shared/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface UIThemeSettings {
  borderRadiusDesktop: string
  borderRadiusMobile: string
}

/**
 * UI 테마 설정 조회
 */
export async function getUIThemeSettings(): Promise<UIThemeSettings> {
  // 서버 컴포넌트에서 호출되므로 읽기 전용 클라이언트 사용 (쿠키 수정 금지)
  const supabase = await getSupabaseServer()

  // ui_theme_settings 테이블이 타입 정의에 없어서 타입 단언 사용
  const { data, error } = await supabase
    .from('ui_theme_settings' as never)
    .select('border_radius_desktop, border_radius_mobile')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single()

  if (error || !data) {
    console.error('[getUIThemeSettings] 오류:', error)
    // 기본값 반환
    return {
      borderRadiusDesktop: 'rounded-lg',
      borderRadiusMobile: 'rounded-none'
    }
  }

  // 타입 안전성을 위한 단언
  const typedData = data as unknown as {
    border_radius_desktop: string
    border_radius_mobile: string
  }

  return {
    borderRadiusDesktop: typedData.border_radius_desktop,
    borderRadiusMobile: typedData.border_radius_mobile
  }
}

/**
 * UI 테마 설정 업데이트
 */
export async function updateUIThemeSettings(
  settings: UIThemeSettings
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseAction()

    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: '로그인이 필요합니다.' }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return { success: false, error: '관리자 권한이 필요합니다.' }
    }

    // 설정 업데이트 (ui_theme_settings 테이블이 타입 정의에 없어서 타입 단언 사용)
    const { error } = await supabase
      .from('ui_theme_settings' as never)
      .update({
        border_radius_desktop: settings.borderRadiusDesktop,
        border_radius_mobile: settings.borderRadiusMobile,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      } as never)
      .eq('id', '00000000-0000-0000-0000-000000000001')

    if (error) {
      console.error('[updateUIThemeSettings] 오류:', error)
      return { success: false, error: '설정 저장 실패' }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (e) {
    console.error('[updateUIThemeSettings] 예외:', e)
    return { success: false, error: '알 수 없는 오류' }
  }
}
