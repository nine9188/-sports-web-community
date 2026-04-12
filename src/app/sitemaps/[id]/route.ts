import { NextRequest } from 'next/server';
import { siteConfig } from '@/shared/config';
import { LEAGUE_TEAM_MAPPINGS } from '@/domains/livescore/constants/teams';
import { HOTDEAL_BOARD_SLUGS } from '@/domains/boards/types/hotdeal/constants';

export const dynamic = 'force-dynamic';

// ─── Supabase REST ───
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function query<T>(table: string, params: string): Promise<T[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// ─── 리그 설정 ───
const LEAGUE_SITEMAP_CONFIG = [
  { leagueId: 39, slug: 'epl' },
  { leagueId: 140, slug: 'laliga' },
  { leagueId: 78, slug: 'bundesliga' },
  { leagueId: 135, slug: 'serie-a' },
  { leagueId: 61, slug: 'ligue1' },
  { leagueId: 40, slug: 'championship' },
  { leagueId: 179, slug: 'scottish' },
  { leagueId: 88, slug: 'eredivisie' },
  { leagueId: 94, slug: 'primeira' },
  { leagueId: 2, slug: 'ucl' },
  { leagueId: 3, slug: 'uel' },
  { leagueId: 848, slug: 'uecl' },
  { leagueId: 292, slug: 'kleague' },
  { leagueId: 98, slug: 'jleague' },
  { leagueId: 307, slug: 'saudi' },
  { leagueId: 169, slug: 'csl' },
  { leagueId: 253, slug: 'mls' },
  { leagueId: 71, slug: 'brasileirao' },
  { leagueId: 262, slug: 'liga-mx' },
  { leagueId: 119, slug: 'danish' },
] as const;

function getLeagueIdBySlug(slug: string): number | undefined {
  return LEAGUE_SITEMAP_CONFIG.find((l) => l.slug === slug)?.leagueId;
}

// ─── XML 생성 유틸 ───
interface SitemapEntry {
  url: string;
  lastModified?: string;
  changeFrequency?: string;
  priority?: number;
}

function toXml(entries: SitemapEntry[]): string {
  const urls = entries.map((e) => {
    let loc = `<url>\n<loc>${escapeXml(e.url)}</loc>`;
    if (e.lastModified) loc += `\n<lastmod>${e.lastModified}</lastmod>`;
    if (e.changeFrequency) loc += `\n<changefreq>${e.changeFrequency}</changefreq>`;
    if (typeof e.priority === 'number') loc += `\n<priority>${e.priority}</priority>`;
    loc += '\n</url>';
    return loc;
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
  ].join('\n');
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function xmlResponse(entries: SitemapEntry[]): Response {
  return new Response(toXml(entries), {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

function toIso(dateStr: string | null): string | undefined {
  if (!dateStr) return undefined;
  try {
    return new Date(dateStr).toISOString();
  } catch {
    return undefined;
  }
}

// ─── GET 핸들러 ───
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = rawId.replace(/\.xml$/, '');
  const baseUrl = siteConfig.url;

  // ── 정적 + 게시판 목록 ──
  if (id === 'static-and-boards') {
    const entries: SitemapEntry[] = [
      { url: baseUrl, lastModified: new Date().toISOString(), changeFrequency: 'daily', priority: 1.0 },
      { url: `${baseUrl}/about`, changeFrequency: 'monthly', priority: 0.5 },
      { url: `${baseUrl}/guide`, changeFrequency: 'monthly', priority: 0.5 },
      { url: `${baseUrl}/contact`, changeFrequency: 'monthly', priority: 0.3 },
      { url: `${baseUrl}/privacy`, changeFrequency: 'monthly', priority: 0.3 },
      { url: `${baseUrl}/terms`, changeFrequency: 'monthly', priority: 0.3 },
      { url: `${baseUrl}/transfers`, changeFrequency: 'daily', priority: 0.6 },
      { url: `${baseUrl}/livescore/football`, changeFrequency: 'always', priority: 0.9 },
      { url: `${baseUrl}/livescore/football/leagues`, changeFrequency: 'weekly', priority: 0.7 },
      { url: `${baseUrl}/shop`, changeFrequency: 'weekly', priority: 0.4 },
      { url: `${baseUrl}/boards/all`, changeFrequency: 'daily', priority: 0.7 },
      { url: `${baseUrl}/boards/popular`, changeFrequency: 'daily', priority: 0.7 },
      { url: `${baseUrl}/search`, changeFrequency: 'weekly', priority: 0.5 },
    ];

    // 핫딜 게시판
    for (const slug of HOTDEAL_BOARD_SLUGS) {
      entries.push({ url: `${baseUrl}/boards/${slug}`, changeFrequency: 'daily', priority: 0.6 });
    }

    // DB 게시판
    const boards = await query<{ slug: string; team_id: number | null }>(
      'boards',
      'select=slug,team_id&slug=not.is.null'
    );
    const hotdealSet = new Set<string>(HOTDEAL_BOARD_SLUGS);
    for (const b of boards) {
      if (b.slug && !hotdealSet.has(b.slug)) {
        entries.push({
          url: `${baseUrl}/boards/${b.slug}`,
          changeFrequency: 'daily',
          priority: b.team_id ? 0.6 : 0.7,
        });
      }
    }

    return xmlResponse(entries);
  }

  // ── 게시글: 리그/팀 통합 ──
  if (id.startsWith('posts-') && id !== 'posts-hotdeal-etc') {
    const leagueSlug = id.replace('posts-', '');
    const leagueId = getLeagueIdBySlug(leagueSlug);
    if (!leagueId) return xmlResponse([]);

    const boards = await query<{ id: string; slug: string }>(
      'boards',
      `select=id,slug&league_id=eq.${leagueId}&slug=not.is.null`
    );
    if (!boards.length) return xmlResponse([]);

    const boardMap = new Map(boards.map((b) => [b.id, b.slug]));
    const boardIds = boards.map((b) => b.id);

    const posts = await query<{ post_number: number; board_id: string; updated_at: string | null }>(
      'posts',
      `select=post_number,board_id,updated_at&board_id=in.(${boardIds.join(',')})&is_deleted=eq.false&is_published=eq.true&order=created_at.desc&limit=5000`
    );

    return xmlResponse(
      posts
        .filter((p) => boardMap.get(p.board_id))
        .map((p) => ({
          url: `${baseUrl}/boards/${boardMap.get(p.board_id)}/${p.post_number}`,
          lastModified: toIso(p.updated_at),
          changeFrequency: 'weekly',
          priority: 0.5,
        }))
    );
  }

  // ── 게시글: 핫딜 + 기타 ──
  if (id === 'posts-hotdeal-etc') {
    const hotdealBoards = await query<{ id: string; slug: string }>(
      'boards',
      `select=id,slug&slug=in.(${HOTDEAL_BOARD_SLUGS.join(',')})`
    );
    const otherBoards = await query<{ id: string; slug: string }>(
      'boards',
      'select=id,slug&slug=not.is.null&team_id=is.null&league_id=is.null'
    );

    const hotdealSet = new Set<string>(HOTDEAL_BOARD_SLUGS);
    const allBoards = [
      ...hotdealBoards,
      ...otherBoards.filter((b) => b.slug && !hotdealSet.has(b.slug)),
    ];
    if (!allBoards.length) return xmlResponse([]);

    const boardMap = new Map(allBoards.map((b) => [b.id, b.slug]));
    const boardIds = allBoards.map((b) => b.id);

    const posts = await query<{ post_number: number; board_id: string; updated_at: string | null }>(
      'posts',
      `select=post_number,board_id,updated_at&board_id=in.(${boardIds.join(',')})&is_deleted=eq.false&is_published=eq.true&order=created_at.desc&limit=5000`
    );

    return xmlResponse(
      posts
        .filter((p) => boardMap.get(p.board_id))
        .map((p) => ({
          url: `${baseUrl}/boards/${boardMap.get(p.board_id)}/${p.post_number}`,
          lastModified: toIso(p.updated_at),
          changeFrequency: 'weekly',
          priority: 0.5,
        }))
    );
  }

  // ── 팀 + 선수 ──
  if (id.startsWith('sports-')) {
    const leagueSlug = id.replace('sports-', '');
    const leagueId = getLeagueIdBySlug(leagueSlug);
    if (!leagueId) return xmlResponse([]);

    const entries: SitemapEntry[] = [];

    const teams = LEAGUE_TEAM_MAPPINGS[leagueId as keyof typeof LEAGUE_TEAM_MAPPINGS] || [];
    const dbTeams = await query<{ team_id: number; updated_at: string | null }>(
      'football_teams',
      `select=team_id,updated_at&league_id=eq.${leagueId}&is_active=eq.true`
    );

    const teamIds = new Set(teams.map((t) => t.id));
    for (const team of teams) {
      const dbTeam = dbTeams.find((t) => t.team_id === team.id);
      entries.push({
        url: `${baseUrl}/livescore/football/team/${team.id}`,
        lastModified: toIso(dbTeam?.updated_at ?? null),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
    for (const dbTeam of dbTeams) {
      if (!teamIds.has(dbTeam.team_id)) {
        entries.push({
          url: `${baseUrl}/livescore/football/team/${dbTeam.team_id}`,
          lastModified: toIso(dbTeam.updated_at),
          changeFrequency: 'weekly',
          priority: 0.6,
        });
      }
    }

    // 선수
    const allTeamIds = teams.map((t) => t.id);
    if (allTeamIds.length > 0) {
      const players = await query<{ player_id: number; updated_at: string | null }>(
        'football_players',
        `select=player_id,updated_at&team_id=in.(${allTeamIds.join(',')})&is_active=eq.true&order=popularity_score.desc&limit=5000`
      );
      for (const p of players) {
        entries.push({
          url: `${baseUrl}/livescore/football/player/${p.player_id}`,
          lastModified: toIso(p.updated_at),
          changeFrequency: 'weekly',
          priority: 0.6,
        });
      }
    }

    return xmlResponse(entries);
  }

  // ── 매치 ──
  if (id.startsWith('matches-')) {
    const leagueSlug = id.replace('matches-', '');
    const leagueId = getLeagueIdBySlug(leagueSlug);
    if (!leagueId) return xmlResponse([]);

    const matches = await query<{ fixture_id: number; match_date: string | null }>(
      'match_ai_predictions',
      `select=fixture_id,match_date&league_id=eq.${leagueId}&is_active=eq.true&order=match_date.desc&limit=5000`
    );

    return xmlResponse(
      matches.map((m) => ({
        url: `${baseUrl}/livescore/football/match/${m.fixture_id}`,
        lastModified: toIso(m.match_date),
        changeFrequency: 'daily',
        priority: 0.7,
      }))
    );
  }

  // ── 리그 페이지 ──
  if (id === 'leagues') {
    const leagues = await query<{ id: number }>('leagues', 'select=id');
    return xmlResponse(
      leagues.map((l) => ({
        url: `${baseUrl}/livescore/football/leagues/${l.id}`,
        changeFrequency: 'weekly',
        priority: 0.7,
      }))
    );
  }

  return xmlResponse([]);
}
