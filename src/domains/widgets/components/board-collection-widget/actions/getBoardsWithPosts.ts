'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { BoardWithPosts, PostWithContent } from '../types';

/** 게시판당 가져올 게시글 수 */
const POSTS_PER_BOARD = 20;

/**
 * 게시판 정보와 게시글을 효율적으로 조회합니다.
 * - 모든 게시판 정보를 한 번에 조회
 * - 하위 게시판을 한 번에 조회
 * - 모든 게시글을 한 번에 조회 후 그룹화
 */
export async function getBoardsWithPosts(boardIds: string[]): Promise<BoardWithPosts[]> {
  if (boardIds.length === 0) return [];

  try {
    const supabase = await getSupabaseServer();

    // 1. 게시판 정보 한 번에 조회
    const { data: boards, error: boardsError } = await supabase
      .from('boards')
      .select('id, name, slug, description')
      .in('id', boardIds);

    if (boardsError || !boards || boards.length === 0) {
      console.error('게시판 조회 오류:', boardsError);
      return [];
    }

    // 2. 하위 게시판 한 번에 조회
    const { data: childBoards } = await supabase
      .from('boards')
      .select('id, parent_id')
      .in('parent_id', boardIds);

    // 게시판별 관련 게시판 ID 매핑 (본인 + 하위)
    const relatedBoardIdsMap = new Map<string, string[]>();
    boardIds.forEach(id => relatedBoardIdsMap.set(id, [id]));

    childBoards?.forEach(child => {
      if (child.parent_id) {
        const existing = relatedBoardIdsMap.get(child.parent_id) || [];
        existing.push(child.id);
        relatedBoardIdsMap.set(child.parent_id, existing);
      }
    });

    // 모든 관련 게시판 ID (게시글 조회용)
    const allRelatedBoardIds = Array.from(relatedBoardIdsMap.values()).flat();

    // 3. 모든 게시글 한 번에 조회
    const { data: allPosts, error: postsError } = await supabase
      .from('posts')
      .select('id, title, post_number, created_at, content, views, likes, board_id, category')
      .in('board_id', allRelatedBoardIds)
      .order('created_at', { ascending: false })
      .limit(boardIds.length * POSTS_PER_BOARD);

    if (postsError) {
      console.error('게시글 조회 오류:', postsError);
    }

    // 4. boardIds 순서대로 결과 생성
    const result: BoardWithPosts[] = boardIds
      .map(boardId => {
        const board = boards.find(b => b.id === boardId);
        if (!board) return null;

        const relatedIds = relatedBoardIdsMap.get(boardId) || [boardId];
        const posts = (allPosts || [])
          .filter(p => p.board_id && relatedIds.includes(p.board_id))
          .slice(0, POSTS_PER_BOARD) as PostWithContent[];

        return {
          board: {
            id: board.id,
            name: board.name,
            slug: board.slug || '',
            description: board.description
          },
          posts
        };
      })
      .filter((item): item is BoardWithPosts => item !== null);

    return result;
  } catch (error) {
    console.error('게시판+게시글 조회 오류:', error);
    return [];
  }
}
