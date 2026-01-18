'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronDown, X, Trash2 } from 'lucide-react';
import { useRecentlyVisited } from '../hooks/useRecentlyVisited';

// 게시판이 아닌 페이지들 (boards prefix 불필요)
const NON_BOARD_PREFIXES = ['shop', 'livescore', 'transfers', 'admin', 'settings'];

// slug에 따라 올바른 경로 반환
const getHref = (slug: string): string => {
  // 이미 boards/로 시작하면 그대로 사용
  if (slug.startsWith('boards/')) {
    return `/${slug}`;
  }
  // 게시판이 아닌 페이지인지 확인
  const isNonBoard = NON_BOARD_PREFIXES.some(prefix => slug.startsWith(prefix));
  return isNonBoard ? `/${slug}` : `/boards/${slug}`;
};

const RecentlyVisited = React.memo(function RecentlyVisited() {
  const {
    recentBoards,
    isExpanded,
    isMounted,
    removeBoard,
    clearAll,
    toggleExpanded
  } = useRecentlyVisited();

  // SSR 보호
  if (!isMounted) {
    return null;
  }

  return (
    <div className="bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
      <div className="w-full max-w-[1400px] mx-auto px-4">
        {isExpanded ? (
          // 펼쳐진 상태 - 여러 줄
          <div className="py-3">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                최근방문
              </span>
              <button
                onClick={toggleExpanded}
                className="p-1 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded transition-colors"
              >
                <ChevronDown className="h-4 w-4 text-gray-500 rotate-180 transition-transform" />
              </button>
            </div>

            {/* 태그들 */}
            {recentBoards.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {recentBoards.map(board => (
                    <div
                      key={board.id}
                      className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300 group"
                    >
                      <Link
                        href={getHref(board.slug)}
                        className="hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline transition-colors"
                      >
                        {board.name}
                      </Link>
                      <button
                        onClick={() => removeBoard(board.id)}
                        className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* 전체 삭제 */}
                <div className="flex justify-end mt-2">
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    전체 삭제
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs text-gray-700 dark:text-gray-300">
                방문한 페이지가 없습니다
              </p>
            )}
          </div>
        ) : (
          // 접힌 상태 - 한 줄 스크롤
          <div className="flex items-center gap-2 py-2">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 shrink-0">
              최근방문
            </span>

            <div className="flex-1 flex items-center overflow-x-auto no-scrollbar">
              {recentBoards.length > 0 ? (
                <div className="flex items-center gap-3">
                  {recentBoards.map(board => (
                    <div
                      key={board.id}
                      className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300 shrink-0 group"
                    >
                      <Link
                        href={getHref(board.slug)}
                        className="hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:underline transition-colors whitespace-nowrap"
                      >
                        {board.name}
                      </Link>
                      <button
                        onClick={() => removeBoard(board.id)}
                        className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  방문한 페이지가 없습니다
                </span>
              )}
            </div>

            <button
              onClick={toggleExpanded}
              className="p-1 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded transition-colors shrink-0"
            >
              <ChevronDown className="h-4 w-4 text-gray-500 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default RecentlyVisited;
