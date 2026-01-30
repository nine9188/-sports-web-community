'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faBars } from '@fortawesome/free-solid-svg-icons';
import { Search, ArrowLeft } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import BoardNavigationClient from './BoardNavigationClient';
import { ThemeToggle } from '@/shared/components/ThemeToggle';
import { HeaderUserData } from '@/shared/types/user';
import { useIcon } from '@/shared/context/IconContext';
import UserIcon from '@/shared/components/UserIcon';
import { Board } from '../types/board';
import { siteConfig } from '@/shared/config';
import ReactDOM from 'react-dom';
import LiveScoreModal from './livescoremodal';
import UserProfileClient from './UserProfileClient';
import MobileHamburgerModal from './MobileHamburgerModal';
import RecentlyVisited from './RecentlyVisited';
import { fetchTodayMatchCount } from '@/domains/livescore/actions/footballApi';
import { NotificationBell } from '@/domains/notifications/components';
import { Button } from '@/shared/components/ui';
import { useQuery } from '@tanstack/react-query';

type HeaderClientProps = {
  onProfileClick: () => void;
  isSidebarOpen: boolean;
  initialUserData?: HeaderUserData | null;
  boards: Board[];
  isAdmin?: boolean;
  renderMode?: 'full' | 'logo-and-mobile' | 'navigation';
  totalPostCount?: number;
};

// 검색 모달 컴포넌트
const SearchModal = React.memo(function SearchModal({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // 현재 /search 방문 기록을 대체해 뒤로가기가 원래 페이지로 가도록 유지
      router.replace(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      // 모바일에서는 검색 결과 페이지로 이동해도 패널 유지
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // SSR 보호: 클라이언트 마운트 체크
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // URL 쿼리를 입력창과 동기화 (모바일 전용)
      const current = searchParams?.get('q') || '';
      setSearchQuery(current);
    }

    // 데스크탑 스크롤 잠금 비활성화 (모바일만 사용)
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'unset';
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = 'unset';
      }
    };
  }, [isOpen, searchParams]);

  if (!isOpen || !isMounted) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 md:hidden pointer-events-none">
      {/* 모바일: 상단 검색 패널만 고정 */}
      <div className="fixed top-0 left-0 right-0 bg-white dark:bg-[#1D1D1D] border-b border-black/5 dark:border-white/10 p-3 pointer-events-auto">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => router.back()}
            className="rounded-md h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="게시글, 뉴스, 팀 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-3 py-2 border border-black/7 dark:border-white/10 rounded-md outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:bg-[#EAEAEA] dark:focus:bg-[#333333] text-sm bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] transition-colors"
              autoFocus
            />
          </div>
          <Button
            variant="primary"
            type="submit"
            disabled={!searchQuery.trim()}
            className="px-3 py-2 h-auto disabled:bg-[#F5F5F5] dark:disabled:bg-[#262626] disabled:text-gray-500 dark:disabled:text-gray-400"
          >
            검색
          </Button>
        </form>
      </div>
    </div>,
    document.body
  );
});

export default function HeaderClient({
  onProfileClick,
  isSidebarOpen,
  initialUserData,
  boards,
  isAdmin = false,
  totalPostCount
}: HeaderClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLiveScoreOpen, setIsLiveScoreOpen] = useState(false);
  const { iconUrl, updateUserIconState } = useIcon();
  const router = useRouter();
  const pathname = usePathname();
  const isSearchPage = (pathname || '').startsWith('/search');

  // 기본 로고 URL 사용
  const logoUrl = siteConfig.logo;

  // 서버에서 전달받은 사용자 데이터 사용
  const userData = initialUserData;
  
  // 사용자 레벨 기반 기본 아이콘 URL
  const userLevel = userData?.level || 1;
  
  // 아이콘 정보 초기화 - 서버 데이터 우선 사용 (한 번만 실행)
  useEffect(() => {
    if (userData?.iconInfo?.iconUrl && !iconUrl) {
      updateUserIconState(userData.iconInfo.iconUrl, userData.iconInfo.iconName || '');
    }
  }, [userData?.iconInfo?.iconUrl, userData?.iconInfo?.iconName, iconUrl, updateUserIconState]);
  
  // 모바일 메뉴 토글
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  }, [isMobileMenuOpen]);

  // 모바일에서 hover 상태 제거를 위한 터치 이벤트 핸들러
  const handleMobileMenuTouch = useCallback((e: React.TouchEvent) => {
    // 터치 후 hover 상태 제거
    const target = e.currentTarget as HTMLElement;
    target.blur();
    toggleMobileMenu();
  }, [toggleMobileMenu]);

  // 라이브스코어 모달 토글
  const toggleLiveScore = useCallback(() => {
    setIsLiveScoreOpen(!isLiveScoreOpen);
  }, [isLiveScoreOpen]);

  // 클라이언트 사이드에서 오늘 경기 수 조회 (경량)
  const { data: matchCountData } = useQuery({
    queryKey: ['todayMatchCount'],
    queryFn: () => fetchTodayMatchCount(),
    staleTime: 1000 * 60 * 5, // 5분 캐시
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const hasTodayMatches = matchCountData?.success && matchCountData.count > 0;
  const isLoadingMatches = !matchCountData;

  // 모바일 검색: 검색 페이지로 이동하여 모달 노출
  const goToSearchPage = useCallback(() => {
    router.push('/search');
  }, [router]);

  // 인증 상태에 따른 렌더링 결정
  const renderAuthState = useMemo(() => {
    return (
      <div className="flex items-center gap-0.5">
        {/* 알림 벨 - 로그인한 사용자에게만 표시 */}
        {userData && (
          <NotificationBell userId={userData.id} />
        )}
        
        {/* PC 버전(md 이상): UserProfileClient 사용 */}
        <UserProfileClient userData={userData || null} />
        
        {/* 모바일 버전(md 미만): 프로필 사이드바 트리거 */}
        <div className="md:hidden">
          {userData ? (
            <Button
              variant="ghost"
              size="icon"
              data-testid="user-menu-mobile"
              onClick={onProfileClick}
              className="rounded-md h-10 w-10"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <UserIcon
                iconUrl={userData?.iconInfo?.iconUrl || iconUrl}
                level={userLevel}
                size={20}
                alt="프로필 이미지"
                className="rounded-full object-cover"
              />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              data-testid="user-menu-mobile"
              onClick={onProfileClick}
              className="rounded-md h-10 w-10"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <FontAwesomeIcon icon={faUser} className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    );
  }, [userData, iconUrl, userLevel, onProfileClick]);

  return (
    <>
      {/* 사이드바 오버레이 */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/70 z-[998] lg:hidden pointer-events-auto" />
      )}

      {/* 데스크탑 메인 헤더 - 스크롤 시 사라짐 */}
      <header className="hidden md:block bg-white dark:bg-[#1D1D1D] border-b border-black/7 dark:border-white/10">
        <div className="w-full max-w-[1400px] mx-auto relative z-[999]">
          <div className="flex h-20 items-center px-4">
            <div className="flex items-center space-x-2">
              <Link href="/" className="flex items-center space-x-2">
                <Image
                  src={logoUrl}
                  alt="4590football logo"
                  width={124}
                  height={60}
                  priority
                  className="h-14 w-auto dark:invert"
                />
              </Link>
            </div>
            <div className="flex flex-1 items-center justify-end space-x-4">
              <div className="flex items-center gap-0.5">
                {/* 테마 토글 버튼 */}
                <ThemeToggle />

                <div className="min-w-[40px] h-10 flex items-center">
                  {renderAuthState}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden rounded-md h-10 w-10"
                  onClick={toggleMobileMenu}
                  onTouchEnd={handleMobileMenuTouch}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <FontAwesomeIcon icon={faBars} className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 모바일: 헤더 + 최근방문 sticky / 데스크탑: nav + 최근방문 sticky */}
      <div className="sticky top-0 z-50 bg-white dark:bg-[#1D1D1D]">
        {/* 모바일 헤더 - sticky 영역 안에 포함 */}
        <div className="md:hidden border-b border-black/7 dark:border-white/10">
          <div className="w-full max-w-[1400px] mx-auto relative z-[999]">
            <div className="flex h-16 items-center px-4">
              <div className="flex items-center space-x-2">
                <Link href="/" className="flex items-center space-x-2">
                  <Image
                    src={logoUrl}
                    alt="SPORTS 로고"
                    width={100}
                    height={48}
                    priority
                    className="h-10 w-auto dark:invert"
                  />
                </Link>
                {/* 라이브스코어 버튼 */}
                <Button
                  variant="ghost"
                  onClick={toggleLiveScore}
                  className="flex items-center gap-1.5 px-2 py-1.5 h-auto rounded-lg"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <span className={`relative flex h-2 w-2 ${
                    isLoadingMatches ? 'opacity-30' : hasTodayMatches ? '' : 'opacity-50'
                  }`}>
                    {isLoadingMatches ? (
                      // 로딩 상태 - 회색 펄스
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-500"></span>
                      </>
                    ) : hasTodayMatches ? (
                      // 경기 있음 - 초록 펄스
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </>
                    ) : (
                      // 경기 없음 - 빨강 점
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    )}
                  </span>
                  <span className="text-xs text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">경기일정</span>
                </Button>
              </div>
              <div className="flex flex-1 items-center justify-end space-x-1">
                {/* 검색 아이콘 */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToSearchPage}
                  className="rounded-md h-10 w-10"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <Search className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </Button>

                <div className="min-w-[40px] h-10 flex items-center">
                  {renderAuthState}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden rounded-md h-10 w-10"
                  onClick={toggleMobileMenu}
                  onTouchEnd={handleMobileMenuTouch}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <FontAwesomeIcon icon={faBars} className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 데스크탑 네비게이션 */}
        <div className="w-full max-w-[1400px] mx-auto">
          <nav className="hidden md:flex items-center h-12 px-4 overflow-x-auto relative">
            <BoardNavigationClient boards={boards} isAdmin={isAdmin} />
          </nav>
        </div>
        {/* 전체 너비 구분선 */}
        <div className="border-b border-black/5 dark:border-white/10" />
        <RecentlyVisited />
      </div>

      {/* 모바일 햄버거 메뉴 모달 */}
      <MobileHamburgerModal
        boards={boards}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isAdmin={isAdmin}
        totalPostCount={totalPostCount}
      />

      {/* 라이브스코어 모달 */}
      <LiveScoreModal
        isOpen={isLiveScoreOpen}
        onClose={() => setIsLiveScoreOpen(false)}
      />

      {/* 검색 모달: 검색 결과 페이지에서만 표시 */}
      {isSearchPage && (
        <SearchModal
          isOpen={true}
          onClose={() => router.back()}
        />
      )}
    </>
  );
} 
