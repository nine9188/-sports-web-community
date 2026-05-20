'use server';

import { logUserAction } from '@/shared/actions/log-actions';
import { getSupabaseAction } from '@/shared/lib/supabase/server';
import { revalidateTag } from 'next/cache';
import { PostActionResponse } from './utils';
import { oneOrNull } from '@/shared/utils/supabaseRelations';

/**
 * 게시글 삭제 서버 액션
 */
export async function deletePost(
  postId: string,
  userId: string
): Promise<PostActionResponse> {
  if (!postId || !userId) {
    return { success: false, error: '필수 입력값이 누락되었습니다.' };
  }

  try {
    const supabase = await getSupabaseAction();
    if (!supabase) {
      return { success: false, error: 'Supabase 클라이언트 초기화 오류' };
    }

    // 게시글 존재 + 작성자 확인 (boards JOIN으로 slug도 함께 조회)
    const { data: existingPost, error: existingPostError } = await supabase
      .from('posts')
      .select('user_id, board_id, post_number, boards(slug)')
      .eq('id', postId)
      .single();

    if (existingPostError || !existingPost) {
      return { success: false, error: '해당 게시글이 존재하지 않습니다.' };
    }

    if (existingPost.user_id !== userId) {
      return { success: false, error: '본인이 작성한 게시글만 삭제할 수 있습니다.' };
    }

    const boardSlug = oneOrNull(existingPost.boards)?.slug || undefined;

    // 관련 데이터 병렬 삭제 (댓글 + 좋아요 + posts_content + card_links)
    const supabaseAny = supabase as unknown as {
      from: (table: string) => {
        delete: () => { eq: (col: string, val: string) => Promise<{ error: { message: string } | null }> };
      };
    };

    const [commentsResult, likesResult] = await Promise.all([
      supabase.from('comments').delete().eq('post_id', postId),
      supabase.from('post_likes').delete().eq('post_id', postId),
      supabaseAny.from('posts_content').delete().eq('post_id', postId),
      supabaseAny.from('post_card_links').delete().eq('post_id', postId),
    ]);

    if (commentsResult.error) {
      return { success: false, error: `댓글 삭제 실패: ${commentsResult.error.message}` };
    }
    if (likesResult.error) {
      return { success: false, error: `좋아요 삭제 실패: ${likesResult.error.message}` };
    }

    // 게시글 삭제
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (deleteError) {
      return { success: false, error: `게시글 삭제 실패: ${deleteError.message}` };
    }

    // 캐시 무효화 (게시판 목록 + 유저 통계만, 삭제된 게시글 페이지는 무효화 안 함)
    revalidateTag(`user-stats-${userId}`, 'default');

    // 로그 기록 (fire-and-forget)
    logUserAction('POST_DELETE', `게시글 삭제 (ID: ${postId})`, userId, {
      postId, boardId: existingPost.board_id, boardSlug
    }).catch(() => {});

    return { success: true, boardSlug };
  } catch (error) {
    console.error('[서버] 게시글 삭제 예외 발생:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '게시글 삭제 중 오류가 발생했습니다.'
    };
  }
}
