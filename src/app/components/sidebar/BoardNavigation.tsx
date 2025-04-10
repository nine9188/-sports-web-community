'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { useBoards, HierarchicalBoard } from '@/app/hooks/useBoards';

export default function BoardNavigation() {
  // React Query를 사용한 데이터 가져오기
  const { data, isLoading, error, refetch } = useBoards();
  
  // 게시판 확장 상태 관리
  const [expandedBoards, setExpandedBoards] = useState<Record<string, boolean>>({});
  
  // 데이터가 로드되면 모든 게시판을 기본적으로 펼치기
  if (data && Object.keys(expandedBoards).length === 0) {
    const initialExpandedState: Record<string, boolean> = {};
    Object.keys(data.boardsMap).forEach(boardId => {
      initialExpandedState[boardId] = true;
    });
    setExpandedBoards(initialExpandedState);
  }

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

  return (
    <div className="space-y-4">
      {isLoading ? (
        // 로딩 UI
        <div>
          <div className="h-7 bg-gray-100 animate-pulse rounded mb-1.5"></div>
          <div className="h-7 bg-gray-100 animate-pulse rounded mb-1.5"></div>
          <div className="h-7 bg-gray-100 animate-pulse rounded"></div>
        </div>
      ) : error ? (
        // 오류 메시지 표시
        <div className="p-1.5 text-center text-red-500 text-sm">
          게시판을 불러오는 데 실패했습니다
          <button 
            onClick={() => refetch()} 
            className="block mx-auto mt-2 text-blue-500 text-xs underline"
          >
            다시 시도
          </button>
        </div>
      ) : !data || !data.rootBoards || data.rootBoards.length === 0 ? (
        // 게시판이 없을 때
        <div className="p-1.5 text-center text-gray-500 text-sm">
          게시판이 없습니다
          <button 
            onClick={() => refetch()} 
            className="block mx-auto mt-2 text-blue-500 text-xs underline"
          >
            새로고침
          </button>
        </div>
      ) : (
        // 계층형 구조로 게시판 렌더링
        <div className="space-y-0.5">
          {data.rootBoards.map(board => renderBoard(board))}
        </div>
      )}
    </div>
  );
} 