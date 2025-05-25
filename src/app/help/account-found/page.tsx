"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// 계정 정보 인터페이스 정의
interface AccountInfo {
  nickname: string;
  lastAccess: string;
  username?: string;
  full_name?: string;
}

// SearchParams를 사용하는 컴포넌트 분리
function AccountFoundContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams?.get('type') || 'id';
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  
  useEffect(() => {
    // URL 파라미터가 올바른지 확인
    if (type !== 'id' && type !== 'password') {
      router.push('/help/account-recovery');
      return;
    }
    
    // 실제 구현에서는 이메일 링크로부터 토큰을 받아 서버에서 계정 정보를 가져옴
    // 여기서는 더미 데이터를 사용
    if (type === 'id') {
      setAccountInfo({
        nickname: 'sports_user',
        lastAccess: new Date().toISOString().split('T')[0]
      });
    }
  }, [type, router]);

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <Link href="/" className="text-slate-800 hover:text-slate-600 font-bold text-xl">
          SPORTS
        </Link>
      </div>
      
      {type === 'id' && accountInfo && (
        <>
          <h2 className="text-xl font-bold text-center mb-6">
            회원님의 아이디 정보입니다
          </h2>
          <div className="p-4 bg-gray-50 rounded-md mb-4">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">아이디</span>
              <span className="font-medium">{accountInfo.nickname}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">마지막 접속일</span>
              <span className="font-medium">{accountInfo.lastAccess}</span>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Link href="/help/account-recovery?tab=password" className="flex-1">
              <button className="w-full py-2 border border-slate-300 rounded font-medium hover:bg-gray-50 transition-colors">
                비밀번호 찾기
              </button>
            </Link>
            <Link href="/signin" className="flex-1">
              <button className="w-full py-2 bg-slate-800 text-white rounded font-medium hover:bg-slate-700 transition-colors">
                로그인
              </button>
            </Link>
          </div>
        </>
      )}
      
      {type === 'password' && (
        <>
          <h2 className="text-xl font-bold text-center mb-6">
            비밀번호 재설정 링크를 발송했습니다
          </h2>
          <p className="text-center text-gray-600 mb-6">
            회원님의 이메일로 비밀번호 재설정 링크를 발송했습니다.<br/>
            이메일을 확인하여 비밀번호를 재설정해주세요.
          </p>
          <Link href="/signin">
            <button className="w-full py-2 bg-slate-800 text-white rounded font-medium hover:bg-slate-700 transition-colors">
              로그인으로 돌아가기
            </button>
          </Link>
        </>
      )}
    </div>
  );
}

// 메인 페이지에서는 Suspense로 감싸기
export default function AccountFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Suspense fallback={
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <div className="h-7 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-full mb-6 animate-pulse"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>
      }>
        <AccountFoundContent />
      </Suspense>
    </div>
  );
} 