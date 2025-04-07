"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { createClient } from '@/app/lib/supabase-browser';

export default function SignupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // 기본 입력 필드
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [fullName, setFullName] = useState('');
  
  // 중복 확인 상태
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameChecked, setUsernameChecked] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [nicknameMessage, setNicknameMessage] = useState('');
  const [nicknameAvailable, setNicknameAvailable] = useState(false);

  // 이미 로그인된 사용자 처리
  useEffect(() => {
    if (user) {
      toast.info('이미 로그인되어 있습니다.');
      const timer = setTimeout(() => {
        router.push('/');
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [user, router]);
  
  // 사용자명(아이디)이 변경되면 확인 상태 초기화
  useEffect(() => {
    setUsernameChecked(false);
    setUsernameAvailable(false);
    setUsernameMessage('');
  }, [username]);
  
  // 닉네임이 변경되면 확인 상태 초기화
  useEffect(() => {
    setNicknameChecked(false);
    setNicknameAvailable(false);
    setNicknameMessage('');
  }, [nickname]);
  
  // 아이디 중복 확인
  const checkUsername = async () => {
    if (!username) {
      setUsernameMessage('아이디를 입력해주세요.');
      return;
    }
    
    if (username.length < 4) {
      setUsernameMessage('아이디는 최소 4자 이상이어야 합니다.');
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameMessage('아이디는 영문, 숫자, 언더스코어(_)만 사용 가능합니다.');
      return;
    }
    
    try {
      setIsCheckingUsername(true);
      
      // Supabase 클라이언트 생성
      const supabase = createClient();
      
      // 프로필 테이블에서 해당 username으로 검색
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username);
      
      if (error) {
        console.error('아이디 조회 오류:', error);
        throw error;
      }
      
      // 결과 확인 및 상태 업데이트
      const isAvailable = !data || data.length === 0;
      
      setUsernameChecked(true);
      setUsernameAvailable(isAvailable);
      setUsernameMessage(isAvailable ? '사용 가능한 아이디입니다.' : '이미 사용 중인 아이디입니다.');
      
    } catch (error) {
      console.error('아이디 중복 확인 오류:', error);
      setUsernameMessage('아이디 확인 중 오류가 발생했습니다.');
      setUsernameAvailable(false);
    } finally {
      setIsCheckingUsername(false);
    }
  };
  
  // 닉네임 중복 확인
  const checkNickname = async () => {
    if (!nickname) {
      setNicknameMessage('닉네임을 입력해주세요.');
      return;
    }
    
    if (nickname.length < 2) {
      setNicknameMessage('닉네임은 최소 2자 이상이어야 합니다.');
      return;
    }
    
    if (!/^[a-zA-Z0-9가-힣_]+$/.test(nickname)) {
      setNicknameMessage('닉네임은 영문, 숫자, 한글, 언더스코어(_)만 사용 가능합니다.');
      return;
    }
    
    try {
      setIsCheckingNickname(true);
      
      // Supabase 클라이언트 생성
      const supabase = createClient();
      
      // 프로필 테이블에서 해당 nickname으로 검색
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('nickname', nickname);
      
      if (error) {
        console.error('닉네임 조회 오류:', error);
        throw error;
      }
      
      // 결과 확인 및 상태 업데이트
      const isAvailable = !data || data.length === 0;
      
      setNicknameChecked(true);
      setNicknameAvailable(isAvailable);
      setNicknameMessage(isAvailable ? '사용 가능한 닉네임입니다.' : '이미 사용 중인 닉네임입니다.');
      
    } catch (error) {
      console.error('닉네임 중복 확인 오류:', error);
      setNicknameMessage('닉네임 확인 중 오류가 발생했습니다.');
      setNicknameAvailable(false);
    } finally {
      setIsCheckingNickname(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!username || !email || !password || !confirmPassword || !nickname || !fullName) {
      toast.error('필수 필드를 모두 입력해주세요.');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    if (password.length < 6) {
      toast.error('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }
    
    if (!usernameChecked || !usernameAvailable) {
      toast.error('아이디 중복 확인을 해주세요.');
      return;
    }
    
    if (!nicknameChecked || !nicknameAvailable) {
      toast.error('닉네임 중복 확인을 해주세요.');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const supabase = createClient();
      
      console.log('회원가입 시도:', { email, username, nickname, fullName });
      
      // RLS 정책 우회를 위해 직접 API 엔드포인트 생성
      const { error: createProfileError } = await supabase
        .from('profiles')
        .insert([{
          // ID는 아직 없으므로 생략 (인증 후 갱신)
          username, 
          email,
          nickname,
          full_name: fullName,
          updated_at: new Date().toISOString()
        }]);
        
      if (createProfileError) {
        console.warn('사전 프로필 생성 실패 (무시 가능):', createProfileError);
      }
      
      // 사용자 인증 계정 생성
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            username,
            full_name: fullName,
            nickname
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (authError) {
        console.error('인증 계정 생성 오류:', authError);
        throw authError;
      }
      
      console.log('회원가입 성공:', authData);
      
      // 이전에 생성한 프로필과 연결 시도
      if (authData.user) {
        const { error: linkError } = await supabase
          .from('profiles')
          .update({
            id: authData.user.id,
            username: username.toString(),
            email: email.toString(),
            nickname: nickname,
            full_name: fullName,
            updated_at: new Date().toISOString()
          })
          .eq('email', email);
          
        if (linkError) {
          console.warn('프로필 연결 실패:', linkError);
          
          // plan B: 각 필드 개별적으로 시도
          try {
            // 우선 ID 연결
            await supabase
              .from('profiles')
              .update({ id: authData.user.id })
              .eq('email', email);
              
            // 그 다음 username만 업데이트
            await supabase
              .from('profiles')
              .update({ username: username.toString() })
              .eq('id', authData.user.id);
              
            // 마지막으로 email 업데이트
            await supabase
              .from('profiles')
              .update({ email: email.toString() })
              .eq('id', authData.user.id);
              
            console.log('각 필드 개별 업데이트 완료');
          } catch (individualError) {
            console.error('개별 필드 업데이트 실패:', individualError);
          }
        }
      }
      
      // 로그아웃 (중요)
      await supabase.auth.signOut();
      
      toast.success('회원가입이 완료되었습니다. 이메일 인증 링크를 확인해주세요.');
      
      setTimeout(() => {
        router.push('/signin');
      }, 3000);
    } catch (error: unknown) {
      console.error('회원가입 오류:', error);
      let errorMessage = '회원가입 중 오류가 발생했습니다.';
      
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = error.message as string || errorMessage;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 이미 로그인된 경우 폼 대신 메시지 표시
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h2 className="text-2xl font-bold">이미 로그인되어 있습니다</h2>
            <p className="mt-2 text-gray-600">홈 화면으로 이동합니다...</p>
          </div>
        </div>
        <ToastContainer position="top-right" autoClose={1500} />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white border rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">회원가입</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 아이디 필드 */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">아이디</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`flex-1 p-2 border rounded bg-white focus:ring-2 focus:ring-primary ${
                usernameChecked && !usernameAvailable ? 'border-red-500' : 
                usernameChecked && usernameAvailable ? 'border-green-500' : ''
              }`}
              required
            />
            <button
              type="button"
              onClick={checkUsername}
              disabled={isCheckingUsername || !username}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded disabled:opacity-50"
            >
              {isCheckingUsername ? '확인 중...' : '중복 확인'}
            </button>
          </div>
          {usernameMessage && (
            <p className={`text-sm mt-1 ${
              usernameAvailable ? 'text-green-600' : 'text-red-600'
            }`}>
              {usernameMessage}
            </p>
          )}
        </div>
        
        {/* 이메일 필드 */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded bg-white focus:ring-2 focus:ring-primary"
            required
          />
          <p className="text-xs text-gray-500 mt-1">회원가입 후 이메일 인증이 필요합니다.</p>
        </div>
        
        {/* 이름 필드 */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">이름</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full p-2 border rounded bg-white focus:ring-2 focus:ring-primary"
            required
          />
        </div>
        
        {/* 닉네임 필드 */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">닉네임</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className={`flex-1 p-2 border rounded bg-white focus:ring-2 focus:ring-primary ${
                nicknameChecked && !nicknameAvailable ? 'border-red-500' : 
                nicknameChecked && nicknameAvailable ? 'border-green-500' : ''
              }`}
              required
            />
            <button
              type="button"
              onClick={checkNickname}
              disabled={isCheckingNickname || !nickname}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded disabled:opacity-50"
            >
              {isCheckingNickname ? '확인 중...' : '중복 확인'}
            </button>
          </div>
          {nicknameMessage && (
            <p className={`text-sm mt-1 ${
              nicknameAvailable ? 'text-green-600' : 'text-red-600'
            }`}>
              {nicknameMessage}
            </p>
          )}
        </div>
        
        {/* 비밀번호 필드 */}
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded bg-white focus:ring-2 focus:ring-primary"
            required
          />
        </div>
        
        {/* 비밀번호 확인 필드 */}
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">비밀번호 확인</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-2 border rounded bg-white focus:ring-2 focus:ring-primary"
            required
          />
        </div>
        
        <button 
          className="w-full p-2 bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors disabled:opacity-50" 
          type="submit"
          disabled={isLoading || !usernameChecked || !usernameAvailable || !nicknameChecked || !nicknameAvailable}
        >
          {isLoading ? '처리 중...' : '회원가입'}
        </button>
        
        <div className="mt-4 text-center">
          <p className="text-gray-700">
            이미 계정이 있으신가요?{' '}
            <Link href="/signin" className="text-blue-500 hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </form>
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} />
    </div>
  );
}
