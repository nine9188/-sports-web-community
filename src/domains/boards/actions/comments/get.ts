'use server';

import { createClient } from '@/shared/api/supabaseServer';
import { CommentType } from '../../types/post/comment';
import { CommentsListResponse, addIconUrlToComments, determineCommentStatus } from './utils';

/**
 * 댓글 목록 조회
 */
export async function getComments(postId: string): Promise<CommentsListResponse> {
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
          icon_id,
          level
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
    
    // 댓글 데이터를 CommentType으로 캐스팅하고 상태 판단
    const comments = (data || []).map(comment => {
      const commentData = {
        id: comment.id,
        user_id: comment.user_id,
        post_id: comment.post_id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        parent_id: comment.parent_id || null,
        likes: comment.likes || 0,
        dislikes: comment.dislikes || 0,
        profiles: comment.profiles,
        is_hidden: false,
        is_deleted: false
      } as CommentType;
      
      // 댓글 상태 판단
      const status = determineCommentStatus(comment);
      commentData.is_hidden = status.is_hidden;
      commentData.is_deleted = status.is_deleted;
      
      return commentData;
    });
    
    // 아이콘 정보 추가 처리
    const commentsWithIcons = await addIconUrlToComments(comments, supabase);
    
    // 사용자 액션(좋아요/싫어요) 확인
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user && commentsWithIcons.length > 0) {
      const commentIds = commentsWithIcons.map(comment => comment.id);
      
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
        
        commentsWithIcons.forEach(comment => {
          if (actionMap[comment.id]) {
            comment.userAction = actionMap[comment.id] === 'like' ? 'like' : 'dislike';
          } else {
            comment.userAction = null;
          }
        });
      } else {
        // 사용자 액션이 없는 경우 모든 댓글에 null 설정
        commentsWithIcons.forEach(comment => {
          comment.userAction = null;
        });
      }
    } else {
      // 로그인하지 않은 경우 모든 댓글에 null 설정
      commentsWithIcons.forEach(comment => {
        comment.userAction = null;
      });
    }
    
    return {
      success: true,
      comments: commentsWithIcons
    };
  } catch (error) {
    console.error('댓글 목록 로딩 중 예외:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '댓글 목록을 불러오는 중 오류가 발생했습니다.'
    };
  }
} 