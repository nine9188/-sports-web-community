import React from 'react';
import '../globals.css';
import Link from 'next/link';
import Image from 'next/image';
import { siteConfig } from '@/shared/config';
import { buildMetadata } from '@/shared/utils/metadataNew';

export async function generateMetadata() {
  return buildMetadata({
    title: '로그인',
    description: '로그인, 회원가입, 계정 복구 등 인증 페이지입니다.',
    path: '/signin',
    noindex: true,
  });
}

/**
 * 인증 페이지용 특수 레이아웃
 * 로그인/회원가입/계정찾기 등 모든 인증 관련 페이지에서 동일한 스타일을 제공합니다.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen bg-white dark:bg-[#1F1F1F] flex flex-col overflow-hidden">
      {/* 로고 헤더 - 고정 높이 */}
      <div className="px-4 py-4 sm:px-6 sm:py-5 flex-shrink-0">
        <Link href="/" className="inline-block">
          <div className="flex items-center gap-2">
            <Image
              src={siteConfig.logo}
              alt="로고"
              width={124}
              height={60}
              priority
              className="h-10 sm:h-14 w-auto dark:invert"
            />
            <span className="ml-1 px-2 py-1 bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] text-xs font-semibold rounded border border-black/7 dark:border-transparent">Member</span>
          </div>
        </Link>
      </div>

      {/* 콘텐츠 - 남은 공간 채움 */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 pb-6">
        <div className="w-full max-w-md lg:max-w-[1000px]">
          {children}
        </div>
      </div>
    </div>
  );
}
