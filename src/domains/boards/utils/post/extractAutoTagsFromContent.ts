type TipTapLikeNode = {
  type?: unknown;
  attrs?: Record<string, unknown>;
  content?: unknown;
};

const MAX_TAGS = 12;
const MAX_TAG_LENGTH = 40;

function normalizeTag(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const tag = value
    .replace(/^#+/, '')
    .replace(/[,[\]{}"']/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!tag || tag.length > MAX_TAG_LENGTH) return null;
  return tag;
}

function firstText(...values: unknown[]): string | null {
  for (const value of values) {
    const tag = normalizeTag(value);
    if (tag) return tag;
  }

  return null;
}

function pushTag(tags: string[], value: unknown) {
  const tag = normalizeTag(value);
  if (!tag) return;

  const exists = tags.some((current) => current.toLowerCase() === tag.toLowerCase());
  if (!exists && tags.length < MAX_TAGS) {
    tags.push(tag);
  }
}

function addTeamTags(tags: string[], teamData: Record<string, unknown> | null | undefined) {
  if (!teamData) return;

  pushTag(tags, firstText(teamData.koreanName, teamData.name_ko, teamData.name, teamData.name_en));

  const league = teamData.league as Record<string, unknown> | undefined;
  if (league) {
    pushTag(tags, firstText(league.koreanName, league.name));
  }
}

function addPlayerTags(tags: string[], playerData: Record<string, unknown> | null | undefined) {
  if (!playerData) return;

  pushTag(tags, firstText(playerData.koreanName, playerData.name_ko, playerData.name));

  const team = playerData.team as Record<string, unknown> | undefined;
  if (team) {
    pushTag(tags, firstText(team.koreanName, team.name_ko, team.name, team.name_en));
  }
}

function addMatchTags(tags: string[], matchData: Record<string, unknown> | null | undefined) {
  if (!matchData) return;

  const teams = matchData.teams as Record<string, Record<string, unknown> | undefined> | undefined;
  const homeTeam = teams?.home;
  const awayTeam = teams?.away;
  const homeName = firstText(homeTeam?.name_ko, homeTeam?.name, homeTeam?.name_en);
  const awayName = firstText(awayTeam?.name_ko, awayTeam?.name, awayTeam?.name_en);

  pushTag(tags, homeName);
  pushTag(tags, awayName);

  if (homeName && awayName) {
    pushTag(tags, `${homeName}vs${awayName}`);
  }

  const league = matchData.league as Record<string, unknown> | undefined;
  if (league) {
    pushTag(tags, firstText(league.name));
  }
}

function walkNode(node: unknown, tags: string[]) {
  if (!node || typeof node !== 'object' || tags.length >= MAX_TAGS) return;

  const current = node as TipTapLikeNode;
  const attrs = current.attrs;

  if (current.type === 'teamCard') {
    addTeamTags(tags, attrs?.teamData as Record<string, unknown> | undefined);
  } else if (current.type === 'playerCard') {
    addPlayerTags(tags, attrs?.playerData as Record<string, unknown> | undefined);
  } else if (current.type === 'matchCard') {
    addMatchTags(tags, attrs?.matchData as Record<string, unknown> | undefined);
  }

  if (Array.isArray(current.content)) {
    current.content.forEach((child) => walkNode(child, tags));
  }
}

export function extractAutoTagsFromContent(content: unknown): string[] {
  let parsedContent = content;

  if (typeof content === 'string' && content.trim().startsWith('{')) {
    try {
      parsedContent = JSON.parse(content);
    } catch {
      return [];
    }
  }

  const tags: string[] = [];
  walkNode(parsedContent, tags);
  return tags;
}
