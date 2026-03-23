import { siteConfig } from '@/shared/config';
import { getSitemapSupabase, buildUrlsetXml, sitemapResponse } from '../utils';

export const revalidate = 3600;

export async function GET() {
  const baseUrl = siteConfig.url;
  const supabase = getSitemapSupabase();

  try {
    const { data: teams } = await supabase
      .from('football_teams')
      .select('id, updated_at')
      .eq('is_active', true)
      .order('id', { ascending: true });

    if (!teams) return sitemapResponse(buildUrlsetXml([]));

    const urls = teams.map((t) => ({
      loc: `${baseUrl}/livescore/football/team/${t.id}`,
      lastmod: t.updated_at ? new Date(t.updated_at).toISOString() : undefined,
      changefreq: 'weekly',
      priority: 0.6,
    }));

    return sitemapResponse(buildUrlsetXml(urls));
  } catch (error) {
    console.error('Teams sitemap error:', error);
    return sitemapResponse(buildUrlsetXml([]));
  }
}
