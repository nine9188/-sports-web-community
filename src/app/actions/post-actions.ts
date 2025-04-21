'use server';

import { createClient } from '@/app/lib/supabase.server';
import { revalidatePath } from 'next/cache';

// 기본 응답 인터페이스
interface LikeActionResponse {
  success: boolean;
  likes?: number;
  dislikes?: number;
  userAction?: 'like' | 'dislike' | null;
  error?: string;
}

/**
 * 게시글 좋아요 액션
 * @param postId 게시글 ID
 * @returns 업데이트된 좋아요/싫어요 정보
 */
export async function likePost(postId: string): Promise<LikeActionResponse> {
  try {
    const supabase = await createClient();
    
    // 인증된 사용자 정보 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { 
        success: false, 
        error: '로그인이 필요합니다.' 
      };
    }
    
    const userId = user.id;
    
    // 게시글 최신 정보 조회
    const { data: currentPost, error: fetchError } = await supabase
      .from('posts')
      .select('likes, dislikes')
      .eq('id', postId)
      .single();
      
    if (fetchError) {
      return { 
        success: false, 
        error: '게시글 정보를 조회할 수 없습니다.' 
      };
    }
    
    // 이미 좋아요를 눌렀는지 확인
    const { data: likeRecord, error: likeError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('type', 'like');
    
    if (likeError) {
      return { 
        success: false, 
        error: '좋아요 기록을 확인할 수 없습니다.' 
      };
    }
    
    const alreadyLiked = likeRecord && likeRecord.length > 0;
    let newLikes = currentPost.likes;
    let newDislikes = currentPost.dislikes;
    let newUserAction: 'like' | 'dislike' | null = null;
    
    if (alreadyLiked) {
      // 좋아요 취소
      const { error: deleteError } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('type', 'like');
      
      if (deleteError) {
        return { 
          success: false, 
          error: '좋아요 취소 중 오류가 발생했습니다.' 
        };
      }
      
      // 게시글 좋아요 수 감소
      newLikes = Math.max(0, currentPost.likes - 1);
      
      const { error: updateError } = await supabase
        .from('posts')
        .update({ likes: newLikes })
        .eq('id', postId);
      
      if (updateError) {
        return { 
          success: false, 
          error: '좋아요 수 갱신 중 오류가 발생했습니다.' 
        };
      }
    } else {
      // 기존 싫어요가 있으면 제거
      const { data: dislikeRecord, error: dislikeCheckError } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('type', 'dislike');
      
      if (!dislikeCheckError && dislikeRecord && dislikeRecord.length > 0) {
        // 싫어요 제거
        const { error: deleteDislikeError } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId)
          .eq('type', 'dislike');
        
        if (!deleteDislikeError) {
          // 게시글 싫어요 수 감소
          newDislikes = Math.max(0, currentPost.dislikes - 1);
        }
      }
      
      // 새로운 좋아요 추가
      const { error: insertError } = await supabase
        .from('post_likes')
        .insert([{
          post_id: postId,
          user_id: userId,
          type: 'like'
        }]);
      
      if (insertError) {
        return { 
          success: false, 
          error: '좋아요 추가 중 오류가 발생했습니다.' 
        };
      }
      
      // 게시글 좋아요 수 증가
      newLikes = currentPost.likes + 1;
      
      const { error: updateError } = await supabase
        .from('posts')
        .update({ 
          likes: newLikes,
          dislikes: newDislikes
        })
        .eq('id', postId);
      
      if (updateError) {
        return { 
          success: false, 
          error: '좋아요 수 갱신 중 오류가 발생했습니다.' 
        };
      }
      
      newUserAction = 'like';
    }
    
    // 페이지 재검증
    revalidatePath(`/boards/[slug]/[postNumber]`);
    
    return {
      success: true,
      likes: newLikes,
      dislikes: newDislikes,
      userAction: newUserAction
    };
    
  } catch (error) {
    console.error('좋아요 처리 중 오류:', error);
    return { 
      success: false, 
      error: '좋아요 처리 중 오류가 발생했습니다.' 
    };
  }
}

/**
 * 게시글 싫어요 액션
 * @param postId 게시글 ID
 * @returns 업데이트된 좋아요/싫어요 정보
 */
export async function dislikePost(postId: string): Promise<LikeActionResponse> {
  try {
    const supabase = await createClient();
    
    // 인증된 사용자 정보 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { 
        success: false, 
        error: '로그인이 필요합니다.' 
      };
    }
    
    const userId = user.id;
    
    // 게시글 최신 정보 조회
    const { data: currentPost, error: fetchError } = await supabase
      .from('posts')
      .select('likes, dislikes')
      .eq('id', postId)
      .single();
      
    if (fetchError) {
      return { 
        success: false, 
        error: '게시글 정보를 조회할 수 없습니다.' 
      };
    }
    
    // 이미 싫어요를 눌렀는지 확인
    const { data: dislikeRecord, error: dislikeError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('type', 'dislike');
    
    if (dislikeError) {
      return { 
        success: false, 
        error: '싫어요 기록을 확인할 수 없습니다.' 
      };
    }
    
    const alreadyDisliked = dislikeRecord && dislikeRecord.length > 0;
    let newLikes = currentPost.likes;
    let newDislikes = currentPost.dislikes;
    let newUserAction: 'like' | 'dislike' | null = null;
    
    if (alreadyDisliked) {
      // 싫어요 취소
      const { error: deleteError } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('type', 'dislike');
      
      if (deleteError) {
        return { 
          success: false, 
          error: '싫어요 취소 중 오류가 발생했습니다.' 
        };
      }
      
      // 게시글 싫어요 수 감소
      newDislikes = Math.max(0, currentPost.dislikes - 1);
      
      const { error: updateError } = await supabase
        .from('posts')
        .update({ dislikes: newDislikes })
        .eq('id', postId);
      
      if (updateError) {
        return { 
          success: false, 
          error: '싫어요 수 갱신 중 오류가 발생했습니다.' 
        };
      }
    } else {
      // 기존 좋아요가 있으면 제거
      const { data: likeRecord, error: likeCheckError } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('type', 'like');
      
      if (!likeCheckError && likeRecord && likeRecord.length > 0) {
        // 좋아요 제거
        const { error: deleteLikeError } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId)
          .eq('type', 'like');
        
        if (!deleteLikeError) {
          // 게시글 좋아요 수 감소
          newLikes = Math.max(0, currentPost.likes - 1);
        }
      }
      
      // 새로운 싫어요 추가
      const { error: insertError } = await supabase
        .from('post_likes')
        .insert([{
          post_id: postId,
          user_id: userId,
          type: 'dislike'
        }]);
      
      if (insertError) {
        return { 
          success: false, 
          error: '싫어요 추가 중 오류가 발생했습니다.' 
        };
      }
      
      // 게시글 싫어요 수 증가
      newDislikes = currentPost.dislikes + 1;
      
      const { error: updateError } = await supabase
        .from('posts')
        .update({ 
          dislikes: newDislikes,
          likes: newLikes
        })
        .eq('id', postId);
      
      if (updateError) {
        return { 
          success: false, 
          error: '싫어요 수 갱신 중 오류가 발생했습니다.' 
        };
      }
      
      newUserAction = 'dislike';
    }
    
    // 페이지 재검증
    revalidatePath(`/boards/[slug]/[postNumber]`);
    
    return {
      success: true,
      likes: newLikes,
      dislikes: newDislikes,
      userAction: newUserAction
    };
    
  } catch (error) {
    console.error('싫어요 처리 중 오류:', error);
    return { 
      success: false, 
      error: '싫어요 처리 중 오류가 발생했습니다.' 
    };
  }
}

/**
 * 사용자의 게시글 좋아요/싫어요 상태 확인
 * @param postId 게시글 ID
 * @returns 사용자의 액션 상태
 */
export async function getUserPostAction(postId: string): Promise<{ userAction: 'like' | 'dislike' | null, error?: string }> {
  try {
    const supabase = await createClient();
    
    // 인증 상태 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { userAction: null };
    }
    
    const userId = user.id;
    
    // 좋아요 확인
    const { data: likeRecord, error: likeError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('type', 'like');
    
    if (!likeError && likeRecord && likeRecord.length > 0) {
      return { userAction: 'like' };
    }
    
    // 싫어요 확인
    const { data: dislikeRecord, error: dislikeError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('type', 'dislike');
    
    if (!dislikeError && dislikeRecord && dislikeRecord.length > 0) {
      return { userAction: 'dislike' };
    }
    
    return { userAction: null };
  } catch (error) {
    console.error('사용자 액션 상태 확인 오류:', error);
    return { 
      userAction: null,
      error: '사용자 액션 상태를 확인할 수 없습니다.'
    };
  }
} 