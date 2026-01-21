'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { getLevelIconUrl } from '@/shared/utils/level-icons-server';
import { formatDate } from '@/shared/utils/dateUtils';
import { PaginationParams, ActionResponse } from '../types';
import { Post } from '@/domains/boards/components/post/postlist/types';

/**
 * public_id로 유저의 게시글 목록을 조회합니다.
 * PostList 컴포넌트에서 사용 가능한 포맷으로 반환
 * @param publicId 유저의 공개 ID (8자리 영숫자)
 * @param pagination 페이지네이션 정보
 * @returns 게시글 목록
 */
export async function getUserPosts(
  publicId: string,
  pagination: PaginationParams = { page: 1, limit: 20 }
): Promise<ActionResponse<Post[]>> {
  try {
    if (!publicId || publicId.length !== 8) {
      return {
        success: false,
        error: '유효하지 않은 프로필 ID입니다.',
        data: [],
        totalCount: 0,
      };
    }

    const supabase = await getSupabaseServer();

    // 먼저 public_id로 프로필 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, nickname, public_id, level, icon_id')
      .eq('public_id', publicId)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: '프로필을 찾을 수 없습니다.',
        data: [],
        totalCount: 0,
      };
    }

    // 아이콘 URL 조회
    let authorIconUrl: string | null = null;
    if (profile.icon_id) {
      const { data: iconData } = await supabase
        .from('shop_items')
        .select('image_url')
        .eq('id', profile.icon_id)
        .single();
      authorIconUrl = iconData?.image_url || null;
    }
    if (!authorIconUrl) {
      authorIconUrl = getLevelIconUrl(profile.level || 1);
    }

    // 게시글 조회
    const { data, count, error } = await supabase
      .from('posts')
      .select(`
        id, title, content, created_at, views, likes, post_number, is_hidden, is_deleted,
        board_id,
        boards!inner(id, name, slug, team_id, league_id)
      `, { count: 'exact' })
      .eq('user_id', profile.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(
        (pagination.page - 1) * pagination.limit,
        (pagination.page - 1) * pagination.limit + pagination.limit - 1
      );

    if (error) {
      console.error('게시글 조회 오류:', error);
      return {
        success: false,
        error: '게시글을 가져오는 중 오류가 발생했습니다.',
        data: [],
        totalCount: 0,
      };
    }

    // 댓글 수 조회
    const postIds = (data || []).map((p: any) => p.id);
    const commentCounts: Record<string, number> = {};

    if (postIds.length > 0) {
      const { data: commentData } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds)
        .eq('is_deleted', false);

      if (commentData) {
        commentData.forEach((c: any) => {
          commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1;
        });
      }
    }

    // PostList Post 포맷으로 변환
    const formattedData: Post[] = (data || []).map((post: any) => ({
      id: post.id,
      title: post.title,
      content: typeof post.content === 'string' ? post.content : JSON.stringify(post.content || ''),
      created_at: post.created_at,
      formattedDate: formatDate(post.created_at),
      views: post.views || 0,
      likes: post.likes || 0,
      board_id: post.board_id,
      board_name: post.boards?.name || '',
      board_slug: post.boards?.slug || '',
      post_number: post.post_number,
      is_hidden: post.is_hidden,
      is_deleted: post.is_deleted,
      // 작성자 정보
      author_nickname: profile.nickname || '익명',
      author_id: profile.id,
      author_public_id: profile.public_id,
      author_level: profile.level || 1,
      author_icon_id: profile.icon_id,
      author_icon_url: authorIconUrl,
      // 댓글 수
      comment_count: commentCounts[post.id] || 0,
      // 팀/리그 정보
      team_id: post.boards?.team_id || null,
      league_id: post.boards?.league_id || null,
    }));

    return {
      success: true,
      data: formattedData,
      totalCount: count || 0,
      hasMore: (pagination.page - 1) * pagination.limit + pagination.limit < (count || 0),
    };
  } catch (error) {
    console.error('게시글 조회 처리 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '게시글을 가져오는 중 오류가 발생했습니다.',
      data: [],
      totalCount: 0,
    };
  }
}
