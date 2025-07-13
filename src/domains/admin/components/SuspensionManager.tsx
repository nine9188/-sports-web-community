'use client'

import { useState } from 'react'
import { Ban, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import { suspendUser, unsuspendUser, type SuspensionData } from '../actions/suspension'
import { formatDate } from '@/shared/utils/date'

interface SuspensionManagerProps {
  userId: string
  userNickname: string
  currentSuspension?: {
    is_suspended: boolean
    suspended_until: string | null
    suspended_reason: string | null
  }
  onUpdate?: () => void
}

/**
 * 계정 정지 관리 컴포넌트
 */
export default function SuspensionManager({ 
  userId, 
  userNickname, 
  currentSuspension,
  onUpdate 
}: SuspensionManagerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showSuspendForm, setShowSuspendForm] = useState(false)
  const [suspensionData, setSuspensionData] = useState<Omit<SuspensionData, 'userId'>>({
    reason: '',
    days: 7
  })

  const handleSuspend = async () => {
    if (!suspensionData.reason.trim()) {
      alert('정지 사유를 입력해주세요.')
      return
    }

    setIsLoading(true)
    try {
      const result = await suspendUser({
        userId,
        reason: suspensionData.reason,
        days: suspensionData.days
      })

      if (result.success) {
        alert(result.message)
        setShowSuspendForm(false)
        setSuspensionData({ reason: '', days: 7 })
        onUpdate?.()
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.error('정지 처리 오류:', error)
      alert('정지 처리 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnsuspend = async () => {
    if (!confirm('정말로 이 사용자의 정지를 해제하시겠습니까?')) {
      return
    }

    setIsLoading(true)
    try {
      const result = await unsuspendUser(userId)

      if (result.success) {
        alert(result.message)
        onUpdate?.()
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.error('정지 해제 오류:', error)
      alert('정지 해제 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }



  const getDaysLeft = (until: string) => {
    const now = new Date()
    const endDate = new Date(until)
    const diffTime = endDate.getTime() - now.getTime()
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, daysLeft)
  }

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Ban className="h-5 w-5" />
          계정 정지 관리
        </h3>
        
        {currentSuspension?.is_suspended ? (
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">정지 중</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">정상</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-md p-3">
          <p className="text-sm text-gray-600">
            <strong>대상 사용자:</strong> {userNickname}
          </p>
        </div>

        {currentSuspension?.is_suspended ? (
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="space-y-2">
                <p className="text-sm">
                  <strong className="text-red-800">정지 사유:</strong>
                  <span className="text-red-700 ml-1">{currentSuspension.suspended_reason}</span>
                </p>
                
                {currentSuspension.suspended_until && (
                  <>
                    <p className="text-sm">
                      <strong className="text-red-800">정지 해제일:</strong>
                      <span className="text-red-700 ml-1">
                        {formatDate(currentSuspension.suspended_until) || '-'}
                      </span>
                    </p>
                    
                    <div className="flex items-center gap-2 text-sm text-red-700">
                      <Clock className="h-4 w-4" />
                      <span>
                        남은 기간: <strong>{getDaysLeft(currentSuspension.suspended_until)}일</strong>
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={handleUnsuspend}
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '처리 중...' : '정지 해제'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {!showSuspendForm ? (
              <button
                onClick={() => setShowSuspendForm(true)}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
              >
                계정 정지
              </button>
            ) : (
              <div className="space-y-3 border border-red-200 rounded-md p-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    정지 기간 (일)
                  </label>
                  <select
                    value={suspensionData.days}
                    onChange={(e) => setSuspensionData(prev => ({ ...prev, days: Number(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value={1}>1일</option>
                    <option value={3}>3일</option>
                    <option value={7}>7일</option>
                    <option value={14}>14일</option>
                    <option value={30}>30일</option>
                    <option value={365}>1년</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    정지 사유 *
                  </label>
                  <textarea
                    value={suspensionData.reason}
                    onChange={(e) => setSuspensionData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="정지 사유를 입력해주세요..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSuspend}
                    disabled={isLoading || !suspensionData.reason.trim()}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isLoading ? '처리 중...' : '정지 실행'}
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowSuspendForm(false)
                      setSuspensionData({ reason: '', days: 7 })
                    }}
                    disabled={isLoading}
                    className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 