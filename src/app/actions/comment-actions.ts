'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '../lib/supabase.server';
import { rewardUserActivity, getActivityTypeValues } from './activity-actions';
import { CommentType } from '@/app/types/comment';

export type CommentFormState = {
  message: string;
  errors: {
    content?: string[];
  };
};

interface CommentActionResponse {
  success: boolean;
  data?: CommentType | null;
  comments?: CommentType[];
  error?: string;
}

interface CommentLikeResponse {
  success: boolean;
  likes: number;
  dislikes: number;
  userAction: 'like' | 'dislike' | null;
  error?: string;
}

export async function addComment_new(
  postId: string,
  prevState: CommentFormState,
  formData: FormData
): Promise<CommentFormState> {
  const contentRaw = formData.get('content');
  const content = typeof contentRaw === 'string' ? contentRaw.trim() : '';

  if (!content) {
    return {
      message: '',
      errors: {
        content: ['댓글 내용은 필수입니다.'],
      },
    };
  }

  // Supabase 클라이언트 생성 - await 사용
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      message: '로그인이 필요합니다.',
      errors: {},
    };
  }

  // 댓글 추가
  const { error: commentError, data: commentData } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: user.id,
      content,
    })
    .select('id')
    .single();

  if (commentError) {
    console.error('댓글 작성 오류:', commentError);
    return {
      message: '댓글 작성 중 오류가 발생했습니다.',
      errors: {},
    };
  }

  // 성공적으로 댓글이 추가되었습니다
  console.log('댓글이 성공적으로 추가되었습니다.');
  
  // 댓글 작성 활동에 대한 보상 지급 (에러 무시 - 보상이 실패해도 댓글 작성은 성공)
  try {
    // 활동 유형 가져오기
    const activityTypes = await getActivityTypeValues();
    
    // 댓글 작성 보상 지급
    const { success, error } = await rewardUserActivity(
      user.id,
      activityTypes.COMMENT_CREATION,
      commentData?.id
    );
    
    if (success) {
      console.log('댓글 작성 보상이 성공적으로 지급되었습니다.');
    } else if (error) {
      console.log('댓글 작성 보상 지급 실패:', error);
    }
  } catch (rewardError) {
    console.error('댓글 작성 보상 처리 중 예외:', rewardError);
    // 보상 실패해도 댓글 작성은 성공으로 처리
  }
  
  // 페이지 갱신
  revalidatePath(`/posts/${postId}`);

  return {
    message: '댓글이 작성되었습니다.',
    errors: {},
  };
}

// 클라이언트 컴포넌트에서 사용하는 기존 버전 - compatibility 유지
export async function addComment(postId: string, content: string): Promise<CommentActionResponse> {
  // 1. 유효성 검사 (내용은 최소 1글자, 최대 1000글자)
  if (!content || content.length < 1 || content.length > 1000) {
    return {
      success: false,
      error: "댓글은 1~1000자 사이로 작성해주세요."
    };
  }

  try {
    // 2. Supabase 클라이언트 생성
    const supabase = await createClient();
    
    // 인증된 사용자 정보 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('인증된 사용자 없음');
      return {
        success: false,
        error: '로그인이 필요합니다.'
      };
    }
    
    const userId = user.id;
    
    // 댓글 작성
    const { data: newComment, error: insertError } = await supabase
      .from('comments')
      .insert([{
        post_id: postId,
        user_id: userId,
        content: content.trim()
      }])
      .select('id, content, created_at, user_id, post_id, likes, dislikes, profiles:profiles(id, nickname, icon_id)')
      .single();
    
    if (insertError) {
      console.error('댓글 삽입 오류:', insertError);
      return {
        success: false,
        error: '댓글 작성 중 오류가 발생했습니다.'
      };
    }
    
    console.log('댓글 삽입 성공:', newComment?.id);
    
    // 댓글 작성 활동에 대한 보상 지급 (에러 무시 - 보상이 실패해도 댓글 작성은 성공)
    try {
      // 활동 유형 가져오기
      const activityTypes = await getActivityTypeValues();
      
      // 댓글 작성 보상 지급
      const { success, error } = await rewardUserActivity(
        userId,
        activityTypes.COMMENT_CREATION,
        newComment?.id
      );
      
      if (success) {
        console.log('댓글 작성 보상이 성공적으로 지급되었습니다.');
      } else if (error) {
        console.log('댓글 작성 보상 지급 실패:', error);
      }
    } catch (rewardError) {
      console.error('댓글 작성 보상 처리 중 예외:', rewardError);
      // 보상 실패해도 댓글 작성은 성공으로 처리
    }
    
    // 페이지 재검증
    revalidatePath(`/boards/[slug]/[postNumber]`);
    
    return {
      success: true,
      data: newComment as unknown as CommentType
    };
    
  } catch (error) {
    console.error('댓글 작성 중 예외 발생:', error);
    return {
      success: false,
      error: error instanceof Error ? `댓글 작성 중 오류: ${error.message}` : '댓글 작성 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 댓글 수정 
 */
export async function updateComment(commentId: string, content: string): Promise<CommentActionResponse> {
  if (!content.trim()) {
    return {
      success: false,
      error: '댓글 내용을 입력해주세요.'
    };
  }
  
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
    if (comment.user_id !== userId) {
      return {
        success: false,
        error: '자신의 댓글만 수정할 수 있습니다.'
      };
    }
    
    // 댓글 수정
    const { data: updatedComment, error: updateError } = await supabase
      .from('comments')
      .update({ content: content.trim() })
      .eq('id', commentId)
      .eq('user_id', userId)
      .select('id, content, created_at, user_id, post_id, likes, dislikes, profiles:profiles(id, nickname, icon_id)')
      .single();
    
    if (updateError) {
      return {
        success: false,
        error: '댓글 수정 중 오류가 발생했습니다.'
      };
    }
    
    // 페이지 재검증
    revalidatePath(`/boards/[slug]/[postNumber]`);
    
    return {
      success: true,
      data: updatedComment as unknown as CommentType
    };
    
  } catch (error) {
    console.error('댓글 수정 중 오류:', error);
    return {
      success: false,
      error: '댓글 수정 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 댓글 삭제
 */
export async function deleteComment(commentId: string): Promise<CommentActionResponse> {
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
    
    // 권한 확인 (자신의 댓글만 삭제 가능)
    if (comment.user_id !== userId) {
      return {
        success: false,
        error: '자신의 댓글만 삭제할 수 있습니다.'
      };
    }
    
    // 댓글 삭제
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);
    
    if (deleteError) {
      return {
        success: false,
        error: '댓글 삭제 중 오류가 발생했습니다.'
      };
    }
    
    // 페이지 재검증
    revalidatePath(`/boards/[slug]/[postNumber]`);
    
    return {
      success: true
    };
    
  } catch (error) {
    console.error('댓글 삭제 중 오류:', error);
    return {
      success: false,
      error: '댓글 삭제 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 게시글의 모든 댓글 가져오기
 */
export async function getComments(postId: string): Promise<CommentActionResponse> {
  try {
    const supabase = await createClient();
    
    // 댓글 조회 - 오류가 발생해도 조용히 처리
    const { data: comments, error: fetchError } = await supabase
      .from('comments')
      .select('id, content, created_at, user_id, post_id, likes, dislikes, profiles:profiles(id, nickname, icon_id)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    
    // 에러 발생 시 빈 배열 반환
    if (fetchError) {
      console.error('댓글 조회 중 데이터베이스 오류:', fetchError);
      return {
        success: true, // 빈 배열로 성공 처리
        comments: []
      };
    }
    
    // 사용자 액션 정보 조회 (실패해도 무시)
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user && comments && comments.length > 0) {
        // 안전하게 ID 추출
        const commentIds = comments.map(comment => comment.id);
        
        // 좋아요 상태 가져오기
        const { data: userLikes } = await supabase
          .from('comment_likes')
          .select('comment_id, type')
          .eq('user_id', user.id)
          .in('comment_id', commentIds);
        
        // 액션 정보 매핑
        const userActionMap: Record<string, 'like' | 'dislike'> = {};
        
        if (userLikes) {
          userLikes.forEach(like => {
            if (like && typeof like.comment_id === 'string') {
              userActionMap[like.comment_id] = like.type as 'like' | 'dislike';
            }
          });
        }
        
        // Supabase의 실제 반환 값을 CommentType으로 변환
        const commentsWithActions = comments.map(comment => {
          // 원래 객체를 JSON으로 변환 후 다시 파싱하여 깊은 복사
          const commentCopy = JSON.parse(JSON.stringify(comment));
          
          // userAction 필드 추가
          commentCopy.userAction = userActionMap[comment.id] || null;
          
          // unknown을 통한 안전한 타입 변환
          return commentCopy as unknown as CommentType;
        });
        
        return {
          success: true,
          comments: commentsWithActions
        };
      }
    } catch (userError) {
      // 사용자 정보 조회 실패해도 댓글은 반환
      console.error('사용자 액션 정보 조회 실패:', userError);
    }
    
    // 기본 댓글 반환 (안전한 타입 변환)
    if (comments) {
      return {
        success: true,
        comments: comments as unknown as CommentType[]
      };
    }
    
    return {
      success: true,
      comments: []
    };
    
  } catch (error) {
    // 모든 오류 처리 - 빈 배열 반환
    console.error('댓글 목록 조회 중 오류:', error);
    return {
      success: true, // 빈 배열로 성공 처리
      comments: []
    };
  }
}

/**
 * 댓글 좋아요 액션
 */
export async function likeComment(commentId: string): Promise<CommentLikeResponse> {
  try {
    const supabase = await createClient();
    
    // 인증된 사용자 정보 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        likes: 0,
        dislikes: 0,
        userAction: null,
        error: '로그인이 필요합니다.'
      };
    }
    
    const userId = user.id;

    // 댓글 정보 조회
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('id, likes, dislikes, post_id')
      .eq('id', commentId)
      .single();
    
    if (fetchError) {
      console.error('댓글 정보 조회 오류:', fetchError);
      return {
        success: false,
        likes: 0,
        dislikes: 0,
        userAction: null,
        error: `댓글을 찾을 수 없습니다: ${fetchError.message}`
      };
    }
    
    if (!comment) {
      console.error('댓글이 존재하지 않음:', commentId);
      return {
        success: false,
        likes: 0,
        dislikes: 0,
        userAction: null,
        error: '댓글을 찾을 수 없습니다.'
      };
    }
    
    // 테이블 존재 여부 확인 (디버깅 목적)
    try {
      const { data: tableInfo, error: tableError } = await supabase
        .from('comment_likes')
        .select('count(*)', { count: 'exact', head: true });
        
      if (tableError) {
        console.error('comment_likes 테이블 접근 권한 오류:', tableError);
      } else {
        console.log('comment_likes 테이블 접근 가능, 총 레코드 수:', tableInfo);
      }
    } catch (tableCheckError) {
      console.error('테이블 확인 중 오류:', tableCheckError);
    }
    
    // 이미 좋아요를 눌렀는지 확인
    const { data: likeRecord, error: likeError } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .eq('type', 'like');
    
    if (likeError) {
      console.error('좋아요 상태 확인 오류:', likeError);
      return {
        success: false,
        likes: comment.likes || 0,
        dislikes: comment.dislikes || 0,
        userAction: null,
        error: `좋아요 상태를 확인할 수 없습니다: ${likeError.message}`
      };
    }
    
    let newLikes = comment.likes || 0;
    let newDislikes = comment.dislikes || 0;
    let newUserAction: 'like' | 'dislike' | null = null;
    
    if (likeRecord && likeRecord.length > 0) {
      // 좋아요 취소
      const { error: deleteError } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId)
        .eq('type', 'like');
      
      if (deleteError) {
        console.error('좋아요 취소 오류:', deleteError);
        return {
          success: false,
          likes: newLikes,
          dislikes: newDislikes,
          userAction: 'like',
          error: `좋아요 취소 중 오류가 발생했습니다: ${deleteError.message}`
        };
      }
      
      // 댓글 좋아요 수 감소
      newLikes = Math.max(0, newLikes - 1);
      
      // 댓글 업데이트
      const { error: updateError } = await supabase
        .from('comments')
        .update({ likes: newLikes })
        .eq('id', commentId);
      
      if (updateError) {
        console.error('댓글 좋아요 수 업데이트 오류:', updateError);
        return {
          success: false,
          likes: newLikes + 1, // 롤백
          dislikes: newDislikes,
          userAction: 'like',
          error: `좋아요 수 갱신 중 오류가 발생했습니다: ${updateError.message}`
        };
      }
    } else {
      // 기존 싫어요가 있으면 제거
      const { data: dislikeRecord, error: dislikeError } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', userId)
        .eq('type', 'dislike');
      
      if (dislikeError) {
        console.error('기존 싫어요 확인 오류:', dislikeError);
      }
      
      if (!dislikeError && dislikeRecord && dislikeRecord.length > 0) {
        // 싫어요 제거
        const { error: dislikeDeleteError } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', userId)
          .eq('type', 'dislike');
          
        if (dislikeDeleteError) {
          console.error('싫어요 제거 오류:', dislikeDeleteError);
        } else {
          // 싫어요 수 감소
          newDislikes = Math.max(0, newDislikes - 1);
        }
      }
      
      // 새로운 좋아요 추가
      const { error: insertError } = await supabase
        .from('comment_likes')
        .insert([{
          comment_id: commentId,
          user_id: userId,
          type: 'like'
        }]);
      
      if (insertError) {
        console.error('좋아요 추가 오류:', insertError, '데이터:', {
          comment_id: commentId,
          user_id: userId,
          type: 'like'
        });
        return {
          success: false,
          likes: newLikes,
          dislikes: newDislikes,
          userAction: null,
          error: `좋아요 추가 중 오류가 발생했습니다: ${insertError.message}`
        };
      }
      
      // 좋아요 수 증가
      newLikes += 1;
      
      // 댓글 업데이트
      const { error: updateError } = await supabase
        .from('comments')
        .update({
          likes: newLikes,
          dislikes: newDislikes
        })
        .eq('id', commentId);
      
      if (updateError) {
        console.error('댓글 좋아요/싫어요 수 업데이트 오류:', updateError);
        return {
          success: false,
          likes: newLikes - 1, // 롤백
          dislikes: newDislikes,
          userAction: null,
          error: `좋아요 수 갱신 중 오류가 발생했습니다: ${updateError.message}`
        };
      }
      
      newUserAction = 'like';
    }
    
    // 댓글이 속한 게시물 경로 재검증
    if (comment.post_id) {
      try {
        // 게시물 정보 가져오기
        const { data: postData } = await supabase
          .from('posts')
          .select('board_slug, number')
          .eq('id', comment.post_id)
          .single();
          
        if (postData?.board_slug && postData?.number) {
          // 구체적인 게시물 경로로 재검증
          revalidatePath(`/boards/${postData.board_slug}/${postData.number}`);
          console.log(`페이지 재검증 완료: /boards/${postData.board_slug}/${postData.number}`);
        } else {
          // 폴백: 동적 경로 재검증
          revalidatePath(`/boards/[slug]/[postNumber]`, 'page');
          console.log('페이지 재검증 완료 (동적 경로)');
        }
      } catch (revalidateError) {
        console.error('페이지 재검증 오류:', revalidateError);
        // 재검증 실패해도 좋아요 처리 자체는 성공으로 처리
      }
    }
    
    return {
      success: true,
      likes: newLikes,
      dislikes: newDislikes,
      userAction: newUserAction
    };
    
  } catch (error) {
    console.error('댓글 좋아요 처리 중 예외 발생:', error);
    return {
      success: false,
      likes: 0,
      dislikes: 0,
      userAction: null,
      error: `댓글 좋아요 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * 댓글 싫어요 액션
 */
export async function dislikeComment(commentId: string): Promise<CommentLikeResponse> {
  try {
    const supabase = await createClient();
    
    // 인증된 사용자 정보 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        likes: 0,
        dislikes: 0,
        userAction: null,
        error: '로그인이 필요합니다.'
      };
    }
    
    const userId = user.id;
    
    // 댓글 정보 조회
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('id, likes, dislikes, post_id')
      .eq('id', commentId)
      .single();
    
    if (fetchError || !comment) {
      return {
        success: false,
        likes: 0,
        dislikes: 0,
        userAction: null,
        error: '댓글을 찾을 수 없습니다.'
      };
    }
    
    // 이미 싫어요를 눌렀는지 확인
    const { data: dislikeRecord, error: dislikeError } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .eq('type', 'dislike');
    
    if (dislikeError) {
      return {
        success: false,
        likes: comment.likes || 0,
        dislikes: comment.dislikes || 0,
        userAction: null,
        error: '싫어요 상태를 확인할 수 없습니다.'
      };
    }
    
    let newLikes = comment.likes || 0;
    let newDislikes = comment.dislikes || 0;
    let newUserAction: 'like' | 'dislike' | null = null;
    
    if (dislikeRecord && dislikeRecord.length > 0) {
      // 싫어요 취소
      const { error: deleteError } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId)
        .eq('type', 'dislike');
      
      if (deleteError) {
        return {
          success: false,
          likes: newLikes,
          dislikes: newDislikes,
          userAction: 'dislike',
          error: '싫어요 취소 중 오류가 발생했습니다.'
        };
      }
      
      // 댓글 싫어요 수 감소
      newDislikes = Math.max(0, newDislikes - 1);
      
      // 댓글 업데이트
      const { error: updateError } = await supabase
        .from('comments')
        .update({ dislikes: newDislikes })
        .eq('id', commentId);
      
      if (updateError) {
        return {
          success: false,
          likes: newLikes,
          dislikes: newDislikes + 1, // 롤백
          userAction: 'dislike',
          error: '싫어요 수 갱신 중 오류가 발생했습니다.'
        };
      }
    } else {
      // 기존 좋아요가 있으면 제거
      const { data: likeRecord, error: likeError } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', userId)
        .eq('type', 'like');
      
      if (!likeError && likeRecord && likeRecord.length > 0) {
        // 좋아요 제거
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', userId)
          .eq('type', 'like');
        
        // 좋아요 수 감소
        newLikes = Math.max(0, newLikes - 1);
      }
      
      // 새로운 싫어요 추가
      const { error: insertError } = await supabase
        .from('comment_likes')
        .insert([{
          comment_id: commentId,
          user_id: userId,
          type: 'dislike'
        }]);
      
      if (insertError) {
        return {
          success: false,
          likes: newLikes,
          dislikes: newDislikes,
          userAction: null,
          error: '싫어요 추가 중 오류가 발생했습니다.'
        };
      }
      
      // 싫어요 수 증가
      newDislikes += 1;
      
      // 댓글 업데이트
      const { error: updateError } = await supabase
        .from('comments')
        .update({
          likes: newLikes,
          dislikes: newDislikes
        })
        .eq('id', commentId);
      
      if (updateError) {
        return {
          success: false,
          likes: newLikes,
          dislikes: newDislikes - 1, // 롤백
          userAction: null,
          error: '싫어요 수 갱신 중 오류가 발생했습니다.'
        };
      }
      
      newUserAction = 'dislike';
    }
    
    // 페이지 재검증
    revalidatePath(`/boards/[slug]/[postNumber]`, 'page');
    
    return {
      success: true,
      likes: newLikes,
      dislikes: newDislikes,
      userAction: newUserAction
    };
    
  } catch (error) {
    console.error('댓글 싫어요 처리 중 예외 발생:', error);
    return {
      success: false,
      likes: 0,
      dislikes: 0,
      userAction: null,
      error: '댓글 싫어요 처리 중 오류가 발생했습니다.'
    };
  }
}