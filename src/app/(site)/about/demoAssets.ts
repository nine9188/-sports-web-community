import type { DemoImages } from './AboutPageClient';
import { leagueLogoUrl, playerPhotoUrl, teamLogoUrl } from '@/shared/images/urls';

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
  teamLogos: createAssetMap(TEAM_IDS, (id) => teamLogoUrl(id, 'sm')),
  leagueLogos: createAssetMap(LEAGUE_IDS, (id) => leagueLogoUrl(id, { size: 'sm' })),
  leagueLogosDark: createAssetMap(LEAGUE_IDS, (id) =>
    DARK_LEAGUE_IDS.has(id)
      ? leagueLogoUrl(id, { size: 'sm', dark: true })
      : leagueLogoUrl(id, { size: 'sm' })
  ),
  playerPhoto: playerPhotoUrl(306),
  playerPhotos: createAssetMap(PLAYER_IDS, (id) => playerPhotoUrl(id, 'sm')),
};
