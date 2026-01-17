'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import type { HotdealPostsData, HotdealSidebarPost } from '../types/hotdeal';

interface RawPostData {
  id: string;
  post_number: number;
  title: string;
  views: number;
  likes: number;
  board_id: string;
  deal_info: {
    store: string;
    product_name: string;
    price: number;
    original_price?: number;
    is_ended: boolean;
  };
  boards: {
    slug: string;
    name: string;
  };
}

/**
 * 핫딜 베스트 게시글 가져오기
 * @param limit 각 탭별 개수 (기본 10개)
 * @param windowDays 기준 기간 (기본 3일)
 */
export async function getHotdealBestPosts(
  limit = 10,
  windowDays = 3
): Promise<HotdealPostsData> {
  try {
    const supabase = await getSupabaseServer();
    if (!supabase) {
      return createEmptyHotdealData(windowDays);
    }

    const now = new Date();
    const cutoffDate = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

    // 1. HOT (조회수 + 추천수 기준)
    const { data: hotData } = await supabase
      .from('posts')
      .select(`
        id,
        post_number,
        title,
        views,
        likes,
        board_id,
        deal_info,
        boards!inner(slug, name)
      `)
      .not('deal_info', 'is', null)
      .eq('deal_info->>is_ended', 'false')
      .gte('created_at', cutoffDate.toISOString())
      .order('views', { ascending: false })
      .order('likes', { ascending: false })
      .limit(limit);

    // 2. 할인율순 (정가가 있는 것만, 할인율 계산 후 클라이언트에서 정렬)
    const { data: discountData } = await supabase
      .from('posts')
      .select(`
        id,
        post_number,
        title,
        views,
        likes,
        board_id,
        deal_info,
        boards!inner(slug, name)
      `)
      .not('deal_info', 'is', null)
      .eq('deal_info->>is_ended', 'false')
      .not('deal_info->>original_price', 'is', null)
      .gte('created_at', cutoffDate.toISOString())
      .limit(limit * 3); // 할인율 계산 후 정렬하므로 여유있게 가져옴

    // 3. 추천수순
    const { data: likesData } = await supabase
      .from('posts')
      .select(`
        id,
        post_number,
        title,
        views,
        likes,
        board_id,
        deal_info,
        boards!inner(slug, name)
      `)
      .not('deal_info', 'is', null)
      .eq('deal_info->>is_ended', 'false')
      .gte('created_at', cutoffDate.toISOString())
      .order('likes', { ascending: false })
      .limit(limit);

    // 4. 댓글수순 - 먼저 모든 게시글을 가져온 후 댓글 수로 정렬
    const { data: allPostsData } = await supabase
      .from('posts')
      .select(`
        id,
        post_number,
        title,
        views,
        likes,
        board_id,
        deal_info,
        boards!inner(slug, name)
      `)
      .not('deal_info', 'is', null)
      .eq('deal_info->>is_ended', 'false')
      .gte('created_at', cutoffDate.toISOString())
      .limit(limit * 3); // 댓글 수로 정렬하기 위해 여유있게 가져옴

    // 모든 게시글 ID 수집 (댓글 수 조회를 위해)
    const allPostIds = new Set<string>();
    [hotData, discountData, likesData, allPostsData].forEach(data => {
      if (data && Array.isArray(data)) {
        (data as unknown as { id: string }[]).forEach((post) => {
          if (post?.id) {
            allPostIds.add(post.id);
          }
        });
      }
    });

    // 댓글 수 조회
    const commentCountMap: Record<string, number> = {};
    if (allPostIds.size > 0) {
      const { data: commentCounts } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', Array.from(allPostIds))
        .eq('is_hidden', false)
        .eq('is_deleted', false);

      if (commentCounts) {
        commentCounts.forEach((comment) => {
          if (comment.post_id) {
            commentCountMap[comment.post_id] = (commentCountMap[comment.post_id] || 0) + 1;
          }
        });
      }
    }

    // 데이터 포맷팅
    const formatPosts = (data: RawPostData[]): HotdealSidebarPost[] => {
      return data.map((item) => ({
        id: item.id,
        post_number: item.post_number,
        title: item.title,
        board_slug: item.boards?.slug || '',
        board_name: item.boards?.name || '',
        views: item.views || 0,
        likes: item.likes || 0,
        comment_count: commentCountMap[item.id] || 0,
        deal_info: {
          store: item.deal_info?.store || '',
          product_name: item.deal_info?.product_name || '',
          price: item.deal_info?.price || 0,
          original_price: item.deal_info?.original_price,
          is_ended: item.deal_info?.is_ended || false,
        },
      }));
    };

    // 할인율 계산 및 정렬
    const sortByDiscount = (posts: HotdealSidebarPost[]): HotdealSidebarPost[] => {
      return posts
        .map((post) => {
          const { price, original_price } = post.deal_info;
          const discountRate =
            original_price && original_price > price
              ? ((original_price - price) / original_price) * 100
              : 0;
          return { ...post, discountRate };
        })
        .sort((a, b) => (b.discountRate || 0) - (a.discountRate || 0))
        .slice(0, limit);
    };

    // 댓글수순 정렬
    const sortByComments = (posts: HotdealSidebarPost[]): HotdealSidebarPost[] => {
      return posts
        .sort((a, b) => b.comment_count - a.comment_count)
        .slice(0, limit);
    };

    return {
      hot: hotData && Array.isArray(hotData) ? formatPosts(hotData as unknown as RawPostData[]) : [],
      discount: discountData && Array.isArray(discountData) ? sortByDiscount(formatPosts(discountData as unknown as RawPostData[])) : [],
      likes: likesData && Array.isArray(likesData) ? formatPosts(likesData as unknown as RawPostData[]) : [],
      comments: allPostsData && Array.isArray(allPostsData) ? sortByComments(formatPosts(allPostsData as unknown as RawPostData[])) : [],
      windowDays,
    };
  } catch (error) {
    console.error('[getHotdealBestPosts] 오류:', error);
    return createEmptyHotdealData(windowDays);
  }
}

/**
 * 빈 핫딜 데이터 생성
 */
function createEmptyHotdealData(windowDays: number): HotdealPostsData {
  return {
    hot: [],
    discount: [],
    likes: [],
    comments: [],
    windowDays,
  };
}
