'use client'

import React from 'react'
import Image from 'next/image'
import { Container, ContainerContent } from '@/shared/components/ui'
import Spinner from '@/shared/components/Spinner'
import { useMySuspendedSubmissions } from '@/domains/shop/hooks/useEmoticonStudio'

export default function SuspendedList() {
  const { data: submissions, isLoading } = useMySuspendedSubmissions()

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
          <p className="text-[13px] text-gray-500 dark:text-gray-400 text-center">신고·중지 내역이 없습니다.</p>
        </ContainerContent>
      </Container>
    )
  }

  return (
    <div className="space-y-2">
      {submissions.map(sub => (
        <Container key={sub.id} className="bg-white dark:bg-[#1D1D1D]">
          <ContainerContent className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-[#F5F5F5] dark:bg-[#262626] flex items-center justify-center">
                <Image src={sub.thumbnail_path} alt={sub.pack_name} width={48} height={48} className="w-10 h-10 object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0] truncate">{sub.pack_name}</p>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/50">
                    판매중지
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {sub.reviewed_at ? new Date(sub.reviewed_at).toLocaleDateString('ko-KR') : '-'}
                </p>
                {sub.suspend_reason && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">사유: {sub.suspend_reason}</p>
                )}
              </div>
            </div>
          </ContainerContent>
        </Container>
      ))}
    </div>
  )
}
