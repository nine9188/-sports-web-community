'use server';

import { createClient } from '@/app/lib/supabase.server';

// 댓글 아이템 타입 정의
export interface MyCommentItem {
  id: string;
  content: string;
  board_id: string;
  post_id: string;
  post_title: string;
  board_name: string;
  created_at: string;
}

// 페이지네이션 파라미터 타입
export interface PaginationParams {
  page: number;
  limit: number;
}

// 응답 타입 정의
interface ActionResponse {
  success: boolean;
  data: MyCommentItem[];
  totalCount: number;
  error?: string;
}

// Supabase 응답 데이터에 대한 인터페이스
interface CommentResponseItem extends Record<string, unknown> {
  id?: unknown;
  content?: unknown;
  created_at?: unknown;
  post_id?: unknown;
  posts?: {
    id?: unknown;
    title?: unknown;
    board_id?: unknown;
    boards?: {
      id?: unknown;
      name?: unknown;
    };
  };
}

/**
 * 사용자가 작성한 댓글 목록을 가져오는 함수
 * @param userId 사용자 ID
 * @param pagination 페이지네이션 정보
 * @returns 내 댓글 데이터와 함께 성공 여부를 담은 응답
 */
export async function getMyComments(
  userId: string,
  pagination: PaginationParams = { page: 1, limit: 10 }
): Promise<ActionResponse> {
  try {
    if (!userId) {
      return { 
        success: false,
        error: '사용자 ID가 필요합니다.',
        data: [],
        totalCount: 0
      };
    }
    
    const supabase = await createClient();
    
    // 내가 쓴 댓글 가져오기
    const { data, count, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        post_id,
        posts!inner(
          id, 
          title,
          board_id,
          boards!inner(
            id,
            name
          )
        )
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(
        (pagination.page - 1) * pagination.limit, 
        (pagination.page - 1) * pagination.limit + pagination.limit - 1
      );
      
    if (error) {
      console.error('내 댓글 DB 조회 오류:', error);
      return { 
        success: false, 
        error: error.message || '댓글을 가져오는 중 오류가 발생했습니다.',
        data: [],
        totalCount: 0
      };
    }
    
    // 데이터가 없는 경우 빈 배열 반환
    if (!data || data.length === 0) {
      return {
        success: true,
        data: [],
        totalCount: 0
      };
    }
    
    // 응답 형식 가공
    const formattedComments: MyCommentItem[] = [];
    
    for (const item of data) {
      // 타입 안전하게 처리
      const rawComment = item as CommentResponseItem;
      
      try {
        if (
          rawComment && 
          rawComment.id && 
          rawComment.content && 
          rawComment.created_at && 
          rawComment.post_id && 
          rawComment.posts && 
          rawComment.posts.board_id && 
          rawComment.posts.title && 
          rawComment.posts.boards && 
          rawComment.posts.boards.name
        ) {
          formattedComments.push({
            id: String(rawComment.id),
            content: String(rawComment.content),
            created_at: String(rawComment.created_at),
            post_id: String(rawComment.post_id),
            board_id: String(rawComment.posts.board_id),
            post_title: String(rawComment.posts.title),
            board_name: String(rawComment.posts.boards.name)
          });
        }
      } catch (err) {
        console.error('댓글 데이터 처리 중 오류:', err);
        // 오류가 발생한 댓글은 건너뜁니다
      }
    }
    
    return { 
      success: true, 
      data: formattedComments,
      totalCount: count || 0
    };
  } catch (error) {
    console.error('내 댓글 조회 처리 오류:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '댓글을 가져오는 중 오류가 발생했습니다.',
      data: [],
      totalCount: 0
    };
  }
} 