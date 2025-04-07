'use client';

import { createClient } from '@/app/lib/supabase-browser';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/app/lib/supabase-server';

// 클라이언트에서 호출할 조회수 증가 함수
export async function incrementViewCount(postId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    
    // 로그인 상태 확인
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;
    
    // 게시글 작성자 확인
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('user_id, views')
      .eq('id', postId)
      .single();
    
    if (postError) {
      console.error('게시글 정보 조회 오류:', postError);
      return false;
    }
      
    // 작성자인 경우 조회수 증가하지 않음
    if (post?.user_id === session.user.id) return false;
    
    // 조회수 증가
    const { error: updateError } = await supabase
      .from('posts')
      .update({ views: (post?.views || 0) + 1 })
      .eq('id', postId);
      
    if (updateError) {
      console.error('조회수 업데이트 오류:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('조회수 증가 함수 오류:', error);
    return false;
  }
}

// 좋아요 상태 확인 함수
export async function getUserLikeStatus(postId: string): Promise<'like' | 'dislike' | null> {
  try {
    const supabase = createClient();
    
    // 세션 확인
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    
    const userId = session.user.id;
    
    // 좋아요 확인
    const { data: existingLike, error: likeError } = await supabase
      .from('post_likes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('type', 'like');
    
    if (likeError) {
      console.error('좋아요 상태 확인 오류:', likeError);
      return null;
    }
    
    if (existingLike && existingLike.length > 0) {
      return 'like';
    }
    
    // 싫어요 확인
    const { data: existingDislike, error: dislikeError } = await supabase
      .from('post_likes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('type', 'dislike');
    
    if (dislikeError) {
      console.error('싫어요 상태 확인 오류:', dislikeError);
      return null;
    }
    
    if (existingDislike && existingDislike.length > 0) {
      return 'dislike';
    }
    
    return null;
  } catch (error) {
    console.error('좋아요 상태 확인 오류:', error);
    return null;
  }
}

// 서버 컴포넌트에서 호출할 조회수 증가 함수 (API Route 대체)
export async function incrementServerViewCount(postId: string, supabase: SupabaseClient<Database>): Promise<boolean> {
  try {
    // 게시글 정보 조회
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('views')
      .eq('id', postId)
      .single();
    
    if (postError) {
      console.error('게시글 정보 조회 오류:', postError);
      return false;
    }
    
    // 조회수 증가
    const { error: updateError } = await supabase
      .from('posts')
      .update({ views: (post?.views || 0) + 1 })
      .eq('id', postId);
    
    if (updateError) {
      console.error('조회수 업데이트 오류:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('서버 조회수 증가 오류:', error);
    return false;
  }
} 