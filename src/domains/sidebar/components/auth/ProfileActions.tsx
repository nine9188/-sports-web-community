'use client';

import Link from 'next/link';
import { useLogout } from '@/shared/hooks/useLogout';

export default function ProfileActions() {
  const { logout } = useLogout();

  return (
    <>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <Link
          href="/settings/profile"
          className="bg-[#F5F5F5] dark:bg-[#262626] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors rounded-md py-2 text-center text-gray-900 dark:text-[#F0F0F0] font-medium"
        >
          프로필 관리
        </Link>
        <button
          onClick={logout}
          className="bg-[#F5F5F5] dark:bg-[#262626] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors rounded-md py-2 text-center text-gray-900 dark:text-[#F0F0F0] font-medium"
        >
          로그아웃
        </button>
      </div>
      <Link
        href="/boards/soccer/create"
        className="mt-2 bg-[#F5F5F5] dark:bg-[#262626] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors rounded-md py-2 text-center text-gray-900 dark:text-[#F0F0F0] font-medium text-xs block"
      >
        글쓰기
      </Link>
    </>
  );
} 