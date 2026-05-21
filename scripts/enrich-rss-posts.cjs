#!/usr/bin/env node

/**
 * Enrich RSS-style posts with internal entity links and match cards.
 *
 * Dry run:
 *   node scripts/enrich-rss-posts.cjs --board foreign-news --post 4653
 *
 * Apply:
 *   node scripts/enrich-rss-posts.cjs --board foreign-news --post 4653 --apply
 *
 * Range:
 *   node scripts/enrich-rss-posts.cjs --board foreign-news --from 4600 --to 4660 --apply
 *
 * New RSS insert flow:
 *   const { enrichInsertedRssPost } = require('./scripts/enrich-rss-posts.cjs');
 *   await enrichInsertedRssPost(supabase, { postId: post.id, board: 'foreign-news' });
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const TEAM_SELECT = 'team_id,name,name_ko,display_name,short_name,slug,logo_url,logo_cached_url,league_id,league_name,league_name_ko,league_logo_url,country,country_ko,current_position,popularity_score';
const PLAYER_SELECT = 'player_id,name,korean_name,display_name,slug,photo_url,photo_cached_url,team_id,team_name,position,number,age,popularity_score';
const FIXTURE_SELECT = 'fixture_id,home_team_id,away_team_id,league_id,season,match_date,status_short,status_long,home_goals,away_goals,round';
const LEAGUE_SELECT = 'id,name,name_ko,logo,country';
const MAX_ENTITY_LINKS_PER_POST = 24;
const MAX_MATCH_CARDS_PER_POST = 3;
const MIN_SENTENCES_BETWEEN_MATCH_CARDS = 3;
const MATCH_LOOKAROUND_DAYS = 10;
const POST_BATCH_SIZE = 200;
// RSS enrichment policy:
// - Link each team/player only once in the body.
// - Exclude national teams, non-club teams, cup-only teams, and leagues we do not use.
// - Link players only when their current club team is also mentioned in the article.
// - Insert match cards directly after the sentence that contains the internal team link.
// - Keep at least a few body sentences between auto-inserted match cards.
// - Insert match cards only for regular major leagues and UEFA Champions League.
// - Remove previously auto-inserted match cards before recalculating.
const BLOCKED_STANDALONE_TEAM_ALIASES = new Set([
  'santos',
  '산투스',
  '산토스',
]);
const BLOCKED_STANDALONE_PLAYER_ALIASES = new Set([
  'fernandes',
  'fernandez',
  '페르난데스',
  '페르난데즈',
]);
const ALLOWED_CONTEXTUAL_PLAYER_SURNAME_ALIASES = new Set([
  'santos',
  '산투스',
  '산토스',
]);
const HANGUL_TOPIC_PARTICLES = new Set(['은', '는', '이', '가', '을', '를', '와', '과', '도', '에', '의', '로']);
const INTERNAL_LINK_LEAGUE_IDS = new Set([
  39,  // Premier League
  140, // La Liga
  78,  // Bundesliga
  135, // Serie A
  61,  // Ligue 1
  292, // K League 1
  293, // K League 2
]);
const BIG_MATCH_LEAGUE_IDS = new Set([
  39,  // Premier League
  140, // La Liga
  78,  // Bundesliga
  135, // Serie A
  61,  // Ligue 1
  2,   // UEFA Champions League
  292, // K League 1
  293, // K League 2
]);

function parseArgs(argv) {
  const args = {
    board: 'foreign-news',
    post: null,
    from: null,
    to: null,
    limit: 20,
    sinceHours: null,
    apply: false,
    verbose: false,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--apply') {
      args.apply = true;
    } else if (value === '--verbose') {
      args.verbose = true;
    } else if (value.startsWith('--')) {
      const key = value.slice(2);
      const next = argv[index + 1];
      if (!next || next.startsWith('--')) {
        throw new Error(`Missing value for ${value}`);
      }
      index += 1;

      if (key === 'board') args.board = next;
      else if (key === 'post-id') args.postId = next;
      else if (key === 'post') args.post = Number(next);
      else if (key === 'from') args.from = Number(next);
      else if (key === 'to') args.to = Number(next);
      else if (key === 'limit') args.limit = Number(next);
      else if (key === 'since-hours') args.sinceHours = Number(next);
      else throw new Error(`Unknown argument: ${value}`);
    }
  }

  if (args.post && (!Number.isFinite(args.post) || args.post <= 0)) {
    throw new Error('--post must be a positive number');
  }
  if (args.sinceHours !== null && (!Number.isFinite(args.sinceHours) || args.sinceHours <= 0)) {
    throw new Error('--since-hours must be a positive number');
  }

  return args;
}

function createSupabaseClient(apply) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = apply
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!supabaseUrl || !key) {
    throw new Error(apply
      ? 'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required'
      : 'NEXT_PUBLIC_SUPABASE_URL and a Supabase key are required');
  }

  return createClient(supabaseUrl, key);
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim();
}

function isAsciiText(value) {
  return /^[\x00-\x7F]+$/.test(value);
}

function isHangulText(value) {
  return /[가-힣]/.test(value);
}

function aliasIsUsable(alias, type) {
  const normalized = normalizeText(alias);
  if (!normalized) return false;
  if (/^\d+$/.test(normalized)) return false;
  if (isAsciiText(normalized) && normalized.length < 4) return false;
  if (!isAsciiText(normalized) && type === 'player' && normalized.length < 3) return false;
  if (!isAsciiText(normalized) && type !== 'player' && normalized.length < 2) return false;
  return true;
}

function collectAliases(values, type) {
  const aliases = [];
  const seen = new Set();

  for (const value of values) {
    const alias = normalizeText(value);
    if (!aliasIsUsable(alias, type)) continue;

    const key = alias.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    aliases.push(alias);
  }

  return aliases;
}

function collectContextualPlayerAliases(player) {
  return collectAliases([
    player.korean_name,
    player.display_name,
    player.name,
  ], 'player');
}

function normalizeComparable(value) {
  return normalizeText(value).toLowerCase().replace(/[-_]/g, ' ');
}

function isClubTeam(team) {
  const teamNames = [
    team.name,
    team.name_ko,
    team.display_name,
    team.short_name,
  ].map(normalizeComparable).filter(Boolean);
  const countryNames = [
    team.country,
    team.country_ko,
  ].map(normalizeComparable).filter(Boolean);
  const leagueName = normalizeComparable(`${team.league_name || ''} ${team.league_name_ko || ''}`);

  if (leagueName.includes('world cup') || leagueName.includes('월드컵')) return false;
  if (leagueName.includes('nations league') || leagueName.includes('국가')) return false;
  if (leagueName.includes('friendlies') || leagueName.includes('친선')) return false;

  return !teamNames.some((teamName) => countryNames.includes(teamName));
}

function isInternalLinkTeam(team) {
  return isClubTeam(team) && INTERNAL_LINK_LEAGUE_IDS.has(Number(team.league_id));
}

function buildEntityAliases(teams, players, contextTeamIds = new Set()) {
  const aliasMap = new Map();
  const ambiguousKeys = new Set();

  function addAlias(aliasRecord) {
    const key = `${aliasRecord.type}:${aliasRecord.alias.toLowerCase()}`;
    if (ambiguousKeys.has(key)) return;

    const previous = aliasMap.get(key);
    const previousScore = Number(previous?.entity?.popularity_score || 0);
    const nextScore = Number(aliasRecord.entity?.popularity_score || 0);
    const previousInContext = previous?.type === 'player' && contextTeamIds.has(Number(previous.entity?.team_id));
    const nextInContext = aliasRecord.type === 'player' && contextTeamIds.has(Number(aliasRecord.entity?.team_id));

    if (
      previous &&
      aliasRecord.type === 'player' &&
      previous.type === 'player' &&
      !previousInContext &&
      !nextInContext &&
      previousScore === nextScore
    ) {
      aliasMap.delete(key);
      ambiguousKeys.add(key);
      return;
    }

    if (
      !previous ||
      (nextInContext && !previousInContext) ||
      (nextInContext === previousInContext && nextScore > previousScore)
    ) {
      aliasMap.set(key, aliasRecord);
    }
  }

  for (const team of teams.filter(isInternalLinkTeam)) {
    for (const alias of collectAliases([
      team.name_ko,
      team.display_name,
      team.short_name,
      team.name,
    ], 'team')) {
      if (BLOCKED_STANDALONE_TEAM_ALIASES.has(alias.toLowerCase())) continue;

      addAlias({
        type: 'team',
        id: Number(team.team_id),
        alias,
        entity: team,
        href: `/livescore/football/team/${team.team_id}${team.slug ? `/${team.slug}` : ''}`,
      });
    }
  }

  const contextualPlayers = contextTeamIds.size > 0
    ? players.filter((player) => contextTeamIds.has(Number(player.team_id)))
    : [];

  for (const player of contextualPlayers) {
    for (const alias of collectContextualPlayerAliases(player)) {
      addAlias({
        type: 'player',
        id: Number(player.player_id),
        alias,
        entity: player,
        href: `/livescore/football/player/${player.player_id}${player.slug ? `/${player.slug}` : ''}`,
      });
    }
  }

  return [...aliasMap.values()].sort((left, right) => {
    if (right.alias.length !== left.alias.length) return right.alias.length - left.alias.length;
    if (left.type !== right.type) return left.type === 'player' ? -1 : 1;
    return 0;
  });
}

function buildTeamAliases(teams) {
  return buildEntityAliases(teams.filter(isInternalLinkTeam), [], new Set());
}

function textNode(value, marks) {
  const node = { type: 'text', text: value };
  if (marks && marks.length > 0) node.marks = marks;
  return node;
}

function rangesOverlap(left, right) {
  return left.start < right.end && right.start < left.end;
}

function hasValidEntityBoundary(text, aliasRecord, start, end) {
  const before = text[start - 1] || '';
  const after = text[end] || '';
  const asciiAlias = isAsciiText(aliasRecord.alias);

  if (asciiAlias) {
    return !/[A-Za-z0-9]/.test(before + after);
  }

  if (/[가-힣]/.test(before)) return false;
  if (/[가-힣]/.test(after) && !HANGUL_TOPIC_PARTICLES.has(after)) return false;

  return true;
}

function findEntityMatches(text, aliases, linkedKeys, maxRemaining) {
  const matches = [];
  const lowerText = text.toLowerCase();

  for (const alias of aliases) {
    if (matches.length >= maxRemaining) break;
    const key = `${alias.type}-${alias.id}`;
    if (linkedKeys.has(key)) continue;

    const needle = alias.alias.toLowerCase();
    let start = lowerText.indexOf(needle);

    while (start >= 0) {
      const end = start + alias.alias.length;

      if (hasValidEntityBoundary(text, alias, start, end)) {
        const candidate = { start, end, alias };
        if (!matches.some((match) => rangesOverlap(match, candidate))) {
          matches.push(candidate);
          linkedKeys.add(key);
          break;
        }
      }

      start = lowerText.indexOf(needle, start + 1);
    }
  }

  return matches.sort((left, right) => left.start - right.start);
}

function parseInternalEntityHref(href) {
  if (typeof href !== 'string') return null;
  const match = href.match(/\/livescore\/football\/(team|player)\/(\d+)/);
  if (!match) return null;
  return {
    type: match[1],
    id: Number(match[2]),
  };
}

function isValidExistingEntityLink(entity, textAlias, aliases) {
  if (entity.type === 'team' && BLOCKED_STANDALONE_TEAM_ALIASES.has(textAlias)) return false;
  if (entity.type === 'player' && BLOCKED_STANDALONE_PLAYER_ALIASES.has(textAlias)) return false;

  return aliases.some((alias) => (
    alias.type === entity.type &&
    alias.id === entity.id &&
    alias.alias.toLowerCase() === textAlias
  ));
}

function cleanExistingLinkMarks(node, aliases, clubTeamIds, linkedKeys) {
  if (!Array.isArray(node.marks)) return { node, changed: false };

  const nextMarks = node.marks.filter((mark) => {
    if (mark.type !== 'link') return true;

    const entity = parseInternalEntityHref(mark?.attrs?.href);
    if (!entity) return true;
    return false;
  });

  if (nextMarks.length === node.marks.length) {
    return { node, changed: false };
  }

  const nextNode = { ...node };
  if (nextMarks.length > 0) nextNode.marks = nextMarks;
  else delete nextNode.marks;

  return { node: nextNode, changed: true };
}

function stripInternalEntityLinksFromInlineContent(content) {
  return mergeAdjacentTextNodes((content || []).map((child) => {
    if (child?.type !== 'text') return child;
    return cleanExistingLinkMarks(child).node;
  }));
}

function mergeAdjacentTextNodes(nodes) {
  const merged = [];

  for (const node of nodes) {
    const previous = merged[merged.length - 1];
    const previousMarks = JSON.stringify(previous?.marks || []);
    const nextMarks = JSON.stringify(node?.marks || []);

    if (
      previous?.type === 'text' &&
      node?.type === 'text' &&
      previousMarks === nextMarks
    ) {
      previous.text = `${previous.text || ''}${node.text || ''}`;
    } else {
      merged.push(node);
    }
  }

  return merged;
}

function enrichTextNode(node, aliases, linkedKeys, paragraphEntityKeys, clubTeamIds) {
  if (node.type !== 'text' || typeof node.text !== 'string') return [node];

  const cleaned = cleanExistingLinkMarks(node, aliases, clubTeamIds, linkedKeys);
  node = cleaned.node;

  if (Array.isArray(node.marks) && node.marks.some((mark) => mark.type === 'link')) {
    collectExistingLinkEntityKeys(node, paragraphEntityKeys);
    return [node];
  }

  const maxRemaining = MAX_ENTITY_LINKS_PER_POST - linkedKeys.size;
  if (maxRemaining <= 0) return [node];

  const matches = findEntityMatches(node.text, aliases, linkedKeys, maxRemaining);
  if (matches.length === 0) return [node];

  const nodes = [];
  let cursor = 0;
  const baseMarks = Array.isArray(node.marks) ? node.marks : [];

  for (const match of matches) {
    if (match.start > cursor) {
      nodes.push(textNode(node.text.slice(cursor, match.start), baseMarks));
    }

    const linkMark = {
      type: 'link',
      attrs: {
        href: match.alias.href,
        target: '_self',
        rel: null,
      },
    };

    nodes.push(textNode(node.text.slice(match.start, match.end), [...baseMarks, linkMark]));
    paragraphEntityKeys.add(`${match.alias.type}-${match.alias.id}`);
    cursor = match.end;
  }

  if (cursor < node.text.length) {
    nodes.push(textNode(node.text.slice(cursor), baseMarks));
  }

  return nodes;
}

function collectExistingLinkEntityKeys(node, target) {
  if (!Array.isArray(node.marks)) return;

  for (const mark of node.marks) {
    if (mark.type !== 'link') continue;
    const entity = parseInternalEntityHref(mark?.attrs?.href);
    if (entity) target.add(`${entity.type}-${entity.id}`);
  }
}

function getParagraphEntityKeys(paragraph) {
  const keys = new Set();
  for (const child of paragraph.content || []) {
    if (child.type === 'text') collectExistingLinkEntityKeys(child, keys);
  }
  return keys;
}

function plainTextFromNode(node) {
  if (!node || typeof node !== 'object') return '';
  if (node.type === 'text') return node.text || '';
  if (Array.isArray(node.content)) return node.content.map(plainTextFromNode).join('');
  return '';
}

function hasMatchContext(text) {
  return (
    /\d+\s*[-:]\s*\d+/.test(text) ||
    /(라운드|경기|맞대결|상대|승리|패배|비겼|무승부|득점|골을|우승|결승|준결승|리그전)/.test(text)
  );
}

function hasMatchCard(content) {
  return Array.isArray(content) && content.some((node) => node?.type === 'matchCard');
}

function buildTeamCardData(team) {
  return {
    id: Number(team.team_id),
    name: team.name,
    name_ko: team.name_ko,
    slug: team.slug,
    koreanName: team.name_ko || team.display_name || undefined,
    logo: team.logo_cached_url || team.logo_url || '',
    league: {
      id: Number(team.league_id) || 0,
      name: team.league_name || '',
      koreanName: team.league_name_ko || undefined,
      logo: team.league_logo_url || undefined,
    },
    country: team.country_ko || team.country || undefined,
    currentPosition: team.current_position,
  };
}

function buildPlayerCardData(player, teamMap) {
  const team = teamMap.get(Number(player.team_id));
  return {
    id: Number(player.player_id),
    name: player.name,
    slug: player.slug,
    koreanName: player.korean_name || player.display_name || undefined,
    photo: player.photo_cached_url || player.photo_url || '',
    team: {
      id: Number(player.team_id),
      name: team?.name || player.team_name || '',
      name_ko: team?.name_ko || null,
      slug: team?.slug || null,
      koreanName: team?.name_ko || team?.display_name || player.team_name || undefined,
      logo: team?.logo_cached_url || team?.logo_url || '',
    },
    position: player.position,
    number: player.number,
    age: player.age,
  };
}

function buildMatchCardNode(fixture, teamMap, leagueMap) {
  const home = teamMap.get(Number(fixture.home_team_id));
  const away = teamMap.get(Number(fixture.away_team_id));
  const league = leagueMap.get(Number(fixture.league_id));

  if (!home || !away) return null;

  const matchData = {
    id: Number(fixture.fixture_id),
    teams: {
      home: {
        id: Number(home.team_id),
        name: home.name,
        name_ko: home.name_ko,
        slug: home.slug,
        logo: home.logo_cached_url || home.logo_url || '',
      },
      away: {
        id: Number(away.team_id),
        name: away.name,
        name_ko: away.name_ko,
        slug: away.slug,
        logo: away.logo_cached_url || away.logo_url || '',
      },
    },
    goals: {
      home: fixture.home_goals,
      away: fixture.away_goals,
    },
    league: {
      id: Number(fixture.league_id),
      name: league?.name_ko || league?.name || home.league_name_ko || home.league_name || '',
      logo: league?.logo || home.league_logo_url || '',
    },
    status: {
      code: fixture.status_short || '',
      name: fixture.status_long || undefined,
    },
  };

  return {
    type: 'matchCard',
    attrs: {
      matchId: Number(fixture.fixture_id),
      matchData,
    },
  };
}

function daysBetween(left, right) {
  const leftTime = new Date(left).getTime();
  const rightTime = new Date(right).getTime();
  if (!Number.isFinite(leftTime) || !Number.isFinite(rightTime)) return Number.POSITIVE_INFINITY;
  return Math.abs(leftTime - rightTime) / 86400000;
}

function chooseLatestFixtureForTeam(fixtures, teamId, postDate) {
  const postTime = new Date(postDate).getTime();

  return fixtures
    .filter((fixture) => {
      const home = Number(fixture.home_team_id);
      const away = Number(fixture.away_team_id);
      const leagueId = Number(fixture.league_id);
      return (home === teamId || away === teamId) && BIG_MATCH_LEAGUE_IDS.has(leagueId);
    })
    .filter((fixture) => daysBetween(fixture.match_date, postDate) <= MATCH_LOOKAROUND_DAYS)
    .sort((left, right) => {
      const leftTime = new Date(left.match_date).getTime();
      const rightTime = new Date(right.match_date).getTime();
      const leftFuturePenalty = leftTime > postTime + 43200000 ? 1000000000000 : 0;
      const rightFuturePenalty = rightTime > postTime + 43200000 ? 1000000000000 : 0;

      return (
        Math.abs(leftTime - postTime) + leftFuturePenalty -
        (Math.abs(rightTime - postTime) + rightFuturePenalty)
      );
    })[0] || null;
}

function contentText(content) {
  if (!content || typeof content !== 'object') return '';
  return plainTextFromNode(content).replace(/\s+/g, ' ').trim();
}

function isSentenceTerminator(value) {
  return value === '.' || value === '!' || value === '?' || value === '。' || value === '！' || value === '？';
}

function isClosingSentencePunctuation(value) {
  return value === '"' || value === "'" || value === ')' || value === ']' || value === '}' || value === '”' || value === '’';
}

function splitTextNodeBySentence(node) {
  const text = node.text || '';
  const parts = [];
  let start = 0;

  for (let index = 0; index < text.length; index += 1) {
    if (!isSentenceTerminator(text[index])) continue;

    let end = index + 1;
    while (end < text.length && isClosingSentencePunctuation(text[end])) end += 1;

    if (end < text.length && !/\s/.test(text[end])) continue;

    const sentenceText = text.slice(start, end);
    if (sentenceText) {
      parts.push({
        node: { ...node, text: sentenceText },
        breakAfter: true,
      });
    }

    while (end < text.length && /\s/.test(text[end])) end += 1;
    start = end;
    index = end - 1;
  }

  const tail = text.slice(start);
  if (tail) {
    parts.push({
      node: { ...node, text: tail },
      breakAfter: false,
    });
  }

  return parts.length > 0 ? parts : [{ node, breakAfter: false }];
}

function splitInlineContentBySentence(content) {
  const chunks = [];
  let current = [];

  function flush() {
    if (current.length === 0) return;
    chunks.push(current);
    current = [];
  }

  for (const child of content) {
    if (child?.type !== 'text' || typeof child.text !== 'string') {
      current.push(child);
      continue;
    }

    for (const part of splitTextNodeBySentence(child)) {
      current.push(part.node);
      if (part.breakAfter) flush();
    }
  }

  flush();
  return chunks.length > 0 ? chunks : [content];
}

function getInlineEntityKeys(content) {
  const keys = new Set();
  for (const child of content || []) {
    if (child?.type === 'text') collectExistingLinkEntityKeys(child, keys);
  }
  return keys;
}

function getEligibleMatchTeamIds(entityKeys, context) {
  return [...entityKeys]
    .filter((key) => key.startsWith('team-'))
    .map((key) => Number(key.slice('team-'.length)))
    .filter((id) => {
      if (!Number.isFinite(id) || id <= 0 || !context.clubTeamIds.has(id)) return false;
      const team = context.teamMap.get(id);
      return BIG_MATCH_LEAGUE_IDS.has(Number(team?.league_id));
    });
}

function appendSentenceContent(target, sentenceContent) {
  const cleanedContent = trimInlineContent(sentenceContent);
  if (cleanedContent.length === 0) return;

  if (target.length > 0) {
    const last = target[target.length - 1];
    const first = cleanedContent[0];
    const lastEndsWithSpace = last?.type === 'text' && /\s$/.test(last.text || '');
    const firstStartsWithSpace = first?.type === 'text' && /^\s/.test(first.text || '');
    if (!lastEndsWithSpace && !firstStartsWithSpace) {
      target.push(textNode(' '));
    }
  }

  target.push(...cleanedContent);
}

function trimInlineContent(content) {
  const next = [...content];

  while (next.length > 0 && next[0]?.type === 'text' && /^\s*$/.test(next[0].text || '')) {
    next.shift();
  }

  while (next.length > 0 && next[next.length - 1]?.type === 'text' && /^\s*$/.test(next[next.length - 1].text || '')) {
    next.pop();
  }

  if (next[0]?.type === 'text' && typeof next[0].text === 'string') {
    next[0] = { ...next[0], text: next[0].text.trimStart() };
  }

  const lastIndex = next.length - 1;
  if (next[lastIndex]?.type === 'text' && typeof next[lastIndex].text === 'string') {
    next[lastIndex] = { ...next[lastIndex], text: next[lastIndex].text.trimEnd() };
  }

  return next.filter((child) => child?.type !== 'text' || child.text !== '');
}

function isSourceParagraph(node) {
  return node?.type === 'paragraph' && /^\s*출처\s*:/.test(plainTextFromNode(node).trim());
}

function normalizePreviouslyEnrichedContent(content) {
  if (!hasMatchCard(content.content)) return content;

  const nextContent = [];
  let paragraphBuffer = [];

  function flushParagraphBuffer() {
    if (paragraphBuffer.length === 0) return;
    nextContent.push({ type: 'paragraph', content: trimInlineContent(paragraphBuffer) });
    paragraphBuffer = [];
  }

  for (const node of content.content) {
    if (node?.type === 'matchCard') continue;

    if (isSourceParagraph(node)) {
      flushParagraphBuffer();
      nextContent.push(node);
      continue;
    }

    if (node?.type === 'paragraph' && Array.isArray(node.content)) {
      appendSentenceContent(paragraphBuffer, node.content);
      continue;
    }

    flushParagraphBuffer();
    nextContent.push(node);
  }

  flushParagraphBuffer();
  return { ...content, content: nextContent };
}

async function loadEntities(supabase) {
  const [teamsResult, playersResult] = await Promise.all([
    supabase
      .from('football_teams')
      .select(TEAM_SELECT)
      .eq('is_active', true),
    supabase
      .from('football_players')
      .select(PLAYER_SELECT)
      .eq('is_active', true),
  ]);

  if (teamsResult.error) throw teamsResult.error;
  if (playersResult.error) throw playersResult.error;

  return {
    teams: teamsResult.data || [],
    players: playersResult.data || [],
  };
}

async function loadPosts(supabase, args, boardId) {
  let query = supabase
    .from('posts')
    .select('id,post_number,title,created_at')
    .eq('board_id', boardId)
    .eq('is_deleted', false)
    .order('post_number', { ascending: false });

  if (args.postId) query = query.eq('id', args.postId).limit(1);
  else if (args.post) query = query.eq('post_number', args.post).limit(1);
  else {
    if (args.sinceHours) {
      query = query.gte('created_at', new Date(Date.now() - args.sinceHours * 60 * 60 * 1000).toISOString());
    }
    if (args.from) query = query.gte('post_number', args.from);
    if (args.to) query = query.lte('post_number', args.to);
    query = query.limit(args.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function loadAllPosts(supabase, args, boardId) {
  if (args.postId || args.post || args.sinceHours || args.from || args.to || args.limit <= POST_BATCH_SIZE) {
    return loadPosts(supabase, args, boardId);
  }

  const posts = [];
  let lastPostNumber = null;

  while (posts.length < args.limit) {
    const batchLimit = Math.min(POST_BATCH_SIZE, args.limit - posts.length);
    const batchArgs = {
      ...args,
      to: lastPostNumber === null ? args.to : lastPostNumber - 1,
      limit: batchLimit,
    };
    const batch = await loadPosts(supabase, batchArgs, boardId);

    if (batch.length === 0) break;
    posts.push(...batch);
    lastPostNumber = batch[batch.length - 1].post_number;
    if (batch.length < batchLimit) break;
  }

  return posts;
}

async function loadContentRows(supabase, postIds) {
  if (postIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('posts_content')
    .select('post_id,content')
    .in('post_id', postIds);

  if (error) throw error;
  return new Map((data || []).map((row) => [row.post_id, row.content]));
}

async function loadFixturesForTeams(supabase, teamIds) {
  const ids = [...new Set(teamIds.filter((id) => Number.isFinite(id) && id > 0))];
  if (ids.length < 2) return [];

  const chunks = [];
  for (let index = 0; index < ids.length; index += 20) {
    chunks.push(ids.slice(index, index + 20));
  }

  const fixtures = [];
  for (const chunk of chunks) {
    const list = chunk.join(',');
    const { data, error } = await supabase
      .from('fixtures')
      .select(FIXTURE_SELECT)
      .or(`home_team_id.in.(${list}),away_team_id.in.(${list})`);

    if (error) throw error;
    fixtures.push(...(data || []));
  }

  return fixtures;
}

async function loadLeagues(supabase, leagueIds) {
  const ids = [...new Set(leagueIds.filter((id) => Number.isFinite(id) && id > 0))];
  if (ids.length === 0) return new Map();

  const { data, error } = await supabase
    .from('leagues')
    .select(LEAGUE_SELECT)
    .in('id', ids);

  if (error) throw error;
  return new Map((data || []).map((league) => [Number(league.id), league]));
}

function enrichContent(content, context) {
  if (!content || content.type !== 'doc' || !Array.isArray(content.content)) {
    return { content, changed: false, linked: [], matchCards: [] };
  }

  const originalContent = content;
  content = normalizePreviouslyEnrichedContent(content);

  const linked = [];
  const matchCards = [];
  const linkedKeys = new Set();
  const insertedMatchTeamIds = new Set();
  const insertedFixtureIds = new Set();
  const nextTopLevelNodes = [];
  let sentencesSinceLastMatchCard = MIN_SENTENCES_BETWEEN_MATCH_CARDS;

  for (const node of content.content) {
    if (node?.type === 'matchCard') {
      continue;
    }

    if (node?.type !== 'paragraph' || !Array.isArray(node.content)) {
      nextTopLevelNodes.push(node);
      continue;
    }

    const sourceInlineContent = stripInternalEntityLinksFromInlineContent(node.content);
    const paragraphEntityKeys = new Set();
    const nextParagraphContent = [];

    for (const child of sourceInlineContent) {
      if (child?.type !== 'text') {
        nextParagraphContent.push(child);
        continue;
      }

      const before = linkedKeys.size;
      const nextTextNodes = enrichTextNode(
        child,
        context.aliases,
        linkedKeys,
        paragraphEntityKeys,
        context.clubTeamIds
      );
      nextParagraphContent.push(...nextTextNodes);

      if (linkedKeys.size > before) {
        for (const key of [...linkedKeys].slice(before)) {
          linked.push(key);
        }
      }
    }

    const nextParagraph = { ...node, content: mergeAdjacentTextNodes(nextParagraphContent) };
    const sentenceChunks = splitInlineContentBySentence(nextParagraph.content);
    const pendingNodes = [];
    let bufferedSentenceContent = [];
    let insertedInParagraph = false;

    for (const sentenceContent of sentenceChunks) {
      appendSentenceContent(bufferedSentenceContent, sentenceContent);

      const sentenceMatchCards = [];
      const canInsertMatchCard = (
        matchCards.length < MAX_MATCH_CARDS_PER_POST &&
        sentencesSinceLastMatchCard >= MIN_SENTENCES_BETWEEN_MATCH_CARDS
      );

      if (canInsertMatchCard) {
        const sentenceEntityKeys = getInlineEntityKeys(sentenceContent);
        const teamIds = getEligibleMatchTeamIds(sentenceEntityKeys, context);

        for (const teamId of teamIds) {
          if (insertedMatchTeamIds.has(teamId)) continue;

          const fixture = chooseLatestFixtureForTeam(context.fixtures, teamId, context.post.created_at);
          if (!fixture) continue;

          const fixtureId = Number(fixture.fixture_id);
          if (insertedFixtureIds.has(fixtureId)) {
            insertedMatchTeamIds.add(teamId);
            continue;
          }

          const matchCardNode = buildMatchCardNode(fixture, context.teamMap, context.leagueMap);
          if (!matchCardNode) continue;

          sentenceMatchCards.push(matchCardNode);
          matchCards.push(fixtureId);
          insertedFixtureIds.add(fixtureId);
          insertedMatchTeamIds.add(teamId);
          insertedMatchTeamIds.add(Number(fixture.home_team_id));
          insertedMatchTeamIds.add(Number(fixture.away_team_id));
          break;
        }
      }

      if (sentenceMatchCards.length > 0) {
        pendingNodes.push({ ...node, content: trimInlineContent(bufferedSentenceContent) });
        pendingNodes.push(...sentenceMatchCards);
        bufferedSentenceContent = [];
        insertedInParagraph = true;
        sentencesSinceLastMatchCard = 0;
      } else {
        sentencesSinceLastMatchCard += 1;
      }
    }

    if (insertedInParagraph) {
      if (bufferedSentenceContent.length > 0) {
        pendingNodes.push({ ...node, content: trimInlineContent(bufferedSentenceContent) });
      }
      nextTopLevelNodes.push(...pendingNodes);
    } else {
      nextTopLevelNodes.push(nextParagraph);
    }
  }

  const nextContent = { ...content, content: nextTopLevelNodes };
  const changed = JSON.stringify(nextContent) !== JSON.stringify(originalContent);
  return { content: nextContent, changed, linked, matchCards };
}

async function enrichRssPosts(supabase, args) {
  const { data: board, error: boardError } = await supabase
    .from('boards')
    .select('id,slug')
    .eq('slug', args.board)
    .single();

  if (boardError) throw boardError;

  const [entities, posts] = await Promise.all([
    loadEntities(supabase),
    loadAllPosts(supabase, args, board.id),
  ]);

  const teamMap = new Map(entities.teams.map((team) => [Number(team.team_id), team]));
  const clubTeamIds = new Set(entities.teams.filter(isInternalLinkTeam).map((team) => Number(team.team_id)));
  const playerMap = new Map(entities.players.map((player) => [Number(player.player_id), player]));
  const teamAliases = buildTeamAliases(entities.teams);
  console.log(`Loaded teams=${teamMap.size}, players=${playerMap.size}, teamAliases=${teamAliases.length}, posts=${posts.length}`);

  let changedCount = 0;

  for (let batchIndex = 0; batchIndex < posts.length; batchIndex += POST_BATCH_SIZE) {
    const batchPosts = posts.slice(batchIndex, batchIndex + POST_BATCH_SIZE);
    const contentRows = await loadContentRows(supabase, batchPosts.map((post) => post.id));

    for (const post of batchPosts) {
      const originalContent = contentRows.get(post.id);
      if (!originalContent) {
        if (args.verbose) console.log(`#${post.post_number} skip: no content`);
        continue;
      }

      const dryLinkedKeys = new Set();
      const dryParagraphTeamIds = new Set();
      const text = contentText(originalContent);
      for (const alias of teamAliases) {
        if (dryLinkedKeys.size >= MAX_ENTITY_LINKS_PER_POST) break;
        if (!text.toLowerCase().includes(alias.alias.toLowerCase())) continue;
        dryLinkedKeys.add(`${alias.type}-${alias.id}`);
        if (alias.type === 'team') dryParagraphTeamIds.add(alias.id);
      }

      const mentionedTeamIds = [...dryParagraphTeamIds];
      const aliases = buildEntityAliases(entities.teams, entities.players, new Set(mentionedTeamIds));
      const fixtures = await loadFixturesForTeams(supabase, mentionedTeamIds);
      const leagueMap = await loadLeagues(supabase, fixtures.map((fixture) => Number(fixture.league_id)));

      const result = enrichContent(originalContent, {
        aliases,
        teamMap,
        playerMap,
        fixtures,
        leagueMap,
        clubTeamIds,
        post,
      });

      if (!result.changed) {
        if (args.verbose) console.log(`#${post.post_number} unchanged: ${post.title}`);
        continue;
      }

      changedCount += 1;
      console.log(`#${post.post_number} changed: links=${result.linked.length}, matchCards=${result.matchCards.length} ${post.title}`);
      if (args.verbose && result.linked.length > 0) {
        console.log(`  links: ${result.linked.join(', ')}`);
      }
      if (result.matchCards.length > 0) {
        console.log(`  matchCards: ${result.matchCards.join(', ')}`);
      }

      if (args.apply) {
        const { error } = await supabase
          .from('posts_content')
          .update({
            content: result.content,
            content_text: contentText(result.content),
            updated_at: new Date().toISOString(),
          })
          .eq('post_id', post.id);

        if (error) throw error;
      }
    }
  }

  return changedCount;
}

async function enrichInsertedRssPost(supabase, options) {
  if (!options?.postId) {
    throw new Error('enrichInsertedRssPost requires options.postId');
  }

  return enrichRssPosts(supabase, {
    board: options.board || 'foreign-news',
    postId: options.postId,
    apply: true,
    verbose: Boolean(options.verbose),
  });
}

async function main() {
  const args = parseArgs(process.argv);
  const supabase = createSupabaseClient(args.apply);

  console.log(args.apply ? 'APPLY mode' : 'DRY RUN mode');
  console.log(`Board: ${args.board}`);

  const changedCount = await enrichRssPosts(supabase, args);

  console.log(args.apply
    ? `Done. Updated ${changedCount} posts.`
    : `Done. ${changedCount} posts would be updated. Re-run with --apply to write changes.`);
}

module.exports = {
  BIG_MATCH_LEAGUE_IDS,
  enrichContent,
  enrichInsertedRssPost,
  enrichRssPosts,
};

if (require.main === module) {
  main().catch((error) => {
    console.error(JSON.stringify(error, null, 2) || error);
    process.exit(1);
  });
}
