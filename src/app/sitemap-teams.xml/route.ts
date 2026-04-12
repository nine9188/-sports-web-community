import { siteConfig } from '@/shared/config';
import { supabase, toIso, sitemapResponse } from '@/shared/utils/sitemap';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = siteConfig.url;

  const { data: teams } = await supabase
    .from('football_teams')
    .select('team_id, updated_at')
    .eq('is_active', true);

  return sitemapResponse(
    (teams || []).map((t) => ({
      url: `${baseUrl}/livescore/football/team/${t.team_id}`,
      lastModified: toIso(t.updated_at),
      changeFrequency: 'weekly',
      priority: 0.7,
    }))
  );
}
