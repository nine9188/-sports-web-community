import React from 'react';
import { Metadata } from 'next';
import '../globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'SPORTS 인증',
  description: 'SPORTS 인증 페이지',
};

/**
 * 인증 페이지용 특수 레이아웃
 * 기본 RootLayout 내에서 사용되지만, 
 * 헤더, 사이드바 등이 표시되지 않는 단순한 레이아웃을 제공합니다.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <div className="p-4">
        <div className="mb-8">
          <Link href="/" className="inline-block">
            <div className="flex items-center">
              <span className="text-3xl font-bold">SPORTS</span>
              <span className="ml-1 px-2 py-1 bg-gray-200 text-xs font-semibold rounded">Member</span>
            </div>
          </Link>
        </div>
        <div className="flex justify-center">
          {children}
        </div>
      </div>
    </div>
  );
} 