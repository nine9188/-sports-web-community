'use server';

import { createClient, createServerActionClient } from '@/shared/api/supabaseServer';
import { revalidatePath } from 'next/cache';
import { cache } from 'react';
import { ReportResponse } from '@/domains/reports/types';

// 팀 타입 정의
export type TeamType = 'home' | 'away' | 'neutral';

// 응원 댓글 인터페이스
export interface SupportComment {
  id: string;
  content: string;
  team_type: TeamType;
  likes_count: number;
  dislikes_count?: number;
  created_at: string | null;
  user_id: string;
  is_liked?: boolean;
  is_disliked?: boolean;
  userAction?: 'like' | 'dislike' | null;
  is_hidden?: boolean;
  is_deleted?: boolean;
  user_profile?: {
    username?: string;
    nickname?: string;
    icon_id?: number;
    shop_items?: {
      image_url?: string;
    };
  };
}

// 응원 댓글 목록 조회 (캐시 적용)
export const getSupportComments = cache(async (matchId: string) => {
  try {
    const supabase = await createClient();
    
    // 현재 사용자 확인 (좋아요 상태 확인용)
    const { data: { user } } = await supabase.auth.getUser();
    
    // 댓글 기본 정보 조회
    const { data: comments, error } = await supabase
      .from('match_support_comments')
      .select(`
        id,
        content,
        team_type,
        likes_count,
        created_at,
        user_id
      `)
      .eq('match_id', matchId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('응원 댓글 조회 오류:', error);
      return { success: false, data: [], error: error.message };
    }

    if (!comments || comments.length === 0) {
      return { success: true, data: [], error: null };
    }

    // 사용자 프로필 정보 별도 조회
    const userIds = [...new Set(comments.map(comment => comment.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        nickname,
        icon_id,
        shop_items:icon_id (
          image_url
        )
      `)
      .in('id', userIds);

    // 사용자별 좋아요 상태 확인
    let likedCommentIds = new Set<string>();
    if (user && comments.length > 0) {
      const commentIds = comments.map(comment => comment.id);
      
      const { data: likes } = await supabase
        .from('match_comment_likes')
        .select('comment_id')
        .eq('user_id', user.id)
        .in('comment_id', commentIds);
      
      likedCommentIds = new Set(likes?.map(l => l.comment_id) || []);
    }

    // 프로필 정보를 맵으로 변환
    const profileMap = new Map(profiles?.map(profile => [profile.id, profile]) || []);

    // 댓글과 프로필 정보 결합
    const commentsWithProfiles: SupportComment[] = comments.map(comment => {
      const profile = profileMap.get(comment.user_id);
      
      // 댓글 내용을 기반으로 상태 판단
      let isHidden = false;
      let isDeleted = false;
      
      if (comment.content === '신고에 의해 삭제되었습니다.') {
        isDeleted = true;
        isHidden = false;
      } else if (comment.content === '신고에 의해 일시 숨김처리 되었습니다. 7일 후 다시 확인됩니다.') {
        isHidden = true;
        isDeleted = false;
      }
      
      return {
        id: comment.id,
        content: comment.content,
        team_type: comment.team_type as TeamType,
        likes_count: comment.likes_count || 0,
        created_at: comment.created_at,
        user_id: comment.user_id,
        is_liked: likedCommentIds.has(comment.id),
        is_disliked: false, // dislike 상태는 별도로 확인
        userAction: null, // 사용자 액션은 별도로 확인
        is_hidden: isHidden,
        is_deleted: isDeleted,
        user_profile: profile ? {
          username: profile.username || undefined,
          nickname: profile.nickname || undefined,
          icon_id: profile.icon_id || undefined,
          shop_items: profile.shop_items && (profile.shop_items as any)?.image_url ? { // eslint-disable-line @typescript-eslint/no-explicit-any
            image_url: (profile.shop_items as any).image_url || undefined // eslint-disable-line @typescript-eslint/no-explicit-any
          } : undefined
        } : undefined
      };
    });

    return { success: true, data: commentsWithProfiles, error: null };
  } catch (error) {
    console.error('응원 댓글 조회 중 예외 발생:', error);
    return { success: false, data: [], error: '응원 댓글을 불러오는 중 오류가 발생했습니다.' };
  }
});

// 응원 댓글 작성
export async function createSupportComment(
  matchId: string,
  teamType: TeamType,
  content: string
) {
  try {
    const supabase = await createServerActionClient();
    
    // 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // 댓글 작성 (조인 없이 단순 insert)
    const { data, error } = await supabase
      .from('match_support_comments')
      .insert({
        match_id: matchId,
        content,
        team_type: teamType,
        user_id: user.id,
        likes_count: 0
      })
      .select()
      .single();

    if (error) {
      console.error('응원 댓글 작성 오류:', error);
      return { success: false, error: error.message };
    }

    // 캐시 무효화
    revalidatePath(`/livescore/football/match/${matchId}`);

    return { success: true, comment: data };
  } catch (error) {
    console.error('응원 댓글 작성 중 예외 발생:', error);
    return { success: false, error: '댓글 작성 중 오류가 발생했습니다.' };
  }
}

// 응원 댓글 응답 타입
export interface MatchCommentLikeResponse {
  success: boolean;
  likes_count?: number;
  dislikes_count?: number;
  userAction?: 'like' | 'dislike' | null;
  error?: string;
}

// 응원 댓글 좋아요/취소 (별칭 함수 추가)
export async function toggleCommentLike(commentId: string) {
  return await likeMatchComment(commentId);
}

// 응원 댓글 좋아요
export async function likeMatchComment(commentId: string): Promise<MatchCommentLikeResponse> {
  try {
    const supabase = await createServerActionClient();

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
      .from('match_support_comments')
      .select('likes_count, dislikes_count')
      .eq('id', commentId)
      .single();
    
    if (commentFetchError) {
      return {
        success: false,
        error: `댓글 조회 오류: ${commentFetchError.message}`
      };
    }
    
    // 현재 좋아요/싫어요 수
    let likesCount = currentComment.likes_count || 0;
    let dislikesCount = currentComment.dislikes_count || 0;
    
    // 현재 사용자의 기존 액션 확인
    const { data: existingLikes } = await supabase
      .from('match_comment_likes')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', user.id);

    const existingLike = existingLikes?.[0];
    let userAction: 'like' | 'dislike' | null = null;
    
    if (existingLike) {
      // 기존 기록이 있는 경우
      const currentType = existingLike.type || 'like';
      
      if (currentType === 'like') {
        // 이미 좋아요인 경우 취소
        await supabase
          .from('match_comment_likes')
          .delete()
          .eq('id', existingLike.id);
        
        likesCount = Math.max(0, likesCount - 1);
        userAction = null;
      } else {
        // 싫어요 → 좋아요 변경
        await supabase
          .from('match_comment_likes')
          .update({ type: 'like' })
          .eq('id', existingLike.id);
        
        dislikesCount = Math.max(0, dislikesCount - 1);
        likesCount = likesCount + 1;
        userAction = 'like';
      }
    } else {
      // 새로운 좋아요 추가
      await supabase
        .from('match_comment_likes')
        .insert({
          comment_id: commentId,
          user_id: user.id,
          type: 'like'
        });
      
      likesCount = likesCount + 1;
      userAction = 'like';
    }
    
    // 댓글 정보 업데이트
    await supabase
      .from('match_support_comments')
      .update({ 
        likes_count: Math.max(0, likesCount),
        dislikes_count: Math.max(0, dislikesCount)
      })
      .eq('id', commentId);

    return {
      success: true,
      likes_count: Math.max(0, likesCount),
      dislikes_count: Math.max(0, dislikesCount),
      userAction
    };
    
  } catch (error) {
    console.error('좋아요 처리 오류:', error);
    return {
      success: false,
      error: '좋아요 처리 중 오류가 발생했습니다.'
    };
  }
}

// 응원 댓글 싫어요
export async function dislikeMatchComment(commentId: string): Promise<MatchCommentLikeResponse> {
  try {
    const supabase = await createServerActionClient();

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
      .from('match_support_comments')
      .select('likes_count, dislikes_count')
      .eq('id', commentId)
      .single();
    
    if (commentFetchError) {
      return {
        success: false,
        error: `댓글 조회 오류: ${commentFetchError.message}`
      };
    }
    
    // 현재 좋아요/싫어요 수
    let likesCount = currentComment.likes_count || 0;
    let dislikesCount = currentComment.dislikes_count || 0;
    
    // 현재 사용자의 기존 액션 확인
    const { data: existingLikes } = await supabase
      .from('match_comment_likes')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', user.id);

    const existingLike = existingLikes?.[0];
    let userAction: 'like' | 'dislike' | null = null;
    
    if (existingLike) {
      // 기존 기록이 있는 경우
      const currentType = existingLike.type || 'like';
      
      if (currentType === 'dislike') {
        // 이미 싫어요인 경우 취소
        await supabase
          .from('match_comment_likes')
          .delete()
          .eq('id', existingLike.id);
        
        dislikesCount = Math.max(0, dislikesCount - 1);
        userAction = null;
      } else {
        // 좋아요 → 싫어요 변경
        await supabase
          .from('match_comment_likes')
          .update({ type: 'dislike' })
          .eq('id', existingLike.id);
        
        likesCount = Math.max(0, likesCount - 1);
        dislikesCount = dislikesCount + 1;
        userAction = 'dislike';
      }
    } else {
      // 새로운 싫어요 추가
      await supabase
        .from('match_comment_likes')
        .insert({
          comment_id: commentId,
          user_id: user.id,
          type: 'dislike'
        });
      
      dislikesCount = dislikesCount + 1;
      userAction = 'dislike';
    }
    
    // 댓글 정보 업데이트
    await supabase
      .from('match_support_comments')
      .update({ 
        likes_count: Math.max(0, likesCount),
        dislikes_count: Math.max(0, dislikesCount)
      })
      .eq('id', commentId);

    return {
      success: true,
      likes_count: Math.max(0, likesCount),
      dislikes_count: Math.max(0, dislikesCount),
      userAction
    };
    
  } catch (error) {
    console.error('싫어요 처리 오류:', error);
    return {
      success: false,
      error: '싫어요 처리 중 오류가 발생했습니다.'
    };
  }
}

// 응원 댓글 좋아요/취소 (기존 함수명 유지)
export async function toggleSupportCommentLike(commentId: string) {
  return await likeMatchComment(commentId);
}

// 응원 댓글 삭제
export async function deleteSupportComment(commentId: string) {
  try {
    const supabase = await createServerActionClient();
    
    // 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // 댓글 소유자 확인
    const { data: comment, error: commentError } = await supabase
      .from('match_support_comments')
      .select('user_id, match_id')
      .eq('id', commentId)
      .single();

    if (commentError || !comment) {
      return { success: false, error: '댓글을 찾을 수 없습니다.' };
  }

    if (comment.user_id !== user.id) {
      return { success: false, error: '본인의 댓글만 삭제할 수 있습니다.' };
    }

    // 댓글 삭제
    const { error: deleteError } = await supabase
      .from('match_support_comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // 캐시 무효화
    revalidatePath(`/livescore/football/match/${comment.match_id}`);

    return { success: true };
  } catch (error) {
    console.error('댓글 삭제 중 예외 발생:', error);
    return { success: false, error: '댓글 삭제 중 오류가 발생했습니다.' };
  }
}

// 응원 댓글 신고
export async function reportSupportComment(
  commentId: string,
  reason: string,
  description?: string
): Promise<ReportResponse> {
  try {
    const supabase = await createServerActionClient();
    
    // 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // 중복 신고 확인
    const { data: existingReport } = await supabase
      .from('reports')
      .select('id')
      .eq('reporter_id', user.id)
      .eq('target_type', 'match_comment')
      .eq('target_id', commentId)
      .single();

    if (existingReport) {
      return { success: false, error: '이미 신고한 댓글입니다.' };
    }

    // 신고 생성
    const { data, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        target_type: 'match_comment',
        target_id: commentId,
        reason,
        description: description || null,
      })
      .select()
      .single();

    if (error) {
      console.error('응원 댓글 신고 오류:', error);
      return { success: false, error: '신고 처리 중 오류가 발생했습니다.' };
    }

    // 관련 페이지 캐시 갱신
    revalidatePath('/admin/reports');
    
    return { success: true, data };
  } catch (error) {
    console.error('응원 댓글 신고 중 예외 발생:', error);
    return { success: false, error: '신고 처리 중 오류가 발생했습니다.' };
  }
} 