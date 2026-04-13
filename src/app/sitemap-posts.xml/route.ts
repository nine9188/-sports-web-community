import { siteConfig } from '@/shared/config';
import { supabase, toIso, sitemapResponse, safeSitemap } from '@/shared/utils/sitemap';

export const revalidate = 3600;

export async function GET() {
  return safeSitemap(async () => {
    const baseUrl = siteConfig.url;

    const { data: boards } = await supabase
      .from('boards').select('id, slug').not('slug', 'is', null);

    if (!boards?.length) return sitemapResponse([]);

    const boardMap = new Map(boards.map((b) => [b.id, b.slug]));
    const boardIds = boards.map((b) => b.id);

    const { data: posts } = await supabase
      .from('posts')
      .select('post_number, board_id, updated_at')
      .in('board_id', boardIds)
      .eq('is_deleted', false)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    return sitemapResponse(
      (posts || [])
        .filter((p) => p.board_id && boardMap.has(p.board_id))
        .map((p) => ({
          url: `${baseUrl}/boards/${boardMap.get(p.board_id)!}/${p.post_number}`,
          lastModified: toIso(p.updated_at),
          changeFrequency: 'weekly',
          priority: 0.5,
        }))
    );
  });
}
