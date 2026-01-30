import React from 'react';
import '../globals.css';

/**
 * 에러 페이지용 독립 레이아웃
 * 404 등 에러 페이지에서 헤더/사이드바 없이 간소화된 페이지를 제공합니다.
 */
export default function ErrorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-[#f8f9fa] dark:bg-[#000000] flex items-center justify-center py-8">
      <div className="w-full max-w-3xl px-6">
        {children}
      </div>
    </div>
  );
}
