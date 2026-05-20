const DEFAULT_STORAGE_CDN_BASE_URL = 'https://cdn.4590football.com';

export const STORAGE_CDN_BASE_URL = (
  process.env.NEXT_PUBLIC_STORAGE_CDN_URL || DEFAULT_STORAGE_CDN_BASE_URL
).replace(/\/+$/, '');

export const SITE_LOGO_LIGHT_URL = '/logo/4590football-logo.png';
export const SITE_LOGO_DARK_URL = '/logo/4590football-logo-white.webp';
export const SITE_ICON_URL = '/logo/icon-04.png';

export type SportsAssetKind = 'teams' | 'leagues' | 'players' | 'coachs' | 'venues';
export type SportsAssetSize = 'sm' | 'md';

export const SPORTS_PLACEHOLDERS: Record<SportsAssetKind, string> = {
  teams: '/images/placeholder-team.svg',
  leagues: '/images/placeholder-league.svg',
  players: '/images/placeholder-player.svg',
  coachs: '/images/placeholder-coach.svg',
  venues: '/images/placeholder-venue.svg',
};

export const DARK_MODE_LEAGUE_IDS: readonly number[] = [
  39,
  2,
  3,
  848,
  179,
  88,
  119,
  98,
  292,
  66,
  13,
  61,
] as const;

const DARK_MODE_LEAGUE_ID_SET = new Set<number>(DARK_MODE_LEAGUE_IDS);

export function normalizeImageId(id: string | number | null | undefined): number | null {
  if (typeof id === 'number' && Number.isFinite(id) && id > 0) {
    return id;
  }

  if (typeof id === 'string') {
    const numericId = Number.parseInt(id, 10);
    return Number.isFinite(numericId) && numericId > 0 ? numericId : null;
  }

  return null;
}

export function storageCdnUrl(path: string): string {
  return `${STORAGE_CDN_BASE_URL}/${path.replace(/^\/+/, '')}`;
}

export function isStorageCdnUrl(url: string): boolean {
  try {
    return new URL(url.trim()).hostname === new URL(STORAGE_CDN_BASE_URL).hostname;
  } catch {
    return false;
  }
}

export function isLocalImageUrl(url: string | null | undefined): boolean {
  return typeof url === 'string' && url.trim().startsWith('/');
}

export function isSupabaseStorageUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  try {
    return new URL(url.trim()).hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
}

export function isExternalImageUrl(url: string | null | undefined): boolean {
  if (!url || isLocalImageUrl(url)) return false;

  try {
    const parsedUrl = new URL(url.trim());
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return false;
    }

    const hostname = parsedUrl.hostname;
    return hostname !== new URL(STORAGE_CDN_BASE_URL).hostname && !hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
}

export function normalizeDisplayImageUrl(
  url: string | null | undefined,
  options: {
    fallback?: string;
    proxyExternal?: boolean;
  } = {}
): string {
  const fallback = options.fallback ?? SITE_ICON_URL;
  const trimmedUrl = url?.trim();
  if (!trimmedUrl) return fallback;

  if (options.proxyExternal && isExternalImageUrl(trimmedUrl)) {
    return externalImageProxyUrl(trimmedUrl) || fallback;
  }

  return trimmedUrl;
}

export function shouldUnoptimizeImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmedUrl = url.trim();
  return isExternalImageUrl(trimmedUrl) || trimmedUrl.includes('/proxy?url=');
}

export function sportsAssetUrl(
  kind: SportsAssetKind,
  id: string | number | null | undefined,
  options: {
    size?: SportsAssetSize;
    dark?: boolean;
    extension?: 'webp' | 'png' | 'jpg' | 'jpeg' | 'svg';
  } = {}
): string {
  const numericId = normalizeImageId(id);
  if (!numericId) return SPORTS_PLACEHOLDERS[kind];

  const size = options.size ?? 'md';
  const extension = options.extension ?? 'webp';
  const darkSuffix =
    kind === 'leagues' && options.dark && DARK_MODE_LEAGUE_ID_SET.has(numericId) ? '-1' : '';

  return storageCdnUrl(`${kind}/${size}/${numericId}${darkSuffix}.${extension}`);
}

export function sportsAssetUrlPair(
  kind: SportsAssetKind,
  id: string | number | null | undefined,
  options: { size?: SportsAssetSize } = {}
): { light: string; dark: string } {
  const light = sportsAssetUrl(kind, id, { size: options.size });
  const dark = sportsAssetUrl(kind, id, { size: options.size, dark: true });
  return { light, dark };
}

export function teamLogoUrl(id: string | number | null | undefined, size: SportsAssetSize = 'md'): string {
  return sportsAssetUrl('teams', id, { size });
}

export function leagueLogoUrl(
  id: string | number | null | undefined,
  options: { size?: SportsAssetSize; dark?: boolean } = {}
): string {
  return sportsAssetUrl('leagues', id, options);
}

export function playerPhotoUrl(id: string | number | null | undefined, size: SportsAssetSize = 'md'): string {
  return sportsAssetUrl('players', id, { size });
}

export function coachPhotoUrl(id: string | number | null | undefined, size: SportsAssetSize = 'md'): string {
  return sportsAssetUrl('coachs', id, { size });
}

export function venuePhotoUrl(id: string | number | null | undefined, size: SportsAssetSize = 'md'): string {
  return sportsAssetUrl('venues', id, { size });
}

export function externalImageProxyUrl(url: string | null | undefined): string | null {
  const trimmedUrl = url?.trim();
  if (!trimmedUrl) return null;
  return storageCdnUrl(`proxy?url=${encodeURIComponent(trimmedUrl)}`);
}

export function localExternalImageProxyUrl(url: string | null | undefined): string {
  const trimmedUrl = url?.trim();
  if (!trimmedUrl) return '';
  if (isLocalImageUrl(trimmedUrl)) return trimmedUrl;

  try {
    const parsedUrl = new URL(trimmedUrl);
    if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
      return `/api/proxy-image?url=${encodeURIComponent(trimmedUrl)}`;
    }
  } catch {
    return trimmedUrl;
  }

  return trimmedUrl;
}

export function profileIconUrl(path: string): string {
  return storageCdnUrl(`profile-icons/${path.replace(/^\/+/, '')}`);
}
