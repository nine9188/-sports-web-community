'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/shared/context/AuthContext'
import { getSupabaseBrowser } from '@/shared/lib/supabase'
import { validateReferralCode } from '@/shared/actions/referral-actions'
import { checkSocialProfile, completeSocialSignup, checkNicknameAvailability } from '@/domains/auth/actions'
import { toast } from 'sonner'
import { AlertCircle, Check, ChevronLeft, Calendar as CalendarIcon, Gift, PartyPopper, Phone } from 'lucide-react'
import Spinner from '@/shared/components/Spinner'
import { Button } from '@/shared/components/ui'
import Calendar from '@/shared/components/Calendar'
import BrandingPanel from '../components/BrandingPanel'

export default function SocialSignupPage() {
  const router = useRouter()
  const { user: authUser, isLoading } = useAuth()
  const [directUser, setDirectUser] = useState<{ app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown>; email?: string; id?: string } | null>(null)
  const user = authUser || directUser
  const [loading, setLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  // 단계 상태
  const [showNicknameStep, setShowNicknameStep] = useState(false)
  const [showReferralStep, setShowReferralStep] = useState(false)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)

  // 입력값
  const [nickname, setNickname] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [showCalendar, setShowCalendar] = useState(false)
  const [referralCode, setReferralCode] = useState('')

  // 유효성 검사
  const [nicknameError, setNicknameError] = useState('')
  const [nicknameValid, setNicknameValid] = useState(false)
  const [isCheckingNickname, setIsCheckingNickname] = useState(false)
  const [birthError, setBirthError] = useState('')
  const [birthValid, setBirthValid] = useState(false)

  // 추천 코드
  const [isCheckingReferral, setIsCheckingReferral] = useState(false)
  const [referralChecked, setReferralChecked] = useState(false)
  const [referralValid, setReferralValid] = useState(false)
  const [referralMessage, setReferralMessage] = useState('')
  const [, setReferrerNickname] = useState('')

  // 프로바이더 이름
  const providerName = user?.app_metadata?.provider === 'naver' ? '네이버'
    : user?.app_metadata?.provider === 'kakao' ? '카카오'
    : user?.app_metadata?.provider === 'google' ? '구글'
    : user?.app_metadata?.provider === 'discord' ? '디스코드'
    : '소셜'

  useEffect(() => {
    const checkAuthAndProfile = async () => {
      if (isLoading) return

      // AuthContext에 user가 없으면 직접 확인
      let currentUser = authUser
      if (!currentUser) {
        const supabase = getSupabaseBrowser()
        const { data: { user: fetchedUser }, error } = await supabase.auth.getUser()
        if (error || !fetchedUser) {
          toast.error('로그인이 필요합니다.')
          router.replace('/signin')
          return
        }
        currentUser = fetchedUser
        setDirectUser(fetchedUser)
      }

      // 서버 액션으로 프로필 확인
      const { hasProfile } = await checkSocialProfile()

      if (hasProfile) {
        sessionStorage.setItem('login-success', 'true')
        router.replace('/')
        return
      }

      setIsInitializing(false)
    }

    checkAuthAndProfile()
  }, [authUser, isLoading, router])

  // 생년월일 포맷 (YYYY.MM.DD)
  const formatBirthDate = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '')
    if (numbers.length <= 4) return numbers
    if (numbers.length <= 6) return `${numbers.slice(0, 4)}.${numbers.slice(4)}`
    return `${numbers.slice(0, 4)}.${numbers.slice(4, 6)}.${numbers.slice(6, 8)}`
  }

  // 생년월일 검증
  const validateBirthDate = (value: string) => {
    if (!value || value.length < 10) {
      setBirthError('생년월일을 입력해주세요. (YYYY.MM.DD)')
      setBirthValid(false)
      return false
    }

    const parts = value.split('.')
    if (parts.length !== 3) {
      setBirthError('올바른 형식으로 입력해주세요. (YYYY.MM.DD)')
      setBirthValid(false)
      return false
    }

    const [yearStr, monthStr, dayStr] = parts
    const yearNum = parseInt(yearStr)
    const monthNum = parseInt(monthStr)
    const dayNum = parseInt(dayStr)

    if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
      setBirthError('올바른 날짜를 입력해주세요.')
      setBirthValid(false)
      return false
    }

    const birthDateObj = new Date(yearNum, monthNum - 1, dayNum)
    const today = new Date()
    let age = today.getFullYear() - birthDateObj.getFullYear()
    const monthDiff = today.getMonth() - birthDateObj.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--
    }

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
        const result = await checkNicknameAvailability(nickname)

        if (!result.available) {
          setNicknameError(result.message || '이미 사용 중인 닉네임입니다.')
          setNicknameValid(false)
        } else {
          setNicknameError('')
          setNicknameValid(true)
        }
      } catch {
        setNicknameError('')
        setNicknameValid(true)
      } finally {
        setIsCheckingNickname(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [nickname])

  // 추천 코드 확인
  const checkReferralCode = async () => {
    if (!referralCode.trim()) return

    setIsCheckingReferral(true)
    try {
      const result = await validateReferralCode(referralCode.trim())
      setReferralChecked(true)
      setReferralValid(result.valid)
      setReferrerNickname(result.referrerNickname || '')
      setReferralMessage(
        result.valid
          ? `올바른 추천코드입니다. (${result.referrerNickname})`
          : result.error || '유효하지 않은 추천 코드입니다.'
      )
    } catch {
      setReferralMessage('추천 코드 확인 중 오류가 발생했습니다.')
      setReferralValid(false)
    } finally {
      setIsCheckingReferral(false)
    }
  }

  // 단계 진행
  const handleBirthNext = () => {
    if (validateBirthDate(birthDate)) {
      setShowNicknameStep(true)
    }
  }

  const handleNicknameNext = () => {
    if (nicknameValid && !nicknameError) {
      setShowReferralStep(true)
    }
  }

  // 이전 단계
  const handleBack = () => {
    if (showReferralStep) {
      setShowReferralStep(false)
    } else if (showNicknameStep) {
      setShowNicknameStep(false)
    }
  }

  // 현재 단계 계산
  const currentStep = !showNicknameStep ? 1 : !showReferralStep ? 2 : 3
  const totalSteps = 3

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
      const result = await completeSocialSignup({
        nickname: nickname.trim(),
        birthDate,
        referralCode: referralValid && referralCode.trim() ? referralCode.trim() : undefined,
      })

      if (!result.success) {
        toast.error(result.error || '회원가입 중 오류가 발생했습니다.')
        return
      }

      // 축하 팝업 표시
      setShowWelcomeModal(true)
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
    <>
    {/* 축하 팝업 */}
    {showWelcomeModal && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
        <div className="bg-white dark:bg-[#2D2D2D] rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-8 text-center relative">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <PartyPopper className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>

          <h3 className="text-xl font-bold text-gray-900 dark:text-[#F0F0F0] mb-2">
            회원가입을 축하합니다!
          </h3>
          <p className="text-[13px] text-gray-600 dark:text-gray-400 mb-6">
            <span className="font-medium text-gray-900 dark:text-gray-200">{nickname}</span>님, 4590 Football에 오신 것을 환영합니다.
          </p>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <p className="text-[13px] font-medium text-blue-800 dark:text-blue-200">휴대폰 인증을 진행해주세요</p>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              휴대폰 인증 시 <span className="font-semibold">500P + 100XP</span>를 드립니다!
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                window.location.href = '/settings/profile'
              }}
              className="w-full py-3 h-auto"
            >
              휴대폰 인증하러 가기
            </Button>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/'
              }}
              className="text-[13px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 py-2 transition-colors"
            >
              나중에 할게요
            </button>
          </div>
        </div>
      </div>
    )}

    <div className="flex flex-col items-center lg:justify-center min-h-[calc(100vh-120px)]">
      <div className="flex flex-col lg:flex-row w-full max-w-md lg:max-w-full">
        <BrandingPanel variant="social-signup" />

        <div className="w-full lg:w-1/2 max-w-md lg:max-w-none md:bg-white md:dark:bg-[#2D2D2D] md:rounded-lg lg:rounded-l-none md:shadow-lg md:border md:border-black/10 md:dark:border-white/10 lg:border-l-0 md:p-8 lg:p-14 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-[#F0F0F0] mb-2">{providerName} 회원가입</h2>
            <p className="text-gray-600 dark:text-gray-400 text-[13px]">
              {providerName} 로그인이 완료되었습니다. 추가 정보를 입력해주세요.
            </p>
          </div>

          <div>
            {/* 단계 표시 + 이전 버튼 */}
            <div className="flex items-center justify-between mb-6">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center text-[13px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  이전
                </button>
              ) : (
                <div />
              )}
              <span className="text-[13px] text-gray-500 dark:text-gray-400">
                {currentStep}/{totalSteps}
              </span>
            </div>

            {/* 소셜 사용자 정보 */}
            {(user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email) && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-[#1D1D1D] border border-black/7 dark:border-white/10 rounded-lg">
                {(user.user_metadata?.name || user.user_metadata?.full_name) && (
                  <p className="text-[13px] text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-gray-900 dark:text-gray-200">이름:</span> {user.user_metadata.name || user.user_metadata.full_name}
                  </p>
                )}
                {user.email && !user.email.includes('@naver-oauth.local') && (
                  <p className="text-[13px] text-gray-600 dark:text-gray-400 mt-1">
                    <span className="font-medium text-gray-900 dark:text-gray-200">이메일:</span> {user.email}
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-6">
              {/* 1단계: 생년월일 */}
              {!showNicknameStep && (
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-1.5 text-[13px] font-medium">
                    생년월일 <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    *만 14세 이상만 가입 가능합니다
                  </p>
                  <div className="relative">
                    <input
                      type="text"
                      value={birthDate}
                      onChange={(e) => {
                        const formatted = formatBirthDate(e.target.value)
                        setBirthDate(formatted)
                        if (formatted.length === 10) {
                          validateBirthDate(formatted)
                        } else {
                          setBirthError('')
                          setBirthValid(false)
                        }
                      }}
                      onBlur={() => {
                        if (birthDate) validateBirthDate(birthDate)
                      }}
                      className={`w-full px-4 py-3 pr-10 border rounded-lg outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] text-base transition-colors ${
                        birthError ? 'border-red-500 dark:border-red-400' :
                        birthValid ? 'border-green-500 dark:border-green-400' :
                        'border-black/7 dark:border-white/10 focus:border-black/10 dark:focus:border-white/20 focus:bg-[#F5F5F5] dark:focus:bg-[#262626]'
                      }`}
                      placeholder="YYYY.MM.DD"
                      maxLength={10}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowCalendar(true)}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 h-8 w-8"
                    >
                      <CalendarIcon className="h-5 w-5" />
                    </Button>

                    {showCalendar && (
                      <div className="absolute top-full left-0 mt-2 z-50">
                        <Calendar
                          selectedDate={birthDate ? new Date(birthDate.replace(/\./g, '-')) : new Date()}
                          onDateSelect={(date: Date) => {
                            const year = date.getFullYear()
                            const month = String(date.getMonth() + 1).padStart(2, '0')
                            const day = String(date.getDate()).padStart(2, '0')
                            const formatted = `${year}.${month}.${day}`
                            setBirthDate(formatted)
                            validateBirthDate(formatted)
                            setShowCalendar(false)
                          }}
                          onClose={() => setShowCalendar(false)}
                          maxDate={new Date()}
                          minDate={new Date(1900, 0, 1)}
                        />
                      </div>
                    )}
                  </div>
                  {birthError && (
                    <p className="mt-1 text-[13px] text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {birthError}
                    </p>
                  )}
                  {birthValid && (
                    <p className="mt-1 text-[13px] text-green-600 flex items-center">
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
              {showNicknameStep && !showReferralStep && (
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-1.5 text-[13px] font-medium">
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
                      className={`w-full px-4 py-3 border rounded-lg outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] text-base transition-colors ${
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
                    <p className="mt-1 text-[13px] text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {nicknameError}
                    </p>
                  )}
                  {nicknameValid && !nicknameError && (
                    <p className="mt-1 text-[13px] text-green-600 flex items-center">
                      <Check className="h-4 w-4 mr-1" />
                      사용 가능한 닉네임입니다
                    </p>
                  )}

                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    아이디는 자동으로 생성됩니다.
                  </p>

                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleNicknameNext}
                    disabled={!nicknameValid || !!nicknameError || isCheckingNickname}
                    className="w-full py-3 h-auto mt-6"
                  >
                    다음
                  </Button>
                </div>
              )}

              {/* 3단계: 추천 코드 + 제출 */}
              {showReferralStep && (
                <div className="space-y-4">
                  <div className="p-4 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg border border-black/7 dark:border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <label className="text-[13px] font-medium text-gray-700 dark:text-gray-300">
                        추천 코드 <span className="text-gray-500 dark:text-gray-400 font-normal">(선택)</span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      친구의 추천 코드가 있다면 입력하세요. 가입 시 300P + 50XP를 받을 수 있습니다!
                    </p>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={referralCode}
                        onChange={(e) => {
                          setReferralCode(e.target.value.toLowerCase())
                          setReferralChecked(false)
                          setReferralValid(false)
                          setReferralMessage('')
                          setReferrerNickname('')
                        }}
                        className={`flex-1 p-3 border rounded-md focus:outline-none bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] transition-colors ${
                          referralChecked && !referralValid && referralCode.trim() ? 'border-red-500 dark:border-red-400' :
                          referralChecked && referralValid ? 'border-green-500 dark:border-green-400' :
                          'border-black/7 dark:border-white/10 focus:border-black/10 dark:focus:border-white/20 focus:bg-[#F5F5F5] dark:focus:bg-[#262626]'
                        }`}
                        placeholder="예: a1b2c3d4"
                        maxLength={8}
                      />
                      <Button
                        type="button"
                        variant="primary"
                        onClick={checkReferralCode}
                        disabled={isCheckingReferral || !referralCode.trim()}
                      >
                        {isCheckingReferral ? '확인 중...' : '확인'}
                      </Button>
                    </div>
                    {referralMessage && (
                      <p className={`text-[13px] mt-2 flex items-center ${
                        referralValid ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {referralValid ?
                          <Check className="h-4 w-4 mr-1" /> :
                          <AlertCircle className="h-4 w-4 mr-1" />
                        }
                        {referralMessage}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    className="w-full py-3 h-auto"
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
    </>
  )
}
