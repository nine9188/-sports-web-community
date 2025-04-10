'use client';

// 로딩 스피너 컴포넌트
export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-10">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
} 