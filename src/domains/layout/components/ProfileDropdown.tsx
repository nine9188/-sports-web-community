'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt, faCog } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { createClient } from '@/shared/api/supabase';
import { useAuth } from '@/app/context/AuthContext';
import { useIcon } from '@/shared/context/IconContext';
import Image from 'next/image';
import { getLevelIconUrl } from '@/app/utils/level-icons';

export default function ProfileDropdown() {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { 
    iconUrl, 
    iconName, 
    updateUserIconState, 
    isIconLoading, 
    refreshUserIcon 
  } = useIcon();
  
  // 사용자 레벨 기반 기본 아이콘 URL
  const userLevel = user?.user_metadata?.level || 1;
  const defaultIconUrl = getLevelIconUrl(userLevel);
  
  // 표시할 아이콘 및 이름 결정
  const displayIconUrl = iconUrl || defaultIconUrl;
  const displayIconName = iconName || `레벨 ${userLevel} 기본 아이콘`;

  // 아이콘 정보 초기화
  useEffect(() => {
    if (user && (!iconUrl || !iconName)) {
      refreshUserIcon();
    }
  }, [user, iconUrl, iconName, refreshUserIcon]);
  
  // 이미지 로드 에러 핸들러
  const handleImageError = useCallback(() => {
    // 기본 아이콘으로 대체
    updateUserIconState(defaultIconUrl, `레벨 ${userLevel} 기본 아이콘`);
  }, [defaultIconUrl, updateUserIconState, userLevel]);
  
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

  // 로그인된 경우: 프로필 드롭다운 표시
  if (user) {
    return (
      <div className="relative" ref={profileDropdownRef}>
        <button
          onClick={toggleDropdown}
          className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100"
        >
          {isIconLoading ? (
            <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse"></div>
          ) : displayIconUrl ? (
            <Image 
              src={displayIconUrl}
              alt="프로필 이미지"
              width={24}
              height={24}
              className="rounded-full object-cover"
              unoptimized={true}
              title={displayIconName || undefined}
              priority={true}
              onError={handleImageError}
            />
          ) : (
            <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
          )}
        </button>
        
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-[100]">
            <div className="px-4 py-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 relative rounded-full overflow-hidden">
                  {isIconLoading ? (
                    <div className="w-full h-full bg-gray-200 animate-pulse"></div>
                  ) : displayIconUrl ? (
                    <Image 
                      src={displayIconUrl}
                      alt="프로필 이미지"
                      fill
                      sizes="32px"
                      className="object-cover"
                      unoptimized={true}
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-300 flex items-center justify-center text-white">
                      <FontAwesomeIcon icon={faUser} className="h-3 w-3" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium">
                    {user.user_metadata?.nickname || '사용자'}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {user.email}
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
    );
  }

  // 로그인되지 않은 경우: 로그인 링크 표시
  return (
    <Link href="/signin" className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100">
      <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
    </Link>
  );
} 