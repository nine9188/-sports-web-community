import type { DemoImages } from './AboutPageClient';

const CDN_BASE = 'https://cdn.4590football.com';

const TEAM_IDS = [49, 42, 50, 40, 47, 34, 529, 541, 530, 533];
const LEAGUE_IDS = [39, 140, 2];
const DARK_LEAGUE_IDS = new Set([2, 39]);
const PLAYER_IDS = [
  617, 627, 626, 747, 631, 641, 629, 643, 19465, 1100, 633,
  665, 22224, 1161, 664, 15799, 1460, 284324, 19533, 1468, 288, 20552,
];

function createAssetMap(ids: number[], getUrl: (id: number) => string): Record<number, string> {
  return Object.fromEntries(ids.map((id) => [id, getUrl(id)]));
}

export const ABOUT_DEMO_IMAGES: DemoImages = {
  teamLogos: createAssetMap(TEAM_IDS, (id) => `${CDN_BASE}/teams/sm/${id}.webp`),
  leagueLogos: createAssetMap(LEAGUE_IDS, (id) => `${CDN_BASE}/leagues/sm/${id}.webp`),
  leagueLogosDark: createAssetMap(LEAGUE_IDS, (id) =>
    DARK_LEAGUE_IDS.has(id)
      ? `${CDN_BASE}/leagues/sm/${id}-1.webp`
      : `${CDN_BASE}/leagues/sm/${id}.webp`
  ),
  playerPhoto: `${CDN_BASE}/players/md/306.webp`,
  playerPhotos: createAssetMap(PLAYER_IDS, (id) => `${CDN_BASE}/players/sm/${id}.webp`),
};
