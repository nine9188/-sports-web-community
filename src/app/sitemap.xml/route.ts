import { siteConfig } from '@/shared/config';
import {
  getSitemapSupabase,
  buildSitemapIndexXml,
  sitemapResponse,
  LEAGUES,
  ALL_MATCH_LEAGUES,
  teamNameToSlug,
  REVALIDATE,
} from '../sitemaps/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = siteConfig.url;
  const supabase = getSitemapSupabase();
  const now = new Date().toISOString();

  const sitemaps: { loc: string; lastmod?: string }[] = [];

  // ─── 1. static.xml ───────────────────────────────────────────────
  sitemaps.push({ loc: `${baseUrl}/sitemaps/static.xml`, lastmod: now });

  // ─── 2. posts — 게시판별 ─────────────────────────────────────────
  try {
    const { data: boards } = await supabase
      .from('boards')
      .select('slug, created_at')
      .not('slug', 'is', null);

    if (boards) {
      for (const board of boards) {
        if (board.slug) {
          sitemaps.push({
            loc: `${baseUrl}/sitemaps/posts/${board.slug}.xml`,
            lastmod: board.created_at ? new Date(board.created_at).toISOString() : undefined,
          });
        }
      }

      sitemaps.push({ loc: `${baseUrl}/sitemaps/posts/recent.xml`, lastmod: now });
    }
  } catch (error) {
    console.error('Sitemap index: boards error', error);
  }

  // ─── 3. players — 리그/팀별 + teams — 리그별 (단일 쿼리로 통합) ────
  try {
    // 선수가 존재하는 team_id 목록 (1회 쿼리)
    const { data: playerRows } = await supabase
      .from('football_players')
      .select('team_id')
      .limit(10000);

    const teamIdsWithPlayers = new Set(
      (playerRows || []).map((p) => p.team_id)
    );

    // 리그별 팀 조회 (teams + players 사이트맵 동시 생성)
    for (const league of LEAGUES) {
      const { data: teams } = await supabase
        .from('football_teams')
        .select('team_id, name, updated_at')
        .eq('league_id', league.id)
        .eq('is_active', true)
        .order('team_id', { ascending: true });

      // teams 사이트맵
      sitemaps.push({ loc: `${baseUrl}/sitemaps/teams/${league.slug}.xml` });

      // players 사이트맵 (선수 있는 팀만)
      if (teams) {
        for (const team of teams) {
          if (!teamIdsWithPlayers.has(team.team_id)) continue;
          sitemaps.push({
            loc: `${baseUrl}/sitemaps/players/${league.slug}/${teamNameToSlug(team.name)}.xml`,
          });
        }
      }
    }
  } catch (error) {
    console.error('Sitemap index: players/teams error', error);
  }

  // ─── 4. matches — 리그별 (존재 여부 체크 없이 모두 나열) ───────────
  // 개별 라우트에서 데이터 없으면 404 반환하므로 인덱스에서는 체크 불필요
  for (const league of ALL_MATCH_LEAGUES) {
    sitemaps.push({ loc: `${baseUrl}/sitemaps/matches/${league.slug}.xml` });
  }

  return sitemapResponse(buildSitemapIndexXml(sitemaps), REVALIDATE.FREQUENT);
}
