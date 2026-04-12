import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { siteConfig } from '@/shared/config';
import { LEAGUE_TEAM_MAPPINGS } from '@/domains/livescore/constants/teams';
import { HOTDEAL_BOARD_SLUGS } from '@/domains/boards/types/hotdeal/constants';

// 빌드 타임 prerendering 방지 (DB 의존 동적 사이트맵)
export const dynamic = 'force-dynamic';

// 빌드 타임에도 사용 가능한 쿠키 없는 Supabase 클라이언트
function getSupabaseForSitemap() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ─── 리그 사이트맵 설정 ───
const LEAGUE_SITEMAP_CONFIG = [
  // 유럽 Top 5
  { leagueId: 39, slug: 'epl' },
  { leagueId: 140, slug: 'laliga' },
  { leagueId: 78, slug: 'bundesliga' },
  { leagueId: 135, slug: 'serie-a' },
  { leagueId: 61, slug: 'ligue1' },
  // 유럽 2군
  { leagueId: 40, slug: 'championship' },
  { leagueId: 179, slug: 'scottish' },
  { leagueId: 88, slug: 'eredivisie' },
  { leagueId: 94, slug: 'primeira' },
  // 유럽 컵
  { leagueId: 2, slug: 'ucl' },
  { leagueId: 3, slug: 'uel' },
  { leagueId: 848, slug: 'uecl' },
  // 아시아
  { leagueId: 292, slug: 'kleague' },
  { leagueId: 98, slug: 'jleague' },
  { leagueId: 307, slug: 'saudi' },
  { leagueId: 169, slug: 'csl' },
  // 아메리카
  { leagueId: 253, slug: 'mls' },
  { leagueId: 71, slug: 'brasileirao' },
  { leagueId: 262, slug: 'liga-mx' },
  // 기타
  { leagueId: 119, slug: 'danish' },
] as const;

// 리그별로 팀이 존재하는 리그만 필터
const LEAGUES_WITH_TEAMS = LEAGUE_SITEMAP_CONFIG.filter(
  (l) => LEAGUE_TEAM_MAPPINGS[l.leagueId as keyof typeof LEAGUE_TEAM_MAPPINGS]?.length > 0
);

function getLeagueIdBySlug(slug: string): number | undefined {
  return LEAGUE_SITEMAP_CONFIG.find((l) => l.slug === slug)?.leagueId;
}

// ─── generateSitemaps: 사이트맵 분할 정의 ───
export async function generateSitemaps() {
  const supabase = getSupabaseForSitemap();

  // DB에서 모든 게시판 slug 조회
  const { data: boards } = await supabase
    .from('boards')
    .select('id, slug, team_id, league_id')
    .not('slug', 'is', null);

  // 게시판 분류
  const hotdealSlugs = new Set(HOTDEAL_BOARD_SLUGS);
  const teamBoards = boards?.filter((b) => b.team_id) || [];
  const leagueBoards = boards?.filter((b) => b.league_id && !b.team_id) || [];
  const otherBoards =
    boards?.filter((b) => !b.team_id && !b.league_id && !hotdealSlugs.has(b.slug!)) || [];

  // 팀 게시판을 리그별로 그룹핑
  const teamBoardLeagueIds = new Set<number>();
  for (const board of teamBoards) {
    if (board.league_id) teamBoardLeagueIds.add(board.league_id);
    // league_id가 없는 팀 게시판은 football_teams에서 조회 필요
  }

  const sitemaps: { id: string }[] = [];

  // 1. 정적 페이지
  sitemaps.push({ id: 'static' });

  // 2. 게시판 목록 페이지
  // 리그 게시판
  if (leagueBoards.length > 0) {
    sitemaps.push({ id: 'boards-league' });
  }
  // 팀 게시판 (리그별)
  for (const league of LEAGUES_WITH_TEAMS) {
    const hasTeamBoards = teamBoards.some(
      (b) => b.league_id === league.leagueId
    );
    if (hasTeamBoards) {
      sitemaps.push({ id: `boards-teams-${league.slug}` });
    }
  }
  // 핫딜 게시판
  sitemaps.push({ id: 'boards-hotdeal' });
  // 기타 게시판
  if (otherBoards.length > 0) {
    sitemaps.push({ id: 'boards-etc' });
  }

  // 3. 게시글 (게시판별)
  // 리그 게시판 게시글
  for (const board of leagueBoards) {
    if (board.slug) {
      sitemaps.push({ id: `posts-${board.slug}` });
    }
  }
  // 팀 게시판 게시글 (리그별 묶음)
  for (const league of LEAGUES_WITH_TEAMS) {
    const hasTeamBoards = teamBoards.some(
      (b) => b.league_id === league.leagueId
    );
    if (hasTeamBoards) {
      sitemaps.push({ id: `posts-teams-${league.slug}` });
    }
  }
  // 핫딜 게시글
  sitemaps.push({ id: 'posts-hotdeal' });
  // 기타 게시판 게시글
  for (const board of otherBoards) {
    if (board.slug) {
      sitemaps.push({ id: `posts-${board.slug}` });
    }
  }

  // 4. 팀 상세 페이지 (리그별)
  for (const league of LEAGUES_WITH_TEAMS) {
    sitemaps.push({ id: `teams-${league.slug}` });
  }

  // 5. 선수 상세 페이지 (리그별)
  for (const league of LEAGUES_WITH_TEAMS) {
    sitemaps.push({ id: `players-${league.slug}` });
  }

  // 6. 매치 상세 페이지 (리그별)
  for (const league of LEAGUE_SITEMAP_CONFIG) {
    sitemaps.push({ id: `matches-${league.slug}` });
  }

  // 7. 리그 페이지
  sitemaps.push({ id: 'leagues' });

  return sitemaps;
}

// ─── sitemap: 각 ID별 URL 생성 ───
export default async function sitemap({
  id,
}: {
  id: string;
}): Promise<MetadataRoute.Sitemap> {
  const supabase = getSupabaseForSitemap();
  const baseUrl = siteConfig.url;

  // ── 정적 페이지 ──
  if (id === 'static') {
    return [
      { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
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
  }

  // ── 리그 게시판 목록 ──
  if (id === 'boards-league') {
    const { data: boards } = await supabase
      .from('boards')
      .select('slug')
      .not('slug', 'is', null)
      .not('league_id', 'is', null)
      .is('team_id', null);

    return (boards || [])
      .filter((b) => b.slug)
      .map((b) => ({
        url: `${baseUrl}/boards/${b.slug}`,
        changeFrequency: 'daily' as const,
        priority: 0.7,
      }));
  }

  // ── 팀 게시판 목록 (리그별) ──
  if (id.startsWith('boards-teams-')) {
    const leagueSlug = id.replace('boards-teams-', '');
    const leagueId = getLeagueIdBySlug(leagueSlug);
    if (!leagueId) return [];

    const { data: boards } = await supabase
      .from('boards')
      .select('slug')
      .not('slug', 'is', null)
      .not('team_id', 'is', null)
      .eq('league_id', leagueId);

    return (boards || [])
      .filter((b) => b.slug)
      .map((b) => ({
        url: `${baseUrl}/boards/${b.slug}`,
        changeFrequency: 'daily' as const,
        priority: 0.6,
      }));
  }

  // ── 핫딜 게시판 목록 ──
  if (id === 'boards-hotdeal') {
    return HOTDEAL_BOARD_SLUGS.map((slug) => ({
      url: `${baseUrl}/boards/${slug}`,
      changeFrequency: 'daily' as const,
      priority: 0.6,
    }));
  }

  // ── 기타 게시판 목록 ──
  if (id === 'boards-etc') {
    const hotdealSlugs = new Set(HOTDEAL_BOARD_SLUGS);
    const { data: boards } = await supabase
      .from('boards')
      .select('slug')
      .not('slug', 'is', null)
      .is('team_id', null)
      .is('league_id', null);

    return (boards || [])
      .filter((b) => b.slug && !hotdealSlugs.has(b.slug))
      .map((b) => ({
        url: `${baseUrl}/boards/${b.slug}`,
        changeFrequency: 'daily' as const,
        priority: 0.6,
      }));
  }

  // ── 게시글: 팀 게시판 묶음 (리그별) ──
  if (id.startsWith('posts-teams-')) {
    const leagueSlug = id.replace('posts-teams-', '');
    const leagueId = getLeagueIdBySlug(leagueSlug);
    if (!leagueId) return [];

    // 해당 리그의 팀 게시판 ID들 조회
    const { data: teamBoards } = await supabase
      .from('boards')
      .select('id, slug')
      .not('team_id', 'is', null)
      .eq('league_id', leagueId);

    if (!teamBoards?.length) return [];

    const boardMap = new Map(teamBoards.map((b) => [b.id, b.slug]));
    const boardIds = teamBoards.map((b) => b.id);

    // 해당 게시판들의 게시글 조회
    const { data: posts } = await supabase
      .from('posts')
      .select('post_number, board_id, updated_at')
      .in('board_id', boardIds)
      .eq('is_deleted', false)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(5000);

    return (posts || [])
      .filter((p) => boardMap.get(p.board_id))
      .map((p) => ({
        url: `${baseUrl}/boards/${boardMap.get(p.board_id)}/${p.post_number}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      }));
  }

  // ── 게시글: 핫딜 ──
  if (id === 'posts-hotdeal') {
    const { data: hotdealBoards } = await supabase
      .from('boards')
      .select('id, slug')
      .in('slug', [...HOTDEAL_BOARD_SLUGS]);

    if (!hotdealBoards?.length) return [];

    const boardMap = new Map(hotdealBoards.map((b) => [b.id, b.slug]));
    const boardIds = hotdealBoards.map((b) => b.id);

    const { data: posts } = await supabase
      .from('posts')
      .select('post_number, board_id, updated_at')
      .in('board_id', boardIds)
      .eq('is_deleted', false)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(5000);

    return (posts || [])
      .filter((p) => boardMap.get(p.board_id))
      .map((p) => ({
        url: `${baseUrl}/boards/${boardMap.get(p.board_id)}/${p.post_number}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      }));
  }

  // ── 게시글: 개별 게시판 (posts-{boardSlug}) ──
  if (id.startsWith('posts-')) {
    const boardSlug = id.replace('posts-', '');

    const { data: board } = await supabase
      .from('boards')
      .select('id')
      .eq('slug', boardSlug)
      .single();

    if (!board) return [];

    const { data: posts } = await supabase
      .from('posts')
      .select('post_number, updated_at')
      .eq('board_id', board.id)
      .eq('is_deleted', false)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(5000);

    return (posts || []).map((p) => ({
      url: `${baseUrl}/boards/${boardSlug}/${p.post_number}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  }

  // ── 팀 상세 페이지 (리그별) ──
  if (id.startsWith('teams-')) {
    const leagueSlug = id.replace('teams-', '');
    const leagueId = getLeagueIdBySlug(leagueSlug);
    if (!leagueId) return [];

    // 상수에서 팀 목록 가져오기
    const teams =
      LEAGUE_TEAM_MAPPINGS[leagueId as keyof typeof LEAGUE_TEAM_MAPPINGS] || [];

    // DB에서 추가 팀 조회 (상수에 없는 팀 포함)
    const { data: dbTeams } = await supabase
      .from('football_teams')
      .select('team_id, updated_at')
      .eq('league_id', leagueId)
      .eq('is_active', true);

    const teamIds = new Set(teams.map((t) => t.id));
    const allTeamEntries: MetadataRoute.Sitemap = [];

    // 상수 팀
    for (const team of teams) {
      const dbTeam = dbTeams?.find((t) => t.team_id === team.id);
      allTeamEntries.push({
        url: `${baseUrl}/livescore/football/team/${team.id}`,
        lastModified: dbTeam?.updated_at ? new Date(dbTeam.updated_at) : undefined,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }

    // DB에만 있는 추가 팀
    for (const dbTeam of dbTeams || []) {
      if (!teamIds.has(dbTeam.team_id)) {
        allTeamEntries.push({
          url: `${baseUrl}/livescore/football/team/${dbTeam.team_id}`,
          lastModified: dbTeam.updated_at ? new Date(dbTeam.updated_at) : undefined,
          changeFrequency: 'weekly',
          priority: 0.6,
        });
      }
    }

    return allTeamEntries;
  }

  // ── 선수 상세 페이지 (리그별) ──
  if (id.startsWith('players-')) {
    const leagueSlug = id.replace('players-', '');
    const leagueId = getLeagueIdBySlug(leagueSlug);
    if (!leagueId) return [];

    // 해당 리그의 팀 ID 목록
    const teams =
      LEAGUE_TEAM_MAPPINGS[leagueId as keyof typeof LEAGUE_TEAM_MAPPINGS] || [];
    const teamIds = teams.map((t) => t.id);

    if (teamIds.length === 0) return [];

    const { data: players } = await supabase
      .from('football_players')
      .select('player_id, updated_at')
      .in('team_id', teamIds)
      .eq('is_active', true)
      .order('popularity_score', { ascending: false })
      .limit(5000);

    return (players || []).map((p) => ({
      url: `${baseUrl}/livescore/football/player/${p.player_id}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  }

  // ── 매치 상세 페이지 (리그별) ──
  if (id.startsWith('matches-')) {
    const leagueSlug = id.replace('matches-', '');
    const leagueId = getLeagueIdBySlug(leagueSlug);
    if (!leagueId) return [];

    const { data: matches } = await supabase
      .from('match_ai_predictions')
      .select('fixture_id, match_date')
      .eq('league_id', leagueId)
      .eq('is_active', true)
      .order('match_date', { ascending: false })
      .limit(5000);

    return (matches || []).map((m) => ({
      url: `${baseUrl}/livescore/football/match/${m.fixture_id}`,
      lastModified: m.match_date ? new Date(m.match_date) : undefined,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));
  }

  // ── 리그 페이지 ──
  if (id === 'leagues') {
    const { data: leagues } = await supabase
      .from('leagues')
      .select('id');

    return (leagues || []).map((l) => ({
      url: `${baseUrl}/livescore/football/leagues/${l.id}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  }

  return [];
}
