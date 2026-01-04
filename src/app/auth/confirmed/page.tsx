"use client";

import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle } from 'lucide-react';
import { useEffect } from 'react';
import { createClient } from '@/shared/api/supabase';

export default function EmailConfirmedPage() {
  // 자동 로그인 방지: 세션이 있으면 로그아웃
  useEffect(() => {
    const preventAutoLogin = async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
    };
    preventAutoLogin();
  }, []);

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
                회원가입이 완료되었습니다.<br />
                이제 로그인하여 서비스를 이용하실 수 있습니다.
              </p>

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
        </div>
      </div>
    </div>
  );
}
