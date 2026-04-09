import { siteConfig } from '@/shared/config';
import {
  getSitemapSupabase,
  buildUrlsetXml,
  sitemapResponse,
  LEAGUES,
  teamNameToSlug,
  REVALIDATE,
} from '../../utils';

export const revalidate = 21600; // 6시간

// /sitemaps/players/epl/arsenal.xml → slug = ["epl", "arsenal.xml"]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  if (slug.length < 2) return new Response('Not Found', { status: 404 });

  const league = slug[0];
  const team = slug[1].replace(/\.xml$/, '');
  const baseUrl = siteConfig.url;
  const supabase = getSitemapSupabase();

  try {
    const leagueConfig = LEAGUES.find((l) => l.slug === league);
    if (!leagueConfig) {
      return new Response('Not Found', { status: 404 });
    }

    // 리그에 속한 팀 중 slug가 일치하는 팀 찾기
    const { data: teams } = await supabase
      .from('football_teams')
      .select('team_id, name')
      .eq('league_id', leagueConfig.id)
      .eq('is_active', true);

    const matchedTeam = teams?.find((t) => teamNameToSlug(t.name) === team);
    if (!matchedTeam) {
      return new Response('Not Found', { status: 404 });
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

    // 선수가 없으면 빈 urlset 대신 404 반환 (Google이 XML 태그 누락 에러를 보고하지 않도록)
    if (urls.length === 0) {
      return new Response('Not Found', { status: 404 });
    }

    return sitemapResponse(buildUrlsetXml(urls), REVALIDATE.STANDARD);
  } catch (error) {
    console.error(`Players sitemap error (${league}/${team}):`, error);
    return sitemapResponse(buildUrlsetXml([]), REVALIDATE.STANDARD);
  }
}
