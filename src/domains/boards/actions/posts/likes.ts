'use server';

import { rewardUserActivity, getActivityTypeValues } from '@/shared/actions/activity-actions';
import { checkSuspensionGuard } from '@/shared/utils/suspension-guard';
import { logUserAction } from '@/shared/actions/log-actions';
import { getSupabaseAction } from '@/shared/lib/supabase/server';
import { LikeActionResponse } from './utils';
import { createPostLikeNotification } from '@/domains/notifications/actions';

/**
 * 게시글 좋아요 액션
 * @param postId 게시글 ID
 * @returns 업데이트된 좋아요/싫어요 정보
 */
export async function likePost(postId: string): Promise<LikeActionResponse> {
  console.log('[likePost] 시작, postId:', postId);
  console.log('[likePost] 환경 변수 확인:', {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
  });
  
  try {
    const supabase = await getSupabaseAction();
    console.log('[likePost] Supabase 클라이언트 생성 완료');
    
    // Supabase 클라이언트가 제대로 생성되었는지 확인
    if (!supabase) {
      console.error('[likePost] Supabase 클라이언트가 null입니다');
      return { 
        success: false, 
        error: 'Supabase 클라이언트 초기화 실패' 
      };
    }
    
    // 인증된 사용자 정보 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('[likePost] 사용자 인증 결과:', { user: !!user, userError });
    
    if (userError || !user) {
      console.log('[likePost] 인증 실패');
      return { 
        success: false, 
        error: '로그인이 필요합니다.' 
      };
    }
    
    const userId = user.id;
    console.log('[likePost] 사용자 ID:', userId);
    
    // 계정 정지 상태 확인
    console.log('[likePost] 계정 정지 상태 확인 중...');
    const suspensionCheck = await checkSuspensionGuard(userId);
    console.log('[likePost] 계정 정지 상태:', suspensionCheck);
    
    if (suspensionCheck.isSuspended) {
      console.log('[likePost] 계정 정지됨');
      return { 
        success: false, 
        error: suspensionCheck.message || '계정이 정지되어 좋아요를 누를 수 없습니다.' 
      };
    }
    
    // 게시글 최신 정보 조회
    console.log('[likePost] 게시글 정보 조회 중...');
    const { data: currentPost, error: fetchError } = await supabase
      .from('posts')
      .select('likes, dislikes, user_id')
      .eq('id', postId)
      .single();
    
    console.log('[likePost] 게시글 정보 조회 결과:', { currentPost, fetchError });
      
    if (fetchError) {
      console.error('[likePost] 게시글 정보 조회 오류:', fetchError);
      return { 
        success: false, 
        error: '게시글 정보를 조회할 수 없습니다.' 
      };
    }
    
    // 이미 좋아요를 눌렀는지 확인
    console.log('[likePost] 기존 좋아요 확인 중...');
    const { data: likeRecord, error: likeError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('type', 'like');
    
    console.log('[likePost] 기존 좋아요 확인 결과:', { likeRecord, likeError });
    
    if (likeError) {
      console.error('[likePost] 좋아요 기록 확인 오류:', likeError);
      return { 
        success: false, 
        error: '좋아요 기록을 확인할 수 없습니다.' 
      };
    }
    
    const alreadyLiked = likeRecord && likeRecord.length > 0;
    console.log('[likePost] 이미 좋아요 상태:', alreadyLiked);
    let newLikes = currentPost.likes;
    let newDislikes = currentPost.dislikes;
    let newUserAction: 'like' | 'dislike' | null = null;
    
    if (alreadyLiked) {
      // 좋아요 취소
      console.log('[likePost] 좋아요 취소 처리 중...');
      const { error: deleteError } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('type', 'like');
      
      console.log('[likePost] 좋아요 취소 결과:', { deleteError });
      
      if (deleteError) {
        console.error('[likePost] 좋아요 취소 오류:', deleteError);
        return { 
          success: false, 
          error: '좋아요 취소 중 오류가 발생했습니다.' 
        };
      }
      
      // 게시글 좋아요 수 감소
      newLikes = Math.max(0, (currentPost.likes || 0) - 1);
      console.log('[likePost] 좋아요 수 감소:', newLikes);
      
      const { error: updateError } = await supabase
        .from('posts')
        .update({ likes: newLikes })
        .eq('id', postId);
      
      console.log('[likePost] 게시글 좋아요 수 업데이트 결과:', { updateError });
      
      if (updateError) {
        console.error('[likePost] 좋아요 수 갱신 오류:', updateError);
        return { 
          success: false, 
          error: '좋아요 수 갱신 중 오류가 발생했습니다.' 
        };
      }
      
      newUserAction = null; // 좋아요 취소 시 null로 설정
      console.log('[likePost] 좋아요 취소 완료');
    } else {
      // 기존 싫어요가 있으면 제거
      console.log('[likePost] 기존 싫어요 확인 중...');
      const { data: dislikeRecord, error: dislikeCheckError } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('type', 'dislike');
      
      console.log('[likePost] 기존 싫어요 확인 결과:', { dislikeRecord, dislikeCheckError });
      
      if (!dislikeCheckError && dislikeRecord && dislikeRecord.length > 0) {
        // 싫어요 제거
        console.log('[likePost] 기존 싫어요 제거 중...');
        const { error: deleteDislikeError } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId)
          .eq('type', 'dislike');
        
        console.log('[likePost] 싫어요 제거 결과:', { deleteDislikeError });
        
        if (!deleteDislikeError) {
          // 게시글 싫어요 수 감소
          newDislikes = Math.max(0, currentPost.dislikes - 1);
          console.log('[likePost] 싫어요 수 감소:', newDislikes);
        }
      }
      
      // 새로운 좋아요 추가
      console.log('[likePost] 새로운 좋아요 추가 중...');
      const { error: insertError } = await supabase
        .from('post_likes')
        .insert([{
          post_id: postId,
          user_id: userId,
          type: 'like'
        }]);
      
      console.log('[likePost] 좋아요 추가 결과:', { insertError });
      
      if (insertError) {
        console.error('[likePost] 좋아요 추가 오류:', insertError);
        return { 
          success: false, 
          error: '좋아요 추가 중 오류가 발생했습니다.' 
        };
      }
      
      // 게시글 좋아요 수 증가
      newLikes = (currentPost.likes || 0) + 1;
      console.log('[likePost] 좋아요 수 증가:', newLikes);
      
      const { error: updateError } = await supabase
        .from('posts')
        .update({ 
          likes: newLikes,
          dislikes: newDislikes
        })
        .eq('id', postId);
      
      console.log('[likePost] 게시글 좋아요/싫어요 수 업데이트 결과:', { updateError });
      
      if (updateError) {
        console.error('[likePost] 좋아요 수 갱신 오류:', updateError);
        return { 
          success: false, 
          error: '좋아요 수 갱신 중 오류가 발생했습니다.' 
        };
      }
      
      newUserAction = 'like';
      console.log('[likePost] 좋아요 추가 완료');

      // 좋아요 로그 기록
      await logUserAction(
        'POST_LIKE',
        `게시글 좋아요 (ID: ${postId})`,
        userId,
        { postId }
      );

      // 게시글 작성자에게 알림 및 보상 지급
      if (currentPost.user_id && currentPost.user_id !== userId) {
        try {
          // 게시글 정보 조회 (알림용)
          const { data: postData } = await supabase
            .from('posts')
            .select(`
              title,
              post_number,
              board:boards(slug)
            `)
            .eq('id', postId)
            .single();

          // 현재 사용자 닉네임 조회
          const { data: profile } = await supabase
            .from('profiles')
            .select('nickname')
            .eq('id', userId)
            .single();

          if (postData && profile) {
            const boardSlug = (postData.board as { slug: string } | null)?.slug || '';

            // 좋아요 알림 생성
            await createPostLikeNotification({
              postOwnerId: currentPost.user_id,
              actorId: userId,
              actorNickname: profile.nickname || '알 수 없음',
              postId,
              postTitle: postData.title,
              postNumber: postData.post_number,
              boardSlug
            });
          }

          // 보상 지급
          const activityTypes = await getActivityTypeValues();
          await rewardUserActivity(currentPost.user_id, activityTypes.RECEIVED_LIKE, postId);
        } catch (error) {
          console.error('게시글 좋아요 알림/보상 처리 오류:', error);
          // 알림/보상 실패해도 좋아요는 성공으로 처리
        }
      }
    }
    
    console.log('[likePost] 최종 결과:', { 
      success: true, 
      likes: newLikes || 0, 
      dislikes: newDislikes || 0, 
      userAction: newUserAction 
    });
    
    return {
      success: true,
      likes: newLikes || 0,
      dislikes: newDislikes || 0,
      userAction: newUserAction
    };
    
  } catch (error) {
    console.error('[likePost] 예외 발생:', error);
    
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
    const supabase = await getSupabaseAction();
    
    // 인증된 사용자 정보 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { 
        success: false, 
        error: '로그인이 필요합니다.' 
      };
    }
    
    const userId = user.id;
    
    // 계정 정지 상태 확인
    const suspensionCheck = await checkSuspensionGuard(userId);
    if (suspensionCheck.isSuspended) {
      return { 
        success: false, 
        error: suspensionCheck.message || '계정이 정지되어 싫어요를 누를 수 없습니다.' 
      };
    }
    
    // 게시글 최신 정보 조회
    const { data: currentPost, error: fetchError } = await supabase
      .from('posts')
      .select('likes, dislikes, user_id')
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
      newDislikes = Math.max(0, (currentPost.dislikes || 0) - 1);
      
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
      
      newUserAction = null; // 싫어요 취소 시 null로 설정
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
          newLikes = Math.max(0, (currentPost.likes || 0) - 1);
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
      newDislikes = (currentPost.dislikes || 0) + 1;
      
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
          error: '싫어요 수 갱신 중 오류가 발생했습니다.' 
        };
      }
      
      newUserAction = 'dislike';
    }
    
    return {
      success: true,
      likes: newLikes || 0,
      dislikes: newDislikes || 0,
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
 * 사용자가 게시글에 한 액션(좋아요/싫어요) 조회
 */
export async function getUserPostAction(postId: string): Promise<{ userAction: 'like' | 'dislike' | null, error?: string }> {
  try {
    const supabase = await getSupabaseAction();
    
    // 인증된 사용자 정보 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { 
        userAction: null,
        error: '로그인이 필요합니다.' 
      };
    }
    
    const userId = user.id;
    
    // 좋아요 확인
    const { data: likeRecord, error: likeError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('type', 'like')
      .maybeSingle();
    
    if (likeError) {
      return { userAction: null };
    }
    
    if (likeRecord) {
      return { userAction: 'like' };
    }
    
    // 싫어요 확인
    const { data: dislikeRecord, error: dislikeError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('type', 'dislike')
      .maybeSingle();
    
    if (dislikeError) {
      return { userAction: null };
    }
    
    if (dislikeRecord) {
      return { userAction: 'dislike' };
    }
    
    // 액션 없음
    return { userAction: null };
    
  } catch (error) {
    console.error('사용자 액션 확인 중 오류:', error);
    return { userAction: null };
  }
} 