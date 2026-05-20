import type { GuideDemoImages } from './GuidePageClient';
import { leagueLogoUrl, playerPhotoUrl, teamLogoUrl } from '@/shared/images/urls';

const TEAM_IDS = [42, 49, 50, 40, 47, 33, 48, 194, 541, 529];
const LEAGUE_IDS = [39, 140, 135, 2, 78, 61, 292];
const DARK_LEAGUE_IDS = new Set([2, 39, 61, 292]);
const PLAYER_IDS = [1100, 306, 1460, 1465, 2929, 19533, 284324, 37127, 152982, 5996, 116117];

function createAssetMap(ids: number[], getUrl: (id: number) => string): Record<number, string> {
  return Object.fromEntries(ids.map((id) => [id, getUrl(id)]));
}

export const GUIDE_DEMO_IMAGES: GuideDemoImages = {
  teamLogos: createAssetMap(TEAM_IDS, (id) => teamLogoUrl(id, 'sm')),
  leagueLogos: createAssetMap(LEAGUE_IDS, (id) => leagueLogoUrl(id, { size: 'sm' })),
  leagueLogosDark: createAssetMap(LEAGUE_IDS, (id) =>
    DARK_LEAGUE_IDS.has(id)
      ? leagueLogoUrl(id, { size: 'sm', dark: true })
      : leagueLogoUrl(id, { size: 'sm' })
  ),
  playerPhotos: createAssetMap(PLAYER_IDS, (id) => playerPhotoUrl(id, 'sm')),
};
