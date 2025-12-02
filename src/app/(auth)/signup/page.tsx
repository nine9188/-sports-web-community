"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/shared/context/AuthContext';
import { getSupabaseBrowser } from '@/shared/lib/supabase';
import { signUp } from '@/domains/auth/actions';
import { AlertCircle, Check, Eye, EyeOff } from 'lucide-react';
import KakaoLoginButton from '@/domains/auth/components/KakaoLoginButton';
import TurnstileWidget from '@/shared/components/TurnstileWidget';

export default function SignupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  
  // 단계 표시 상태
  const [showNameStep, setShowNameStep] = useState(false);
  const [showIdStep, setShowIdStep] = useState(false);
  const [showNicknameStep, setShowNicknameStep] = useState(false);
  const [showPasswordStep, setShowPasswordStep] = useState(false);
  
  // 입력값 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [fullName, setFullName] = useState('');
  
  // 유효성 검사 상태
  const [emailValid, setEmailValid] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordValid, setPasswordValid] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<'약함' | '보통' | '강함' | ''>('');
  const [confirmPasswordValid, setConfirmPasswordValid] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  // 입력필드 상태
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameChecked, setUsernameChecked] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [nicknameMessage, setNicknameMessage] = useState('');
  const [nicknameAvailable, setNicknameAvailable] = useState(false);

  // 이미 로그인된 사용자 처리
  useEffect(() => {
    if (user) {
      toast.info('이미 로그인되어 있습니다.');
      const timer = setTimeout(() => {
        router.push('/');
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [user, router]);
  
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
  
  // 비밀번호 강도 계산
  const calculatePasswordStrength = (password: string): '약함' | '보통' | '강함' | '' => {
    if (!password) return '';
    
    let score = 0;
    
    // 길이 체크 (10자 이상)
    if (password.length >= 10) score += 2;
    else if (password.length >= 8) score += 1;
    
    // 특수문자 포함
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 2;
    
    // 숫자 포함
    if (/\d/.test(password)) score += 1;
    
    // 대문자 포함
    if (/[A-Z]/.test(password)) score += 1;
    
    // 소문자 포함
    if (/[a-z]/.test(password)) score += 1;
    
    if (score <= 2) return '약함';
    if (score <= 4) return '보통';
    return '강함';
  };
  
  // 비밀번호 유효성 검사
  const validatePassword = (value: string) => {
    const strength = calculatePasswordStrength(value);
    setPasswordStrength(strength);
    
    if (!value) {
      setPasswordError('비밀번호를 입력해주세요.');
      setPasswordValid(false);
      return false;
    } else if (value.length < 10) {
      setPasswordError('비밀번호는 최소 10자 이상이어야 합니다.');
      setPasswordValid(false);
      return false;
    } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
      setPasswordError('비밀번호에 특수문자를 포함해야 합니다.');
      setPasswordValid(false);
      return false;
    } else {
      setPasswordError('');
      setPasswordValid(true);
      return true;
    }
  };
  
  // 비밀번호 확인 유효성 검사
  const validateConfirmPassword = (value: string) => {
    if (!value) {
      setConfirmPasswordError('비밀번호 확인을 입력해주세요.');
      setConfirmPasswordValid(false);
      return false;
    } else if (value !== password) {
      setConfirmPasswordError('비밀번호가 일치하지 않습니다.');
      setConfirmPasswordValid(false);
      return false;
    } else {
      setConfirmPasswordError('');
      setConfirmPasswordValid(true);
      return true;
    }
  };
  
  // 이메일 제출 처리
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateEmail(email)) {
      setShowNameStep(true);
    }
  };
  
  // 이름 제출 처리
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (fullName.trim()) {
      setShowIdStep(true);
    }
  };
  
  // 아이디 제출 처리
  const handleIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (usernameChecked && usernameAvailable) {
      setShowNicknameStep(true);
    }
  };
  
  // 닉네임 제출 처리
  const handleNicknameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (nicknameChecked && nicknameAvailable) {
      setShowPasswordStep(true);
    }
  };
  
  // 아이디 유효성 검사
  const validateUsername = (value: string) => {
    // 길이 체크
    if (value.length < 4) {
      return '아이디는 최소 4자 이상이어야 합니다.';
    }
    if (value.length > 20) {
      return '아이디는 최대 20자까지 가능합니다.';
    }
    
    // 허용 문자 체크 (영문 소문자, 숫자, 밑줄, 마침표)
    if (!/^[a-z0-9._]+$/.test(value)) {
      return '아이디는 영문 소문자, 숫자, 밑줄(_), 마침표(.)만 사용 가능합니다.';
    }
    
    // 연속된 특수문자 체크
    if (/[_.]{2,}/.test(value)) {
      return '연속된 특수문자는 사용할 수 없습니다.';
    }
    
    // 특수문자로 시작하거나 끝나는 경우
    if (/^[_.]|[_.]$/.test(value)) {
      return '아이디는 특수문자로 시작하거나 끝날 수 없습니다.';
    }
    
    // 금지어 체크
    const forbiddenWords = ['admin', 'root', 'operator', 'manager', 'support', 'help', 'service', 'system'];
    if (forbiddenWords.some(word => value.toLowerCase().includes(word))) {
      return '사용할 수 없는 아이디입니다.';
    }
    
    // 아이디와 닉네임 동일 체크
    if (nickname && value === nickname) {
      return '아이디와 닉네임은 같을 수 없습니다.';
    }
    
    return '';
  };

  // 사용자명(아이디) 중복 확인
  const checkUsername = async () => {
    if (!username) {
      setUsernameMessage('아이디를 입력해주세요.');
      return;
    }
    
    // 유효성 검사 먼저 실행
    const validationError = validateUsername(username);
    if (validationError) {
      setUsernameMessage(validationError);
      setUsernameAvailable(false);
      return;
    }
    
    try {
      setIsCheckingUsername(true);
      
      // Supabase 클라이언트 생성
      const supabase = getSupabaseBrowser();
      
      // 프로필 테이블에서 해당 username으로 검색
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username);
      
      if (error) {
        console.error('아이디 조회 오류:', error);
        throw error;
      }
      
      // 결과 확인 및 상태 업데이트
      const isAvailable = !data || data.length === 0;
      
      setUsernameChecked(true);
      setUsernameAvailable(isAvailable);
      setUsernameMessage(isAvailable ? '사용 가능한 아이디입니다.' : '이미 사용 중인 아이디입니다.');
      
    } catch (error) {
      console.error('아이디 중복 확인 오류:', error);
      setUsernameMessage('아이디 확인 중 오류가 발생했습니다.');
      setUsernameAvailable(false);
    } finally {
      setIsCheckingUsername(false);
    }
  };
  
  // 닉네임 유효성 검사
  const validateNickname = (value: string) => {
    // 길이 체크
    if (value.length < 2) {
      return '닉네임은 최소 2자 이상이어야 합니다.';
    }
    if (value.length > 16) {
      return '닉네임은 최대 16자까지 가능합니다.';
    }
    
    // 허용 문자 체크 (한글, 영문, 숫자, 일부 특수문자)
    if (!/^[가-힣a-zA-Z0-9_-]+$/.test(value)) {
      return '닉네임은 한글, 영문, 숫자, 밑줄(_), 하이픈(-)만 사용 가능합니다.';
    }
    
    // 연속된 동일 문자 체크 (4개 이상)
    if (/(.)\1{3,}/.test(value)) {
      return '동일한 문자를 4번 이상 연속 사용할 수 없습니다.';
    }
    
    // 의미 없는 문자 반복 체크 (ㅋㅋㅋㅋ 등)
    if (/[ㅋㅎㅠㅜㅡㅗㅁㄴㅇㄹㅇ]{4,}/.test(value)) {
      return '의미 없는 문자 반복은 사용할 수 없습니다.';
    }
    
    // 금지어 체크
    const forbiddenWords = ['admin', 'administrator', '관리자', '운영자', '매니저', 'manager', 'operator', 'support', '고객센터', 'service'];
    if (forbiddenWords.some(word => value.toLowerCase().includes(word.toLowerCase()))) {
      return '사용할 수 없는 닉네임입니다.';
    }
    
    // 아이디와 닉네임 동일 체크
    if (username && value === username) {
      return '닉네임과 아이디는 같을 수 없습니다.';
    }
    
    return '';
  };

  // 닉네임 중복 확인
  const checkNickname = async () => {
    if (!nickname) {
      setNicknameMessage('닉네임을 입력해주세요.');
      return;
    }
    
    // 유효성 검사 먼저 실행
    const validationError = validateNickname(nickname);
    if (validationError) {
      setNicknameMessage(validationError);
      setNicknameAvailable(false);
      return;
    }
    
    try {
      setIsCheckingNickname(true);
      
      // Supabase 클라이언트 생성
      const supabase = getSupabaseBrowser();
      
      // 프로필 테이블에서 해당 nickname으로 검색
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('nickname', nickname);
      
      if (error) {
        console.error('닉네임 조회 오류:', error);
        throw error;
      }
      
      // 결과 확인 및 상태 업데이트
      const isAvailable = !data || data.length === 0;
      
      setNicknameChecked(true);
      setNicknameAvailable(isAvailable);
      setNicknameMessage(isAvailable ? '사용 가능한 닉네임입니다.' : '이미 사용 중인 닉네임입니다.');
      
    } catch (error) {
      console.error('닉네임 중복 확인 오류:', error);
      setNicknameMessage('닉네임 확인 중 오류가 발생했습니다.');
      setNicknameAvailable(false);
    } finally {
      setIsCheckingNickname(false);
    }
  };

  // 최종 회원가입 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!usernameChecked || !usernameAvailable) {
      toast.error('아이디 중복 확인을 해주세요.');
      return;
    }
    
    if (!nicknameChecked || !nicknameAvailable) {
      toast.error('닉네임 중복 확인을 해주세요.');
      return;
    }
    if (!captchaToken) {
      toast.error('봇 검증을 완료해주세요.');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const result = await signUp(email, password, {
        username,
        full_name: fullName,
        nickname
      }, captchaToken);
      
      if (result.success) {
        // 중복 토스트 제거 - signin 페이지의 message 파라미터만 사용
        router.push('/signin?message=회원가입이 완료되었습니다. 이메일을 확인하고 로그인해주세요.');
      } else {
        toast.error(result.error || '회원가입에 실패했습니다.');
      }
    } catch {
      toast.error('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 이미 로그인된 경우 폼 대신 메시지 표시
  if (user) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-120px)]">
        <div className="w-full max-w-md">
          <div className="text-center">
            <h2 className="text-2xl font-bold">이미 로그인되어 있습니다</h2>
            <p className="mt-2 text-gray-600">홈 화면으로 이동합니다...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100vh-120px)]">
      <div className="max-w-md w-full">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-[#F0F0F0] mb-2">4590 멤버 ID를 생성하세요.</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            모든 축구팬을 위한 4590 커뮤니티에 오신 것을 환영합니다.
          </p>
        </div>

        {/* 콘텐츠 영역 - 최소 높이 설정 */}
        <div className="min-h-[400px]">
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 봇 검증 - 이메일 위 */}
          <div className="space-y-2">
            <label className="block text-gray-700 dark:text-gray-300 mb-1 text-sm font-medium">봇 검증</label>
            <TurnstileWidget
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY as string}
              onToken={setCaptchaToken}
              className="w-full"
            />
          </div>

          {/* 이메일 입력 단계 */}
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1 text-sm font-medium">이메일 주소</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    validateEmail(e.target.value);
                  }}
                  onBlur={() => validateEmail(email)}
                  className={`w-full px-4 py-3 border rounded-md md:rounded-md max-md:rounded-lg focus:outline-none transition-colors ${
                    emailError ? 'border-red-500 ' : 
                    emailValid ? 'border-green-500 ' : 
                    'border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] focus:border-black/10 dark:focus:border-white/20 focus:bg-[#F5F5F5] dark:focus:bg-[#262626]'
                  }`}
                  placeholder="이메일 주소"
                  required
                  disabled={showNameStep}
                />
                {emailValid && !emailError && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Check className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
              {emailError && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {emailError}
                </p>
              )}
              {!showNameStep && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={handleEmailSubmit}
                    disabled={!emailValid || isLoading || !captchaToken}
                    className="w-full py-3 px-4 bg-slate-800 dark:bg-[#3F3F3F] hover:bg-slate-700 dark:hover:bg-[#4A4A4A] text-white rounded-md transition-colors disabled:opacity-50"
                  >
                    {isLoading ? '처리 중...' : '계속하기'}
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* 이름 입력 단계 */}
          {showNameStep && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1 text-sm font-medium">이름</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-3 border border-black/7 dark:border-white/10 rounded-md md:rounded-md max-md:rounded-lg bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] focus:outline-none transition-colors focus:border-black/10 dark:focus:border-white/20 focus:bg-[#F5F5F5] dark:focus:bg-[#262626]"
                  placeholder="이름"
                  required
                  disabled={showIdStep}
                />
                {!showIdStep && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={handleNameSubmit}
                      disabled={!fullName.trim() || isLoading}
                      className="w-full py-3 px-4 bg-slate-800 dark:bg-[#3F3F3F] hover:bg-slate-700 dark:hover:bg-[#4A4A4A] text-white rounded-md transition-colors disabled:opacity-50"
                    >
                      {isLoading ? '처리 중...' : '계속하기'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* 아이디 입력 단계 */}
          {showIdStep && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1 text-sm font-medium">아이디</label>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  *4-20자, 영문 소문자·숫자·밑줄(_)·마침표(.) 사용 가능
                </p>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      const value = e.target.value;
                      setUsername(value);
                      setUsernameChecked(false);
                      setUsernameAvailable(false);
                      
                      // 실시간 유효성 검사
                      if (value) {
                        const validationError = validateUsername(value);
                        setUsernameMessage(validationError || '');
                      } else {
                        setUsernameMessage('');
                      }
                    }}
                    className={`flex-1 p-3 border rounded-md bg-white focus:outline-none transition-colors ${
                      usernameChecked && !usernameAvailable ? 'border-red-500 ' : 
                      usernameChecked && usernameAvailable ? 'border-green-500 ' : 
                      'border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] focus:border-black/10 dark:focus:border-white/20 focus:bg-[#F5F5F5] dark:focus:bg-[#262626]'
                    }`}
                    placeholder="아이디"
                    required
                    disabled={showNicknameStep}
                  />
                  <button
                    type="button"
                    onClick={checkUsername}
                    disabled={isCheckingUsername || !username || validateUsername(username) !== '' || showNicknameStep}
                    className="px-4 py-2 bg-slate-800 dark:bg-[#3F3F3F] hover:bg-slate-700 dark:hover:bg-[#4A4A4A] text-white rounded-md disabled:opacity-50"
                  >
                    {isCheckingUsername ? '확인 중...' : '중복 확인'}
                  </button>
                </div>
                {usernameMessage && (
                  <p className={`text-sm mt-1 flex items-center ${
                    usernameAvailable ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {usernameAvailable ? 
                      <Check className="h-4 w-4 mr-1" /> : 
                      <AlertCircle className="h-4 w-4 mr-1" />
                    }
                    {usernameMessage}
                  </p>
                )}
                {!showNicknameStep && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={handleIdSubmit}
                      disabled={!usernameChecked || !usernameAvailable || isLoading}
                      className="w-full py-3 px-4 bg-slate-800 dark:bg-[#3F3F3F] hover:bg-slate-700 dark:hover:bg-[#4A4A4A] text-white rounded-md transition-colors disabled:opacity-50"
                    >
                      {isLoading ? '처리 중...' : '계속하기'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* 닉네임 입력 단계 */}
          {showNicknameStep && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1 text-sm font-medium">닉네임</label>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  *2-16자, 한글·영문·숫자·밑줄(_)·하이픈(-) 사용 가능
                </p>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNickname(value);
                      setNicknameChecked(false);
                      setNicknameAvailable(false);
                      
                      // 실시간 유효성 검사
                      if (value) {
                        const validationError = validateNickname(value);
                        setNicknameMessage(validationError || '');
                      } else {
                        setNicknameMessage('');
                      }
                    }}
                    className={`flex-1 p-3 border rounded-md bg-white focus:outline-none transition-colors ${
                      nicknameChecked && !nicknameAvailable ? 'border-red-500 ' : 
                      nicknameChecked && nicknameAvailable ? 'border-green-500 ' : 
                      'border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] focus:border-black/10 dark:focus:border-white/20 focus:bg-[#F5F5F5] dark:focus:bg-[#262626]'
                    }`}
                    placeholder="닉네임"
                    required
                    disabled={showPasswordStep}
                  />
                  <button
                    type="button"
                    onClick={checkNickname}
                    disabled={isCheckingNickname || !nickname || validateNickname(nickname) !== '' || showPasswordStep}
                    className="px-4 py-2 bg-slate-800 dark:bg-[#3F3F3F] hover:bg-slate-700 dark:hover:bg-[#4A4A4A] text-white rounded-md disabled:opacity-50"
                  >
                    {isCheckingNickname ? '확인 중...' : '중복 확인'}
                  </button>
                </div>
                {nicknameMessage && (
                  <p className={`text-sm mt-1 flex items-center ${
                    nicknameAvailable ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {nicknameAvailable ? 
                      <Check className="h-4 w-4 mr-1" /> : 
                      <AlertCircle className="h-4 w-4 mr-1" />
                    }
                    {nicknameMessage}
                  </p>
                )}
                {!showPasswordStep && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={handleNicknameSubmit}
                      disabled={!nicknameChecked || !nicknameAvailable || isLoading}
                      className="w-full py-3 px-4 bg-slate-800 dark:bg-[#3F3F3F] hover:bg-slate-700 dark:hover:bg-[#4A4A4A] text-white rounded-md transition-colors disabled:opacity-50"
                    >
                      {isLoading ? '처리 중...' : '계속하기'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* 비밀번호 입력 단계 */}
          {showPasswordStep && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1 text-sm font-medium">비밀번호</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      validatePassword(e.target.value);
                      if (confirmPassword) validateConfirmPassword(confirmPassword);
                    }}
                    onBlur={() => validatePassword(password)}
                    className={`w-full px-4 py-3 border rounded-md md:rounded-md max-md:rounded-lg focus:outline-none transition-colors ${
                      passwordError ? 'border-red-500 ' : 
                      passwordValid ? 'border-green-500 ' : 
                      'border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] focus:border-black/10 dark:focus:border-white/20 focus:bg-[#F5F5F5] dark:focus:bg-[#262626]'
                    }`}
                    placeholder="비밀번호"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                
                {/* 비밀번호 안내 메시지 */}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  *10자 이상, 특수문자 포함
                </p>
                
                {/* 비밀번호 강도 표시 */}
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600">강도:</span>
                      <span className={`text-xs font-medium ${
                        passwordStrength === '강함' ? 'text-green-600' :
                        passwordStrength === '보통' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {passwordStrength}
                      </span>
                    </div>
                    <div className="flex space-x-1 mt-1">
                      <div className={`h-1 w-1/3 rounded ${
                        passwordStrength === '약함' ? 'bg-red-400' :
                        passwordStrength === '보통' ? 'bg-yellow-400' :
                        passwordStrength === '강함' ? 'bg-green-400' : 'bg-gray-200'
                      }`}></div>
                      <div className={`h-1 w-1/3 rounded ${
                        passwordStrength === '보통' ? 'bg-yellow-400' :
                        passwordStrength === '강함' ? 'bg-green-400' : 'bg-gray-200'
                      }`}></div>
                      <div className={`h-1 w-1/3 rounded ${
                        passwordStrength === '강함' ? 'bg-green-400' : 'bg-gray-200'
                      }`}></div>
                    </div>
                  </div>
                )}
                
                {passwordError && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {passwordError}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1 text-sm font-medium">비밀번호 확인</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      validateConfirmPassword(e.target.value);
                    }}
                    onBlur={() => validateConfirmPassword(confirmPassword)}
                    className={`w-full px-4 py-3 border rounded-md md:rounded-md max-md:rounded-lg focus:outline-none transition-colors ${
                      confirmPasswordError ? 'border-red-500 ' : 
                      confirmPasswordValid ? 'border-green-500 ' : 
                      'border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] focus:border-black/10 dark:focus:border-white/20 focus:bg-[#F5F5F5] dark:focus:bg-[#262626]'
                    }`}
                    placeholder="비밀번호 확인"
                    required
                  />
                </div>
                {confirmPasswordError && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {confirmPasswordError}
                  </p>
                )}
              </div>
              

              
              <div className="mt-2">
                <button 
                  type="submit"
                  disabled={isLoading || !passwordValid || !confirmPasswordValid || !emailValid || !usernameChecked || !usernameAvailable || !nicknameChecked || !nicknameAvailable}
                  className="w-full p-3 bg-slate-800 dark:bg-[#3F3F3F] hover:bg-slate-700 dark:hover:bg-[#4A4A4A] text-white rounded-md transition-colors disabled:opacity-50 mt-4"
                >
                  {isLoading ? '처리 중...' : '계정 생성하기'}
                </button>
              </div>
            </div>
          )}

        </form>

        {/* 소셜 로그인 구분선 */}
        <div className="mt-6 mb-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/7 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#F8F9FA] dark:bg-black text-gray-500 dark:text-gray-400">또는</span>
            </div>
          </div>
        </div>

        {/* 카카오 회원가입 */}
        <div className="mb-6">
          <KakaoLoginButton 
            disabled={isLoading}
            onLoading={setIsLoading}
          />
        </div>
        
          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              이미 계정이 있으신가요?{' '}
              <Link href="/signin" className="text-slate-600 dark:text-gray-300 hover:text-slate-800 dark:hover:text-[#F0F0F0] hover:underline">
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex space-x-4 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/terms" className="hover:text-gray-700 dark:hover:text-gray-300">이용약관</Link>
        <Link href="/privacy" className="hover:text-gray-700 dark:hover:text-gray-300">개인정보처리방침</Link>
      </div>
    </div>
  );
} 