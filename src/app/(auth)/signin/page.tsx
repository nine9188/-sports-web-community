"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '@/app/context/AuthContext';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { createClient } from '@/app/lib/supabase-browser';

// SearchParams를 사용하는 로그인 컴포넌트
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || searchParams.get('redirect_url') || '/';
  const message = searchParams.get('message');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { user } = useAuth();
  
  // 메시지 파라미터 처리
  useEffect(() => {
    if (message) {
      toast.info(decodeURIComponent(message).replace(/\+/g, ' '));
    }
  }, [message]);
  
  // 사용자가 이미 로그인한 경우 리다이렉트
  useEffect(() => {
    if (user && !loginSuccess) {
      console.log('로그인 감지: 리디렉션 실행', redirectUrl);
      router.replace(redirectUrl);
    }
  }, [user, router, redirectUrl, loginSuccess]);
  
  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('이메일과 비밀번호를 모두 입력해주세요');
      return;
    }
    
    try {
      setLoading(true);
      
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('이메일 또는 비밀번호가 올바르지 않습니다');
        } else {
          toast.error(error.message);
        }
        return;
      }
      
      // rememberMe가 true인 경우 쿠키에 정보 저장
      if (rememberMe) {
        document.cookie = "remember-user=true; max-age=1209600; path=/"; // 14일
      }
      
      // 성공 메시지 표시 및 로그인 성공 상태 설정
      toast.success('로그인되었습니다.');
      setLoginSuccess(true);
      
      // 로그인 성공 후 즉시 리다이렉션 (딜레이 없이)
      if (redirectUrl && redirectUrl !== window.location.pathname) {
        console.log('로그인 성공: 즉시 리디렉션 실행', redirectUrl);
        router.replace(redirectUrl);
      }
      
    } catch (error: unknown) {
      console.error('로그인 오류:', error);
      toast.error('로그인 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full">
      <h2 className="text-2xl font-bold text-center mb-6">로그인</h2>
      <p className="text-center text-gray-600 mb-8">
        모든 게이머들을 위한 SPORTS 멤버 커뮤니티에<br />오신 것을 환영합니다.
      </p>
      
      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="이메일 주소"
            required
          />
        </div>
        
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="비밀번호"
            required
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            onClick={handleTogglePassword}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOffIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-800 text-white font-medium rounded-md transition-colors disabled:opacity-70"
        >
          {loading ? '이메일로 시작하기' : '이메일로 시작하기'}
        </button>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              로그인 상태 유지
            </label>
          </div>
          
          <Link href="/help/recovery" className="text-sm text-blue-600 hover:underline">
            임시 코드로 로그인하기
          </Link>
        </div>
      </form>
      
      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">or</span>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-4 gap-3">
          <button className="flex justify-center items-center p-2 border border-gray-300 rounded-full hover:bg-gray-50">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-apple"><path d="M12 20.94c1.5 0 2.75 0 3.77-.15 1.3-.2 2.3-.6 3-1.3.7-.7 1.1-1.7 1.3-3 .15-1.02.15-2.27.15-3.77v-2.44c0-1.5 0-2.75-.15-3.77-.2-1.3-.6-2.3-1.3-3-.7-.7-1.7-1.1-3-1.3-1.02-.15-2.27-.15-3.77-.15h-1.88c-1.5 0-2.75 0-3.77.15-1.3.2-2.3.6-3 1.3-.7.7-1.1 1.7-1.3 3-.15 1.02-.15 2.27-.15 3.77v2.44c0 1.5 0 2.75.15 3.77.2 1.3.6 2.3 1.3 3 .7.7 1.7 1.1 3 1.3 1.02.15 2.27.15 3.77.15Z"/><path d="M14.5 6.5c0 .97.75 1.9 1.67 2.37a3 3 0 0 0 .83.34c.06.3.1.52.1.79 0 .27-.04.49-.1.73a5 5 0 0 1-.83.4c-.92.47-1.67 1.4-1.67 2.37v1a1.5 1.5 0 0 0 3 0v-.17c0-.97.75-1.9 1.67-2.37a3 3 0 0 0 .83-.34c.06-.24.1-.52.1-.79s-.04-.55-.1-.79a5 5 0 0 0-.83-.4c-.92-.47-1.67-1.4-1.67-2.37v-.13a1.5 1.5 0 0 0-3 0Z"/></svg>
          </button>
          
          <button className="flex justify-center items-center p-2 border border-gray-300 rounded-full hover:bg-gray-50">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-google"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/><path d="M12 16v-4"/><path d="M12 8v.01"/></svg>
          </button>
          
          <button className="flex justify-center items-center p-2 border border-gray-300 rounded-full hover:bg-gray-50">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          </button>
          
          <button className="flex justify-center items-center p-2 border border-gray-300 rounded-full hover:bg-gray-50">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </button>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-gray-600">
          아직 SPORTS Member가 아니신가요? <Link href="/signup" className="text-blue-600 hover:underline">회원가입</Link>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100vh-120px)]">
      <Suspense fallback={
        <div className="w-full max-w-md p-8">
          <div className="mb-6 flex justify-center">
            <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-20 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>
      }>
        <LoginContent />
      </Suspense>
      
      <div className="mt-8 flex space-x-4 text-sm text-gray-500">
        <Link href="/terms" className="hover:text-gray-700">이용약관</Link>
        <Link href="/privacy" className="hover:text-gray-700">개인정보처리방침</Link>
      </div>
      
      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
} 