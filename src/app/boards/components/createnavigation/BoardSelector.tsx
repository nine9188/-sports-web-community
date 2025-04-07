'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Board {
  id: string;
  name: string;
  parent_id: string | null;
  display_order: number;
  slug: string;
  children?: Board[];
}

interface BoardSelectorProps {
  boards: Board[];
  selectedId?: string;
  onSelect: (id: string) => void;
  currentBoardId?: string;
}

export default function BoardSelector({ 
  boards, 
  selectedId, 
  onSelect, 
  currentBoardId 
}: BoardSelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // 외부 클릭 감지를 위한 useEffect
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);
  
  // boards를 계층형 구조로 변환하는 함수
  const organizeBoards = (boards: Board[]): Board[] => {
    const boardsMap: Record<string, Board> = {};
    const rootBoards: Board[] = [];
    
    // 모든 게시판을 맵에 추가
    boards.forEach(board => {
      boardsMap[board.id] = { ...board, children: [] };
    });
    
    // 부모-자식 관계 설정
    Object.values(boardsMap).forEach(board => {
      if (board.parent_id && boardsMap[board.parent_id]) {
        // 부모가 있으면 부모의 children에 추가
        boardsMap[board.parent_id].children?.push(board);
      } else if (!board.parent_id) {
        // 부모가 없으면 루트 게시판
        rootBoards.push(board);
      }
    });
    
    // 정렬 함수
    const sortBoards = (boardArray: Board[]) => {
      return boardArray.sort((a, b) => {
        // 먼저 display_order로 정렬
        if (a.display_order !== b.display_order) {
          return a.display_order - b.display_order;
        }
        // 동일한 display_order 값을 가질 경우 이름으로 정렬
        return a.name.localeCompare(b.name);
      }).map(board => {
        if (board.children && board.children.length > 0) {
          board.children = sortBoards(board.children);
        }
        return board;
      });
    };
    
    return sortBoards(rootBoards);
  };
  
  // 드롭다운 옵션 렌더링 함수
  const renderBoardOptions = (boards: Board[], level: number = 0) => {
    return boards.map(board => (
      <React.Fragment key={board.id}>
        <div 
          className={`px-3 py-1.5 hover:bg-gray-100 cursor-pointer ${
            board.id === selectedId ? 'bg-blue-50 text-blue-700' : ''
          } ${level === 0 ? 'font-medium' : ''}`}
          style={{ paddingLeft: `${level * 12 + 12}px` }}
          onClick={() => {
            onSelect(board.id);
            setShowDropdown(false);
          }}
        >
          {level > 0 && <span className="text-gray-400 mr-1">ㄴ</span>}
          {board.name} {board.id === currentBoardId ? "(현재 게시판)" : ""}
        </div>
        
        {/* 재귀적으로 하위 게시판 렌더링 */}
        {board.children && board.children.length > 0 && 
          renderBoardOptions(board.children, level + 1)}
      </React.Fragment>
    ));
  };
  
  // 선택된 게시판 이름 찾기
  const findBoardName = (id: string): string => {
    const findInBoards = (boardList: Board[]): string | null => {
      for (const board of boardList) {
        if (board.id === id) return board.name;
        if (board.children && board.children.length > 0) {
          const found = findInBoards(board.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    if (!id) return "게시판을 선택하세요";
    const organizedBoards = organizeBoards(boards);
    const name = findInBoards(organizedBoards);
    return name || "게시판 선택";
  };
  
  return (
    <div className="w-full relative" ref={dropdownRef}>
      {/* 현재 선택된 게시판 표시 */}
      <div
        className="w-full border border-gray-300 rounded-md px-3 py-2 cursor-pointer flex justify-between items-center"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <span>{findBoardName(selectedId || '')}</span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </div>
      
      {/* 커스텀 드롭다운 */}
      {showDropdown && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          <div className="py-1">
            {renderBoardOptions(organizeBoards(boards))}
          </div>
        </div>
      )}
    </div>
  );
} 