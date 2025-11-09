import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/shared/components/ui';
import ServerUserProfile from './ServerUserProfile';
import { getSidebarUserProfile } from '../../actions/userProfile';

// 로그인하지 않은 사용자를 위한 UI
function GuestAuthSection() {
  return (
    <>
      <Button
        variant="primary"
        className="w-full mb-2"
        asChild
      >
        <Link href="/signin">
          <span className="font-bold mr-1">4590</span> 로그인
        </Link>
      </Button>
      <div className="flex justify-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-2">
        <Link href="/help/account-recovery?tab=id" className="hover:underline dark:hover:text-blue-400">아이디 찾기</Link>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <Link href="/help/account-recovery?tab=password" className="hover:underline dark:hover:text-blue-400">비밀번호 찾기</Link>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <Link href="/signup" className="hover:underline dark:hover:text-blue-400">회원가입</Link>
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