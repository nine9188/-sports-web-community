'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createShopItem,
  updateShopItem,
  deleteShopItem,
} from '@/shared/actions/admin-actions';
import { shopKeys } from '@/shared/constants/queryKeys';

interface ShopItemInput {
  name: string;
  description?: string;
  image_url: string;
  price: number;
  category_id: number;
}

interface ShopItemUpdate {
  name?: string;
  description?: string;
  image_url?: string;
  price?: number;
  category_id?: number;
}

/**
 * 상점 아이템 생성 mutation
 */
export function useCreateShopItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: ShopItemInput) => {
      const result = await createShopItem(item);

      if (!result.success) {
        throw new Error(result.error || '아이콘 등록에 실패했습니다.');
      }

      return result.item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shopKeys.items() });
    },
  });
}

/**
 * 상점 아이템 수정 mutation
 */
export function useUpdateShopItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, updates }: { itemId: number; updates: ShopItemUpdate }) => {
      const result = await updateShopItem(itemId, updates);

      if (!result.success) {
        throw new Error(result.error || '아이콘 수정에 실패했습니다.');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shopKeys.items() });
    },
  });
}

/**
 * 상점 아이템 삭제 mutation
 */
export function useDeleteShopItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: number) => {
      const result = await deleteShopItem(itemId);

      if (!result.success) {
        throw new Error(result.error || '아이콘 삭제에 실패했습니다.');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shopKeys.items() });
    },
  });
}
