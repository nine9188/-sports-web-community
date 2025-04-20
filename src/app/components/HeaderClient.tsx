'use client';

import Link from 'next/link';
import { Menu, LogOut, Settings, ChevronDown, User } from 'lucide-react';
import { Button } from '@/app/ui/button';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { createClient } from '@/app/lib/supabase-browser';
import ProfileDropdown from './ProfileDropdown';
import { HeaderUserData } from '@/app/lib/types';
import BoardNavigationClient from './header/BoardNavigationClient';

type HeaderClientProps = {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
  initialUserData: HeaderUserData | null;
};

export default function HeaderClient({ 
  onMenuClick, 
  isSidebarOpen, 
  initialUserData
}: HeaderClientProps) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  
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
    // 로그인하지 않은 경우
    if (!initialUserData) {
      return (
        <div className="flex space-x-2">
          {/* PC 버전(md 이상): 기존 링크 유지 */}
          <Link href="/signin" className="hidden md:flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100">
            <User className="h-5 w-5" />
          </Link>
          
          {/* 모바일 버전: ProfileDropdown 컴포넌트 사용 */}
          <div className="md:hidden">
            <ProfileDropdown />
          </div>
        </div>
      );
    }

    // 사용자 아이콘 URL 및 이름
    const iconUrl = initialUserData.iconInfo.iconUrl;
    const iconName = initialUserData.iconInfo.iconName;
    const nickname = initialUserData.nickname || '사용자';

    // 모바일 버전: ProfileDropdown 컴포넌트
    // PC 버전: 커스텀 드롭다운
    return (
      <>
        {/* 모바일 버전 */}
        <div className="md:hidden">
          <ProfileDropdown />
        </div>
        
        {/* PC 버전 */}
        <div className="hidden md:block relative" ref={profileDropdownRef}>
          <button
            onClick={toggleDropdown}
            className="flex items-center space-x-1 px-3 py-2 rounded hover:bg-gray-100"
          >
            <div className="w-6 h-6 relative rounded-full overflow-hidden">
              {iconUrl ? (
                <Image 
                  src={iconUrl}
                  alt="프로필 이미지"
                  fill
                  sizes="20px"
                  className="object-cover"
                  unoptimized={true}
                  title={iconName || undefined}
                  priority={true}
                />
              ) : (
                <div className="w-full h-full bg-slate-300 flex items-center justify-center text-white">
                  {initialUserData.email?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
            </div>
            <span className="text-sm">{nickname}</span>
            <ChevronDown className="h-4 w-4" />
          </button>

          {/* 드롭다운 메뉴 */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-[100]">
              <Link href="/settings/profile" className="block px-4 py-2 hover:bg-gray-100">
                <div className="flex items-center">
                  <Settings className="h-3.5 w-3.5 mr-2" />
                  <span className="text-sm">프로필 설정</span>
                </div>
              </Link>
              <Link href="/settings/icons" className="block px-4 py-2 hover:bg-gray-100">
                <div className="flex items-center">
                  <Settings className="h-3.5 w-3.5 mr-2" />
                  <span className="text-sm">아이콘 설정</span>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                <div className="flex items-center">
                  <LogOut className="h-3.5 w-3.5 mr-2" />
                  <span className="text-sm">로그아웃</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </>
    );
  }, [initialUserData, isDropdownOpen, toggleDropdown, handleLogout]);

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
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
        <nav className="flex items-center h-12 px-4 overflow-x-auto border-t relative">
          <BoardNavigationClient />
        </nav>
      </div>
    </header>
  );
} 