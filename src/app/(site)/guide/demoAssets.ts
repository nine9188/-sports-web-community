import type { GuideDemoImages } from './GuidePageClient';

const CDN_BASE = 'https://cdn.4590football.com';

const TEAM_IDS = [42, 49, 50, 40, 47, 33, 48, 194, 541, 529];
const LEAGUE_IDS = [39, 140, 135, 2, 78, 61, 292];
const DARK_LEAGUE_IDS = new Set([2, 39, 61, 292]);
const PLAYER_IDS = [1100, 306, 1460, 1465, 2929, 19533, 284324, 37127, 152982, 5996, 116117];

function createAssetMap(ids: number[], getUrl: (id: number) => string): Record<number, string> {
  return Object.fromEntries(ids.map((id) => [id, getUrl(id)]));
}

export const GUIDE_DEMO_IMAGES: GuideDemoImages = {
  teamLogos: createAssetMap(TEAM_IDS, (id) => `${CDN_BASE}/teams/sm/${id}.webp`),
  leagueLogos: createAssetMap(LEAGUE_IDS, (id) => `${CDN_BASE}/leagues/sm/${id}.webp`),
  leagueLogosDark: createAssetMap(LEAGUE_IDS, (id) =>
    DARK_LEAGUE_IDS.has(id)
      ? `${CDN_BASE}/leagues/sm/${id}-1.webp`
      : `${CDN_BASE}/leagues/sm/${id}.webp`
  ),
  playerPhotos: createAssetMap(PLAYER_IDS, (id) => `${CDN_BASE}/players/sm/${id}.webp`),
};
