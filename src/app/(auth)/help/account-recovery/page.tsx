"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { sendIdRecoveryCode, findUsernameWithCode, sendPasswordResetLink } from '@/domains/auth/actions';
import { AlertCircle, Check, Mail, User } from 'lucide-react';

// SearchParams를 사용하는 내용 컴포넌트
function AccountRecoveryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');
  const [activeTab, setActiveTab] = useState<'id' | 'password'>(
    tabParam === 'password' ? 'password' : 'id'
  );
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  
  // 유효성 검사 상태
  const [emailValid, setEmailValid] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [fullNameValid, setFullNameValid] = useState(false);
  const [fullNameError, setFullNameError] = useState('');
  const [usernameValid, setUsernameValid] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [codeValid, setCodeValid] = useState(false);
  const [codeError, setCodeError] = useState('');
  
  // URL 파라미터 변경 시 탭 상태 업데이트
  useEffect(() => {
    if (tabParam === 'password') {
      setActiveTab('password');
    } else if (tabParam === 'id') {
      setActiveTab('id');
    }
  }, [tabParam]);
  
  // 이메일 유효성 검사
  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      setEmailError('이메일을 입력해주세요.');
      setEmailValid(false);
      return false;
    } else if (!emailRegex.test(value)) {
      setEmailError('유효한 이메일 주소를 입력해주세요.');
      setEmailValid(false);
      return false;
    } else {
      setEmailError('');
      setEmailValid(true);
      return true;
    }
  };

  // 이름 유효성 검사
  const validateFullName = (value: string) => {
    if (!value) {
      setFullNameError('이름을 입력해주세요.');
      setFullNameValid(false);
      return false;
    } else if (value.length < 2) {
      setFullNameError('이름은 2자 이상이어야 합니다.');
      setFullNameValid(false);
      return false;
    } else {
      setFullNameError('');
      setFullNameValid(true);
      return true;
    }
  };

  // 아이디 유효성 검사
  const validateUsername = (value: string) => {
    if (!value) {
      setUsernameError('아이디를 입력해주세요.');
      setUsernameValid(false);
      return false;
    } else if (value.length < 3) {
      setUsernameError('아이디는 최소 3자 이상이어야 합니다.');
      setUsernameValid(false);
      return false;
    } else {
      setUsernameError('');
      setUsernameValid(true);
      return true;
    }
  };

  // 인증코드 유효성 검사
  const validateCode = (value: string) => {
    if (!value) {
      setCodeError('인증코드를 입력해주세요.');
      setCodeValid(false);
      return false;
    } else if (value.length !== 6) {
      setCodeError('인증코드는 6자리입니다.');
      setCodeValid(false);
      return false;
    } else {
      setCodeError('');
      setCodeValid(true);
      return true;
    }
  };

  // 탭 변경 시 URL 업데이트
  const changeTab = (tab: 'id' | 'password') => {
    setActiveTab(tab);
    router.push(`/help/account-recovery?tab=${tab}`);
    // 탭 변경 시 상태 초기화
    setVerificationSent(false);
    setVerificationCode('');
    setEmail('');
    setFullName('');
    setUsername('');
    setEmailValid(false);
    setEmailError('');
    setFullNameValid(false);
    setFullNameError('');
    setUsernameValid(false);
    setUsernameError('');
    setCodeValid(false);
    setCodeError('');
  };
  
  // 이메일 인증 코드 보내기 (자체 구현)
  const sendVerificationCode = async () => {
    if (!email) {
      toast.error('이메일을 입력해주세요.');
      return;
    }
    
    if (!fullName) {
      toast.error('이름을 입력해주세요.');
      return;
    }
    
    try {
      setLoading(true);
      
      // 자체 구현한 서버 액션 사용 (이메일과 이름 모두 전달)
      const result = await sendIdRecoveryCode(email, fullName);
      
      if (!result.success) {
        toast.error(result.error || '인증 코드 발송에 실패했습니다.');
        return;
      }
      
      setVerificationSent(true);
      toast.success(result.message || '인증 코드가 이메일로 전송되었습니다.');
      
    } catch (error: unknown) {
      console.error('이메일 인증 오류:', error);
      toast.error('인증 코드 발송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // 인증 코드 확인 후 아이디 찾기 (자체 구현)
  const handleFindId = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('이메일을 입력해주세요.');
      return;
    }
    
    if (!verificationCode) {
      toast.error('인증 코드를 입력해주세요.');
      return;
    }
    
    try {
      setLoading(true);
      
      // 자체 구현한 서버 액션 사용
      const result = await findUsernameWithCode(email, verificationCode);

      if (!result.success) {
        toast.error('error' in result ? result.error || '아이디 찾기에 실패했습니다.' : '아이디 찾기에 실패했습니다.');
        return;
      }
      
      // 타입 가드로 성공 결과 확인
      if ('username' in result) {
        // 계정 정보를 찾았으면 결과 페이지로 이동
        const params = new URLSearchParams({
          type: 'id',
          username: result.username || '',
          maskedUsername: 'maskedUsername' in result ? (result.maskedUsername || '') : ''
        });

        router.push(`/help/account-found?${params.toString()}`);
      } else {
        toast.error('결과 데이터가 올바르지 않습니다.');
      }
      
    } catch (error: unknown) {
      console.error('아이디 찾기 오류:', error);
      toast.error('계정 정보를 찾는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // 비밀번호 찾기 함수 (자체 구현)
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username) {
      toast.error('아이디를 입력해주세요');
      return;
    }
    
    try {
      setLoading(true);
      
      // 자체 구현한 서버 액션 사용
      const result = await sendPasswordResetLink(username);
      
      if (!result.success) {
        toast.error(result.error || '비밀번호 재설정 링크 발송에 실패했습니다.');
        return;
      }
      
      toast.success(result.message || '비밀번호 재설정 링크를 이메일로 발송했습니다.');
      
      // 성공 페이지로 이동
      router.push('/help/account-found?type=password');
      
    } catch (error) {
      console.error('비밀번호 재설정 오류:', error);
      toast.error('비밀번호 재설정 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* 고정 헤더 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-left mb-2 text-gray-900 dark:text-[#F0F0F0]">
          계정 찾기
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-left">
          가입시 사용한 정보로 계정을 찾을 수 있습니다.
        </p>

        {/* 탭 메뉴 */}
        <div className="flex border-b border-black/7 dark:border-white/10 mb-6">
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'id'
                ? 'border-slate-800 dark:border-white text-gray-900 dark:text-[#F0F0F0] bg-white dark:bg-[#1D1D1D]'
                : 'border-transparent text-gray-700 dark:text-gray-300 bg-[#F5F5F5] dark:bg-[#262626] hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
            }`}
            onClick={() => changeTab('id')}
          >
            아이디 찾기
          </button>
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'password'
                ? 'border-slate-800 dark:border-white text-gray-900 dark:text-[#F0F0F0] bg-white dark:bg-[#1D1D1D]'
                : 'border-transparent text-gray-700 dark:text-gray-300 bg-[#F5F5F5] dark:bg-[#262626] hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
            }`}
            onClick={() => changeTab('password')}
          >
            비밀번호 찾기
          </button>
        </div>
      </div>

      {/* 콘텐츠 영역 - 최소 높이 설정 */}
      <div className="min-h-[400px]">
      
      {/* 아이디 찾기 폼 */}
      {activeTab === 'id' && (
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            가입시 사용한 이름과 이메일로 아이디를 찾을 수 있습니다.
          </p>
          <form onSubmit={handleFindId} className="space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-gray-700 dark:text-gray-300 mb-1 text-sm font-medium">
              이름
            </label>
            <div className="relative">
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  validateFullName(e.target.value);
                }}
                onBlur={() => validateFullName(fullName)}
                className={`w-full px-4 py-3 border rounded-md md:rounded-md max-md:rounded-lg outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] transition-colors ${
                  fullNameError ? 'border-red-500' :
                  fullNameValid ? 'border-green-500' :
                  'border-black/7 dark:border-white/10 focus:border-black/10 dark:focus:border-white/20 focus:bg-[#F5F5F5] dark:focus:bg-[#262626]'
                } ${verificationSent ? 'bg-gray-100 dark:bg-[#262626]' : ''}`}
                placeholder="가입시 입력한 이름"
                readOnly={verificationSent}
                required
              />
              {fullNameValid && !fullNameError && !verificationSent && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Check className="h-5 w-5 text-green-500" />
                </div>
              )}
            </div>
            {fullNameError && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {fullNameError}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-gray-700 dark:text-gray-300 mb-1 text-sm font-medium">
              이메일 주소
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  validateEmail(e.target.value);
                }}
                onBlur={() => validateEmail(email)}
                className={`w-full px-4 py-3 border rounded-md md:rounded-md max-md:rounded-lg outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] transition-colors ${
                  emailError ? 'border-red-500' :
                  emailValid ? 'border-green-500' :
                  'border-black/7 dark:border-white/10 focus:border-black/10 dark:focus:border-white/20 focus:bg-[#F5F5F5] dark:focus:bg-[#262626]'
                } ${verificationSent ? 'bg-gray-100 dark:bg-[#262626]' : ''}`}
                placeholder="가입시 사용한 이메일"
                readOnly={verificationSent}
                required
              />
              {emailValid && !emailError && !verificationSent && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Check className="h-5 w-5 text-green-500" />
                </div>
              )}
              {verificationSent && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
              )}
            </div>
            {emailError && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {emailError}
              </p>
            )}
          </div>

          {!verificationSent && (
            <div>
              <button
                type="button"
                onClick={sendVerificationCode}
                disabled={loading || !emailValid || !fullNameValid}
                className="w-full py-3 px-4 bg-slate-800 dark:bg-[#3F3F3F] hover:bg-slate-700 dark:hover:bg-[#4A4A4A] text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '발송중...' : '인증코드 받기'}
              </button>
            </div>
          )}
          
          {verificationSent && (
            <div>
              <label htmlFor="verification-code" className="block text-gray-700 dark:text-gray-300 mb-1 text-sm font-medium">
                인증 코드
              </label>
              <div className="relative">
                <input
                  id="verification-code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => {
                    setVerificationCode(e.target.value);
                    validateCode(e.target.value);
                  }}
                  onBlur={() => validateCode(verificationCode)}
                  className={`w-full px-4 py-3 border rounded-md md:rounded-md max-md:rounded-lg outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] transition-colors ${
                    codeError ? 'border-red-500' :
                    codeValid ? 'border-green-500' :
                    'border-black/7 dark:border-white/10 focus:border-black/10 dark:focus:border-white/20 focus:bg-[#F5F5F5] dark:focus:bg-[#262626]'
                  }`}
                  placeholder="6자리 인증코드"
                  maxLength={6}
                  required
                />
                {codeValid && !codeError && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Check className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
              {codeError && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {codeError}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                이메일로 받은 인증 코드를 입력해주세요. 인증 코드는 5분간 유효합니다.
              </p>
              <button
                type="button"
                onClick={() => {
                  setVerificationSent(false);
                  setVerificationCode('');
                  setCodeValid(false);
                  setCodeError('');
                }}
                className="text-xs text-slate-600 hover:text-slate-800 hover:underline mt-1"
              >
                다른 이메일로 재발송
              </button>
            </div>
          )}
          
          {verificationSent && (
            <button
              type="submit"
              disabled={loading || !codeValid}
              className="w-full py-3 px-4 bg-slate-800 dark:bg-[#3F3F3F] hover:bg-slate-700 dark:hover:bg-[#4A4A4A] text-white font-medium rounded-md transition-colors disabled:opacity-50"
            >
              {loading ? '처리 중...' : '아이디 찾기'}
            </button>
          )}
          </form>
        </div>
      )}
      
      {/* 비밀번호 찾기 폼 */}
      {activeTab === 'password' && (
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            아이디를 입력하시면 등록된 이메일로 재설정 링크를 보내드립니다.
          </p>
          <form onSubmit={handleResetPassword} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-gray-700 dark:text-gray-300 mb-1 text-sm font-medium">
              아이디
            </label>
            <div className="relative">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  validateUsername(e.target.value);
                }}
                onBlur={() => validateUsername(username)}
                className={`w-full px-4 py-3 pl-12 border rounded-md md:rounded-md max-md:rounded-lg outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] transition-colors ${
                  usernameError ? 'border-red-500' :
                  usernameValid ? 'border-green-500' :
                  'border-black/7 dark:border-white/10 focus:border-black/10 dark:focus:border-white/20 focus:bg-[#F5F5F5] dark:focus:bg-[#262626]'
                }`}
                placeholder="가입시 설정한 아이디"
                required
              />
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              {usernameValid && !usernameError && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Check className="h-5 w-5 text-green-500" />
                </div>
              )}
            </div>
            {usernameError && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {usernameError}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              등록된 이메일로 비밀번호 재설정 링크를 발송합니다.
            </p>
          </div>
          
          <button
            type="submit"
            disabled={loading || !usernameValid}
            className="w-full py-3 px-4 bg-slate-800 dark:bg-[#3F3F3F] hover:bg-slate-700 dark:hover:bg-[#4A4A4A] text-white font-medium rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? '발송 중...' : '재설정 링크 받기'}
          </button>
          </form>
        </div>
      )}
      
        <div className="mt-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            계정이 기억나셨나요?{' '}
            <Link href="/signin" className="text-slate-600 dark:text-gray-300 hover:text-slate-800 dark:hover:text-[#F0F0F0] hover:underline font-medium">
              로그인
            </Link>
          </p>
        </div>

        {/* 약관/개인정보 링크 */}
        <div className="mt-8 flex justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/terms" className="hover:text-gray-700 dark:hover:text-gray-300">이용약관</Link>
          <Link href="/privacy" className="hover:text-gray-700 dark:hover:text-gray-300">개인정보처리방침</Link>
        </div>
      </div>
    </div>
  );
}

// 메인 페이지 컴포넌트
export default function AccountRecoveryPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md w-full">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-8"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    }>
      <AccountRecoveryContent />
    </Suspense>
  );
} 