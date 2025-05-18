'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { logout } from '@/shared/actions/auth-actions';
import { useAuth } from '@/app/context/AuthContext';
import { useIcon } from '@/shared/context/IconContext';

export default function ProfileActions() {
  const router = useRouter();
  const { logoutUser } = useAuth();
  const { updateUserIconState } = useIcon();
  
  // 로그아웃 처리
  async function handleLogout() {
    try {
      // 서버 액션으로 로그아웃
      const result = await logout();
      
      if (result.success) {
        // AuthContext에서도 로그아웃 처리 (클라이언트 상태 동기화)
        await logoutUser();
        
        // 아이콘 상태 초기화
        updateUserIconState('', '');
        
        toast.success('로그아웃되었습니다.');
        router.refresh();
        // 로그인 페이지로 리디렉션
        router.push('/signin');
      } else {
        toast.error(result.error || '로그아웃 중 오류가 발생했습니다.');
      }
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