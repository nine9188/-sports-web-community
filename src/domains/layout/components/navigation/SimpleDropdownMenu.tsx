'use client';

import React from 'react';
import ReactDOM from 'react-dom';
import Link from 'next/link';
import { Board } from '../../types/board';

interface SimpleDropdownMenuProps {
  board: Board;
  position: { top: number; left: number };
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

// 가상 보드 중 /boards/ 경로를 사용하는 보드 ID 목록
const BOARD_PATH_NAV_IDS = ['nav-posts', 'nav-all', 'nav-popular', 'nav-sports', 'nav-community'];

// 보드 링크 생성 헬퍼 함수
const getBoardHref = (board: Board): string => {
  if (board.id.startsWith('nav-')) {
    if (BOARD_PATH_NAV_IDS.includes(board.id)) {
      return `/boards/${board.slug}`;
    }
    return `/${board.slug}`;
  }
  return `/boards/${board.slug || board.id}`;
};

const SimpleDropdownMenu = React.memo(function SimpleDropdownMenu({
  board,
  position,
  onClose,
  onMouseEnter,
  onMouseLeave
}: SimpleDropdownMenuProps) {
  const children = board.children || [];

  return ReactDOM.createPortal(
    <div
      className="fixed hidden md:block"
      style={{
        top: `${position.top + 4}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
        zIndex: 60
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* 메뉴 본체 */}
      <div
        className="bg-white dark:bg-[#1D1D1D] border border-black/10 dark:border-white/10 rounded-lg shadow-xl overflow-visible mt-2"
        style={{
          minWidth: '140px',
          maxWidth: '180px',
        }}
      >
        {children.length > 0 ? (
          children
            .sort((a, b) => a.display_order - b.display_order)
            .map((child, index, arr) => (
              index === 0 ? (
                <Link
                  key={child.id}
                  href={getBoardHref(child)}
                  className="group block relative"
                  onClick={onClose}
                >
                  {/* 위쪽 화살표 - 테두리 */}
                  <div className="absolute -top-[9px] left-1/2 -translate-x-1/2 flex justify-center">
                    <div
                      className="w-0 h-0 dark:hidden"
                      style={{
                        borderLeft: '9px solid transparent',
                        borderRight: '9px solid transparent',
                        borderBottom: '9px solid rgba(0,0,0,0.1)',
                      }}
                    />
                    <div
                      className="w-0 h-0 hidden dark:block"
                      style={{
                        borderLeft: '9px solid transparent',
                        borderRight: '9px solid transparent',
                        borderBottom: '9px solid rgba(255,255,255,0.1)',
                      }}
                    />
                  </div>
                  {/* 위쪽 화살표 - 채우기 */}
                  <div className="absolute -top-[7px] left-1/2 -translate-x-1/2 flex justify-center">
                    <div
                      className="w-0 h-0 dark:hidden transition-colors"
                      style={{
                        borderLeft: '8px solid transparent',
                        borderRight: '8px solid transparent',
                        borderBottom: '8px solid white',
                      }}
                    />
                    <div
                      className="w-0 h-0 hidden dark:block transition-colors"
                      style={{
                        borderLeft: '8px solid transparent',
                        borderRight: '8px solid transparent',
                        borderBottom: '8px solid #1D1D1D',
                      }}
                    />
                    {/* 호버 시 화살표 */}
                    <div
                      className="w-0 h-0 absolute opacity-0 group-hover:opacity-100 dark:hidden transition-opacity"
                      style={{
                        borderLeft: '8px solid transparent',
                        borderRight: '8px solid transparent',
                        borderBottom: '8px solid #EAEAEA',
                      }}
                    />
                    <div
                      className="w-0 h-0 absolute hidden dark:block opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        borderLeft: '8px solid transparent',
                        borderRight: '8px solid transparent',
                        borderBottom: '8px solid #333333',
                      }}
                    />
                  </div>
                  <div className={`px-4 py-2 text-sm text-gray-700 dark:text-gray-300 group-hover:bg-[#EAEAEA] dark:group-hover:bg-[#333333] transition-colors truncate ${arr.length === 1 ? '' : ''}`}>
                    {child.name}
                  </div>
                </Link>
              ) : (
                <Link
                  key={child.id}
                  href={getBoardHref(child)}
                  className={`block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors truncate`}
                  onClick={onClose}
                >
                  {child.name}
                </Link>
              )
            ))
        ) : (
          <div className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
            하위 게시판이 없습니다
          </div>
        )}
      </div>
    </div>,
    document.body
  );
});

export default SimpleDropdownMenu;
