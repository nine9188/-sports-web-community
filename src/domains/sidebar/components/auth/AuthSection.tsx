'use client';

import Link from 'next/link';
import { Button } from '@/shared/components/ui';
import ClientUserProfile from './ClientUserProfile';
import { FullUserDataWithSession } from '@/shared/types/user';

interface AuthSectionProps {
  userData: FullUserDataWithSession | null;
}

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
        <Link href="/help/account-recovery?tab=id" className="hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline transition-colors">아이디 찾기</Link>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <Link href="/help/account-recovery?tab=password" className="hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline transition-colors">비밀번호 찾기</Link>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <Link href="/signup" className="hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline transition-colors">회원가입</Link>
      </div>
    </>
  );
}

// props로 userData를 받아서 렌더링 (더 이상 서버에서 fetch하지 않음)
export default function AuthSection({ userData }: AuthSectionProps) {
  // 로그인 상태에 따라 다른 UI 렌더링
  return userData ? (
    <ClientUserProfile profileData={{
      id: userData.id,
      nickname: userData.nickname,
      email: userData.email,
      level: userData.level,
      exp: userData.exp,
      points: userData.points,
      icon_id: userData.icon_id,
      icon_url: userData.icon_url,
      icon_name: userData.icon_name,
      postCount: userData.postCount,
      commentCount: userData.commentCount,
      is_admin: userData.is_admin
    }} />
  ) : (
    <GuestAuthSection />
  );
} 