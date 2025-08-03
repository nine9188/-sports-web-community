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
      className="fixed bg-white border-b border-gray-200 shadow-lg hidden md:block"
      style={{
        top: `${position.top}px`,
        left: '0',
        right: '0',
        width: '100vw',
        maxHeight: '60vh',
        overflowY: 'auto',
        zIndex: 50
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="container mx-auto">
        <div className="px-4 py-4">
          <div className="flex gap-6">
            {/* 좌측: 2차 메뉴 리스트 */}
            <div className="w-56 flex-shrink-0">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                {board.name}
              </h3>
              <div className="space-y-1">
                {board.children && board.children.length > 0 ? (
                  board.children
                    .sort((a, b) => a.display_order - b.display_order)
                    .map(secondLevel => (
                      <button
                        key={secondLevel.id}
                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                          selectedSecondLevel?.id === secondLevel.id
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                        onMouseEnter={() => setSelectedSecondLevel(secondLevel)}
                        onClick={() => {
                          window.location.href = `/boards/${secondLevel.slug || secondLevel.id}`;
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
                  <div className="px-3 py-2 text-sm text-gray-500">
                    하위 카테고리가 없습니다
                  </div>
                )}
              </div>
            </div>

            {/* 구분선 */}
            <div className="w-px bg-gray-200"></div>

            {/* 우측: 3차 메뉴 그리드 */}
            <div className="flex-1 min-w-0">
              {selectedSecondLevel ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">
                      {selectedSecondLevel.name}
                    </h4>
                    <Link
                      href={`/boards/${selectedSecondLevel.slug || selectedSecondLevel.id}`}
                      className="text-xs text-blue-600 hover:text-blue-700"
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
                              href={`/boards/${thirdLevel.slug || thirdLevel.id}`}
                              className="block px-2 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
                              onClick={onClose}
                            >
                              <span className="truncate">{thirdLevel.name}</span>
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 py-8 text-center">
                      <div>게시판이 없습니다</div>
                      <div className="text-xs text-gray-400 mt-1">(대분류를 선택하세요)</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500 py-8 text-center">
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