import { extractInternalEntityLinksFromContent } from './extractInternalEntityLinksFromContent';

export type PostSeoEntities = {
  teams: string[];
  players: string[];
  matches: string[];
};

type TipTapNode = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
};

function cleanName(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const name = value
    .replace(/\s+/g, ' ')
    .trim();

  if (!name || name.length < 2) return null;
  return name;
}

function preferredName(data: Record<string, unknown> | undefined | null): string | null {
  if (!data) return null;

  return (
    cleanName(data.koreanName) ||
    cleanName(data.name_ko) ||
    cleanName(data.display_name) ||
    cleanName(data.name)
  );
}

function addUnique(target: string[], value: unknown, limit = 6) {
  const name = cleanName(value);
  if (!name || target.includes(name) || target.length >= limit) return;
  target.push(name);
}

function parseContent(content: unknown): TipTapNode | null {
  if (!content) return null;
  if (typeof content === 'object') return content as TipTapNode;
  if (typeof content !== 'string' || !content.trim().startsWith('{')) return null;

  try {
    return JSON.parse(content) as TipTapNode;
  } catch {
    return null;
  }
}

function collectCardEntities(node: TipTapNode, entities: PostSeoEntities) {
  if (node.type === 'teamCard') {
    const teamData = node.attrs?.teamData as Record<string, unknown> | undefined;
    addUnique(entities.teams, preferredName(teamData));
  }

  if (node.type === 'playerCard') {
    const playerData = node.attrs?.playerData as Record<string, unknown> | undefined;
    const teamData = playerData?.team as Record<string, unknown> | undefined;
    addUnique(entities.players, preferredName(playerData));
    addUnique(entities.teams, preferredName(teamData));
  }

  if (node.type === 'matchCard') {
    const matchData = node.attrs?.matchData as {
      teams?: {
        home?: Record<string, unknown>;
        away?: Record<string, unknown>;
      };
    } | undefined;
    const homeName = preferredName(matchData?.teams?.home);
    const awayName = preferredName(matchData?.teams?.away);

    addUnique(entities.teams, homeName);
    addUnique(entities.teams, awayName);
    if (homeName && awayName) addUnique(entities.matches, `${homeName} vs ${awayName}`, 4);
  }

  if (node.type === 'entityCardGroup' && Array.isArray(node.attrs?.items)) {
    for (const item of node.attrs.items as Array<{ type?: unknown; data?: Record<string, unknown> }>) {
      if (item.type === 'team') {
        addUnique(entities.teams, preferredName(item.data));
      }

      if (item.type === 'player') {
        const teamData = item.data?.team as Record<string, unknown> | undefined;
        addUnique(entities.players, preferredName(item.data));
        addUnique(entities.teams, preferredName(teamData));
      }
    }
  }

  if (Array.isArray(node.content)) {
    node.content.forEach((child) => collectCardEntities(child, entities));
  }
}

export function extractPostSeoEntities(content: unknown): PostSeoEntities {
  const entities: PostSeoEntities = {
    teams: [],
    players: [],
    matches: [],
  };

  for (const link of extractInternalEntityLinksFromContent(content)) {
    if (link.type === 'team') addUnique(entities.teams, link.label);
    if (link.type === 'player') addUnique(entities.players, link.label);
    if (link.type === 'match') addUnique(entities.matches, link.label, 4);
  }

  const parsedContent = parseContent(content);
  if (parsedContent) {
    collectCardEntities(parsedContent, entities);
  }

  return entities;
}
