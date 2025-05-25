import { Suspense } from 'react';
import Link from 'next/link';
import ServerUserProfile from './ServerUserProfile';
import { getSidebarUserProfile } from '../../actions/userProfile';

// 로그인하지 않은 사용자를 위한 UI
function GuestAuthSection() {
  return (
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

// 서버 컴포넌트 - 사용자 인증 상태를 확인하고 적절한 UI 렌더링
export default async function AuthSection() {
  // 서버에서 사용자 프로필 데이터 확인
  const profileData = await getSidebarUserProfile();
  
  // 로그인 상태에 따라 다른 UI 렌더링
  return profileData ? (
    <Suspense fallback={
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">로딩 중...</p>
      </div>
    }>
      <ServerUserProfile />
    </Suspense>
  ) : (
    <GuestAuthSection />
  );
} 