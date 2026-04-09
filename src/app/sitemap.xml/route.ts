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
      // 게시판별 최신 게시글 시간: RPC 대신 간단한 쿼리 (최신 1개만)
      const { data: latestPost } = await supabase
        .from('posts')
        .select('created_at')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      for (const board of boards) {
        if (board.slug) {
          sitemaps.push({
            loc: `${baseUrl}/sitemaps/posts/${board.slug}.xml`,
            lastmod: board.created_at ? new Date(board.created_at).toISOString() : undefined,
          });
        }
      }

      // recent (24시간 이내)
      sitemaps.push({
        loc: `${baseUrl}/sitemaps/posts/recent.xml`,
        lastmod: latestPost?.created_at ? new Date(latestPost.created_at).toISOString() : now,
      });
    }
  } catch (error) {
    console.error('Sitemap index: boards error', error);
  }

  // ─── 3. players — 리그/팀별 (선수가 있는 팀만) ────────────────────
  try {
    // 선수가 존재하는 team_id 목록 조회
    const { data: teamsWithPlayers } = await supabase
      .from('football_players')
      .select('team_id')
      .limit(10000);

    const teamIdsWithPlayers = new Set(
      (teamsWithPlayers || []).map((p) => p.team_id)
    );

    for (const league of LEAGUES) {
      const { data: teams } = await supabase
        .from('football_teams')
        .select('team_id, name, updated_at')
        .eq('league_id', league.id)
        .eq('is_active', true)
        .order('team_id', { ascending: true });

      if (teams) {
        for (const team of teams) {
          // 선수가 없는 팀은 사이트맵 인덱스에서 제외
          if (!teamIdsWithPlayers.has(team.team_id)) continue;
          sitemaps.push({
            loc: `${baseUrl}/sitemaps/players/${league.slug}/${teamNameToSlug(team.name)}.xml`,
            lastmod: team.updated_at ? new Date(team.updated_at).toISOString() : undefined,
          });
        }
      }
    }
  } catch (error) {
    console.error('Sitemap index: players error', error);
  }

  // ─── 4. teams — 리그별 ──────────────────────────────────────────
  try {
    for (const league of LEAGUES) {
      const { data: latestTeam } = await supabase
        .from('football_teams')
        .select('updated_at')
        .eq('league_id', league.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      sitemaps.push({
        loc: `${baseUrl}/sitemaps/teams/${league.slug}.xml`,
        lastmod: latestTeam?.updated_at ? new Date(latestTeam.updated_at).toISOString() : undefined,
      });
    }
  } catch (error) {
    console.error('Sitemap index: teams error', error);
  }

  // ─── 5. matches — live, upcoming, 리그별 ─────────────────────────
  sitemaps.push({ loc: `${baseUrl}/sitemaps/matches/live.xml`, lastmod: now });
  sitemaps.push({ loc: `${baseUrl}/sitemaps/matches/upcoming.xml`, lastmod: now });

  try {
    for (const league of ALL_MATCH_LEAGUES) {
      sitemaps.push({
        loc: `${baseUrl}/sitemaps/matches/${league.slug}.xml`,
        lastmod: now,
      });
    }
  } catch (error) {
    console.error('Sitemap index: matches error', error);
  }

  return sitemapResponse(buildSitemapIndexXml(sitemaps), REVALIDATE.FREQUENT);
}
