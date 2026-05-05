'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/shared/context/AuthContext'
import { recordDailyLogin } from '@/shared/actions/attendance-actions'

function getTodayKST(): string {
  const now = new Date()
  const kstOffset = 9 * 60 * 60 * 1000
  const kstDate = new Date(now.getTime() + kstOffset)
  return kstDate.toISOString().split('T')[0]
}

export default function AttendanceChecker() {
  const { user, isLoading } = useAuth()
  const lastCheckDateRef = useRef<string | null>(null)
  const isCheckingRef = useRef(false)

  useEffect(() => {
    if (isLoading || !user) return

    const checkAttendance = async () => {
      if (isCheckingRef.current) return

      const today = getTodayKST()
      const checkedKey = `attendance_checked_${today}`

      if (lastCheckDateRef.current === today) return
      if (sessionStorage.getItem(checkedKey) === '1') {
        lastCheckDateRef.current = today
        return
      }

      isCheckingRef.current = true

      try {
        const result = await recordDailyLogin(user.id)

        if (result.success) {
          lastCheckDateRef.current = today
          sessionStorage.setItem(checkedKey, '1')

          if (result.isFirstLoginToday) {
          }
        }
      } catch (error) {
        console.error('[AttendanceChecker] attendance check error:', error)
      } finally {
        isCheckingRef.current = false
      }
    }

    checkAttendance()

    const intervalId = setInterval(() => {
      const today = getTodayKST()
      if (lastCheckDateRef.current !== today) {
        checkAttendance()
      }
    }, 60 * 1000)

    return () => {
      clearInterval(intervalId)
    }
  }, [user, isLoading])

  return null
}
