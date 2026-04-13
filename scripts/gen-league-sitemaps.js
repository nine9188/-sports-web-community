const fs = require('fs');
const path = require('path');

const LEAGUES = [
  { id: 39, slug: 'epl' },
  { id: 140, slug: 'laliga' },
  { id: 78, slug: 'bundesliga' },
  { id: 135, slug: 'serie-a' },
  { id: 61, slug: 'ligue1' },
  { id: 40, slug: 'championship' },
  { id: 179, slug: 'scottish' },
  { id: 88, slug: 'eredivisie' },
  { id: 94, slug: 'primeira' },
  { id: 2, slug: 'ucl' },
  { id: 3, slug: 'uel' },
  { id: 848, slug: 'uecl' },
  { id: 292, slug: 'kleague' },
  { id: 98, slug: 'jleague' },
  { id: 307, slug: 'saudi' },
  { id: 169, slug: 'csl' },
  { id: 253, slug: 'mls' },
  { id: 71, slug: 'brasileirao' },
  { id: 262, slug: 'liga-mx' },
  { id: 119, slug: 'danish' },
];

function playersRoute(leagueId) {
  return `import { siteConfig } from '@/shared/config';
import { supabase, toIso, sitemapResponse, safeSitemap } from '@/shared/utils/sitemap';

export const revalidate = 3600;

export async function GET() {
  return safeSitemap(async () => {
    const baseUrl = siteConfig.url;

    const { data: teams } = await supabase
      .from('football_teams')
      .select('team_id')
      .eq('league_id', ${leagueId})
      .eq('is_active', true);

    if (!teams?.length) return sitemapResponse([]);

    const teamIds = teams.map((t) => t.team_id);

    const { data: players } = await supabase
      .from('football_players')
      .select('player_id, updated_at')
      .in('team_id', teamIds)
      .eq('is_active', true)
      .order('popularity_score', { ascending: false });

    return sitemapResponse(
      (players || []).map((p) => ({
        url: \`\${baseUrl}/livescore/football/player/\${p.player_id}\`,
        lastModified: toIso(p.updated_at),
        changeFrequency: 'weekly',
        priority: 0.6,
      }))
    );
  });
}
`;
}

function matchesRoute(leagueId) {
  return `import { siteConfig } from '@/shared/config';
import { supabase, toIso, sitemapResponse, safeSitemap } from '@/shared/utils/sitemap';

export const revalidate = 3600;

export async function GET() {
  return safeSitemap(async () => {
    const baseUrl = siteConfig.url;

    const { data: matches } = await supabase
      .rpc('get_sitemap_matches', { target_league_id: ${leagueId} });

    return sitemapResponse(
      (matches || []).map((m: { match_id: number; updated_at: string | null }) => ({
        url: \`\${baseUrl}/livescore/football/match/\${m.match_id}\`,
        lastModified: toIso(m.updated_at),
        changeFrequency: 'daily',
        priority: 0.7,
      }))
    );
  });
}
`;
}

// 기존 파일 삭제
for (const league of LEAGUES) {
  const pDir = path.join('src/app', `sitemap-players-${league.slug}.xml`);
  const mDir = path.join('src/app', `sitemap-matches-${league.slug}.xml`);
  fs.rmSync(pDir, { recursive: true, force: true });
  fs.rmSync(mDir, { recursive: true, force: true });
}

let count = 0;
for (const league of LEAGUES) {
  const pDir = path.join('src/app', `sitemap-players-${league.slug}.xml`);
  fs.mkdirSync(pDir, { recursive: true });
  fs.writeFileSync(path.join(pDir, 'route.ts'), playersRoute(league.id));

  const mDir = path.join('src/app', `sitemap-matches-${league.slug}.xml`);
  fs.mkdirSync(mDir, { recursive: true });
  fs.writeFileSync(path.join(mDir, 'route.ts'), matchesRoute(league.id));
  count++;
}

console.log(`${count}개 리그 × 2(players+matches) = ${count * 2}개 생성 완료`);
