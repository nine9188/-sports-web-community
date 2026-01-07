'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/shared/context/AuthContext'
import { getSupabaseBrowser } from '@/shared/lib/supabase'
import { toast } from 'react-toastify'

export default function SocialSignupPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [nickname, setNickname] = useState('')
  const [nicknameError, setNicknameError] = useState('')
  const [isCheckingNickname, setIsCheckingNickname] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    const checkAuthAndProfile = async () => {
      // AuthContext 로딩 중이면 대기
      if (isLoading) {
        return
      }

      // 사용자가 없으면 강제로 세션 확인
      if (!user) {
        try {
          const supabase = getSupabaseBrowser()
          
          // 강제로 세션 새로고침 시도
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            // 세션이 있으면 AuthContext가 업데이트될 때까지 잠시 대기
            setTimeout(() => checkAuthAndProfile(), 1000)
            return
          }
          
          const { data: { user: currentUser }, error } = await supabase.auth.getUser()
          
          if (error || !currentUser) {
            // 5초 대기 후에도 사용자 정보가 없으면 로그인 페이지로
            setTimeout(() => {
              if (!user) {
                toast.error('로그인이 필요합니다.')
                router.replace('/signin')
              }
            }, 5000) // 5초로 증가
            return
          }
        } catch (error) {
          console.error('세션 확인 오류:', error)
          setTimeout(() => {
            toast.error('로그인이 필요합니다.')
            router.replace('/signin')
          }, 3000)
          return
        }
      }

      // 사용자가 있으면 프로필 확인
      if (user) {
        const supabase = getSupabaseBrowser()
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profile && profile.nickname && profile.nickname.trim() !== '') {
          // 닉네임이 있는 완전한 프로필이면 메인 페이지로
          // 로그인 성공 플래그 설정 (AuthContext가 토스트 표시)
          sessionStorage.setItem('login-success', 'true')
          router.replace('/')
          return
        }
        // 프로필은 있지만 닉네임이 없으면 이 페이지에 머물러서 닉네임 설정
      }
      
      setIsInitializing(false)
    }

    checkAuthAndProfile()
  }, [user, isLoading, router])

  // 닉네임 실시간 검증
  const validateNickname = async (nickname: string) => {
    if (!nickname.trim()) {
      setNicknameError('')
      return
    }

    if (nickname.length < 2) {
      setNicknameError('닉네임은 최소 2자 이상이어야 합니다.')
      return
    }

    if (!/^[a-zA-Z0-9가-힣_]+$/.test(nickname)) {
      setNicknameError('닉네임은 영문, 숫자, 한글, 언더스코어(_)만 사용 가능합니다.')
      return
    }

    setIsCheckingNickname(true)
    try {
      const supabase = getSupabaseBrowser()
      const { data: existingNickname } = await supabase
        .from('profiles')
        .select('id')
        .eq('nickname', nickname)
        .single()

      if (existingNickname) {
        setNicknameError('이미 사용 중인 닉네임입니다.')
      } else {
        setNicknameError('')
      }
    } catch (error) {
      console.error('닉네임 확인 오류:', error)
    } finally {
      setIsCheckingNickname(false)
    }
  }

  // 닉네임 입력 시 디바운스된 검증
  useEffect(() => {
    const timer = setTimeout(() => {
      if (nickname) {
        validateNickname(nickname)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [nickname])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error('로그인 정보를 찾을 수 없습니다.')
      return
    }

    if (!nickname.trim()) {
      toast.error('닉네임을 입력해주세요.')
      return
    }

    if (nicknameError) {
      toast.error('닉네임을 다시 확인해주세요.')
      return
    }

    setLoading(true)

    try {
      const supabase = getSupabaseBrowser()

      // 고유한 username 자동 생성
      const baseUsername = `kakao_${user.id.slice(0, 8)}`
      let username = baseUsername
      let counter = 1

      // 중복되지 않는 username 생성
      while (true) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .single()

        if (!existingUser) break

        username = `${baseUsername}_${counter}`
        counter++

        if (counter > 50) {
          username = `${baseUsername}_${Date.now()}`
          break
        }
      }

      // 프로필 생성 또는 업데이트 (upsert 사용)
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          username: username,
          nickname: nickname.trim(),
          full_name: user.user_metadata?.name || null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (error) {
        console.error('프로필 생성 오류:', error)
        toast.error('회원가입 중 오류가 발생했습니다.')
        return
      }

      // 로그인 성공 플래그 설정 (AuthContext가 토스트 표시)
      sessionStorage.setItem('login-success', 'true')

      // 새로고침으로 AuthContext 업데이트 보장
      setTimeout(() => {
        window.location.href = '/'
      }, 500)

    } catch (error) {
      console.error('회원가입 오류:', error)
      toast.error('회원가입 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (!user || isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-md w-full">
      {/* 고정 헤더 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-left mb-2">카카오 회원가입</h2>
        <p className="text-gray-600 mb-8 text-left">
          카카오 로그인이 완료되었습니다.<br />
          사용하실 닉네임을 설정해주세요.
        </p>
      </div>

      {/* 콘텐츠 영역 - 최소 높이 설정 */}
      <div className="min-h-[400px]">
        {/* 카카오 사용자 정보 표시 */}
        {user?.user_metadata?.name && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-gray-600">
              <span className="font-medium">카카오 이름:</span> {user.user_metadata.name}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">이메일:</span> {user.email}
            </p>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <label className="block text-gray-700 mb-1 text-sm font-medium">
              닉네임 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                  nicknameError 
                    ? 'border-red-500 focus:ring-red-300' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="사용하실 닉네임을 입력하세요"
                required
                disabled={loading}
              />
              {isCheckingNickname && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            
            {nicknameError ? (
              <p className="mt-1 text-sm text-red-600">{nicknameError}</p>
            ) : (
              <p className="mt-1 text-sm text-gray-500">
                아이디는 자동으로 생성됩니다.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !nickname.trim() || !!nicknameError || isCheckingNickname}
            className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-800 text-white font-medium rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? '처리 중...' : '회원가입 완료'}
          </button>
        </form>
      </div>
    </div>
  )
} 