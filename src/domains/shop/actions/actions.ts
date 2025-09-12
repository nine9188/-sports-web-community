'use server'

import { createClient } from '@/shared/api/supabaseServer'
import { revalidatePath } from 'next/cache'
import { checkSuspensionGuard } from '@/shared/utils/suspension-guard'
import { logUserAction } from '@/shared/actions/log-actions'

/**
 * 상점 카테고리 조회
 */
export async function getShopCategories() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('shop_categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
  
  if (error) throw new Error('카테고리 목록 조회 실패')
  return data || []
}

/**
 * 특정 카테고리 조회
 */
export async function getShopCategory(slug: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('shop_categories')
    .select(`
      *,
      subcategories:shop_categories(
        id,
        name,
        slug,
        description
      )
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  
  if (error) return null
  return data
}

/**
 * 카테고리 아이템 조회
 */
export async function getCategoryItems(categoryIds: number[]) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('shop_items')
    .select('*, category:shop_categories(name)')
    .in('category_id', categoryIds)
    .eq('is_active', true)
    .order('price', { ascending: true })
  
  if (error) throw new Error('아이템 목록 조회 실패')
  return data || []
}

/**
 * 사용자 포인트 조회
 */
export async function getUserPoints(userId: string | undefined): Promise<number> {
  if (!userId) return 0
  
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('points')
    .eq('id', userId)
    .single()
  
  if (error) return 0
  return data?.points || 0
}

/**
 * 사용자 보유 아이템 목록 조회
 */
export async function getUserItems(userId: string | undefined): Promise<number[]> {
  if (!userId) return []
  
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('user_items')
    .select('item_id')
    .eq('user_id', userId)
  
  return data?.map(item => item.item_id) || []
}

/**
 * 아이템 구매
 */
export async function purchaseItem(itemId: number) {
  try {
    const supabase = await createClient()
    
    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('로그인이 필요합니다')
    
    // 계정 정지 상태 확인
    const suspensionCheck = await checkSuspensionGuard(user.id)
    if (suspensionCheck.isSuspended) {
      throw new Error(suspensionCheck.message || '계정이 정지되어 상점을 이용할 수 없습니다.')
    }
    
    // 트랜잭션 처리를 위한 RPC 호출
    // Supabase 함수를 호출하여 DB 트랜잭션 수행 (포인트 차감 + 아이템 추가)
    const { data, error } = await supabase.rpc('purchase_item', {
      p_user_id: user.id,
      p_item_id: itemId
    })
    
    if (error) throw new Error(error.message || '아이템 구매에 실패했습니다')
    
    // 캐시 갱신
    revalidatePath('/shop')
    
    // 아이템 구매 성공 로그 기록
    await logUserAction(
      'ITEM_PURCHASE',
      `상점 아이템 구매 (아이템 ID: ${itemId})`,
      user.id,
      {
        itemId,
        userId: user.id
      }
    );
    
    return data
  } catch (error) {
    // 기존 오류 그대로 전달
    throw error
  }
} 