import React from 'react';
import { Metadata } from 'next';
import '../globals.css';
import Link from 'next/link';
import Image from 'next/image';
import { siteConfig } from '@/shared/config';

const authTitle = `로그인 - ${siteConfig.name}`;
const authDescription = `${siteConfig.name} 로그인, 회원가입, 계정 복구 등 인증 페이지입니다.`;

export const metadata: Metadata = {
  title: {
    default: authTitle,
    template: `%s - ${siteConfig.name}`,
  },
  description: authDescription,
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  openGraph: {
    title: authTitle,
    description: authDescription,
    url: siteConfig.getUrl('/signin'),
    siteName: siteConfig.name,
    images: [siteConfig.getDefaultOgImageObject(siteConfig.name)],
    type: 'website',
    locale: siteConfig.locale,
  },
  twitter: {
    card: 'summary_large_image',
    title: authTitle,
    description: authDescription,
    images: [siteConfig.defaultOgImage],
  },
};

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
    <div className="min-h-screen bg-white dark:bg-[#1F1F1F]">
      <div className="px-4 py-6 sm:p-6">
        <div className="mb-6 sm:mb-8">
          <Link href="/" className="inline-block">
            <div className="flex items-center gap-2">
              <Image
                src={siteConfig.logo}
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
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 
