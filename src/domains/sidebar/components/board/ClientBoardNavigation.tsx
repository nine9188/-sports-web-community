'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, Flame, Timer, ArrowLeftRight, Database, ShoppingBag, FileText, Settings } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { BoardNavigationData, HierarchicalBoard } from '../../types';
import { Board } from '@/domains/layout/types/board';

// 빠른 이동 메뉴 항목 (전체글 제외 - 별도 처리)
const quickMenuItems = [
  { href: '/boards/popular', label: '인기글', icon: Flame },
  { href: '/livescore/football', label: '라이브스코어', icon: Timer },
  { href: '/transfers', label: '이적시장', icon: ArrowLeftRight },
  { href: '/livescore/football/leagues', label: '데이터센터', icon: Database },
  { href: '/shop', label: '아이콘샵', icon: ShoppingBag },
];

// 네비에서 제외할 보드 slug 목록 (가상 그룹으로 묶임)
const EXCLUDED_BOARD_SLUGS = ['soccer', 'k-league', 'news', 'data-analysis', 'free', 'hotdeal', 'market', 'review', 'creative'];

// 가상 네비게이션 Board 데이터 생성 (헤더와 동일한 구조)
const createNavBoards = (boards: Board[]): Board[] => {
  // 모든 보드를 flat하게 펼침 (하위 포함)
  const flattenBoards = (boardList: Board[]): Board[] => {
    const result: Board[] = [];
    boardList.forEach(board => {
      result.push(board);
      if (board.children && board.children.length > 0) {
        result.push(...flattenBoards(board.children));
      }
    });
    return result;
  };

  const allBoards = flattenBoards(boards);

  // 실제 보드에서 필요한 것들 찾기 - 스포츠
  const soccerBoard = allBoards.find(b => b.slug === 'soccer');
  const kleagueBoard = allBoards.find(b => b.slug === 'k-league');
  const newsBoard = allBoards.find(b => b.slug === 'news');
  const dataAnalysisBoard = allBoards.find(b => b.slug === 'data-analysis');

  // 실제 보드에서 필요한 것들 찾기 - 커뮤니티
  const freeBoard = allBoards.find(b => b.slug === 'free');
  const hotdealBoard = allBoards.find(b => b.slug === 'hotdeal');
  const marketBoard = allBoards.find(b => b.slug === 'market');
  const reviewBoard = allBoards.find(b => b.slug === 'review');
  const creativeBoard = allBoards.find(b => b.slug === 'creative');

  // 제외 목록에 없는 루트 보드들 (공지사항, 유튜브 등)
  const otherBoards = boards.filter(b => !EXCLUDED_BOARD_SLUGS.includes(b.slug || ''));

  return [
    // 나머지 보드 (공지사항 등)
    ...otherBoards,
    // 스포츠 그룹
    {
      id: 'nav-sports',
      name: '스포츠',
      slug: 'soccer',
      parent_id: null,
      display_order: 100,
      children: [
        ...(soccerBoard ? [{ ...soccerBoard, name: '해외축구', parent_id: 'nav-sports', display_order: 0, children: [] }] : []),
        ...(kleagueBoard ? [{ ...kleagueBoard, name: '국내축구', parent_id: 'nav-sports', display_order: 1, children: [] }] : []),
        ...(newsBoard ? [{ ...newsBoard, name: '축구소식', parent_id: 'nav-sports', display_order: 2, children: [] }] : []),
        ...(dataAnalysisBoard ? [{ ...dataAnalysisBoard, name: '데이터분석', parent_id: 'nav-sports', display_order: 3, children: [] }] : [])
      ]
    },
    // 커뮤니티 그룹
    {
      id: 'nav-community',
      name: '커뮤니티',
      slug: 'free',
      parent_id: null,
      display_order: 101,
      children: [
        ...(freeBoard ? [{ ...freeBoard, name: '자유게시판', parent_id: 'nav-community', display_order: 0, children: [] }] : []),
        ...(hotdealBoard ? [{ ...hotdealBoard, name: '핫딜', parent_id: 'nav-community', display_order: 1, children: [] }] : []),
        ...(marketBoard ? [{ ...marketBoard, name: '자유마켓', parent_id: 'nav-community', display_order: 2, children: [] }] : []),
        ...(reviewBoard ? [{ ...reviewBoard, name: '인증/후기', parent_id: 'nav-community', display_order: 3, children: [] }] : []),
        ...(creativeBoard ? [{ ...creativeBoard, name: '창작', parent_id: 'nav-community', display_order: 4, children: [] }] : [])
      ]
    }
  ];
};

// 게시판 카테고리 컴포넌트 타입 정의
type BoardCategoryItemProps = { 
  board: HierarchicalBoard;
  pathname: string;
  depth?: number;
  expandedCategories: Set<string>;
  toggleCategory: (id: string) => void;
  onNavigate?: () => void;
};

// 게시판 카테고리 아이템 컴포넌트
const BoardCategoryItem = ({
  board,
  pathname,
  depth = 0,
  expandedCategories,
  toggleCategory,
  onNavigate
}: BoardCategoryItemProps) => {
  const boardSlug = board.slug || board.id;
  const isActive = pathname === `/boards/${boardSlug}`;
  const hasChildren = board.children && board.children.length > 0;
  const isExpanded = expandedCategories.has(board.id);
  // 가상 그룹인지 확인 (nav- 접두사)
  const isVirtualGroup = board.id.startsWith('nav-');

  // 가상 그룹은 링크/호버 없이 펼치기/접기만
  if (isVirtualGroup) {
    return (
      <div key={board.id}>
        <div
          className="flex items-center text-sm py-2 px-4 text-gray-500 dark:text-gray-400 cursor-pointer"
          style={{ paddingLeft: `${depth * 12 + 16}px` }}
          onClick={() => toggleCategory(board.id)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="mr-1.5 flex-shrink-0 text-gray-400 dark:text-gray-500 h-auto w-auto p-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          <span className="flex-1 truncate font-medium">{board.name}</span>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {board.children?.map((child) => (
              <BoardCategoryItem
                key={child.id}
                board={child}
                pathname={pathname}
                depth={depth + 1}
                expandedCategories={expandedCategories}
                toggleCategory={toggleCategory}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // 일반 게시판은 링크로
  return (
    <div key={board.id}>
      <div>
        <Link
          href={`/boards/${boardSlug}`}
          onClick={onNavigate}
          className={`flex items-center text-sm py-2 px-4 transition-colors ${
            isActive
              ? 'bg-[#EAEAEA] dark:bg-[#333333] text-gray-900 dark:text-[#F0F0F0] font-medium'
              : 'hover:bg-[#EAEAEA] dark:hover:bg-[#333333] text-gray-900 dark:text-[#F0F0F0]'
          }`}
          style={{ paddingLeft: `${depth * 12 + 16}px` }}
        >
          <div className="w-5 h-5 mr-1.5"></div>
          <span className="flex-1 truncate">{board.name}</span>
        </Link>
      </div>
    </div>
  );
};

// 클라이언트 게시판 내비게이션 컴포넌트
export default function ClientBoardNavigation({
  initialData,
  onNavigate,
  showAdminLink
}: {
  initialData: BoardNavigationData;
  onNavigate?: () => void;
  showAdminLink?: boolean;
}) {
  const pathname = usePathname() || '';
  // 스포츠, 커뮤니티 그룹 기본 열림 상태
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['nav-sports', 'nav-community']));

  // 가상 그룹으로 재구성된 보드 목록 (헤더와 동일한 구조)
  const navBoards = useMemo(() => createNavBoards(initialData.rootBoards), [initialData.rootBoards]);

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
  const showTotalCount = typeof initialData.totalPostCount === 'number';

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
        onClick={onNavigate}
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
        {showTotalCount && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatCount(initialData.totalPostCount || 0)}
          </span>
        )}
      </Link>

      {/* 빠른 이동 메뉴 */}
      {quickMenuItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
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
      {showAdminLink && (
        <Link
          href="/admin"
          onClick={onNavigate}
          className={`flex items-center gap-3 text-sm py-2 px-4 transition-colors ${
            pathname.startsWith('/admin')
              ? 'bg-[#EAEAEA] dark:bg-[#333333] text-gray-900 dark:text-[#F0F0F0] font-medium'
              : 'hover:bg-[#EAEAEA] dark:hover:bg-[#333333] text-gray-900 dark:text-[#F0F0F0]'
          }`}
        >
          <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span>관리자</span>
        </Link>
      )}

      {/* 구분선 */}
      <div className="my-2 mx-4 border-t border-black/7 dark:border-white/10" />

      {/* 게시판 목록 (헤더와 동일한 그룹 구조) */}
      {navBoards.map((board) => (
        <BoardCategoryItem
          key={board.id}
          board={board}
          pathname={pathname}
          expandedCategories={expandedCategories}
          toggleCategory={toggleCategory}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
} 
