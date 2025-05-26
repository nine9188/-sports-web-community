'use client';

import React from 'react';
import HoverMenu from '@/domains/boards/components/common/HoverMenu';
import { useBoards, HierarchicalBoard, BoardsResponse } from '@/domains/boards/hooks/useBoards';

// 게시판 관련 타입 정의
interface ChildBoard {
  id: string;
  name: string;
  display_order: number;
  slug?: string;
}

interface TopBoard {
  id: string;
  name: string;
  display_order: number;
  slug?: string;
}

// 서버에서 미리 가져온 데이터 인터페이스
interface PrefetchedData {
  topBoards: TopBoard[];
  childBoardsMap: Record<string, ChildBoard[]>;
  isServerFetched: boolean;
}

interface ClientHoverMenuProps {
  currentBoardId: string;
  rootBoardId?: string;
  rootBoardSlug?: string;
  currentBoardSlug?: string;
  // 서버에서 미리 가져온 데이터 (선택 사항)
  prefetchedData?: PrefetchedData;
  fromParam?: string;
  // 서버 컴포넌트에서 전달받은 초기 게시판 데이터
  initialBoardsData?: BoardsResponse;
}

export default function ClientHoverMenu({
  currentBoardId,
  rootBoardId,
  rootBoardSlug,
  currentBoardSlug: _currentBoardSlug,
  prefetchedData,
  fromParam,
  initialBoardsData
}: ClientHoverMenuProps) {
  // 서버에서 데이터를 미리 가져왔다면 그것을 사용하고, 아니면 useBoards 훅 사용
  const { data, isLoading, error } = useBoards(
    initialBoardsData ? { initialData: initialBoardsData } : undefined
  );
  
  // 서버에서 미리 가져온 데이터가 있으면 그것을 사용
  if (prefetchedData?.isServerFetched) {
    return (
      <HoverMenu
        currentBoardId={currentBoardId}
        topBoards={prefetchedData.topBoards}
        childBoardsMap={prefetchedData.childBoardsMap}
        rootBoardId={rootBoardId || ''}
        rootBoardSlug={rootBoardSlug}
        currentBoardSlug={_currentBoardSlug}
        fromParam={fromParam}
      />
    );
  }
  
  // 기존 로직 유지 (클라이언트에서 데이터 로딩)
  if (isLoading) {
    return (
      <div className="border-b bg-white">
        <div className="flex h-12 items-center px-4">
          <div className="h-5 w-20 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-5 w-24 ml-4 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-5 w-20 ml-4 bg-gray-200 animate-pulse rounded"></div>
        </div>
      </div>
    );
  }
  
  if (error || !data) {
    console.error('게시판 데이터 로딩 오류:', error);
    return <div className="p-4 text-sm text-red-500">메뉴를 불러오는 중 오류가 발생했습니다.</div>;
  }
  
  // 최상위 게시판 추출 (예: 해외축구)
  const topBoards: TopBoard[] = data.hierarchical.map((board: HierarchicalBoard) => ({
    id: board.id,
    name: board.name,
    display_order: board.display_order || 0,
    slug: board.slug
  }));
  
  // 하위 게시판 매핑 (상위 게시판 ID → 하위 게시판 목록)
  const childBoardsMap: Record<string, ChildBoard[]> = {};
  
  // 계층적 구조에서 하위 게시판 구성
  data.hierarchical.forEach((board: HierarchicalBoard) => {
    if (board.children && board.children.length > 0) {
      childBoardsMap[board.id] = board.children.map((child: HierarchicalBoard) => ({
        id: child.id,
        name: child.name,
        display_order: child.display_order || 0,
        slug: child.slug
      }));
    }
  });
  
  // 최상위 게시판 ID 확인 (rootBoardId가 제공되지 않은 경우)
  let finalRootBoardId = rootBoardId;
  
  if (!finalRootBoardId && topBoards.length > 0) {
    finalRootBoardId = topBoards[0].id;
  }
  
  // HoverMenu 컴포넌트로 데이터 전달
  return (
    <HoverMenu
      currentBoardId={currentBoardId}
      topBoards={topBoards}
      childBoardsMap={childBoardsMap}
      rootBoardId={finalRootBoardId || ''}
      rootBoardSlug={rootBoardSlug}
      currentBoardSlug={_currentBoardSlug}
      fromParam={fromParam}
    />
  );
} 