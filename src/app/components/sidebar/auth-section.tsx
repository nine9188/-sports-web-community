'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClient } from '@/app/lib/supabase-browser';
import UserProfile from './auth/UserProfile';
import Link from 'next/link';

// 프로필 데이터 인터페이스 정의
interface ProfileData {
  id: string;
  username?: string;
  email?: string;
  nickname?: string;
  full_name?: string;
  avatar_url?: string;
  level?: number;
  exp?: number;
  points?: number;
  created_at?: string;
  updated_at?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // 추가 속성을 위한 인덱스 시그니처 - 알 수 없는 속성도 허용
}

export default function AuthSection() {
  const { session, user } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfileData() {
      if (!user) {
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfileData(data);
      setLoading(false);
    }

    loadProfileData();
  }, [user]);

  if (loading) {
    return (
      <div className="text-center">
        <p className="text-sm text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return session ? (
    <UserProfile profileData={profileData || undefined} />
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
