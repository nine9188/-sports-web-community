import { siteConfig } from '@/shared/config';
import { supabase, toIso, sitemapResponse } from '@/shared/utils/sitemap';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = siteConfig.url;

  const { data: players } = await supabase
    .from('football_players')
    .select('player_id, updated_at')
    .eq('is_active', true)
    .order('popularity_score', { ascending: false });

  return sitemapResponse(
    (players || []).map((p) => ({
      url: `${baseUrl}/livescore/football/player/${p.player_id}`,
      lastModified: toIso(p.updated_at),
      changeFrequency: 'weekly',
      priority: 0.6,
    }))
  );
}
