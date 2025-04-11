'use client';

import { Button } from '@/app/ui/button';
import { LogOut, UserRound } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

export default function ProfileActions() {
  const router = useRouter();
  const { logoutUser } = useAuth();
  
  // 로그아웃 처리
  async function handleLogout() {
    try {
      await logoutUser();
      toast.success('로그아웃되었습니다.');
      router.refresh();
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
      toast.error('로그아웃 중 오류가 발생했습니다.');
    }
  }
  
  return (
    <div className="grid grid-cols-1 gap-2">
      <Button 
        asChild
        variant="outline" 
        size="sm"
        className="justify-start hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <Link href="/settings/profile">
          <UserRound className="h-4 w-4 mr-2" />
          프로필 설정
        </Link>
      </Button>
      <Button 
        variant="ghost" 
        size="sm"
        className="justify-start text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4 mr-2" />
        로그아웃
      </Button>
    </div>
  );
} 