import { siteConfig } from '@/shared/config';
import {
  getSitemapSupabase,
  buildUrlsetXml,
  sitemapResponse,
  LEAGUES,
  teamNameToSlug,
  REVALIDATE,
} from '../../../utils';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ league: string; team: string }> }
) {
  const rawParams = await params;
  // Next.js 동적 라우트 [team].xml에서 .xml이 포함될 수 있음
  const league = rawParams.league.replace(/\.xml$/, '');
  const team = rawParams.team.replace(/\.xml$/, '');
  const baseUrl = siteConfig.url;
  const supabase = getSitemapSupabase();

  try {
    const leagueConfig = LEAGUES.find((l) => l.slug === league);
    if (!leagueConfig) {
      return sitemapResponse(buildUrlsetXml([]), REVALIDATE.STANDARD);
    }

    // 리그에 속한 팀 중 slug가 일치하는 팀 찾기
    const { data: teams } = await supabase
      .from('football_teams')
      .select('team_id, name')
      .eq('league_id', leagueConfig.id)
      .eq('is_active', true);

    const matchedTeam = teams?.find((t) => teamNameToSlug(t.name) === team);
    if (!matchedTeam) {
      return sitemapResponse(buildUrlsetXml([]), REVALIDATE.STANDARD);
    }

    // 해당 팀의 선수 목록
    const { data: players } = await supabase
      .from('football_players')
      .select('id, updated_at')
      .eq('team_id', matchedTeam.team_id)
      .order('id', { ascending: true });

    const urls = (players || []).map((p) => ({
      loc: `${baseUrl}/livescore/football/player/${p.id}`,
      lastmod: p.updated_at ? new Date(p.updated_at).toISOString() : undefined,
    }));

    return sitemapResponse(buildUrlsetXml(urls), REVALIDATE.STANDARD);
  } catch (error) {
    console.error(`Players sitemap error (${league}/${team}):`, error);
    return sitemapResponse(buildUrlsetXml([]), REVALIDATE.STANDARD);
  }
}
