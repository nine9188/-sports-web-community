import { siteConfig } from '@/shared/config';
import { supabase, toIso, sitemapResponse, safeSitemap } from '@/shared/utils/sitemap';

export const revalidate = 3600;

export async function GET() {
  return safeSitemap(async () => {
    const baseUrl = siteConfig.url;

    const { data: teams } = await supabase
      .from('football_teams')
      .select('team_id')
      .eq('league_id', 98)
      .eq('is_active', true);

    if (!teams?.length) return sitemapResponse([]);

    const teamIds = teams.map((t) => t.team_id);

    const { data: players } = await supabase
      .from('football_players')
      .select('player_id, updated_at')
      .in('team_id', teamIds)
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
  });
}
