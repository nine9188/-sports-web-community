'use server';

import { getSupabaseServer, getSupabaseAction } from '@/shared/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cache } from 'react';
import { ReportResponse } from '@/domains/reports/types';

export type TeamType = 'home' | 'away' | 'neutral';

// ????????? ?癲ル슢?뤸뤃?????볥궙???
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
    public_id?: string;
    icon_id?: number;
    shop_items?: {
      image_url?: string;
    };
  };
}

// ????????? ?꿔꺂??袁ㅻ븶筌믠뫀萸???됰슦????(?????????쇨덫??
export const getSupportComments = cache(async (matchId: string) => {
  try {
    const supabase = await getSupabaseServer();
    
    // ????썹땟????????癲ル슢캉????(????щ였???????븐뻤???癲ル슢캉?????
    const { data: { user } } = await supabase.auth.getUser();
    
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
      console.error('응원댓글 조회 오류:', error);
      return { success: false, data: [], error: error.message };
    }

    if (!comments || comments.length === 0) {
      return { success: true, data: [], error: null };
    }

    const userIds = [...new Set(comments.map(comment => comment.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        nickname,
        public_id,
        icon_id,
        shop_items:icon_id (
          image_url
        )
      `)
      .in('id', userIds);

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

    const profileMap = new Map(profiles?.map(profile => [profile.id, profile]) || []);

    // ?????????썹땟怨⒲뀋???癲ル슢???ъ쒜??嚥▲굧?????
    const commentsWithProfiles: SupportComment[] = comments.map(comment => {
      const profile = profileMap.get(comment.user_id);
      
      let isHidden = false;
      let isDeleted = false;
      
      if (comment.content === '????ャ렑???????????????嶺???????') {
        isDeleted = true;
        isHidden = false;
      } else if (comment.content === '????ャ렑????????????濚밸Ŧ援앾쭛?????꿔꺂??節뉖き????嶺??????? 7????????⑤베鍮??癲ル슢캉?????嶺뚮ㅎ????') {
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
        is_disliked: false, // dislike ????븐뻤?????⑤슢?????븐쪎影??뱺??癲ル슢캉????        userAction: null, // ??????????Β?? ??⑤슢?????븐쪎影??뱺??癲ル슢캉????        is_hidden: isHidden,
        is_deleted: isDeleted,
        user_profile: profile ? {
          username: profile.username || undefined,
          nickname: profile.nickname || undefined,
          public_id: profile.public_id || undefined,
          icon_id: profile.icon_id || undefined,
          shop_items: profile.shop_items && (profile.shop_items as any)?.image_url ? { // eslint-disable-line @typescript-eslint/no-explicit-any
            image_url: (profile.shop_items as any).image_url || undefined // eslint-disable-line @typescript-eslint/no-explicit-any
          } : undefined
        } : undefined
      };
    });

    return { success: true, data: commentsWithProfiles, error: null };
  } catch (error) {
    console.error('응원댓글 조회 중 오류:', error);
    return { success: false, data: [], error: '댓글을 불러오는 중 오류가 발생했습니다.' };
  }
});

export async function createSupportComment(
  matchId: string,
  teamType: TeamType,
  content: string,
  currentPath?: string
) {
  try {
    const supabase = await getSupabaseAction();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // ??? ??????(??됰슦????????ㅼ굡????潁??insert)
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
      console.error('응원댓글 작성 오류:', error);
      return { success: false, error: error.message };
    }

    revalidatePath(currentPath || `/livescore/football/match/${matchId}`);

    return { success: true, comment: data };
  } catch (error) {
    console.error('응원댓글 작성 중 오류:', error);
    return { success: false, error: '댓글 작성 중 오류가 발생했습니다.' };
  }
}

// ????????? ???????????
export interface MatchCommentLikeResponse {
  success: boolean;
  likes_count?: number;
  dislikes_count?: number;
  userAction?: 'like' | 'dislike' | null;
  error?: string;
}

// ????????? ????щ였?????????(??⑤슢???釉띾떛???潁?????ㅻ쿋??)
export async function toggleCommentLike(commentId: string) {
  return await likeMatchComment(commentId);
}

// ????????? ????щ였???
export async function likeMatchComment(commentId: string): Promise<MatchCommentLikeResponse> {
  try {
    const supabase = await getSupabaseAction();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그인이 필요합니다.'
      };
    }
    
    const { data: currentComment, error: commentFetchError } = await supabase
      .from('match_support_comments')
      .select('likes_count, dislikes_count')
      .eq('id', commentId)
      .single();
    
    if (commentFetchError) {
      return {
        success: false,
        error: `댓글 정보를 불러오지 못했습니다: ${commentFetchError.message}`
      };
    }
    
    let likesCount = currentComment.likes_count || 0;
    let dislikesCount = currentComment.dislikes_count || 0;
    
    const { data: existingLikes } = await supabase
      .from('match_comment_likes')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', user.id);

    const existingLike = existingLikes?.[0];
    let userAction: 'like' | 'dislike' | null = null;
    
    if (existingLike) {
      const currentType = existingLike.type || 'like';
      
      if (currentType === 'like') {
        await supabase
          .from('match_comment_likes')
          .delete()
          .eq('id', existingLike.id);
        
        likesCount = Math.max(0, likesCount - 1);
        userAction = null;
      } else {
        await supabase
          .from('match_comment_likes')
          .update({ type: 'like' })
          .eq('id', existingLike.id);
        
        dislikesCount = Math.max(0, dislikesCount - 1);
        likesCount = likesCount + 1;
        userAction = 'like';
      }
    } else {
      // ????沅??????щ였??????ㅻ쿋??
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
    console.error('댓글 좋아요 처리 오류:', error);
    return {
      success: false,
      error: '좋아요 처리 중 오류가 발생했습니다.'
    };
  }
}

// ????????? ??????
export async function dislikeMatchComment(commentId: string): Promise<MatchCommentLikeResponse> {
  try {
    const supabase = await getSupabaseAction();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그인이 필요합니다.'
      };
    }
    
    const { data: currentComment, error: commentFetchError } = await supabase
      .from('match_support_comments')
      .select('likes_count, dislikes_count')
      .eq('id', commentId)
      .single();
    
    if (commentFetchError) {
      return {
        success: false,
        error: `댓글 정보를 불러오지 못했습니다: ${commentFetchError.message}`
      };
    }
    
    let likesCount = currentComment.likes_count || 0;
    let dislikesCount = currentComment.dislikes_count || 0;
    
    const { data: existingLikes } = await supabase
      .from('match_comment_likes')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', user.id);

    const existingLike = existingLikes?.[0];
    let userAction: 'like' | 'dislike' | null = null;
    
    if (existingLike) {
      const currentType = existingLike.type || 'like';
      
      if (currentType === 'dislike') {
        await supabase
          .from('match_comment_likes')
          .delete()
          .eq('id', existingLike.id);
        
        dislikesCount = Math.max(0, dislikesCount - 1);
        userAction = null;
      } else {
        await supabase
          .from('match_comment_likes')
          .update({ type: 'dislike' })
          .eq('id', existingLike.id);
        
        likesCount = Math.max(0, likesCount - 1);
        dislikesCount = dislikesCount + 1;
        userAction = 'dislike';
      }
    } else {
      // ????沅???????????ㅻ쿋??
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
    console.error('댓글 싫어요 처리 오류:', error);
    return {
      success: false,
      error: '싫어요 처리 중 오류가 발생했습니다.'
    };
  }
}

// ????????? ????щ였?????????(???뚯??????潁??臾믩븸????)
export async function toggleSupportCommentLike(commentId: string) {
  return await likeMatchComment(commentId);
}

// ????????? ????
export async function deleteSupportComment(commentId: string, currentPath?: string) {
  try {
    const supabase = await getSupabaseAction();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const { data: comment, error: commentError } = await supabase
      .from('match_support_comments')
      .select('user_id, match_id')
      .eq('id', commentId)
      .single();

    if (commentError || !comment) {
      return { success: false, error: '댓글을 찾을 수 없습니다.' };
  }

    if (comment.user_id !== user.id) {
      return { success: false, error: '본인이 작성한 댓글만 삭제할 수 있습니다.' };
    }

    const { error: deleteError } = await supabase
      .from('match_support_comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    revalidatePath(currentPath || `/livescore/football/match/${comment.match_id}`);

    return { success: true };
  } catch (error) {
    console.error('댓글 삭제 중 오류:', error);
    return { success: false, error: '댓글 삭제 중 오류가 발생했습니다.' };
  }
}

// ????????? ????ャ렑??
export async function reportSupportComment(
  commentId: string,
  reason: string,
  description?: string
): Promise<ReportResponse> {
  try {
    const supabase = await getSupabaseAction();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const { data: existingReport } = await supabase
      .from('reports')
      .select('id')
      .eq('reporter_id', user.id)
      .eq('target_type', 'match_comment')
      .eq('target_id', commentId)
      .single();

    if (existingReport) {
      return { success: false, error: '신고 사유를 입력해주세요.' };
    }

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
      console.error('응원댓글 신고 오류:', error);
      return { success: false, error: '신고 처리 중 오류가 발생했습니다.' };
    }

    // ???援온??????볥궙?袁р뵾???? ???????醫딆┣???    revalidatePath('/admin/reports');
    
    return { success: true, data };
  } catch (error) {
    console.error('응원댓글 신고 중 오류:', error);
    return { success: false, error: '신고 처리 중 오류가 발생했습니다.' };
  }
} 
