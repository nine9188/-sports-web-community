import { createClient } from '@/app/lib/supabase.server'; // 서버 클라이언트 사용
import BoardNavigation from './BoardNavigation';

// 보드 데이터 타입 정의
interface Board {
  id: string;
  name: string;
  parent_id: string | null;
  display_order: number;
  slug: string;
}

// 서버 컴포넌트로 변경
export default async function BoardNavigationServer() {
  let boards: Board[] = [];
  let error: string | null = null;
  
  try {
    const supabase = await createClient();
    
    // 게시판 데이터 가져오기
    const { data, error: fetchError } = await supabase
      .from('boards')
      .select('id, name, parent_id, display_order, slug')
      .order('display_order', { ascending: true })
      .order('name');
      
    if (fetchError) {
      console.error('게시판 불러오기 오류:', fetchError);
      error = '게시판 목록을 불러오는 중 오류가 발생했습니다.';
    } else {
      boards = data || [];
    }
  } catch (err) {
    console.error('게시판 데이터 로딩 중 오류:', err);
    error = '게시판 목록을 불러오는 중 오류가 발생했습니다.';
  }
  
  // 오류 발생 시 오류 메시지 표시
  if (error) {
    return <div className="py-2 px-3 text-red-500">{error}</div>;
  }
  
  // 클라이언트 컴포넌트에 초기 데이터 전달
  return <BoardNavigation initialBoards={boards} />;
} 