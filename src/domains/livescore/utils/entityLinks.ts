import { getMatchSlug, getPlayerSlugFromName, getTeamSlugFromName } from './slugs';
import { matchUrl, playerUrl, teamUrl, transferTeamUrl } from './urls';

type EntityId = number | string | null | undefined;

export type TeamLinkSource = {
  id?: EntityId;
  team_id?: EntityId;
  slug?: string | null;
  name?: string | null;
  name_en?: string | null;
  nameEn?: string | null;
  name_ko?: string | null;
  nameKo?: string | null;
  display_name?: string | null;
  displayName?: string | null;
  short_name?: string | null;
  shortName?: string | null;
};

export type PlayerLinkSource = {
  id?: EntityId;
  player_id?: EntityId;
  slug?: string | null;
  name?: string | null;
  name_en?: string | null;
  nameEn?: string | null;
  name_ko?: string | null;
  nameKo?: string | null;
  korean_name?: string | null;
  koreanName?: string | null;
  display_name?: string | null;
  displayName?: string | null;
  firstname?: string | null;
  lastname?: string | null;
};

export type MatchLinkSource = {
  id?: EntityId;
  fixture?: {
    id?: EntityId;
  } | null;
  homeTeam?: TeamLinkSource | null;
  awayTeam?: TeamLinkSource | null;
  teams?: {
    home?: TeamLinkSource | null;
    away?: TeamLinkSource | null;
  } | null;
};

function firstText(...values: Array<string | null | undefined>): string {
  return values.find((value) => typeof value === 'string' && value.trim())?.trim() || '';
}

function isGeneratedEntitySlug(slug: string, entity: 'team' | 'player' | 'match', id: EntityId): boolean {
  const normalized = slug.trim().toLowerCase();
  const normalizedId = String(id ?? '').trim().toLowerCase();

  return (
    !normalized ||
    normalized === entity ||
    (Boolean(normalizedId) && normalized === normalizedId) ||
    (Boolean(normalizedId) && normalized === `${entity}-${normalizedId}`)
  );
}

export function getTeamId(team: TeamLinkSource): string | number {
  return team.id ?? team.team_id ?? 0;
}

export function getPlayerId(player: PlayerLinkSource): string | number {
  return player.id ?? player.player_id ?? 0;
}

export function getMatchId(match: MatchLinkSource): string | number {
  return match.id ?? match.fixture?.id ?? 0;
}

export function getTeamLinkSlug(team: TeamLinkSource): string {
  const explicitSlug = firstText(team.slug);
  if (explicitSlug) return explicitSlug;

  const source = firstText(
    team.name_en,
    team.nameEn,
    team.name,
    team.name_ko,
    team.nameKo,
    team.display_name,
    team.displayName,
    team.short_name,
    team.shortName
  );
  const fallback = getTeamId(team) ? `team-${getTeamId(team)}` : 'team';

  return getTeamSlugFromName(source || fallback) || fallback;
}

export function getPlayerLinkSlug(player: PlayerLinkSource): string {
  const explicitSlug = firstText(player.slug);
  if (explicitSlug) return explicitSlug;

  const fullName = firstText([player.firstname, player.lastname].filter(Boolean).join(' '));
  const source = firstText(
    player.name_en,
    player.nameEn,
    player.name,
    player.name_ko,
    player.nameKo,
    player.korean_name,
    player.koreanName,
    player.display_name,
    player.displayName,
    fullName
  );
  const fallback = getPlayerId(player) ? `player-${getPlayerId(player)}` : 'player';

  return getPlayerSlugFromName(source || fallback) || fallback;
}

export function getMatchLinkSlug(
  homeTeam: TeamLinkSource,
  awayTeam: TeamLinkSource,
  matchId?: EntityId
): string {
  const homeSource = firstText(
    homeTeam.name_en,
    homeTeam.nameEn,
    homeTeam.name,
    homeTeam.name_ko,
    homeTeam.nameKo,
    homeTeam.display_name,
    homeTeam.displayName,
    homeTeam.short_name,
    homeTeam.shortName
  );
  const awaySource = firstText(
    awayTeam.name_en,
    awayTeam.nameEn,
    awayTeam.name,
    awayTeam.name_ko,
    awayTeam.nameKo,
    awayTeam.display_name,
    awayTeam.displayName,
    awayTeam.short_name,
    awayTeam.shortName
  );
  const homeSlug = firstText(homeTeam.slug) || getTeamSlugFromName(homeSource);
  const awaySlug = firstText(awayTeam.slug) || getTeamSlugFromName(awaySource);

  if (homeSlug && awaySlug) return `${homeSlug}-vs-${awaySlug}`;
  if (homeSlug) return homeSlug;
  if (awaySlug) return awaySlug;

  return getMatchSlug(homeSource, awaySource) || `match-${matchId || 'match'}`;
}

export function getTeamHref(team: TeamLinkSource): string {
  const id = getTeamId(team);
  const slug = getTeamLinkSlug(team);

  return teamUrl(id, isGeneratedEntitySlug(slug, 'team', id) ? undefined : slug);
}

export function getTransferTeamHref(team: TeamLinkSource): string {
  const id = getTeamId(team);
  const slug = getTeamLinkSlug(team);

  return transferTeamUrl(id, isGeneratedEntitySlug(slug, 'team', id) ? undefined : slug);
}

export function getPlayerHref(player: PlayerLinkSource): string {
  const id = getPlayerId(player);
  const slug = getPlayerLinkSlug(player);

  return playerUrl(id, isGeneratedEntitySlug(slug, 'player', id) ? undefined : slug);
}

export function getMatchHref(match: MatchLinkSource): string {
  const homeTeam = match.homeTeam || match.teams?.home || {};
  const awayTeam = match.awayTeam || match.teams?.away || {};
  const id = getMatchId(match);
  const slug = getMatchLinkSlug(homeTeam, awayTeam, id);

  return matchUrl(id, isGeneratedEntitySlug(slug, 'match', id) ? undefined : slug);
}

export function getMatchHrefByTeams(
  matchId: EntityId,
  homeTeam: TeamLinkSource,
  awayTeam: TeamLinkSource
): string {
  const id = matchId || 0;
  const slug = getMatchLinkSlug(homeTeam, awayTeam, id);

  return matchUrl(id, isGeneratedEntitySlug(slug, 'match', id) ? undefined : slug);
}
