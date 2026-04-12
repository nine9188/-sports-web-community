import { siteConfig } from '@/shared/config';
import { supabase, toIso, sitemapResponse } from '@/shared/utils/sitemap';

export const dynamic = 'force-dynamic';

export async function GET() {
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
      .filter((p) => boardMap.get(p.board_id))
      .map((p) => ({
        url: `${baseUrl}/boards/${boardMap.get(p.board_id)}/${p.post_number}`,
        lastModified: toIso(p.updated_at),
        changeFrequency: 'weekly',
        priority: 0.5,
      }))
  );
}
