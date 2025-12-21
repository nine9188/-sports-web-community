'use server';

import { revalidatePath } from 'next/cache';
import { rewardUserActivity, getActivityTypeValues } from '@/shared/actions/activity-actions';
import { checkSuspensionGuard } from '@/shared/utils/suspension-guard';
import { logUserAction, logError } from '@/shared/actions/log-actions';
import { getSupabaseAction } from '@/shared/lib/supabase/server';
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
    
    const supabase = await getSupabaseAction();
    
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
export async function createPost(formData: FormData): Promise<{ success: true; post: any } | { success: false; error: string }> {
  console.log('[createPost] 서버 액션 시작');
  
  try {
    console.log('[createPost] Supabase 클라이언트 생성 시작');
    const supabase = await getSupabaseAction()
    
    if (!supabase) {
      console.error('[createPost] Supabase 클라이언트 초기화 실패');
      return { 
        success: false, 
        error: 'Supabase 클라이언트 초기화 오류' 
      };
    }
    console.log('[createPost] Supabase 클라이언트 생성 성공');
    
    // 폼 데이터에서 값 추출
    const title = formData.get('title') as string
    let content = formData.get('content') as string
    const boardId = formData.get('boardId') as string

    // 공지 정보 추출 (관리자가 설정한 경우)
    const isNotice = formData.get('isNotice') === 'true'
    const noticeType = formData.get('noticeType') as 'global' | 'board' | null
    const noticeBoardsStr = formData.get('noticeBoards') as string | null
    const noticeOrder = formData.get('noticeOrder') as string | null

    console.log('[createPost] FormData 추출:', {
      title: title?.substring(0, 20),
      contentLength: content?.length,
      boardId,
      isNotice,
      noticeType,
      noticeOrder
    });
    
    if (!title || !content || !boardId) {
      console.error('[createPost] 필수 입력값 누락:', { hasTitle: !!title, hasContent: !!content, hasBoardId: !!boardId });
      return { 
        success: false, 
        error: '필수 입력값이 누락되었습니다' 
      };
    }
    
    // 현재 사용자 확인
    console.log('[createPost] 사용자 인증 확인 시작');
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('[createPost] 사용자 인증 오류:', userError);
      return { 
        success: false, 
        error: '인증 오류가 발생했습니다' 
      };
    }
    
    if (!user) {
      console.error('[createPost] 사용자 없음');
      return { 
        success: false, 
        error: '로그인이 필요합니다' 
      };
    }
    console.log('[createPost] 사용자 인증 성공:', { userId: user.id });
    
    // 계정 정지 상태 확인
    console.log('[createPost] 계정 정지 상태 확인 시작');
    const suspensionCheck = await checkSuspensionGuard(user.id);
    if (suspensionCheck.isSuspended) {
      console.error('[createPost] 계정 정지됨:', suspensionCheck.message);
      return { 
        success: false, 
        error: suspensionCheck.message || '계정이 정지되어 게시글을 작성할 수 없습니다.' 
      };
    }
    console.log('[createPost] 계정 정지 상태 확인 통과');
    
    // 게시판 정보 가져오기 (slug를 위해 필요)
    console.log('[createPost] 게시판 정보 조회 시작:', { boardId });
    const { data: boardData, error: boardError } = await supabase
      .from('boards')
      .select('id, name, slug')
      .eq('id', boardId)
      .single();
    
    if (boardError || !boardData) {
      console.error('[createPost] 게시판 정보 조회 실패:', { boardError, hasBoardData: !!boardData });
      return {
        success: false,
        error: '게시판 정보를 찾을 수 없습니다.'
      };
    }
    console.log('[createPost] 게시판 정보 조회 성공:', { boardName: boardData.name, boardSlug: boardData.slug });
    
    // 경기 카드 데이터를 완전한 HTML로 변환
    console.log('[createPost] 경기 카드 처리 시작');
    content = processMatchCardsInContent(content);
    console.log('[createPost] 경기 카드 처리 완료, contentLength:', content.length);
    
    // 게시글 작성
    console.log('[createPost] 게시글 INSERT 시작');

    // 공지 데이터 준비
    const insertData: any = {
      title: title.trim(),
      content: typeof content === 'string' && content.startsWith('{')
        ? JSON.parse(content)
        : content,
      user_id: user.id,
      board_id: boardId
    };

    // 공지 정보 추가 (관리자가 공지로 설정한 경우)
    if (isNotice) {
      insertData.is_notice = true;
      insertData.notice_type = noticeType || 'global';
      insertData.notice_order = noticeOrder ? parseInt(noticeOrder, 10) : 0;
      insertData.notice_created_at = new Date().toISOString();

      // 게시판 공지인 경우 notice_boards 배열 추가
      if (noticeType === 'board' && noticeBoardsStr) {
        try {
          const noticeBoards = JSON.parse(noticeBoardsStr);
          insertData.notice_boards = noticeBoards;
        } catch (err) {
          console.error('[createPost] notice_boards 파싱 오류:', err);
        }
      }
    }

    const { data, error } = await supabase
      .from('posts')
      .insert(insertData)
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
      console.error('[createPost] 게시글 INSERT 실패:', error);
      // 게시글 작성 에러 로그 기록
      try {
        await logError(
          'POST_CREATE_ERROR',
          new Error(`게시글 작성 실패: ${error.message}`),
          user.id,
          { boardId, title }
        );
      } catch (logErr) {
        console.error('[createPost] 에러 로그 기록 실패:', logErr);
      }
      
      return { 
        success: false, 
        error: `게시글 작성 실패: ${error.message}` 
      };
    }
    
    if (!data) {
      console.error('[createPost] 게시글 데이터 없음');
      return {
        success: false,
        error: '게시글 생성은 되었으나 데이터를 받아오지 못했습니다.'
      };
    }
    
    console.log('[createPost] 게시글 INSERT 성공:', { 
      postId: data.id, 
      postNumber: data.post_number,
      boardSlug: data.board?.slug 
    });
    
    // 게시글 생성 성공 로그 기록
    try {
      console.log('[createPost] 활동 로그 기록 시작');
      await logUserAction(
        'POST_CREATE',
        `게시글 생성: ${title} (게시판: ${boardData.name})`,
        user.id,
        {
          postId: data.id,
          postNumber: data.post_number,
          boardId,
          boardName: boardData.name,
          boardSlug: boardData.slug,
          title
        }
      );
      console.log('[createPost] 활동 로그 기록 성공');
    } catch (logError) {
      console.error('[createPost] 게시글 생성 로그 기록 실패:', logError);
    }

    // 활동 보상 지급 (서버에서 처리)
    try {
      console.log('[createPost] 활동 보상 지급 시작');
      const activityTypes = await getActivityTypeValues();
      await rewardUserActivity(user.id, activityTypes.POST_CREATION, data.id);
      console.log('[createPost] 활동 보상 지급 성공');
    } catch (rewardError) {
      console.error('[createPost] 활동 보상 지급 실패:', rewardError);
      // 보상 지급 실패는 게시글 작성 성공에 영향을 주지 않음
    }

    // 캐시 갱신 - 게시판 목록과 게시판 상세 페이지 모두 갱신
    const boardSlug = boardData.slug || boardId;
    console.log('[createPost] 캐시 갱신 시작:', { boardSlug });
    revalidatePath(`/boards/${boardSlug}`);
    revalidatePath('/boards');
    console.log('[createPost] 캐시 갱신 완료');

    console.log('[createPost] 서버 액션 성공 완료');
    return { success: true, post: data };
  } catch (error) {
    console.error('[createPost] 예외 발생:', error);
    
    // 예외 발생 시 에러 로그 기록 시도
    try {
      const formDataTitle = formData.get('title') as string;
      const formDataBoardId = formData.get('boardId') as string;
      const tempSupabase = await getSupabaseAction();
      
      if (tempSupabase) {
        const { data: { user } } = await tempSupabase.auth.getUser();
        
        if (user) {
          await logError(
            'POST_CREATE_ERROR',
            error instanceof Error ? error : new Error(String(error)),
            user.id,
            { boardId: formDataBoardId, title: formDataTitle }
          );
        }
      }
    } catch (logErr) {
      console.error('[createPost] 에러 로그 기록 실패:', logErr);
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '게시글 작성 중 오류가 발생했습니다' 
    };
  }
} 