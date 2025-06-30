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
 * 로그인/회원가입/계정찾기 등 모든 인증 관련 페이지에서 동일한 스타일을 제공합니다.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 py-6 sm:p-6">
        <div className="mb-6 sm:mb-8">
          <Link href="/" className="inline-block">
            <div className="flex items-center">
              <span className="text-2xl sm:text-3xl font-bold">SPORTS</span>
              <span className="ml-1 px-2 py-1 bg-gray-200 text-xs font-semibold rounded">Member</span>
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