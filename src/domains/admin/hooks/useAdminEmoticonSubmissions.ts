'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminKeys } from '@/shared/constants/queryKeys'
import {
  getSubmissions,
  getSubmissionDetail,
  approveSubmission,
  rejectSubmission,
  suspendSubmission,
} from '@/domains/admin/actions/emoticon-submissions'
import type { SubmissionStatus } from '@/domains/shop/types/emoticon-submission'

export function useAdminSubmissions(filter: 'all' | SubmissionStatus = 'all') {
  return useQuery({
    queryKey: adminKeys.emoticonSubmissionList(filter),
    queryFn: () => getSubmissions(filter),
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
  })
}

export function useAdminSubmissionDetail(id: number | null) {
  return useQuery({
    queryKey: adminKeys.emoticonSubmissionDetail(id ?? 0),
    queryFn: () => getSubmissionDetail(id!),
    enabled: id !== null,
    staleTime: 1000 * 30,
  })
}

export function useApproveSubmission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, finalPrice }: { id: number; finalPrice?: number }) =>
      approveSubmission(id, finalPrice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.emoticonSubmissions() })
    },
  })
}

export function useRejectSubmission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      rejectSubmission(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.emoticonSubmissions() })
    },
  })
}

export function useSuspendSubmission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      suspendSubmission(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.emoticonSubmissions() })
    },
  })
}
