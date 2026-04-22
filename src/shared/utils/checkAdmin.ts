'use server'

import { getSupabaseServer } from '@/shared/lib/supabase/server'

/**
 * 관리자 권한 확인 공통 헬퍼
 *
 * @throws 인증 실패 또는 관리자가 아닌 경우
 * @returns { user, supabase } - 인증된 관리자 사용자와 Supabase 클라이언트
 */
export async function checkAdmin() {
  const supabase = await getSupabaseServer()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('인증되지 않은 사용자입니다.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) throw new Error('관리자 권한이 필요합니다.')
  return { user, supabase }
}
