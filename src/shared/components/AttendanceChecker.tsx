'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/shared/context/AuthContext'
import { recordDailyLogin } from '@/shared/actions/attendance-actions'

/**
 * 한국 시간(KST) 기준 오늘 날짜 반환 (YYYY-MM-DD)
 */
function getTodayKST(): string {
  const now = new Date()
  // UTC+9 (한국 시간)
  const kstOffset = 9 * 60 * 60 * 1000
  const kstDate = new Date(now.getTime() + kstOffset)
  return kstDate.toISOString().split('T')[0]
}

/**
 * 로그인 상태에서 자동으로 출석 체크를 수행하는 컴포넌트
 * - 페이지 로드 시 오늘 출석 안 되어 있으면 자동 출석
 * - 자정(12시)이 지나면 새로운 날 출석 체크 (한국 시간 기준)
 */
export default function AttendanceChecker() {
  const { user, isLoading } = useAuth()
  const lastCheckDateRef = useRef<string | null>(null)
  const isCheckingRef = useRef(false)

  useEffect(() => {
    if (isLoading || !user) return

    const checkAttendance = async () => {
      // 이미 체크 중이면 스킵
      if (isCheckingRef.current) return

      const today = getTodayKST() // 한국 시간 기준

      // 오늘 이미 체크했으면 스킵
      if (lastCheckDateRef.current === today) return

      isCheckingRef.current = true

      try {
        const result = await recordDailyLogin(user.id)

        if (result.success) {
          lastCheckDateRef.current = today

          // 첫 로그인이면 콘솔에 로그 (디버깅용)
          if (result.isFirstLoginToday) {
            console.log('[AttendanceChecker] 오늘 첫 출석 완료:', {
              consecutiveDays: result.consecutiveDays,
              bonusAwarded: result.bonusAwarded
            })
          }
        }
      } catch (error) {
        console.error('[AttendanceChecker] 출석 체크 오류:', error)
      } finally {
        isCheckingRef.current = false
      }
    }

    // 초기 체크
    checkAttendance()

    // 1분마다 날짜 변경 확인 (자정 대응 - 한국 시간 기준)
    const intervalId = setInterval(() => {
      const today = getTodayKST()
      if (lastCheckDateRef.current !== today) {
        checkAttendance()
      }
    }, 60 * 1000) // 1분

    return () => {
      clearInterval(intervalId)
    }
  }, [user, isLoading])

  return null
}
