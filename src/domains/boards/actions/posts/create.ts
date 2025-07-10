'use server';

import { revalidatePath } from 'next/cache';
// import { rewardUserActivity, getActivityTypeValues } from '@/shared/actions/activity-actions';
import { checkSuspensionGuard } from '@/shared/utils/suspension-guard';
import { logUserAction, logError } from '@/shared/actions/log-actions';
import { createServerActionClient } from '@/shared/api/supabaseServer';
import { processMatchCardsInContent, PostActionResponse } from './utils';

/**
 * 게시글 생성 서버 액션 (매개변수 사용)
 */
export async function createPostWithParams(
  title: string,
  content: string,
  boardId: string,
  userId: string
): Promise<PostActionResponse> {
  if (!title || !content || !boardId || !userId) {
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
        error: suspensionCheck.message || '계정이 정지되어 게시글을 작성할 수 없습니다.'
      };
    }
    
    const supabase = await createServerActionClient();
    
    if (!supabase) {
      return {
        success: false,
        error: 'Supabase 클라이언트 초기화 오류'
      };
    }
    
    // 게시판 정보 가져오기
    const { data: boardData, error: boardQueryError } = await supabase
      .from('boards')
      .select('name, slug')
      .eq('id', boardId)
      .single();
    
    if (boardQueryError) {
      return {
        success: false,
        error: `게시판 정보 조회 실패: ${boardQueryError.message}`
      };
    }
    
    if (!boardData) {
      return {
        success: false,
        error: '게시판 정보를 찾을 수 없습니다.'
      };
    }
    
    // 게시글 생성
    // 트리거 함수가 post_number를 할당 후에 전체 레코드를 반환하게 하여
    // 추가 쿼리 없이 post_number를 바로 얻을 수 있게 함
    const { data, error } = await supabase
      .from('posts')
      .insert({
        title: title.trim(),
        content,
        user_id: userId,
        board_id: boardId,
        category: boardData.name || '',
        views: 0,
        likes: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'published'
      })
      .select('id, post_number')
      .single();
    
    if (error) {
      return {
        success: false,
        error: `게시글 생성 실패: ${error.message}`
      };
    }
    
    if (!data) {
      return {
        success: false,
        error: '게시글 생성은 되었으나 데이터를 받아오지 못했습니다.'
      };
    }
    
    // 게시글 생성 성공 로그 기록
    try {
      await logUserAction(
        'POST_CREATE',
        `게시글 생성: ${title} (게시판: ${boardData.name})`,
        userId,
        {
          postId: data.id,
          postNumber: data.post_number,
          boardId,
          boardName: boardData.name,
          boardSlug: boardData.slug,
          title
        }
      );
    } catch (logError) {
      console.error('게시글 생성 로그 기록 실패:', logError);
    }

    return {
      success: true,
      postId: data.id,
      postNumber: data.post_number,
      boardSlug: boardData.slug || undefined
    };
  } catch (error) {
    console.error('[서버] 게시글 생성 예외 발생:', error);
    
    // 게시글 생성 에러 로그 기록
    const err = error instanceof Error ? error : new Error(String(error));
    await logError(
      'POST_CREATE_ERROR',
      err,
      userId,
      { boardId, title }
    );
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '게시글 생성 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 게시글 생성 (FormData 사용)
 */
export async function createPost(formData: FormData) {
  try {
    const supabase = await createServerActionClient()
    
    // 폼 데이터에서 값 추출
    const title = formData.get('title') as string
    let content = formData.get('content') as string
    const boardId = formData.get('boardId') as string
    
    if (!title || !content || !boardId) {
      return { error: '필수 입력값이 누락되었습니다' }
    }
    
    // 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      return { error: '인증 오류가 발생했습니다' }
    }
    
    if (!user) {
      return { error: '로그인이 필요합니다' }
    }
    
    // 계정 정지 상태 확인
    const suspensionCheck = await checkSuspensionGuard(user.id);
    if (suspensionCheck.isSuspended) {
      return { error: suspensionCheck.message || '계정이 정지되어 게시글을 작성할 수 없습니다.' };
    }
    
    // 경기 카드 데이터를 완전한 HTML로 변환
    content = processMatchCardsInContent(content);
    
    // 게시글 작성
    const { data, error } = await supabase
      .from('posts')
      .insert({
        title,
        content: typeof content === 'string' && content.startsWith('{') 
          ? JSON.parse(content) 
          : content,
        user_id: user.id,
        board_id: boardId
      })
      .select(`
        *,
        board:boards(
          id,
          name,
          slug
        )
      `)
      .single()
    
    if (error) {
      // 게시글 작성 에러 로그 기록
      try {
        await logError(
          'POST_CREATE_ERROR',
          new Error(`게시글 작성 실패: ${error.message}`),
          user.id,
          { boardId, title }
        );
      } catch (logErr) {
        console.error('에러 로그 기록 실패:', logErr);
      }
      
      return { error: `게시글 작성 실패: ${error.message}` }
    }
    
    // 게시글 생성 성공 로그 기록
    try {
      await logUserAction(
        'POST_CREATE',
        `게시글 생성: ${title} (게시판: ${data.board?.name || '알 수 없음'})`,
        user.id,
        {
          postId: data.id,
          postNumber: data.post_number,
          boardId,
          boardName: data.board?.name,
          boardSlug: data.board?.slug,
          title
        }
      );
    } catch (logError) {
      console.error('게시글 생성 로그 기록 실패:', logError);
    }
    
    // 캐시 갱신
    revalidatePath(`/boards/${boardId}`)
    
    return { success: true, post: data }
  } catch (error) {
    console.error('게시글 작성 오류:', error)
    return { error: '게시글 작성 중 오류가 발생했습니다' }
  }
} 