/**
 * SEO slug utilities.
 */

/**
 * Create a URL-safe slug from a display name.
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * League slug map. Unknown leagues intentionally fall back to league-{id}.
 */
export const LEAGUE_SLUGS: Record<number, string> = {
  1: 'world-cup',

  // Europe top leagues
  39: 'premier-league',
  140: 'la-liga',
  78: 'bundesliga',
  135: 'serie-a',
  61: 'ligue-1',

  // Europe secondary leagues
  40: 'championship',
  41: 'league-one',
  42: 'league-two',
  43: 'national-league',
  179: 'scottish-premiership',
  88: 'eredivisie',
  94: 'primeira-liga',

  // Europe cups
  2: 'champions-league',
  3: 'europa-league',
  848: 'conference-league',
  531: 'uefa-super-cup',

  // International
  32: 'world-cup-qualifiers-europe',
  30: 'world-cup-qualifiers-asia',
  10: 'international-friendly',
  5: 'nations-league',
  9: 'euro',
  13: 'copa-america',
  15: 'club-world-cup',

  // Domestic cups
  45: 'fa-cup',
  48: 'efl-cup',
  143: 'copa-del-rey',
  137: 'coppa-italia',
  66: 'coupe-de-france',
  81: 'dfb-pokal',

  // Asia
  292: 'k-league-1',
  293: 'k-league-2',
  98: 'j1-league',
  99: 'j2-j3-league',
  169: 'chinese-super-league',
  17: 'afc-champions-league',
  307: 'saudi-pro-league',

  // Americas
  253: 'mls',
  71: 'brasileirao',
  262: 'liga-mx',

  // Other
  119: 'danish-superliga',
};

export function getLeagueSlug(leagueId: number, leagueName?: string | null): string {
  const nameSlug = leagueName ? slugify(leagueName) : '';
  return LEAGUE_SLUGS[leagueId] || nameSlug || `league-${leagueId}`;
}

export function getTeamSlugFromName(name: string): string {
  return slugify(name);
}

export function getPlayerSlugFromName(name: string): string {
  const slug = slugify(name);
  if (slug === 'player' || /^player-\d+$/.test(slug)) return '';
  return slug;
}

export function getMatchSlug(homeTeam: string, awayTeam: string): string {
  const homeSlug = slugify(homeTeam || '');
  const awaySlug = slugify(awayTeam || '');

  if (homeSlug && awaySlug) return `${homeSlug}-vs-${awaySlug}`;
  if (homeSlug) return homeSlug;
  if (awaySlug) return awaySlug;

  return '';
}
