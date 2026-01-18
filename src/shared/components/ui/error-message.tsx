import React from 'react';
import Link from 'next/link';

interface ErrorMessageProps {
  title?: string;
  message: string;
  backLink?: string;
  backText?: string;
}

export default function ErrorMessage({
  title = '오류가 발생했습니다',
  message,
  backLink = '/',
  backText = '메인페이지로 이동'
}: ErrorMessageProps) {
  return (
    <div className="container mx-auto">
      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 p-6 text-center">
        <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-[#F0F0F0]">{title}</h2>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{message}</p>
        <Link
          href={backLink}
          className="inline-block bg-slate-800 dark:bg-[#3F3F3F] text-white hover:bg-slate-700 dark:hover:bg-[#4A4A4A] px-4 py-2 rounded text-sm transition-colors"
        >
          {backText}
        </Link>
      </div>
    </div>
  );
}
