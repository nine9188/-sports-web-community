'use server';

import { createClient } from '@/app/lib/supabase.server';

// 내 게시글 아이템 타입 정의
export interface MyPostItem {
  id: number;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string | null;
  views: number;
  likes: number;
  dislikes: number;
  category: string;
  tags: string[] | null;
  board_id: string;
  board_name?: string;
  status: string | null;
  post_number: number;
}

// 응답 타입 정의
interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  totalCount?: number;
  hasMore?: boolean;
}

// 페이지네이션 파라미터 타입
export interface PaginationParams {
  page: number;
  limit: number;
}

// 데이터베이스 결과에 대한 타입 정의
interface DbPostResult {
  id: number;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string | null;
  views: number;
  likes: number;
  dislikes: number;
  category: string;
  tags: string[] | null;
  board_id: string;
  status: string | null;
  post_number: number;
  user_id: string;
  [key: string]: unknown;
}

/**
 * 사용자가 작성한 게시글 목록을 가져오는 함수
 * @param userId 사용자 ID
 * @param pagination 페이지네이션 정보
 * @returns 내 게시글 데이터와 함께 성공 여부를 담은 응답
 */
export async function getMyPosts(
  userId: string,
  pagination: PaginationParams = { page: 1, limit: 10 }
): Promise<ActionResponse<MyPostItem[]>> {
  try {
    if (!userId) {
      return { 
        success: false, 
        error: '사용자 ID가 필요합니다.',
        data: [] 
      };
    }

    console.log(`내 게시글 조회 시도: 사용자 ID ${userId}, 페이지 ${pagination.page}, 한도 ${pagination.limit}`);
    
    const supabase = await createClient();
    
    try {
      // 게시글 조회 (실제 테이블 구조에 맞게 필드명 수정)
      const { data, count, error } = await supabase
        .from('posts')
        .select(`
          id, title, content, created_at, updated_at, 
          views, likes, dislikes, category, tags, 
          board_id, status, post_number, user_id
        `, { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(
          (pagination.page - 1) * pagination.limit, 
          (pagination.page - 1) * pagination.limit + pagination.limit - 1
        );
      
      if (error) {
        console.error('내 게시글 DB 조회 오류:', error);
        return { 
          success: false, 
          error: error.message || '게시글을 가져오는 중 오류가 발생했습니다.',
          data: [] 
        };
      }
      
      // 데이터 가져오기 성공 후 게시판 정보를 가져옵니다
      const formattedData: MyPostItem[] = (data as DbPostResult[]).map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        created_at: post.created_at,
        updated_at: post.updated_at,
        views: post.views || 0,
        likes: post.likes || 0,
        dislikes: post.dislikes || 0,
        category: post.category,
        tags: post.tags,
        board_id: post.board_id,
        board_name: undefined, // 아래에서 채웁니다
        status: post.status,
        post_number: post.post_number
      }));
      
      // 게시판 정보 가져오기 (있는 경우)
      if (formattedData.length > 0) {
        const boardIds = formattedData
          .filter(post => post.board_id)
          .map(post => post.board_id);
          
        if (boardIds.length > 0) {
          const { data: boards } = await supabase
            .from('boards')
            .select('id, name')
            .in('id', boardIds);
            
          if (boards) {
            // 게시판 정보 매핑
            const boardMap = new Map(
              boards.map((board: { id: string; name: string }) => [board.id, board.name])
            );
            
            formattedData.forEach(post => {
              if (post.board_id && boardMap.has(post.board_id)) {
                post.board_name = boardMap.get(post.board_id);
              }
            });
          }
        }
      }
      
      console.log(`내 게시글 조회 결과: ${formattedData.length}개 항목 발견`);
      
      return { 
        success: true, 
        data: formattedData,
        totalCount: count || 0,
        hasMore: (pagination.page - 1) * pagination.limit + pagination.limit < (count || 0)
      };
    } catch (queryError) {
      console.error('게시글 쿼리 실행 오류:', queryError);
      return { 
        success: false, 
        error: queryError instanceof Error ? queryError.message : '게시글을 가져오는 중 오류가 발생했습니다.',
        data: [] 
      };
    }
  } catch (error) {
    console.error('내 게시글 조회 처리 오류:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '게시글을 가져오는 중 오류가 발생했습니다.',
      data: [] 
    };
  }
} 