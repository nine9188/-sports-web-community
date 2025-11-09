'use server'

import { revalidatePath } from 'next/cache'
import { createServerActionClient } from '@/shared/api/supabaseServer'
import type { SiteSetting } from './types'

/**
 * 타입별 사이트 설정 조회
 * 예: 'branding', 'general', 'policy'
 */
export async function getSiteSettingsByType(type: string): Promise<SiteSetting[]> {
  const supabase = await createServerActionClient()

  // 임시 구현: site_settings 테이블(키/값 저장) 가정
  // 실제 테이블 스키마에 맞게 컬럼명과 테이블명을 조정하세요.
  const { data, error } = await supabase
    .from('site_settings')
    .select('key, value, type')
    .eq('type', type)

  if (error) {
    console.error('[getSiteSettingsByType] 오류:', error)
    return []
  }

  return (data || []).map((row: any) => ({ key: row.key, value: row.value, type: row.type }))
}

/**
 * 여러 사이트 설정을 한 번에 업데이트
 */
export async function updateMultipleSiteSettings(settings: Array<{ key: string; value: unknown; type?: string }>): Promise<{ success: boolean; error?: string }>{
  try {
    const supabase = await createServerActionClient()

    // 현재 사용자 확인 (관리자 여부는 필요시 추가 검증)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: '로그인이 필요합니다.' }

    // upsert: key를 고유키로 가정. type은 없으면 'branding'으로 기본값.
    const rows = settings.map((s) => ({ key: s.key, value: s.value, type: s.type ?? 'branding', updated_by: user.id }))

    const { error } = await supabase
      .from('site_settings')
      .upsert(rows, { onConflict: 'key' })

    if (error) {
      console.error('[updateMultipleSiteSettings] 오류:', error)
      return { success: false, error: '설정 저장 실패' }
    }

    revalidatePath('/admin/site-management/branding')
    return { success: true }
  } catch (e) {
    console.error('[updateMultipleSiteSettings] 예외:', e)
    return { success: false, error: '알 수 없는 오류' }
  }
}














