'use server';

import { createClient } from '@/shared/api/supabaseServer';
import { revalidatePath } from 'next/cache';
import { CommentType } from '../types/post/comment';
import { rewardUserActivity, getActivityTypeValues } from '@/shared/actions/activity-actions';

/**
 * 댓글 작성
 */
export async function createComment({
  postId,
  content
}: {
  postId: string;
  content: string;
}): Promise<{ success: boolean, comment?: CommentType, error?: string }> {
  const supabase = await createClient();
  
  try {
    // 1. 현재 사용자 정보 확인
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }
    
    // 2. 댓글 작성
    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content
      })
      .select('*, profiles(nickname, icon_id)')
      .single();
      
    if (error) {
      return { success: false, error: error.message };
    }
    
    // 3. 댓글 작성 보상 지급 (비동기로 처리하여 메인 로직에 영향 없도록)
    try {
      const activityTypes = await getActivityTypeValues();
      await rewardUserActivity(user.id, activityTypes.COMMENT_CREATION, data.id);
      console.log('댓글 작성 보상 지급 완료');
    } catch (rewardError) {
      console.error('댓글 작성 보상 지급 오류:', rewardError);
      // 보상 지급 실패해도 댓글 작성은 성공으로 처리
    }
    
    // 4. 경로 재검증
    revalidatePath(`/boards/[slug]/[postNumber]`, 'page');
    
    return { success: true, comment: data as CommentType };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '댓글 작성 중 오류가 발생했습니다.' 
    };
  }
}

/**
 * 댓글 수정
 */
export async function updateComment(commentId: string, content: string): Promise<{ success: boolean, comment?: CommentType, error?: string }> {
  if (!content.trim()) {
    return {
      success: false,
      error: '댓글 내용을 입력해주세요.'
    };
  }
  
  try {
    const supabase = await createClient();
    
    // 인증된 사용자 정보 확인
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: '로그인이 필요합니다.'
      };
    }
    
    // 댓글 조회
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('id, user_id, post_id')
      .eq('id', commentId)
      .single();
    
    if (fetchError || !comment) {
      return {
        success: false,
        error: '댓글을 찾을 수 없습니다.'
      };
    }
    
    // 권한 확인 (자신의 댓글만 수정 가능)
    if (comment.user_id !== user.id) {
      return {
        success: false,
        error: '자신의 댓글만 수정할 수 있습니다.'
      };
    }
    
    // 댓글 수정
    const { data: updatedComment, error: updateError } = await supabase
      .from('comments')
      .update({ 
        content: content,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select('*, profiles(nickname, icon_id)')
      .single();
    
    if (updateError) {
      return {
        success: false,
        error: updateError.message
      };
    }
    
    // 경로 재검증
    revalidatePath(`/boards/[slug]/[postNumber]`, 'page');
    
    return {
      success: true,
      comment: updatedComment as CommentType
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '댓글 수정 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 댓글 삭제
 */
export async function deleteComment(commentId: string): Promise<{ success: boolean, error?: string }> {
  const supabase = await createClient();
  
  try {
    // 1. 현재 사용자 정보 확인
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }
    
    // 2. 댓글 조회
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .single();
      
    if (fetchError) {
      return { success: false, error: fetchError.message };
    }
    
    // 3. 권한 확인 (자신의 댓글만 삭제 가능)
    if (comment.user_id !== user.id) {
      return { success: false, error: '자신의 댓글만 삭제할 수 있습니다.' };
    }
    
    // 4. 댓글 삭제
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);
      
    if (deleteError) {
      return { success: false, error: deleteError.message };
    }
    
    // 5. 경로 재검증
    revalidatePath(`/boards/[slug]/[postNumber]`, 'page');
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '댓글 삭제 중 오류가 발생했습니다.' 
    };
  }
}

/**
 * 댓글 목록 조회
 */
export async function getComments(postId: string): Promise<{ success: boolean, comments?: CommentType[], error?: string }> {
  try {
    const supabase = await createClient();
    
    // 댓글 가져오기 (사용자 정보 포함)
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles(
          id,
          nickname,
          icon_id
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('댓글 로딩 오류:', error);
      return {
        success: false,
        error: error.message
      };
    }
    
    // 댓글 데이터를 CommentType으로 캐스팅
    const comments = (data || []) as CommentType[];
    
    // 사용자 액션(좋아요/싫어요) 확인
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user && comments.length > 0) {
      const commentIds = comments.map(comment => comment.id);
      
      // 로그인 상태면 사용자 액션 정보 로드
      const { data: userLikes, error: likesError } = await supabase
        .from('comment_likes')
        .select('comment_id, type')
        .eq('user_id', user.id)
        .in('comment_id', commentIds);
      
      if (likesError) {
        console.error('[getComments] 사용자 액션 조회 오류:', likesError);
      }
      
      // 댓글에 사용자 액션 정보 추가
      if (userLikes && userLikes.length > 0) {
        const actionMap = userLikes.reduce((acc, action) => {
          acc[action.comment_id] = action.type;
          return acc;
        }, {} as Record<string, string>);
        
        comments.forEach(comment => {
          if (actionMap[comment.id]) {
            comment.userAction = actionMap[comment.id] === 'like' ? 'like' : 'dislike';
          } else {
            comment.userAction = null;
          }
        });
      } else {
        // 사용자 액션이 없는 경우 모든 댓글에 null 설정
        comments.forEach(comment => {
          comment.userAction = null;
        });
      }
    } else {
      // 로그인하지 않은 경우 모든 댓글에 null 설정
      comments.forEach(comment => {
        comment.userAction = null;
      });
    }
    
    return {
      success: true,
      comments: comments
    };
  } catch (error) {
    console.error('댓글 목록 로딩 중 예외:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '댓글 목록을 불러오는 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 댓글 좋아요
 */
export async function likeComment(commentId: string): Promise<{
  success: boolean;
  likes?: number;
  dislikes?: number;
  userAction?: 'like' | 'dislike' | null;
  error?: string;
}> {
  try {
    const supabase = await createClient();

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
    const { data: updatedComment, error: updateCommentError } = await supabase
      .from('comments')
      .update({
        likes: likes,
        dislikes: dislikes
      })
      .eq('id', commentId)
      .select('likes, dislikes, user_id')
      .single();
    
    if (updateCommentError) {
      return {
        success: false,
        error: `댓글 업데이트 오류: ${updateCommentError.message}`
      };
    }
    
    // 좋아요가 새로 추가된 경우 댓글 작성자에게 보상 지급
    if (newUserAction === 'like' && updatedComment.user_id && updatedComment.user_id !== user.id) {
      try {
        const activityTypes = await getActivityTypeValues();
        await rewardUserActivity(updatedComment.user_id, activityTypes.RECEIVED_LIKE, commentId);
        console.log('댓글 추천 받기 보상 지급 완료');
      } catch (rewardError) {
        console.error('댓글 추천 받기 보상 지급 오류:', rewardError);
        // 보상 지급 실패해도 좋아요는 성공으로 처리
      }
    }
    
    // 경로 재검증
    revalidatePath(`/boards/[slug]/[postNumber]`, 'page');
    
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
export async function dislikeComment(commentId: string): Promise<{
  success: boolean;
  likes?: number;
  dislikes?: number;
  userAction?: 'like' | 'dislike' | null;
  error?: string;
}> {
  try {
    const supabase = await createClient();

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
    const { data: updatedComment, error: updateCommentError } = await supabase
      .from('comments')
      .update({
        likes: likes,
        dislikes: dislikes
      })
      .eq('id', commentId)
      .select('likes, dislikes')
      .single();
    
    if (updateCommentError) {
      return {
        success: false,
        error: `댓글 업데이트 오류: ${updateCommentError.message}`
      };
    }
    
    // 경로 재검증
    revalidatePath(`/boards/[slug]/[postNumber]`, 'page');
    
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