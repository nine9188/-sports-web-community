"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useAuth } from '@/shared/context/AuthContext';
import { EyeIcon, EyeOffIcon, AlertCircle, Check } from 'lucide-react';
import { signIn, resendConfirmationByUsername, signInWithKakao, signInWithGoogle, signInWithDiscord, signInWithApple } from '@/domains/auth/actions';
import { Button } from '@/shared/components/ui';
import BrandingPanel from '../components/BrandingPanel';

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

  // 소셜 로그인 공통 핸들러
  const handleSocialLogin = async (provider: 'kakao' | 'google' | 'discord' | 'apple') => {
    if (loading) return;
    const providerMap = { kakao: signInWithKakao, google: signInWithGoogle, discord: signInWithDiscord, apple: signInWithApple };
    const nameMap = { kakao: '카카오', google: '구글', discord: '디스코드', apple: 'Apple' };
    try {
      setLoading(true);
      const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;
      const result = await providerMap[provider](redirectTo);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error(`${nameMap[provider]} 로그인 오류:`, error);
      toast.error(`${nameMap[provider]} 로그인 중 오류가 발생했습니다.`);
    } finally {
      setLoading(false);
    }
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
    <div className="w-full lg:w-1/2 max-w-md lg:max-w-none md:bg-white md:dark:bg-[#2D2D2D] md:rounded-lg lg:rounded-l-none md:shadow-lg md:border md:border-black/10 md:dark:border-white/10 lg:border-l-0 md:p-8 lg:p-14 flex flex-col justify-center">
      {/* 헤더 - 모바일에서만 표시 (데스크톱은 브랜딩 패널에 포함) */}
      <div className="text-center mb-6 lg:hidden">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-[#F0F0F0] mb-2">4590 Football 로그인</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          모든 축구팬을 위한<br />
          4590 Football 커뮤니티에 오신 것을 환영합니다.
        </p>
      </div>

      <div>
      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-1.5 text-sm font-medium">아이디</label>
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
              className={`w-full px-4 py-3 border rounded-lg outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] text-[15px] transition-colors ${
                usernameError ? 'border-red-500 dark:border-red-400' :
                usernameValid ? 'border-green-500 dark:border-green-400' :
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
          <label className="block text-gray-700 dark:text-gray-300 mb-1.5 text-sm font-medium">비밀번호</label>
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
              className={`w-full px-4 py-3 border rounded-lg outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] text-[15px] transition-colors ${
                passwordError ? 'border-red-500 dark:border-red-400' :
                passwordValid ? 'border-green-500 dark:border-green-400' :
                'border-black/7 dark:border-white/10 focus:border-black/10 dark:focus:border-white/20 focus:bg-[#F5F5F5] dark:focus:bg-[#262626]'
              }`}
              placeholder="비밀번호"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 text-gray-500 dark:text-gray-400"
              onClick={handleTogglePassword}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOffIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </Button>
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
            className="h-4 w-4 text-gray-600 border-black/7 dark:border-white/10 rounded focus:ring-gray-500"
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
                <Button
                  type="button"
                  variant="link"
                  onClick={handleResendEmail}
                  disabled={resendingEmail}
                  className="mt-2 p-0 h-auto text-xs text-yellow-800 dark:text-yellow-200"
                >
                  {resendingEmail ? '발송 중...' : '인증 이메일 재발송'}
                </Button>
              </div>
            </div>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          disabled={loading || !usernameValid || !passwordValid}
          className="w-full py-3 h-auto"
        >
          {loading ? '로그인 중...' : '로그인'}
        </Button>

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

      {/* 소셜 로그인 아이콘 */}
      <div className="flex justify-center items-center gap-4 mb-6">
        {/* 카카오 */}
        <button
          type="button"
          onClick={() => handleSocialLogin('kakao')}
          disabled={loading}
          className="w-12 h-12 rounded-full bg-[#FEE500] hover:bg-[#FFEB00] flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="카카오 로그인"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#3C1E1E">
            <path d="M12 3C6.486 3 2 6.262 2 10.5c0 2.665 1.678 5.012 4.233 6.414l-1.017 3.742c-.08.295.195.578.49.506l4.146-1.024C10.557 20.464 11.269 20.5 12 20.5c5.514 0 10-3.262 10-7.5S17.514 3 12 3z"/>
          </svg>
        </button>

        {/* 구글 */}
        <button
          type="button"
          onClick={() => handleSocialLogin('google')}
          disabled={loading}
          className="w-12 h-12 rounded-full bg-white dark:bg-[#2D2D2D] border border-gray-200 dark:border-white/15 hover:bg-gray-50 dark:hover:bg-[#333] flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="구글 로그인"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        </button>

        {/* 디스코드 */}
        <button
          type="button"
          onClick={() => handleSocialLogin('discord')}
          disabled={loading}
          className="w-12 h-12 rounded-full bg-[#5865F2] hover:bg-[#4752C4] flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="디스코드 로그인"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
        </button>

        {/* 애플 */}
        <button
          type="button"
          onClick={() => handleSocialLogin('apple')}
          disabled={loading}
          className="w-12 h-12 rounded-full bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Apple 로그인"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white" className="dark:fill-black">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
        </button>
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
      {/* 브랜딩 + 폼 카드 */}
      <div className="flex w-full max-w-md lg:max-w-full">
        <BrandingPanel />
        <Suspense fallback={
          <div className="w-full lg:w-1/2 max-w-md lg:max-w-none md:bg-white md:dark:bg-[#2D2D2D] md:rounded-lg lg:rounded-l-none md:shadow-lg md:border md:border-black/10 md:dark:border-white/10 lg:border-l-0 md:p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-[#EAEAEA] dark:bg-[#333333] rounded w-48 mb-2"></div>
              <div className="h-4 bg-[#EAEAEA] dark:bg-[#333333] rounded w-full mb-2"></div>
              <div className="h-4 bg-[#EAEAEA] dark:bg-[#333333] rounded w-3/4 mb-8"></div>
              <div className="space-y-4">
                <div className="h-12 bg-[#EAEAEA] dark:bg-[#333333] rounded"></div>
                <div className="h-12 bg-[#EAEAEA] dark:bg-[#333333] rounded"></div>
                <div className="h-12 bg-[#EAEAEA] dark:bg-[#333333] rounded"></div>
              </div>
            </div>
          </div>
        }>
          <LoginContent />
        </Suspense>
      </div>
      <div className="mt-8 flex space-x-4 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/terms" className="hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline transition-colors">이용약관</Link>
        <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline transition-colors">개인정보처리방침</Link>
      </div>
    </div>
  );
} 