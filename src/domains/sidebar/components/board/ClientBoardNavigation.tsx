'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { BoardNavigationData, HierarchicalBoard } from '../../types';

// 게시판 카테고리 컴포넌트 타입 정의
type BoardCategoryItemProps = { 
  board: HierarchicalBoard;
  pathname: string;
  depth?: number;
  expandedCategories: Set<string>;
  toggleCategory: (id: string) => void;
};

// 게시판 카테고리 아이템 컴포넌트
const BoardCategoryItem = ({ 
  board, 
  pathname,
  depth = 0,
  expandedCategories,
  toggleCategory
}: BoardCategoryItemProps) => {
  const isActive = pathname === `/boards/${board.slug}`;
  const hasChildren = board.children && board.children.length > 0;
  const isExpanded = expandedCategories.has(board.id);

  return (
    <div key={board.id}>
      <div>
        <div
          className={`flex items-center text-sm py-2 px-4 transition-colors ${
            isActive
              ? 'bg-[#EAEAEA] dark:bg-[#333333] text-gray-900 dark:text-[#F0F0F0] font-medium'
              : 'hover:bg-[#EAEAEA] dark:hover:bg-[#333333] text-gray-900 dark:text-[#F0F0F0]'
          }`}
          style={{ paddingLeft: `${depth * 12 + 16}px` }}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleCategory(board.id)}
              className="mr-1.5 flex-shrink-0 text-gray-400 dark:text-gray-500"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-5 h-5 mr-1.5"></div>
          )}

          <Link
            href={`/boards/${board.slug}`}
            className="flex-1 truncate"
            onClick={(e) => {
              if (hasChildren && !isExpanded) {
                e.preventDefault();
                toggleCategory(board.id);
              }
            }}
          >
            {board.name}
          </Link>
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div>
          {board.children.map((child) => (
            <BoardCategoryItem
              key={child.id}
              board={child}
              pathname={pathname}
              depth={depth + 1}
              expandedCategories={expandedCategories}
              toggleCategory={toggleCategory}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// 클라이언트 게시판 내비게이션 컴포넌트
export default function ClientBoardNavigation({ 
  initialData 
}: { 
  initialData: BoardNavigationData
}) {
  const pathname = usePathname() || '';
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // 카테고리 토글 핸들러
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };
  
  return (
    <div>
      {initialData.rootBoards.map((board) => (
        <BoardCategoryItem
          key={board.id}
          board={board}
          pathname={pathname}
          expandedCategories={expandedCategories}
          toggleCategory={toggleCategory}
        />
      ))}
    </div>
  );
} 