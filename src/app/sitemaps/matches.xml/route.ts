import { siteConfig } from '@/shared/config';
import { getSitemapSupabase, fetchAll, buildUrlsetXml, sitemapResponse } from '../utils';

export const revalidate = 3600;

export async function GET() {
  const baseUrl = siteConfig.url;
  const supabase = getSitemapSupabase();

  try {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const matches = await fetchAll((from, to) =>
      supabase
        .from('match_cache')
        .select('match_id, updated_at')
        .eq('data_type', 'full')
        .gte('updated_at', threeMonthsAgo.toISOString())
        .order('updated_at', { ascending: false })
        .range(from, to)
    );

    const urls = matches.map((m) => ({
      loc: `${baseUrl}/livescore/football/match/${m.match_id}`,
      lastmod: m.updated_at ? new Date(m.updated_at).toISOString() : undefined,
    }));

    return sitemapResponse(buildUrlsetXml(urls));
  } catch (error) {
    console.error('Matches sitemap error:', error);
    return sitemapResponse(buildUrlsetXml([]));
  }
}
