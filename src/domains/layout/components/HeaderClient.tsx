'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faBars, faFutbol } from '@fortawesome/free-solid-svg-icons';
import { ChevronDown, ShoppingBag, X, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BoardNavigationClient from './BoardNavigationClient';
import { HeaderUserData } from '@/domains/layout/types/header';
import { useIcon } from '@/shared/context/IconContext';
import UserIcon from '@/shared/components/UserIcon';
import { Board } from '../types/board';
import ReactDOM from 'react-dom';
import LiveScoreModal from './LiveScoreModal';
import UserProfileClient from './UserProfileClient';

type HeaderClientProps = {
  onProfileClick: () => void;
  isSidebarOpen: boolean;
  initialUserData?: HeaderUserData | null;
  boards: Board[];
  isAdmin?: boolean;
  renderMode?: 'full' | 'logo-and-mobile' | 'navigation';
};

// 모바일 햄버거 메뉴 모달 컴포넌트
const MobileHamburgerModal = React.memo(function MobileHamburgerModal({
  boards,
  isOpen,
  onClose,
  isAdmin = false
}: {
  boards: Board[];
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedBoards, setExpandedBoards] = useState<Set<string>>(() => {
    // 초기 상태에서 1단계 게시판들은 모두 펼쳐진 상태로 설정
    const initialExpanded = new Set<string>();
    boards.forEach(board => {
      if (board.children && board.children.length > 0) {
        initialExpanded.add(board.id);
      }
    });
    return initialExpanded;
  });
  const router = useRouter();

  // 모든 게시판을 평면화하여 검색 가능하게 만들기
  const flattenBoards = (boards: Board[]): Board[] => {
    const result: Board[] = [];
    boards.forEach(board => {
      result.push(board);
      if (board.children) {
        result.push(...flattenBoards(board.children));
      }
    });
    return result;
  };

  const allBoards = flattenBoards(boards);
  const filteredBoards = searchTerm 
    ? allBoards.filter(board => 
        board.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : boards;

  const handleBoardClick = (board: Board) => {
    router.push(`/boards/${board.slug || board.id}`);
    onClose();
  };

  const toggleExpanded = (boardId: string) => {
    const newExpanded = new Set(expandedBoards);
    if (newExpanded.has(boardId)) {
      newExpanded.delete(boardId);
    } else {
      newExpanded.add(boardId);
    }
    setExpandedBoards(newExpanded);
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } flex flex-col`}>
        {/* 헤더 - 고정 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-sm font-semibold">게시판 선택</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 검색 - 고정 */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="게시판 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* 스크롤 가능한 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto">
          {/* 라이브스코어, 데이터센터, 아이콘샵 링크 */}
          <div className="p-4 border-b space-y-2">
            <Link 
              href="/livescore/football"
              onClick={onClose}
              className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="10 8 16 12 10 16 10 8"></polygon>
              </svg>
              <span className="text-sm font-medium">라이브스코어</span>
            </Link>
            
            <Link 
              href="/livescore/football/leagues"
              onClick={onClose}
              className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M3 3v18h18V3H3zm16 16H5V5h14v14z"/>
                <path d="M8 8h8v2H8V8zm0 4h8v2H8v-2zm0 4h5v2H8v-2z"/>
              </svg>
              <span className="text-sm font-medium">데이터센터</span>
            </Link>
            
            <Link 
              href="/shop/profile-icons"
              onClick={onClose}
              className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="text-sm font-medium">아이콘샵</span>
            </Link>

            {/* 관리자 페이지 링크 - 관리자에게만 표시 */}
            {isAdmin && (
              <Link 
                href="/admin"
                onClick={onClose}
                className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <span className="text-sm font-medium">관리자</span>
              </Link>
            )}
          </div>

          {/* 게시판 목록 */}
          <div className="pb-4">
            {searchTerm ? (
              // 검색 결과
              <div className="p-2">
                {filteredBoards.map(board => (
                  <button
                    key={board.id}
                    onClick={() => handleBoardClick(board)}
                    className="w-full text-left p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <div className="text-sm font-medium">{board.name}</div>
                  </button>
                ))}
                {filteredBoards.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    검색 결과가 없습니다
                  </div>
                )}
              </div>
            ) : (
              // 카테고리별 게시판 (아코디언 스타일)
              <div className="p-2">
                {boards.map(board => (
                  <div key={board.id} className="mb-2">
                    {/* 1단계: 크기 줄임, 다른 버튼들과 동일한 크기 */}
                    <button
                      onClick={() => handleBoardClick(board)}
                      className="w-full text-left p-2 bg-gray-50 hover:bg-gray-100 rounded-lg mb-1"
                    >
                      <div className="font-semibold text-blue-600 text-sm">{board.name}</div>
                    </button>
                    
                    {/* 2단계: 항상 표시됨 */}
                    {board.children && board.children.length > 0 && (
                      <div className="ml-4 space-y-1">
                        {board.children
                          .sort((a, b) => a.display_order - b.display_order)
                          .map(child => (
                            <div key={child.id}>
                              <div className="flex items-center bg-white rounded">
                                {/* 2단계 게시판 이름 */}
                                <button
                                  onClick={() => handleBoardClick(child)}
                                  className="flex-1 text-left p-2 hover:bg-gray-50 rounded-l text-sm"
                                >
                                  {child.name}
                                </button>
                                
                                {/* 3단계 하위 메뉴가 있는 경우에만 펼치기/접기 버튼 */}
                                {child.children && child.children.length > 0 && (
                                  <button
                                    onClick={() => toggleExpanded(child.id)}
                                    className="p-2 hover:bg-gray-50 rounded-r border-l border-gray-200"
                                  >
                                    <ChevronDown 
                                      className={`h-3 w-3 transition-transform ${
                                        expandedBoards.has(child.id) ? 'rotate-180' : ''
                                      }`} 
                                    />
                                  </button>
                                )}
                              </div>
                              
                              {/* 3단계 하위 게시판 (펼쳐진 경우에만 표시) */}
                              {child.children && child.children.length > 0 && expandedBoards.has(child.id) && (
                                <div className="ml-4 mt-1 space-y-1">
                                  {child.children
                                    .sort((a, b) => a.display_order - b.display_order)
                                    .map(grandChild => (
                                      <button
                                        key={grandChild.id}
                                        onClick={() => handleBoardClick(grandChild)}
                                        className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm text-gray-600 bg-gray-50"
                                      >
                                        ┗ {grandChild.name}
                                      </button>
                                    ))}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
});

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm sm:max-w-md mx-4 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-semibold">검색</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <input
              type="text"
              placeholder="게시글, 뉴스, 팀 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-16 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              autoFocus
            />
            <button
              type="submit"
              disabled={!searchQuery.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              검색
            </button>
          </div>
        </form>
        
        {/* 검색 팁 - 모바일에서는 간소화 */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t text-xs text-gray-500">
          <p className="hidden sm:block">💡 검색 팁:</p>
          <ul className="mt-1 space-y-1 text-xs sm:text-xs">
            <li className="hidden sm:block">• 게시글 제목, 내용, 작성자로 검색 가능</li>
            <li className="hidden sm:block">• 팀명이나 선수명으로도 검색할 수 있어요</li>
            <li className="sm:hidden text-center">게시글, 팀, 선수 검색 가능</li>
          </ul>
        </div>
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
  isAdmin = false
}: HeaderClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLiveScoreOpen, setIsLiveScoreOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { iconUrl, updateUserIconState } = useIcon();
  
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

  // 검색 모달 토글
  const toggleSearch = useCallback(() => {
    setIsSearchOpen(!isSearchOpen);
  }, [isSearchOpen]);

  // 인증 상태에 따른 렌더링 결정
  const renderAuthState = useMemo(() => {
    return (
      <div className="flex space-x-2">
        {/* PC 버전(md 이상): UserProfileClient 사용 */}
        <UserProfileClient userData={userData || null} />
        
        {/* 모바일 버전(md 미만): 프로필 사이드바 트리거 */}
        <div className="md:hidden">
          {userData ? (
            <button
              data-testid="user-menu-mobile"
              onClick={onProfileClick}
              className="flex items-center justify-center w-9 h-9 rounded-full active:bg-gray-200 transition-colors duration-150"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <UserIcon 
                iconUrl={userData?.iconInfo?.iconUrl || iconUrl}
                level={userLevel}
                size={24}
                alt="프로필 이미지"
                className="rounded-full object-cover"
              />
            </button>
          ) : (
            <button
              data-testid="user-menu-mobile"
              onClick={onProfileClick}
              className="flex items-center justify-center w-9 h-9 rounded-full active:bg-gray-200 transition-colors duration-150"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }, [userData, iconUrl, userLevel, onProfileClick]);

  return (
    <header className="sticky top-0 z-50 border-b shadow-sm bg-white">
      {isSidebarOpen && (
        <div className="absolute inset-0 bg-black/70 z-[998] lg:hidden pointer-events-auto" />
      )}
      <div className="container mx-auto relative z-[999]">
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold text-2xl text-primary">SPORTS</span>
            </Link>
            {/* 라이브스코어 버튼 - 로고 옆으로 이동 */}
            <button 
              onClick={toggleLiveScore}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-full active:bg-gray-200 transition-colors duration-150"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <FontAwesomeIcon icon={faFutbol} className="h-4 w-4 text-green-600" />
            </button>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <div className="flex items-center space-x-2">
              {/* 검색 아이콘 - 프로필 왼쪽에 추가 */}
              <button 
                onClick={toggleSearch}
                className="flex items-center justify-center w-9 h-9 rounded-full active:bg-gray-200 transition-colors duration-150"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <Search className="h-4 w-4 text-gray-600" />
              </button>
              
              <div className="min-w-[40px] h-9">
                {renderAuthState}
              </div>
              <button 
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full active:bg-gray-200 transition-colors duration-150"
                onClick={toggleMobileMenu}
                onTouchEnd={handleMobileMenuTouch}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <FontAwesomeIcon icon={faBars} className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <nav className="flex items-center h-12 px-4 overflow-x-auto border-t relative">
          <BoardNavigationClient boards={boards} isAdmin={isAdmin} />
        </nav>
      </div>

      {/* 모바일 햄버거 메뉴 모달 */}
      <MobileHamburgerModal
        boards={boards}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isAdmin={isAdmin}
      />

      {/* 라이브스코어 모달 */}
      <LiveScoreModal
        isOpen={isLiveScoreOpen}
        onClose={() => setIsLiveScoreOpen(false)}
      />

      {/* 검색 모달 */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </header>
  );
} 