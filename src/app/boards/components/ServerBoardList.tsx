import { createClient } from '@/app/lib/supabase.server';
import ClientBoardList from '@/app/boards/components/ClientBoardList';

interface ServerBoardListProps {
  parentId?: string | null;
}

export default async function ServerBoardList({ parentId }: ServerBoardListProps) {
  // 서버에서 게시판 목록 데이터를 가져옴
  const supabase = await createClient();
  
  let query = supabase
    .from('boards')
    .select('id, name, slug, parent_id, display_order')
    .order('display_order', { ascending: true });
  
  // 상위 게시판 ID가 제공된 경우 해당 상위 게시판의 하위 게시판만 가져옴
  if (parentId) {
    query = query.eq('parent_id', parentId);
  } else {
    // 최상위 게시판만 가져옴
    query = query.is('parent_id', null);
  }
  
  const { data: boards, error } = await query;
  
  if (error) {
    console.error('게시판 목록 가져오기 오류:', error);
    return <div>게시판 목록을 불러오는 중 오류가 발생했습니다.</div>;
  }
  
  // SSR로 가져온 초기 데이터를 클라이언트 컴포넌트에 전달
  return <ClientBoardList boards={boards || []} />;
} 