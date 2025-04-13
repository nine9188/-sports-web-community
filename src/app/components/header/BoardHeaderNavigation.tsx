'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, ShoppingBag } from 'lucide-react';
import ReactDOM from 'react-dom';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useBoards } from '@/app/hooks/useBoards';

// 헤더 네비게이션의 캐싱 지속 시간 (30분)
const CACHE_DURATION = 30 * 60 * 1000;

// 로컬 스토리지 캐시 키
const LS_HEADER_BOARDS_KEY = 'boards_header_cache';

// 타입 정의는 useBoards.ts로 이동하였으므로 여기서는 제거
// Board 타입은 내부적으로만 사용
interface BoardWithUIState {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  children?: BoardWithUIState[];
}

export default function BoardHeaderNavigation() {
  // React Query를 사용한 데이터 가져오기
  const { data, isLoading, error, refetch } = useBoards();
  
  // 로컬 캐싱을 위한 상태
  const [cachedBoards, setCachedBoards] = useState<{
    rootBoards: BoardWithUIState[] | null;
    timestamp: number;
  }>({
    rootBoards: null,
    timestamp: 0
  });
  const [localLoading, setLocalLoading] = useState(true);
  
  const [hoveredBoard, setHoveredBoard] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const boardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  // 로컬 스토리지에서 캐시된 데이터 로드
  useEffect(() => {
    const loadCachedData = () => {
      try {
        const cachedData = localStorage.getItem(LS_HEADER_BOARDS_KEY);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          // 캐시가 유효한지 확인 (30분)
          if (Date.now() - parsed.timestamp < CACHE_DURATION) {
            setCachedBoards(parsed);
            setLocalLoading(false);
            return true;
          }
        }
        return false;
      } catch {
        return false;
      }
    };
    
    // 캐시된 데이터가 없거나 만료된 경우 새로 불러오기
    if (!loadCachedData()) {
      setLocalLoading(true);
    }
  }, []);
  
  // React Query 데이터가 로드되면 캐시 업데이트
  useEffect(() => {
    if (data && data.rootBoards) {
      // 데이터 형식 변환
      const formattedData = data.rootBoards.map((board) => ({
        id: board.id,
        name: board.name,
        slug: board.slug,
        display_order: board.display_order,
        children: board.children ? board.children.map(child => ({
          id: child.id,
          name: child.name,
          slug: child.slug,
          display_order: child.display_order,
          children: child.children || []
        })) : []
      }));
      
      // 캐시 업데이트
      const cacheData = {
        rootBoards: formattedData,
        timestamp: Date.now()
      };
      
      // 로컬 스토리지에 저장
      try {
        localStorage.setItem(LS_HEADER_BOARDS_KEY, JSON.stringify(cacheData));
      } catch {
        // 에러 무시
      }
      
      setCachedBoards(cacheData);
      setLocalLoading(false);
    }
  }, [data]);

  // 관리자 여부 확인
  const isAdmin = user && (user.user_metadata?.is_admin === true);

  // 마운트 상태 관리
  useEffect(() => {
    setMounted(true);
    
    // 네비게이션 바 외부 클릭 감지
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setHoveredBoard(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      setMounted(false);
    };
  }, []);

  // 호버 시작 처리
  const handleMouseEnter = (boardId: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredBoard(boardId);
    }, 100); // 약간의 지연으로 우연한 호버 방지
  };

  // 호버 종료 처리
  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredBoard(null);
    }, 200); // 메뉴로 마우스 이동 가능하도록 약간의 지연
  };

  // 메뉴 호버 처리
  const handleMenuMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  // 게시판 렌더링 함수 (재귀적)
  const renderBoardItems = (board: BoardWithUIState, level: number = 0) => {
    const hasChildren = board.children && board.children.length > 0;
    
    return (
      <div key={board.id}>
        {/* 게시판 링크 - onClick 이벤트 추가 */}
        <Link 
          href={`/boards/${board.slug || board.id}`}
          className="w-full px-3 py-1.5 hover:bg-gray-100 flex items-center text-sm"
          onClick={(e) => {
            // 이벤트 버블링 방지
            e.stopPropagation();
            // 링크 작동 확인을 위한 로그
            console.log(`게시판 링크 클릭: ${board.id}`);
          }}
        >
          <div className="flex items-center" style={{ marginLeft: `${level * 12}px` }}>
            {/* 하위 게시판 표시 기호 */}
            <span className="text-gray-400 mr-1.5">
              {level > 0 ? '┗' : ''}
            </span>
            <span className={`${level === 0 ? 'font-medium' : ''}`}>
              {board.name}
            </span>
          </div>
        </Link>
        
        {/* 하위 게시판이 있으면 재귀적으로 렌더링 */}
        {hasChildren && board.children!
          .sort((a, b) => {
            // 표시 순서 기준으로 정렬
            if (a.display_order !== b.display_order) {
              return a.display_order - b.display_order;
            }
            return a.name.localeCompare(b.name);
          })
          .map(child => renderBoardItems(child, level + 1))
        }
      </div>
    );
  };

  // 드롭다운 메뉴 렌더링
  const renderDropdownMenu = (board: BoardWithUIState) => {
    if (!mounted || !boardRefs.current[board.id]) return null;
    
    // 해당 게시판 요소의 위치 정보 가져오기
    const rect = boardRefs.current[board.id]?.getBoundingClientRect();
    if (!rect) return null;
    
    // 포털을 사용하여 body에 직접 렌더링
    return ReactDOM.createPortal(
      <div 
        className="fixed bg-white border rounded-md shadow-lg py-1"
        style={{
          top: `${rect.bottom + window.scrollY}px`, // 메뉴를 네비게이션 바 아래로 위치
          left: `${rect.left + window.scrollX}px`,
          width: '240px',
          maxHeight: '70vh',
          overflowY: 'auto',
          zIndex: 50 // z-index 상향 조정
        }}
        onMouseEnter={handleMenuMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* 상위 게시판 자체 링크 - onClick 이벤트 추가 */}
        <Link 
          href={`/boards/${board.slug || board.id}`}
          className="block px-3 py-1.5 text-primary text-sm font-medium hover:bg-gray-100 border-b border-gray-100"
          onClick={(e) => {
            e.stopPropagation();
            setHoveredBoard(null); // 클릭 후 드롭다운 닫기
            console.log(`메인 게시판 링크 클릭: ${board.id}`);
          }}
        >
          <div className="flex items-center">
            <ChevronRight className="h-3.5 w-3.5 mr-1" />
            <span>{board.name} 메인 페이지</span>
          </div>
        </Link>
        
        {/* 하위 게시판 링크들 */}
        <div className="py-0.5">
          {(board.children && board.children.length > 0) ? (
            board.children
              .sort((a, b) => {
                // 표시 순서 기준으로 정렬
                if (a.display_order !== b.display_order) {
                  return a.display_order - b.display_order;
                }
                return a.name.localeCompare(b.name);
              })
              .map(child => renderBoardItems(child, 0))
          ) : (
            <div className="px-3 py-1.5 text-sm text-gray-500 italic">
              하위 게시판이 없습니다
            </div>
          )}
        </div>
      </div>,
      document.body
    );
  };
  
  // 로컬 캐시 또는 React Query 데이터 사용
  const boardsToRender = cachedBoards.rootBoards || (data?.rootBoards?.map(board => ({
    id: board.id,
    name: board.name,
    slug: board.slug,
    display_order: board.display_order,
    children: board.children || []
  })) || []);
  const isLoadingData = localLoading && isLoading;
  const hasError = error && !cachedBoards.rootBoards;

  // 최상위 게시판 링크 렌더링
  const renderTopLevelBoards = () => {
    if (!boardsToRender || boardsToRender.length === 0) return null;
    
    return (
      <>
        {boardsToRender.map(board => (
          <div 
            key={board.id} 
            className="relative shrink-0 snap-center" 
            ref={(el) => {
              boardRefs.current[board.id] = el;
            }}
          >
            {/* 상위 게시판 링크 또는 호버 영역 */}
            <div 
              className="px-2 py-1 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded flex items-center gap-1 cursor-pointer whitespace-nowrap"
              onMouseEnter={() => handleMouseEnter(board.id)}
              onMouseLeave={handleMouseLeave}
              onClick={(e) => {
                // 클릭 시 해당 게시판으로 이동
                if (!board.children || board.children.length === 0) {
                  e.stopPropagation();
                  router.push(`/boards/${board.slug || board.id}`);
                }
              }}
            >
              {board.name}
              {board.children && board.children.length > 0 && (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </div>
            
            {/* 하위 게시판 호버 메뉴 - 포털로 렌더링 */}
            {board.children && board.children.length > 0 && hoveredBoard === board.id && renderDropdownMenu(board)}
          </div>
        ))}
        
        {/* 라이브스코어 링크 추가 */}
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
        
        {/* 아이콘샵 링크 추가 */}
        <Link 
          href="/shop/profile-icons" 
          className="px-2 py-1 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded flex items-center gap-1 shrink-0 whitespace-nowrap snap-center"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          아이콘샵
        </Link>
        
        {/* 관리자 페이지 링크는 그대로 유지 */}
        {isAdmin && (
          <Link 
            href="/admin" 
            className="ml-auto px-2 py-1 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded shrink-0 whitespace-nowrap snap-center"
          >
            관리자 페이지
          </Link>
        )}
      </>
    );
  };

  return (
    <div 
      ref={navRef} 
      className="flex items-center gap-1 overflow-x-auto w-full no-scrollbar pb-1 snap-x snap-mandatory"
    >
      {isLoadingData ? (
        // 로딩 상태
        <div className="px-3 py-1">
          <div className="h-7 bg-gray-100 rounded animate-pulse w-20"></div>
        </div>
      ) : hasError ? (
        // 오류 메시지 표시
        <div className="px-3 py-1 text-sm text-red-500 flex items-center">
          <span>게시판을 불러오는 데 실패했습니다</span>
          <button 
            onClick={() => refetch()} 
            className="ml-2 text-blue-500 text-xs underline"
          >
            다시 시도
          </button>
        </div>
      ) : !boardsToRender || boardsToRender.length === 0 ? (
        // 게시판이 없을 때
        <div className="px-3 py-1 text-sm text-gray-500 flex items-center">
          <span>게시판이 없습니다</span>
          <button 
            onClick={() => refetch()} 
            className="ml-2 text-blue-500 text-xs underline"
          >
            새로고침
          </button>
        </div>
      ) : (
        // 게시판 목록 표시
        renderTopLevelBoards()
      )}
    </div>
  );
} 