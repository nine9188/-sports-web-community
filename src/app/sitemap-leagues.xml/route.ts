import { siteConfig } from '@/shared/config';
import { query, sitemapResponse } from '@/shared/utils/sitemap';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = siteConfig.url;

  const leagues = await query<{ id: number }>('leagues', 'select=id');

  return sitemapResponse(
    leagues.map((l) => ({
      url: `${baseUrl}/livescore/football/leagues/${l.id}`,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))
  );
}
