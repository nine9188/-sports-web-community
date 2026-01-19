"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { validateResetToken, resetPasswordWithToken } from '@/domains/auth/actions';
import Link from 'next/link';
import { EyeIcon, EyeOffIcon, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/shared/components/ui';

// SearchParams를 사용하는 컴포넌트 분리
function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  // 비밀번호 표시 상태
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 유효성 검사 상태
  const [passwordValid, setPasswordValid] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordValid, setConfirmPasswordValid] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // 컴포넌트 마운트 시 토큰 검증
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenValid(false);
        toast.error('유효하지 않은 재설정 링크입니다.');
        return;
      }

      try {
        const result = await validateResetToken(token);
        if (result.success) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          toast.error(result.error || '유효하지 않은 재설정 링크입니다.');
        }
      } catch (error) {
        console.error('토큰 검증 오류:', error);
        setTokenValid(false);
        toast.error('링크 검증 중 오류가 발생했습니다.');
      }
    };

    verifyToken();
  }, [token]);

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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('유효하지 않은 재설정 링크입니다.');
      return;
    }

    if (!password || !confirmPassword) {
      toast.error('모든 필드를 입력해주세요');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다');
      return;
    }

    if (password.length < 6) {
      toast.error('비밀번호는 최소 6자 이상이어야 합니다');
      return;
    }

    try {
      setLoading(true);

      // 자체 구현한 비밀번호 재설정 서버 액션 사용
      const result = await resetPasswordWithToken(token, password);

      if (!result.success) {
        toast.error(result.error || '비밀번호 변경에 실패했습니다.');
        return;
      }

      toast.success(result.message || '비밀번호가 성공적으로 변경되었습니다');
      setTimeout(() => {
        router.push('/signin?message=비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.');
      }, 2000);

    } catch (error) {
      console.error('비밀번호 재설정 오류:', error);
      toast.error('비밀번호 변경 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 토큰이 유효하지 않은 경우 에러 표시
  if (tokenValid === false) {
    return (
      <div className="max-w-md w-full">
        {/* 고정 헤더 */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-left mb-2 text-gray-900 dark:text-[#F0F0F0]">
            링크가 만료되었습니다
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-left">
            비밀번호 재설정 링크가 만료되었거나 유효하지 않습니다.
          </p>
        </div>

        {/* 콘텐츠 영역 - 최소 높이 설정 */}
        <div className="min-h-[400px]">

        <div className="space-y-6">
          <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/50">
            <div className="flex items-center mb-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
              <span className="text-sm font-medium text-red-800 dark:text-red-300">링크 만료</span>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300">
              재설정 링크는 30분간만 유효합니다.<br/>
              새로운 재설정 링크를 요청해주세요.
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/help/account-recovery?tab=password" className="block">
              <Button variant="primary" className="w-full py-3 h-auto">
                새 재설정 링크 요청
              </Button>
            </Link>
            <Link href="/signin" className="block">
              <Button variant="outline" className="w-full py-3 h-auto">
                로그인하기
              </Button>
            </Link>
          </div>

            <div className="mt-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                처음 방문이신가요?{' '}
                <Link href="/signup" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline font-medium">
                  회원가입
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 토큰 검증 중인 경우 로딩 표시
  if (tokenValid === null) {
    return (
      <div className="max-w-md w-full">
        <div className="animate-pulse">
          <div className="h-8 bg-[#F5F5F5] dark:bg-[#262626] rounded w-48 mb-2"></div>
          <div className="h-4 bg-[#F5F5F5] dark:bg-[#262626] rounded w-full mb-2"></div>
          <div className="h-4 bg-[#F5F5F5] dark:bg-[#262626] rounded w-3/4 mb-8"></div>
          <div className="space-y-4">
            <div className="h-12 bg-[#F5F5F5] dark:bg-[#262626] rounded"></div>
            <div className="h-12 bg-[#F5F5F5] dark:bg-[#262626] rounded"></div>
            <div className="h-12 bg-[#F5F5F5] dark:bg-[#262626] rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full">
      {/* 고정 헤더 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-left mb-2 text-gray-900 dark:text-[#F0F0F0]">
          새 비밀번호 설정
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 text-left">
          새로운 비밀번호를 입력해주세요.
        </p>
      </div>

      {/* 콘텐츠 영역 - 최소 높이 설정 */}
      <div className="min-h-[400px]">

      <form onSubmit={handleResetPassword} className="space-y-6">
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-1 text-sm font-medium">
            새 비밀번호
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                validatePassword(e.target.value);
                // 비밀번호가 변경되면 확인 비밀번호도 다시 검증
                if (confirmPassword) {
                  validateConfirmPassword(confirmPassword);
                }
              }}
              onBlur={() => validatePassword(password)}
              className={`w-full px-4 py-3 border rounded-md md:rounded-md max-md:rounded-lg outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] transition-colors ${
                passwordError ? 'border-red-500' :
                passwordValid ? 'border-green-500' :
                'border-black/7 dark:border-white/10 focus:border-black/10 dark:focus:border-white/20 focus:bg-[#F5F5F5] dark:focus:bg-[#262626]'
              }`}
              placeholder="새 비밀번호 (최소 6자)"
              required
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              {passwordValid && !passwordError && (
                <Check className="h-5 w-5 text-green-500" />
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOffIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
          {passwordError && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {passwordError}
            </p>
          )}
        </div>

        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-1 text-sm font-medium">
            새 비밀번호 확인
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                validateConfirmPassword(e.target.value);
              }}
              onBlur={() => validateConfirmPassword(confirmPassword)}
              className={`w-full px-4 py-3 border rounded-md md:rounded-md max-md:rounded-lg outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] transition-colors ${
                confirmPasswordError ? 'border-red-500' :
                confirmPasswordValid ? 'border-green-500' :
                'border-black/7 dark:border-white/10 focus:border-black/10 dark:focus:border-white/20 focus:bg-[#F5F5F5] dark:focus:bg-[#262626]'
              }`}
              placeholder="새 비밀번호 확인"
              required
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              {confirmPasswordValid && !confirmPasswordError && (
                <Check className="h-5 w-5 text-green-500" />
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOffIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
          {confirmPasswordError && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {confirmPasswordError}
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full py-3 h-auto"
          disabled={loading || !passwordValid || !confirmPasswordValid}
        >
          {loading ? '처리 중...' : '비밀번호 변경'}
        </Button>
      </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            비밀번호가 기억나셨나요?{' '}
            <Link href="/signin" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline font-medium">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// 메인 페이지 컴포넌트
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md w-full">
        <div className="animate-pulse">
          <div className="h-8 bg-[#F5F5F5] dark:bg-[#262626] rounded w-48 mb-2"></div>
          <div className="h-4 bg-[#F5F5F5] dark:bg-[#262626] rounded w-full mb-2"></div>
          <div className="h-4 bg-[#F5F5F5] dark:bg-[#262626] rounded w-3/4 mb-8"></div>
          <div className="space-y-4">
            <div className="h-12 bg-[#F5F5F5] dark:bg-[#262626] rounded"></div>
            <div className="h-12 bg-[#F5F5F5] dark:bg-[#262626] rounded"></div>
            <div className="h-12 bg-[#F5F5F5] dark:bg-[#262626] rounded"></div>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
