import { Suspense } from 'react';
import Link from 'next/link';
import UserProfile from './auth/UserProfile';
import { User } from '@supabase/supabase-js';

// 프로필 데이터 타입
interface ProfileData {
  id?: string;
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
  postCount?: number;
  commentCount?: number;
  icon_id?: number | null;
  icon_url?: string | null;
}

// AuthSection 컴포넌트는 이제 props를 통해 사용자와 프로필 데이터를 받습니다
export default function AuthSection({
  userData,
  profileData
}: {
  userData: User | null;
  profileData: ProfileData | null;
}) {
  // 로그인 상태에 따라 다른 UI 렌더링
  return userData ? (
    <Suspense fallback={
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">로딩 중...</p>
      </div>
    }>
      <UserProfile profileData={profileData} />
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
