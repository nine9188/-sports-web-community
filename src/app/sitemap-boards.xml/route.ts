import { siteConfig } from '@/shared/config';
import { supabase, sitemapResponse } from '@/shared/utils/sitemap';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = siteConfig.url;

  const { data: boards } = await supabase
    .from('boards')
    .select('slug, team_id')
    .not('slug', 'is', null);

  return sitemapResponse(
    (boards || [])
      .filter((b) => b.slug)
      .map((b) => ({
        url: `${baseUrl}/boards/${b.slug}`,
        changeFrequency: 'daily',
        priority: b.team_id ? 0.6 : 0.7,
      }))
  );
}
