import React from 'react';
import { Metadata } from 'next';
import '../globals.css';
import Link from 'next/link';
import Image from 'next/image';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://4590.co.kr';
const authTitle = '로그인 - 4590 Football';
const authDescription = '4590 Football 로그인, 회원가입, 계정 복구 등 인증 페이지입니다.';

export const metadata: Metadata = {
  title: {
    default: authTitle,
    template: '%s | 4590 Football',
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
    url: siteUrl + '/signin',
    siteName: '4590 Football',
    images: [
      {
        url: siteUrl + '/og-image.png',
        width: 1200,
        height: 630,
        alt: '4590 Football',
      },
    ],
    type: 'website',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: authTitle,
    description: authDescription,
    images: [siteUrl + '/og-image.png'],
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
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 
