'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { toast } from 'react-toastify'
import { Button } from '@/shared/components/ui'
import Spinner from '@/shared/components/Spinner'
import {
  useAdminSubmissions,
  useApproveSubmission,
  useRejectSubmission,
  useSuspendSubmission,
} from '@/domains/admin/hooks/useAdminEmoticonSubmissions'
import { STATUS_CONFIG, type SubmissionStatus, type EmoticonSubmissionWithUser } from '@/domains/shop/types/emoticon-submission'
import SubmissionDetailModal from './SubmissionDetailModal'

type FilterTab = 'all' | SubmissionStatus

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '검토대기' },
  { key: 'approved', label: '승인' },
  { key: 'rejected', label: '거절' },
  { key: 'suspended', label: '판매중지' },
]

export default function SubmissionManagement() {
  const [filter, setFilter] = useState<FilterTab>('all')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const { data: submissions, isLoading } = useAdminSubmissions(filter)
  const approveMutation = useApproveSubmission()
  const rejectMutation = useRejectSubmission()
  const suspendMutation = useSuspendSubmission()

  const handleApprove = async (id: number, finalPrice?: number) => {
    const result = await approveMutation.mutateAsync({ id, finalPrice })
    if (result.success) {
      toast.success('승인 완료')
      setSelectedId(null)
    } else {
      toast.error(result.error ?? '승인 실패')
    }
  }

  const handleReject = async (id: number, reason: string) => {
    const result = await rejectMutation.mutateAsync({ id, reason })
    if (result.success) {
      toast.success('거절 완료')
      setSelectedId(null)
    } else {
      toast.error(result.error ?? '거절 실패')
    }
  }

  const handleSuspend = async (id: number, reason: string) => {
    const result = await suspendMutation.mutateAsync({ id, reason })
    if (result.success) {
      toast.success('판매중지 완료')
      setSelectedId(null)
    } else {
      toast.error(result.error ?? '판매중지 실패')
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-gray-900 dark:text-[#F0F0F0]">이모티콘 신청 관리</h1>

      {/* 필터 */}
      <div className="flex items-center gap-1">
        {FILTER_TABS.map(tab => (
          <Button
            key={tab.key}
            type="button"
            variant="ghost"
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 h-auto text-sm ${
              filter === tab.key ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''
            }`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* 목록 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="md" />
        </div>
      ) : !submissions || submissions.length === 0 ? (
        <div className="text-center py-10 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">신청 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {submissions.map((sub: EmoticonSubmissionWithUser) => {
            const statusConfig = STATUS_CONFIG[sub.status]
            return (
              <div
                key={sub.id}
                className="flex items-center gap-3 p-3 border border-black/7 dark:border-white/10 rounded-lg bg-white dark:bg-[#1D1D1D] hover:bg-[#F5F5F5] dark:hover:bg-[#262626] transition-colors"
              >
                {/* 썸네일 */}
                <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-[#F5F5F5] dark:bg-[#262626] flex items-center justify-center">
                  <Image src={sub.thumbnail_path} alt={sub.pack_name} width={48} height={48} className="w-10 h-10 object-contain" />
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0] truncate">{sub.pack_name}</p>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${statusConfig.className}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    @{sub.profiles?.nickname ?? '알 수 없음'} · {sub.emoticon_count}개 · {sub.requested_price === 0 ? '무료' : `${sub.requested_price.toLocaleString()} P`} · {new Date(sub.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>

                {/* 액션 */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button type="button" variant="ghost" onClick={() => setSelectedId(sub.id)}
                    className="text-xs h-auto px-2 py-1">
                    상세
                  </Button>
                  {sub.status === 'pending' && (
                    <>
                      <Button type="button" variant="ghost" onClick={() => handleApprove(sub.id)}
                        className="text-xs text-green-600 dark:text-green-400 h-auto px-2 py-1">
                        승인
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => {
                        const reason = prompt('거절 사유를 입력하세요:')
                        if (reason) handleReject(sub.id, reason)
                      }}
                        className="text-xs text-red-500 dark:text-red-400 h-auto px-2 py-1">
                        거절
                      </Button>
                    </>
                  )}
                  {sub.status === 'approved' && (
                    <Button type="button" variant="ghost" onClick={() => {
                      const reason = prompt('판매중지 사유를 입력하세요:')
                      if (reason) handleSuspend(sub.id, reason)
                    }}
                      className="text-xs text-gray-500 dark:text-gray-400 h-auto px-2 py-1">
                      중지
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 상세 모달 */}
      {selectedId && (
        <SubmissionDetailModal
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onSuspend={handleSuspend}
        />
      )}
    </div>
  )
}
