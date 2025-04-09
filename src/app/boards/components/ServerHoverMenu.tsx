import { createClient } from '@/app/lib/supabase.server';
import HoverMenu from '@/app/boards/components/HoverMenu';

interface ChildBoard {
  id: string;
  name: string;
  display_order: number;
  slug?: string;
  parent_id?: string;
}

interface TopBoard {
  id: string;
  name: string;
  display_order: number;
  slug?: string;
}

interface ServerHoverMenuProps {
  currentBoardId: string;
  rootBoardId?: string;
  rootBoardSlug?: string;
  currentBoardSlug?: string;
}

export default async function ServerHoverMenu({
  currentBoardId,
  rootBoardId,
  rootBoardSlug,
  currentBoardSlug,
}: ServerHoverMenuProps) {
  const supabase = await createClient();
  
  // 1. 모든 상위 게시판 조회
  const { data: topBoardsData, error: topBoardsError } = await supabase
    .from('boards')
    .select('id, name, slug, display_order')
    .is('parent_id', null)
    .order('display_order', { ascending: true });
  
  if (topBoardsError) {
    console.error('상위 게시판 조회 오류:', topBoardsError);
    return <div>메뉴를 불러오는 중 오류가 발생했습니다.</div>;
  }
  
  // 2. 모든 하위 게시판 조회
  const { data: childBoardsData, error: childBoardsError } = await supabase
    .from('boards')
    .select('id, name, slug, parent_id, display_order')
    .not('parent_id', 'is', null)
    .order('display_order', { ascending: true });
  
  if (childBoardsError) {
    console.error('하위 게시판 조회 오류:', childBoardsError);
    return <div>메뉴를 불러오는 중 오류가 발생했습니다.</div>;
  }
  
  // 3. 상위 게시판 별로 하위 게시판 맵핑
  const childBoardsMap: Record<string, ChildBoard[]> = {};
  
  childBoardsData?.forEach(childBoard => {
    if (childBoard.parent_id) {
      if (!childBoardsMap[childBoard.parent_id]) {
        childBoardsMap[childBoard.parent_id] = [];
      }
      childBoardsMap[childBoard.parent_id].push(childBoard as ChildBoard);
    }
  });
  
  // 4. 최상위 게시판 ID 확인 (rootBoardId가 제공되지 않은 경우)
  let finalRootBoardId = rootBoardId;
  
  if (!finalRootBoardId && topBoardsData && topBoardsData.length > 0) {
    finalRootBoardId = topBoardsData[0].id;
  }
  
  // 데이터를 클라이언트 컴포넌트에 전달
  return (
    <HoverMenu
      currentBoardId={currentBoardId}
      topBoards={(topBoardsData || []) as TopBoard[]}
      childBoardsMap={childBoardsMap}
      rootBoardId={finalRootBoardId || ''}
      rootBoardSlug={rootBoardSlug}
      currentBoardSlug={currentBoardSlug}
    />
  );
} 