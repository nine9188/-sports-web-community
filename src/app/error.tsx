'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="container mx-auto min-h-[60vh] flex items-center justify-center">
      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 p-8 text-center max-w-md">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-xl font-semibold mb-3 text-gray-900 dark:text-[#F0F0F0]">
          문제가 발생했습니다
        </h1>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
          일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            오류 코드: {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-block bg-[#262626] dark:bg-[#3F3F3F] text-white hover:bg-[#3F3F3F] dark:hover:bg-[#4A4A4A] px-4 py-2 rounded text-sm transition-colors"
          >
            다시 시도
          </button>
          <a
            href="/"
            className="inline-block border border-black/7 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] px-4 py-2 rounded text-sm transition-colors"
          >
            메인페이지로 이동
          </a>
        </div>
      </div>
    </div>
  );
}
