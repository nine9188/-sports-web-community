'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { NoticeType } from '@/domains/boards/types/post';

interface SetNoticeResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * 관리자 권한 확인
 */
async function checkAdminPermission(): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();

    if (!supabase) {
      console.error('[checkAdminPermission] Supabase 클라이언트 생성 실패');
      return false;
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('[checkAdminPermission] 사용자 인증 오류:', userError);
      return false;
    }

    if (!user) {
      console.error('[checkAdminPermission] 로그인된 사용자 없음');
      return false;
    }

    console.log('[checkAdminPermission] 사용자 ID:', user.id);

    // 프로필에서 is_admin 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[checkAdminPermission] 프로필 조회 오류:', profileError);
      return false;
    }

    console.log('[checkAdminPermission] 프로필 is_admin:', profile?.is_admin);

    const isAdmin = profile?.is_admin === true;
    console.log('[checkAdminPermission] 관리자 권한:', isAdmin);

    return isAdmin;
  } catch (error) {
    console.error('[checkAdminPermission] 예외 발생:', error);
    return false;
  }
}

/**
 * 게시글을 공지로 설정
 * @param postId - 게시글 ID
 * @param noticeType - 공지 타입 ('global' | 'board')
 * @param boardIds - 공지를 표시할 게시판 ID 배열 (notice_type='board'일 때 필수, 다중 선택 가능)
 * @param noticeOrder - 공지 순서 (선택, 기본값 0)
 * @param isMustRead - 필독 여부 (선택, 기본값 false)
 */
export async function setPostAsNotice(
  postId: string,
  noticeType: NoticeType,
  boardIds?: string[],
  noticeOrder: number = 0,
  isMustRead: boolean = false
): Promise<SetNoticeResult> {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission();
    if (!isAdmin) {
      return {
        success: false,
        message: '관리자 권한이 필요합니다.',
        error: 'UNAUTHORIZED'
      };
    }

    // 게시판 공지인 경우 boardIds 필수
    if (noticeType === 'board' && (!boardIds || boardIds.length === 0)) {
      return {
        success: false,
        message: '게시판 공지는 최소 하나 이상의 게시판을 선택해야 합니다.',
        error: 'BOARD_IDS_REQUIRED'
      };
    }

    const supabase = await getSupabaseServer();

    if (!supabase) {
      return {
        success: false,
        message: 'Supabase 연결 실패',
        error: 'SUPABASE_ERROR'
      };
    }

    // 게시글 존재 확인
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('id, board_id')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      return {
        success: false,
        message: '게시글을 찾을 수 없습니다.',
        error: 'POST_NOT_FOUND'
      };
    }

    // 공지로 설정
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        is_notice: true,
        is_must_read: isMustRead,
        notice_type: noticeType,
        notice_boards: noticeType === 'board' ? boardIds : null,
        notice_order: noticeOrder
      })
      .eq('id', postId);

    if (updateError) {
      console.error('공지 설정 오류:', updateError);
      return {
        success: false,
        message: '공지 설정 중 오류가 발생했습니다.',
        error: 'UPDATE_ERROR'
      };
    }

    // 캐시 갱신
    revalidatePath('/boards/notices');
    if (post.board_id) {
      revalidatePath(`/boards/${post.board_id}`);
    }
    // 선택된 게시판들의 캐시도 갱신
    if (noticeType === 'board' && boardIds) {
      for (const boardId of boardIds) {
        revalidatePath(`/boards/${boardId}`);
      }
    }

    return {
      success: true,
      message: `${noticeType === 'global' ? '전체' : '게시판'} 공지로 설정되었습니다.${noticeType === 'board' && boardIds ? ` (${boardIds.length}개 게시판)` : ''}`
    };
  } catch (error) {
    console.error('공지 설정 중 오류:', error);
    return {
      success: false,
      message: '공지 설정 중 오류가 발생했습니다.',
      error: 'UNKNOWN_ERROR'
    };
  }
}

/**
 * 공지 해제
 * @param postId - 게시글 ID
 */
export async function removeNotice(postId: string): Promise<SetNoticeResult> {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission();
    if (!isAdmin) {
      return {
        success: false,
        message: '관리자 권한이 필요합니다.',
        error: 'UNAUTHORIZED'
      };
    }

    const supabase = await getSupabaseServer();

    if (!supabase) {
      return {
        success: false,
        message: 'Supabase 연결 실패',
        error: 'SUPABASE_ERROR'
      };
    }

    // 게시글 존재 확인
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('id, board_id')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      return {
        success: false,
        message: '게시글을 찾을 수 없습니다.',
        error: 'POST_NOT_FOUND'
      };
    }

    // 공지 해제
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        is_notice: false,
        is_must_read: false,
        notice_type: null,
        notice_boards: null,
        notice_order: 0
      })
      .eq('id', postId);

    if (updateError) {
      console.error('공지 해제 오류:', updateError);
      return {
        success: false,
        message: '공지 해제 중 오류가 발생했습니다.',
        error: 'UPDATE_ERROR'
      };
    }

    // 캐시 갱신
    revalidatePath('/boards/notices');
    if (post.board_id) {
      revalidatePath(`/boards/${post.board_id}`);
    }

    return {
      success: true,
      message: '공지가 해제되었습니다.'
    };
  } catch (error) {
    console.error('공지 해제 중 오류:', error);
    return {
      success: false,
      message: '공지 해제 중 오류가 발생했습니다.',
      error: 'UNKNOWN_ERROR'
    };
  }
}

/**
 * 공지 순서 변경
 * @param postId - 게시글 ID
 * @param newOrder - 새로운 순서
 */
export async function updateNoticeOrder(
  postId: string,
  newOrder: number
): Promise<SetNoticeResult> {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission();
    if (!isAdmin) {
      return {
        success: false,
        message: '관리자 권한이 필요합니다.',
        error: 'UNAUTHORIZED'
      };
    }

    const supabase = await getSupabaseServer();

    if (!supabase) {
      return {
        success: false,
        message: 'Supabase 연결 실패',
        error: 'SUPABASE_ERROR'
      };
    }

    // 게시글이 공지인지 확인
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('id, board_id, is_notice')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      return {
        success: false,
        message: '게시글을 찾을 수 없습니다.',
        error: 'POST_NOT_FOUND'
      };
    }

    if (!post.is_notice) {
      return {
        success: false,
        message: '공지사항이 아닙니다.',
        error: 'NOT_NOTICE'
      };
    }

    // 순서 업데이트
    const { error: updateError } = await supabase
      .from('posts')
      .update({ notice_order: newOrder })
      .eq('id', postId);

    if (updateError) {
      console.error('공지 순서 변경 오류:', updateError);
      return {
        success: false,
        message: '공지 순서 변경 중 오류가 발생했습니다.',
        error: 'UPDATE_ERROR'
      };
    }

    // 캐시 갱신
    revalidatePath('/boards/notices');
    if (post.board_id) {
      revalidatePath(`/boards/${post.board_id}`);
    }

    return {
      success: true,
      message: '공지 순서가 변경되었습니다.'
    };
  } catch (error) {
    console.error('공지 순서 변경 중 오류:', error);
    return {
      success: false,
      message: '공지 순서 변경 중 오류가 발생했습니다.',
      error: 'UNKNOWN_ERROR'
    };
  }
}

/**
 * 공지 타입 변경 (전체 공지 <-> 게시판 공지)
 * @param postId - 게시글 ID
 * @param newType - 새로운 공지 타입
 * @param boardIds - 게시판 공지로 변경 시 대상 게시판 ID 배열
 */
export async function updateNoticeType(
  postId: string,
  newType: NoticeType,
  boardIds?: string[]
): Promise<SetNoticeResult> {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission();
    if (!isAdmin) {
      return {
        success: false,
        message: '관리자 권한이 필요합니다.',
        error: 'UNAUTHORIZED'
      };
    }

    // 게시판 공지인 경우 boardIds 필수
    if (newType === 'board' && (!boardIds || boardIds.length === 0)) {
      return {
        success: false,
        message: '게시판 공지는 최소 하나 이상의 게시판을 선택해야 합니다.',
        error: 'BOARD_IDS_REQUIRED'
      };
    }

    const supabase = await getSupabaseServer();

    if (!supabase) {
      return {
        success: false,
        message: 'Supabase 연결 실패',
        error: 'SUPABASE_ERROR'
      };
    }

    // 게시글이 공지인지 확인
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('id, board_id, is_notice')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      return {
        success: false,
        message: '게시글을 찾을 수 없습니다.',
        error: 'POST_NOT_FOUND'
      };
    }

    if (!post.is_notice) {
      return {
        success: false,
        message: '공지사항이 아닙니다.',
        error: 'NOT_NOTICE'
      };
    }

    // 타입 업데이트
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        notice_type: newType,
        notice_boards: newType === 'board' ? boardIds : null
      })
      .eq('id', postId);

    if (updateError) {
      console.error('공지 타입 변경 오류:', updateError);
      return {
        success: false,
        message: '공지 타입 변경 중 오류가 발생했습니다.',
        error: 'UPDATE_ERROR'
      };
    }

    // 캐시 갱신
    revalidatePath('/boards/notices');
    if (post.board_id) {
      revalidatePath(`/boards/${post.board_id}`);
    }
    // 선택된 게시판들의 캐시도 갱신
    if (newType === 'board' && boardIds) {
      for (const boardId of boardIds) {
        revalidatePath(`/boards/${boardId}`);
      }
    }

    return {
      success: true,
      message: `${newType === 'global' ? '전체' : '게시판'} 공지로 변경되었습니다.${newType === 'board' && boardIds ? ` (${boardIds.length}개 게시판)` : ''}`
    };
  } catch (error) {
    console.error('공지 타입 변경 중 오류:', error);
    return {
      success: false,
      message: '공지 타입 변경 중 오류가 발생했습니다.',
      error: 'UNKNOWN_ERROR'
    };
  }
}

/**
 * 공지 대상 게시판 변경
 * @param postId - 게시글 ID
 * @param boardIds - 새로운 게시판 ID 배열
 */
export async function updateNoticeBoards(
  postId: string,
  boardIds: string[]
): Promise<SetNoticeResult> {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission();
    if (!isAdmin) {
      return {
        success: false,
        message: '관리자 권한이 필요합니다.',
        error: 'UNAUTHORIZED'
      };
    }

    if (!boardIds || boardIds.length === 0) {
      return {
        success: false,
        message: '최소 하나 이상의 게시판을 선택해야 합니다.',
        error: 'BOARD_IDS_REQUIRED'
      };
    }

    const supabase = await getSupabaseServer();

    if (!supabase) {
      return {
        success: false,
        message: 'Supabase 연결 실패',
        error: 'SUPABASE_ERROR'
      };
    }

    // 게시글이 게시판 공지인지 확인
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('id, board_id, is_notice, notice_type')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      return {
        success: false,
        message: '게시글을 찾을 수 없습니다.',
        error: 'POST_NOT_FOUND'
      };
    }

    if (!post.is_notice) {
      return {
        success: false,
        message: '공지사항이 아닙니다.',
        error: 'NOT_NOTICE'
      };
    }

    if (post.notice_type !== 'board') {
      return {
        success: false,
        message: '게시판 공지사항만 대상 게시판을 변경할 수 있습니다.',
        error: 'NOT_BOARD_NOTICE'
      };
    }

    // 대상 게시판 업데이트
    const { error: updateError } = await supabase
      .from('posts')
      .update({ notice_boards: boardIds })
      .eq('id', postId);

    if (updateError) {
      console.error('공지 대상 게시판 변경 오류:', updateError);
      return {
        success: false,
        message: '공지 대상 게시판 변경 중 오류가 발생했습니다.',
        error: 'UPDATE_ERROR'
      };
    }

    // 캐시 갱신
    revalidatePath('/boards/notices');
    if (post.board_id) {
      revalidatePath(`/boards/${post.board_id}`);
    }
    for (const boardId of boardIds) {
      revalidatePath(`/boards/${boardId}`);
    }

    return {
      success: true,
      message: `공지 대상 게시판이 변경되었습니다. (${boardIds.length}개 게시판)`
    };
  } catch (error) {
    console.error('공지 대상 게시판 변경 중 오류:', error);
    return {
      success: false,
      message: '공지 대상 게시판 변경 중 오류가 발생했습니다.',
      error: 'UNKNOWN_ERROR'
    };
  }
}
