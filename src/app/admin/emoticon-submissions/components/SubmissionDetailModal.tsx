'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { toast } from 'react-toastify'
import { Button } from '@/shared/components/ui'
import Spinner from '@/shared/components/Spinner'
import { useAdminSubmissionDetail } from '@/domains/admin/hooks/useAdminEmoticonSubmissions'
import { STATUS_CONFIG, PRICE_OPTIONS } from '@/domains/shop/types/emoticon-submission'

interface Props {
  id: number
  onClose: () => void
  onApprove: (id: number, finalPrice?: number) => void
  onReject: (id: number, reason: string) => void
  onSuspend: (id: number, reason: string) => void
}

export default function SubmissionDetailModal({ id, onClose, onApprove, onReject, onSuspend }: Props) {
  const { data: detail, isLoading } = useAdminSubmissionDetail(id)
  const [reason, setReason] = useState('')
  const [finalPrice, setFinalPrice] = useState<number | null>(null)

  if (isLoading || !detail) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-[#1D1D1D] rounded-lg p-8">
          <Spinner size="md" />
        </div>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[detail.status]
  const price = finalPrice ?? detail.requested_price

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 w-full max-w-lg max-h-[85vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] sticky top-0">
          <h2 className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">신청 상세</h2>
          <button type="button" onClick={onClose} className="p-1 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded-md transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* 팩 정보 */}
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-md overflow-hidden flex-shrink-0 bg-[#F5F5F5] dark:bg-[#262626] flex items-center justify-center">
              <Image src={detail.thumbnail_path} alt={detail.pack_name} width={56} height={56} className="w-12 h-12 object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-[#F0F0F0]">{detail.pack_name}</p>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${statusConfig.className}`}>
                  {statusConfig.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                신청자: @{detail.profiles?.nickname ?? '알 수 없음'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {detail.emoticon_count}개 · {detail.requested_price === 0 ? '무료' : `${detail.requested_price.toLocaleString()} P`} · {new Date(detail.created_at).toLocaleString('ko-KR')}
              </p>
            </div>
          </div>

          {/* 설명 */}
          <div className="rounded-lg bg-[#F5F5F5] dark:bg-[#262626] px-3 py-2">
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{detail.description}</p>
          </div>

          {/* 태그 */}
          {detail.tags && detail.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {detail.tags.map((tag, i) => (
                <span key={i} className="px-2 py-0.5 text-[10px] rounded-full bg-[#F5F5F5] dark:bg-[#262626] text-gray-600 dark:text-gray-300">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 이모티콘 미리보기 */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">이모티콘 ({detail.emoticon_count}개)</p>
            <div className="grid grid-cols-6 gap-2">
              {(detail.emoticon_paths as string[]).map((url, i) => (
                <div key={i} className="aspect-square rounded-md overflow-hidden bg-[#F5F5F5] dark:bg-[#262626] flex items-center justify-center">
                  <Image src={url} alt={`emoticon ${i + 1}`} width={48} height={48} className="w-10 h-10 object-contain" />
                </div>
              ))}
            </div>
          </div>

          {/* 관리자 액션 */}
          {detail.status === 'pending' && (
            <div className="border-t border-black/5 dark:border-white/10 pt-4 space-y-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">관리자 액션</p>

              {/* 가격 조정 */}
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-300 mb-1 block">가격 조정</label>
                <div className="flex items-center gap-1 flex-wrap">
                  {PRICE_OPTIONS.map(opt => (
                    <Button key={opt.value} type="button" variant="ghost"
                      onClick={() => setFinalPrice(opt.value)}
                      className={`px-2 py-1 h-auto text-xs ${price === opt.value ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''}`}>
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 거절 사유 */}
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-300 mb-1 block">거절/중지 사유</label>
                <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="사유 입력"
                  className="w-full px-3 py-2 text-sm border border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] rounded-lg outline-none" />
              </div>

              {/* 버튼 */}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => { if (reason) onReject(id, reason); else toast.warning('거절 사유를 입력하세요.') }}
                  className="text-red-500 dark:text-red-400 h-9 px-4 text-sm">
                  거절
                </Button>
                <Button type="button" variant="primary" onClick={() => onApprove(id, price)}
                  className="h-9 px-4 text-sm">
                  승인
                </Button>
              </div>
            </div>
          )}

          {detail.status === 'approved' && (
            <div className="border-t border-black/5 dark:border-white/10 pt-4 space-y-3">
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-300 mb-1 block">판매중지 사유</label>
                <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="사유 입력"
                  className="w-full px-3 py-2 text-sm border border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] rounded-lg outline-none" />
              </div>
              <div className="flex justify-end">
                <Button type="button" variant="ghost" onClick={() => { if (reason) onSuspend(id, reason); else toast.warning('중지 사유를 입력하세요.') }}
                  className="text-gray-500 dark:text-gray-400 h-9 px-4 text-sm">
                  판매중지
                </Button>
              </div>
            </div>
          )}

          {/* 거절/중지 사유 표시 */}
          {detail.status === 'rejected' && detail.reject_reason && (
            <div className="border-t border-black/5 dark:border-white/10 pt-3">
              <p className="text-xs text-red-500 dark:text-red-400">거절 사유: {detail.reject_reason}</p>
            </div>
          )}
          {detail.status === 'suspended' && detail.suspend_reason && (
            <div className="border-t border-black/5 dark:border-white/10 pt-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">중지 사유: {detail.suspend_reason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
