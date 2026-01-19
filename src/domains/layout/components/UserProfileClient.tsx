'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt, faChevronDown, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { useIcon } from '@/shared/context/IconContext';
import UserIcon from '@/shared/components/UserIcon';
import { HeaderUserData } from '@/shared/types/user';
import { useLogout } from '@/shared/hooks/useLogout';
import { Button } from '@/shared/components/ui';

interface UserProfileClientProps {
  userData: HeaderUserData | null;
}

/**
 * 헤더용 클라이언트 사용자 프로필 컴포넌트
 * 드롭다운 메뉴와 로그아웃 등 클라이언트 상호작용 처리
 */
export default function UserProfileClient({ userData }: UserProfileClientProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const { iconUrl, iconName, updateUserIconState } = useIcon();
  const { logout } = useLogout();
  
  // 사용자 레벨 기반 기본 아이콘 URL
  const userLevel = userData?.level || 1;
  
  // 아이콘 정보 초기화 - 서버 데이터 우선 사용
  useEffect(() => {
    if (userData?.iconInfo?.iconUrl && !iconUrl) {
      updateUserIconState(userData.iconInfo.iconUrl, userData.iconInfo.iconName || '');
    }
  }, [userData?.iconInfo?.iconUrl, userData?.iconInfo?.iconName, iconUrl, updateUserIconState]);
  
  // 드롭다운 메뉴 토글
  const toggleDropdown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  }, [isDropdownOpen]);

  // 로그아웃 처리
  const handleLogout = useCallback(async () => {
    setIsDropdownOpen(false);
    await logout();
  }, [logout]);

  // 드롭다운 메뉴 닫기 (외부 클릭 감지)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 로그인된 경우: 프로필 드롭다운 표시
  if (userData) {
    return (
      <div className="hidden md:block relative" ref={profileDropdownRef}>
        <Button
          variant="ghost"
          data-testid="user-menu"
          onClick={toggleDropdown}
          className="flex items-center space-x-1 px-3 py-2 h-auto"
        >
          <div className="w-5 h-5 relative rounded-full overflow-hidden">
            <UserIcon
              iconUrl={userData?.iconInfo?.iconUrl || iconUrl}
              level={userLevel}
              size={20}
              alt={userData?.iconInfo?.iconName || iconName || '프로필 이미지'}
              className="object-cover"
            />
          </div>
          <span className="text-sm text-gray-900 dark:text-[#F0F0F0]">{userData.nickname || '사용자'}</span>
          <FontAwesomeIcon icon={faChevronDown} className="h-3 w-3 text-gray-900 dark:text-[#F0F0F0]" />
        </Button>

        {/* 드롭다운 메뉴 */}
        {isDropdownOpen && (
          <div
            className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1D1D1D] shadow-lg border border-black/7 dark:border-white/10 z-50 overflow-hidden"
            style={{ borderRadius: '0.5rem' }}
          >
            <Link
              href="/boards/soccer/create"
              className="flex items-center px-4 py-2.5 text-sm text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors border-b border-black/5 dark:border-white/10"
              onClick={() => setIsDropdownOpen(false)}
            >
              <FontAwesomeIcon icon={faPenToSquare} className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
              글쓰기
            </Link>
            <Link
              href="/settings/profile"
              className="flex items-center px-4 py-2.5 text-sm text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors border-b border-black/5 dark:border-white/10"
              onClick={() => setIsDropdownOpen(false)}
            >
              <FontAwesomeIcon icon={faUser} className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
              프로필 설정
            </Link>
            <Button
              variant="ghost"
              data-testid="logout-button"
              onClick={handleLogout}
              className="flex items-center justify-start w-full px-4 py-2.5 h-auto rounded-none text-sm text-gray-900 dark:text-[#F0F0F0]"
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
              로그아웃
            </Button>
          </div>
        )}
      </div>
    );
  }

  // 로그인되지 않은 경우: 로그인/회원가입 링크 표시
  return (
    <div className="hidden md:flex space-x-2">
      <Link
        href="/signin"
        className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded transition-colors"
      >
        로그인
      </Link>
      <Link
        href="/signup"
        className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded transition-colors"
      >
        회원가입
      </Link>
    </div>
  );
} 