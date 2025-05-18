'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import UserProfile from './UserProfile';
import { ProfileData } from '../../types';
import { User } from '@supabase/supabase-js';
import { useAuth } from '@/app/context/AuthContext';
import { useEffect, useState } from 'react';

// AuthSection 컴포넌트는 이제 props를 통해 사용자와 프로필 데이터를 받지만,
// 서버와 클라이언트 상태를 동기화하기 위해 useAuth 훅도 사용합니다.
export default function AuthSection({
  userData: initialUserData,
  profileData: initialProfileData
}: {
  userData: User | null;
  profileData: ProfileData | null;
}) {
  const { user } = useAuth();
  // 서버에서 받은 초기 상태와 클라이언트 상태를 동기화
  const [isLoggedIn, setIsLoggedIn] = useState(!!initialUserData);
  
  // useAuth 훅의 상태가 변경되면 이를 감지하여 상태 업데이트
  useEffect(() => {
    setIsLoggedIn(!!user);
  }, [user]);
  
  // 로그인 상태에 따라 다른 UI 렌더링
  // 클라이언트 상태(isLoggedIn)를 기준으로 판단
  return isLoggedIn ? (
    <Suspense fallback={
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">로딩 중...</p>
      </div>
    }>
      <UserProfile profileData={initialProfileData} />
    </Suspense>
  ) : (
    <>
      <Link 
        href="/signin" 
        className="flex items-center justify-center bg-slate-800 text-white py-2 rounded-md font-medium w-full mb-2 hover:bg-slate-700 transition-colors"
      >
        <span className="font-bold mr-1">SPORTS</span> 로그인
      </Link>
      <div className="flex justify-center gap-2 text-xs text-gray-500 mt-2">
        <Link href="/help/account-recovery?tab=id" className="hover:underline">아이디 찾기</Link>
        <span className="text-gray-300">|</span>
        <Link href="/help/account-recovery?tab=password" className="hover:underline">비밀번호 찾기</Link>
        <span className="text-gray-300">|</span>
        <Link href="/signup" className="hover:underline">회원가입</Link>
      </div>
    </>
  );
} 