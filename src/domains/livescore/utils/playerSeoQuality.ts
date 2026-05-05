import type { PlayerData } from '@/domains/livescore/types/player';

export type PlayerSeoQuality = 'indexable' | 'worthless';

const UNKNOWN_VALUES = new Set([
  '',
  '알수없음',
  '알 수 없음',
  'unknown',
  'n/a',
  'na',
  'null',
  'undefined',
]);

function normalizeValue(value: unknown): string {
  return String(value ?? '').trim();
}

function isUnknownValue(value: unknown): boolean {
  const normalized = normalizeValue(value).toLowerCase();
  return UNKNOWN_VALUES.has(normalized) || normalized.includes('nan');
}

function isFallbackPlayerName(name: string, id?: number): boolean {
  const normalized = name.trim();
  if (!normalized) return true;

  if (/^player[-_\s]*\d+$/i.test(normalized)) return true;
  if (/^선수\s*\d+$/.test(normalized)) return true;
  if (id && (normalized === String(id) || normalized === `#${id}`)) return true;

  return false;
}

export function getPlayerSeoQuality(playerData?: PlayerData | null): PlayerSeoQuality {
  const info = playerData?.info;
  const statistics = playerData?.statistics ?? [];

  if (!info) return 'worthless';

  const name = normalizeValue(info.name);
  const fallbackName = isFallbackPlayerName(name, info.id);

  const hasTeam = statistics.some((stat) => Boolean(stat.team?.id && normalizeValue(stat.team?.name)));
  const hasLeague = statistics.some((stat) => Boolean(stat.league?.id && normalizeValue(stat.league?.name)));
  const hasAppearances = statistics.some((stat) => (stat.games?.appearences ?? 0) > 0);

  const hasBio = [
    info.nationality,
    info.height,
    info.weight,
    info.birth?.date,
    info.birth?.place,
    info.birth?.country,
  ].some((value) => !isUnknownValue(value));

  const hasPhoto = !isUnknownValue(info.photo);
  const hasAnyUsefulData = hasTeam || hasLeague || hasAppearances || hasBio || hasPhoto;

  if (fallbackName && !hasAnyUsefulData) {
    return 'worthless';
  }

  return 'indexable';
}

export function isWorthlessSitemapPlayer(player: {
  player_id?: number | null;
  slug?: string | null;
  name?: string | null;
  display_name?: string | null;
  korean_name?: string | null;
  team_id?: number | null;
  team_name?: string | null;
  position?: string | null;
  number?: number | null;
  age?: number | null;
  photo_url?: string | null;
}): boolean {
  const name = normalizeValue(player.korean_name || player.display_name || player.name);
  const fallbackName = isFallbackPlayerName(name, player.player_id ?? undefined);
  const normalizedSlug = normalizeValue(player.slug).toLowerCase();
  const playerId = String(player.player_id ?? '');
  const fallbackSlug =
    !normalizedSlug ||
    normalizedSlug === 'player' ||
    normalizedSlug === playerId ||
    (Boolean(playerId) && normalizedSlug === `player-${playerId}`);

  const hasTeam = Boolean(player.team_id && normalizeValue(player.team_name));
  const hasProfile = Boolean(
    !isUnknownValue(player.position) ||
    (typeof player.number === 'number' && player.number > 0) ||
    (typeof player.age === 'number' && player.age > 0) ||
    !isUnknownValue(player.photo_url)
  );

  return fallbackName || fallbackSlug;
}
