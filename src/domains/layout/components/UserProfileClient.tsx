'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt, faCog, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { useAuth } from '@/shared/context/AuthContext';
import { useIcon } from '@/shared/context/IconContext';
import UserIcon from '@/shared/components/UserIcon';
import { HeaderUserData } from '../types/header';

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
  const { logoutUser } = useAuth();
  const { iconUrl, iconName, updateUserIconState } = useIcon();
  
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
    try {
      setIsDropdownOpen(false);
      await logoutUser();
      updateUserIconState('', '');
      toast.success('로그아웃되었습니다.');
      window.location.href = '/';
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
      toast.error('로그아웃 중 오류가 발생했습니다.');
    }
  }, [logoutUser, updateUserIconState]);

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
        <button
          data-testid="user-menu"
          onClick={toggleDropdown}
          className="flex items-center space-x-1 px-3 py-2 rounded hover:bg-gray-100"
        >
          <div className="w-6 h-6 relative rounded-full overflow-hidden">
            <UserIcon 
              iconUrl={userData?.iconInfo?.iconUrl || iconUrl}
              level={userLevel}
              size={24}
              alt={userData?.iconInfo?.iconName || iconName || '프로필 이미지'}
              className="object-cover"
            />
          </div>
          <span className="text-sm">{userData.nickname || '사용자'}</span>
          <FontAwesomeIcon icon={faChevronDown} className="h-3 w-3" />
        </button>

        {/* 드롭다운 메뉴 */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-50">
            <div className="py-1">
              <Link
                href="/settings/profile"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsDropdownOpen(false)}
              >
                <FontAwesomeIcon icon={faUser} className="h-4 w-4 mr-2" />
                프로필 설정
              </Link>
              <Link
                href="/settings"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsDropdownOpen(false)}
              >
                <FontAwesomeIcon icon={faCog} className="h-4 w-4 mr-2" />
                설정
              </Link>
              <button
                data-testid="logout-button"
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="h-4 w-4 mr-2" />
                로그아웃
              </button>
            </div>
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
        className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        로그인
      </Link>
      <Link
        href="/signup"
        className="px-3 py-2 text-sm font-medium bg-slate-800 text-white rounded hover:bg-slate-700"
      >
        회원가입
      </Link>
    </div>
  );
} 