'use server';

import { createClient } from '@/shared/api/supabaseServer';
import { revalidatePath } from 'next/cache';

export interface BoardCollectionSetting {
  id: string;
  board_id: string;
  display_order: number;
  is_active: boolean;
  board?: {
    id: string;
    name: string;
    slug: string;
  };
}

// 게시판 모음 위젯 설정 조회
export async function getBoardCollectionSettings(): Promise<BoardCollectionSetting[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('board_collection_widget_settings')
      .select(`
        id,
        board_id,
        display_order,
        is_active,
        boards (
          id,
          name,
          slug
        )
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('게시판 모음 위젯 설정 조회 오류:', error);
      return [];
    }

    return data as BoardCollectionSetting[];
  } catch (error) {
    console.error('게시판 모음 위젯 설정 조회 오류:', error);
    return [];
  }
}

// 게시판 모음 위젯 설정 저장
export async function saveBoardCollectionSettings(
  settings: { board_id: string; display_order: number }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // 기존 설정 모두 삭제
    await supabase
      .from('board_collection_widget_settings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 모두 삭제

    // 새 설정 삽입
    const { error } = await supabase
      .from('board_collection_widget_settings')
      .insert(
        settings.map((s) => ({
          board_id: s.board_id,
          display_order: s.display_order,
          is_active: true
        }))
      );

    if (error) {
      console.error('게시판 모음 위젯 설정 저장 오류:', error);
      return { success: false, error: error.message };
    }

    // 메인 페이지 revalidate
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('게시판 모음 위젯 설정 저장 오류:', error);
    return { success: false, error: String(error) };
  }
}

// 모든 게시판 목록 조회 (관리자용)
export async function getAllBoards(): Promise<{ id: string; name: string; slug: string }[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('boards')
      .select('id, name, slug')
      .order('name');

    if (error) {
      console.error('게시판 목록 조회 오류:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('게시판 목록 조회 오류:', error);
    return [];
  }
}
