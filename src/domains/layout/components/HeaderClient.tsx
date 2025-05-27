'use client';

import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt, faCog, faChevronDown, faBars } from '@fortawesome/free-solid-svg-icons';
import { ChevronDown, ShoppingBag, X, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import BoardNavigationClient from './BoardNavigationClient';
import { useAuth } from '@/shared/context/AuthContext';
import { HeaderUserData } from '@/domains/layout/types/header';
import { useIcon } from '@/shared/context/IconContext';
import UserIcon from '@/shared/components/UserIcon';
import { Board } from '../types/board';
import ReactDOM from 'react-dom';
import { useRouter } from 'next/navigation';

type HeaderClientProps = {
  onProfileClick: () => void;
  isSidebarOpen: boolean;
  initialUserData: HeaderUserData | null;
  boards: Board[];
};

// 모바일 햄버거 메뉴 모달 컴포넌트
const MobileHamburgerModal = React.memo(function MobileHamburgerModal({
  boards,
  isOpen,
  onClose
}: {
  boards: Board[];
  isOpen: boolean;
  onClose: () => void;
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
          {/* 라이브스코어, 아이콘샵 링크 */}
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
              href="/shop/profile-icons"
              onClick={onClose}
              className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="text-sm font-medium">아이콘샵</span>
            </Link>
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

export default function HeaderClient({ 
  onProfileClick, 
  isSidebarOpen, 
  initialUserData,
  boards
}: HeaderClientProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const { user, logoutUser } = useAuth();
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

  // 로그아웃 처리 - AuthContext의 logoutUser 사용
  const handleLogout = useCallback(async () => {
    try {
      // 드롭다운 닫기
      setIsDropdownOpen(false);
      
      // AuthContext의 logoutUser 함수 사용
      await logoutUser();
      
      // 로컬 상태 초기화
      setUserData(null);
      
      toast.success('로그아웃되었습니다.');
      
      // 확실한 페이지 새로고침을 위해 window.location 사용
      window.location.href = '/';
    } catch (error) {
      console.error('로그아웃 오류:', error);
      toast.error('로그아웃 중 오류가 발생했습니다.');
    }
  }, [logoutUser]);

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
                  alt={iconName || userData?.iconInfo?.iconName || '프로필 이미지'}
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
        
        {/* 모바일 버전: 직접 프로필 아이콘 렌더링 */}
        <div className="md:hidden">
          {userData ? (
            <button
              onClick={onProfileClick}
              className="flex items-center justify-center w-9 h-9 rounded-full active:bg-gray-200 transition-colors duration-150"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <UserIcon 
                iconUrl={iconUrl || userData?.iconInfo?.iconUrl}
                level={userLevel}
                size={24}
                alt="프로필 이미지"
                className="rounded-full object-cover"
              />
            </button>
          ) : (
            <button
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
  }, [userData, iconUrl, iconName, userLevel, isDropdownOpen, toggleDropdown, handleLogout, onProfileClick]);

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
          <BoardNavigationClient boards={boards} />
        </nav>
      </div>

      {/* 모바일 햄버거 메뉴 모달 */}
      <MobileHamburgerModal
        boards={boards}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </header>
  );
} 