import { siteConfig } from '@/shared/config';
import {
  getSitemapSupabase,
  buildUrlsetXml,
  sitemapResponse,
  LEAGUES,
  REVALIDATE,
} from '../../utils';

export const dynamic = 'force-dynamic';

// /sitemaps/teams/epl.xml → slug = ["epl.xml"]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const league = (slug[0] || '').replace(/\.xml$/, '');
  const baseUrl = siteConfig.url;
  const supabase = getSitemapSupabase();

  try {
    const leagueConfig = LEAGUES.find((l) => l.slug === league);
    if (!leagueConfig) {
      return sitemapResponse(buildUrlsetXml([]), REVALIDATE.STANDARD);
    }

    const { data: teams } = await supabase
      .from('football_teams')
      .select('team_id, updated_at')
      .eq('league_id', leagueConfig.id)
      .eq('is_active', true)
      .order('team_id', { ascending: true });

    const urls = (teams || []).map((t) => ({
      loc: `${baseUrl}/livescore/football/team/${t.team_id}`,
      lastmod: t.updated_at ? new Date(t.updated_at).toISOString() : undefined,
    }));

    return sitemapResponse(buildUrlsetXml(urls), REVALIDATE.STANDARD);
  } catch (error) {
    console.error(`Teams sitemap error (${league}):`, error);
    return sitemapResponse(buildUrlsetXml([]), REVALIDATE.STANDARD);
  }
}
