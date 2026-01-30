'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { BoardCollectionSetting } from '../types';

/** 기본 게시판 slug (설정이 없을 때 사용) */
const DEFAULT_BOARD_SLUGS = ['sports-news', 'soccer'];

/**
 * 위젯에 표시할 게시판 ID 목록을 가져옵니다.
 * 1. board_collection_widget_settings 테이블에서 활성화된 설정 조회
 * 2. 설정이 없으면 기본 게시판으로 fallback
 */
export async function getBoardSettings(): Promise<string[]> {
  try {
    const supabase = await getSupabaseServer();

    // 1. 설정 테이블에서 조회
    const { data: settings, error } = await supabase
      .from('board_collection_widget_settings')
      .select('board_id, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (!error && settings && settings.length > 0) {
      return (settings as BoardCollectionSetting[]).map(s => s.board_id);
    }

    // 2. 설정이 없으면 기본 게시판으로 fallback
    const { data: defaultBoards } = await supabase
      .from('boards')
      .select('id')
      .in('slug', DEFAULT_BOARD_SLUGS);

    return defaultBoards?.map(b => b.id) || [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error); if (!errorMessage.includes('DYNAMIC_SERVER_USAGE') && !errorMessage.includes('cookies')) { console.error('게시판 설정 조회 오류:', error); }
    return [];
  }
}
