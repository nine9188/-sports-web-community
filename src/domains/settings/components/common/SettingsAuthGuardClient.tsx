'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/shared/context/AuthContext'

/**
 * 설정 영역 클라이언트 가드
 * - 사용자 로그아웃/세션 만료 즉시 설정 페이지에서 이탈 처리
 */
export default function SettingsAuthGuardClient() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const redirectedRef = useRef(false)

  useEffect(() => {
    if (redirectedRef.current) return
    if (isLoading) return

    // 비로그인 상태면 즉시 로그인 페이지로 이동
    if (!user) {
      redirectedRef.current = true
      const search = new URLSearchParams({ redirect: pathname || '/settings', message: '로그인이 필요한 페이지입니다' })
      router.replace(`/signin?${search.toString()}`)
    }
  }, [user, isLoading, router, pathname])

  return null
}


