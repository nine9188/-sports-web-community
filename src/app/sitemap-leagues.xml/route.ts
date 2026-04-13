import { siteConfig } from '@/shared/config';
import { supabase, sitemapResponse, safeSitemap } from '@/shared/utils/sitemap';

export const revalidate = 3600;

export async function GET() {
  return safeSitemap(async () => {
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
  });
}
