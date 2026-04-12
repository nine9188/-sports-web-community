import { siteConfig } from '@/shared/config';
import { query, toIso, sitemapResponse } from '@/shared/utils/sitemap';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = siteConfig.url;

  const matches = await query<{ fixture_id: number; match_date: string | null }>(
    'match_ai_predictions',
    'select=fixture_id,match_date&is_active=eq.true&order=match_date.desc&limit=45000'
  );

  return sitemapResponse(
    matches.map((m) => ({
      url: `${baseUrl}/livescore/football/match/${m.fixture_id}`,
      lastModified: toIso(m.match_date),
      changeFrequency: 'daily',
      priority: 0.7,
    }))
  );
}
