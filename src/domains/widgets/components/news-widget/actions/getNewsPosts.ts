'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { NewsItem } from '../types';
import { extractImageFromContent, validateImageUrl } from '../utils';

/** 게시판당 가져올 게시글 수 */
const POSTS_LIMIT = 15;

/**
 * 단일 게시판에서 뉴스 게시글을 가져옵니다.
 */
export async function getNewsPosts(boardSlug: string): Promise<NewsItem[]> {
  try {
    const supabase = await getSupabaseServer();

    // 1. 게시판 정보 조회
    const { data: boardData, error: boardError } = await supabase
      .from('boards')
      .select('id, name')
      .eq('slug', boardSlug)
      .single();

    if (boardError || !boardData) {
      console.error(`게시판 조회 오류 (slug: ${boardSlug}):`, boardError);
      return [];
    }

    // 2. 게시글 조회
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, title, content, created_at, views, likes, post_number')
      .eq('board_id', boardData.id)
      .order('created_at', { ascending: false })
      .limit(POSTS_LIMIT);

    if (postsError || !posts) {
      console.error('게시글 조회 오류:', postsError);
      return [];
    }

    // 3. 데이터 포맷팅
    const newsItems: NewsItem[] = posts.map((post, index) => {
      // 콘텐츠를 문자열로 변환
      const content = typeof post.content === 'string'
        ? post.content
        : (post.content ? JSON.stringify(post.content) : '');

      // 요약 생성 (HTML 태그 제거)
      const plainText = content.replace(/<[^>]*>/g, '');
      const summary = plainText.slice(0, 150) + (plainText.length > 150 ? '...' : '');

      // 이미지 추출 및 검증 (이미지 없으면 undefined → 클라이언트에서 4590 로고로 대체)
      const extractedImage = extractImageFromContent(content);
      const imageUrl = extractedImage && validateImageUrl(extractedImage)
        ? extractedImage
        : undefined;

      return {
        id: post.id,
        title: post.title,
        summary,
        imageUrl,
        source: boardData.name,
        publishedAt: post.created_at || new Date().toISOString(),
        url: `/boards/${boardSlug}/${post.post_number || 0}`,
        postNumber: post.post_number || 0
      };
    });

    return newsItems;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error); if (!errorMessage.includes('DYNAMIC_SERVER_USAGE') && !errorMessage.includes('cookies')) { console.error('뉴스 게시글 가져오기 오류:', error); }
    return [];
  }
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
