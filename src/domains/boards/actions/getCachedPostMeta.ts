'use server';

import { unstable_cache } from 'next/cache';
import { getSupabaseAdmin } from '@/shared/lib/supabase/server';
import { extractSummary } from '@/domains/boards/utils/post/extractSummary';

/**
 * 게시글 메타데이터 fetch (캐시 미스 시 실행)
 * content 대신 summary 컬럼 사용 (description용, egress 절감)
 */
async function fetchPostMeta(boardId: string, postNumber: number) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('posts')
    .select('id, title, summary, thumbnail_url, created_at, updated_at')
    .eq('board_id', boardId)
    .eq('post_number', postNumber)
    .single();

  if (!data?.id) return data;

  const { data: contentRow } = await supabase
    .from('posts_content')
    .select('content, content_text')
    .eq('post_id', data.id)
    .maybeSingle();

  const contentSummary = extractSummary(contentRow?.content, 200) || contentRow?.content_text || '';

  return {
    ...data,
    content_summary: contentSummary,
  };
}

/**
 * 게시글 메타데이터 조회 (generateMetadata 전용, per-post 캐싱)
 *
 * - 1시간 캐시
 * - 게시글 편집/삭제 시 revalidateTag(`post-${boardId}-${postNumber}`, 'default') 호출로 무효화
 *
 * NOTE: Next.js unstable_cache는 dynamic tags를 지원 안 하므로
 *       per-post 태그를 위해 매 호출 시 wrapper 생성 (cache hit/miss는 정상 작동).
 *       wrapper 생성 오버헤드는 무시할 수준 (~수 마이크로초).
 */
export async function getCachedPostMeta(boardId: string, postNumber: number) {
  return unstable_cache(
    () => fetchPostMeta(boardId, postNumber),
    ['post-meta', boardId, String(postNumber)],
    {
      revalidate: 3600,
      tags: [`post-${boardId}-${postNumber}`, 'posts-meta'],
    }
  )();
}
