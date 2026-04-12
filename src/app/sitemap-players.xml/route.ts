import { siteConfig } from '@/shared/config';
import { query, toIso, sitemapResponse } from '@/shared/utils/sitemap';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = siteConfig.url;

  const players = await query<{ player_id: number; updated_at: string | null }>(
    'football_players',
    'select=player_id,updated_at&is_active=eq.true&order=popularity_score.desc&limit=45000'
  );

  return sitemapResponse(
    players.map((p) => ({
      url: `${baseUrl}/livescore/football/player/${p.player_id}`,
      lastModified: toIso(p.updated_at),
      changeFrequency: 'weekly',
      priority: 0.6,
    }))
  );
}
