"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Clock } from 'lucide-react';

// 계정 정보 인터페이스 정의
interface AccountInfo {
  nickname: string;
  username?: string;
  full_name?: string;
  lastSignInAt?: string;
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
      const lastSignInAt = searchParams?.get('lastSignInAt');
      
      if (username) {
        setAccountInfo({
          nickname: username,
          username,
          full_name: fullName || '',
          lastSignInAt: lastSignInAt || undefined
        });
      } else {
        // 파라미터가 없으면 계정 복구 페이지로 리디렉션
        router.push('/help/account-recovery');
      }
    }
  }, [type, router, searchParams]);

  // 날짜 포맷팅 함수
  const formatLastSignIn = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffInDays === 0) {
        return `오늘 ${date.toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`;
      } else if (diffInDays === 1) {
        return `어제 ${date.toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`;
      } else if (diffInDays < 7) {
        return `${diffInDays}일 전`;
      } else {
        return date.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    } catch {
      return '알 수 없음';
    }
  };

  return (
    <div className="max-w-md w-full">
      {/* 고정 헤더 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-left mb-2">
          {type === 'id' ? '아이디 찾기 완료' : '재설정 링크 발송 완료'}
        </h2>
        <p className="text-gray-600 mb-8 text-left">
          {type === 'id' 
            ? '회원님의 계정 정보를 찾았습니다.' 
            : '등록된 이메일로 비밀번호 재설정 링크를 발송했습니다.'
          }
        </p>
      </div>

      {/* 콘텐츠 영역 - 최소 높이 설정 */}
      <div className="min-h-[400px]">
        {type === 'id' && accountInfo && (
          
          <div className="space-y-6">
            <div className="p-6 bg-slate-50 rounded-lg border">
              <div className="flex items-center mb-4">
                <User className="h-5 w-5 text-slate-600 mr-2" />
                <span className="text-sm font-medium text-gray-600">찾은 아이디</span>
              </div>
              <div className="text-xl font-bold text-slate-800 mb-4">
                {accountInfo.nickname}
              </div>
              
              {accountInfo.lastSignInAt && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center mb-2">
                    <Clock className="h-4 w-4 text-slate-500 mr-2" />
                    <span className="text-sm font-medium text-gray-600">마지막 로그인</span>
                  </div>
                  <div className="text-sm text-slate-600">
                    {formatLastSignIn(accountInfo.lastSignInAt)}
                  </div>
                </div>
              )}
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
        )}
      
        {type === 'password' && (
          
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