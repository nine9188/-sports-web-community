'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import type { Json } from '@/shared/types/supabase';
import {
  createFallbackPost,
  createEmptyResponse,
  fetchBoardsInfo,
  fetchTeamLogos,
  fetchLeagueLogos,
  fetchUserProfiles,
  fetchCommentCounts,
  formatPostData
} from './posts/fetchPostsHelpers';

// Supabase 쿼리 결과 타입 (raw)
interface RawPostData {
  id: string;
  title?: string;
  created_at?: string;
  board_id?: string;
  views?: number;
  likes?: number;
  post_number?: number;
  user_id?: string;
  is_hidden?: boolean;
  is_deleted?: boolean;
  is_notice?: boolean;
  profiles?: { id?: string; nickname?: string; level?: number; icon_id?: number | null };
  content?: Json;
}

// 게시글 타입 정의
export interface Post {
  id: string;
  title: string;
  created_at: string;
  formattedDate: string;
  board_id: string;
  board_name: string;
  board_slug: string;
  post_number: number;
  author_nickname: string;
  author_id: string;
  author_level?: number;
  author_icon_id?: number | null;
  author_icon_url?: string | null;
  views: number;
  likes: number;
  comment_count: number;
  content: string;
  team_id?: string | number | null;
  league_id?: string | number | null;
  team_logo?: string | null;
  league_logo?: string | null;
  is_hidden?: boolean;
  is_deleted?: boolean;
  is_notice?: boolean;
}

// 응답 타입 정의
export interface PostsResponse {
  data: Post[];
  meta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

interface FetchPostsParams {
  boardId?: string;
  boardIds?: string[];
  currentBoardId?: string;
  limit?: number;
  page?: number;
  fromParam?: string;
}

export async function fetchPosts(params: FetchPostsParams): Promise<PostsResponse> {
  try {
    const { boardId, boardIds, currentBoardId, limit = 20, page = 1, fromParam } = params;
    const offset = (page - 1) * limit;

    const supabase = await getSupabaseServer();

    if (!supabase) {
      return {
        data: Array(5).fill(null).map((_, i) => createFallbackPost(i + 1)),
        meta: { totalItems: 5, totalPages: 1, currentPage: 1, itemsPerPage: limit }
      };
    }

    // notice 게시판 확인
    let isNoticeBoard = false;
    let noticeBoardId: string | null = null;
    const checkBoardId = boardId || currentBoardId;

    if (checkBoardId) {
      const { data: boardData } = await supabase
        .from('boards')
        .select('id, slug')
        .eq('id', checkBoardId)
        .single();

      if (boardData?.slug === 'notice') {
        isNoticeBoard = true;
        noticeBoardId = boardData.id;
      }
    }

    // 게시판 필터링 설정
    let targetBoardIds = ['all'];
    if (boardId) {
      targetBoardIds = [boardId];
    } else if (boardIds?.length) {
      targetBoardIds = boardIds;
    }

    let currentBoardFilter: string | null = null;
    let targetBoardsFilter: string[] | null = null;

    if (fromParam === 'boards' && currentBoardId) {
      currentBoardFilter = currentBoardId;
    } else if (fromParam && fromParam !== 'boards') {
      const { data: fromBoardData } = await supabase
        .from('boards')
        .select('id')
        .eq('id', fromParam)
        .single();

      if (fromBoardData) {
        currentBoardFilter = fromParam;
      } else if (targetBoardIds[0] !== 'all') {
        targetBoardsFilter = targetBoardIds;
      }
    } else if (targetBoardIds[0] !== 'all') {
      targetBoardsFilter = targetBoardIds;
    }

    // 쿼리 구성
    let postsQuery = supabase
      .from('posts')
      .select(`
        id, title, created_at, updated_at, board_id, views, likes,
        post_number, user_id, is_hidden, is_deleted, is_notice,
        profiles (id, nickname, level, icon_id),
        content
      `)
      .order('created_at', { ascending: false });

    // 필터 적용
    if (isNoticeBoard && noticeBoardId) {
      postsQuery = postsQuery.or(`board_id.eq.${noticeBoardId},is_notice.eq.true`);
    } else if (currentBoardFilter) {
      postsQuery = postsQuery.eq('board_id', currentBoardFilter);
    } else if (targetBoardsFilter?.length) {
      postsQuery = postsQuery.in('board_id', targetBoardsFilter);
    }

    // 카운트 쿼리
    let countQuery = supabase.from('posts').select('id', { count: 'exact', head: true });

    if (isNoticeBoard && noticeBoardId) {
      countQuery = countQuery.or(`board_id.eq.${noticeBoardId},is_notice.eq.true`);
    } else if (currentBoardFilter) {
      countQuery = countQuery.eq('board_id', currentBoardFilter);
    } else if (targetBoardsFilter?.length) {
      countQuery = countQuery.in('board_id', targetBoardsFilter);
    }

    const { count } = await countQuery;
    const totalItems = count || 0;

    // 데이터 조회
    const { data: postsData, error: postsError } = await postsQuery
      .range(offset, offset + limit - 1)
      .limit(limit);

    if (postsError) {
      throw new Error(`게시물 데이터 불러오기 오류: ${postsError.message}`);
    }

    if (!postsData?.length) {
      return createEmptyResponse(page, limit);
    }

    // 타입 변환 (Supabase 쿼리 결과를 명시적 타입으로)
    const typedPostsData = postsData as RawPostData[];

    // 병렬로 관련 데이터 조회
    const postBoardIds = [...new Set(typedPostsData.map(p => p.board_id).filter(Boolean))] as string[];
    const userIds = typedPostsData.map(p => p.user_id).filter((id): id is string => !!id);
    const postIds = typedPostsData.map(p => p.id).filter(Boolean);

    const [boardsData, { profileMap, iconMap }, commentCountMap] = await Promise.all([
      fetchBoardsInfo(supabase, postBoardIds),
      fetchUserProfiles(supabase, userIds),
      fetchCommentCounts(supabase, postIds)
    ]);

    // 팀/리그 로고 조회
    const teamIds = Object.values(boardsData).map(b => b.team_id).filter(Boolean) as number[];
    const leagueIds = Object.values(boardsData).map(b => b.league_id).filter(Boolean) as number[];

    const [teamLogoMap, leagueLogoMap] = await Promise.all([
      fetchTeamLogos(supabase, teamIds),
      fetchLeagueLogos(supabase, leagueIds)
    ]);

    // 최종 데이터 포맷팅
    const formattedPosts = typedPostsData.map(post =>
      formatPostData(post, boardsData, teamLogoMap, leagueLogoMap, profileMap, iconMap, commentCountMap)
    );

    return {
      data: formattedPosts,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        itemsPerPage: limit
      }
    };
  } catch (error) {
    console.error('게시물 불러오기 오류:', error);
    return createEmptyResponse(1, 20);
  }
}

export async function revalidatePostsData(path: string = '/') {
  try {
    const { revalidatePath } = await import('next/cache');

    if (path.includes('[') && path.includes(']')) {
      revalidatePath(path, 'page');
    } else {
      revalidatePath(path);
    }

    return { success: true, message: '캐시가 성공적으로 갱신됐습니다.' };
  } catch (error) {
    console.error('캐시 갱신 오류:', error);
    return { success: false, message: '캐시 갱신 중 오류가 발생했습니다.' };
  }
}

/**
 * 특정 게시판의 게시글 목록 조회
 */
export async function getPosts(boardId: string, page = 1, limit = 20) {
  try {
    const supabase = await getSupabaseServer();
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('posts')
      .select('id, title, created_at, user_id, view_count, like_count, is_hidden, is_deleted, profiles(username, avatar_url)', { count: 'exact' })
      .eq('board_id', boardId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('게시글 목록 조회 오류:', error);
      throw new Error('게시글 목록 조회 실패');
    }

    return {
      posts: data || [],
      totalCount: count || 0,
      totalPages: count ? Math.ceil(count / limit) : 0,
      currentPage: page
    };
  } catch (error) {
    console.error('게시글 데이터 불러오기 오류:', error);
    return { posts: [], totalCount: 0, totalPages: 0, currentPage: page };
  }
}
