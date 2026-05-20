import { getMatchHref, getPlayerHref, getTeamHref } from '@/domains/livescore/utils/entityLinks';

type TipTapLikeNode = {
  type?: unknown;
  attrs?: Record<string, unknown>;
  text?: unknown;
  description?: unknown;
  marks?: Array<{
    type?: unknown;
    attrs?: Record<string, unknown>;
  }>;
  content?: unknown;
};

type EntityCardGroupItem = {
  type?: unknown;
  id?: unknown;
  data?: Record<string, unknown>;
};

export type RelatedPostCta = {
  key: string;
  type: 'match' | 'team' | 'player';
  label: string;
  description: string;
  href: string;
  actionLabel: string;
};

const MAX_CTA_COUNT = 24;

function firstText(...values: unknown[]): string {
  return values
    .find((value) => typeof value === 'string' && value.trim())
    ?.toString()
    .trim() || '';
}

function getNumericId(...values: unknown[]): number | string | null {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  return null;
}

function pushCta(ctas: RelatedPostCta[], seen: Set<string>, cta: RelatedPostCta) {
  if (!cta.href || seen.has(cta.href) || ctas.length >= MAX_CTA_COUNT) return;
  seen.add(cta.href);
  ctas.push(cta);
}

function buildInternalLinkCta(href: unknown, label: unknown): RelatedPostCta | null {
  if (typeof href !== 'string' || !href.trim()) return null;

  let pathname = href.trim();

  try {
    pathname = new URL(pathname, 'https://4590football.com').pathname;
  } catch {
    return null;
  }

  const match = pathname.match(/^\/livescore\/football\/(team|player|match)\/(\d+)(?:\/[^/?#]+)?\/?$/);
  if (!match) return null;

  const type = match[1] as 'team' | 'player' | 'match';
  const id = match[2];
  const displayLabel = firstText(label) || (type === 'player' ? '선수 정보' : type === 'team' ? '팀 정보' : '경기 정보');

  return {
    key: `${type}-${id}`,
    type,
    label: displayLabel,
    description: type === 'player' ? '선수 정보' : type === 'team' ? '팀 정보' : '경기 정보',
    href: pathname,
    actionLabel: type === 'player' ? '선수 페이지' : type === 'team' ? '팀 페이지' : '경기 페이지',
  };
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeHtmlAttribute(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function collectHtmlAnchorCtas(html: string, ctas: RelatedPostCta[], seen: Set<string>) {
  const anchorRegex = /<a\b[^>]*\bhref=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(html)) && ctas.length < MAX_CTA_COUNT) {
    const cta = buildInternalLinkCta(decodeHtmlAttribute(match[2]), stripHtml(match[3]));
    if (cta) pushCta(ctas, seen, cta);
  }
}

function buildTeamCta(team: Record<string, unknown> | null | undefined): RelatedPostCta | null {
  if (!team) return null;

  const id = getNumericId(team.id, team.team_id);
  if (!id) return null;

  const label = firstText(
    team.koreanName,
    team.name_ko,
    team.nameKo,
    team.display_name,
    team.displayName,
    team.name,
    team.name_en,
  );
  if (!label) return null;

  const league = team.league as Record<string, unknown> | undefined;
  const description = firstText(league?.koreanName, league?.name, team.country_ko, team.country) || '팀 정보';

  return {
    key: `team-${id}`,
    type: 'team',
    label,
    description,
    href: getTeamHref({ ...team, id }),
    actionLabel: '팀 페이지',
  };
}

function buildPlayerCta(player: Record<string, unknown> | null | undefined): RelatedPostCta | null {
  if (!player) return null;

  const id = getNumericId(player.id, player.player_id);
  if (!id) return null;

  const label = firstText(
    player.koreanName,
    player.korean_name,
    player.name_ko,
    player.nameKo,
    player.display_name,
    player.displayName,
    player.name,
    [player.firstname, player.lastname].filter(Boolean).join(' '),
  );
  if (!label) return null;

  const team = player.team as Record<string, unknown> | undefined;
  const description = firstText(team?.koreanName, team?.name_ko, team?.nameKo, team?.name) || '선수 정보';

  return {
    key: `player-${id}`,
    type: 'player',
    label,
    description,
    href: getPlayerHref({ ...player, id }),
    actionLabel: '선수 페이지',
  };
}

function buildMatchCta(match: Record<string, unknown> | null | undefined, fallbackId?: unknown): RelatedPostCta | null {
  if (!match) return null;

  const fixture = match.fixture as Record<string, unknown> | undefined;
  const id = getNumericId(match.id, fallbackId, fixture?.id);
  if (!id) return null;

  const teams = match.teams as Record<string, Record<string, unknown> | undefined> | undefined;
  const homeTeam = (match.homeTeam as Record<string, unknown> | undefined) || teams?.home;
  const awayTeam = (match.awayTeam as Record<string, unknown> | undefined) || teams?.away;
  const homeName = firstText(homeTeam?.name_ko, homeTeam?.nameKo, homeTeam?.koreanName, homeTeam?.name, homeTeam?.name_en);
  const awayName = firstText(awayTeam?.name_ko, awayTeam?.nameKo, awayTeam?.koreanName, awayTeam?.name, awayTeam?.name_en);
  const label = homeName && awayName ? `${homeName} vs ${awayName}` : '경기 정보';

  const league = match.league as Record<string, unknown> | undefined;

  return {
    key: `match-${id}`,
    type: 'match',
    label,
    description: firstText(league?.koreanName, league?.name) || '경기 정보',
    href: getMatchHref({ ...match, id, teams: { home: homeTeam, away: awayTeam } }),
    actionLabel: '경기 페이지',
  };
}

function walkNode(node: unknown, ctas: RelatedPostCta[], seen: Set<string>) {
  if (!node || typeof node !== 'object' || ctas.length >= MAX_CTA_COUNT) return;

  const current = node as TipTapLikeNode;
  const attrs = current.attrs;

  if (typeof current.description === 'string') {
    collectHtmlAnchorCtas(current.description, ctas, seen);
  }

  if (typeof current.content === 'string') {
    collectHtmlAnchorCtas(current.content, ctas, seen);
  }

  if (current.type === 'text' && Array.isArray(current.marks)) {
    for (const mark of current.marks) {
      if (mark.type !== 'link') continue;

      const linkCta = buildInternalLinkCta(mark.attrs?.href, current.text);
      if (linkCta) pushCta(ctas, seen, linkCta);
    }
  }

  if (current.type === 'matchCard' && attrs) {
    const matchData = attrs.matchData as Record<string, unknown> | undefined;
    const matchCta = buildMatchCta(matchData, attrs.matchId);
    if (matchCta) pushCta(ctas, seen, matchCta);

    const teams = matchData?.teams as Record<string, Record<string, unknown> | undefined> | undefined;
    const homeCta = buildTeamCta(teams?.home);
    const awayCta = buildTeamCta(teams?.away);
    if (homeCta) pushCta(ctas, seen, homeCta);
    if (awayCta) pushCta(ctas, seen, awayCta);
  }

  if (current.type === 'teamCard' && attrs) {
    const teamData = attrs.teamData as Record<string, unknown> | undefined;
    const teamCta = buildTeamCta({ ...teamData, id: attrs.teamId ?? teamData?.id });
    if (teamCta) pushCta(ctas, seen, teamCta);
  }

  if (current.type === 'playerCard' && attrs) {
    const playerData = attrs.playerData as Record<string, unknown> | undefined;
    const playerCta = buildPlayerCta({ ...playerData, id: attrs.playerId ?? playerData?.id });
    if (playerCta) pushCta(ctas, seen, playerCta);
  }

  if (current.type === 'entityCardGroup' && attrs && Array.isArray(attrs.items)) {
    for (const item of attrs.items as EntityCardGroupItem[]) {
      if (item.type === 'team') {
        const teamCta = buildTeamCta({ ...item.data, id: item.id ?? item.data?.id });
        if (teamCta) pushCta(ctas, seen, teamCta);
      } else if (item.type === 'player') {
        const playerCta = buildPlayerCta({ ...item.data, id: item.id ?? item.data?.id });
        if (playerCta) pushCta(ctas, seen, playerCta);
      }
    }
  }

  if (Array.isArray(current.content)) {
    current.content.forEach((child) => walkNode(child, ctas, seen));
  }
}

export function extractRelatedCtasFromContent(content: unknown): RelatedPostCta[] {
  let parsedContent = content;

  if (typeof content === 'string' && content.trim().startsWith('{')) {
    try {
      parsedContent = JSON.parse(content);
    } catch {
      return [];
    }
  }

  const ctas: RelatedPostCta[] = [];
  walkNode(parsedContent, ctas, new Set<string>());
  return ctas;
}
