'use server';

import { unstable_cache } from 'next/cache';
import { getSupabaseAdmin } from '@/shared/lib/supabase/server';

/**
 * shop_items 아이콘 URL 맵 (id → image_url)
 * - 338개, 240KB
 * - 7일 캐시
 * - 쇼핑 아이템은 관리자가 등록 후 거의 변경 안 됨
 */
const _getCachedShopItemIconMapImpl = unstable_cache(
  async () => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('shop_items')
      .select('id, image_url');

    if (error) {
      console.error('getCachedShopItemIconMap error:', error);
      return {};
    }

    const map: Record<number, string> = {};
    (data || []).forEach((item: { id: number | null; image_url: string | null }) => {
      if (item.id && item.image_url) {
        map[item.id] = item.image_url;
      }
    });
    return map;
  },
  ['shop-items-icon-map'],
  { revalidate: 604800, tags: ['shop-items'] }
);

export async function getCachedShopItemIconMap() {
  return _getCachedShopItemIconMapImpl();
}

/**
 * 단건 아이콘 URL (캐시된 맵에서 조회)
 */
export async function getCachedShopItemIconUrl(itemId: number | null | undefined): Promise<string | null> {
  if (!itemId) return null;
  const map = await getCachedShopItemIconMap();
  return map[itemId] || null;
}
