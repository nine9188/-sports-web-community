'use client';

import Link from 'next/link';
import { Menu, LogOut, Settings, Loader2, ChevronDown, User } from 'lucide-react'
import { Button } from '@/app/ui/button'
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { createClient } from '@/app/lib/supabase-browser';
import BoardHeaderNavigation from './header/BoardHeaderNavigation';
import { getUserIconInfo } from '@/app/utils/level-icons';
import ProfileDropdown from './ProfileDropdown';

// 프로필 데이터 타입 정의
type ProfileDataType = {
  nickname?: string;
  iconId?: number | null;
  level?: number;
  isAdmin?: boolean;
  dataLoaded?: boolean;
  lastUpdated?: number;
  usingLevelIcon?: boolean;
};

export default function Header({ onMenuClick, isSidebarOpen }: { onMenuClick: () => void; isSidebarOpen: boolean }) {
  const router = useRouter();
  const { user, refreshUserData } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [profileData, setProfileData] = useState<ProfileDataType>({ 
    dataLoaded: false, 
    lastUpdated: 0 
  });
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  
  // 아이콘 URL을 위한 상태
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [iconName, setIconName] = useState<string | null>(null);
  
  // 아이콘 정보 가져오기 데이터 로딩 플래그
  const [isLoadingIconInfo, setIsLoadingIconInfo] = useState(false);

  // 클라이언트 사이드에서만 실행되는 코드
  useEffect(() => {
    setMounted(true);
    return () => {};
  }, []);

  // 프로필 데이터 업데이트 함수 - 메모이제이션으로 불필요한 재생성 방지
  const updateProfileData = useCallback(async () => {
    if (!user || !user.id || isLoadingIconInfo) return;
    
    try {
      setIsLoadingIconInfo(true);
      
      // 유저 메타데이터에서 닉네임 가져오기
      const nickname = user.user_metadata?.nickname || '사용자';
      setProfileData(prev => ({
        ...prev,
        nickname,
        dataLoaded: true,
        lastUpdated: Date.now()
      }));
      
      try {
        // 아이콘 정보 가져오기
        const iconInfo = await getUserIconInfo(user.id);
        
        // 아이콘 정보가 유효하지 않은 경우 예외 처리
        if (!iconInfo) {
          console.error('아이콘 정보를 가져올 수 없습니다');
          setIconUrl(null);
          setIconName("기본 아이콘");
          return;
        }
        
        // 상태 업데이트 - 배치로 처리하여 렌더링 최적화
        setProfileData(prev => ({
          ...prev,
          iconId: iconInfo.iconId,
          level: iconInfo.level,
          usingLevelIcon: iconInfo.isUsingLevelIcon,
          dataLoaded: true,
          lastUpdated: Date.now()
        }));
        
        // 아이콘 URL 업데이트
        setIconUrl(iconInfo.currentIconUrl || null);
        setIconName(iconInfo.currentIconName || "기본 아이콘");
      } catch (iconError) {
        console.error('아이콘 정보 가져오기 처리 오류:', iconError instanceof Error ? iconError.message : String(iconError));
        setIconUrl(null);
        setIconName("기본 아이콘");
      }
    } catch (error) {
      console.error('프로필 데이터 업데이트 오류:', error instanceof Error ? error.message : String(error));
      // 오류 발생 시 기본값 설정
      setProfileData(prev => ({
        ...prev,
        nickname: user.user_metadata?.nickname || '사용자',
        dataLoaded: true,
        lastUpdated: Date.now()
      }));
      setIconUrl(null);
      setIconName("기본 아이콘");
    } finally {
      setIsLoadingIconInfo(false);
    }
  }, [user, isLoadingIconInfo]);

  // 프로필 데이터 및 아이콘 업데이트
  useEffect(() => {
    if (user) {
      updateProfileData();
    }
  }, [user, updateProfileData]);

  // 페이지 포커스 시 데이터 갱신
  useEffect(() => {
    const handleFocus = () => {
      refreshUserData();
      // 마지막 업데이트 시간이 5분을 초과했을 때만 데이터 갱신
      if (Date.now() - (profileData.lastUpdated || 0) > 5 * 60 * 1000) {
        updateProfileData();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshUserData, updateProfileData, profileData.lastUpdated]);

  // 아이콘 업데이트 이벤트 리스너
  useEffect(() => {
    const handleIconUpdate = () => {
      if (user && user.id) {
        updateProfileData();
      }
    };
    
    // 커스텀 이벤트 리스너 등록
    window.addEventListener('icon-updated', handleIconUpdate);
    return () => window.removeEventListener('icon-updated', handleIconUpdate);
  }, [user, updateProfileData]);

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

  // 프로필 드롭다운 토글
  const toggleDropdown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  }, [isDropdownOpen]);

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

  // 인증 상태 렌더링 - 메모이제이션으로 불필요한 재생성 방지
  const renderAuthState = useMemo(() => {
    if (!user) {
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

    // 모바일 버전: 항상 ProfileDropdown 컴포넌트 사용
    // PC 버전: 기존 드롭다운 유지
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
                />
              ) : (
                <div className="w-full h-full bg-slate-300 flex items-center justify-center text-white">
                  {user?.email?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
            </div>
            <span className="text-sm">{profileData.nickname}</span>
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
  }, [user, iconUrl, iconName, profileData.nickname, isDropdownOpen, toggleDropdown, handleLogout]);

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
                {!mounted ? (
                  <Button variant="outline" className="flex items-center justify-center w-9 h-9 rounded-full">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </Button>
                ) : renderAuthState}
              </div>
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
        <nav className="flex items-center h-12 px-4 overflow-x-auto border-t relative">
          <BoardHeaderNavigation />
        </nav>
      </div>
    </header>
  );
}