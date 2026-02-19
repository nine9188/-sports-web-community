'use client';

import { X, User, LogOut, UserCog, PenSquare } from 'lucide-react';
import { useAuth } from '@/shared/context/AuthContext';
import { useIcon } from '@/shared/context/IconContext';
import ClientUserProfile from './auth/ClientUserProfile';
import AttendanceCalendar from '@/shared/components/AttendanceCalendar';
import Link from 'next/link';
import { useCallback, useMemo } from 'react';
import { useLogout } from '@/shared/hooks/useLogout';
import { FullUserDataWithSession } from '@/shared/types/user';
import { Button } from '@/shared/components/ui';
import KakaoAd from '@/shared/components/KakaoAd';

interface ProfileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userData?: FullUserDataWithSession | null;
}

export default function ProfileSidebar({
  isOpen,
  onClose,
  userData,
}: ProfileSidebarProps) {
  const { user } = useAuth();
  const { iconUrl } = useIcon();
  const { logout } = useLogout();

  // 서버에서 전달받은 userData를 UserProfile 형식으로 변환 (useMemo로 최적화)
  const profileData = useMemo(() => {
    if (!userData) return null;

    return {
      id: userData.id,
      username: userData.username || null,
      email: userData.email || null,
      nickname: userData.nickname || null,
      level: userData.level || 1,
      exp: userData.exp || 0,
      points: userData.points || 0,
      // IconContext에서 최신 아이콘 URL 사용 (실시간 업데이트 반영)
      icon_url: iconUrl || userData.icon_url || null,
      is_admin: userData.is_admin || false,
      // 서버에서 이미 가져온 통계 데이터 사용 (클라이언트 fetch 불필요)
      postCount: userData.postCount || 0,
      commentCount: userData.commentCount || 0,
    };
  }, [userData, iconUrl]);

  // 로그아웃 처리
  const handleLogout = useCallback(async () => {
    onClose();
    await logout();
  }, [logout, onClose]);

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
      
      {/* 프로필 사이드바 (우측에서 열림) */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md
          bg-white dark:bg-[#1D1D1D] transform transition-transform duration-300 ease-in-out z-[1000]
          ${isOpen ? 'translate-x-0' : 'translate-x-full'} md:hidden`}
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
            className="flex items-center justify-center w-9 h-9 rounded-md hover:bg-[#EAEAEA] dark:hover:bg-[#333333] active:bg-[#EAEAEA] dark:active:bg-[#333333] transition-colors duration-150"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            aria-label="프로필 사이드바 닫기"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-300" aria-hidden="true" />
          </Button>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="h-[calc(100%-56px)] overflow-y-auto bg-white dark:bg-[#1D1D1D]">
          {user ? (
            // 로그인된 사용자
            <>
              {/* 사용자 프로필 정보 섹션 */}
              <div className="p-4 border-b border-black/7 dark:border-white/10">
                <ClientUserProfile profileData={profileData} showActions={false} />
              </div>

              {/* 출석 현황 (미니 캘린더) */}
              {user?.id && (
                <div className="px-4 pt-2">
                  <AttendanceCalendar userId={user.id} variant="mini" />
                </div>
              )}

              {/* 메뉴 섹션 */}
              <div className="p-4 space-y-2">
                {/* 글쓰기 */}
                <Link
                  href="/boards/soccer/create"
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#F5F5F5] dark:bg-[#262626] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0]"
                  onClick={handleMenuClick}
                >
                  <PenSquare className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  <span className="text-sm font-medium">글쓰기</span>
                </Link>

                {/* 프로필 설정 */}
                <Link
                  href="/settings/profile"
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#F5F5F5] dark:bg-[#262626] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0]"
                  onClick={handleMenuClick}
                >
                  <UserCog className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  <span className="text-sm font-medium">프로필 설정</span>
                </Link>

                {/* 로그아웃 */}
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 h-auto rounded-lg bg-[#F5F5F5] dark:bg-[#262626] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors justify-start"
                >
                  <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">로그아웃</span>
                </Button>

                {/* 카카오 광고 - 모달 열릴 때만 렌더링 */}
                {isOpen && (
                  <div className="flex justify-center pt-2">
                    <KakaoAd
                      adUnit="DAN-xQCe8VgP6G8I1XtL"
                      adWidth={320}
                      adHeight={50}
                    />
                  </div>
                )}
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
                    className="block w-full bg-[#262626] dark:bg-[#3F3F3F] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#3F3F3F] dark:hover:bg-[#4A4A4A] transition-colors"
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

                  {/* 카카오 광고 - 모달 열릴 때만 렌더링 */}
                  {isOpen && (
                    <div className="flex justify-center pt-2">
                      <KakaoAd
                        adUnit="DAN-xQCe8VgP6G8I1XtL"
                        adWidth={320}
                        adHeight={50}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 
