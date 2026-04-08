import { siteConfig } from '@/shared/config';
import { getSitemapSupabase } from '../sitemaps/utils';

export const revalidate = 3600;

export async function GET() {
  const baseUrl = siteConfig.url;
  const supabase = getSitemapSupabase();

  // 각 사이트맵의 실제 최신 콘텐츠 시간을 조회
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const [postsResult, matchesResult, teamsResult, playersResult] = await Promise.all([
    supabase
      .from('posts')
      .select('updated_at')
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('match_cache')
      .select('updated_at')
      .eq('data_type', 'full')
      .gte('updated_at', threeMonthsAgo.toISOString())
      .order('updated_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('football_teams')
      .select('updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('football_players')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single(),
  ]);

  const toIso = (val: { updated_at?: string } | null) =>
    val?.updated_at ? new Date(val.updated_at).toISOString() : undefined;

  const sitemaps: { name: string; lastmod?: string }[] = [
    { name: 'static', lastmod: toIso(postsResult.data) },
    { name: 'posts', lastmod: toIso(postsResult.data) },
    { name: 'matches', lastmod: toIso(matchesResult.data) },
    { name: 'teams', lastmod: toIso(teamsResult.data) },
    { name: 'players', lastmod: toIso(playersResult.data) },
  ];

  const sitemapEntries = sitemaps.map(
    (s) => {
      let entry = `  <sitemap>\n    <loc>${baseUrl}/sitemaps/${s.name}.xml</loc>`;
      if (s.lastmod) entry += `\n    <lastmod>${s.lastmod}</lastmod>`;
      entry += `\n  </sitemap>`;
      return entry;
    }
  ).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
