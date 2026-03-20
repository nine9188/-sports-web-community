'use server'

import { getSupabaseServer } from '@/shared/lib/supabase/server'

// ── Supabase 전체 조회 헬퍼 (1000행 제한 우회) ──
const PAGE_SIZE = 1000
async function fetchAll<T>(
  queryFn: (from: number, to: number) => Promise<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  const allData: T[] = []
  let from = 0
  while (true) {
    const { data, error } = await queryFn(from, from + PAGE_SIZE - 1)
    if (error) throw new Error('데이터 조회 실패')
    if (!data || data.length === 0) break
    allData.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }
  return allData
}

// ── 타입 ──

export interface EmoticonPackInfo {
  pack_id: string
  pack_name: string
  pack_thumbnail: string
  pack_creator: string | null
  pack_description: string | null
  shop_item_id: number | null
  emoticon_count: number
  price: number | null
  purchase_count: number
  created_at: string | null
}

export interface EmoticonFromDB {
  id: number
  pack_id: string
  pack_name: string
  pack_thumbnail: string
  code: string
  name: string
  url: string
  shop_item_id: number | null
  display_order: number
}

export interface PackDetailData {
  pack_id: string
  pack_name: string
  pack_thumbnail: string
  pack_creator: string | null
  pack_description: string | null
  shop_item_id: number | null
  price: number | null
  emoticon_count: number
  emoticons: EmoticonFromDB[]
  isOwned: boolean
  isFree: boolean
}

export interface PickerPackage {
  pack_id: string
  pack_name: string
  pack_thumbnail: string
  emoticons: EmoticonFromDB[]
}

// ── 팩 목록 조회 ──

/**
 * 모든 이모티콘 팩 목록 조회 (상점용)
 */
export async function getEmoticonPacks(): Promise<EmoticonPackInfo[]> {
  const supabase = await getSupabaseServer()

  // 뷰에서 팩 요약 정보 조회 (GROUP BY로 개수 포함, limit 문제 없음)
  const { data, error } = await supabase
    .from('emoticon_pack_summary')
    .select('pack_id, pack_name, pack_thumbnail, pack_creator, pack_description, shop_item_id, emoticon_count, created_at')

  if (error) throw new Error('이모티콘 팩 조회 실패')

  // 유료 팩의 가격 + 구매 수 조회
  const shopItemIds = (data || [])
    .filter(p => p.shop_item_id !== null)
    .map(p => p.shop_item_id as number)

  let priceMap = new Map<number, number>()
  let purchaseCountMap = new Map<number, number>()

  if (shopItemIds.length > 0) {
    const { data: items } = await supabase
      .from('shop_items')
      .select('id, price')
      .in('id', shopItemIds)
      .eq('is_active', true)

    if (items) {
      priceMap = new Map(items.map(i => [i.id, i.price]))
    }

    // 구매 수 조회
    const { data: purchases } = await supabase
      .from('user_items')
      .select('item_id')
      .in('item_id', shopItemIds)

    if (purchases) {
      for (const p of purchases) {
        purchaseCountMap.set(p.item_id, (purchaseCountMap.get(p.item_id) ?? 0) + 1)
      }
    }
  }

  return (data || []).map(row => ({
    pack_id: row.pack_id,
    pack_name: row.pack_name,
    pack_thumbnail: row.pack_thumbnail,
    pack_creator: row.pack_creator,
    pack_description: row.pack_description,
    shop_item_id: row.shop_item_id,
    emoticon_count: row.emoticon_count,
    price: row.shop_item_id ? (priceMap.get(row.shop_item_id) ?? null) : null,
    purchase_count: row.shop_item_id ? (purchaseCountMap.get(row.shop_item_id) ?? 0) : 0,
    created_at: row.created_at,
  }))
}

// ── 개별 팩 조회 ──

/**
 * 특정 팩의 이모티콘 목록 조회
 */
export async function getEmoticonsByPackId(packId: string): Promise<EmoticonFromDB[]> {
  const supabase = await getSupabaseServer()

  const { data, error } = await supabase
    .from('emoticon_packs')
    .select('id, pack_id, pack_name, pack_thumbnail, code, name, url, shop_item_id, display_order')
    .eq('pack_id', packId)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .limit(1000)

  if (error) throw new Error('이모티콘 조회 실패')
  return (data || []) as EmoticonFromDB[]
}

/**
 * 팩 상세 정보 조회 (detail 뷰용)
 */
export async function getPackDetail(packId: string): Promise<PackDetailData | null> {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('emoticon_packs')
    .select('id, pack_id, pack_name, pack_thumbnail, pack_creator, pack_description, code, name, url, shop_item_id, display_order')
    .eq('pack_id', packId)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .limit(1000)

  if (error || !data || data.length === 0) return null

  const first = data[0]
  // 가격 조회
  let price: number | null = null
  if (first.shop_item_id) {
    const { data: item } = await supabase
      .from('shop_items')
      .select('price')
      .eq('id', first.shop_item_id)
      .single()
    price = item?.price ?? null
  }

  const isFree = !first.shop_item_id || price === 0

  // 보유 확인: 기본 팩(shop_item_id 없음)은 자동 보유
  let isOwned = !first.shop_item_id
  if (first.shop_item_id && user) {
    const { data: owned } = await supabase
      .from('user_items')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_id', first.shop_item_id)
      .maybeSingle()
    isOwned = !!owned
  }

  return {
    pack_id: first.pack_id,
    pack_name: first.pack_name,
    pack_thumbnail: first.pack_thumbnail,
    pack_creator: first.pack_creator,
    pack_description: first.pack_description,
    shop_item_id: first.shop_item_id,
    price,
    emoticon_count: data.length,
    emoticons: data as EmoticonFromDB[],
    isOwned,
    isFree,
  }
}

// ── 유저 보유 팩 ──

/**
 * 유저가 보유한 이모티콘 팩 shop_item_id 목록 조회
 */
export async function getUserOwnedEmoticonPacks(): Promise<number[]> {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: paidPacks } = await supabase
    .from('emoticon_packs')
    .select('shop_item_id')
    .not('shop_item_id', 'is', null)
    .eq('is_active', true)
    .limit(1000)

  const shopItemIds = Array.from(new Set((paidPacks || []).map(p => p.shop_item_id).filter(Boolean))) as number[]
  if (shopItemIds.length === 0) return []

  const { data: userItems } = await supabase
    .from('user_items')
    .select('item_id')
    .eq('user_id', user.id)
    .in('item_id', shopItemIds)

  return (userItems || []).map(ui => ui.item_id)
}

// ── 상점 뷰 통합 데이터 ──

export async function getEmoticonShopData() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  const [packs, ownedItemIds] = await Promise.all([
    getEmoticonPacks(),
    getUserOwnedEmoticonPacks(),
  ])

  let userPoints = 0
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', user.id)
      .single()
    userPoints = profile?.points || 0
  }

  return {
    packs,
    ownedItemIds,
    userPoints,
    isLoggedIn: !!user,
    userId: user?.id || null,
  }
}

// ── 피커 데이터 (순서 반영) ──

/**
 * 피커용: 유저가 사용 가능한 팩 + 이모티콘 (순서 반영)
 */
export async function getPickerData(): Promise<PickerPackage[]> {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  // 모든 활성 이모티콘 조회 (1000행 제한 우회)
  const data = await fetchAll((from, to) =>
    supabase
      .from('emoticon_packs')
      .select('id, pack_id, pack_name, pack_thumbnail, code, name, url, shop_item_id, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .range(from, to)
  )

  // 무료 팩의 pack_id 수집
  const freePackIds = new Set<string>()
  const paidPackShopItems = new Map<string, number>() // pack_id → shop_item_id

  for (const row of data || []) {
    if (!row.shop_item_id) {
      freePackIds.add(row.pack_id)
    } else {
      paidPackShopItems.set(row.pack_id, row.shop_item_id)
    }
  }

  // 유저가 구매한 유료 팩 확인
  const ownedPackIds = new Set<string>()
  if (user && paidPackShopItems.size > 0) {
    const shopIds = Array.from(paidPackShopItems.values())
    const { data: userItems } = await supabase
      .from('user_items')
      .select('item_id')
      .eq('user_id', user.id)
      .in('item_id', shopIds)

    const ownedItemIds = new Set((userItems || []).map(ui => ui.item_id))
    paidPackShopItems.forEach((shopItemId, packId) => {
      if (ownedItemIds.has(shopItemId)) ownedPackIds.add(packId)
    })
  }

  // 사용 가능한 팩만 필터
  const availablePackIds = new Set([...freePackIds, ...ownedPackIds])

  // pack_id별 그룹핑
  const packagesMap = new Map<string, PickerPackage>()
  for (const row of data || []) {
    if (!availablePackIds.has(row.pack_id)) continue
    const existing = packagesMap.get(row.pack_id)
    const emoticon: EmoticonFromDB = row as EmoticonFromDB
    if (existing) {
      existing.emoticons.push(emoticon)
    } else {
      packagesMap.set(row.pack_id, {
        pack_id: row.pack_id,
        pack_name: row.pack_name,
        pack_thumbnail: row.pack_thumbnail,
        emoticons: [emoticon],
      })
    }
  }

  // 유저 순서 적용
  let packOrder: string[] = []
  if (user) {
    const { data: settings } = await supabase
      .from('user_emoticon_settings')
      .select('pack_order')
      .eq('user_id', user.id)
      .maybeSingle()
    if (settings?.pack_order && Array.isArray(settings.pack_order)) {
      packOrder = settings.pack_order as string[]
    }
  }

  const packages = Array.from(packagesMap.values())

  if (packOrder.length > 0) {
    packages.sort((a, b) => {
      const idxA = packOrder.indexOf(a.pack_id)
      const idxB = packOrder.indexOf(b.pack_id)
      // 순서에 없는 팩은 뒤로
      const orderA = idxA === -1 ? 9999 : idxA
      const orderB = idxB === -1 ? 9999 : idxB
      return orderA - orderB
    })
  }

  return packages
}

// ── 이모티콘 맵 (댓글 렌더링용) ──

/**
 * 모든 활성 이모티콘의 code→url 맵 반환 (댓글 렌더링용)
 * 무료 팩 + 유료 팩 모두 포함 (구매 여부 무관, 렌더링은 누구나 봐야 함)
 */
export async function getAllEmoticonCodes(): Promise<{ code: string; url: string; name: string }[]> {
  const supabase = await getSupabaseServer()

  try {
    const data = await fetchAll((from, to) =>
      supabase
        .from('emoticon_packs')
        .select('code, url, name')
        .eq('is_active', true)
        .order('code', { ascending: true })
        .range(from, to)
    )
    return data as { code: string; url: string; name: string }[]
  } catch {
    return []
  }
}

// ── 팩 순서 설정 ──

/**
 * 유저 팩 순서 조회
 */
export async function getUserPackOrder(): Promise<string[]> {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('user_emoticon_settings')
    .select('pack_order')
    .eq('user_id', user.id)
    .maybeSingle()

  if (data?.pack_order && Array.isArray(data.pack_order)) {
    return data.pack_order as string[]
  }
  return []
}

/**
 * 유저 팩 순서 저장
 */
export async function saveEmoticonPackOrder(packOrder: string[]): Promise<void> {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다')

  const { error } = await supabase
    .from('user_emoticon_settings')
    .upsert(
      { user_id: user.id, pack_order: packOrder, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

  if (error) throw new Error('순서 저장 실패')
}
