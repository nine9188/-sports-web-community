'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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

const BoardSelector = React.memo(({ 
  boards = [],
  selectedId, 
  onSelect, 
  currentBoardId,
}: BoardSelectorProps) => {
  // 3단계 선택 상태
  const [showTopDropdown, setShowTopDropdown] = useState(false);
  const [showMidDropdown, setShowMidDropdown] = useState(false);
  const [showBottomDropdown, setShowBottomDropdown] = useState(false);
  
  const [selectedTop, setSelectedTop] = useState<Board | null>(null);
  const [selectedMid, setSelectedMid] = useState<Board | null>(null);
  const [selectedBottom, setSelectedBottom] = useState<Board | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  
  // 참조값
  const topDropdownRef = useRef<HTMLDivElement>(null);
  const midDropdownRef = useRef<HTMLDivElement>(null);
  const bottomDropdownRef = useRef<HTMLDivElement>(null);
  
  // 입력 데이터 유효성 검사
  useEffect(() => {
    if (!boards || boards.length === 0) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [boards]);
  
  // 3단계 계층 구조 데이터 처리
  const { topLevelBoards, midLevelBoards, bottomLevelBoards } = useMemo(() => {
    if (!boards || boards.length === 0) {
      return {
        topLevelBoards: [] as Board[],
        midLevelBoards: {} as Record<string, Board[]>,
        bottomLevelBoards: {} as Record<string, Board[]>
      };
    }

    const boardsById = new Map<string, Board>();
    const boardsByParent = new Map<string | null, Board[]>();
    
    // 게시판 맵핑
    for (const board of boards) {
      boardsById.set(board.id, board);
      
      const parentId = board.parent_id;
      if (!boardsByParent.has(parentId)) {
        boardsByParent.set(parentId, []);
      }
      boardsByParent.get(parentId)!.push(board);
    }

    // 정렬 함수
    const sortBoards = (boardList: Board[]) => {
      return boardList.sort((a, b) => {
        if (a.display_order !== b.display_order) {
          return a.display_order - b.display_order;
        }
        return a.name.localeCompare(b.name);
      });
    };

    // 1단계: 최상위 게시판 (parent_id가 null인 게시판)
    const topBoards = sortBoards(boardsByParent.get(null) || []);

    // 2단계: 중간 게시판 (최상위 게시판의 자식들)
    const midBoards: Record<string, Board[]> = {};
    for (const topBoard of topBoards) {
      const children = boardsByParent.get(topBoard.id) || [];
      if (children.length > 0) {
        midBoards[topBoard.id] = sortBoards(children);
      }
    }

    // 3단계: 하위 게시판 (중간 게시판의 자식들)
    const bottomBoards: Record<string, Board[]> = {};
    for (const topBoard of topBoards) {
      const midChildren = midBoards[topBoard.id] || [];
      for (const midBoard of midChildren) {
        const children = boardsByParent.get(midBoard.id) || [];
        if (children.length > 0) {
          bottomBoards[midBoard.id] = sortBoards(children);
        }
      }
    }

    return { 
      topLevelBoards: topBoards, 
      midLevelBoards: midBoards, 
      bottomLevelBoards: bottomBoards 
    };
  }, [boards]);
  
  // 클릭 외부 처리
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (topDropdownRef.current && !topDropdownRef.current.contains(event.target as Node)) {
        setShowTopDropdown(false);
      }
      if (midDropdownRef.current && !midDropdownRef.current.contains(event.target as Node)) {
        setShowMidDropdown(false);
      }
      if (bottomDropdownRef.current && !bottomDropdownRef.current.contains(event.target as Node)) {
        setShowBottomDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // 초기 선택값 설정
  useEffect(() => {
    if (!selectedId || !boards.length) return;
    
    // 선택된 게시판 찾기
    const selectedBoard = boards.find(b => b.id === selectedId);
    if (!selectedBoard) return;
    
    // 계층 구조 파악
    const findHierarchy = (boardId: string): { top: Board | null, mid: Board | null, bottom: Board | null } => {
      const board = boards.find(b => b.id === boardId);
      if (!board) return { top: null, mid: null, bottom: null };
      
      // 최상위 게시판인 경우
      if (!board.parent_id) {
        return { top: board, mid: null, bottom: null };
      }
      
      // 중간 게시판인 경우
      const parent = boards.find(b => b.id === board.parent_id);
      if (parent && !parent.parent_id) {
        return { top: parent, mid: board, bottom: null };
      }
      
      // 하위 게시판인 경우
      if (parent && parent.parent_id) {
        const grandParent = boards.find(b => b.id === parent.parent_id);
        return { top: grandParent || null, mid: parent, bottom: board };
      }
      
      return { top: null, mid: null, bottom: null };
    };
    
    const hierarchy = findHierarchy(selectedId);
    setSelectedTop(hierarchy.top);
    setSelectedMid(hierarchy.mid);
    setSelectedBottom(hierarchy.bottom);
  }, [selectedId, boards]);
  
  // 드롭다운 토글
  const toggleTopDropdown = useCallback(() => {
    setShowTopDropdown(prev => !prev);
    setShowMidDropdown(false);
    setShowBottomDropdown(false);
  }, []);
  
  const toggleMidDropdown = useCallback(() => {
    setShowMidDropdown(prev => !prev);
    setShowTopDropdown(false);
    setShowBottomDropdown(false);
  }, []);
  
  const toggleBottomDropdown = useCallback(() => {
    setShowBottomDropdown(prev => !prev);
    setShowTopDropdown(false);
    setShowMidDropdown(false);
  }, []);
  
  // 최상위 게시판 선택
  const handleTopSelect = useCallback((board: Board) => {
    setSelectedTop(board);
    setSelectedMid(null);
    setSelectedBottom(null);
    setShowTopDropdown(false);
    onSelect(board.id);
  }, [onSelect]);
  
  // 중간 게시판 선택
  const handleMidSelect = useCallback((board: Board) => {
    setSelectedMid(board);
    setSelectedBottom(null);
    setShowMidDropdown(false);
    onSelect(board.id);
  }, [onSelect]);
  
  // 하위 게시판 선택
  const handleBottomSelect = useCallback((board: Board) => {
    setSelectedBottom(board);
    setShowBottomDropdown(false);
    onSelect(board.id);
  }, [onSelect]);
  
  // 중간 게시판 선택 건너뛰기
  const handleSkipMid = useCallback(() => {
    if (selectedTop) {
      setSelectedMid(null);
      setSelectedBottom(null);
      setShowMidDropdown(false);
      onSelect(selectedTop.id);
    }
  }, [selectedTop, onSelect]);
  
  // 하위 게시판 선택 건너뛰기
  const handleSkipBottom = useCallback(() => {
    if (selectedMid) {
      setSelectedBottom(null);
      setShowBottomDropdown(false);
      onSelect(selectedMid.id);
    }
  }, [selectedMid, onSelect]);
  
  // 최상위 게시판 옵션 렌더링
  const renderTopOptions = useCallback(() => {
    if (isLoading || !topLevelBoards || topLevelBoards.length === 0) {
      return (
        <div className="px-3 py-1.5 text-gray-500 dark:text-gray-400">
          {isLoading ? "게시판 데이터를 불러오는 중입니다..." : "게시판이 없습니다."}
        </div>
      );
    }
    
    return topLevelBoards.map(board => (
      <div 
        key={board.id}
        className={`px-3 py-1.5 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] cursor-pointer transition-colors ${
          board.id === selectedTop?.id ? 'bg-[#EAEAEA] dark:bg-[#333333] text-gray-900 dark:text-[#F0F0F0]' : 'text-gray-900 dark:text-[#F0F0F0]'
        } font-medium`}
        onClick={() => handleTopSelect(board)}
      >
        {board.name}
        {board.id === currentBoardId ? " (현재 게시판)" : ""}
      </div>
    ));
  }, [topLevelBoards, selectedTop, currentBoardId, handleTopSelect, isLoading]);
  
  // 중간 게시판 옵션 렌더링
  const renderMidOptions = useCallback(() => {
    const options = [];
    
    // 선택 안함 옵션
    options.push(
      <div 
        key="skip-mid"
        className={`px-3 py-1.5 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] cursor-pointer transition-colors ${
          !selectedMid ? 'bg-[#EAEAEA] dark:bg-[#333333] text-gray-900 dark:text-[#F0F0F0]' : 'text-gray-900 dark:text-[#F0F0F0]'
        } font-medium border-b border-black/5 dark:border-white/10`}
        onClick={handleSkipMid}
      >
        중간 게시판 선택 안함
      </div>
    );
    
    if (!selectedTop) {
      return options;
    }
    
    const midBoards = midLevelBoards[selectedTop.id] || [];
    if (midBoards.length === 0) {
      return options;
    }
    
    midBoards.forEach(board => {
      options.push(
        <div 
          key={board.id}
          className={`px-3 py-1.5 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] cursor-pointer transition-colors ${
            board.id === selectedMid?.id ? 'bg-[#EAEAEA] dark:bg-[#333333] text-gray-900 dark:text-[#F0F0F0]' : 'text-gray-900 dark:text-[#F0F0F0]'
          }`}
          onClick={() => handleMidSelect(board)}
        >
          {board.name}
          {board.id === currentBoardId ? " (현재 게시판)" : ""}
        </div>
      );
    });
    
    return options;
  }, [selectedTop, selectedMid, currentBoardId, handleMidSelect, handleSkipMid, midLevelBoards]);
  
  // 하위 게시판 옵션 렌더링
  const renderBottomOptions = useCallback(() => {
    const options = [];
    
    // 선택 안함 옵션
    options.push(
      <div 
        key="skip-bottom"
        className={`px-3 py-1.5 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] cursor-pointer transition-colors ${
          !selectedBottom ? 'bg-[#EAEAEA] dark:bg-[#333333] text-gray-900 dark:text-[#F0F0F0]' : 'text-gray-900 dark:text-[#F0F0F0]'
        } font-medium border-b border-black/5 dark:border-white/10`}
        onClick={handleSkipBottom}
      >
        하위 게시판 선택 안함
      </div>
    );
    
    if (!selectedMid) {
      return options;
    }
    
    const bottomBoards = bottomLevelBoards[selectedMid.id] || [];
    if (bottomBoards.length === 0) {
      return options;
    }
    
    bottomBoards.forEach(board => {
      options.push(
        <div 
          key={board.id}
          className={`px-3 py-1.5 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] cursor-pointer transition-colors ${
            board.id === selectedBottom?.id ? 'bg-[#EAEAEA] dark:bg-[#333333] text-gray-900 dark:text-[#F0F0F0]' : 'text-gray-900 dark:text-[#F0F0F0]'
          }`}
          onClick={() => handleBottomSelect(board)}
        >
          {board.name}
          {board.id === currentBoardId ? " (현재 게시판)" : ""}
        </div>
      );
    });
    
    return options;
  }, [selectedMid, selectedBottom, currentBoardId, handleBottomSelect, handleSkipBottom, bottomLevelBoards]);
  
  // 중간/하위 게시판 존재 여부 확인
  const hasMidBoards = useMemo(() => {
    if (!selectedTop) return false;
    return midLevelBoards[selectedTop.id] && midLevelBoards[selectedTop.id].length > 0;
  }, [selectedTop, midLevelBoards]);
  
  const hasBottomBoards = useMemo(() => {
    if (!selectedMid) return false;
    return bottomLevelBoards[selectedMid.id] && bottomLevelBoards[selectedMid.id].length > 0;
  }, [selectedMid, bottomLevelBoards]);
  
  // 선택된 게시판 이름 계산
  const getSelectedBoardName = useCallback(() => {
    if (selectedBottom) return selectedBottom.name;
    if (selectedMid) return selectedMid.name;
    if (selectedTop) return selectedTop.name;
    return null;
  }, [selectedTop, selectedMid, selectedBottom]);

  return (
    <div className="w-full space-y-3">
      {/* 가로 정렬 컨테이너 */}
      <div className="flex flex-wrap gap-3">
        {/* 1단계: 최상위 게시판 선택 */}
        <div className="flex-1 min-w-[200px] relative" ref={topDropdownRef}>
          <div
            className={`w-full border border-black/7 dark:border-white/10 rounded-md px-3 py-2 cursor-pointer flex justify-between items-center bg-white dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] transition-colors ${
              isLoading ? 'bg-[#F5F5F5] dark:bg-[#333333]' : ''
            }`}
            onClick={toggleTopDropdown}
          >
            <span className="text-sm truncate">
              {isLoading
                ? "게시판 데이터를 불러오는 중..."
                : selectedTop
                  ? selectedTop.name
                  : "최상위 게시판 선택 (필수)"}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2" />
          </div>

          {showTopDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-white/10 rounded-md shadow-lg max-h-60 overflow-y-auto">
              <div className="py-1">
                {renderTopOptions()}
              </div>
            </div>
          )}
        </div>

        {/* 2단계: 중간 게시판 선택 */}
        <div className="flex-1 min-w-[200px] relative" ref={midDropdownRef}>
          <div
            className={`w-full border border-black/7 dark:border-white/10 rounded-md px-3 py-2 flex justify-between items-center transition-colors ${
              !selectedTop || !hasMidBoards
                ? 'bg-gray-100 dark:bg-[#1A1A1A] text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : 'bg-white dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] cursor-pointer'
            }`}
            onClick={selectedTop && hasMidBoards ? toggleMidDropdown : undefined}
          >
            <span className="text-sm truncate">
              {!selectedTop
                ? "중간 게시판 선택 (선택)"
                : !hasMidBoards
                ? "중간 게시판 없음"
                : selectedMid
                ? selectedMid.name
                : "중간 게시판 선택 (선택)"}
            </span>
            <ChevronDown className={`h-4 w-4 flex-shrink-0 ml-2 ${
              !selectedTop || !hasMidBoards ? 'text-gray-300 dark:text-gray-700' : 'text-gray-400 dark:text-gray-500'
            }`} />
          </div>

          {showMidDropdown && selectedTop && hasMidBoards && (
            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-white/10 rounded-md shadow-lg max-h-60 overflow-y-auto">
              <div className="py-1">
                {renderMidOptions()}
              </div>
            </div>
          )}
        </div>

        {/* 3단계: 하위 게시판 선택 */}
        <div className="flex-1 min-w-[200px] relative" ref={bottomDropdownRef}>
          <div
            className={`w-full border border-black/7 dark:border-white/10 rounded-md px-3 py-2 flex justify-between items-center transition-colors ${
              !selectedMid || !hasBottomBoards
                ? 'bg-gray-100 dark:bg-[#1A1A1A] text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : 'bg-white dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] cursor-pointer'
            }`}
            onClick={selectedMid && hasBottomBoards ? toggleBottomDropdown : undefined}
          >
            <span className="text-sm truncate">
              {!selectedMid
                ? "하위 게시판 선택 (선택)"
                : !hasBottomBoards
                ? "하위 게시판 없음"
                : selectedBottom
                ? selectedBottom.name
                : "하위 게시판 선택 (선택)"}
            </span>
            <ChevronDown className={`h-4 w-4 flex-shrink-0 ml-2 ${
              !selectedMid || !hasBottomBoards ? 'text-gray-300 dark:text-gray-700' : 'text-gray-400 dark:text-gray-500'
            }`} />
          </div>

          {showBottomDropdown && selectedMid && hasBottomBoards && (
            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-white/10 rounded-md shadow-lg max-h-60 overflow-y-auto">
              <div className="py-1">
                {renderBottomOptions()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 선택된 게시판 표시 */}
      {getSelectedBoardName() && (
        <div className="px-3 py-2 bg-[#F5F5F5] dark:bg-[#262626] rounded-md border border-black/7 dark:border-white/10">
          <span className="text-sm text-gray-900 dark:text-[#F0F0F0]">
            선택된 게시판: <span className="font-medium">{getSelectedBoardName()}</span>
          </span>
        </div>
      )}
    </div>
  );
});

BoardSelector.displayName = 'BoardSelector';

export default BoardSelector;
