'use server';

import { getSupabaseAdmin } from '@/shared/lib/supabase/server';
import { unstable_cache } from 'next/cache';
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
 * unstable_cache로 요청 간 캐시 적용 (300초)
 *
 * @param limit 각 탭별 개수 (기본 10개)
 * @param windowDays 기준 기간 (기본 3일)
 */
export async function getHotdealBestPosts(
  limit = 10,
  windowDays = 3
): Promise<HotdealPostsData> {
  // limit과 windowDays를 캐시 키에 포함
  const getCached = unstable_cache(
    async () => fetchHotdealBestPosts(limit, windowDays),
    ['sidebar', 'hotdeal-best', String(limit), String(windowDays)],
    { revalidate: 300 } // 5분
  );

  return getCached();
}

/**
 * 실제 DB 조회 로직 (캐시 래퍼에서 분리)
 * 최적화: 4개 쿼리를 1개로 통합, 서버에서 정렬별로 분리
 */
async function fetchHotdealBestPosts(
  limit: number,
  windowDays: number
): Promise<HotdealPostsData> {
  try {
    const supabase = getSupabaseAdmin();

    const now = new Date();
    const cutoffDate = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

    // 단일 쿼리로 모든 핫딜 게시글 가져오기 (기존 4개 쿼리 통합)
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
      .limit(100); // 충분히 가져와서 서버에서 정렬

    if (!allPostsData || allPostsData.length === 0) {
      return createEmptyHotdealData(windowDays);
    }

    // 댓글 수 조회 (1회만)
    const postIds = allPostsData.map(post => post.id);
    const commentCountMap: Record<string, number> = {};

    const { data: commentCounts } = await supabase
      .from('comments')
      .select('post_id')
      .in('post_id', postIds)
      .eq('is_hidden', false)
      .eq('is_deleted', false);

    if (commentCounts) {
      commentCounts.forEach((comment) => {
        if (comment.post_id) {
          commentCountMap[comment.post_id] = (commentCountMap[comment.post_id] || 0) + 1;
        }
      });
    }

    // 데이터 포맷팅 (한 번만 수행)
    const formattedPosts: HotdealSidebarPost[] = (allPostsData as unknown as RawPostData[]).map((item) => ({
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

    // 1. HOT 정렬 (조회수 + 추천수)
    const hotSorted = [...formattedPosts]
      .sort((a, b) => {
        const scoreA = a.views + a.likes * 10;
        const scoreB = b.views + b.likes * 10;
        return scoreB - scoreA;
      })
      .slice(0, limit);

    // 2. 할인율 정렬 (original_price가 있는 것만)
    const discountSorted = [...formattedPosts]
      .filter(post => post.deal_info.original_price && post.deal_info.original_price > post.deal_info.price)
      .map((post) => {
        const { price, original_price } = post.deal_info;
        const discountRate = ((original_price! - price) / original_price!) * 100;
        return { ...post, discountRate };
      })
      .sort((a, b) => (b.discountRate || 0) - (a.discountRate || 0))
      .slice(0, limit);

    // 3. 추천수 정렬
    const likesSorted = [...formattedPosts]
      .sort((a, b) => b.likes - a.likes)
      .slice(0, limit);

    // 4. 댓글수 정렬
    const commentsSorted = [...formattedPosts]
      .sort((a, b) => b.comment_count - a.comment_count)
      .slice(0, limit);

    return {
      hot: hotSorted,
      discount: discountSorted,
      likes: likesSorted,
      comments: commentsSorted,
      windowDays,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes('DYNAMIC_SERVER_USAGE') && !errorMessage.includes('cookies')) {
      console.error('[getHotdealBestPosts] 오류:', error);
    }
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
