'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, X, Clock, ExternalLink } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext'
import { getSupabaseBrowser } from '@/shared/lib/supabase'

interface SuspensionInfo {
  is_suspended: boolean
  suspended_until: string | null
  suspended_reason: string | null
}

/**
 * 로그인 시 계정 정지 상태를 팝업으로 표시하는 컴포넌트
 */
export default function SuspensionPopup() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [suspensionInfo, setSuspensionInfo] = useState<SuspensionInfo | null>(null)
  const [hasChecked, setHasChecked] = useState(false)

  // 정지 상태 확인
  const checkSuspension = useCallback(async () => {
    if (!user || hasChecked) return

    try {
      const supabase = getSupabaseBrowser()
      if (!supabase) return

      const { data, error } = await supabase
        .from('profiles')
        .select('is_suspended, suspended_until, suspended_reason')
        .eq('id', user.id)
        .single()

      if (error || !data) return

      const profile = data as SuspensionInfo

      // 정지된 경우에만 팝업 표시
      if (profile.is_suspended) {
        // 세션 스토리지에서 이미 본 팝업인지 확인
        const shownKey = `suspension_popup_shown_${user.id}`
        const alreadyShown = sessionStorage.getItem(shownKey)

        if (!alreadyShown) {
          setSuspensionInfo(profile)
          setIsOpen(true)
          sessionStorage.setItem(shownKey, 'true')
        }
      }

      setHasChecked(true)
    } catch (error) {
      console.error('정지 상태 확인 오류:', error)
    }
  }, [user, hasChecked])

  useEffect(() => {
    if (!isLoading && user) {
      checkSuspension()
    }
  }, [isLoading, user, checkSuspension])

  // 팝업 닫기
  const handleClose = () => {
    setIsOpen(false)
  }

  // 프로필로 이동
  const handleGoToProfile = () => {
    setIsOpen(false)
    router.push('/settings/profile')
  }

  if (!isOpen || !suspensionInfo) return null

  const until = suspensionInfo.suspended_until ? new Date(suspensionInfo.suspended_until) : null
  const reason = suspensionInfo.suspended_reason || '정책 위반'

  // 남은 일수 계산
  let daysLeft: number | null = null
  if (until) {
    const now = new Date()
    const diffTime = until.getTime() - now.getTime()
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    daysLeft = Math.max(0, daysLeft)
  }

  const formattedDate = until?.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Seoul'
  })

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* 팝업 컨텐츠 */}
      <div className="relative bg-white dark:bg-[#1D1D1D] rounded-xl shadow-2xl max-w-md w-full mx-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* 헤더 - 빨간색 배경 */}
        <div className="bg-red-500 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6" />
              <h2 className="text-lg font-bold">계정 정지 안내</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 내용 */}
        <div className="p-6 space-y-4">
          {/* 정지 기간 */}
          {daysLeft !== null && (
            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <Clock className="h-5 w-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-700 dark:text-red-300">
                  남은 정지 기간: <strong>{daysLeft}일</strong>
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  해제일: {formattedDate}
                </p>
              </div>
            </div>
          )}

          {/* 정지 사유 */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">정지 사유</p>
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-800 dark:text-gray-200">{reason}</p>
            </div>
          </div>

          {/* 제한사항 */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">정지 중 제한사항</p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 pl-4">
              <li className="list-disc">게시글 작성 및 수정 불가</li>
              <li className="list-disc">댓글 작성 불가</li>
              <li className="list-disc">좋아요/싫어요 불가</li>
              <li className="list-disc">상점 이용 불가</li>
            </ul>
          </div>

          {/* 안내 메시지 */}
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            자세한 내용은 프로필 설정에서 확인할 수 있습니다.
          </p>
        </div>

        {/* 버튼 영역 */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            닫기
          </button>
          <button
            onClick={handleGoToProfile}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>프로필 확인</span>
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
