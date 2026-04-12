import { siteConfig } from '@/shared/config';
import { supabase, toIso, sitemapResponse } from '@/shared/utils/sitemap';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = siteConfig.url;

  const { data: matches } = await supabase
    .from('match_ai_predictions')
    .select('fixture_id, match_date')
    .order('match_date', { ascending: false })
    .limit(10000);

  return sitemapResponse(
    (matches || []).map((m) => ({
      url: `${baseUrl}/livescore/football/match/${m.fixture_id}`,
      lastModified: toIso(m.match_date),
      changeFrequency: 'daily',
      priority: 0.7,
    }))
  );
}
