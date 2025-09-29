'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt, faCog } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { useAuth } from '@/shared/context/AuthContext';
import { useIcon } from '@/shared/context/IconContext';
import UserIcon from '@/shared/components/UserIcon';

export default function ProfileDropdown() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const { user, logoutUser } = useAuth();
  const { 
    iconUrl, 
    iconName, 
    refreshUserIcon,
    updateUserIconState 
  } = useIcon();
  
  // 사용자 레벨 기반 기본 아이콘 URL
  const userLevel = user?.user_metadata?.level || 1;
  
  // 아이콘 정보 초기화
  useEffect(() => {
    if (user && (!iconUrl || !iconName)) {
      refreshUserIcon();
    }
  }, [user, iconUrl, iconName, refreshUserIcon]);
  
  // 드롭다운 메뉴 토글
  const toggleDropdown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  }, [isDropdownOpen]);

  // 로그아웃 처리 - AuthContext의 logoutUser 사용
  const handleLogout = useCallback(async () => {
    try {
      // 드롭다운 닫기
      setIsDropdownOpen(false);
      
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
  if (user) {
    return (
      <div className="relative" ref={profileDropdownRef}>
        <button
          onClick={toggleDropdown}
          className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100"
        >
          <UserIcon 
            iconUrl={iconUrl}
            level={userLevel}
            size={20}
            alt="프로필 이미지"
            className="rounded-full object-cover"
          />
        </button>
        
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-[100]">
            <div className="px-4 py-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 relative rounded-full overflow-hidden">
                  <UserIcon 
                    iconUrl={iconUrl}
                    level={userLevel}
                    size={20}
                    alt="프로필 이미지"
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="text-sm font-medium">
                    {user.user_metadata?.nickname || '사용자'}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {user.email || '이메일 없음'}
                  </div>
                </div>
              </div>
            </div>
            <Link href="/settings/profile" className="block px-4 py-2 hover:bg-gray-100">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faCog} className="h-3.5 w-3.5 mr-2" />
                <span className="text-sm">프로필 설정</span>
              </div>
            </Link>
            {/* 아이콘 설정 제거 */}
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              <div className="flex items-center">
                <FontAwesomeIcon icon={faSignOutAlt} className="h-3.5 w-3.5 mr-2" />
                <span className="text-sm">로그아웃</span>
              </div>
            </button>
          </div>
        )}
      </div>
    );
  }

  // 로그인되지 않은 경우: 로그인 링크 표시
  return (
    <Link href="/signin" className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100">
      <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
    </Link>
  );
} 