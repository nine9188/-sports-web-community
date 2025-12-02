'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { PaginationParams } from '../types';

/**
 * 내가 작성한 게시글 목록 조회 서버 액션
 */
export async function getMyPosts(userId: string, params: PaginationParams) {
  try {
    const { page = 1, limit = 10 } = params;
    const offset = (page - 1) * limit;
    
    // Supabase 클라이언트 생성
    const supabase = await getSupabaseServer();
    
    // 내 게시글 목록 조회
    const { data: posts, error, count } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        created_at,
        view_count,
        board_id,
        like_count,
        comment_count,
        boards (name, slug)
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw error;
    }
    
    return { 
      success: true, 
      data: posts, 
      totalCount: count 
    };
  } catch (error) {
    console.error('내 게시글 조회 오류:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '게시글을 불러오는데 실패했습니다.', 
      data: [],
      totalCount: 0
    };
  }
}

/**
 * 내가 작성한 댓글 목록 조회 서버 액션
 */
export async function getMyComments(userId: string, params: PaginationParams) {
  try {
    const { page = 1, limit = 10 } = params;
    const offset = (page - 1) * limit;
    
    // Supabase 클라이언트 생성
    const supabase = await getSupabaseServer();
    
    // 내 댓글 목록 조회
    const { data: comments, error, count } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        post_id,
        like_count,
        posts (
          id,
          title,
          board_id,
          boards (
            id,
            name,
            slug
          )
        )
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw error;
    }
    
    return {
      success: true,
      data: comments,
      totalCount: count,
      error: null
    };
  } catch (error) {
    console.error('내 댓글 조회 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '댓글을 불러오는데 실패했습니다.',
      data: [],
      totalCount: 0
    };
  }
}

/**
 * 경험치 내역 조회 서버 액션
 */
export async function getUserExpHistory(userId: string, limit = 10) {
  try {
    // Supabase 클라이언트 생성
    const supabase = await getSupabaseServer();
    
    // 경험치 내역 조회
    const { data, error } = await supabase
      .from('exp_history')
      .select('id, amount, reason, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      throw error;
    }
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('경험치 내역 조회 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '경험치 내역을 불러오는데 실패했습니다.',
      data: []
    };
  }
}

/**
 * 포인트 내역 조회 서버 액션
 */
export async function getUserPointHistory(userId: string, limit = 10) {
  try {
    // Supabase 클라이언트 생성
    const supabase = await getSupabaseServer();
    
    // 포인트 내역 조회
    const { data, error } = await supabase
      .from('point_history')
      .select('id, amount, reason, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      throw error;
    }
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('포인트 내역 조회 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '포인트 내역을 불러오는데 실패했습니다.',
      data: []
    };
  }
}
