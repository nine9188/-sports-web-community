'use client'

import { AlertTriangle, Clock, Ban } from 'lucide-react'
import { formatSuspensionInfo } from '@/shared/utils/suspension-format'

interface SuspensionNoticeProps {
  suspensionInfo: {
    until: string | null
    reason: string | null
  }
  className?: string
}

/**
 * 계정 정지 상태를 표시하는 컴포넌트
 */
export default function SuspensionNotice({ suspensionInfo, className = '' }: SuspensionNoticeProps) {
  const message = formatSuspensionInfo(suspensionInfo)
  
  // 메시지가 없으면 렌더링하지 않음 (정지 해제됨)
  if (!message) return null
  
  const reason = suspensionInfo?.reason || '정책 위반'
  const until = suspensionInfo?.until ? new Date(suspensionInfo.until) : null
  
  // 남은 일수 계산
  let daysLeft: number | null = null
  if (until) {
    const now = new Date()
    const diffTime = until.getTime() - now.getTime()
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    daysLeft = Math.max(0, daysLeft)
  }

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {daysLeft === null ? (
            <Ban className="h-6 w-6 text-red-600" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-red-600" />
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            계정 정지 안내
          </h3>
          
          <div className="space-y-2">
            <p className="text-red-700 font-medium">
              {message}
            </p>
            
            <div className="bg-red-100 rounded-md p-3">
              <p className="text-sm text-red-800">
                <span className="font-medium">정지 사유:</span> {reason}
              </p>
            </div>
            
            {daysLeft !== null && daysLeft > 0 && (
              <div className="flex items-center gap-2 text-sm text-red-700">
                <Clock className="h-4 w-4" />
                <span>남은 기간: <strong>{daysLeft}일</strong></span>
              </div>
            )}
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>정지 중 제한사항:</strong>
              </p>
              <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                <li>• 게시글 작성 및 수정 불가</li>
                <li>• 댓글 작성 불가</li>
                <li>• 좋아요/싫어요 불가</li>
                <li>• 상점 이용 불가</li>
                <li>• 기타 커뮤니티 활동 제한</li>
              </ul>
            </div>
            
            {daysLeft !== null && (
              <p className="text-xs text-red-600 mt-3">
                정지 해제 후 정상적인 서비스 이용이 가능합니다.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 