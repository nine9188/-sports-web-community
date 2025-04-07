'use client';

import Link from 'next/link';
import { Menu, Search, LogOut, Settings, Loader2, LogIn, ChevronDown } from 'lucide-react'
import { Button } from '@/app/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/app/ui/dropdown-menu'
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { createClient } from '@/app/lib/supabase-browser';
import BoardHeaderNavigation from './header/BoardHeaderNavigation';
import { getUserIconInfo } from '@/app/utils/level-icons';

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const router = useRouter();
  const { user, refreshUserData } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [profileData, setProfileData] = useState<{
    nickname?: string;
    iconId?: number | null;
    level?: number;
    isAdmin?: boolean;
    dataLoaded?: boolean;
    lastUpdated?: number;
    usingLevelIcon?: boolean;
  }>({ dataLoaded: false, lastUpdated: 0 });
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  
  // 아이콘 URL을 위한 상태
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [iconName, setIconName] = useState<string | null>(null);

  // 클라이언트 사이드에서만 실행되는 코드
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 10);
    
    return () => clearTimeout(timer);
  }, []);

  // 프로필 데이터 및 아이콘 업데이트 - getUserIconInfo 유틸리티 함수 사용
  useEffect(() => {
    if (!user) return;
    
    const updateProfileData = async () => {
      try {
        // 유저 메타데이터에서 닉네임 가져오기
        const nickname = user.user_metadata?.nickname || '사용자';
        setProfileData(prev => ({
          ...prev,
          nickname: nickname,
          isAdmin: false,
          dataLoaded: true,
          lastUpdated: Date.now()
        }));
        
        // 아이콘 URL 설정
        const iconInfo = await getUserIconInfo(user.id);
        if (iconInfo) {
          setProfileData(prev => ({
            ...prev,
            iconId: iconInfo.iconId,
            level: iconInfo.level,
            usingLevelIcon: iconInfo.isUsingLevelIcon,
            dataLoaded: true,
            lastUpdated: Date.now()
          }));
          
          // 아이콘 URL 업데이트
          setIconUrl(iconInfo.currentIconUrl);
          setIconName(iconInfo.currentIconName);
        }
      } catch (error) {
        console.error('프로필 데이터 업데이트 오류:', error);
        // 오류 발생 시 기본값 설정
        setProfileData(prev => ({
          ...prev,
          nickname: user.user_metadata?.nickname || '사용자',
          isAdmin: false,
          dataLoaded: true,
          lastUpdated: Date.now()
        }));
      }
    };
    
    updateProfileData();
  }, [user]);

  // 추가: 페이지 포커스 시 새로고침
  useEffect(() => {
    const handleFocus = () => {
      refreshUserData();
      
      // 마지막 업데이트 시간 초기화하여 다음 효과에서 데이터 갱신
      setProfileData(prev => ({
        ...prev,
        lastUpdated: 0
      }));
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshUserData]);

  // 아이콘 업데이트 이벤트 리스너
  useEffect(() => {
    const handleIconUpdate = async () => {
      if (!user) return;
      
      try {
        // 유틸리티 함수로 최신 아이콘 정보 가져오기
        const iconInfo = await getUserIconInfo(user.id);
        
        if (iconInfo) {
          setProfileData(prev => ({
            ...prev,
            iconId: iconInfo.iconId,
            usingLevelIcon: iconInfo.isUsingLevelIcon,
            lastUpdated: Date.now()
          }));
          
          // 아이콘 URL 업데이트
          setIconUrl(iconInfo.currentIconUrl);
          setIconName(iconInfo.currentIconName);
        }
      } catch (error) {
        console.error('아이콘 업데이트 이벤트 처리 오류:', error);
      }
    };
    
    // 커스텀 이벤트 리스너 등록
    window.addEventListener('icon-updated', handleIconUpdate);
    
    return () => {
      window.removeEventListener('icon-updated', handleIconUpdate);
    };
  }, [user]);

  // 로그아웃 처리
  const handleLogout = async () => {
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
  };

  // 프로필 드롭다운 토글
  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

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

  // 인증 상태 렌더링
  const renderAuthState = () => {
    if (!user) {
      return (
        <div className="flex space-x-2">
          <Link href="/signin" className="flex items-center space-x-1 px-3 py-2 rounded hover:bg-gray-100">
            <LogIn className="h-4 w-4" />
            <span className="text-xs">로그인</span>
          </Link>
        </div>
      );
    }

    const { nickname } = profileData;

    return (
      <div className="relative" ref={profileDropdownRef}>
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
              />
            ) : (
              <div className="w-full h-full bg-slate-300 flex items-center justify-center text-white">
                {user?.email?.charAt(0).toUpperCase() || '?'}
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
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="container mx-auto">
        <div className="flex h-16 items-center px-4">
          <Button variant="ghost" size="icon" className="lg:hidden mr-2" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-2xl text-primary">SPORTS</span>
          </Link>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <div className="hidden md:flex items-center">
              <input
                className="w-[300px] p-2 bg-white border rounded"
                placeholder="검색..."
              />
            </div>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Search className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[300px] bg-white border border-gray-200">
                <input
                  className="w-full p-2 bg-white border rounded"
                  placeholder="검색..."
                />
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center space-x-2">
              <div className="min-w-[100px] h-9">
                {!mounted ? (
                  <Button variant="outline" className="flex items-center gap-2 min-w-[100px]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs">로딩 중</span>
                  </Button>
                ) : renderAuthState()}
              </div>
            </div>
          </div>
        </div>
        <nav className="flex items-center h-12 px-4 overflow-x-auto border-t bg-white relative z-40">
          <BoardHeaderNavigation />
        </nav>
      </div>
    </header>
  );
}