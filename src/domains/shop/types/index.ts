export interface ShopCategory {
  id: number
  slug: string
  name: string
  description: string | null
  image_url: string | null
  is_active: boolean
  display_order: number
  subcategories?: ShopCategory[]
}

export interface ShopItem {
  id: number
  category_id: number
  name: string
  description: string | null
  image_url: string
  price: number
  is_default: boolean
  is_active: boolean
  category?: {
    name: string
  }
}

export interface UserItem {
  item_id: number
  user_id: string
}

export interface PurchaseItemParams {
  itemId: number
} 