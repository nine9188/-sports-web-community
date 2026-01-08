'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import { signInWithKakao } from '@/domains/auth/actions'
import Spinner from '@/shared/components/Spinner';

interface KakaoLoginButtonProps {
  className?: string
  disabled?: boolean
  onLoading?: (loading: boolean) => void
}

export default function KakaoLoginButton({ 
  className = '', 
  disabled = false,
  onLoading 
}: KakaoLoginButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleKakaoLogin = async () => {
    if (loading || disabled) return

    try {
      setLoading(true)
      onLoading?.(true)

      // 프로덕션 환경 redirectTo URL 생성
      const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`

      const result = await signInWithKakao(redirectTo)

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.url) {
        // 카카오 OAuth 페이지로 리디렉션
        window.location.href = result.url
      }
    } catch (error) {
      console.error('카카오 로그인 오류:', error)
      toast.error('카카오 로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
      onLoading?.(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleKakaoLogin}
      disabled={loading || disabled}
      className={`
        w-full flex items-center justify-center px-4 py-3
        bg-[#FEE500] hover:bg-[#FFEB00]
        border border-[#FEE500] hover:border-[#FFEB00]
        rounded-md md:rounded-md max-md:rounded-lg font-medium text-[#000000]
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${loading || disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {loading ? (
        <div className="flex items-center">
          <Spinner size="sm" className="mr-3" />
          로그인 중...
        </div>
      ) : (
        <div className="flex items-center">
          {/* 카카오 로고 SVG */}
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            className="mr-3"
            fill="currentColor"
          >
            <path d="M12 3C6.486 3 2 6.262 2 10.5c0 2.665 1.678 5.012 4.233 6.414l-1.017 3.742c-.08.295.195.578.49.506l4.146-1.024C10.557 20.464 11.269 20.5 12 20.5c5.514 0 10-3.262 10-7.5S17.514 3 12 3z"/>
          </svg>
          카카오 로그인
        </div>
      )}
    </button>
  )
} 