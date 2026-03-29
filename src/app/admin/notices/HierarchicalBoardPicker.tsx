'use client';

import { useCallback, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { inputBaseStyles, focusStyles } from '@/shared/styles';
import { cn } from '@/shared/utils/cn';

interface BoardItem {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

interface CategoryNode {
  board: BoardItem;
  children: CategoryNode[];
}

interface HierarchicalBoardPickerProps {
  boards: BoardItem[];
  boardsLoading: boolean;
  selectedBoardIds: string[];
  onToggleBoard: (boardId: string) => void;
}

/** 노드와 하위 전체의 board id를 flat으로 수집 */
function collectAllIds(node: CategoryNode): string[] {
  const ids = [node.board.id];
  node.children.forEach((child) => {
    ids.push(...collectAllIds(child));
  });
  return ids;
}

export default function HierarchicalBoardPicker({
  boards,
  boardsLoading,
  selectedBoardIds,
  onToggleBoard,
}: HierarchicalBoardPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // 계층 구조 빌드
  const categoryTree = useMemo(() => {
    const roots: CategoryNode[] = [];
    const childrenMap = new Map<string, CategoryNode[]>();

    boards.forEach((board) => {
      const node: CategoryNode = { board, children: [] };
      if (!board.parent_id) {
        roots.push(node);
      } else {
        if (!childrenMap.has(board.parent_id)) {
          childrenMap.set(board.parent_id, []);
        }
        childrenMap.get(board.parent_id)!.push(node);
      }
    });

    const attachChildren = (node: CategoryNode) => {
      const children = childrenMap.get(node.board.id) || [];
      node.children = children;
      children.forEach(attachChildren);
    };

    roots.forEach(attachChildren);
    return roots;
  }, [boards]);

  // 검색 필터링
  const filteredBoards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return null;
    return boards.filter((board) => {
      const name = (board.name || '').toLowerCase();
      const slug = (board.slug || '').toLowerCase();
      return name.includes(query) || slug.includes(query);
    });
  }, [boards, searchQuery]);

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

  // 하위 전체 선택/해제 (자기 자신 제외, children만)
  const handleToggleChildren = useCallback((node: CategoryNode) => {
    const childIds: string[] = [];
    node.children.forEach((child) => {
      childIds.push(...collectAllIds(child));
    });
    const allSelected = childIds.every((id) => selectedBoardIds.includes(id));

    childIds.forEach((id) => {
      const isSelected = selectedBoardIds.includes(id);
      if (allSelected) {
        if (isSelected) onToggleBoard(id);
      } else {
        if (!isSelected) onToggleBoard(id);
      }
    });
  }, [selectedBoardIds, onToggleBoard]);

  // 카테고리 내 선택된 수 / 전체 수
  const countSelected = (node: CategoryNode): number => {
    let count = selectedBoardIds.includes(node.board.id) ? 1 : 0;
    node.children.forEach((child) => {
      count += countSelected(child);
    });
    return count;
  };

  const countAll = (node: CategoryNode): number => {
    let count = 1;
    node.children.forEach((child) => {
      count += countAll(child);
    });
    return count;
  };

  // depth별 board id 수집
  const boardsByDepth = useMemo(() => {
    const result: Map<number, string[]> = new Map();
    const traverse = (node: CategoryNode, depth: number) => {
      if (!result.has(depth)) result.set(depth, []);
      result.get(depth)!.push(node.board.id);
      node.children.forEach((child) => traverse(child, depth + 1));
    };
    categoryTree.forEach((node) => traverse(node, 0));
    return result;
  }, [categoryTree]);

  // 특정 depth 전체 선택/해제
  const handleToggleDepth = useCallback((depth: number) => {
    const ids = boardsByDepth.get(depth) || [];
    const allSelected = ids.every((id) => selectedBoardIds.includes(id));
    ids.forEach((id) => {
      const isSelected = selectedBoardIds.includes(id);
      if (allSelected) {
        if (isSelected) onToggleBoard(id);
      } else {
        if (!isSelected) onToggleBoard(id);
      }
    });
  }, [boardsByDepth, selectedBoardIds, onToggleBoard]);

  // 전체 선택/해제
  const handleToggleAll = useCallback(() => {
    const allIds = boards.map((b) => b.id);
    const allSelected = allIds.every((id) => selectedBoardIds.includes(id));
    allIds.forEach((id) => {
      const isSelected = selectedBoardIds.includes(id);
      if (allSelected) {
        if (isSelected) onToggleBoard(id);
      } else {
        if (!isSelected) onToggleBoard(id);
      }
    });
  }, [boards, selectedBoardIds, onToggleBoard]);

  // depth별 라벨
  const depthLabels = ['1차', '2차', '3차', '4차'];

  // 체크박스 렌더링 (leaf)
  const renderCheckbox = (board: BoardItem, indent: number = 0) => (
    <label
      key={board.id}
      className="flex items-center p-1.5 hover:bg-gray-100 dark:hover:bg-[#2D2D2D] rounded cursor-pointer"
      style={indent ? { paddingLeft: `${indent}px` } : undefined}
    >
      <input
        type="checkbox"
        checked={selectedBoardIds.includes(board.id)}
        onChange={() => onToggleBoard(board.id)}
        className="mr-2"
      />
      <span className="text-[13px] text-gray-700 dark:text-gray-300">{board.name}</span>
    </label>
  );

  // 카테고리 노드 렌더링 (재귀)
  const renderNode = (node: CategoryNode, depth: number = 0) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedCategories.has(node.board.id);
    const selected = countSelected(node);
    const total = countAll(node);
    const allSelected = selected === total;
    const someSelected = selected > 0 && !allSelected;
    const indent = depth * 20;

    if (!hasChildren) {
      return (
        <div key={node.board.id}>
          {renderCheckbox(node.board, indent + 8)}
        </div>
      );
    }

    const childIds: string[] = [];
    node.children.forEach((child) => {
      childIds.push(...collectAllIds(child));
    });
    const childrenAllSelected = childIds.length > 0 && childIds.every((id) => selectedBoardIds.includes(id));
    const childrenSomeSelected = childIds.some((id) => selectedBoardIds.includes(id)) && !childrenAllSelected;

    return (
      <div key={node.board.id}>
        <div
          className="flex items-center gap-1 p-1.5 hover:bg-gray-100 dark:hover:bg-[#2D2D2D] rounded transition-colors"
          style={{ paddingLeft: `${indent + 8}px` }}
        >
          {/* 자기 자신 개별 선택 */}
          <input
            type="checkbox"
            checked={selectedBoardIds.includes(node.board.id)}
            onChange={() => onToggleBoard(node.board.id)}
            className="mr-1 cursor-pointer"
          />
          {/* 아코디언 토글 */}
          <button
            type="button"
            onClick={() => toggleCategory(node.board.id)}
            className="flex items-center gap-1.5 flex-1 min-w-0"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
            )}
            <span className="text-[13px] font-medium text-gray-800 dark:text-gray-200">
              {node.board.name}
            </span>
          </button>
          {/* 하위 전체 선택/해제 버튼 */}
          <button
            type="button"
            onClick={() => handleToggleChildren(node)}
            className={`text-[11px] px-1.5 py-0.5 rounded flex-shrink-0 transition-colors ${
              childrenAllSelected
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                : childrenSomeSelected
                  ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            하위 {selected}/{total}
          </button>
        </div>
        {isExpanded && (
          <div>
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="게시판명 또는 슬러그로 검색"
        className={cn('w-full px-4 py-2 rounded-lg mb-3', inputBaseStyles, focusStyles)}
      />
      {/* 빠른 선택 버튼 */}
      {!filteredBoards && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <button
            type="button"
            onClick={handleToggleAll}
            className={`px-3 py-1 text-[13px] rounded transition-colors ${
              boards.length > 0 && boards.every((b) => selectedBoardIds.includes(b.id))
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-[#262626] text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-[#333333]'
            }`}
          >
            전체
          </button>
          {Array.from(boardsByDepth.keys()).sort().map((depth) => {
            const ids = boardsByDepth.get(depth) || [];
            const allSelected = ids.every((id) => selectedBoardIds.includes(id));
            return (
              <button
                key={depth}
                type="button"
                onClick={() => handleToggleDepth(depth)}
                className={`px-3 py-1 text-[13px] rounded transition-colors ${
                  allSelected
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-[#262626] text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-[#333333]'
                }`}
              >
                {depthLabels[depth] || `${depth + 1}차`}
              </button>
            );
          })}
        </div>
      )}

      <div className="border border-black/7 dark:border-white/10 rounded-lg p-2 bg-[#F5F5F5] dark:bg-[#232323]">
        {boardsLoading ? (
          <p className="text-[13px] text-gray-500 p-2">게시판 불러오는 중...</p>
        ) : filteredBoards ? (
          filteredBoards.length === 0 ? (
            <p className="text-[13px] text-gray-500 p-2">검색 결과가 없습니다.</p>
          ) : (
            <div className="grid grid-cols-2 gap-1">
              {filteredBoards.map((board) => renderCheckbox(board))}
            </div>
          )
        ) : categoryTree.length === 0 ? (
          <p className="text-[13px] text-gray-500 p-2">게시판이 없습니다.</p>
        ) : (
          <div className="space-y-0.5">
            {categoryTree.map((node) => renderNode(node, 0))}
          </div>
        )}
      </div>
      {selectedBoardIds.length > 0 && (
        <p className="text-[13px] text-gray-600 dark:text-gray-400 mt-2">
          선택된 게시판: {selectedBoardIds.length}개
        </p>
      )}
    </div>
  );
}
