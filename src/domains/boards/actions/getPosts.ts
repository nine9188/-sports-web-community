'use server';

import { cache } from 'react';
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

import type { DealInfo } from '../types/hotdeal';
import { HOTDEAL_BOARD_SLUGS } from '../types/hotdeal';

/**
 * 핫딜 게시판 ID 목록을 가져오는 캐시된 함수
 * 같은 request 내에서 여러 번 호출해도 1번만 실행됨
 */
const getHotdealBoardIds = cache(async (): Promise<string[]> => {
  try {
    const supabase = await getSupabaseServer();
    const { data: hotdealBoards } = await supabase
      .from('boards')
      .select('id')
      .in('slug', HOTDEAL_BOARD_SLUGS as unknown as string[]);

    return hotdealBoards?.map(b => b.id) || [];
  } catch {
    return [];
  }
});

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
  profiles?: { id?: string; nickname?: string; level?: number; icon_id?: number | null; public_id?: string | null };
  content?: Json;
  deal_info?: DealInfo | null;
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
  author_public_id?: string | null;
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
  deal_info?: DealInfo | null;
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
  limit: number;
  page?: number;
  fromParam?: string;
  store?: string; // 쇼핑몰 필터
  excludeHotdeal?: boolean; // 핫딜 게시판 제외 여부
}

export async function fetchPosts(params: FetchPostsParams): Promise<PostsResponse> {
  try {
    const { boardId, boardIds, currentBoardId, limit, page = 1, fromParam, store, excludeHotdeal = true } = params;
    const offset = (page - 1) * limit;

    const supabase = await getSupabaseServer();

    if (!supabase) {
      return {
        data: Array(5).fill(null).map((_, i) => createFallbackPost(i + 1)),
        meta: { totalItems: 5, totalPages: 1, currentPage: 1, itemsPerPage: limit }
      };
    }

    // 특수 게시판 확인 (공지, 분석)
    let isNoticeBoard = false;
    let noticeBoardId: string | null = null;
    let isAnalysisBoard = false;
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
      } else if (boardData?.slug === 'data-analysis') {
        isAnalysisBoard = true;
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

    // 핫딜 게시판 ID 조회 (캐시된 함수 사용 - 같은 request 내 1회만 실행)
    let hotdealBoardIds: string[] = [];
    if (excludeHotdeal && !currentBoardFilter && !targetBoardsFilter) {
      hotdealBoardIds = await getHotdealBoardIds();
    }

    // 쿼리 구성
    let postsQuery = supabase
      .from('posts')
      .select(`
        id, title, created_at, updated_at, board_id, views, likes,
        post_number, user_id, is_hidden, is_deleted, is_notice,
        profiles (id, nickname, level, icon_id, public_id),
        content, deal_info
      `)
      .order('created_at', { ascending: false });

    // 필터 적용
    if (isNoticeBoard && noticeBoardId) {
      postsQuery = postsQuery.or(`board_id.eq.${noticeBoardId},is_notice.eq.true`);
    } else if (isAnalysisBoard) {
      // 분석게시판: 모든 리그 게시판의 분석글 모아보기
      postsQuery = postsQuery.eq('meta->>prediction_type', 'league_analysis');
    } else if (currentBoardFilter) {
      postsQuery = postsQuery.eq('board_id', currentBoardFilter);
    } else if (targetBoardsFilter?.length) {
      postsQuery = postsQuery.in('board_id', targetBoardsFilter);
    }

    // 핫딜 게시판 제외 필터 적용
    if (hotdealBoardIds.length > 0) {
      for (const hotdealId of hotdealBoardIds) {
        postsQuery = postsQuery.neq('board_id', hotdealId);
      }
    }

    // 쇼핑몰 필터 적용 (핫딜 게시판) - 다중 선택 지원
    if (store) {
      const stores = store.split(',').map(s => s.trim()).filter(Boolean);
      if (stores.length === 1) {
        postsQuery = postsQuery.eq('deal_info->>store', stores[0]);
      } else if (stores.length > 1) {
        const orCondition = stores.map(s => `deal_info->>store.eq.${s}`).join(',');
        postsQuery = postsQuery.or(orCondition);
      }
    }

    // 카운트 쿼리
    let countQuery = supabase.from('posts').select('id', { count: 'exact', head: true });

    if (isNoticeBoard && noticeBoardId) {
      countQuery = countQuery.or(`board_id.eq.${noticeBoardId},is_notice.eq.true`);
    } else if (isAnalysisBoard) {
      // 분석게시판: 모든 리그 게시판의 분석글 카운트
      countQuery = countQuery.eq('meta->>prediction_type', 'league_analysis');
    } else if (currentBoardFilter) {
      countQuery = countQuery.eq('board_id', currentBoardFilter);
    } else if (targetBoardsFilter?.length) {
      countQuery = countQuery.in('board_id', targetBoardsFilter);
    }

    // 핫딜 게시판 제외 필터 적용 (카운트)
    if (hotdealBoardIds.length > 0) {
      for (const hotdealId of hotdealBoardIds) {
        countQuery = countQuery.neq('board_id', hotdealId);
      }
    }

    // 쇼핑몰 필터 적용 (카운트) - 다중 선택 지원
    if (store) {
      const stores = store.split(',').map(s => s.trim()).filter(Boolean);
      if (stores.length === 1) {
        countQuery = countQuery.eq('deal_info->>store', stores[0]);
      } else if (stores.length > 1) {
        const orCondition = stores.map(s => `deal_info->>store.eq.${s}`).join(',');
        countQuery = countQuery.or(orCondition);
      }
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
    const errorMessage = error instanceof Error ? error.message : String(error); if (!errorMessage.includes('DYNAMIC_SERVER_USAGE') && !errorMessage.includes('cookies')) { console.error('게시물 불러오기 오류:', error); }
    return createEmptyResponse(1, params.limit);
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
    const errorMessage = error instanceof Error ? error.message : String(error); if (!errorMessage.includes('DYNAMIC_SERVER_USAGE') && !errorMessage.includes('cookies')) { console.error('캐시 갱신 오류:', error); }
    return { success: false, message: '캐시 갱신 중 오류가 발생했습니다.' };
  }
}
