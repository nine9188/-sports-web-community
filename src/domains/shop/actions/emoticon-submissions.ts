'use server'

import { getSupabaseServer } from '@/shared/lib/supabase/server'
import type { EmoticonSubmission, SubmitEmoticonFormData } from '../types/emoticon-submission'
import { SUBMISSION_LIMITS } from '../types/emoticon-submission'

/**
 * 팩 이름 중복 체크
 */
export async function checkPackNameDuplicate(name: string): Promise<boolean> {
  const supabase = await getSupabaseServer()

  // emoticon_packs에서 체크
  const { data: existingPack } = await supabase
    .from('emoticon_packs')
    .select('pack_id')
    .eq('pack_name', name)
    .limit(1)

  if (existingPack && existingPack.length > 0) return true

  // emoticon_submissions에서 pending/approved 체크
  const { data: existingSubmission } = await supabase
    .from('emoticon_submissions')
    .select('id')
    .eq('pack_name', name)
    .in('status', ['pending', 'approved'])
    .limit(1)

  return !!(existingSubmission && existingSubmission.length > 0)
}

/**
 * 이모티콘 팩 신청 제출
 */
export async function submitEmoticonPack(
  formData: SubmitEmoticonFormData
): Promise<{ success: boolean; id?: number; error?: string }> {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: '로그인이 필요합니다.' }

  // 정지 유저 체크
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_suspended')
    .eq('id', user.id)
    .single()

  if (profile?.is_suspended) return { success: false, error: '정지된 계정입니다.' }

  // 하루 신청 제한 체크
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { count } = await supabase
    .from('emoticon_submissions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', today.toISOString())

  if ((count ?? 0) >= SUBMISSION_LIMITS.DAILY_MAX) {
    return { success: false, error: `하루 최대 ${SUBMISSION_LIMITS.DAILY_MAX}건까지 신청할 수 있습니다.` }
  }

  // 팩 이름 검증
  const trimmedName = formData.packName.trim()
  if (trimmedName.length < SUBMISSION_LIMITS.PACK_NAME_MIN || trimmedName.length > SUBMISSION_LIMITS.PACK_NAME_MAX) {
    return { success: false, error: `팩 이름은 ${SUBMISSION_LIMITS.PACK_NAME_MIN}~${SUBMISSION_LIMITS.PACK_NAME_MAX}자여야 합니다.` }
  }

  // 중복 체크
  const isDuplicate = await checkPackNameDuplicate(trimmedName)
  if (isDuplicate) return { success: false, error: '이미 사용 중인 팩 이름입니다.' }

  // 이모티콘 개수 검증
  if (formData.emoticonPaths.length < SUBMISSION_LIMITS.EMOTICON_MIN || formData.emoticonPaths.length > SUBMISSION_LIMITS.EMOTICON_MAX) {
    return { success: false, error: `이모티콘은 ${SUBMISSION_LIMITS.EMOTICON_MIN}~${SUBMISSION_LIMITS.EMOTICON_MAX}개여야 합니다.` }
  }

  // 설명 검증
  const trimmedDesc = formData.description.trim()
  if (trimmedDesc.length < SUBMISSION_LIMITS.DESCRIPTION_MIN || trimmedDesc.length > SUBMISSION_LIMITS.DESCRIPTION_MAX) {
    return { success: false, error: `설명은 ${SUBMISSION_LIMITS.DESCRIPTION_MIN}~${SUBMISSION_LIMITS.DESCRIPTION_MAX}자여야 합니다.` }
  }

  // 태그 검증
  if (formData.tags.length > SUBMISSION_LIMITS.TAGS_MAX) {
    return { success: false, error: `태그는 최대 ${SUBMISSION_LIMITS.TAGS_MAX}개입니다.` }
  }

  // INSERT
  const { data, error } = await supabase
    .from('emoticon_submissions')
    .insert({
      user_id: user.id,
      pack_name: trimmedName,
      description: trimmedDesc,
      category: formData.category,
      tags: formData.tags,
      thumbnail_path: formData.thumbnailPath,
      emoticon_paths: formData.emoticonPaths,
      emoticon_count: formData.emoticonPaths.length,
      requested_price: formData.requestedPrice,
    })
    .select('id')
    .single()

  if (error) return { success: false, error: '신청 중 오류가 발생했습니다.' }

  return { success: true, id: data.id }
}

/**
 * 내 신청 내역 조회
 */
export async function getMySubmissions(): Promise<EmoticonSubmission[]> {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data } = await supabase
    .from('emoticon_submissions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (data ?? []) as EmoticonSubmission[]
}

/**
 * 내 판매중지 내역 조회
 */
export async function getMySuspendedSubmissions(): Promise<EmoticonSubmission[]> {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data } = await supabase
    .from('emoticon_submissions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'suspended')
    .order('reviewed_at', { ascending: false })

  return (data ?? []) as EmoticonSubmission[]
}

/**
 * 신청 취소 (pending 상태만)
 */
export async function cancelSubmission(id: number): Promise<{ success: boolean; error?: string }> {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: '로그인이 필요합니다.' }

  // 본인 소유 + pending 상태 확인
  const { data: submission } = await supabase
    .from('emoticon_submissions')
    .select('id, user_id, status')
    .eq('id', id)
    .single()

  if (!submission) return { success: false, error: '신청서를 찾을 수 없습니다.' }
  if (submission.user_id !== user.id) return { success: false, error: '권한이 없습니다.' }
  if (submission.status !== 'pending') return { success: false, error: '검토중인 신청만 취소할 수 있습니다.' }

  const { error } = await supabase
    .from('emoticon_submissions')
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: '취소 중 오류가 발생했습니다.' }

  return { success: true }
}
