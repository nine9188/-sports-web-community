'use client';

import { X, User, LogOut, UserCog } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useAuth } from '@/shared/context/AuthContext';
import { useIcon } from '@/shared/context/IconContext';
import UserProfile from './auth/UserProfile';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useCallback, useState, useEffect } from 'react';
import { createClient } from '@/shared/api/supabase';

interface ProfileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProfileData {
  id?: string;
  username?: string | null;
  email?: string | null;
  nickname?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  level?: number | null;
  exp?: number | null;
  points?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  postCount?: number;
  commentCount?: number;
  icon_id?: number | null;
  icon_url?: string | null;
  is_admin?: boolean | null;
}

export default function ProfileSidebar({
  isOpen,
  onClose,
}: ProfileSidebarProps) {
  const { user, logoutUser } = useAuth();
  const { updateUserIconState } = useIcon();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 프로필 데이터 로드 - user.id나 isOpen이 변경될 때마다 새로 로드
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) {
        setProfileData(null);
        return;
      }

      setIsLoading(true);
      try {
        const supabase = createClient();

        // 프로필 정보 조회
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("프로필 정보 조회 중 오류 발생:", error);
          return;
        }

        // 게시글 수 조회
        const { count: postCount } = await supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // 댓글 수 조회
        const { count: commentCount } = await supabase
          .from('comments')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // 아이콘 정보 추출
        const userMetadata = user.user_metadata || {};
        const icon_url = userMetadata.icon_url || null;

        setProfileData({
          ...profile,
          postCount: postCount || 0,
          commentCount: commentCount || 0,
          icon_url
        });
      } catch (error) {
        console.error('프로필 데이터 가져오기 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && user) {
      fetchProfileData();
    } else if (!user) {
      // 로그아웃 시 프로필 데이터 초기화
      setProfileData(null);
    }
  }, [user?.id, isOpen]);

  // 로그아웃 처리
  const handleLogout = useCallback(async () => {
    try {
      // 사이드바 닫기
      onClose();
      
      // AuthContext의 logoutUser 함수 사용
      await logoutUser();
      
      // 아이콘 상태 초기화
      updateUserIconState('', '');
      
      toast.success('로그아웃되었습니다.');
      
      // 확실한 페이지 새로고침을 위해 window.location 사용
      window.location.href = '/';
    } catch (error) {
      console.error('로그아웃 오류:', error);
      toast.error('로그아웃 중 오류가 발생했습니다.');
    }
  }, [logoutUser, updateUserIconState, onClose]);

  // 메뉴 아이템 클릭 시 사이드바 닫기
  const handleMenuClick = () => {
    onClose();
  };

  return (
    <>
      {/* Overlay - 모바일에서만 표시 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-[999] lg:hidden pointer-events-auto"
          onClick={onClose}
        />
      )}
      
      {/* 프로필 사이드바 (좌측에서 열림) */}
      <div
        className={`fixed top-0 left-0 h-full w-full max-w-sm
          bg-[#F8F9FA] dark:bg-black transform transition-transform duration-300 ease-in-out z-[1000]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:hidden`}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between h-14 border-b border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] px-4">
          <span className="font-medium text-gray-900 dark:text-[#F0F0F0]">
            {user ? '프로필' : '로그인'}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </Button>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="h-[calc(100%-56px)] overflow-y-auto bg-[#F8F9FA] dark:bg-black">
          {user ? (
            // 로그인된 사용자
            <>
              {/* 사용자 프로필 정보 섹션 */}
              <div className="p-4 border-b border-black/7 dark:border-white/10">
                {isLoading ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">프로필 로딩 중...</p>
                  </div>
                ) : (
                  <>
                    <UserProfile profileData={profileData} showActions={false} />
                  </>
                )}
              </div>

              {/* 메뉴 섹션 */}
              <div className="p-4 space-y-2">
                <Link
                  href="/settings/profile"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0]"
                  onClick={handleMenuClick}
                >
                  <UserCog className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  <span className="text-sm font-medium">프로필 설정</span>
                </Link>

                {/* 아이콘 설정 항목 제거 */}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-left"
                >
                  <LogOut className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium text-red-600">로그아웃</span>
                </button>
              </div>
            </>
          ) : (
            // 로그인되지 않은 사용자
            <div className="p-4">
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#F5F5F5] dark:bg-[#262626] rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-[#F0F0F0]">로그인이 필요합니다</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  더 많은 기능을 이용하려면 로그인해주세요
                </p>

                <div className="space-y-3">
                  <Link
                    href="/signin"
                    className="block w-full bg-slate-800 dark:bg-[#3F3F3F] text-white py-3 px-4 rounded-lg font-medium hover:bg-slate-700 dark:hover:bg-[#4A4A4A] transition-colors"
                    onClick={handleMenuClick}
                  >
                    로그인
                  </Link>

                  <Link
                    href="/signup"
                    className="block w-full bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] py-3 px-4 rounded-lg font-medium hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors"
                    onClick={handleMenuClick}
                  >
                    회원가입
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 