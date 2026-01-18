"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useAuth } from '@/shared/context/AuthContext';
import { EyeIcon, EyeOffIcon, AlertCircle, Check } from 'lucide-react';
import { signIn, resendConfirmationByUsername } from '@/domains/auth/actions';
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

  // 이메일 인증 필요 상태
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);

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
  
  // 메시지 파라미터 처리 (한 번만 실행)
  useEffect(() => {
    if (message) {
      toast.info(decodeURIComponent(message).replace(/\+/g, ' '));
      // URL에서 message 파라미터 제거 (중복 토스트 방지)
      const url = new URL(window.location.href);
      url.searchParams.delete('message');
      window.history.replaceState({}, '', url.toString());
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

  // 이메일 인증 재발송
  const handleResendEmail = async () => {
    try {
      setResendingEmail(true);

      // 아이디로 이메일을 조회하여 인증 이메일 재발송
      const result = await resendConfirmationByUsername(username);

      if (result.success) {
        toast.success('인증 이메일을 재발송했습니다. 메일함을 확인해주세요.');
      } else {
        toast.error(result.error || '이메일 재발송에 실패했습니다.');
      }
    } catch (error) {
      console.error('이메일 재발송 오류:', error);
      toast.error('이메일 재발송 중 오류가 발생했습니다.');
    } finally {
      setResendingEmail(false);
    }
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
        // 이메일 미인증 상태 처리
        if (result.needsEmailConfirmation) {
          setNeedsEmailConfirmation(true);
          toast.warning('이메일 인증이 필요합니다.');
          return;
        }

        if (result.error.includes('Invalid login credentials')) {
          toast.error('아이디 또는 비밀번호가 올바르지 않습니다');
        } else {
          toast.error(result.error);
        }
        return;
      }

      // 로그인 성공 시 이메일 인증 상태 초기화
      setNeedsEmailConfirmation(false);

      // 로그인 성공 플래그를 sessionStorage에 저장 (토스트용)
      sessionStorage.setItem('login-success', 'true');

      // 로그인 성공 - 짧은 대기 후 리다이렉트하여 쿠키가 확실히 설정되도록 함
      await new Promise(resolve => setTimeout(resolve, 100));

      // router.push로 클라이언트 사이드 네비게이션
      router.push(redirectUrl);

      // 추가 안전장치: 1초 후에도 페이지가 변경되지 않았다면 강제 새로고침
      setTimeout(() => {
        if (window.location.pathname.includes('/signin')) {
          window.location.href = redirectUrl;
        }
      }, 1000);

    } catch (error: unknown) {
      console.error('로그인 오류:', error);
      toast.error('로그인 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full md:bg-white md:dark:bg-[#2D2D2D] md:rounded-2xl md:shadow-lg md:border md:border-black/10 md:dark:border-white/10 md:p-8">
      {/* 헤더 */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-[#F0F0F0] mb-2">4590 Football 로그인</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          모든 축구팬을 위한<br />
          4590 Football 커뮤니티에 오신 것을 환영합니다.
        </p>
      </div>

      {/* 콘텐츠 영역 - 최소 높이 설정 */}
      <div className="min-h-[400px]">
      
      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-1 text-sm font-medium">아이디</label>
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
              className={`w-full px-4 py-3 border rounded-md md:rounded-md max-md:rounded-lg outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] transition-colors ${
                usernameError ? 'border-red-500' :
                usernameValid ? 'border-green-500' :
                'border-black/7 dark:border-white/10 focus:border-black/10 dark:focus:border-white/20 focus:bg-[#F5F5F5] dark:focus:bg-[#262626]'
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
          <label className="block text-gray-700 dark:text-gray-300 mb-1 text-sm font-medium">비밀번호</label>
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
              className={`w-full px-4 py-3 border rounded-md md:rounded-md max-md:rounded-lg outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] transition-colors ${
                passwordError ? 'border-red-500' :
                passwordValid ? 'border-green-500' :
                'border-black/7 dark:border-white/10 focus:border-black/10 dark:focus:border-white/20 focus:bg-[#F5F5F5] dark:focus:bg-[#262626]'
              }`}
              placeholder="비밀번호"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
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
        
        <div className="flex items-center">
          <input
            id="remember-username"
            type="checkbox"
            checked={rememberUsername}
            onChange={() => setRememberUsername(!rememberUsername)}
            className="h-4 w-4 text-slate-600 border-gray-300 dark:border-white/10 rounded focus:ring-slate-500"
          />
          <label htmlFor="remember-username" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            아이디 기억하기
          </label>
        </div>

        {/* 이메일 미인증 안내 */}
        {needsEmailConfirmation && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  이메일 인증이 필요합니다
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  회원가입 시 입력한 이메일로 발송된 인증 메일을 확인해주세요.
                </p>
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={resendingEmail}
                  className="mt-2 text-xs text-yellow-800 dark:text-yellow-200 hover:underline disabled:opacity-50"
                >
                  {resendingEmail ? '발송 중...' : '인증 이메일 재발송'}
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !usernameValid || !passwordValid}
          className="w-full py-3 px-4 bg-slate-800 dark:bg-[#3F3F3F] hover:bg-slate-700 dark:hover:bg-[#4A4A4A] text-white font-medium rounded-md transition-colors disabled:opacity-50"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>

        {/* 아이디/비밀번호 찾기 */}
        <div className="mt-4 text-center text-gray-600 dark:text-gray-400">
          <Link href="/help/account-recovery?tab=id" className="hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline text-sm transition-colors">
            아이디 찾기
          </Link>
          <span className="mx-2">ㅣ</span>
          <Link href="/help/account-recovery?tab=password" className="hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline text-sm transition-colors">
            비밀번호 찾기
          </Link>
        </div>
      </form>

      {/* 소셜 로그인 구분선 */}
      <div className="mt-6 mb-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-black/7 dark:border-white/10" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-[#1F1F1F] md:dark:bg-[#2D2D2D] text-gray-500 dark:text-gray-400">또는</span>
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
          <p className="text-gray-600 dark:text-gray-400">
            아직 4590 Football 회원이 아니신가요?{' '}
            <Link href="/signup" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline font-medium transition-colors">
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
    <div className="flex flex-col justify-center items-center min-h-[calc(100vh-120px)]">
      <Suspense fallback={
        <div className="max-w-md w-full">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      }>
        <LoginContent />
      </Suspense>
      <div className="mt-8 flex space-x-4 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/terms" className="hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline transition-colors">이용약관</Link>
        <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline transition-colors">개인정보처리방침</Link>
      </div>
    </div>
  );
} 