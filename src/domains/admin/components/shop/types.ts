import { ShopCategory as BaseShopCategory } from '@/domains/shop/types';

export interface StorageImage {
  name: string;
  url: string;
}

// 글로벌 타입을 확장하여 필요한 필드 추가
export interface ShopCategory extends BaseShopCategory {
  parent_id: number | null;
  children?: ShopCategory[];
  price?: number;
}

export interface ShopItem {
  id: number;
  name: string;
  description: string | null;
  image_url: string;
  price: number;
  is_default: boolean | null;
  is_active: boolean | null;
  created_at: string | null;
  category_id: number | null;
}

export interface ShopItemManagementProps {
  storageImages: StorageImage[];
  shopItems: ShopItem[];
  categories: ShopCategory[];
}
