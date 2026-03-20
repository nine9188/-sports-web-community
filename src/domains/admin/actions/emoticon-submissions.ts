'use server'

import { getSupabaseServer } from '@/shared/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { EmoticonSubmissionWithUser, SubmissionStatus } from '@/domains/shop/types/emoticon-submission'

async function checkAdmin() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('인증되지 않은 사용자입니다.')
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  if (!profile?.is_admin) throw new Error('관리자 권한이 필요합니다.')
  return { user, supabase }
}

/**
 * 전체 신청 목록 조회 (관리자)
 */
export async function getSubmissions(
  filter: 'all' | SubmissionStatus = 'all'
): Promise<EmoticonSubmissionWithUser[]> {
  const { supabase } = await checkAdmin()

  let query = supabase
    .from('emoticon_submissions')
    .select('*')
    .order('created_at', { ascending: false })

  if (filter !== 'all') {
    query = query.eq('status', filter)
  }

  const { data } = await query
  if (!data || data.length === 0) return []

  // 유저 닉네임 별도 조회
  const userIds = [...new Set(data.map(d => d.user_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, nickname')
    .in('id', userIds)

  const profileMap = new Map(profiles?.map(p => [p.id, p]) ?? [])

  return data.map(d => ({
    ...d,
    profiles: profileMap.get(d.user_id) ? { nickname: profileMap.get(d.user_id)!.nickname, avatar_url: null } : null,
  })) as EmoticonSubmissionWithUser[]
}

/**
 * 신청 상세 조회 (관리자)
 */
export async function getSubmissionDetail(id: number) {
  const { supabase } = await checkAdmin()

  const { data } = await supabase
    .from('emoticon_submissions')
    .select('*')
    .eq('id', id)
    .single()

  if (!data) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('nickname')
    .eq('id', data.user_id)
    .single()

  return {
    ...data,
    profiles: profile ? { nickname: profile.nickname, avatar_url: null } : null,
  } as EmoticonSubmissionWithUser
}

/**
 * 승인 처리 (관리자)
 */
export async function approveSubmission(
  id: number,
  finalPrice?: number
): Promise<{ success: boolean; error?: string }> {
  const { user, supabase } = await checkAdmin()

  const { data: submission } = await supabase
    .from('emoticon_submissions')
    .select('*')
    .eq('id', id)
    .single()

  if (!submission) return { success: false, error: '신청서를 찾을 수 없습니다.' }
  if (submission.status !== 'pending') return { success: false, error: '검토 대기 상태인 신청만 승인할 수 있습니다.' }

  const price = finalPrice ?? submission.requested_price
  const packId = `user_${submission.id}`
  let shopItemId: number | null = null

  // 1. 유료인 경우 shop_items 생성
  if (price > 0) {
    const { data: shopItem, error: shopError } = await supabase
      .from('shop_items')
      .insert({
        name: `${submission.pack_name} 이모티콘 팩`,
        description: submission.description,
        price,
        category_id: 25,
        image_url: submission.thumbnail_path,
        is_active: true,
      })
      .select('id')
      .single()

    if (shopError || !shopItem) return { success: false, error: `상점 아이템 생성 실패: ${shopError?.message}` }
    shopItemId = shopItem.id
  }

  // 2. emoticon_packs INSERT
  const emoticonPaths = submission.emoticon_paths as string[]
  const packRows = emoticonPaths.map((url: string, i: number) => ({
    shop_item_id: shopItemId,
    pack_id: packId,
    pack_name: submission.pack_name,
    pack_thumbnail: submission.thumbnail_path,
    pack_creator: null,
    pack_description: submission.description,
    code: `~u${submission.id}_${i + 1}`,
    name: `${submission.pack_name} ${i + 1}`,
    url,
    display_order: i,
    is_active: true,
  }))

  const { error: packError } = await supabase
    .from('emoticon_packs')
    .insert(packRows)

  if (packError) return { success: false, error: `이모티콘 팩 생성 실패: ${packError.message}` }

  // 유저 닉네임으로 pack_creator 업데이트
  const { data: profile } = await supabase
    .from('profiles')
    .select('nickname')
    .eq('id', submission.user_id)
    .single()

  if (profile?.nickname) {
    await supabase
      .from('emoticon_packs')
      .update({ pack_creator: profile.nickname })
      .eq('pack_id', packId)
  }

  // 3. 신청서 업데이트
  const { error: updateError } = await supabase
    .from('emoticon_submissions')
    .update({
      status: 'approved',
      approved_pack_id: packId,
      approved_shop_item_id: shopItemId,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq('id', id)

  if (updateError) return { success: false, error: '신청서 업데이트 실패' }

  revalidatePath('/shop')
  return { success: true }
}

/**
 * 거절 처리 (관리자)
 */
export async function rejectSubmission(
  id: number,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const { user, supabase } = await checkAdmin()

  if (!reason.trim()) return { success: false, error: '거절 사유를 입력해주세요.' }

  const { error } = await supabase
    .from('emoticon_submissions')
    .update({
      status: 'rejected',
      reject_reason: reason.trim(),
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq('id', id)
    .eq('status', 'pending')

  if (error) return { success: false, error: '거절 처리 실패' }

  return { success: true }
}

/**
 * 판매중지 처리 (관리자) — 승인된 팩 대상
 */
export async function suspendSubmission(
  id: number,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const { user, supabase } = await checkAdmin()

  if (!reason.trim()) return { success: false, error: '중지 사유를 입력해주세요.' }

  const { data: submission } = await supabase
    .from('emoticon_submissions')
    .select('approved_pack_id')
    .eq('id', id)
    .eq('status', 'approved')
    .single()

  if (!submission) return { success: false, error: '승인된 신청서를 찾을 수 없습니다.' }

  if (submission.approved_pack_id) {
    await supabase
      .from('emoticon_packs')
      .update({ is_active: false })
      .eq('pack_id', submission.approved_pack_id)
  }

  const { error } = await supabase
    .from('emoticon_submissions')
    .update({
      status: 'suspended',
      suspend_reason: reason.trim(),
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq('id', id)

  if (error) return { success: false, error: '판매중지 처리 실패' }

  revalidatePath('/shop')
  return { success: true }
}
