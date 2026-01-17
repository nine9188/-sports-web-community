'use server';

import { checkSuspensionGuard } from '@/shared/utils/suspension-guard';
import { logUserAction } from '@/shared/actions/log-actions';
import { getSupabaseAction } from '@/shared/lib/supabase/server';
import type { PostActionResponse } from './utils';
import type { DealInfo } from '../../types/hotdeal';

/**
 * 게시글 수정 서버 액션
 */
export async function updatePost(
  postId: string,
  title: string,
  content: string,
  userId: string,
  dealInfo?: DealInfo | null
): Promise<PostActionResponse> {
  if (!postId || !title || !content || !userId) {
    return {
      success: false,
      error: '필수 입력값이 누락되었습니다.'
    };
  }
  
  try {
    // 계정 정지 상태 확인
    const suspensionCheck = await checkSuspensionGuard(userId);
    if (suspensionCheck.isSuspended) {
      return {
        success: false,
        error: suspensionCheck.message || '계정이 정지되어 게시글을 수정할 수 없습니다.'
      };
    }
    
    const supabase = await getSupabaseAction();
    
    if (!supabase) {
      return {
        success: false,
        error: 'Supabase 클라이언트 초기화 오류'
      };
    }
    
    // 게시글이 존재하는지 확인 & 작성자 일치 확인
    const { data: existingPost, error: existingPostError } = await supabase
      .from('posts')
      .select('user_id, board_id')
      .eq('id', postId)
      .single();
      
    if (existingPostError) {
      return {
        success: false,
        error: `게시글을 찾을 수 없습니다: ${existingPostError.message}`
      };
    }
    
    if (!existingPost) {
      return {
        success: false,
        error: '해당 게시글이 존재하지 않습니다.'
      };
    }
    
    if (existingPost.user_id !== userId) {
      return {
        success: false,
        error: '본인이 작성한 게시글만 수정할 수 있습니다.'
      };
    }
    
    // 매치카드는 TipTap JSON 그대로 저장 (HTML 변환 없음)
    // PostContent.tsx에서 matchCard 노드 감지하여 렌더링

    // 게시글 업데이트 쿼리
    const updateData: {
      title: string;
      content: string;
      updated_at: string;
      deal_info?: DealInfo | null;
    } = {
      title: title.trim(),
      content: content,
      updated_at: new Date().toISOString()
    };

    // 핫딜 정보가 제공된 경우 추가
    if (dealInfo !== undefined) {
      updateData.deal_info = dealInfo;
    }

    const { error: updateError } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', postId);
    
    if (updateError) {
      return {
        success: false,
        error: `게시글 수정 실패: ${updateError.message}`
      };
    }
    
    // 수정된 게시글 정보 가져오기
    const { data: postData, error: postDataError } = await supabase
      .from('posts')
      .select('post_number, board_id, boards(slug)')
      .eq('id', postId)
      .single();
    
    if (postDataError) {
      return {
        success: false,
        error: `게시글 정보 가져오기 실패: ${postDataError.message}`
      };
    }
    
    const boardSlug = (postData.boards as { slug: string } | null)?.slug;
    
    // 게시글 수정 성공 로그 기록
    await logUserAction(
      'POST_UPDATE',
      `게시글 수정: ${title}`,
      userId,
      {
        postId,
        postNumber: postData.post_number,
        boardId: postData.board_id,
        boardSlug,
        title
      }
    );
    
    return {
      success: true,
      postId,
      postNumber: postData.post_number,
      boardSlug
    };
  } catch (error) {
    console.error('[서버] 게시글 수정 예외 발생:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '게시글 수정 중 오류가 발생했습니다.'
    };
  }
} 