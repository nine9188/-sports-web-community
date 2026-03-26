"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { sendPasswordResetLink } from '@/domains/auth/actions';
import { AlertCircle, Check, User } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import BrandingPanel from '../../components/BrandingPanel';

function FindPasswordContent() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const [usernameValid, setUsernameValid] = useState(false);
  const [usernameError, setUsernameError] = useState('');

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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username) {
      toast.error('아이디를 입력해주세요');
      return;
    }

    try {
      setLoading(true);
      const result = await sendPasswordResetLink(username);

      if (!result.success) {
        toast.error(result.error || '비밀번호 재설정 링크 발송에 실패했습니다.');
        return;
      }

      toast.success(result.message || '비밀번호 재설정 링크를 이메일로 발송했습니다.');
      router.push('/help/account-found?type=password');
    } catch (error) {
      console.error('비밀번호 재설정 오류:', error);
      toast.error('비밀번호 재설정 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const inputBaseClass = "w-full px-4 py-3 border rounded-lg outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] text-base transition-colors";

  return (
    <div className="w-full lg:w-1/2 max-w-md lg:max-w-none md:bg-white md:dark:bg-[#2D2D2D] md:rounded-lg lg:rounded-l-none md:shadow-lg md:border md:border-black/10 md:dark:border-white/10 lg:border-l-0 md:p-8 lg:p-14 flex flex-col justify-center">
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-[#F0F0F0] mb-2">비밀번호 찾기</h2>
          <p className="text-gray-600 dark:text-gray-400">
            아이디를 입력하시면 등록된 이메일로 재설정 링크를 보내드립니다.
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-gray-700 dark:text-gray-300 mb-1.5 text-[13px] font-medium">
              아이디
            </label>
            <div className="relative">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); validateUsername(e.target.value); }}
                onBlur={() => validateUsername(username)}
                className={`${inputBaseClass} pl-12 ${
                  usernameError ? 'border-red-500 dark:border-red-400' :
                  usernameValid ? 'border-green-500 dark:border-green-400' :
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
              <p className="mt-1 text-[13px] text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />{usernameError}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              등록된 이메일로 비밀번호 재설정 링크를 발송합니다.
            </p>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={loading || !usernameValid}
            className="w-full py-3 h-auto"
          >
            {loading ? '발송 중...' : '재설정 링크 받기'}
          </Button>
        </form>

        <div className="mt-8 text-center space-y-3">
          <p className="text-gray-600 dark:text-gray-400">
            아이디를 잊으셨나요?{' '}
            <Link href="/help/find-id" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline font-medium transition-colors">
              아이디 찾기
            </Link>
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            계정이 기억나셨나요?{' '}
            <Link href="/signin" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline font-medium transition-colors">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FindPasswordPage() {
  return (
    <div className="flex flex-col items-center lg:justify-center min-h-[calc(100vh-120px)]">
      <div className="flex flex-col lg:flex-row w-full max-w-md lg:max-w-full">
        <BrandingPanel variant="find-password" />
        <FindPasswordContent />
      </div>
      <div className="mt-8 flex space-x-4 text-[13px] text-gray-500 dark:text-gray-400">
        <Link href="/terms" className="hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline transition-colors">이용약관</Link>
        <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline transition-colors">개인정보처리방침</Link>
      </div>
    </div>
  );
}
