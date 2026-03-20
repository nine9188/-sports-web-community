'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { emoticonKeys } from '@/shared/constants/queryKeys'
import { CACHE_STRATEGIES } from '@/shared/constants/cacheConfig'
import {
  getEmoticonShopData,
  getPickerData,
  getPackDetail,
} from '@/domains/boards/actions/emoticons'

/**
 * 상점 뷰 데이터 (팩 목록 + 보유 + 포인트)
 */
export function useEmoticonShopData() {
  return useQuery({
    queryKey: emoticonKeys.shopData(),
    queryFn: () => getEmoticonShopData(),
    ...CACHE_STRATEGIES.OCCASIONALLY_UPDATED,
  })
}

/**
 * 피커 데이터 (유저가 사용 가능한 팩 + 이모티콘, 순서 반영)
 */
export function usePickerData() {
  return useQuery({
    queryKey: emoticonKeys.pickerData(),
    queryFn: () => getPickerData(),
    ...CACHE_STRATEGIES.OCCASIONALLY_UPDATED,
  })
}

/**
 * 팩 상세 (이모티콘 목록 + 보유/가격)
 */
export function usePackDetail(packId: string | null) {
  return useQuery({
    queryKey: emoticonKeys.packDetail(packId ?? ''),
    queryFn: () => getPackDetail(packId!),
    enabled: !!packId,
    ...CACHE_STRATEGIES.OCCASIONALLY_UPDATED,
  })
}

/**
 * 구매 후 관련 캐시 무효화
 */
export function useEmoticonInvalidation() {
  const queryClient = useQueryClient()

  return {
    /** 구매 완료 시 호출 — 상점/피커/상세 캐시 모두 무효화 */
    invalidateAfterPurchase: (packId?: string) => {
      queryClient.invalidateQueries({ queryKey: emoticonKeys.shopData() })
      queryClient.invalidateQueries({ queryKey: emoticonKeys.pickerData() })
      if (packId) {
        queryClient.invalidateQueries({ queryKey: emoticonKeys.packDetail(packId) })
      }
    },
    /** 순서 저장 후 호출 */
    invalidateAfterOrderChange: () => {
      queryClient.invalidateQueries({ queryKey: emoticonKeys.pickerData() })
    },
  }
}
