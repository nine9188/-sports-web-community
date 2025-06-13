'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, ShoppingBag, X, Search } from 'lucide-react';
import ReactDOM from 'react-dom';
import { useRouter } from 'next/navigation';
import { Board } from '../types/board';

// Props 타입 정의
interface BoardNavigationClientProps {
  boards: Board[];
  isAdmin?: boolean;
}

// 검색창 컴포넌트
const SearchBar = React.memo(function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      inputRef.current?.blur();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchQuery('');
      inputRef.current?.blur();
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-64">
      <div className={`relative transition-all duration-200 ${
        isFocused ? 'scale-105' : 'scale-100'
      }`}>
        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors ${
          isFocused ? 'text-blue-500' : 'text-gray-400'
        }`} />
        <input
          ref={inputRef}
          type="text"
          placeholder="게시글, 뉴스, 팀 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          className={`w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-full 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
            focus:bg-white transition-all duration-200 placeholder-gray-500
            hover:bg-gray-100 focus:hover:bg-white`}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="h-3 w-3 text-gray-400" />
          </button>
        )}
      </div>
    </form>
  );
});

// 모바일 검색창 컴포넌트
const MobileSearchBar = React.memo(function MobileSearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-32">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <input
          type="text"
          placeholder="검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-full 
            focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent 
            focus:bg-white transition-all duration-200 placeholder-gray-400"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-0.5 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="h-2.5 w-2.5 text-gray-400" />
          </button>
        )}
      </div>
    </form>
  );
});

// 모바일 게시판 모달 컴포넌트
const MobileBoardModal = React.memo(function MobileBoardModal({
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
      <div className="bg-white h-full flex flex-col">
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
              href="/livescore/football/leagues"
              onClick={onClose}
              className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

// 개별 게시판 아이템 컴포넌트 - 메모이제이션
const BoardItem = React.memo(function BoardItem({ 
  board, 
  level = 0,
  onItemClick,
  showSubmenu = false,
  onSubmenuHover,
  onSubmenuLeave
}: { 
  board: Board; 
  level?: number;
  onItemClick?: () => void;
  showSubmenu?: boolean;
  onSubmenuHover?: (board: Board, element: HTMLDivElement) => void;
  onSubmenuLeave?: () => void;
}) {
  const itemRef = useRef<HTMLDivElement>(null);
  const hasChildren = board.children && board.children.length > 0;
  
  return (
    <div key={board.id}>
      <div
        ref={itemRef}
        className="w-full px-3 py-2.5 md:py-1.5 hover:bg-gray-100 flex items-center text-sm cursor-pointer relative"
        onMouseEnter={() => {
          if (hasChildren && showSubmenu && onSubmenuHover && itemRef.current) {
            onSubmenuHover(board, itemRef.current);
          }
        }}
        onMouseLeave={() => {
          if (hasChildren && showSubmenu && onSubmenuLeave) {
            onSubmenuLeave();
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
          // 모든 게시판이 클릭 가능하도록 변경
          if (onItemClick) {
            onItemClick();
          } else {
            // onItemClick이 없는 경우 직접 이동
            window.location.href = `/boards/${board.slug || board.id}`;
          }
        }}
      >
        <div className="flex items-center flex-1" style={{ marginLeft: `${level * 12}px` }}>
          <span className="text-gray-400 mr-1.5">
            {level > 0 ? '┗' : ''}
          </span>
          <Link 
            href={`/boards/${board.slug || board.id}`}
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onItemClick?.();
            }}
          >
            <span className={`${level === 0 ? 'font-medium' : ''}`}>
              {board.name || '게시판'}
            </span>
          </Link>
          {hasChildren && showSubmenu && (
            <ChevronRight className="h-3.5 w-3.5 text-gray-400 ml-1" />
          )}
        </div>
      </div>
      
      {/* 기존 방식의 하위 메뉴 (showSubmenu가 false일 때만) */}
      {!showSubmenu && hasChildren && 
        (board.children
          ?.sort((a, b) => a.display_order - b.display_order)
          .map(child => (
            <BoardItem 
              key={child.id} 
              board={child} 
              level={level + 1} 
              onItemClick={onItemClick}
              showSubmenu={false}
            />
          )))
      }
    </div>
  );
});

// 서브메뉴 컴포넌트
const Submenu = React.memo(function Submenu({
  board,
  position,
  onClose,
  onMouseEnter,
  onMouseLeave
}: {
  board: Board;
  position: { top: number; left: number };
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  return ReactDOM.createPortal(
    <div 
      className="fixed bg-white border rounded-md shadow-lg py-1 hidden md:block"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: '200px',
        maxWidth: '200px',
        maxHeight: '60vh',
        overflowY: 'auto',
        zIndex: 60
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {board.children && board.children.length > 0 ? (
        board.children
          .sort((a, b) => a.display_order - b.display_order)
          .map(child => (
            <BoardItem 
              key={child.id} 
              board={child} 
              level={0} 
              onItemClick={onClose}
              showSubmenu={false}
            />
          ))
      ) : (
        <div className="px-3 py-1.5 text-sm text-gray-500 italic">
          하위 게시판이 없습니다
        </div>
      )}
    </div>,
    document.body
  );
});

// 드롭다운 메뉴 컴포넌트 - 메모이제이션
const DropdownMenu = React.memo(function DropdownMenu({ 
  board, 
  position, 
  onClose,
  onMouseEnter,
  onMouseLeave
}: { 
  board: Board; 
  position: { top: number; left: number };
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const [submenuBoard, setSubmenuBoard] = useState<Board | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState<{ top: number; left: number } | null>(null);
  const submenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 하위 메뉴가 많은지 확인 (5개 이상이면 서브메뉴 사용)
  const shouldUseSubmenu = (board: Board) => {
    return board.children && board.children.length > 5;
  };

  // 서브메뉴 호버 처리
  const handleSubmenuHover = (childBoard: Board, element: HTMLDivElement) => {
    if (submenuTimeoutRef.current) {
      clearTimeout(submenuTimeoutRef.current);
    }
    
    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const submenuWidth = 200;
    const spacing = 5;
    
    // 모바일 감지 (768px 이하)
    const isMobile = viewportWidth <= 768;
    
    let left: number;
    let top: number;
    
    if (isMobile) {
      // 모바일: 아래쪽으로 펼치기
      left = Math.max(10, Math.min(rect.left + window.scrollX, viewportWidth - submenuWidth - 10));
      top = rect.bottom + window.scrollY + spacing;
    } else {
      // 데스크탑: 오른쪽으로 펼치기, 화면 밖으로 나가면 왼쪽으로
      const rightSpace = viewportWidth - rect.right;
      const leftSpace = rect.left;
      
      if (rightSpace >= submenuWidth + spacing) {
        // 오른쪽에 공간이 충분함
        left = rect.right + window.scrollX + spacing;
      } else if (leftSpace >= submenuWidth + spacing) {
        // 왼쪽에 공간이 충분함
        left = rect.left + window.scrollX - submenuWidth - spacing;
      } else {
        // 양쪽 모두 공간이 부족하면 화면 중앙에
        left = (viewportWidth - submenuWidth) / 2;
      }
      
      top = rect.top + window.scrollY;
    }
    
    setSubmenuPosition({ top, left });
    setSubmenuBoard(childBoard);
  };

  // 서브메뉴 호버 종료
  const handleSubmenuLeave = () => {
    if (submenuTimeoutRef.current) {
      clearTimeout(submenuTimeoutRef.current);
    }
    
    submenuTimeoutRef.current = setTimeout(() => {
      setSubmenuBoard(null);
      setSubmenuPosition(null);
    }, 150);
  };

  // 서브메뉴에 마우스 진입
  const handleSubmenuMouseEnter = () => {
    if (submenuTimeoutRef.current) {
      clearTimeout(submenuTimeoutRef.current);
    }
  };

  // 서브메뉴에서 마우스 이탈
  const handleSubmenuMouseLeave = () => {
    if (submenuTimeoutRef.current) {
      clearTimeout(submenuTimeoutRef.current);
    }
    
    submenuTimeoutRef.current = setTimeout(() => {
      setSubmenuBoard(null);
      setSubmenuPosition(null);
    }, 150);
  };

  const closeSubmenu = () => {
    setSubmenuBoard(null);
    setSubmenuPosition(null);
    onClose();
  };

  return ReactDOM.createPortal(
    <div 
      className="fixed bg-white border rounded-md shadow-lg py-1 hidden md:block"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: '240px',
        maxWidth: '240px',
        maxHeight: '60vh',
        overflowY: 'auto',
        zIndex: 50
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* 메인 게시판 링크 */}
      <Link 
        href={`/boards/${board.slug || board.id}`}
        className="block px-3 py-1.5 text-primary text-sm font-medium hover:bg-gray-100 border-b border-gray-100"
        onClick={onClose}
      >
        <div className="flex items-center">
          <ChevronRight className="h-3.5 w-3.5 mr-1" />
          <span>{board.name || '게시판'} 메인 페이지</span>
        </div>
      </Link>
      
      {/* 하위 게시판 목록 */}
      <div className="py-0.5">
        {board.children && board.children.length > 0 ? (
          board.children
            .sort((a, b) => a.display_order - b.display_order)
            .map(child => (
              <BoardItem 
                key={child.id} 
                board={child} 
                level={0} 
                onItemClick={onClose}
                showSubmenu={shouldUseSubmenu(child)}
                onSubmenuHover={handleSubmenuHover}
                onSubmenuLeave={handleSubmenuLeave}
              />
            ))
        ) : (
          <div className="px-3 py-1.5 text-sm text-gray-500 italic">
            하위 게시판이 없습니다
          </div>
        )}
      </div>

      {/* 서브메뉴 */}
      {submenuBoard && submenuPosition && (
        <Submenu
          board={submenuBoard}
          position={submenuPosition}
          onClose={closeSubmenu}
          onMouseEnter={handleSubmenuMouseEnter}
          onMouseLeave={handleSubmenuMouseLeave}
        />
      )}
    </div>,
    document.body
  );
});

// 최상위 게시판 링크 컴포넌트 - 메모이제이션
const TopLevelBoard = React.memo(function TopLevelBoard({ 
  board,
  onHover,
  onLeave,
  onClick
}: { 
  board: Board;
  onHover: (boardId: string, element: HTMLDivElement) => void;
  onLeave: () => void;
  onClick: (board: Board) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  
  return (
    <div 
      ref={ref}
      className="relative shrink-0 snap-center"
      onMouseEnter={() => ref.current && onHover(board.id, ref.current)}
      onMouseLeave={onLeave}
    >
      <div 
        className="px-2 py-1 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded flex items-center gap-1 cursor-pointer whitespace-nowrap"
        onClick={() => onClick(board)}
      >
        {board.name || '게시판'}
        {board.children && board.children.length > 0 && (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </div>
    </div>
  );
});

// 메인 컴포넌트 - 실제 데이터 사용
function BoardNavigationClient({ boards, isAdmin = false }: BoardNavigationClientProps) {
  const [hoveredBoard, setHoveredBoard] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // 타이머 정리 함수
  const clearTimers = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  };

  // 호버 시작 처리
  const handleMouseEnter = (boardId: string, element: HTMLDivElement) => {
    clearTimers();
    
      const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const menuWidth = 240;
    const spacing = 10;
    
    // 메뉴가 화면 밖으로 나가지 않도록 위치 조정
    let left = rect.left + window.scrollX;
    
    // 오른쪽으로 넘어가는 경우
    if (left + menuWidth > viewportWidth - spacing) {
      left = viewportWidth - menuWidth - spacing;
    }
    
    // 왼쪽으로 넘어가는 경우
    if (left < spacing) {
      left = spacing;
    }
    
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
      left: left
      });
      setHoveredBoard(boardId);
  };

  // 호버 종료 처리 (트리거 요소에서)
  const handleMouseLeave = () => {
    clearTimers();
    
    leaveTimeoutRef.current = setTimeout(() => {
      setHoveredBoard(null);
      setDropdownPosition(null);
    }, 150);
  };

  // 드롭다운 메뉴에 마우스 진입
  const handleDropdownMouseEnter = () => {
    clearTimers();
  };

  // 드롭다운 메뉴에서 마우스 이탈
  const handleDropdownMouseLeave = () => {
    clearTimers();
    
    leaveTimeoutRef.current = setTimeout(() => {
      setHoveredBoard(null);
      setDropdownPosition(null);
    }, 150);
  };

  // 게시판 클릭 처리
  const handleBoardClick = (board: Board) => {
    // 모든 게시판이 클릭 가능하도록 변경 (하위 메뉴 여부와 관계없이)
    router.push(`/boards/${board.slug || board.id}`);
  };

  // 드롭다운 닫기
  const closeDropdown = () => {
    clearTimers();
    setHoveredBoard(null);
    setDropdownPosition(null);
  };

  // 현재 호버된 게시판 찾기
  const hoveredBoardData = hoveredBoard ? boards.find(b => b.id === hoveredBoard) : null;

  return (
    <>
      {/* 데스크탑 네비게이션 */}
      <div className="hidden md:flex items-center justify-between gap-4 w-full">
        {/* 게시판 네비게이션 - 스크롤 가능한 영역 */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory min-w-0 flex-1">
          {/* 게시판 목록 */}
          {boards.map(board => (
            <TopLevelBoard
              key={board.id}
              board={board}
              onHover={handleMouseEnter}
              onLeave={handleMouseLeave}
              onClick={handleBoardClick}
            />
          ))}
          
          {/* 라이브스코어 링크 */}
          <Link 
            href="/livescore/football" 
            className="px-2 py-1 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded flex items-center gap-1 shrink-0 whitespace-nowrap snap-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="10 8 16 12 10 16 10 8"></polygon>
            </svg>
            라이브스코어
          </Link>
          
          {/* 데이터센터 링크 */}
          <Link 
            href="/livescore/football/leagues" 
            className="px-2 py-1 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded flex items-center gap-1 shrink-0 whitespace-nowrap snap-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
              <path d="M3 3v18h18V3H3zm16 16H5V5h14v14z"/>
              <path d="M8 8h8v2H8V8zm0 4h8v2H8v-2zm0 4h5v2H8v-2z"/>
            </svg>
            데이터센터
          </Link>
          
          {/* 아이콘샵 링크 */}
          <Link 
            href="/shop/profile-icons" 
            className="px-2 py-1 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded flex items-center gap-1 shrink-0 whitespace-nowrap snap-center"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            아이콘샵
          </Link>

          {/* 관리자 페이지 링크 - 관리자에게만 표시 */}
          {isAdmin && (
            <Link 
              href="/admin" 
              className="px-2 py-1 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded flex items-center gap-1 shrink-0 whitespace-nowrap snap-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              관리자
            </Link>
          )}
        </div>

        {/* 검색창 - 제일 오른쪽에 고정 */}
        <div className="flex-shrink-0">
          <SearchBar />
        </div>

        {/* 드롭다운 메뉴 */}
        {hoveredBoardData && dropdownPosition && (
          <DropdownMenu
            board={hoveredBoardData}
            position={dropdownPosition}
            onClose={closeDropdown}
            onMouseEnter={handleDropdownMouseEnter}
            onMouseLeave={handleDropdownMouseLeave}
          />
        )}
      </div>

      {/* 모바일 네비게이션 */}
      <div className="md:hidden flex items-center justify-between gap-2 w-full">
        {/* 네비게이션 링크들 */}
        <div className="flex items-center gap-1 overflow-x-auto min-w-0 flex-1">
          <button
            onClick={() => setIsMobileModalOpen(true)}
            className="px-2 py-1.5 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded flex items-center gap-1 shrink-0"
          >
            게시판
            <ChevronDown className="h-3 w-3" />
          </button>
          
          <Link 
            href="/livescore/football" 
            className="px-2 py-1.5 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded flex items-center gap-1 shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="10 8 16 12 10 16 10 8"></polygon>
            </svg>
            라이브
          </Link>
          
          <Link 
            href="/livescore/football/leagues" 
            className="px-2 py-1.5 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded flex items-center gap-1 shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
              <path d="M3 3v18h18V3H3zm16 16H5V5h14v14z"/>
              <path d="M8 8h8v2H8V8zm0 4h8v2H8v-2zm0 4h5v2H8v-2z"/>
            </svg>
            데이터
          </Link>
          
          <Link 
            href="/shop/profile-icons" 
            className="px-2 py-1.5 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded flex items-center gap-1 shrink-0"
          >
            <ShoppingBag className="h-3 w-3" />
            샵
          </Link>

          {/* 관리자 페이지 링크 - 관리자에게만 표시 */}
          {isAdmin && (
            <Link 
              href="/admin" 
              className="px-2 py-1.5 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded flex items-center gap-1 shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l-.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              관리자
            </Link>
          )}
        </div>

        {/* 모바일 검색창 - 제일 오른쪽에 고정 */}
        <div className="flex-shrink-0">
          <MobileSearchBar />
        </div>
      </div>

      {/* 모바일 게시판 모달 */}
      <MobileBoardModal
        boards={boards}
        isOpen={isMobileModalOpen}
        onClose={() => setIsMobileModalOpen(false)}
        isAdmin={isAdmin}
      />
    </>
  );
}

export default BoardNavigationClient;