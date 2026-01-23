'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { formatDate } from '@/shared/utils/dateUtils';
import { getLevelIconUrl } from '@/shared/utils/level-icons-server';
import type { Post, PostsResponse } from '../getPosts';

export type SearchType = 'title_content' | 'title' | 'content' | 'comment' | 'nickname';

interface SearchBoardPostsParams {
  boardIds: string[];
  query: string;
  searchType?: SearchType;
  page?: number;
  limit?: number;
}

/**
 * 게시판 내에서 게시글 검색 (여러 게시판 ID 지원)
 */
export async function searchBoardPosts({
  boardIds,
  query,
  searchType = 'title_content',
  page = 1,
  limit = 20,
}: SearchBoardPostsParams): Promise<PostsResponse> {
  const emptyResponse: PostsResponse = {
    data: [],
    meta: {
      totalItems: 0,
      totalPages: 1,
      currentPage: page,
      itemsPerPage: limit,
    },
  };

  if (!query.trim() || !boardIds || boardIds.length === 0) {
    return emptyResponse;
  }

  try {
    const supabase = await getSupabaseServer();
    if (!supabase) {
      throw new Error('Supabase 클라이언트 초기화 실패');
    }

    const searchTerm = query.trim();
    const offset = (page - 1) * limit;

    // 댓글 검색인 경우 별도 처리
    if (searchType === 'comment') {
      return searchByComment({ supabase, boardIds, searchTerm, page, limit, offset });
    }

    // 닉네임 검색인 경우 별도 처리
    if (searchType === 'nickname') {
      return searchByNickname({ supabase, boardIds, searchTerm, page, limit, offset });
    }

    // RPC 함수를 사용하여 JSONB content 검색 지원
    // 총 개수 조회
    const { data: countData, error: countError } = await supabase
      .rpc('count_search_posts', {
        p_board_ids: boardIds,
        p_search_term: searchTerm,
        p_search_type: searchType
      });

    if (countError) {
      console.error('검색 개수 조회 오류:', countError);
      return emptyResponse;
    }

    const totalCount = countData || 0;
    if (totalCount === 0) {
      return emptyResponse;
    }

    // RPC로 게시글 검색
    const { data: searchResults, error: searchError } = await supabase
      .rpc('search_posts_by_content', {
        p_board_ids: boardIds,
        p_search_term: searchTerm,
        p_search_type: searchType,
        p_limit: limit,
        p_offset: offset
      });

    if (searchError) {
      console.error('검색 오류:', searchError);
      return emptyResponse;
    }

    if (!searchResults || searchResults.length === 0) {
      return emptyResponse;
    }

    // 검색 결과의 post_id 목록
    const postIds = searchResults.map((p: any) => p.id);

    // 프로필과 게시판 정보 조회
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        created_at,
        views,
        likes,
        post_number,
        board_id,
        user_id,
        is_hidden,
        is_deleted,
        is_notice,
        profiles!posts_user_id_fkey(
          id,
          nickname,
          level,
          icon_id,
          public_id
        ),
        boards!posts_board_id_fkey(
          id,
          name,
          slug,
          team_id,
          league_id
        )
      `)
      .in('id', postIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('게시판 검색 오류:', error);
      return emptyResponse;
    }

    if (!posts || posts.length === 0) {
      return emptyResponse;
    }

    // 댓글 수 조회 (postIds는 이미 위에서 정의됨)
    const commentCountMap: Record<string, number> = {};

    if (postIds.length > 0) {
      const { data: commentData } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds)
        .eq('is_hidden', false)
        .eq('is_deleted', false);

      if (commentData) {
        commentData.forEach((c: any) => {
          commentCountMap[c.post_id] = (commentCountMap[c.post_id] || 0) + 1;
        });
      }
    }

    // 아이콘 조회
    const iconIds = posts
      .map((p: any) => p.profiles?.icon_id)
      .filter(Boolean) as number[];

    const iconMap: Record<number, string> = {};
    if (iconIds.length > 0) {
      const { data: iconsData } = await supabase
        .from('shop_items')
        .select('id, image_url')
        .in('id', iconIds);

      if (iconsData) {
        iconsData.forEach((icon: any) => {
          if (icon.id && icon.image_url) {
            iconMap[icon.id] = icon.image_url;
          }
        });
      }
    }

    // 포맷팅
    const formattedPosts: Post[] = posts.map((post: any) => {
      const profile = post.profiles;
      const board = post.boards;
      const userLevel = profile?.level || 1;

      let iconUrl: string | null = null;
      if (profile?.icon_id && iconMap[profile.icon_id]) {
        iconUrl = iconMap[profile.icon_id];
      } else {
        iconUrl = getLevelIconUrl(userLevel);
      }

      return {
        id: post.id,
        title: post.title || '',
        created_at: post.created_at || new Date().toISOString(),
        formattedDate: formatDate(post.created_at || new Date().toISOString()),
        board_id: post.board_id || '',
        board_name: board?.name || '',
        board_slug: board?.slug || '',
        post_number: post.post_number || 0,
        author_nickname: profile?.nickname || '익명',
        author_id: profile?.id || '',
        author_level: userLevel,
        author_icon_id: profile?.icon_id,
        author_icon_url: iconUrl,
        author_public_id: profile?.public_id || null,
        views: post.views || 0,
        likes: post.likes || 0,
        comment_count: commentCountMap[post.id] || 0,
        content: typeof post.content === 'string' ? post.content : JSON.stringify(post.content || ''),
        team_id: board?.team_id || null,
        league_id: board?.league_id || null,
        team_logo: null,
        league_logo: null,
        is_hidden: post.is_hidden || false,
        is_deleted: post.is_deleted || false,
        is_notice: post.is_notice || false,
      };
    });

    return {
      data: formattedPosts,
      meta: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  } catch (error) {
    console.error('searchBoardPosts 오류:', error);
    return emptyResponse;
  }
}

/**
 * 댓글 내용으로 게시글 검색
 */
async function searchByComment({
  supabase,
  boardIds,
  searchTerm,
  page,
  limit,
  offset,
}: {
  supabase: any;
  boardIds: string[];
  searchTerm: string;
  page: number;
  limit: number;
  offset: number;
}): Promise<PostsResponse> {
  const emptyResponse: PostsResponse = {
    data: [],
    meta: {
      totalItems: 0,
      totalPages: 1,
      currentPage: page,
      itemsPerPage: limit,
    },
  };

  try {
    // 1. 검색어가 포함된 댓글의 post_id 목록 조회
    const { data: matchingComments } = await supabase
      .from('comments')
      .select('post_id')
      .ilike('content', `%${searchTerm}%`)
      .eq('is_hidden', false)
      .eq('is_deleted', false);

    if (!matchingComments || matchingComments.length === 0) {
      return emptyResponse;
    }

    const postIds = [...new Set(matchingComments.map((c: any) => c.post_id))];

    // 2. 해당 게시글 중 boardIds에 포함된 것만 총 개수 조회
    const { count: totalCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .in('id', postIds)
      .in('board_id', boardIds)
      .eq('is_published', true)
      .eq('is_hidden', false)
      .eq('is_deleted', false);

    if (!totalCount || totalCount === 0) {
      return emptyResponse;
    }

    // 3. 게시글 조회
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        created_at,
        views,
        likes,
        post_number,
        board_id,
        user_id,
        is_hidden,
        is_deleted,
        is_notice,
        profiles!posts_user_id_fkey(
          id,
          nickname,
          level,
          icon_id,
          public_id
        ),
        boards!posts_board_id_fkey(
          id,
          name,
          slug,
          team_id,
          league_id
        )
      `)
      .in('id', postIds)
      .in('board_id', boardIds)
      .eq('is_published', true)
      .eq('is_hidden', false)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error || !posts || posts.length === 0) {
      return emptyResponse;
    }

    // 4. 댓글 수 조회
    const fetchedPostIds = posts.map((p: any) => p.id);
    const commentCountMap: Record<string, number> = {};

    if (fetchedPostIds.length > 0) {
      const { data: commentData } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', fetchedPostIds)
        .eq('is_hidden', false)
        .eq('is_deleted', false);

      if (commentData) {
        commentData.forEach((c: any) => {
          commentCountMap[c.post_id] = (commentCountMap[c.post_id] || 0) + 1;
        });
      }
    }

    // 5. 아이콘 조회
    const iconIds = posts
      .map((p: any) => p.profiles?.icon_id)
      .filter(Boolean) as number[];

    const iconMap: Record<number, string> = {};
    if (iconIds.length > 0) {
      const { data: iconsData } = await supabase
        .from('shop_items')
        .select('id, image_url')
        .in('id', iconIds);

      if (iconsData) {
        iconsData.forEach((icon: any) => {
          if (icon.id && icon.image_url) {
            iconMap[icon.id] = icon.image_url;
          }
        });
      }
    }

    // 6. 포맷팅
    const formattedPosts: Post[] = posts.map((post: any) => {
      const profile = post.profiles;
      const board = post.boards;
      const userLevel = profile?.level || 1;

      let iconUrl: string | null = null;
      if (profile?.icon_id && iconMap[profile.icon_id]) {
        iconUrl = iconMap[profile.icon_id];
      } else {
        iconUrl = getLevelIconUrl(userLevel);
      }

      return {
        id: post.id,
        title: post.title || '',
        created_at: post.created_at || new Date().toISOString(),
        formattedDate: formatDate(post.created_at || new Date().toISOString()),
        board_id: post.board_id || '',
        board_name: board?.name || '',
        board_slug: board?.slug || '',
        post_number: post.post_number || 0,
        author_nickname: profile?.nickname || '익명',
        author_id: profile?.id || '',
        author_level: userLevel,
        author_icon_id: profile?.icon_id,
        author_icon_url: iconUrl,
        author_public_id: profile?.public_id || null,
        views: post.views || 0,
        likes: post.likes || 0,
        comment_count: commentCountMap[post.id] || 0,
        content: typeof post.content === 'string' ? post.content : JSON.stringify(post.content || ''),
        team_id: board?.team_id || null,
        league_id: board?.league_id || null,
        team_logo: null,
        league_logo: null,
        is_hidden: post.is_hidden || false,
        is_deleted: post.is_deleted || false,
        is_notice: post.is_notice || false,
      };
    });

    return {
      data: formattedPosts,
      meta: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  } catch (error) {
    console.error('searchByComment 오류:', error);
    return emptyResponse;
  }
}

/**
 * 닉네임으로 게시글 검색
 */
async function searchByNickname({
  supabase,
  boardIds,
  searchTerm,
  page,
  limit,
  offset,
}: {
  supabase: any;
  boardIds: string[];
  searchTerm: string;
  page: number;
  limit: number;
  offset: number;
}): Promise<PostsResponse> {
  const emptyResponse: PostsResponse = {
    data: [],
    meta: {
      totalItems: 0,
      totalPages: 1,
      currentPage: page,
      itemsPerPage: limit,
    },
  };

  try {
    // 1. 닉네임이 일치하는 프로필의 user_id 목록 조회
    const { data: matchingProfiles } = await supabase
      .from('profiles')
      .select('id')
      .ilike('nickname', `%${searchTerm}%`);

    if (!matchingProfiles || matchingProfiles.length === 0) {
      return emptyResponse;
    }

    const userIds = matchingProfiles.map((p: any) => p.id);

    // 2. 해당 유저의 게시글 중 boardIds에 포함된 것만 총 개수 조회
    const { count: totalCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .in('user_id', userIds)
      .in('board_id', boardIds)
      .eq('is_published', true)
      .eq('is_hidden', false)
      .eq('is_deleted', false);

    if (!totalCount || totalCount === 0) {
      return emptyResponse;
    }

    // 3. 게시글 조회
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        created_at,
        views,
        likes,
        post_number,
        board_id,
        user_id,
        is_hidden,
        is_deleted,
        is_notice,
        profiles!posts_user_id_fkey(
          id,
          nickname,
          level,
          icon_id,
          public_id
        ),
        boards!posts_board_id_fkey(
          id,
          name,
          slug,
          team_id,
          league_id
        )
      `)
      .in('user_id', userIds)
      .in('board_id', boardIds)
      .eq('is_published', true)
      .eq('is_hidden', false)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error || !posts || posts.length === 0) {
      return emptyResponse;
    }

    // 4. 댓글 수 조회
    const postIds = posts.map((p: any) => p.id);
    const commentCountMap: Record<string, number> = {};

    if (postIds.length > 0) {
      const { data: commentData } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds)
        .eq('is_hidden', false)
        .eq('is_deleted', false);

      if (commentData) {
        commentData.forEach((c: any) => {
          commentCountMap[c.post_id] = (commentCountMap[c.post_id] || 0) + 1;
        });
      }
    }

    // 5. 아이콘 조회
    const iconIds = posts
      .map((p: any) => p.profiles?.icon_id)
      .filter(Boolean) as number[];

    const iconMap: Record<number, string> = {};
    if (iconIds.length > 0) {
      const { data: iconsData } = await supabase
        .from('shop_items')
        .select('id, image_url')
        .in('id', iconIds);

      if (iconsData) {
        iconsData.forEach((icon: any) => {
          if (icon.id && icon.image_url) {
            iconMap[icon.id] = icon.image_url;
          }
        });
      }
    }

    // 6. 포맷팅
    const formattedPosts: Post[] = posts.map((post: any) => {
      const profile = post.profiles;
      const board = post.boards;
      const userLevel = profile?.level || 1;

      let iconUrl: string | null = null;
      if (profile?.icon_id && iconMap[profile.icon_id]) {
        iconUrl = iconMap[profile.icon_id];
      } else {
        iconUrl = getLevelIconUrl(userLevel);
      }

      return {
        id: post.id,
        title: post.title || '',
        created_at: post.created_at || new Date().toISOString(),
        formattedDate: formatDate(post.created_at || new Date().toISOString()),
        board_id: post.board_id || '',
        board_name: board?.name || '',
        board_slug: board?.slug || '',
        post_number: post.post_number || 0,
        author_nickname: profile?.nickname || '익명',
        author_id: profile?.id || '',
        author_level: userLevel,
        author_icon_id: profile?.icon_id,
        author_icon_url: iconUrl,
        author_public_id: profile?.public_id || null,
        views: post.views || 0,
        likes: post.likes || 0,
        comment_count: commentCountMap[post.id] || 0,
        content: typeof post.content === 'string' ? post.content : JSON.stringify(post.content || ''),
        team_id: board?.team_id || null,
        league_id: board?.league_id || null,
        team_logo: null,
        league_logo: null,
        is_hidden: post.is_hidden || false,
        is_deleted: post.is_deleted || false,
        is_notice: post.is_notice || false,
      };
    });

    return {
      data: formattedPosts,
      meta: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  } catch (error) {
    console.error('searchByNickname 오류:', error);
    return emptyResponse;
  }
}
