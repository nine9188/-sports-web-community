'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { getLevelIconUrl } from '@/shared/utils/level-icons-server';
import { formatDate } from '@/shared/utils/dateUtils';
import { PaginationParams, ActionResponse } from '../types';
import { Post } from '@/domains/boards/components/post/postlist/types';

/**
 * public_id로 유저가 댓글 단 게시글 목록을 조회합니다.
 * PostList 컴포넌트에서 사용 가능한 포맷으로 반환
 * @param publicId 유저의 공개 ID (8자리 영숫자)
 * @param pagination 페이지네이션 정보
 * @returns 댓글 단 게시글 목록
 */
export async function getUserCommentedPosts(
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

    // 먼저 public_id로 user_id 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
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

    // 유저가 댓글 단 게시글 ID 조회 (중복 제거, 최신순)
    const { data: commentedPostIds, error: commentError } = await supabase
      .from('comments')
      .select('post_id, created_at')
      .eq('user_id', profile.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (commentError) {
      console.error('댓글 조회 오류:', commentError);
      return {
        success: false,
        error: '댓글을 가져오는 중 오류가 발생했습니다.',
        data: [],
        totalCount: 0,
      };
    }

    // 중복 제거 및 최신 댓글 기준 정렬
    const uniquePostIds: string[] = [];
    const seenPosts = new Set<string>();
    for (const comment of commentedPostIds || []) {
      if (!seenPosts.has(comment.post_id)) {
        seenPosts.add(comment.post_id);
        uniquePostIds.push(comment.post_id);
      }
    }

    const totalCount = uniquePostIds.length;

    if (totalCount === 0) {
      return {
        success: true,
        data: [],
        totalCount: 0,
      };
    }

    // 페이지네이션 적용
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    const paginatedPostIds = uniquePostIds.slice(startIndex, endIndex);

    if (paginatedPostIds.length === 0) {
      return {
        success: true,
        data: [],
        totalCount,
      };
    }

    // 게시글 상세 조회
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(`
        id, title, content, created_at, views, likes, post_number, is_hidden, is_deleted,
        board_id, user_id,
        boards!inner(id, name, slug, team_id, league_id),
        profiles!inner(id, nickname, public_id, level, icon_id)
      `)
      .in('id', paginatedPostIds)
      .eq('is_deleted', false);

    if (postsError) {
      console.error('게시글 조회 오류:', postsError);
      return {
        success: false,
        error: '게시글을 가져오는 중 오류가 발생했습니다.',
        data: [],
        totalCount: 0,
      };
    }

    // 아이콘 URL 조회
    const iconIds = (posts || [])
      .map((p: any) => p.profiles?.icon_id)
      .filter(Boolean) as number[];

    const iconsMap: Record<number, string> = {};
    if (iconIds.length > 0) {
      const { data: iconsData } = await supabase
        .from('shop_items')
        .select('id, image_url')
        .in('id', iconIds);

      if (iconsData) {
        iconsData.forEach((icon: any) => {
          if (icon.id && icon.image_url) {
            iconsMap[icon.id] = icon.image_url;
          }
        });
      }
    }

    // 댓글 수 조회
    const commentCounts: Record<string, number> = {};
    if (paginatedPostIds.length > 0) {
      const { data: commentData } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', paginatedPostIds)
        .eq('is_deleted', false);

      if (commentData) {
        commentData.forEach((c: any) => {
          commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1;
        });
      }
    }

    // 원래 순서대로 정렬 (최신 댓글 순)
    const postsMap = new Map((posts || []).map((p: any) => [p.id, p]));
    const orderedPosts = paginatedPostIds
      .map(id => postsMap.get(id))
      .filter(Boolean);

    // PostList Post 포맷으로 변환
    const formattedData: Post[] = orderedPosts.map((post: any) => {
      let authorIconUrl = null;
      if (post.profiles?.icon_id && iconsMap[post.profiles.icon_id]) {
        authorIconUrl = iconsMap[post.profiles.icon_id];
      } else {
        authorIconUrl = getLevelIconUrl(post.profiles?.level || 1);
      }

      return {
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
        // 게시글 작성자 정보
        author_nickname: post.profiles?.nickname || '익명',
        author_id: post.profiles?.id,
        author_public_id: post.profiles?.public_id,
        author_level: post.profiles?.level || 1,
        author_icon_id: post.profiles?.icon_id,
        author_icon_url: authorIconUrl,
        // 댓글 수
        comment_count: commentCounts[post.id] || 0,
        // 팀/리그 정보
        team_id: post.boards?.team_id || null,
        league_id: post.boards?.league_id || null,
      };
    });

    return {
      success: true,
      data: formattedData,
      totalCount,
      hasMore: endIndex < totalCount,
    };
  } catch (error) {
    console.error('댓글 단 게시글 조회 처리 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '게시글을 가져오는 중 오류가 발생했습니다.',
      data: [],
      totalCount: 0,
    };
  }
}

// 기존 함수명도 유지 (호환성)
export const getUserComments = getUserCommentedPosts;
