'use client';

import Link from 'next/link';
import { Menu, LogOut, Settings, Loader2, ChevronDown, User } from 'lucide-react'
import { Button } from '@/app/ui/button'
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { createClient } from '@/app/lib/supabase-browser';
import BoardHeaderNavigation from './header/BoardHeaderNavigation';
import { getUserIconInfo } from '@/app/utils/level-icons';
import ProfileDropdown from './ProfileDropdown';

export default function Header({ onMenuClick, isSidebarOpen }: { onMenuClick: () => void; isSidebarOpen: boolean }) {
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
    
    // 아이콘 정보 인터페이스 정의
    interface IconInfo {
      level: number;
      exp: number;
      iconId: number | null;
      isUsingLevelIcon: boolean;
      levelIconUrl: string;
      purchasedIconUrl: string | null;
      iconName: string | null;
      currentIconUrl: string;
      currentIconName: string;
    }
    
    // 기본 아이콘 정보 생성 함수
    const getDefaultIconInfo = (): IconInfo => ({
      level: 1,
      exp: 0,
      iconId: null,
      isUsingLevelIcon: true,
      levelIconUrl: '',
      purchasedIconUrl: null,
      iconName: null,
      currentIconUrl: '',
      currentIconName: '기본 아이콘'
    });
    
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
        
        try {
          if (!user || !user.id) {
            console.error('사용자 정보가 없습니다');
            setIconUrl(null);
            setIconName("기본 아이콘");
            return;
          }
          
          // 아이콘 URL 설정 - 시간제한 설정
          const iconPromise = getUserIconInfo(user.id);
          
          // 5초 타임아웃 설정
          const timeoutPromise = new Promise<IconInfo | null>((_, reject) => {
            setTimeout(() => {
              reject(new Error('아이콘 정보 로딩 시간 초과'));
            }, 5000);
          });
          
          // 둘 중 먼저 완료되는 프로미스 실행
          const iconInfo = await Promise.race([iconPromise, timeoutPromise])
            .catch(error => {
              console.warn('아이콘 정보 로딩 실패:', error instanceof Error ? error.message : JSON.stringify(error));
              return getDefaultIconInfo();
            });
          
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
          } else {
            // 기본 아이콘 설정
            setIconUrl(null);
            setIconName("기본 아이콘");
          }
        } catch (iconError) {
          // 아이콘 정보 가져오기 실패 시
          console.error('아이콘 정보 가져오기 오류:', iconError);
          setIconUrl(null);
          setIconName("기본 아이콘");
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
        setIconUrl(null);
        setIconName("기본 아이콘");
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
    // 상위 스코프에서 정의된 IconInfo 인터페이스와 getDefaultIconInfo 함수 재사용
    interface IconInfo {
      level: number;
      exp: number;
      iconId: number | null;
      isUsingLevelIcon: boolean;
      levelIconUrl: string;
      purchasedIconUrl: string | null;
      iconName: string | null;
      currentIconUrl: string;
      currentIconName: string;
    }
    
    // 기본 아이콘 정보 생성 함수
    const getDefaultIconInfo = (): IconInfo => ({
      level: 1,
      exp: 0,
      iconId: null,
      isUsingLevelIcon: true,
      levelIconUrl: '',
      purchasedIconUrl: null,
      iconName: null,
      currentIconUrl: '',
      currentIconName: '기본 아이콘'
    });
    
    const handleIconUpdate = async () => {
      if (!user || !user.id) {
        console.error('아이콘 업데이트 실패: 사용자 정보가 없습니다');
        setIconUrl(null);
        setIconName("기본 아이콘");
        return;
      }
      
      try {
        // 5초 타임아웃 설정
        const iconPromise = getUserIconInfo(user.id);
        const timeoutPromise = new Promise<IconInfo>((_, reject) => {
          setTimeout(() => {
            reject(new Error('아이콘 업데이트 시간 초과'));
          }, 5000);
        });
        
        // 둘 중 먼저 완료되는 프로미스 실행
        const iconInfo = await Promise.race<IconInfo>([iconPromise, timeoutPromise])
          .catch(error => {
            console.warn('아이콘 업데이트 이벤트 처리 실패:', error instanceof Error ? error.message : JSON.stringify(error));
            return getDefaultIconInfo();
          });
        
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
        } else {
          // 정보를 가져오지 못했을 경우 기본값 설정
          setIconUrl(null);
          setIconName("기본 아이콘");
        }
      } catch (error) {
        console.error('아이콘 업데이트 이벤트 처리 오류:', error);
        setIconUrl(null);
        setIconName("기본 아이콘");
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
  };

  return (
    <header className={`sticky top-0 z-50 border-b shadow-sm bg-white`}>
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
                ) : renderAuthState()}
              </div>
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
        <nav className={`flex items-center h-12 px-4 overflow-x-auto border-t relative`}>
          <BoardHeaderNavigation />
        </nav>
      </div>
    </header>
  );
}