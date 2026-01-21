'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface Board {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  access_level: string;
  parent_id: string | null;
  views?: number;
  display_order: number;
  team_id?: number | null;
  view_type?: 'list' | 'image-table' | null;
  level?: number;
  children?: Board[];
}

interface BoardFormData {
  name: string;
  slug: string;
  description: string;
  access_level: string;
  parent_id: string | null;
  display_order: number;
  team_id: number | null;
  view_type: 'list' | 'image-table';
}

export async function getAllBoards() {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    const boards: Board[] = (data || []).map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      access_level: item.access_level || 'public',
      parent_id: item.parent_id,
      views: item.views,
      display_order: item.display_order || 0,
      team_id: item.team_id,
      view_type: (item.view_type as 'list' | 'image-table' | null) ?? 'list',
    }));

    return { success: true, data: boards };
  } catch (error) {
    console.error('게시판 목록 조회 오류:', error);
    return { success: false, error: '게시판 목록을 불러오는데 실패했습니다.' };
  }
}

export async function createBoard(formData: BoardFormData) {
  try {
    const supabase = await getSupabaseServer();

    const boardData = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description || null,
      access_level: formData.access_level,
      parent_id: formData.parent_id || null,
      display_order: formData.display_order,
      team_id: formData.team_id,
      view_type: formData.view_type,
    };

    const { error } = await supabase.from('boards').insert([boardData]);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/boards');
    return { success: true };
  } catch (error) {
    console.error('게시판 추가 오류:', error);
    return { success: false, error: '게시판 추가 중 오류가 발생했습니다.' };
  }
}

export async function updateBoard(id: string, formData: BoardFormData) {
  try {
    const supabase = await getSupabaseServer();

    const boardData = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description || null,
      access_level: formData.access_level,
      parent_id: formData.parent_id || null,
      display_order: formData.display_order,
      team_id: formData.team_id,
      view_type: formData.view_type,
    };

    const { error } = await supabase.from('boards').update(boardData).eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/boards');
    return { success: true };
  } catch (error) {
    console.error('게시판 수정 오류:', error);
    return { success: false, error: '게시판 수정 중 오류가 발생했습니다.' };
  }
}

export async function deleteBoard(id: string) {
  try {
    const supabase = await getSupabaseServer();

    // 게시판의 게시글 삭제
    const { error: postsError } = await supabase.from('posts').delete().eq('board_id', id);

    if (postsError) {
      return { success: false, error: postsError.message };
    }

    // 게시판 삭제
    const { error: boardError } = await supabase.from('boards').delete().eq('id', id);

    if (boardError) {
      return { success: false, error: boardError.message };
    }

    revalidatePath('/admin/boards');
    return { success: true };
  } catch (error) {
    console.error('게시판 삭제 오류:', error);
    return { success: false, error: '게시판 삭제 중 오류가 발생했습니다.' };
  }
}

export async function swapBoardOrder(boardId: string, targetId: string, boardOrder: number, targetOrder: number) {
  try {
    const supabase = await getSupabaseServer();

    const { error: error1 } = await supabase
      .from('boards')
      .update({ display_order: targetOrder })
      .eq('id', boardId);

    if (error1) {
      return { success: false, error: error1.message };
    }

    const { error: error2 } = await supabase
      .from('boards')
      .update({ display_order: boardOrder })
      .eq('id', targetId);

    if (error2) {
      return { success: false, error: error2.message };
    }

    revalidatePath('/admin/boards');
    return { success: true };
  } catch (error) {
    console.error('순서 변경 오류:', error);
    return { success: false, error: '순서 변경에 실패했습니다.' };
  }
}
