import ClientHoverMenu from '@/domains/boards/components/common/ClientHoverMenu';
import { createClient } from '@/shared/api/supabaseServer';

interface ServerHoverMenuProps {
  currentBoardId: string;
  rootBoardId?: string;
  rootBoardSlug?: string;
  currentBoardSlug?: string;
  fromParam?: string;
}

interface Board {
  id: string;
  name: string;
  display_order: number | null;
  slug?: string | null;
  parent_id?: string | null;
}

export default async function ServerHoverMenu({
  currentBoardId,
  rootBoardId,
  rootBoardSlug,
  currentBoardSlug: _currentBoardSlug,
  fromParam
}: ServerHoverMenuProps) {
  // 서버 컴포넌트에서 직접 데이터 가져오기
  const supabase = await createClient();
  
  // 모든 게시판 데이터 가져오기
  const { data: boardsData, error } = await supabase
    .from('boards')
    .select('*')
    .order('display_order', { ascending: true });
    
  if (error || !boardsData) {
    console.error('게시판 데이터 로딩 오류:', error);
    // 오류 발생 시에도 UI가 깨지지 않도록 빈 데이터로 렌더링
    return (
      <ClientHoverMenu
        currentBoardId={currentBoardId}
        rootBoardId={rootBoardId}
        rootBoardSlug={rootBoardSlug}
        currentBoardSlug={_currentBoardSlug}
        fromParam={fromParam === 'boards' ? rootBoardId : fromParam}
      />
    );
  }
  
  // 게시판 데이터 구조화
  const boardsMap: Record<string, Board> = {};
  const childBoardsMap: Record<string, Board[]> = {};
  
  // 1. 모든 게시판을 맵에 저장
  boardsData.forEach(board => {
    boardsMap[board.id] = board;
  });
  
  // 2. 최상위, 중간, 하위 게시판 관계 설정
  // 최상위 게시판 (해외축구/전체): parent_id가 없는 게시판 (rootBoardId)
  // 상위 게시판 (프리미어리그, 라리가): 최상위 게시판의 직접 하위 게시판
  // 하위 게시판: 상위 게시판의 하위 게시판
  
  // 모든 게시판을 순회하며 부모-자식 관계 맵핑
  boardsData.forEach(board => {
    if (board.parent_id) {
      if (!childBoardsMap[board.parent_id]) {
        childBoardsMap[board.parent_id] = [];
      }
      childBoardsMap[board.parent_id].push(board);
    }
  });
  
  // 최상위 게시판 (루트) 찾기
  let rootBoard: Board | undefined;
  if (rootBoardId) {
    rootBoard = boardsMap[rootBoardId];
  } else {
    // rootBoardId가 없으면 parent_id가 없는 첫 번째 게시판을 루트로 사용
    rootBoard = boardsData.find(board => !board.parent_id);
  }
  
  if (!rootBoard) {
    console.error('최상위 게시판을 찾을 수 없습니다.');
    return (
      <ClientHoverMenu
        currentBoardId={currentBoardId}
        rootBoardId={rootBoardId || ''}
        rootBoardSlug={rootBoardSlug}
        currentBoardSlug={_currentBoardSlug}
        fromParam={fromParam === 'boards' ? rootBoardId : fromParam}
      />
    );
  }
  
  // 상위 게시판 목록 (최상위 게시판의 직접 하위 게시판들)
  const topBoards = childBoardsMap[rootBoard.id] || [];
  
  // 데이터 형식 변환
  const formattedTopBoards = topBoards.map(board => ({
    id: board.id,
    name: board.name,
    display_order: board.display_order ?? 0,
    slug: board.slug || undefined
  }));
  
  // childBoardsMap 타입 변환
  const formattedChildBoardsMap: Record<string, { id: string; name: string; display_order: number; slug?: string }[]> = {};
  Object.keys(childBoardsMap).forEach(key => {
    formattedChildBoardsMap[key] = childBoardsMap[key].map(board => ({
      id: board.id,
      name: board.name,
      display_order: board.display_order ?? 0,
      slug: board.slug || undefined
    }));
  });
  
  // 특별 처리: fromParam이 'boards'인 경우 rootBoardId로 변환
  const normalizedFromParam = fromParam === 'boards' ? rootBoard.id : fromParam;
  
  // 서버에서 직접 가공한 데이터를 클라이언트 컴포넌트로 전달
  return (
    <ClientHoverMenu
      currentBoardId={currentBoardId}
      rootBoardId={rootBoard.id}
      rootBoardSlug={rootBoard.slug || rootBoard.id}
      currentBoardSlug={_currentBoardSlug}
      fromParam={normalizedFromParam}
      // 미리 가공된 데이터 전달
      prefetchedData={{
        topBoards: formattedTopBoards, 
        childBoardsMap: formattedChildBoardsMap,
        isServerFetched: true
      }}
    />
  );
} 