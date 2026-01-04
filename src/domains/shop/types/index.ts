export interface ShopCategory {
  id: number
  slug: string
  name: string
  description: string | null
  image_url: string | null
  is_active: boolean | null
  display_order: number | null
  subcategories?: ShopCategory[]
}

// 아이템 등급 타입 (Phase 3)
export type ItemTier = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

// 소모품 타입
export type ConsumableType = 'nickname_change';

// 등급별 라벨
export const TIER_LABELS: Record<ItemTier, string> = {
  common: '일반',
  rare: '희귀',
  epic: '에픽',
  legendary: '레전더리',
  mythic: '미틱',
};

// 등급별 텍스트 색상
export const TIER_TEXT_COLORS: Record<ItemTier, string> = {
  common: 'text-gray-500 dark:text-gray-400',
  rare: 'text-blue-500 dark:text-blue-400',
  epic: 'text-purple-500 dark:text-purple-400',
  legendary: 'text-yellow-600 dark:text-yellow-400',
  mythic: 'text-red-500 dark:text-red-400',
};

// 등급별 배경 색상
export const TIER_BG_COLORS: Record<ItemTier, string> = {
  common: 'bg-gray-100 dark:bg-gray-800',
  rare: 'bg-blue-100 dark:bg-blue-900/30',
  epic: 'bg-purple-100 dark:bg-purple-900/30',
  legendary: 'bg-yellow-100 dark:bg-yellow-900/30',
  mythic: 'bg-red-100 dark:bg-red-900/30',
};

// 등급별 테두리 색상
export const TIER_BORDER_COLORS: Record<ItemTier, string> = {
  common: 'border-gray-300 dark:border-gray-600',
  rare: 'border-blue-400 dark:border-blue-500',
  epic: 'border-purple-400 dark:border-purple-500',
  legendary: 'border-yellow-400 dark:border-yellow-500',
  mythic: 'border-red-400 dark:border-red-500',
};

export interface ShopItem {
  id: number
  category_id: number | null
  name: string
  description: string | null
  image_url: string
  price: number
  tier: ItemTier  // Phase 3: 등급 추가
  is_default: boolean | null
  is_active: boolean | null
  created_at: string | null
  // 소모품 관련 필드
  is_consumable: boolean | null
  consumable_type: ConsumableType | null
  category?: {
    name: string
  } | null
}

// 아이템 사용 기록
export interface ItemUsageLog {
  id: string
  user_id: string
  item_id: number
  user_item_id: string
  used_at: string
  usage_type: ConsumableType
  usage_details: Record<string, unknown>
}

export interface UserItem {
  item_id: number
  user_id: string
}

export interface PurchaseItemParams {
  itemId: number
} 