import { siteConfig } from '@/shared/config';
import {
  getSitemapSupabase,
  fetchAll,
  buildUrlsetXml,
  sitemapResponse,
  REVALIDATE,
} from '../../utils';

// 일반 게시판은 1시간, recent는 10분
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ board: string }> }
) {
  const rawParams = await params;
  const board = rawParams.board.replace(/\.xml$/, '');
  const baseUrl = siteConfig.url;
  const supabase = getSitemapSupabase();

  try {
    // recent: 최근 24시간 이내 전체 게시글
    if (board === 'recent') {
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);

      const posts = await fetchAll((from, to) =>
        supabase
          .from('posts')
          .select('post_number, updated_at, created_at, board:boards!inner(slug)')
          .eq('is_deleted', false)
          .gte('created_at', oneDayAgo.toISOString())
          .order('created_at', { ascending: false })
          .range(from, to)
      );

      const urls = posts
        .filter((p) => p.board && typeof p.board === 'object' && 'slug' in p.board)
        .map((p) => ({
          loc: `${baseUrl}/boards/${(p.board as { slug: string }).slug}/${p.post_number}`,
          lastmod: p.updated_at
            ? new Date(p.updated_at).toISOString()
            : p.created_at
              ? new Date(p.created_at).toISOString()
              : undefined,
        }));

      return sitemapResponse(buildUrlsetXml(urls), REVALIDATE.REALTIME);
    }

    // 특정 게시판 slug의 게시글
    const { data: boardData } = await supabase
      .from('boards')
      .select('id')
      .eq('slug', board)
      .single();

    if (!boardData) {
      return sitemapResponse(buildUrlsetXml([]), REVALIDATE.FREQUENT);
    }

    const posts = await fetchAll((from, to) =>
      supabase
        .from('posts')
        .select('post_number, updated_at')
        .eq('board_id', boardData.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(from, to)
    );

    const urls = posts.map((p) => ({
      loc: `${baseUrl}/boards/${board}/${p.post_number}`,
      lastmod: p.updated_at ? new Date(p.updated_at).toISOString() : undefined,
    }));

    return sitemapResponse(buildUrlsetXml(urls), REVALIDATE.FREQUENT);
  } catch (error) {
    console.error(`Posts sitemap error (${board}):`, error);
    return sitemapResponse(buildUrlsetXml([]), REVALIDATE.FREQUENT);
  }
}
