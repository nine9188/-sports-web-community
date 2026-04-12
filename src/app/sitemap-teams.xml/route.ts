import { siteConfig } from '@/shared/config';
import { query, toIso, sitemapResponse } from '@/shared/utils/sitemap';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = siteConfig.url;

  const teams = await query<{ team_id: number; updated_at: string | null }>(
    'football_teams',
    'select=team_id,updated_at&is_active=eq.true'
  );

  return sitemapResponse(
    teams.map((t) => ({
      url: `${baseUrl}/livescore/football/team/${t.team_id}`,
      lastModified: toIso(t.updated_at),
      changeFrequency: 'weekly',
      priority: 0.7,
    }))
  );
}
