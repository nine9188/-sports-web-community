import { siteConfig } from '@/shared/config';
import { getSitemapSupabase, buildUrlsetXml, sitemapResponse } from '../utils';

export const revalidate = 3600;

export async function GET() {
  const baseUrl = siteConfig.url;
  const supabase = getSitemapSupabase();

  try {
    const { data: players } = await supabase
      .from('football_players')
      .select('id, updated_at')
      .order('id', { ascending: true });

    if (!players) return sitemapResponse(buildUrlsetXml([]));

    const urls = players.map((p) => ({
      loc: `${baseUrl}/livescore/football/player/${p.id}`,
      lastmod: p.updated_at ? new Date(p.updated_at).toISOString() : undefined,
      changefreq: 'monthly',
      priority: 0.5,
    }));

    return sitemapResponse(buildUrlsetXml(urls));
  } catch (error) {
    console.error('Players sitemap error:', error);
    return sitemapResponse(buildUrlsetXml([]));
  }
}
