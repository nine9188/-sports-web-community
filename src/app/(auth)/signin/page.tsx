"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useAuth } from '@/shared/context/AuthContext';
import { EyeIcon, EyeOffIcon, AlertCircle, Check } from 'lucide-react';
import { signIn } from '@/domains/auth/actions';

// SearchParams를 사용하는 로그인 컴포넌트
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get('redirect') || searchParams?.get('redirect_url') || '/';
  const message = searchParams?.get('message');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);
  
  // 유효성 검사 상태
  const [emailValid, setEmailValid] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordValid, setPasswordValid] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  const { user } = useAuth();
  
  // 컴포넌트 마운트 시 저장된 이메일 불러오기
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered-email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
      validateEmail(savedEmail);
    }
  }, []);
  
  // 메시지 파라미터 처리
  useEffect(() => {
    if (message) {
      toast.info(decodeURIComponent(message).replace(/\+/g, ' '));
    }
  }, [message]);
  
  // 로그인 상태 감지 및 리디렉션
  useEffect(() => {
    if (user && !loading) {
      const redirectUrl = searchParams?.get('redirect') || '/';
      router.replace(redirectUrl);
    }
  }, [user, loading, router, searchParams]);
  
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
  
  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (!isEmailValid || !isPasswordValid) {
      return;
    }
    
    try {
      setLoading(true);
      
      // 이메일 기억하기 처리
      if (rememberEmail) {
        localStorage.setItem('remembered-email', email);
      } else {
        localStorage.removeItem('remembered-email');
      }
      
      // 서버 액션을 통한 로그인
      const result = await signIn(email, password);
      
      if (result.error) {
        if (result.error.includes('Invalid login credentials')) {
          toast.error('이메일 또는 비밀번호가 올바르지 않습니다');
        } else {
          toast.error(result.error);
        }
        return;
      }
      
      // 로그인 성공 플래그를 sessionStorage에 저장 (새로고침 후 토스트용)
      sessionStorage.setItem('login-success', 'true');
      
      // 로그인 성공 후 즉시 페이지 새로고침으로 AuthContext 업데이트 보장
      if (redirectUrl && redirectUrl !== window.location.pathname) {
        window.location.href = redirectUrl;
      } else {
        window.location.reload();
      }
      
    } catch (error: unknown) {
      console.error('로그인 오류:', error);
      toast.error('로그인 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full">
      <h2 className="text-2xl font-bold text-left mb-2">SPORTS 멤버 로그인</h2>
      <p className="text-gray-600 mb-8 text-left">
        모든 게이머들을 위한 SPORTS 커뮤니티에 오신 것을 환영합니다.
      </p>
      
      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label className="block text-gray-700 mb-1 text-sm font-medium">이메일 주소</label>
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
              className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 ${
                emailError ? 'border-red-500 focus:ring-red-300' : 
                emailValid ? 'border-green-500 focus:ring-green-300' : 
                'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="이메일 주소"
              required
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
        </div>
        
        <div>
          <label className="block text-gray-700 mb-1 text-sm font-medium">비밀번호</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                validatePassword(e.target.value);
              }}
              onBlur={() => validatePassword(password)}
              className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 ${
                passwordError ? 'border-red-500 focus:ring-red-300' : 
                passwordValid ? 'border-green-500 focus:ring-green-300' : 
                'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="비밀번호"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              onClick={handleTogglePassword}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOffIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          {passwordError && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {passwordError}
            </p>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-email"
              type="checkbox"
              checked={rememberEmail}
              onChange={() => setRememberEmail(!rememberEmail)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="remember-email" className="ml-2 block text-sm text-gray-700">
              이메일 기억하기
            </label>
          </div>
          
          <Link href="/help/recovery" className="text-sm text-blue-600 hover:underline">
            비밀번호 찾기
          </Link>
        </div>
        
        <button
          type="submit"
          disabled={loading || !emailValid || !passwordValid}
          className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-800 text-white font-medium rounded-md transition-colors disabled:opacity-50"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
      
      <div className="mt-8 text-center">
        <p className="text-gray-600">
          아직 SPORTS Member가 아니신가요?{' '}
          <Link href="/signup" className="text-blue-600 hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100vh-120px)]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
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
          <LoginContent />
        </Suspense>
      </div>
    </div>
  );
} 