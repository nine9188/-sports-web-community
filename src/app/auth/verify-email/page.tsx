"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { verifyEmailWithToken } from '@/domains/auth/actions';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('유효하지 않은 인증 링크입니다.');
        return;
      }

      try {
        const result = await verifyEmailWithToken(token);

        if (result.success) {
          setStatus('success');
          setMessage(result.message || '이메일 인증이 완료되었습니다.');
        } else {
          setStatus('error');
          setMessage(result.error || '이메일 인증에 실패했습니다.');
        }
      } catch (error) {
        console.error('이메일 인증 오류:', error);
        setStatus('error');
        setMessage('이메일 인증 중 오류가 발생했습니다.');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#1F1F1F]">
      <div className="px-4 py-6 sm:p-6">
        <div className="mb-6 sm:mb-8">
          <Link href="/" className="inline-block">
            <div className="flex items-center gap-2">
              <Image
                src="/logo/4590 로고2 이미지크기 275X200 누끼제거 버전.png"
                alt="로고"
                width={124}
                height={60}
                priority
                className="h-14 w-auto dark:invert"
              />
              <span className="ml-1 px-2 py-1 bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] text-xs font-semibold rounded border border-black/7 dark:border-transparent">Member</span>
            </div>
          </Link>
        </div>
        <div className="flex flex-col justify-center items-center min-h-[calc(100vh-140px)] sm:min-h-[calc(100vh-120px)]">
          <div className="w-full max-w-md px-2 sm:px-0">
            <div className="max-w-md w-full">
              {/* 로딩 상태 */}
              {status === 'loading' && (
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-[#F5F5F5] dark:bg-[#262626] flex items-center justify-center">
                      <Loader2 className="w-10 h-10 text-gray-500 dark:text-gray-400 animate-spin" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-[#F0F0F0]">
                    이메일 인증 중...
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    잠시만 기다려주세요.
                  </p>
                </div>
              )}

              {/* 성공 상태 */}
              {status === 'success' && (
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-[#F0F0F0]">
                    이메일 인증 완료!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-8">
                    {message}<br />
                    이제 로그인하여 서비스를 이용하실 수 있습니다.
                  </p>

                  <div className="min-h-[300px]">
                    <div className="p-6 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg border border-black/7 dark:border-white/10 mb-6">
                      <div className="flex items-center mb-3">
                        <Mail className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">인증 완료</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        회원가입이 완료되었습니다.<br />
                        로그인 후 다양한 서비스를 이용해보세요!
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Link href="/signin" className="block">
                        <button className="w-full py-3 px-4 bg-slate-800 dark:bg-[#3F3F3F] hover:bg-slate-700 dark:hover:bg-[#4A4A4A] text-white font-medium rounded-md transition-colors">
                          로그인하기
                        </button>
                      </Link>
                      <Link href="/" className="block">
                        <button className="w-full py-3 px-4 border border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] hover:bg-[#F5F5F5] dark:hover:bg-[#262626] font-medium rounded-md transition-colors">
                          메인으로
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* 에러 상태 */}
              {status === 'error' && (
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-[#F0F0F0]">
                    인증 실패
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-8">
                    {message}
                  </p>

                  <div className="min-h-[300px]">
                    <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/50 mb-6">
                      <div className="flex items-center mb-3">
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                        <span className="text-sm font-medium text-red-800 dark:text-red-300">인증 실패</span>
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        인증 링크가 만료되었거나 유효하지 않습니다.<br />
                        새로운 인증 이메일을 요청해주세요.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Link href="/signin" className="block">
                        <button className="w-full py-3 px-4 bg-slate-800 dark:bg-[#3F3F3F] hover:bg-slate-700 dark:hover:bg-[#4A4A4A] text-white font-medium rounded-md transition-colors">
                          로그인 페이지로
                        </button>
                      </Link>
                      <Link href="/signup" className="block">
                        <button className="w-full py-3 px-4 border border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] hover:bg-[#F5F5F5] dark:hover:bg-[#262626] font-medium rounded-md transition-colors">
                          회원가입
                        </button>
                      </Link>
                    </div>

                    <div className="mt-8 text-center">
                      <p className="text-gray-600 dark:text-gray-400">
                        도움이 필요하신가요?{' '}
                        <Link href="/help/account-recovery" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline font-medium">
                          계정 찾기
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-[#1F1F1F] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-gray-500 dark:text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">로딩 중...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
