"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createClient } from '@/shared/api/supabase';
import { findUsername } from '@/domains/auth/actions';
import Link from 'next/link';

// SearchParams를 사용하는 내용 컴포넌트
function AccountRecoveryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');
  const [activeTab, setActiveTab] = useState<'id' | 'password'>(
    tabParam === 'password' ? 'password' : 'id'
  );
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  
  // URL 파라미터 변경 시 탭 상태 업데이트
  useEffect(() => {
    if (tabParam === 'password') {
      setActiveTab('password');
    } else if (tabParam === 'id') {
      setActiveTab('id');
    }
  }, [tabParam]);
  
  // 탭 변경 시 URL 업데이트
  const changeTab = (tab: 'id' | 'password') => {
    setActiveTab(tab);
    router.push(`/help/account-recovery?tab=${tab}`);
  };
  
  // 이메일 인증 코드 보내기
  const sendVerificationCode = async () => {
    if (!email) {
      toast.error('이메일을 입력해주세요.');
      return;
    }
    
    try {
      setLoading(true);
      
      const supabase = createClient();
      
      // Supabase의 이메일 OTP 기능 사용 (magic link 방식)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // 신규 유저 생성 방지
        }
      });
      
      if (error) {
        throw error;
      }
      
      setVerificationSent(true);
      toast.success('인증 코드가 이메일로 전송되었습니다. 이메일을 확인해주세요.');
      
    } catch (error: unknown) {
      console.error('이메일 인증 오류:', error);
      
      let errorMessage = '인증 코드 발송 중 오류가 발생했습니다.';
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // 인증 코드 확인 후 아이디 찾기 (서버 액션 사용)
  const handleFindId = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('이메일을 입력해주세요.');
      return;
    }
    
    if (!verificationCode) {
      toast.error('인증 코드를 입력해주세요.');
      return;
    }
    
    try {
      setLoading(true);
      
      // 서버 액션 호출
      const result = await findUsername(email, verificationCode);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      // 계정 정보를 찾았으면 결과 페이지로 이동
      router.push(`/help/account-found?username=${result.username}&fullName=${result.fullName}`);
      
    } catch (error: unknown) {
      console.error('아이디 찾기 오류:', error);
      
      let errorMessage = '계정 정보를 찾는 중 오류가 발생했습니다.';
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // 비밀번호 찾기 함수
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username) {
      toast.error('아이디를 입력해주세요');
      return;
    }
    
    try {
      setLoading(true);
      const supabase = createClient();
      
      // 아이디로 사용자 검색하여 이메일 가져오기
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', username)
        .single();
      
      if (error || !data?.email) {
        toast.error('입력하신 아이디와 일치하는 계정을 찾을 수 없습니다');
        return;
      }
      
      // 비밀번호 재설정 이메일 발송
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/help/reset-password`,
      });
      
      if (resetError) {
        throw resetError;
      }
      
      toast.success('비밀번호 재설정 링크를 이메일로 발송했습니다. 이메일을 확인해주세요.');
      
    } catch (error) {
      console.error('비밀번호 재설정 오류:', error);
      toast.error('비밀번호 재설정 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <Link href="/" className="text-slate-800 hover:text-slate-600 font-bold text-xl">
          SPORTS
        </Link>
      </div>
      
      {/* 탭 메뉴 */}
      <div className="flex border-b mb-6">
        <button 
          className={`flex-1 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'id' ? 'border-slate-800 text-slate-800' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => changeTab('id')}
        >
          아이디 찾기
        </button>
        <button 
          className={`flex-1 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'password' ? 'border-slate-800 text-slate-800' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => changeTab('password')}
        >
          비밀번호 찾기
        </button>
      </div>
      
      {/* 아이디 찾기 폼 */}
      {activeTab === 'id' && (
        <form onSubmit={handleFindId}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <div className="flex space-x-2">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`flex-1 p-2 border rounded ${verificationSent ? 'bg-gray-100' : ''}`}
                placeholder="가입시 사용한 이메일"
                readOnly={verificationSent}
                required
              />
              {!verificationSent && (
                <button
                  type="button"
                  onClick={sendVerificationCode}
                  disabled={loading || !email}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  인증코드 받기
                </button>
              )}
            </div>
          </div>
          
          {verificationSent && (
            <div className="mb-6">
              <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 mb-1">
                인증 코드
              </label>
              <input
                id="verification-code"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="이메일로 받은 인증코드 입력"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                이메일로 받은 인증 코드를 입력해주세요. 인증 코드는 5분간 유효합니다.
              </p>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading || (verificationSent && !verificationCode)}
            className="w-full mt-2 py-2 bg-slate-800 text-white rounded font-medium hover:bg-slate-700 transition-colors disabled:bg-gray-400"
          >
            {loading ? '처리 중...' : '아이디 찾기'}
          </button>
        </form>
      )}
      
      {/* 비밀번호 찾기 폼 */}
      {activeTab === 'password' && (
        <form onSubmit={handleResetPassword}>
          <div className="mb-6">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              아이디
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="가입시 설정한 아이디"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              등록된 이메일로 비밀번호 재설정 링크를 발송합니다.
            </p>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-slate-800 text-white rounded font-medium hover:bg-slate-700 transition-colors disabled:bg-gray-400"
          >
            {loading ? '처리 중...' : '비밀번호 재설정 링크 받기'}
          </button>
        </form>
      )}
      
      <div className="mt-4 text-center">
        <Link href="/signin" className="text-sm text-blue-600 hover:underline">
          로그인으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

// 메인 페이지 컴포넌트
export default function AccountRecoveryPage() {
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
        <AccountRecoveryContent />
      </Suspense>
    </div>
  );
} 