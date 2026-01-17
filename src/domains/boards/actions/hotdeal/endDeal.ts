'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseAction } from '@/shared/lib/supabase/server';
import { logUserAction, logError } from '@/shared/actions/log-actions';

type EndReason = '품절' | '마감' | '가격변동' | '링크오류' | '기타';

interface EndDealParams {
  postId: string;
  reason: EndReason;
}

export async function endDeal(params: EndDealParams) {
  const { postId, reason } = params;

  try {
    const supabase = await getSupabaseAction();
    if (!supabase) {
      return { success: false, error: 'Supabase 클라이언트 초기화 오류' };
    }

    // 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: '로그인이 필요합니다' };
    }

    // 게시글 조회 (작성자 확인)
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('user_id, deal_info, board_id, board:boards(slug)')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return { success: false, error: '게시글을 찾을 수 없습니다' };
    }

    // 작성자 권한 확인
    if (post.user_id !== user.id) {
      return { success: false, error: '작성자만 종료 처리할 수 있습니다' };
    }

    // deal_info가 없으면 에러
    if (!post.deal_info) {
      return { success: false, error: '핫딜 정보가 없습니다' };
    }

    // deal_info 업데이트
    const updatedDealInfo = {
      ...post.deal_info,
      is_ended: true,
      ended_at: new Date().toISOString(),
      ended_reason: reason,
    };

    // DB 업데이트
    const { error: updateError } = await supabase
      .from('posts')
      .update({ deal_info: updatedDealInfo })
      .eq('id', postId);

    if (updateError) {
      await logError('HOTDEAL_END_ERROR', new Error(updateError.message), user.id, { postId, reason });
      return { success: false, error: `핫딜 종료 처리 실패: ${updateError.message}` };
    }

    // 로그 기록
    await logUserAction('HOTDEAL_END', `핫딜 종료: ${reason}`, user.id, { postId, reason });

    // 캐시 갱신
    const boardSlug = (post.board as any)?.slug;
    if (boardSlug) {
      revalidatePath(`/boards/${boardSlug}`);
    }
    revalidatePath('/boards');

    return { success: true };
  } catch (error) {
    console.error('[endDeal] 예외 발생:', error);
    return { success: false, error: error instanceof Error ? error.message : '핫딜 종료 처리 중 오류가 발생했습니다' };
  }
}
