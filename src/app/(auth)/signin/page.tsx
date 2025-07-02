"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useAuth } from '@/shared/context/AuthContext';
import { EyeIcon, EyeOffIcon, AlertCircle, Check } from 'lucide-react';
import { signIn } from '@/domains/auth/actions';
import KakaoLoginButton from '@/domains/auth/components/KakaoLoginButton';

// SearchParams를 사용하는 로그인 컴포넌트
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get('redirect') || searchParams?.get('redirect_url') || '/';
  const message = searchParams?.get('message');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberUsername, setRememberUsername] = useState(false);
  
  // 유효성 검사 상태
  const [usernameValid, setUsernameValid] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [passwordValid, setPasswordValid] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  const { user } = useAuth();
  
  // 컴포넌트 마운트 시 저장된 아이디 불러오기
  useEffect(() => {
    const savedUsername = localStorage.getItem('remembered-username');
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberUsername(true);
      validateUsername(savedUsername);
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
    
    const isUsernameValid = validateUsername(username);
    const isPasswordValid = validatePassword(password);
    
    if (!isUsernameValid || !isPasswordValid) {
      return;
    }
    
    try {
      setLoading(true);
      
      // 아이디 기억하기 처리
      if (rememberUsername) {
        localStorage.setItem('remembered-username', username);
      } else {
        localStorage.removeItem('remembered-username');
      }
      
      // 서버 액션을 통한 로그인 (아이디로)
      const result = await signIn(username, password);
      
      if (result.error) {
        if (result.error.includes('Invalid login credentials')) {
          toast.error('아이디 또는 비밀번호가 올바르지 않습니다');
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
      {/* 고정 헤더 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-left mb-2">SPORTS 멤버 로그인</h2>
        <p className="text-gray-600 mb-8 text-left">
          모든 게이머들을 위한 SPORTS 커뮤니티에 오신 것을 환영합니다.
        </p>
      </div>

      {/* 콘텐츠 영역 - 최소 높이 설정 */}
      <div className="min-h-[400px]">
      
      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label className="block text-gray-700 mb-1 text-sm font-medium">아이디</label>
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
              className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 ${
                usernameError ? 'border-red-500 focus:ring-red-300' : 
                usernameValid ? 'border-green-500 focus:ring-green-300' : 
                'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="아이디"
              required
            />
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
              id="remember-username"
              type="checkbox"
              checked={rememberUsername}
              onChange={() => setRememberUsername(!rememberUsername)}
              className="h-4 w-4 text-slate-600 border-gray-300 rounded focus:ring-slate-500"
            />
            <label htmlFor="remember-username" className="ml-2 block text-sm text-gray-700">
              아이디 기억하기
            </label>
          </div>
          
          <div className="flex flex-col items-end space-y-1">
            <Link href="/help/account-recovery?tab=id" className="text-xs text-gray-500 hover:text-slate-600 hover:underline">
              아이디 찾기
            </Link>
            <Link href="/help/account-recovery?tab=password" className="text-sm text-slate-600 hover:text-slate-800 hover:underline">
              비밀번호 찾기
            </Link>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading || !usernameValid || !passwordValid}
          className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-800 text-white font-medium rounded-md transition-colors disabled:opacity-50"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      {/* 소셜 로그인 구분선 */}
      <div className="mt-6 mb-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">또는</span>
          </div>
        </div>
      </div>

      {/* 카카오 로그인 */}
      <div className="mb-6">
        <KakaoLoginButton 
          disabled={loading}
          onLoading={setLoading}
        />
      </div>
      
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            아직 SPORTS Member가 아니신가요?{' '}
            <Link href="/signup" className="text-slate-600 hover:text-slate-800 hover:underline font-medium">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
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
      <LoginContent />
    </Suspense>
  );
} 