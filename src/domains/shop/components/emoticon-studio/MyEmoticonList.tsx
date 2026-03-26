'use client'

import React from 'react'
import Image from 'next/image'
import { toast } from 'react-toastify'
import { Container, ContainerContent, Button } from '@/shared/components/ui'
import Spinner from '@/shared/components/Spinner'
import { useMySubmissions, useCancelSubmission } from '@/domains/shop/hooks/useEmoticonStudio'
import { STATUS_CONFIG } from '@/domains/shop/types/emoticon-submission'

export default function MyEmoticonList() {
  const { data: submissions, isLoading } = useMySubmissions()
  const cancelMutation = useCancelSubmission()

  const handleCancel = async (id: number) => {
    if (!confirm('신청을 취소하시겠습니까?')) return
    const result = await cancelMutation.mutateAsync(id)
    if (result.success) {
      toast.success('신청이 취소되었습니다.')
    } else {
      toast.error(result.error ?? '취소에 실패했습니다.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="md" />
      </div>
    )
  }

  if (!submissions || submissions.length === 0) {
    return (
      <Container className="bg-white dark:bg-[#1D1D1D]">
        <ContainerContent className="px-4 py-10">
          <p className="text-[13px] text-gray-500 dark:text-gray-400 text-center">신청 내역이 없습니다.</p>
        </ContainerContent>
      </Container>
    )
  }

  return (
    <div className="space-y-2">
      {submissions.map(sub => {
        const statusConfig = STATUS_CONFIG[sub.status]
        return (
          <Container key={sub.id} className="bg-white dark:bg-[#1D1D1D]">
            <ContainerContent className="px-4 py-3">
              <div className="flex items-center gap-3">
                {/* 썸네일 */}
                <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-[#F5F5F5] dark:bg-[#262626] flex items-center justify-center">
                  <Image src={sub.thumbnail_path} alt={sub.pack_name} width={48} height={48} className="w-10 h-10 object-contain" />
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0] truncate">{sub.pack_name}</p>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${statusConfig.className}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {sub.emoticon_count}개 · {sub.requested_price === 0 ? '무료' : `${sub.requested_price.toLocaleString()} P`} · {new Date(sub.created_at).toLocaleDateString('ko-KR')}
                  </p>
                  {sub.status === 'rejected' && sub.reject_reason && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">사유: {sub.reject_reason}</p>
                  )}
                </div>

                {/* 액션 */}
                {sub.status === 'pending' && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleCancel(sub.id)}
                    disabled={cancelMutation.isPending}
                    className="text-xs text-red-500 dark:text-red-400 h-auto px-2 py-1 flex-shrink-0"
                  >
                    취소
                  </Button>
                )}
              </div>
            </ContainerContent>
          </Container>
        )
      })}
    </div>
  )
}
