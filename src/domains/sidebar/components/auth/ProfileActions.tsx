'use client';

import Link from 'next/link';
import { toast } from 'react-toastify';
import { useAuth } from '@/shared/context/AuthContext';
import { useIcon } from '@/shared/context/IconContext';

export default function ProfileActions() {
  const { logoutUser } = useAuth();
  const { updateUserIconState } = useIcon();
  
  // 로그아웃 처리
  async function handleLogout() {
    try {
      // AuthContext의 logoutUser 함수 사용
      await logoutUser();
      
      // 아이콘 상태 초기화
      updateUserIconState('', '');
      
      toast.success('로그아웃되었습니다.');
      
      // 확실한 페이지 새로고침을 위해 window.location 사용
      window.location.href = '/';
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
      toast.error('로그아웃 중 오류가 발생했습니다.');
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <Link
          href="/settings/profile"
          className="bg-slate-100 hover:bg-slate-200 transition-colors rounded-md py-2 text-center"
        >
          프로필 관리
        </Link>
        <button
          onClick={handleLogout}
          className="bg-slate-100 hover:bg-slate-200 transition-colors rounded-md py-2 text-center"
        >
          로그아웃
        </button>
      </div>
    </>
  );
} 