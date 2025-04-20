import React from 'react';
import { Metadata } from 'next';
import '../globals.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '스포츠 쇼츠',
  description: '스포츠 하이라이트 쇼츠 영상',
};

/**
 * 쇼츠 페이지용 특수 레이아웃
 * 기본 RootLayout을 통해 렌더링되지만, 
 * 헤더, 사이드바 등이 표시되지 않는 단순한 레이아웃을 제공합니다.
 */
export default function ShortsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-white text-black overflow-hidden">
      {children}
    </div>
  );
} 