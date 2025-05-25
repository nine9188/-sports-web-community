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

export interface ShopItem {
  id: number
  category_id: number | null
  name: string
  description: string | null
  image_url: string
  price: number
  is_default: boolean | null
  is_active: boolean | null
  created_at: string | null
  category?: {
    name: string
  } | null
}

export interface UserItem {
  item_id: number
  user_id: string
}

export interface PurchaseItemParams {
  itemId: number
} 