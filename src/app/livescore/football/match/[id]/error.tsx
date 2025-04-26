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
    console.error('경기 정보 에러:', error);
  }, [error]);

  return (
    <div className="bg-white rounded-lg shadow-sm text-center p-6">
      <h2 className="text-xl font-semibold text-red-600">오류 발생</h2>
      <p className="text-gray-700">경기 정보를 불러오는데 실패했습니다.</p>
      <p className="text-gray-600">API 서버에 연결할 수 없거나 요청한 데이터가 존재하지 않습니다.</p>
      <div className="flex justify-center gap-2 mt-4">
        <button 
          onClick={() => reset()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          다시 시도
        </button>
        <a 
          href="/livescore/football"
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
        >
          라이브스코어 홈으로
        </a>
      </div>
    </div>
  );
} 