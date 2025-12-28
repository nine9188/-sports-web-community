'use client';

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Link from 'next/link';
import { Board } from '../../types/board';

interface MegaDropdownMenuProps {
  board: Board;
  position: { top: number; left: number };
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

// 가상 보드 중 /boards/ 경로를 사용하는 보드 ID 목록
const BOARD_PATH_NAV_IDS = ['nav-posts', 'nav-all', 'nav-popular'];

// 보드 링크 생성 헬퍼 함수
const getBoardHref = (board: Board): string => {
  // 가상 보드인 경우 (nav- 프리픽스)
  if (board.id.startsWith('nav-')) {
    // 글 관련 가상 보드는 /boards/ 경로 사용
    if (BOARD_PATH_NAV_IDS.includes(board.id)) {
      return `/boards/${board.slug}`;
    }
    // 축구 관련 가상 보드는 직접 경로 사용
    return `/${board.slug}`;
  }
  // 일반 게시판
  return `/boards/${board.slug || board.id}`;
};

const MegaDropdownMenu = React.memo(function MegaDropdownMenu({ 
  board, 
  position, 
  onClose,
  onMouseEnter,
  onMouseLeave
}: MegaDropdownMenuProps) {
  const [selectedSecondLevel, setSelectedSecondLevel] = useState<Board | null>(() => {
    // 초기값으로 첫 번째 2차 메뉴 선택
    return board.children && board.children.length > 0 ? board.children[0] : null;
  });

  // board가 변경될 때마다 첫 번째 2차 메뉴로 리셋
  useEffect(() => {
    setSelectedSecondLevel(
      board.children && board.children.length > 0 ? board.children[0] : null
    );
  }, [board]);

  // 3차 메뉴를 5x4 그리드로 나누기
  const getGridItems = (items: Board[]) => {
    const ITEMS_PER_COLUMN = 5;
    const columns: Board[][] = [];
    
    for (let i = 0; i < items.length; i += ITEMS_PER_COLUMN) {
      columns.push(items.slice(i, i + ITEMS_PER_COLUMN));
    }
    
    return columns;
  };

  const thirdLevelItems = selectedSecondLevel?.children || [];
  const gridColumns = getGridItems(thirdLevelItems);

  return ReactDOM.createPortal(
    <div
      className="fixed bg-white dark:bg-[#1D1D1D] border-y border-black/5 dark:border-white/10 shadow-lg hidden md:block"
      style={{
        top: `${position.top}px`,
        left: '0',
        right: '0',
        width: '100vw',
        maxHeight: '60vh',
        overflowY: 'auto',
        zIndex: 60
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="container mx-auto">
        <div className="px-4 py-4">
          <div className="flex gap-6">
            {/* 좌측: 2차 메뉴 리스트 */}
            <div className="w-56 flex-shrink-0">
              <Link
                href={getBoardHref(board)}
                className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0] hover:text-gray-600 dark:hover:text-gray-300 transition-colors inline-flex items-center gap-1 mb-3"
                onClick={onClose}
              >
                {board.name}
                <span className="text-xs text-gray-400">→</span>
              </Link>
              <div className="space-y-1">
                {board.children && board.children.length > 0 ? (
                  board.children
                    .sort((a, b) => a.display_order - b.display_order)
                    .map(secondLevel => (
                      <button
                        key={secondLevel.id}
                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                          selectedSecondLevel?.id === secondLevel.id
                            ? 'bg-[#EAEAEA] dark:bg-[#333333] text-gray-900 dark:text-[#F0F0F0] font-medium'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
                        }`}
                        onMouseEnter={() => setSelectedSecondLevel(secondLevel)}
                        onClick={() => {
                          window.location.href = getBoardHref(secondLevel);
                          onClose();
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span>{secondLevel.name}</span>
                          {secondLevel.children && secondLevel.children.length > 0 && (
                            <span className="text-xs text-gray-400 ml-2">
                              {secondLevel.children.length}
                            </span>
                          )}
                        </div>
                      </button>
                    ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                    하위 카테고리가 없습니다
                  </div>
                )}
              </div>
            </div>

            {/* 구분선 */}
            <div className="w-px bg-black/5 dark:bg-white/10"></div>

            {/* 우측: 3차 메뉴 그리드 */}
            <div className="flex-1 min-w-0">
              {selectedSecondLevel ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">
                      {selectedSecondLevel.name}
                    </h4>
                    <Link
                      href={getBoardHref(selectedSecondLevel)}
                      className="text-xs text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-[#F0F0F0] transition-colors"
                      onClick={onClose}
                    >
                      전체 보기 →
                    </Link>
                  </div>

                  {thirdLevelItems.length > 0 ? (
                    <div className="grid gap-4" style={{
                      gridTemplateColumns: `repeat(${Math.min(gridColumns.length, 5)}, 1fr)`
                    }}>
                      {gridColumns.slice(0, 5).map((column, columnIndex) => (
                        <div key={columnIndex} className="space-y-1">
                          {column.map((thirdLevel) => (
                            <Link
                              key={thirdLevel.id}
                              href={getBoardHref(thirdLevel)}
                              className="block px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded transition-colors"
                              onClick={onClose}
                            >
                              <span className="truncate">{thirdLevel.name}</span>
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
                      <div>게시판이 없습니다</div>
                      <div className="text-xs text-gray-400 mt-1">(대분류를 선택하세요)</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
                  <div>카테고리를 선택해주세요</div>
                  <div className="text-xs text-gray-400 mt-1">(대분류를 선택하세요)</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
});

export default MegaDropdownMenu; 