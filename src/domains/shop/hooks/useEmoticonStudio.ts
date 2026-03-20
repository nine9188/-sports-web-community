'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { emoticonStudioKeys } from '@/shared/constants/queryKeys'
import { CACHE_STRATEGIES } from '@/shared/constants/cacheConfig'
import {
  getMySubmissions,
  getMySuspendedSubmissions,
  submitEmoticonPack,
  cancelSubmission,
  checkPackNameDuplicate,
} from '@/domains/shop/actions/emoticon-submissions'
import type { SubmitEmoticonFormData } from '@/domains/shop/types/emoticon-submission'

/**
 * 내 신청 목록
 */
export function useMySubmissions() {
  return useQuery({
    queryKey: emoticonStudioKeys.submissions(),
    queryFn: () => getMySubmissions(),
    ...CACHE_STRATEGIES.FREQUENTLY_UPDATED,
  })
}

/**
 * 내 판매중지 내역
 */
export function useMySuspendedSubmissions() {
  return useQuery({
    queryKey: emoticonStudioKeys.suspended(),
    queryFn: () => getMySuspendedSubmissions(),
    ...CACHE_STRATEGIES.OCCASIONALLY_UPDATED,
  })
}

/**
 * 팩 이름 중복 체크 (2자 이상일 때만)
 */
export function useCheckPackName(name: string) {
  return useQuery({
    queryKey: emoticonStudioKeys.packNameCheck(name),
    queryFn: () => checkPackNameDuplicate(name),
    enabled: name.trim().length >= 2,
    staleTime: 1000 * 10,
    gcTime: 1000 * 60,
  })
}

/**
 * 신청 제출 mutation
 */
export function useSubmitPack() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formData: SubmitEmoticonFormData) => submitEmoticonPack(formData),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: emoticonStudioKeys.submissions() })
      }
    },
  })
}

/**
 * 신청 취소 mutation
 */
export function useCancelSubmission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => cancelSubmission(id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: emoticonStudioKeys.submissions() })
      }
    },
  })
}
