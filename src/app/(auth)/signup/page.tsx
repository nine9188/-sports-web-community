"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { useAuth } from '@/shared/context/AuthContext';
import { createClient } from '@/shared/api/supabase';
import { AlertCircle, Check, Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // 단계 표시 상태
  const [showPasswordStep, setShowPasswordStep] = useState(false);
  const [showProfileStep, setShowProfileStep] = useState(false);
  
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
  
  // 비밀번호 유효성 검사
  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError('비밀번호를 입력해주세요.');
      setPasswordValid(false);
      return false;
    } else if (value.length < 6) {
      setPasswordError('비밀번호는 최소 6자 이상이어야 합니다.');
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
      // 이메일 중복 확인 (실제 구현 시 서버 API 호출 필요)
      // 여기서는 테스트를 위해 이메일 중복 확인 생략하고 바로 다음 단계 표시
      setShowPasswordStep(true);
    }
  };
  
  // 비밀번호 제출 처리
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);
    
    if (isPasswordValid && isConfirmPasswordValid) {
      setShowProfileStep(true);
    }
  };
  
  // 사용자명(아이디) 중복 확인
  const checkUsername = async () => {
    if (!username) {
      setUsernameMessage('아이디를 입력해주세요.');
      return;
    }
    
    if (username.length < 4) {
      setUsernameMessage('아이디는 최소 4자 이상이어야 합니다.');
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameMessage('아이디는 영문, 숫자, 언더스코어(_)만 사용 가능합니다.');
      return;
    }
    
    try {
      setIsCheckingUsername(true);
      
      // Supabase 클라이언트 생성
      const supabase = createClient();
      
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
  
  // 닉네임 중복 확인
  const checkNickname = async () => {
    if (!nickname) {
      setNicknameMessage('닉네임을 입력해주세요.');
      return;
    }
    
    if (nickname.length < 2) {
      setNicknameMessage('닉네임은 최소 2자 이상이어야 합니다.');
      return;
    }
    
    if (!/^[a-zA-Z0-9가-힣_]+$/.test(nickname)) {
      setNicknameMessage('닉네임은 영문, 숫자, 한글, 언더스코어(_)만 사용 가능합니다.');
      return;
    }
    
    try {
      setIsCheckingNickname(true);
      
      // Supabase 클라이언트 생성
      const supabase = createClient();
      
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
    
    try {
      setIsLoading(true);
      
      const supabase = createClient();
      
      console.log('회원가입 시도:', { email, username, nickname, fullName });
      
      // 먼저 인증 계정 생성
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            username,
            full_name: fullName,
            nickname
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (authError) {
        console.error('인증 계정 생성 오류:', authError);
        throw authError;
      }
      
      console.log('회원가입 성공:', authData);
      
      // 인증 성공 후 프로필 생성
      if (authData.user) {
        const { error: createProfileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            username, 
            email,
            nickname,
            full_name: fullName,
            updated_at: new Date().toISOString()
          });
          
        if (createProfileError) {
          console.warn('프로필 생성 실패:', createProfileError);
        }
      }
      
      // 로그아웃 (중요)
      await supabase.auth.signOut();
      
      toast.success('회원가입이 완료되었습니다. 이메일 인증 링크를 확인해주세요.');
      
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (error: unknown) {
      console.error('회원가입 오류:', error);
      let errorMessage = '회원가입 중 오류가 발생했습니다.';
      
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = error.message as string || errorMessage;
      }
      
      toast.error(errorMessage);
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
        <h2 className="text-2xl font-bold text-left mb-2">SPORTS 멤버 ID를 생성하세요.</h2>
        <p className="text-gray-600 mb-8 text-left">
          모든 게이머들을 위한 SPORTS 커뮤니티에 오신 것을 환영합니다.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 이메일 입력 단계 */}
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-1 text-sm font-medium">이메일 주소</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    validateEmail(e.target.value);
                  }}
                  onBlur={() => validateEmail(email)}
                  className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 ${
                    emailError ? 'border-red-500 focus:ring-red-300' : 
                    emailValid ? 'border-green-500 focus:ring-green-300' : 
                    'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="이메일 주소"
                  required
                  disabled={showPasswordStep}
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
              {!showPasswordStep && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={handleEmailSubmit}
                    disabled={!emailValid || isLoading}
                    className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-800 text-white rounded-md transition-colors disabled:opacity-50"
                  >
                    {isLoading ? '처리 중...' : '계속하기'}
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* 비밀번호 입력 단계 */}
          {showPasswordStep && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">비밀번호</label>
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
                    className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 ${
                      passwordError ? 'border-red-500 focus:ring-red-300' : 
                      passwordValid ? 'border-green-500 focus:ring-green-300' : 
                      'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="비밀번호"
                    required
                    disabled={showProfileStep}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {passwordError}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">비밀번호 확인</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      validateConfirmPassword(e.target.value);
                    }}
                    onBlur={() => validateConfirmPassword(confirmPassword)}
                    className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 ${
                      confirmPasswordError ? 'border-red-500 focus:ring-red-300' : 
                      confirmPasswordValid ? 'border-green-500 focus:ring-green-300' : 
                      'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="비밀번호 확인"
                    required
                    disabled={showProfileStep}
                  />
                </div>
                {confirmPasswordError && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {confirmPasswordError}
                  </p>
                )}
              </div>
              
              {!showProfileStep && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={handlePasswordSubmit}
                    disabled={!passwordValid || !confirmPasswordValid || isLoading}
                    className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-800 text-white rounded-md transition-colors disabled:opacity-50"
                  >
                    {isLoading ? '처리 중...' : '계속하기'}
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* 프로필 정보 입력 단계 */}
          {showProfileStep && (
            <div className="space-y-4">
              {/* 아이디 필드 */}
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">아이디</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`flex-1 p-3 border rounded-md bg-white focus:outline-none focus:ring-2 ${
                      usernameChecked && !usernameAvailable ? 'border-red-500 focus:ring-red-300' : 
                      usernameChecked && usernameAvailable ? 'border-green-500 focus:ring-green-300' : 
                      'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="아이디"
                    required
                  />
                  <button
                    type="button"
                    onClick={checkUsername}
                    disabled={isCheckingUsername || !username}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md disabled:opacity-50"
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
              </div>
              
              {/* 이름 필드 */}
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">이름</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="이름"
                />
              </div>
              
              {/* 닉네임 필드 */}
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">닉네임</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className={`flex-1 p-3 border rounded-md bg-white focus:outline-none focus:ring-2 ${
                      nicknameChecked && !nicknameAvailable ? 'border-red-500 focus:ring-red-300' : 
                      nicknameChecked && nicknameAvailable ? 'border-green-500 focus:ring-green-300' : 
                      'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="닉네임"
                    required
                  />
                  <button
                    type="button"
                    onClick={checkNickname}
                    disabled={isCheckingNickname || !nickname}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md disabled:opacity-50"
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
              </div>
              
              <div className="mt-2">
                <button 
                  type="submit"
                  disabled={isLoading || !usernameChecked || !usernameAvailable || !nicknameChecked || !nicknameAvailable}
                  className="w-full p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-md transition-colors disabled:opacity-50 mt-4"
                >
                  {isLoading ? '처리 중...' : '계정 생성하기'}
                </button>
              </div>
            </div>
          )}
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            이미 계정이 있으신가요?{' '}
            <Link href="/signin" className="text-blue-600 hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
      
      <div className="mt-8 flex space-x-4 text-sm text-gray-500">
        <Link href="/terms" className="hover:text-gray-700">이용약관</Link>
        <Link href="/privacy" className="hover:text-gray-700">개인정보처리방침</Link>
      </div>
    </div>
  );
} 