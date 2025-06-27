"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail } from 'lucide-react';

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
    
    // 아이디 찾기 결과 표시
    if (type === 'id') {
      const username = searchParams?.get('username');
      const fullName = searchParams?.get('fullName');
      const lastAccess = searchParams?.get('lastAccess');
      
      if (username) {
        setAccountInfo({
          nickname: username,
          lastAccess: lastAccess || '정보 없음',
          username,
          full_name: fullName || ''
        });
      } else {
        // 파라미터가 없으면 계정 복구 페이지로 리디렉션
        router.push('/help/account-recovery');
      }
    }
  }, [type, router, searchParams]);

  return (
    <div className="max-w-md w-full">
      {type === 'id' && accountInfo && (
        <>
          <h2 className="text-2xl font-bold text-left mb-2">
            아이디 찾기 완료
          </h2>
          <p className="text-gray-600 mb-8 text-left">
            회원님의 계정 정보를 찾았습니다.
          </p>
          
          <div className="space-y-6">
            <div className="p-6 bg-slate-50 rounded-lg border">
              <div className="flex items-center mb-4">
                <User className="h-5 w-5 text-slate-600 mr-2" />
                <span className="text-sm font-medium text-gray-600">찾은 아이디</span>
              </div>
              <div className="text-xl font-bold text-slate-800 mb-3">
                {accountInfo.nickname}
              </div>
              <div className="text-sm text-gray-500">
                마지막 접속일: {accountInfo.lastAccess}
              </div>
            </div>
            
            <div className="space-y-3">
              <Link href="/signin" className="block">
                <button className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-800 text-white font-medium rounded-md transition-colors">
                  로그인하기
                </button>
              </Link>
              <Link href="/help/account-recovery?tab=password" className="block">
                <button className="w-full py-3 px-4 border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium rounded-md transition-colors">
                  비밀번호 찾기
                </button>
              </Link>
            </div>
          </div>
        </>
      )}
      
      {type === 'password' && (
        <>
          <h2 className="text-2xl font-bold text-left mb-2">
            재설정 링크 발송 완료
          </h2>
          <p className="text-gray-600 mb-8 text-left">
            등록된 이메일로 비밀번호 재설정 링크를 발송했습니다.
          </p>
          
          <div className="space-y-6">
            <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center mb-3">
                <Mail className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-800">이메일 확인 필요</span>
              </div>
              <p className="text-sm text-blue-700">
                이메일을 확인하여 비밀번호를 재설정해주세요.<br/>
                링크는 30분간 유효합니다.
              </p>
            </div>
            
            <div className="space-y-3">
              <Link href="/signin" className="block">
                <button className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-800 text-white font-medium rounded-md transition-colors">
                  로그인하기
                </button>
              </Link>
              <Link href="/help/account-recovery" className="block">
                <button className="w-full py-3 px-4 border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium rounded-md transition-colors">
                  계정 찾기
                </button>
              </Link>
            </div>
          </div>
        </>
      )}
      
      <div className="mt-8 text-center">
        <p className="text-gray-600">
          처음 방문이신가요?{' '}
          <Link href="/signup" className="text-slate-600 hover:text-slate-800 hover:underline font-medium">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}

// 메인 페이지에서는 Suspense로 감싸기
export default function AccountFoundPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md w-full">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-8"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    }>
      <AccountFoundContent />
    </Suspense>
  );
} 