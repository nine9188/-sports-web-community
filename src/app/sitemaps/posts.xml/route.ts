import { siteConfig } from '@/shared/config';
import { getSitemapSupabase, buildUrlsetXml, sitemapResponse } from '../utils';

export const revalidate = 3600;

export async function GET() {
  const baseUrl = siteConfig.url;
  const supabase = getSitemapSupabase();

  try {
    const { data: posts } = await supabase
      .from('posts')
      .select('post_number, updated_at, board:boards!inner(slug)')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (!posts) return sitemapResponse(buildUrlsetXml([]));

    const urls = posts
      .filter((p) => p.board && typeof p.board === 'object' && 'slug' in p.board)
      .map((p) => ({
        loc: `${baseUrl}/boards/${(p.board as { slug: string }).slug}/${p.post_number}`,
        lastmod: p.updated_at ? new Date(p.updated_at).toISOString() : undefined,
        changefreq: 'weekly',
        priority: 0.6,
      }));

    return sitemapResponse(buildUrlsetXml(urls));
  } catch (error) {
    console.error('Posts sitemap error:', error);
    return sitemapResponse(buildUrlsetXml([]));
  }
}
