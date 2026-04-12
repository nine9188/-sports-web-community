import { siteConfig } from '@/shared/config';
import { supabase, sitemapResponse } from '@/shared/utils/sitemap';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = siteConfig.url;

  const { data: leagues } = await supabase
    .from('leagues')
    .select('id');

  return sitemapResponse(
    (leagues || []).map((l) => ({
      url: `${baseUrl}/livescore/football/leagues/${l.id}`,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))
  );
}
