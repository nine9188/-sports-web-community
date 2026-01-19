'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, Flame, Timer, ArrowLeftRight, Database, ShoppingBag, FileText } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { BoardNavigationData, HierarchicalBoard } from '../../types';

// 빠른 이동 메뉴 항목 (전체글 제외 - 별도 처리)
const quickMenuItems = [
  { href: '/boards/popular', label: '인기글', icon: Flame },
  { href: '/livescore/football', label: '라이브스코어', icon: Timer },
  { href: '/transfers', label: '이적시장', icon: ArrowLeftRight },
  { href: '/livescore/football/leagues', label: '데이터센터', icon: Database },
  { href: '/shop', label: '아이콘샵', icon: ShoppingBag },
];

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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleCategory(board.id)}
              className="mr-1.5 flex-shrink-0 text-gray-400 dark:text-gray-500 h-auto w-auto p-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
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
  
  const isAllPostsActive = pathname === '/boards/all';

  // 숫자 포맷팅 (1000 이상이면 K 단위로)
  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toLocaleString();
  };

  return (
    <div>
      {/* 전체글 (개수 표시) */}
      <Link
        href="/boards/all"
        className={`flex items-center justify-between text-sm py-2 px-4 transition-colors ${
          isAllPostsActive
            ? 'bg-[#EAEAEA] dark:bg-[#333333] text-gray-900 dark:text-[#F0F0F0] font-medium'
            : 'hover:bg-[#EAEAEA] dark:hover:bg-[#333333] text-gray-900 dark:text-[#F0F0F0]'
        }`}
      >
        <div className="flex items-center gap-3">
          <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span>전체글</span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatCount(initialData.totalPostCount || 0)}
        </span>
      </Link>

      {/* 빠른 이동 메뉴 */}
      {quickMenuItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 text-sm py-2 px-4 transition-colors ${
              isActive
                ? 'bg-[#EAEAEA] dark:bg-[#333333] text-gray-900 dark:text-[#F0F0F0] font-medium'
                : 'hover:bg-[#EAEAEA] dark:hover:bg-[#333333] text-gray-900 dark:text-[#F0F0F0]'
            }`}
          >
            <item.icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span>{item.label}</span>
          </Link>
        );
      })}

      {/* 구분선 */}
      <div className="my-2 mx-4 border-t border-black/7 dark:border-white/10" />

      {/* 게시판 목록 */}
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