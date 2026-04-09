import { siteConfig } from '@/shared/config';
import {
  getSitemapSupabase,
  fetchAll,
  buildUrlsetXml,
  sitemapResponse,
  ALL_MATCH_LEAGUES,
  REVALIDATE,
} from '../../utils';

export const dynamic = 'force-dynamic';

// /sitemaps/matches/epl.xml → slug = ["epl.xml"]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const league = (slug[0] || '').replace(/\.xml$/, '');
  const baseUrl = siteConfig.url;
  const supabase = getSitemapSupabase();

  try {
    // live: 오늘 경기 (10분 캐시)
    if (league === 'live') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const { data: matches } = await supabase
        .from('match_cache')
        .select('match_id, updated_at')
        .eq('data_type', 'full')
        .gte('updated_at', todayStart.toISOString())
        .lte('updated_at', todayEnd.toISOString())
        .order('updated_at', { ascending: false });

      const urls = (matches || []).map((m) => ({
        loc: `${baseUrl}/livescore/football/match/${m.match_id}`,
        lastmod: m.updated_at ? new Date(m.updated_at).toISOString() : undefined,
      }));

      if (urls.length === 0) return new Response('Not Found', { status: 404 });
      return sitemapResponse(buildUrlsetXml(urls), REVALIDATE.REALTIME);
    }

    // upcoming: 향후 7일 경기 (1시간 캐시)
    if (league === 'upcoming') {
      const { data: matches } = await supabase
        .from('match_cache')
        .select('match_id, updated_at')
        .eq('data_type', 'full')
        .eq('match_status', 'NS')
        .order('updated_at', { ascending: false })
        .limit(500);

      const urls = (matches || []).map((m) => ({
        loc: `${baseUrl}/livescore/football/match/${m.match_id}`,
        lastmod: m.updated_at ? new Date(m.updated_at).toISOString() : undefined,
      }));

      if (urls.length === 0) return new Response('Not Found', { status: 404 });
      return sitemapResponse(buildUrlsetXml(urls), REVALIDATE.FREQUENT);
    }

    // 리그별 과거 경기 (6시간 캐시)
    const leagueConfig = ALL_MATCH_LEAGUES.find((l) => l.slug === league);
    if (!leagueConfig) {
      return sitemapResponse(buildUrlsetXml([]), REVALIDATE.STANDARD);
    }

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // DB에서 JSON 필터링 (data 컬럼 전체를 가져오지 않음)
    const matches = await fetchAll((from, to) =>
      supabase
        .from('match_cache')
        .select('match_id, updated_at')
        .eq('data_type', 'full')
        .filter('data->match->league->>id', 'eq', String(leagueConfig.id))
        .gte('updated_at', threeMonthsAgo.toISOString())
        .order('updated_at', { ascending: false })
        .range(from, to)
    );

    const urls = matches.map((m) => ({
      loc: `${baseUrl}/livescore/football/match/${m.match_id}`,
      lastmod: m.updated_at ? new Date(m.updated_at).toISOString() : undefined,
    }));

    if (urls.length === 0) return new Response('Not Found', { status: 404 });
    return sitemapResponse(buildUrlsetXml(urls), REVALIDATE.STANDARD);
  } catch (error) {
    console.error(`Matches sitemap error (${league}):`, error);
    return sitemapResponse(buildUrlsetXml([]), REVALIDATE.STANDARD);
  }
}
