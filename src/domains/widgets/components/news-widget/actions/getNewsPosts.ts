'use server';

import { unstable_cache } from 'next/cache';
import { getSupabaseAdmin } from '@/shared/lib/supabase/server';
import { NewsItem } from '../types';
import { validateImageUrl } from '../utils';
import { getCachedBoardBySlug } from '@/domains/boards/actions/getCachedBoards';

/** 게시판당 가져올 게시글 수 */
const POSTS_LIMIT = 15;

/**
 * 단일 게시판 뉴스 조회 DB 로직 (캐시 래퍼 내부)
 * Admin client 사용 (unstable_cache 내부는 cookies() 불가)
 *
 * content JSONB 대신 summary/thumbnail_url 컬럼만 select → egress 대폭 감소
 */
async function _fetchNewsPostsImpl(boardSlug: string): Promise<NewsItem[]> {
  try {
    const boardData = await getCachedBoardBySlug(boardSlug);
    if (!boardData) {
      console.error(`게시판 조회 오류 (slug: ${boardSlug}): not found`);
      return [];
    }

    const supabase = getSupabaseAdmin();

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, title, summary, thumbnail_url, created_at, views, likes, post_number, profiles(nickname, public_id)')
      .eq('board_id', boardData.id)
      .eq('is_deleted', false)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(POSTS_LIMIT);

    if (postsError || !posts) {
      console.error('게시글 조회 오류:', postsError);
      return [];
    }

    const newsItems: NewsItem[] = posts.map((post: {
      id: string;
      title: string;
      summary: string | null;
      thumbnail_url: string | null;
      created_at: string;
      views: number | null;
      likes: number | null;
      post_number: number;
      profiles: { nickname?: string | null; public_id?: string | null } | null;
    }) => {
      const summary = post.summary
        ? post.summary.slice(0, 150) + (post.summary.length > 150 ? '...' : '')
        : '';

      const imageUrl = post.thumbnail_url && validateImageUrl(post.thumbnail_url)
        ? post.thumbnail_url
        : undefined;

      return {
        id: post.id,
        title: post.title,
        summary,
        imageUrl,
        source: boardData.name,
        publishedAt: post.created_at || new Date().toISOString(),
        url: `/boards/${boardSlug}/${post.post_number || 0}`,
        postNumber: post.post_number || 0,
        authorNickname: post.profiles?.nickname || '익명',
        authorPublicId: post.profiles?.public_id || null,
        views: post.views || 0,
        likes: post.likes || 0
      };
    });

    return newsItems;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes('DYNAMIC_SERVER_USAGE') && !errorMessage.includes('cookies')) {
      console.error('뉴스 게시글 가져오기 오류:', error);
    }
    return [];
  }
}

/**
 * 단일 게시판에서 뉴스 게시글을 가져옵니다 (unstable_cache 10분).
 *
 * 메인 페이지 위젯에서 호출됨 → 호출 빈도 매우 높음.
 * content를 포함해 fetch하지만 캐시로 DB 호출 대폭 감소.
 * 5~10분 stale 허용 (뉴스 실시간성 낮음).
 *
 * 장기적으로는 posts.summary 컬럼 추가해서 content fetch 제거 필요.
 */
export async function getNewsPosts(boardSlug: string): Promise<NewsItem[]> {
  return unstable_cache(
    () => _fetchNewsPostsImpl(boardSlug),
    ['news-posts', boardSlug],
    { revalidate: 600, tags: ['news-posts', `news-posts-${boardSlug}`] }
  )();
}

/**
 * 여러 게시판에서 뉴스를 가져와서 날짜순으로 정렬합니다.
 */
export async function getAllNewsPosts(boardSlugs: string[]): Promise<NewsItem[]> {
  // 병렬로 모든 게시판에서 가져오기
  const newsArrays = await Promise.all(
    boardSlugs.map(slug => getNewsPosts(slug))
  );

  // 합치고 날짜순 정렬
  return newsArrays
    .flat()
    .sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      return dateB - dateA; // 최신순
    })
    .slice(0, POSTS_LIMIT);
}
