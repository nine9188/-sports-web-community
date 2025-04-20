'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { HierarchicalBoard } from '@/app/lib/types';
import { fetchBoardsDirectly } from '@/app/actions/boards';

// BoardNavigation 컴포넌트의 캐싱 지속 시간 (30분)
const CACHE_DURATION = 30 * 60 * 1000;

// 로컬 스토리지 캐시 키
const LS_BOARDS_KEY = 'boards_nav_cache';

// 데이터 타입 정의
interface BoardsData {
  rootBoards: HierarchicalBoard[] | null;
}

interface BoardNavigationClientProps {
  initialData: BoardsData | null; // 서버에서 전달받은 초기 데이터
}

export default function BoardNavigationClient({ initialData }: BoardNavigationClientProps) {
  // 상태 관리
  const [data, setData] = useState<BoardsData | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // 게시판 데이터와 로딩 상태 관리
  const [cachedBoards, setCachedBoards] = useState<{
    rootBoards: HierarchicalBoard[] | null;
    timestamp: number;
  }>({
    rootBoards: initialData?.rootBoards || null,
    timestamp: Date.now()
  });
  const [localLoading, setLocalLoading] = useState(false); // 서버에서 데이터를 받았으므로 초기값은 false
  
  // 게시판 확장 상태 관리
  const [expandedBoards, setExpandedBoards] = useState<Record<string, boolean>>({});
  
  // 데이터 리로드 함수
  const refetch = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const freshData = await fetchBoardsDirectly();
      setData(freshData);
      
      // 캐시 업데이트
      const cacheData = {
        rootBoards: freshData.rootBoards,
        timestamp: Date.now()
      };
      
      // 로컬 스토리지에 저장
      try {
        localStorage.setItem(LS_BOARDS_KEY, JSON.stringify(cacheData));
      } catch {
        // 에러 무시
      }
      
      setCachedBoards(cacheData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('알 수 없는 에러가 발생했습니다'));
    } finally {
      setIsLoading(false);
      setLocalLoading(false);
    }
  };
  
  // 로컬 스토리지에서 캐시된 데이터 로드
  useEffect(() => {
    const loadCachedData = () => {
      try {
        // 확장 상태 복원
        const expandedState = localStorage.getItem('boards_expanded_state');
        if (expandedState) {
          setExpandedBoards(JSON.parse(expandedState));
        } else if (initialData?.rootBoards) {
          // 없으면 기본 확장 상태 설정
          const initialExpandedState: Record<string, boolean> = {};
          initialData.rootBoards.forEach((board: HierarchicalBoard) => {
            initialExpandedState[board.id] = true;
          });
          setExpandedBoards(initialExpandedState);
        }
        
        // 초기 데이터가 이미 있으면 로컬 캐시 불필요
        if (initialData?.rootBoards) {
          return true;
        }
        
        // 초기 데이터가 없는 경우 로컬 캐시 확인
        const cachedData = localStorage.getItem(LS_BOARDS_KEY);
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
    if (!loadCachedData() && !initialData?.rootBoards) {
      setLocalLoading(true);
      refetch();
    }
  }, [initialData]);
  
  // 확장 상태가 변경될 때 로컬 스토리지에 저장
  useEffect(() => {
    if (Object.keys(expandedBoards).length > 0) {
      try {
        localStorage.setItem('boards_expanded_state', JSON.stringify(expandedBoards));
      } catch {
        // 에러 무시
      }
    }
  }, [expandedBoards]);

  // 게시판 접기/펼치기
  const toggleCollapse = (e: React.MouseEvent, boardId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 현재 상태가 접혀있으면 펼치고, 펼쳐져 있으면 접기
    setExpandedBoards(prev => ({
      ...prev,
      [boardId]: !prev[boardId]
    }));
  };

  // 게시판 렌더링 함수 (재귀적)
  const renderBoard = (board: HierarchicalBoard, level: number = 0) => {
    const hasChildren = board.children && board.children.length > 0;
    const isExpanded = expandedBoards[board.id];
    const isChildBoard = level > 0;
    
    return (
      <div key={board.id} className="my-0.5">
        <div className="flex items-center">
          <div style={{ width: `${level * 12}px` }} />
          
          <div className="flex items-center flex-1">
            {/* 하위 게시판 아이콘 표시 */}
            {isChildBoard && (
              <span className="text-gray-400 mr-1 text-xs font-mono">ㄴ</span>
            )}
            
            <Link 
              href={`/boards/${board.slug || board.id}`}
              className={`flex-1 px-1.5 py-0.5 rounded hover:bg-gray-100 text-sm ${level === 0 ? 'font-medium' : ''}`}
            >
              {board.name}
            </Link>
            
            {/* 하위 게시판이 있는 경우에만 접기 아이콘 표시 */}
            {hasChildren && (
              <button 
                onClick={(e) => toggleCollapse(e, board.id)} 
                className="ml-0.5 p-0.5 hover:bg-gray-100 rounded flex items-center"
                aria-label={isExpanded ? "접기" : "펼치기"}
              >
                {isExpanded ? 
                  <ChevronDown className="h-3.5 w-3.5 text-gray-500" /> : 
                  <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
                }
              </button>
            )}
          </div>
        </div>
        
        {/* 하위 게시판 - 펼쳐진 경우에만 표시 */}
        {hasChildren && isExpanded && (
          <div className="ml-3">
            {board.children?.sort((a, b) => {
                // 표시 순서 기준으로 정렬
                if (a.display_order !== b.display_order) {
                  return a.display_order - b.display_order;
                }
                return a.name.localeCompare(b.name);
              })
              .map((child) => renderBoard(child, level + 1))
            }
          </div>
        )}
      </div>
    );
  };

  // 로컬 캐시 또는 데이터 사용
  const boardsToRender = data?.rootBoards || cachedBoards.rootBoards || [];
  const isLoadingData = localLoading && isLoading && !boardsToRender;
  const hasError = error && !cachedBoards.rootBoards;

  if (isLoadingData) {
    // 로딩 UI (서버 컴포넌트의 Suspense fallback으로 대체될 가능성 높음)
    return (
      <div className="space-y-4">
        <div>
          <div className="h-7 bg-gray-100 animate-pulse rounded mb-1.5"></div>
          <div className="h-7 bg-gray-100 animate-pulse rounded mb-1.5"></div>
          <div className="h-7 bg-gray-100 animate-pulse rounded"></div>
        </div>
      </div>
    );
  }
  
  if (hasError) {
    // 오류 메시지 표시
    return (
      <div className="p-1.5 text-center text-red-500 text-sm">
        게시판을 불러오는 데 실패했습니다
        <button 
          onClick={() => refetch()} 
          className="block mx-auto mt-2 text-blue-500 text-xs underline"
        >
          다시 시도
        </button>
      </div>
    );
  }
  
  if (!boardsToRender || boardsToRender.length === 0) {
    // 게시판이 없을 때
    return (
      <div className="p-1.5 text-center text-gray-500 text-sm">
        게시판이 없습니다
        <button 
          onClick={() => refetch()} 
          className="block mx-auto mt-2 text-blue-500 text-xs underline"
        >
          새로고침
        </button>
      </div>
    );
  }

  // 계층형 구조로 게시판 렌더링
  return (
    <div className="space-y-0.5">
      {boardsToRender.map(board => renderBoard(board))}
    </div>
  );
} 