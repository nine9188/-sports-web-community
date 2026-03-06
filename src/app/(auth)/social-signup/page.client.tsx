'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/shared/context/AuthContext'
import { getSupabaseBrowser } from '@/shared/lib/supabase'
import { toast } from 'react-toastify'
import { AlertCircle, Check, ChevronLeft } from 'lucide-react'
import Spinner from '@/shared/components/Spinner'
import { Button } from '@/shared/components/ui'
import Calendar from '@/shared/components/Calendar'
import BrandingPanel from '../components/BrandingPanel'

export default function SocialSignupPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  // 단계 상태
  const [showNicknameStep, setShowNicknameStep] = useState(false)

  // 입력값
  const [nickname, setNickname] = useState('')
  const [birthDate, setBirthDate] = useState('')

  // 유효성 검사
  const [nicknameError, setNicknameError] = useState('')
  const [nicknameValid, setNicknameValid] = useState(false)
  const [isCheckingNickname, setIsCheckingNickname] = useState(false)
  const [birthError, setBirthError] = useState('')
  const [birthValid, setBirthValid] = useState(false)

  // 프로바이더 이름
  const providerName = user?.app_metadata?.provider === 'naver' ? '네이버'
    : user?.app_metadata?.provider === 'kakao' ? '카카오'
    : user?.app_metadata?.provider === 'google' ? '구글'
    : user?.app_metadata?.provider === 'discord' ? '디스코드'
    : '소셜'

  useEffect(() => {
    const checkAuthAndProfile = async () => {
      if (isLoading) return

      if (!user) {
        try {
          const supabase = getSupabaseBrowser()
          const { data: { user: currentUser }, error } = await supabase.auth.getUser()

          if (!error && currentUser) {
            setTimeout(() => checkAuthAndProfile(), 1000)
            return
          }

          if (error || !currentUser) {
            setTimeout(() => {
              if (!user) {
                toast.error('로그인이 필요합니다.')
                router.replace('/signin')
              }
            }, 5000)
            return
          }
        } catch {
          setTimeout(() => {
            toast.error('로그인이 필요합니다.')
            router.replace('/signin')
          }, 3000)
          return
        }
      }

      if (user) {
        const supabase = getSupabaseBrowser()
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profile && profile.nickname && profile.nickname.trim() !== '') {
          sessionStorage.setItem('login-success', 'true')
          router.replace('/')
          return
        }
      }

      setIsInitializing(false)
    }

    checkAuthAndProfile()
  }, [user, isLoading, router])

  // 생년월일 검증
  const validateBirth = (value: string) => {
    if (!value) {
      setBirthError('생년월일을 선택해주세요.')
      setBirthValid(false)
      return false
    }
    const date = new Date(value)
    const now = new Date()
    const age = now.getFullYear() - date.getFullYear()
    if (age < 14) {
      setBirthError('만 14세 이상만 가입할 수 있습니다.')
      setBirthValid(false)
      return false
    }
    if (age > 120) {
      setBirthError('올바른 생년월일을 입력해주세요.')
      setBirthValid(false)
      return false
    }
    setBirthError('')
    setBirthValid(true)
    return true
  }

  // 닉네임 검증
  const validateNickname = (value: string) => {
    if (!value.trim()) {
      setNicknameError('닉네임을 입력해주세요.')
      setNicknameValid(false)
      return false
    }
    if (value.length < 2) {
      setNicknameError('닉네임은 최소 2자 이상이어야 합니다.')
      setNicknameValid(false)
      return false
    }
    if (value.length > 12) {
      setNicknameError('닉네임은 최대 12자까지 가능합니다.')
      setNicknameValid(false)
      return false
    }
    if (!/^[a-zA-Z0-9가-힣_]+$/.test(value)) {
      setNicknameError('영문, 숫자, 한글, 언더스코어(_)만 사용 가능합니다.')
      setNicknameValid(false)
      return false
    }
    return true
  }

  // 닉네임 중복 검사 (디바운스)
  useEffect(() => {
    if (!nickname || !validateNickname(nickname)) return

    const timer = setTimeout(async () => {
      setIsCheckingNickname(true)
      try {
        const supabase = getSupabaseBrowser()
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('nickname', nickname)
          .single()

        if (existing) {
          setNicknameError('이미 사용 중인 닉네임입니다.')
          setNicknameValid(false)
        } else {
          setNicknameError('')
          setNicknameValid(true)
        }
      } catch {
        // not found = 사용 가능
        setNicknameError('')
        setNicknameValid(true)
      } finally {
        setIsCheckingNickname(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [nickname])

  // 생년월일 → 닉네임 단계로 진행
  const handleBirthNext = () => {
    if (validateBirth(birthDate)) {
      setShowNicknameStep(true)
    }
  }

  // 이전 단계
  const handleBack = () => {
    if (showNicknameStep) {
      setShowNicknameStep(false)
    }
  }

  // 현재 단계 계산
  const currentStep = !showNicknameStep ? 1 : 2
  const totalSteps = 2

  // 회원가입 완료
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error('로그인 정보를 찾을 수 없습니다.')
      return
    }

    if (!nicknameValid || nicknameError) {
      toast.error('닉네임을 다시 확인해주세요.')
      return
    }

    setLoading(true)

    try {
      const supabase = getSupabaseBrowser()

      // 고유한 username 자동 생성
      const provider = user.app_metadata?.provider || 'social'
      const baseUsername = `${provider}_${user.id.slice(0, 8)}`
      let username = baseUsername
      let counter = 1

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

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          username,
          nickname: nickname.trim(),
          full_name: user.user_metadata?.name || user.user_metadata?.full_name || null,
          birth_date: birthDate || null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (error) {
        console.error('프로필 생성 오류:', error)
        toast.error('회원가입 중 오류가 발생했습니다.')
        return
      }

      sessionStorage.setItem('login-success', 'true')

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
        <Spinner size="xl" />
      </div>
    )
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100vh-120px)]">
      <div className="flex w-full max-w-md lg:max-w-full">
        <BrandingPanel />

        <div className="w-full lg:w-1/2 max-w-md lg:max-w-none md:bg-white md:dark:bg-[#2D2D2D] md:rounded-lg lg:rounded-l-none md:shadow-lg md:border md:border-black/10 md:dark:border-white/10 lg:border-l-0 md:p-8 lg:p-14 flex flex-col justify-center">
          {/* 모바일 헤더 */}
          <div className="text-center mb-6 lg:hidden">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-[#F0F0F0] mb-2">{providerName} 회원가입</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              추가 정보를 입력하고<br />
              회원가입을 완료하세요.
            </p>
          </div>

          <div>
            {/* 단계 표시 + 이전 버튼 */}
            <div className="flex items-center justify-between mb-6">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  이전
                </button>
              ) : (
                <div />
              )}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {currentStep}/{totalSteps}
              </span>
            </div>

            {/* 소셜 사용자 정보 */}
            {(user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email) && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-[#1D1D1D] border border-black/7 dark:border-white/10 rounded-lg">
                {(user.user_metadata?.name || user.user_metadata?.full_name) && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-gray-900 dark:text-gray-200">이름:</span> {user.user_metadata.name || user.user_metadata.full_name}
                  </p>
                )}
                {user.email && !user.email.includes('@naver-oauth.local') && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <span className="font-medium text-gray-900 dark:text-gray-200">이메일:</span> {user.email}
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-6">
              {/* 1단계: 생년월일 */}
              {!showNicknameStep && (
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-1.5 text-sm font-medium">
                    생년월일 <span className="text-red-500">*</span>
                  </label>
                  <Calendar
                    value={birthDate}
                    onChange={(date: string) => {
                      setBirthDate(date)
                      validateBirth(date)
                    }}
                  />
                  {birthError && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {birthError}
                    </p>
                  )}
                  {birthValid && (
                    <p className="mt-1 text-sm text-green-600 flex items-center">
                      <Check className="h-4 w-4 mr-1" />
                      확인되었습니다
                    </p>
                  )}

                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleBirthNext}
                    disabled={!birthValid}
                    className="w-full py-3 h-auto mt-6"
                  >
                    다음
                  </Button>
                </div>
              )}

              {/* 2단계: 닉네임 */}
              {showNicknameStep && (
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-1.5 text-sm font-medium">
                    닉네임 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => {
                        setNickname(e.target.value)
                        validateNickname(e.target.value)
                      }}
                      className={`w-full px-4 py-3 border rounded-lg outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] text-[15px] transition-colors ${
                        nicknameError ? 'border-red-500 dark:border-red-400' :
                        nicknameValid ? 'border-green-500 dark:border-green-400' :
                        'border-black/7 dark:border-white/10 focus:border-black/10 dark:focus:border-white/20 focus:bg-[#F5F5F5] dark:focus:bg-[#262626]'
                      }`}
                      placeholder="사용하실 닉네임을 입력하세요"
                      required
                      disabled={loading}
                    />
                    {isCheckingNickname && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Spinner size="xs" />
                      </div>
                    )}
                    {nicknameValid && !isCheckingNickname && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Check className="h-5 w-5 text-green-500" />
                      </div>
                    )}
                  </div>
                  {nicknameError && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {nicknameError}
                    </p>
                  )}
                  {nicknameValid && !nicknameError && (
                    <p className="mt-1 text-sm text-green-600 flex items-center">
                      <Check className="h-4 w-4 mr-1" />
                      사용 가능한 닉네임입니다
                    </p>
                  )}

                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    아이디는 자동으로 생성됩니다.
                  </p>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading || !nicknameValid || !!nicknameError || isCheckingNickname}
                    className="w-full py-3 h-auto mt-6"
                  >
                    {loading ? '처리 중...' : '회원가입 완료'}
                  </Button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
