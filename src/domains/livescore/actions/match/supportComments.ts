'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { cache } from 'react';

// Supabase 서버 클라이언트 생성
async function createServerComponentClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        }
      }
    }
  );
}

// 팀 타입 정의
export type TeamType = 'home' | 'away' | 'neutral';

// 응원 댓글 인터페이스
export interface SupportComment {
  id: string;
  user_id: string;
  match_id: string;
  team_type: TeamType;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  // 조인된 사용자 정보
  user_profile?: {
    nickname?: string;
    icon_id?: number;
    shop_items?: {
      image_url?: string;
    };
  };
  // 현재 사용자의 좋아요 여부
  is_liked?: boolean;
}

// 응답 인터페이스
export interface SupportCommentResponse {
  success: boolean;
  data?: SupportComment | SupportComment[] | null;
  error?: string;
  message?: string;
}

/**
 * 응원 댓글 작성
 */
export async function createSupportComment(
  matchId: string,
  teamType: TeamType,
  content: string
): Promise<SupportCommentResponse> {
  try {
    console.log('서버 액션 시작:', { matchId, teamType, content });
    
    const supabase = await createServerComponentClient();
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('사용자 인증 결과:', { user: user?.id, authError });
    
    if (authError || !user) {
      console.log('인증 실패:', authError);
      return {
        success: false,
        error: '로그인이 필요합니다.'
      };
    }

    // 내용 검증
    if (!content.trim() || content.length > 200) {
      console.log('내용 검증 실패:', { contentLength: content.length, trimmed: content.trim() });
      return {
        success: false,
        error: '댓글은 1자 이상 200자 이하로 작성해주세요.'
      };
    }

    console.log('댓글 삽입 시도:', {
      user_id: user.id,
      match_id: matchId,
      team_type: teamType,
      content: content.trim()
    });

    // 댓글 생성
    const { data, error } = await supabase
      .from('match_support_comments')
      .insert({
        user_id: user.id,
        match_id: matchId,
        team_type: teamType,
        content: content.trim()
      })
      .select()
      .single();

    console.log('댓글 삽입 결과:', { data, error });

    if (error) {
      console.error('댓글 삽입 오류:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // 캐시 무효화
    revalidatePath(`/livescore/football/match/${matchId}`);

    console.log('댓글 작성 성공:', data);
    return {
      success: true,
      data: data,
      message: '응원 댓글이 작성되었습니다!'
    };

  } catch (error) {
    console.error('응원 댓글 작성 오류:', error);
    return {
      success: false,
      error: '댓글 작성 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 매치 응원 댓글 목록 조회
 */
export async function getSupportComments(
  matchId: string,
  teamType?: TeamType,
  limit: number = 20,
  offset: number = 0
): Promise<SupportCommentResponse> {
  try {
    const supabase = await createServerComponentClient();
    
    // 현재 사용자 확인 (로그인하지 않아도 댓글은 볼 수 있음)
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase
      .from('match_support_comments')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 팀 타입 필터링
    if (teamType) {
      query = query.eq('team_type', teamType);
    }

    const { data, error } = await query;

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    // 사용자 정보를 별도로 조회
    let commentsWithUserInfo = data || [];
    
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(comment => comment.user_id))];
      
      // profiles 테이블에서 사용자 정보 조회
      const { data: profiles } = await supabase
        .from('profiles')
        .select(`
          id,
          nickname,
          icon_id,
          shop_items!profiles_icon_id_fkey (
            image_url
          )
        `)
        .in('id', userIds);

      // 댓글에 사용자 정보 매핑
      commentsWithUserInfo = data.map(comment => {
        const userProfile = profiles?.find(p => p.id === comment.user_id);
        return {
          ...comment,
          user_profile: userProfile ? {
            nickname: userProfile.nickname,
            icon_id: userProfile.icon_id,
            shop_items: userProfile.shop_items
          } : null
        };
      });
    }

    // 현재 사용자의 좋아요 정보 추가
    let commentsWithLikes = commentsWithUserInfo;
    
    if (user && commentsWithUserInfo.length > 0) {
      const commentIds = commentsWithUserInfo.map(comment => comment.id);
      
      const { data: userLikes } = await supabase
        .from('match_comment_likes')
        .select('comment_id')
        .eq('user_id', user.id)
        .in('comment_id', commentIds);

      const likedCommentIds = new Set(userLikes?.map(like => like.comment_id) || []);
      
      commentsWithLikes = commentsWithUserInfo.map(comment => ({
        ...comment,
        is_liked: likedCommentIds.has(comment.id)
      }));
    }

    return {
      success: true,
      data: commentsWithLikes
    };

  } catch (error) {
    console.error('응원 댓글 조회 오류:', error);
    return {
      success: false,
      error: '댓글 조회 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 댓글 좋아요/좋아요 취소
 */
export async function toggleCommentLike(commentId: string): Promise<SupportCommentResponse> {
  try {
    const supabase = await createServerComponentClient();
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그인이 필요합니다.'
      };
    }

    // 기존 좋아요 확인
    const { data: existingLike } = await supabase
      .from('match_comment_likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('comment_id', commentId)
      .single();

    if (existingLike) {
      // 좋아요 취소
      const { error } = await supabase
        .from('match_comment_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('comment_id', commentId);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        message: '좋아요를 취소했습니다.'
      };
    } else {
      // 좋아요 추가
      const { error } = await supabase
        .from('match_comment_likes')
        .insert({
          user_id: user.id,
          comment_id: commentId
        });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        message: '좋아요를 눌렀습니다!'
      };
    }

  } catch (error) {
    console.error('댓글 좋아요 토글 오류:', error);
    return {
      success: false,
      error: '좋아요 처리 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 댓글 삭제
 */
export async function deleteSupportComment(commentId: string): Promise<SupportCommentResponse> {
  try {
    const supabase = await createServerComponentClient();
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그인이 필요합니다.'
      };
    }

    // 댓글 삭제 (RLS 정책으로 본인 댓글만 삭제 가능)
    const { error } = await supabase
      .from('match_support_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      message: '댓글이 삭제되었습니다.'
    };

  } catch (error) {
    console.error('댓글 삭제 오류:', error);
    return {
      success: false,
      error: '댓글 삭제 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 댓글 수정
 */
export async function updateSupportComment(
  commentId: string,
  content: string
): Promise<SupportCommentResponse> {
  try {
    const supabase = await createServerComponentClient();
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그인이 필요합니다.'
      };
    }

    // 내용 검증
    if (!content.trim() || content.length > 200) {
      return {
        success: false,
        error: '댓글은 1자 이상 200자 이하로 작성해주세요.'
      };
    }

    // 댓글 수정
    const { data, error } = await supabase
      .from('match_support_comments')
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      data: data,
      message: '댓글이 수정되었습니다.'
    };

  } catch (error) {
    console.error('댓글 수정 오류:', error);
    return {
      success: false,
      error: '댓글 수정 중 오류가 발생했습니다.'
    };
  }
}

// 캐싱된 함수들
export const getCachedSupportComments = cache(getSupportComments); 