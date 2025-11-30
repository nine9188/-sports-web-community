'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { rewardUserActivity, getActivityTypeValues } from '@/shared/actions/activity-actions';
import { CommentLikeResponse } from './utils';
import { createCommentLikeNotification } from '@/domains/notifications/actions';

/**
 * 댓글 좋아요
 */
export async function likeComment(commentId: string): Promise<CommentLikeResponse> {
  try {
    const supabase = await getSupabaseServer();

    // 인증된 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그인이 필요합니다.'
      };
    }
    
    // 현재 댓글 정보 가져오기
    const { data: currentComment, error: commentFetchError } = await supabase
      .from('comments')
      .select('likes, dislikes')
      .eq('id', commentId)
      .single();
    
    if (commentFetchError) {
      return {
        success: false,
        error: `댓글 조회 오류: ${commentFetchError.message}`
      };
    }
    
    // 현재 좋아요/싫어요 수
    let likes = currentComment.likes || 0;
    let dislikes = currentComment.dislikes || 0;
    
    // 새로운 사용자 액션 상태
    let newUserAction: 'like' | 'dislike' | null = null;
    
    // 기존 좋아요 확인
    const { data: likeRecord, error: likeError } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .eq('type', 'like')
      .maybeSingle();
      
    if (likeError) {
      return {
        success: false,
        error: `좋아요 조회 오류: ${likeError.message}`
      };
    }
    
    // 액션 처리 로직
    if (likeRecord) {
      // 이미 좋아요면 취소
      newUserAction = null;
      likes -= 1;
      
      // 좋아요 레코드 삭제
      const { error: deleteError } = await supabase
        .from('comment_likes')
        .delete()
        .eq('id', likeRecord.id);
      
      if (deleteError) {
        return {
          success: false,
          error: `좋아요 삭제 오류: ${deleteError.message}`
        };
      }
    } else {
      // 기존 싫어요 확인
      const { data: dislikeRecord, error: dislikeError } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .eq('type', 'dislike')
        .maybeSingle();
        
      if (dislikeError) {
        return {
          success: false,
          error: `싫어요 조회 오류: ${dislikeError.message}`
        };
      }
      
      if (dislikeRecord) {
        // 싫어요였으면 좋아요로 변경
        newUserAction = 'like';
        likes += 1;
        dislikes -= 1;
        
        // 싫어요 레코드 삭제
        const { error: deleteError } = await supabase
          .from('comment_likes')
          .delete()
          .eq('id', dislikeRecord.id);
        
        if (deleteError) {
          return {
            success: false,
            error: `싫어요 삭제 오류: ${deleteError.message}`
          };
        }
      } else {
        // 이전 액션이 없었으면 좋아요 추가
        newUserAction = 'like';
        likes += 1;
      }
      
      // 새 좋아요 추가
      if (newUserAction === 'like') {
        const { error: insertError } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id,
            type: 'like'
          });
        
        if (insertError) {
          return {
            success: false,
            error: `좋아요 추가 오류: ${insertError.message}`
          };
        }
      }
    }
    
    // 댓글 정보 업데이트
    const { error: updateCommentError } = await supabase
      .from('comments')
      .update({
        likes: likes,
        dislikes: dislikes
      })
      .eq('id', commentId);
    
    if (updateCommentError) {
      return {
        success: false,
        error: `댓글 업데이트 오류: ${updateCommentError.message}`
      };
    }

    // 업데이트된 댓글 정보 조회
    const { data: updatedComment, error: selectError } = await supabase
      .from('comments')
      .select(`
        likes,
        dislikes,
        user_id,
        content,
        post:posts(
          post_number,
          board:boards(slug)
        )
      `)
      .eq('id', commentId)
      .single();

    if (selectError) {
      return {
        success: false,
        error: `댓글 조회 오류: ${selectError.message}`
      };
    }

    // 좋아요가 새로 추가된 경우 댓글 작성자에게 알림 및 보상 지급
    if (newUserAction === 'like' && updatedComment.user_id && updatedComment.user_id !== user.id) {
      try {
        // 현재 사용자 닉네임 조회
        const { data: profile } = await supabase
          .from('profiles')
          .select('nickname')
          .eq('id', user.id)
          .single();

        const post = updatedComment.post as { post_number: number; board: { slug: string } } | null;

        if (profile && post?.board?.slug) {
          // 좋아요 알림 생성
          await createCommentLikeNotification({
            commentOwnerId: updatedComment.user_id,
            actorId: user.id,
            actorNickname: profile.nickname || '알 수 없음',
            commentId,
            commentContent: updatedComment.content,
            postNumber: post.post_number,
            boardSlug: post.board.slug
          });
        }

        // 보상 지급
        const activityTypes = await getActivityTypeValues();
        await rewardUserActivity(updatedComment.user_id, activityTypes.RECEIVED_LIKE, commentId);
      } catch (error) {
        console.error('댓글 좋아요 알림/보상 처리 오류:', error);
      }
    }
    
    return {
      success: true,
      likes: updatedComment.likes,
      dislikes: updatedComment.dislikes,
      userAction: newUserAction
    };
  } catch (error) {
    console.error('[likeComment] 처리 중 오류:', error);
    
    // 오류 객체에서 더 많은 정보 추출
    const errorDetails = error instanceof Error 
      ? { 
          message: error.message, 
          stack: error.stack, 
          name: error.name, 
          toString: error.toString() 
        } 
      : error;
    
    console.error('[likeComment] 오류 세부 정보:', JSON.stringify(errorDetails, null, 2));
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '좋아요 처리 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 댓글 싫어요
 */
export async function dislikeComment(commentId: string): Promise<CommentLikeResponse> {
  try {
    const supabase = await getSupabaseServer();

    // 인증된 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그인이 필요합니다.'
      };
    }
    
    // 현재 댓글 정보 가져오기
    const { data: currentComment, error: commentFetchError } = await supabase
      .from('comments')
      .select('likes, dislikes')
      .eq('id', commentId)
      .single();
    
    if (commentFetchError) {
      return {
        success: false,
        error: `댓글 조회 오류: ${commentFetchError.message}`
      };
    }
    
    // 현재 좋아요/싫어요 수
    let likes = currentComment.likes || 0;
    let dislikes = currentComment.dislikes || 0;
    
    // 새로운 사용자 액션 상태
    let newUserAction: 'like' | 'dislike' | null = null;
    
    // 기존 싫어요 확인
    const { data: dislikeRecord, error: dislikeError } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .eq('type', 'dislike')
      .maybeSingle();
      
    if (dislikeError) {
      return {
        success: false,
        error: `싫어요 조회 오류: ${dislikeError.message}`
      };
    }
    
    // 액션 처리 로직
    if (dislikeRecord) {
      // 이미 싫어요면 취소
      newUserAction = null;
      dislikes -= 1;
      
      // 싫어요 레코드 삭제
      const { error: deleteError } = await supabase
        .from('comment_likes')
        .delete()
        .eq('id', dislikeRecord.id);
      
      if (deleteError) {
        return {
          success: false,
          error: `싫어요 삭제 오류: ${deleteError.message}`
        };
      }
    } else {
      // 기존 좋아요 확인
      const { data: likeRecord, error: likeError } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .eq('type', 'like')
        .maybeSingle();
        
      if (likeError) {
        return {
          success: false,
          error: `좋아요 조회 오류: ${likeError.message}`
        };
      }
      
      if (likeRecord) {
        // 좋아요였으면 싫어요로 변경
        newUserAction = 'dislike';
        likes -= 1;
        dislikes += 1;
        
        // 좋아요 레코드 삭제
        const { error: deleteError } = await supabase
          .from('comment_likes')
          .delete()
          .eq('id', likeRecord.id);
        
        if (deleteError) {
          return {
            success: false,
            error: `좋아요 삭제 오류: ${deleteError.message}`
          };
        }
      } else {
        // 이전 액션이 없었으면 싫어요 추가
        newUserAction = 'dislike';
        dislikes += 1;
      }
      
      // 새 싫어요 추가
      if (newUserAction === 'dislike') {
        const { error: insertError } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id,
            type: 'dislike'
          });
        
        if (insertError) {
          return {
            success: false,
            error: `싫어요 추가 오류: ${insertError.message}`
          };
        }
      }
    }
    
    // 댓글 정보 업데이트
    const { error: updateCommentError } = await supabase
      .from('comments')
      .update({
        likes: likes,
        dislikes: dislikes
      })
      .eq('id', commentId);
    
    if (updateCommentError) {
      return {
        success: false,
        error: `댓글 업데이트 오류: ${updateCommentError.message}`
      };
    }

    // 업데이트된 댓글 정보 조회
    const { data: updatedComment, error: selectError } = await supabase
      .from('comments')
      .select('likes, dislikes')
      .eq('id', commentId)
      .single();
    
    if (selectError) {
      return {
        success: false,
        error: `댓글 조회 오류: ${selectError.message}`
      };
    }
    
    return {
      success: true,
      likes: updatedComment.likes,
      dislikes: updatedComment.dislikes,
      userAction: newUserAction
    };
  } catch (error) {
    console.error('[dislikeComment] 처리 중 오류:', error);
    
    // 오류 객체에서 더 많은 정보 추출
    const errorDetails = error instanceof Error 
      ? { 
          message: error.message, 
          stack: error.stack, 
          name: error.name, 
          toString: error.toString() 
        } 
      : error;
    
    console.error('[dislikeComment] 오류 세부 정보:', JSON.stringify(errorDetails, null, 2));
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '싫어요 처리 중 오류가 발생했습니다.'
    };
  }
} 