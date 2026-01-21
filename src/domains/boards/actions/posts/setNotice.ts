'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { NoticeType } from '@/domains/boards/types/post';

interface SetNoticeResult {
  success: boolean;
  message: string;
  error?: string;
}

type PostData = { id: string; board_id: string | null; is_notice?: boolean; notice_type?: NoticeType | null };

const ERROR_MESSAGES = {
  UNAUTHORIZED: '관리자 권한이 필요합니다.',
  SUPABASE_ERROR: 'Supabase 연결 실패',
  POST_NOT_FOUND: '게시글을 찾을 수 없습니다.',
  NOT_NOTICE: '공지사항이 아닙니다.',
  NOT_BOARD_NOTICE: '게시판 공지사항만 대상 게시판을 변경할 수 있습니다.',
  BOARD_IDS_REQUIRED: '게시판 공지는 최소 하나 이상의 게시판을 선택해야 합니다.',
  UPDATE_ERROR: (action: string) => `${action} 중 오류가 발생했습니다.`,
  UNKNOWN_ERROR: (action: string) => `${action} 중 오류가 발생했습니다.`
} as const;

function createError(error: string, message: string): SetNoticeResult {
  return { success: false, message, error };
}

function createSuccess(message: string): SetNoticeResult {
  return { success: true, message };
}

/**
 * 관리자 권한 확인
 */
async function checkAdminPermission(): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();
    if (!supabase) return false;

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return false;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError) return false;
    return profile?.is_admin === true;
  } catch {
    return false;
  }
}

/**
 * 공지 작업 공통 유효성 검증
 */
async function validateNoticeAction(
  postId: string,
  selectFields: string = 'id, board_id'
): Promise<{ success: true; supabase: Awaited<ReturnType<typeof getSupabaseServer>>; post: PostData } | SetNoticeResult> {
  const isAdmin = await checkAdminPermission();
  if (!isAdmin) {
    return createError('UNAUTHORIZED', ERROR_MESSAGES.UNAUTHORIZED);
  }

  const supabase = await getSupabaseServer();
  if (!supabase) {
    return createError('SUPABASE_ERROR', ERROR_MESSAGES.SUPABASE_ERROR);
  }

  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select(selectFields)
    .eq('id', postId)
    .single();

  if (fetchError || !post) {
    return createError('POST_NOT_FOUND', ERROR_MESSAGES.POST_NOT_FOUND);
  }

  return { success: true, supabase, post: post as PostData };
}

/**
 * 캐시 갱신
 */
function revalidateNoticePaths(boardId: string | null, additionalBoardIds?: string[]): void {
  revalidatePath('/boards/notices');
  if (boardId) {
    revalidatePath(`/boards/${boardId}`);
  }
  if (additionalBoardIds) {
    for (const id of additionalBoardIds) {
      revalidatePath(`/boards/${id}`);
    }
  }
}

/**
 * 게시글을 공지로 설정
 */
export async function setPostAsNotice(
  postId: string,
  noticeType: NoticeType,
  boardIds?: string[],
  noticeOrder: number = 0,
  isMustRead: boolean = false
): Promise<SetNoticeResult> {
  try {
    if (noticeType === 'board' && (!boardIds || boardIds.length === 0)) {
      return createError('BOARD_IDS_REQUIRED', ERROR_MESSAGES.BOARD_IDS_REQUIRED);
    }

    const validation = await validateNoticeAction(postId);
    if (!('supabase' in validation)) return validation;

    const { supabase, post } = validation;

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
      return createError('UPDATE_ERROR', ERROR_MESSAGES.UPDATE_ERROR('공지 설정'));
    }

    revalidateNoticePaths(post.board_id, noticeType === 'board' ? boardIds : undefined);

    const boardCountText = noticeType === 'board' && boardIds ? ` (${boardIds.length}개 게시판)` : '';
    return createSuccess(`${noticeType === 'global' ? '전체' : '게시판'} 공지로 설정되었습니다.${boardCountText}`);
  } catch (error) {
    console.error('공지 설정 중 오류:', error);
    return createError('UNKNOWN_ERROR', ERROR_MESSAGES.UNKNOWN_ERROR('공지 설정'));
  }
}

/**
 * 공지 해제
 */
export async function removeNotice(postId: string): Promise<SetNoticeResult> {
  try {
    const validation = await validateNoticeAction(postId);
    if (!('supabase' in validation)) return validation;

    const { supabase, post } = validation;

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
      return createError('UPDATE_ERROR', ERROR_MESSAGES.UPDATE_ERROR('공지 해제'));
    }

    revalidateNoticePaths(post.board_id);
    return createSuccess('공지가 해제되었습니다.');
  } catch (error) {
    console.error('공지 해제 중 오류:', error);
    return createError('UNKNOWN_ERROR', ERROR_MESSAGES.UNKNOWN_ERROR('공지 해제'));
  }
}

/**
 * 공지 순서 변경
 */
export async function updateNoticeOrder(postId: string, newOrder: number): Promise<SetNoticeResult> {
  try {
    const validation = await validateNoticeAction(postId, 'id, board_id, is_notice');
    if (!('supabase' in validation)) return validation;

    const { supabase, post } = validation;

    if (!post.is_notice) {
      return createError('NOT_NOTICE', ERROR_MESSAGES.NOT_NOTICE);
    }

    const { error: updateError } = await supabase
      .from('posts')
      .update({ notice_order: newOrder })
      .eq('id', postId);

    if (updateError) {
      console.error('공지 순서 변경 오류:', updateError);
      return createError('UPDATE_ERROR', ERROR_MESSAGES.UPDATE_ERROR('공지 순서 변경'));
    }

    revalidateNoticePaths(post.board_id);
    return createSuccess('공지 순서가 변경되었습니다.');
  } catch (error) {
    console.error('공지 순서 변경 중 오류:', error);
    return createError('UNKNOWN_ERROR', ERROR_MESSAGES.UNKNOWN_ERROR('공지 순서 변경'));
  }
}

/**
 * 공지 타입 변경 (전체 공지 <-> 게시판 공지)
 */
export async function updateNoticeType(
  postId: string,
  newType: NoticeType,
  boardIds?: string[]
): Promise<SetNoticeResult> {
  try {
    if (newType === 'board' && (!boardIds || boardIds.length === 0)) {
      return createError('BOARD_IDS_REQUIRED', ERROR_MESSAGES.BOARD_IDS_REQUIRED);
    }

    const validation = await validateNoticeAction(postId, 'id, board_id, is_notice');
    if (!('supabase' in validation)) return validation;

    const { supabase, post } = validation;

    if (!post.is_notice) {
      return createError('NOT_NOTICE', ERROR_MESSAGES.NOT_NOTICE);
    }

    const { error: updateError } = await supabase
      .from('posts')
      .update({
        notice_type: newType,
        notice_boards: newType === 'board' ? boardIds : null
      })
      .eq('id', postId);

    if (updateError) {
      console.error('공지 타입 변경 오류:', updateError);
      return createError('UPDATE_ERROR', ERROR_MESSAGES.UPDATE_ERROR('공지 타입 변경'));
    }

    revalidateNoticePaths(post.board_id, newType === 'board' ? boardIds : undefined);

    const boardCountText = newType === 'board' && boardIds ? ` (${boardIds.length}개 게시판)` : '';
    return createSuccess(`${newType === 'global' ? '전체' : '게시판'} 공지로 변경되었습니다.${boardCountText}`);
  } catch (error) {
    console.error('공지 타입 변경 중 오류:', error);
    return createError('UNKNOWN_ERROR', ERROR_MESSAGES.UNKNOWN_ERROR('공지 타입 변경'));
  }
}

/**
 * 공지 대상 게시판 변경
 */
/**
 * 게시글 번호로 게시글 ID 조회
 */
export async function getPostIdByNumber(postNumber: number): Promise<{ success: true; postId: string } | { success: false; error: string }> {
  try {
    const isAdmin = await checkAdminPermission();
    if (!isAdmin) {
      return { success: false, error: ERROR_MESSAGES.UNAUTHORIZED };
    }

    const supabase = await getSupabaseServer();
    if (!supabase) {
      return { success: false, error: ERROR_MESSAGES.SUPABASE_ERROR };
    }

    const { data, error } = await supabase
      .from('posts')
      .select('id')
      .eq('post_number', postNumber)
      .single();

    if (error || !data) {
      return { success: false, error: `게시글 번호 "${postNumber}"를 찾을 수 없습니다.` };
    }

    return { success: true, postId: data.id };
  } catch (error) {
    console.error('게시글 조회 오류:', error);
    return { success: false, error: '게시글 조회 중 오류가 발생했습니다.' };
  }
}

export async function updateNoticeBoards(postId: string, boardIds: string[]): Promise<SetNoticeResult> {
  try {
    if (!boardIds || boardIds.length === 0) {
      return createError('BOARD_IDS_REQUIRED', '최소 하나 이상의 게시판을 선택해야 합니다.');
    }

    const validation = await validateNoticeAction(postId, 'id, board_id, is_notice, notice_type');
    if (!('supabase' in validation)) return validation;

    const { supabase, post } = validation;

    if (!post.is_notice) {
      return createError('NOT_NOTICE', ERROR_MESSAGES.NOT_NOTICE);
    }

    if (post.notice_type !== 'board') {
      return createError('NOT_BOARD_NOTICE', ERROR_MESSAGES.NOT_BOARD_NOTICE);
    }

    const { error: updateError } = await supabase
      .from('posts')
      .update({ notice_boards: boardIds })
      .eq('id', postId);

    if (updateError) {
      console.error('공지 대상 게시판 변경 오류:', updateError);
      return createError('UPDATE_ERROR', ERROR_MESSAGES.UPDATE_ERROR('공지 대상 게시판 변경'));
    }

    revalidateNoticePaths(post.board_id, boardIds);
    return createSuccess(`공지 대상 게시판이 변경되었습니다. (${boardIds.length}개 게시판)`);
  } catch (error) {
    console.error('공지 대상 게시판 변경 중 오류:', error);
    return createError('UNKNOWN_ERROR', ERROR_MESSAGES.UNKNOWN_ERROR('공지 대상 게시판 변경'));
  }
}
