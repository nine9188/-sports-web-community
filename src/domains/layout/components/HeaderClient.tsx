'use client';

import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt, faCog, faChevronDown, faBars } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/shared/components/ui/button';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { createClient } from '@/shared/api/supabase';
import ProfileDropdown from './ProfileDropdown';
import BoardNavigationClient from './BoardNavigationClient';
import { useAuth } from '@/shared/context/AuthContext';
import { HeaderUserData } from '@/domains/layout/types/header';
import { useIcon } from '@/shared/context/IconContext';
import UserIcon from '@/shared/components/UserIcon';
import { Board } from '../types/board';

type HeaderClientProps = {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
  initialUserData: HeaderUserData | null;
  boards: Board[];
};

export default function HeaderClient({ 
  onMenuClick, 
  isSidebarOpen, 
  initialUserData,
  boards
}: HeaderClientProps) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { iconUrl, iconName, refreshUserIcon } = useIcon();
  
  // 이전 userData 상태 유지 (깜빡임 방지)
  const [userData, setUserData] = useState<HeaderUserData | null>(initialUserData);
  
  // 사용자 레벨 기반 기본 아이콘 URL
  const userLevel = userData?.level || 1;
  
  // 초기 데이터가 없더라도 user 객체가 있으면 기본 데이터 설정
  useEffect(() => {
    if (!userData && user) {
      const nickname = user.user_metadata?.nickname || '사용자';
      setUserData({
        id: user.id,
        email: user.email || '',
        nickname: nickname,
        level: user.user_metadata?.level || 1,
        iconInfo: {
          iconId: null,
          iconUrl: '',
          iconName: ''
        }
      });
    } else if (initialUserData && !userData) {
      setUserData(initialUserData);
    }
  }, [userData, user, initialUserData]);
  
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

  // 로그아웃 처리
  const handleLogout = useCallback(async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      toast.success('로그아웃되었습니다.');
      setUserData(null);
      
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('로그아웃 오류:', error);
      toast.error('로그아웃 중 오류가 발생했습니다.');
    }
  }, [router]);

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

  // 인증 상태에 따른 렌더링 결정
  const renderAuthState = useMemo(() => {
    return (
      <div className="flex space-x-2">
        {/* PC 버전(md 이상): 커스텀 드롭다운 */}
        {userData ? (
          <div className="hidden md:block relative" ref={profileDropdownRef}>
            <button
              onClick={toggleDropdown}
              className="flex items-center space-x-1 px-3 py-2 rounded hover:bg-gray-100"
            >
              <div className="w-6 h-6 relative rounded-full overflow-hidden">
                <UserIcon 
                  iconUrl={iconUrl || userData?.iconInfo?.iconUrl}
                  level={userLevel}
                  size={24}
                  alt={iconName || '프로필 이미지'}
                  className="object-cover"
                />
              </div>
              <span className="text-sm">{userData.nickname || '사용자'}</span>
              <FontAwesomeIcon icon={faChevronDown} className="h-3 w-3" />
            </button>

            {/* 드롭다운 메뉴 */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-[100]">
                <Link href="/settings/profile" className="block px-4 py-2 hover:bg-gray-100">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faCog} className="h-3.5 w-3.5 mr-2" />
                    <span className="text-sm">프로필 설정</span>
                  </div>
                </Link>
                <Link href="/settings/icons" className="block px-4 py-2 hover:bg-gray-100">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faCog} className="h-3.5 w-3.5 mr-2" />
                    <span className="text-sm">아이콘 설정</span>
                  </div>
                </Link>
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
        ) : (
          <Link href="/signin" className="hidden md:flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100">
            <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
          </Link>
        )}
        
        {/* 모바일 버전: ProfileDropdown 컴포넌트 사용 */}
        <div className="md:hidden">
          <ProfileDropdown />
        </div>
      </div>
    );
  }, [userData, iconUrl, iconName, userLevel, isDropdownOpen, toggleDropdown, handleLogout]);

  return (
    <header className="sticky top-0 z-50 border-b shadow-sm bg-white">
      {isSidebarOpen && (
        <div className="absolute inset-0 bg-black/70 z-[998] lg:hidden pointer-events-auto" />
      )}
      <div className="container mx-auto relative z-[999]">
        <div className="flex h-16 items-center px-4">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-2xl text-primary">SPORTS</span>
          </Link>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <div className="flex items-center space-x-2">
              <div className="min-w-[40px] h-9">
                {renderAuthState}
              </div>
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
                <FontAwesomeIcon icon={faBars} className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <nav className="flex items-center h-12 px-4 overflow-x-auto border-t relative">
          <BoardNavigationClient boards={boards} />
        </nav>
      </div>
    </header>
  );
} 