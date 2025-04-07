"use client";

import { useEffect, useState } from 'react';

export default function AuthCallbackPage() {
  const [message] = useState('인증이 완료되었습니다. 로그인 페이지로 이동합니다...');

  useEffect(() => {
    // 복잡한 인증 처리 없이 간단하게 메시지 표시 후 이동
    const timer = setTimeout(() => {
      window.location.href = '/signin';
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-2xl font-bold">이메일 인증</h2>
          <p className="mt-4 text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  );
} 