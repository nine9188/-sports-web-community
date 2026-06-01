#!/usr/bin/env node

/**
 * Generate stored AI news summaries for entity overview pages.
 *
 * Dry run:
 *   node scripts/generate-entity-news-summaries.cjs --team 42
 *
 * One-time backfill:
 *   node scripts/generate-entity-news-summaries.cjs --all-teams --limit 5 --apply
 *
 * Persist:
 *   node scripts/generate-entity-news-summaries.cjs --team 42 --apply
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const NEWS_BOARD_SLUGS = new Set(['foreign-news', 'official', 'premier', 'laliga', 'bundesliga', 'serie-a', 'ligue1']);
const LOW_PRIORITY_BOARD_PARTS = ['analysis'];
const DEFAULT_LIMIT = 8;
const LINK_PAGE_SIZE = 1000;
const TEAM_PAGE_SIZE = 1000;

function parseArgs(argv) {
  const args = {
    entityType: 'team',
    entityId: null,
    allTeams: false,
    listTeams: false,
    maxTeams: null,
    sinceDays: null,
    limit: DEFAULT_LIMIT,
    apply: false,
    model: process.env.OPENAI_SUMMARY_MODEL || 'gpt-4o-mini',
  };

  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--apply') {
      args.apply = true;
    } else if (value === '--all-teams') {
      args.allTeams = true;
    } else if (value === '--list-teams') {
      args.listTeams = true;
    } else if (value === '--team') {
      args.entityType = 'team';
      args.entityId = Number(argv[index + 1]);
      index += 1;
    } else if (value === '--max-teams') {
      args.maxTeams = Number(argv[index + 1]);
      index += 1;
    } else if (value === '--since-days') {
      args.sinceDays = Number(argv[index + 1]);
      index += 1;
    } else if (value === '--limit') {
      args.limit = Number(argv[index + 1]);
      index += 1;
    } else if (value === '--model') {
      args.model = argv[index + 1];
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }

  if (args.entityType !== 'team') throw new Error('Only --team is supported for now');
  if (!args.allTeams && !args.listTeams && (!Number.isFinite(args.entityId) || args.entityId <= 0)) {
    throw new Error('--team must be a positive number');
  }
  if (args.maxTeams !== null && (!Number.isFinite(args.maxTeams) || args.maxTeams <= 0)) {
    throw new Error('--max-teams must be a positive number');
  }
  if (args.sinceDays !== null && (!Number.isFinite(args.sinceDays) || args.sinceDays <= 0)) {
    throw new Error('--since-days must be a positive number');
  }
  if (!Number.isFinite(args.limit) || args.limit <= 0) {
    throw new Error('--limit must be a positive number');
  }

  return args;
}

function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and a Supabase key are required');
  }

  return createClient(supabaseUrl, key);
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateText(value, maxLength) {
  const text = normalizeText(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

function boardPriority(slug) {
  if (NEWS_BOARD_SLUGS.has(slug)) return 0;
  if (LOW_PRIORITY_BOARD_PARTS.some(part => slug.includes(part))) return 2;
  return 1;
}

function includesInsensitive(text, keyword) {
  const haystack = normalizeText(text).toLowerCase();
  const needle = normalizeText(keyword).toLowerCase();
  return Boolean(needle && haystack.includes(needle));
}

function countKeywordMatches(text, keywords) {
  const normalized = normalizeText(text).toLowerCase();
  return keywords.reduce((count, keyword) => {
    const needle = normalizeText(keyword).toLowerCase();
    if (!needle) return count;
    return count + (normalized.split(needle).length - 1);
  }, 0);
}

function sourcePostRelevance(post, team) {
  const keywords = [
    team.name_ko,
    team.display_name,
    team.name,
    team.short_name,
  ].filter(Boolean);
  const titleMatches = countKeywordMatches(post.title, keywords);
  const bodyMatches = countKeywordMatches(`${post.summary} ${post.contentText}`, keywords);
  const focusedTitle = keywords.some(keyword => includesInsensitive(post.title, keyword));

  if (focusedTitle && bodyMatches >= 2) return 0;
  if (focusedTitle) return 1;
  if (bodyMatches >= 3) return 2;
  return 3;
}

function postUrl(post) {
  return `/boards/${post.board_slug}/${post.post_number}`;
}

function formatSupabaseError(error, fallback) {
  return [
    error?.code,
    error?.message,
    error?.details,
    error?.hint,
  ].filter(Boolean).join(' | ') || fallback;
}

async function getTeam(supabase, teamId) {
  const { data, error } = await supabase
    .from('football_teams')
    .select('team_id,name,name_ko,display_name,short_name,slug,league_name,league_name_ko')
    .eq('team_id', teamId)
    .maybeSingle();

  if (error) throw new Error(formatSupabaseError(error, 'Failed to fetch team'));
  if (!data) throw new Error(`Team not found: ${teamId}`);
  return data;
}

async function getCandidateTeamIds(supabase, options = {}) {
  const teamIds = new Set();
  const sinceIso = options.sinceDays
    ? new Date(Date.now() - options.sinceDays * 86400000).toISOString()
    : null;

  for (let from = 0; from < 100000; from += TEAM_PAGE_SIZE) {
    const to = from + TEAM_PAGE_SIZE - 1;
    let query = supabase
      .from('post_card_links')
      .select('team_id,posts!inner(created_at,boards!inner(slug))')
      .not('team_id', 'is', null)
      .eq('posts.boards.slug', 'foreign-news')
      .range(from, to);

    if (sinceIso) {
      query = query.gte('posts.created_at', sinceIso);
    }

    const { data, error } = await query;
    if (error) throw new Error(formatSupabaseError(error, 'Failed to fetch candidate teams'));

    for (const row of data || []) {
      const teamId = Number(row.team_id);
      if (teamId > 0) teamIds.add(teamId);
    }

    if (!data || data.length < TEAM_PAGE_SIZE) break;
  }

  const ids = [...teamIds].sort((a, b) => a - b);
  return options.maxTeams ? ids.slice(0, options.maxTeams) : ids;
}

async function getTeamSourcePosts(supabase, teamId, limit, team) {
  const rows = [];

  for (let from = 0; from < 5000; from += LINK_PAGE_SIZE) {
    const to = from + LINK_PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from('post_card_links')
      .select(`
        card_type,
        team_id,
        posts!inner (
          id,
          title,
          summary,
          post_number,
          created_at,
          source_url,
          boards!inner (
            slug,
            name
          ),
          posts_content (
            content_text
          )
        )
      `)
      .eq('team_id', teamId)
      .range(from, to);

    if (error) throw new Error(formatSupabaseError(error, 'Failed to fetch source posts'));

    rows.push(...(data || []));
    if (!data || data.length < LINK_PAGE_SIZE) break;
  }

  const seen = new Set();
  const posts = [];

  for (const row of rows) {
    const rawPost = row.posts;
    if (!rawPost?.id || seen.has(rawPost.id)) continue;
    seen.add(rawPost.id);

    const content = Array.isArray(rawPost.posts_content)
      ? rawPost.posts_content[0]?.content_text
      : rawPost.posts_content?.content_text;

    const board = rawPost.boards || {};
    posts.push({
      id: rawPost.id,
      title: normalizeText(rawPost.title),
      summary: normalizeText(rawPost.summary),
      contentText: truncateText(content, 900),
      post_number: rawPost.post_number,
      created_at: rawPost.created_at,
      source_url: rawPost.source_url,
      board_slug: board.slug,
      board_name: board.name,
      priority: boardPriority(board.slug || ''),
      relevance: 0,
    });
  }

  return posts
    .filter(post => post.title && (post.summary || post.contentText))
    .map(post => ({ ...post, relevance: sourcePostRelevance(post, team || {}) }))
    .sort((a, b) => {
      if (a.relevance !== b.relevance) return a.relevance - b.relevance;
      if (a.priority !== b.priority) return a.priority - b.priority;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, limit);
}

function buildPrompt(team, posts) {
  const teamName = team.name_ko || team.display_name || team.name;
  const sourceLines = posts.map((post, index) => {
    const text = post.summary || post.contentText;
    return [
      `[${index + 1}]`,
      `title: ${post.title}`,
      `board: ${post.board_name} (${post.board_slug})`,
      `url: ${postUrl(post)}`,
      `text: ${truncateText(text, 650)}`,
    ].join('\n');
  }).join('\n\n');

  return `너는 축구 사이트 4590의 팀 Overview "일일 요약" 작성자다.

대상 팀: ${teamName}
리그: ${team.league_name_ko || team.league_name || '알 수 없음'}

아래 내부 게시글들을 근거로 한국어 요약 블록 2~4개를 작성해라.

작성 규칙:
- 반드시 제공된 게시글 내용에 있는 사실만 사용한다.
- 출처 글이 경기 전 전망이면 경기 후 결과처럼 단정하지 않는다.
- 같은 경기의 결과 글과 경기 전 전망 글이 함께 있으면 결과 글을 우선하고 전망 글은 요약하지 않는다.
- 이미 지난 경기의 "도전", "예정", "결승전 앞둔" 식의 프리뷰 문맥은 현재 요약 블록에서 제외한다.
- 이미 끝난 경기 결과를 다룰 때는 승부차기/공식 무승부처럼 본문에 있는 표현만 사용한다.
- 팀명, 선수명, 대회명은 자연스럽게 쓴다.
- 각 블록은 1~2문장, 90~180자.
- 숫자와 퍼센트를 억지로 나열하지 말고, 뉴스 요약처럼 흐름을 설명한다.
- "것으로 보입니다", "평가됩니다", "주목됩니다", "기대됩니다", "전망입니다" 같은 반복/추정 표현을 피한다.
- 광고 문구, 클릭 유도 문구, "이 기사에서는" 같은 표현은 쓰지 않는다.
- 각 블록에는 근거가 된 sourceIndex 하나를 지정한다.

응답은 JSON만 반환한다.
형식:
{
  "blocks": [
    { "text": "요약 문장", "sourceIndex": 1 }
  ]
}

내부 게시글:
${sourceLines}`;
}

function parseOpenAIJson(content) {
  const raw = String(content || '').trim();
  const withoutFence = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  return JSON.parse(withoutFence);
}

function normalizeSummarySentence(text) {
  return normalizeText(text)
    .replace(/할 것으로 보이며,/g, '하며,')
    .replace(/할 것으로 보입니다\./g, '합니다.')
    .replace(/할 것으로 보이며/g, '합니다')
    .replace(/한 것으로 보입니다\./g, '했습니다.')
    .replace(/될 것으로 보입니다\./g, '됩니다.')
    .replace(/것으로 전해졌습니다\./g, '것으로 알려졌습니다.')
    .replace(/전망입니다\./g, '흐름입니다.')
    .replace(/기대됩니다\./g, '이어집니다.');
}

function sanitizeBlocks(value, posts) {
  const blocks = Array.isArray(value?.blocks) ? value.blocks : [];
  return blocks
    .map(block => {
      const sourceIndex = Number(block.sourceIndex);
      const post = posts[sourceIndex - 1] || posts[0];
      return {
        text: truncateText(normalizeSummarySentence(block.text), 220),
        sourcePostId: post.id,
        href: postUrl(post),
        sourceTitle: post.title,
      };
    })
    .filter(block => block.text && block.sourcePostId)
    .slice(0, 4);
}

async function generateBlocks(team, posts, model) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is required');

  const openai = new OpenAI({ apiKey });
  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.45,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You write concise Korean football news summaries grounded only in supplied source posts.',
      },
      {
        role: 'user',
        content: buildPrompt(team, posts),
      },
    ],
  });

  const parsed = parseOpenAIJson(completion.choices[0]?.message?.content);
  return sanitizeBlocks(parsed, posts);
}

async function upsertSummary(supabase, entityType, entityId, blocks) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000);
  const sourcePostIds = [...new Set(blocks.map(block => block.sourcePostId))];

  const { data, error } = await supabase
    .from('entity_news_summaries')
    .upsert({
      entity_type: entityType,
      entity_id: entityId,
      summary_blocks: blocks,
      source_post_ids: sourcePostIds,
      generated_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      updated_at: now.toISOString(),
    }, { onConflict: 'entity_type,entity_id' })
    .select('id,generated_at,expires_at')
    .single();

  if (error) throw new Error(formatSupabaseError(error, 'Failed to upsert entity_news_summaries'));
  return data;
}

async function generateEntityNewsSummary(supabase, options) {
  const args = {
    entityType: 'team',
    entityId: Number(options.entityId ?? options.teamId),
    limit: Number(options.limit || DEFAULT_LIMIT),
    apply: Boolean(options.apply),
    model: options.model || process.env.OPENAI_SUMMARY_MODEL || 'gpt-4o-mini',
  };

  const team = await getTeam(supabase, args.entityId);
  const posts = await getTeamSourcePosts(supabase, args.entityId, args.limit, team);

  if (posts.length === 0) {
    throw new Error(`No source posts found for team ${args.entityId}`);
  }

  const blocks = await generateBlocks(team, posts, args.model);
  if (blocks.length === 0) {
    throw new Error('OpenAI returned no usable summary blocks');
  }

  const output = {
    mode: args.apply ? 'apply' : 'dry-run',
    entityType: args.entityType,
    entityId: args.entityId,
    team: team.name_ko || team.display_name || team.name,
    sourcePosts: posts.map(post => ({
      title: post.title,
      href: postUrl(post),
      board: post.board_slug,
    })),
    blocks,
  };

  if (args.apply) {
    output.saved = await upsertSummary(supabase, args.entityType, args.entityId, blocks);
  }

  return output;
}

async function generateTeamNewsSummaries(supabase, options = {}) {
  const teamIds = Array.isArray(options.teamIds) && options.teamIds.length > 0
    ? options.teamIds.map(Number).filter(value => Number.isFinite(value) && value > 0)
    : await getCandidateTeamIds(supabase, {
        sinceDays: options.sinceDays,
        maxTeams: options.maxTeams,
      });

  const results = [];
  for (const teamId of teamIds) {
    try {
      const result = await generateEntityNewsSummary(supabase, {
        entityId: teamId,
        limit: options.limit || 5,
        apply: Boolean(options.apply),
        model: options.model,
      });
      results.push({ teamId, ok: true, result });
      console.log(`#${teamId} saved: ${result.team} blocks=${result.blocks.length}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({ teamId, ok: false, error: message });
      console.error(`#${teamId} failed: ${message}`);
    }
  }

  return {
    mode: options.apply ? 'apply' : 'dry-run',
    teamCount: teamIds.length,
    successCount: results.filter(result => result.ok).length,
    failureCount: results.filter(result => !result.ok).length,
    results,
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const supabase = createSupabaseClient();

  if (args.listTeams) {
    const teamIds = await getCandidateTeamIds(supabase, {
      sinceDays: args.sinceDays,
      maxTeams: args.maxTeams,
    });
    console.log(JSON.stringify({ teamCount: teamIds.length, teamIds }, null, 2));
    return;
  }

  if (args.allTeams) {
    const output = await generateTeamNewsSummaries(supabase, {
      limit: args.limit,
      apply: args.apply,
      model: args.model,
      sinceDays: args.sinceDays,
      maxTeams: args.maxTeams,
    });
    console.log(JSON.stringify({
      mode: output.mode,
      teamCount: output.teamCount,
      successCount: output.successCount,
      failureCount: output.failureCount,
    }, null, 2));
    return;
  }

  const output = await generateEntityNewsSummary(supabase, {
    entityId: args.entityId,
    limit: args.limit,
    apply: args.apply,
    model: args.model,
  });

  console.log(JSON.stringify(output, null, 2));
}

module.exports = {
  generateEntityNewsSummary,
  generateTeamNewsSummaries,
  getCandidateTeamIds,
};

if (require.main === module) {
  main().catch(error => {
    if (error?.message) {
      console.error(error.message);
    } else {
      console.error(JSON.stringify(error, null, 2));
    }
    process.exit(1);
  });
}
