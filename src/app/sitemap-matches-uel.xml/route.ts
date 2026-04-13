import { siteConfig } from '@/shared/config';
import { supabase, toIso, sitemapResponse, safeSitemap } from '@/shared/utils/sitemap';

export const revalidate = 3600;

export async function GET() {
  return safeSitemap(async () => {
    const baseUrl = siteConfig.url;

    const { data: matches } = await supabase
      .rpc('get_sitemap_matches', { target_league_id: 3 });

    return sitemapResponse(
      (matches || []).map((m: { match_id: number; updated_at: string | null }) => ({
        url: `${baseUrl}/livescore/football/match/${m.match_id}`,
        lastModified: toIso(m.updated_at),
        changeFrequency: 'daily',
        priority: 0.7,
      }))
    );
  });
}
