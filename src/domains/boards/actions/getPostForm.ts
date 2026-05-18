'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { getCachedAllBoards } from './getCachedBoards';
import type { Board } from '@/domains/boards/types/board';
import { calculateBoardViewerPermissions } from './permissions';

type ViewerProfile = {
  id?: string;
  is_admin?: boolean | null;
  is_suspended?: boolean | null;
  suspended_until?: string | null;
};

export async function getPostEditData(slug: string, postNumber: string) {
  try {
    const supabase = await getSupabaseServer();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) {
      return {
        success: false,
        redirectToLogin: true,
      };
    }

    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('*')
      .eq('slug', slug)
      .single();

    if (boardError || !board) {
      return {
        success: false,
        error: '게시판을 찾을 수 없습니다.',
      };
    }

    const { data: postRaw, error: postError } = await supabase
      .from('posts')
      .select('id, title, user_id, board_id, post_number, views, likes, dislikes, tags, category, status, created_at, updated_at, source_url, meta, is_hidden, is_deleted, is_notice, notice_type, notice_order, notice_created_at, notice_boards, is_must_read, deal_info, show_in_widget, thumbnail_url, summary, profiles(nickname), board:board_id(name)')
      .eq('board_id', board.id)
      .eq('post_number', parseInt(postNumber, 10))
      .single();

    if (postError || !postRaw) {
      return {
        success: false,
        error: '게시글을 찾을 수 없습니다.',
      };
    }

    if (postRaw.user_id !== userId) {
      return {
        success: false,
        redirectToPost: true,
      };
    }

    const { data: contentRow } = await supabase
      .from('posts_content')
      .select('content')
      .eq('post_id', postRaw.id)
      .maybeSingle();

    return {
      success: true,
      post: {
        ...postRaw,
        content: contentRow?.content ?? null,
      },
      board,
    };
  } catch (error) {
    console.error('게시글 수정 데이터 로드 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '게시글 정보를 불러오는 중 오류가 발생했습니다.',
    };
  }
}

export async function getCreatePostData(slug: string, viewerProfile?: ViewerProfile | null) {
  if (!slug) {
    return {
      success: false,
      error: '게시판 정보가 올바르지 않습니다.',
    };
  }

  try {
    const allBoards = (await getCachedAllBoards()) as Board[];
    const board = allBoards.find((item) => item.slug === slug || item.id === slug);

    if (!board) {
      return {
        success: false,
        error: '게시판을 찾을 수 없습니다.',
      };
    }

    const permissions = calculateBoardViewerPermissions(board, viewerProfile ?? null);

    if (!permissions.canWrite) {
      return {
        success: false,
        error: '이 게시판에 글을 작성할 권한이 없습니다.',
      };
    }

    const writableBoards = permissions.isAdmin
      ? allBoards
      : allBoards.filter((item) => item.slug !== 'notice' && item.slug !== 'notices');

    return {
      success: true,
      board,
      allBoards: writableBoards,
    };
  } catch (error) {
    console.error('게시글 작성 데이터 로드 오류:', error instanceof Error ? error.message : String(error));
    return {
      success: false,
      error: error instanceof Error ? error.message : '게시판 정보를 불러오는 중 오류가 발생했습니다.',
    };
  }
}
