import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { parse } from "https://deno.land/x/xml@6.0.1/mod.ts";

const CRON_SECRET = Deno.env.get("CRON_SECRET");
const NEWS_USER_ID = "c4e31b46-be50-4546-bcbf-00776408588a";
const SITE_HOST = "4590football.com";
const SITE_ORIGIN = `https://${SITE_HOST}`;
const INDEXNOW_KEY = "c1df662b78d0423d9ef5095856359889";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const INDEXNOW_KEY_LOCATION = `${SITE_ORIGIN}/${INDEXNOW_KEY}.txt`;
const MAX_ENTITY_LINKS = 24;
const MAX_MATCH_CARDS = 3;
const MATCH_LOOKAROUND_DAYS = 10;
const INTERNAL_LINK_LEAGUE_IDS = new Set([39, 140, 78, 135, 61, 292, 293]);
const BIG_MATCH_LEAGUE_IDS = new Set([39, 140, 78, 135, 61, 2, 292, 293]);
const BLOCKED_STANDALONE_TEAM_ALIASES = new Set(["santos", "산투스", "산토스"]);
const HANGUL_TOPIC_PARTICLES = new Set(["은", "는", "이", "가", "을", "를", "와", "과", "도", "에", "의", "로"]);

const TEAM_SELECT = "team_id,name,name_ko,display_name,short_name,slug,logo_url,logo_cached_url,league_id,league_name,league_name_ko,league_logo_url,country,country_ko,current_position,popularity_score";
const PLAYER_SELECT = "player_id,name,korean_name,display_name,slug,photo_url,photo_cached_url,team_id,team_name,position,number,age,popularity_score";
const FIXTURE_SELECT = "fixture_id,home_team_id,away_team_id,league_id,season,match_date,status_short,status_long,home_goals,away_goals,round";
const LEAGUE_SELECT = "id,name,name_ko,logo,country";

const RSS_FEEDS = [
  { url: "https://www.mydaily.co.kr/wfootball_rss.xml", board_id: "32983c7b-e14d-4ce9-8c66-ec4395f43c49", board_slug: "foreign-news", category: "해외축구" },
  { url: "https://www.mydaily.co.kr/football_rss.xml", board_id: "1c76d41f-73fd-499c-94f3-1972f6eb080a", board_slug: "domestic-news", category: "국내축구" }
];

function normalizeText(value: unknown) { return String(value || "").normalize("NFKC").replace(/\s+/g, " ").trim(); }
function isAsciiText(value: string) { return /^[\x00-\x7F]+$/.test(value); }
function normalizeComparable(value: unknown) { return normalizeText(value).toLowerCase().replace(/[-_]/g, " "); }
function aliasIsUsable(alias: string, type: "team" | "player") {
  const normalized = normalizeText(alias);
  if (!normalized || /^\d+$/.test(normalized)) return false;
  if (isAsciiText(normalized) && normalized.length < 4) return false;
  if (!isAsciiText(normalized) && type === "player" && normalized.length < 3) return false;
  if (!isAsciiText(normalized) && type !== "player" && normalized.length < 2) return false;
  return true;
}
function collectAliases(values: unknown[], type: "team" | "player") {
  const aliases: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const alias = normalizeText(value);
    const key = alias.toLowerCase();
    if (!aliasIsUsable(alias, type) || seen.has(key)) continue;
    seen.add(key);
    aliases.push(alias);
  }
  return aliases;
}
function isClubTeam(team: any) {
  const teamNames = [team.name, team.name_ko, team.display_name, team.short_name].map(normalizeComparable).filter(Boolean);
  const countryNames = [team.country, team.country_ko].map(normalizeComparable).filter(Boolean);
  const leagueName = normalizeComparable(`${team.league_name || ""} ${team.league_name_ko || ""}`);
  if (leagueName.includes("world cup") || leagueName.includes("월드컵")) return false;
  if (leagueName.includes("nations league") || leagueName.includes("국가")) return false;
  if (leagueName.includes("friendlies") || leagueName.includes("친선")) return false;
  return !teamNames.some((teamName) => countryNames.includes(teamName));
}
function isInternalLinkTeam(team: any) { return isClubTeam(team) && INTERNAL_LINK_LEAGUE_IDS.has(Number(team.league_id)); }
function hasBoundary(text: string, alias: string, start: number, end: number) {
  const before = text[start - 1] || "";
  const after = text[end] || "";
  if (isAsciiText(alias)) return !/[A-Za-z0-9]/.test(before + after);
  if (/[가-힣]/.test(before)) return false;
  if (/[가-힣]/.test(after) && !HANGUL_TOPIC_PARTICLES.has(after)) return false;
  return true;
}
function buildTeamAliases(teams: any[]) {
  const records: any[] = [];
  const seen = new Set<string>();
  for (const team of teams.filter(isInternalLinkTeam)) {
    for (const alias of collectAliases([team.name_ko, team.display_name, team.short_name, team.name], "team")) {
      if (BLOCKED_STANDALONE_TEAM_ALIASES.has(alias.toLowerCase())) continue;
      const key = `team:${alias.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      records.push({ type: "team", id: Number(team.team_id), alias, entity: team, href: `/livescore/football/team/${team.team_id}${team.slug ? `/${team.slug}` : ""}` });
    }
  }
  return records.sort((a, b) => b.alias.length - a.alias.length);
}
function buildPlayerAliases(players: any[], contextTeamIds: Set<number>) {
  const records: any[] = [];
  const seen = new Set<string>();
  for (const player of players.filter((p) => contextTeamIds.has(Number(p.team_id)))) {
    for (const alias of collectAliases([player.korean_name, player.display_name, player.name], "player")) {
      const key = `player:${alias.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      records.push({ type: "player", id: Number(player.player_id), alias, entity: player, href: `/livescore/football/player/${player.player_id}${player.slug ? `/${player.slug}` : ""}` });
    }
  }
  return records.sort((a, b) => b.alias.length - a.alias.length);
}
function findMatches(text: string, aliases: any[], used: Set<string>) {
  const lower = text.toLowerCase();
  const matches: any[] = [];
  for (const alias of aliases) {
    if (used.size >= MAX_ENTITY_LINKS) break;
    const key = `${alias.type}-${alias.id}`;
    if (used.has(key)) continue;
    const needle = alias.alias.toLowerCase();
    let start = lower.indexOf(needle);
    while (start >= 0) {
      const end = start + alias.alias.length;
      if (hasBoundary(text, alias.alias, start, end) && !matches.some((m) => start < m.end && end > m.start)) {
        matches.push({ start, end, alias });
        used.add(key);
        break;
      }
      start = lower.indexOf(needle, start + 1);
    }
  }
  return matches.sort((a, b) => a.start - b.start);
}
function splitSentences(text: string) {
  const parts: string[] = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (!".!?。！？".includes(text[i])) continue;
    let end = i + 1;
    while (end < text.length && "\"')]}”’".includes(text[end])) end++;
    if (end < text.length && !/\s/.test(text[end])) continue;
    const part = text.slice(start, end).trim();
    if (part) parts.push(part);
    while (end < text.length && /\s/.test(text[end])) end++;
    start = end;
    i = end - 1;
  }
  const tail = text.slice(start).trim();
  if (tail) parts.push(tail);
  return parts.length ? parts : [text];
}
function linkSentence(sentence: string, aliases: any[], used: Set<string>) {
  const matches = findMatches(sentence, aliases, used);
  const nodes: any[] = [];
  const entityKeys: string[] = [];
  let cursor = 0;
  for (const match of matches) {
    if (match.start > cursor) nodes.push({ type: "text", text: sentence.slice(cursor, match.start) });
    nodes.push({ type: "text", text: sentence.slice(match.start, match.end), marks: [{ type: "link", attrs: { href: match.alias.href, target: "_self", rel: null } }] });
    entityKeys.push(`${match.alias.type}-${match.alias.id}`);
    cursor = match.end;
  }
  if (cursor < sentence.length) nodes.push({ type: "text", text: sentence.slice(cursor) });
  return { nodes: nodes.length ? nodes : [{ type: "text", text: sentence }], entityKeys };
}
function plainText(content: any): string {
  if (!content || typeof content !== "object") return "";
  if (content.type === "text") return content.text || "";
  if (Array.isArray(content.content)) return content.content.map(plainText).join(" ");
  return "";
}
function daysBetween(left: string, right: string) {
  const a = new Date(left).getTime();
  const b = new Date(right).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return Infinity;
  return Math.abs(a - b) / 86400000;
}
function chooseFixture(fixtures: any[], teamId: number, postDate: string, usedFixtures: Set<number>) {
  const postTime = new Date(postDate).getTime();
  return fixtures.filter((fixture) => {
    const fixtureId = Number(fixture.fixture_id);
    const home = Number(fixture.home_team_id);
    const away = Number(fixture.away_team_id);
    const leagueId = Number(fixture.league_id);
    return !usedFixtures.has(fixtureId) && (home === teamId || away === teamId) && BIG_MATCH_LEAGUE_IDS.has(leagueId) && daysBetween(fixture.match_date, postDate) <= MATCH_LOOKAROUND_DAYS;
  }).sort((a, b) => {
    const at = new Date(a.match_date).getTime();
    const bt = new Date(b.match_date).getTime();
    const ap = at > postTime + 43200000 ? 1000000000000 : 0;
    const bp = bt > postTime + 43200000 ? 1000000000000 : 0;
    return Math.abs(at - postTime) + ap - (Math.abs(bt - postTime) + bp);
  })[0] || null;
}
function buildMatchCard(fixture: any, teamMap: Map<number, any>, leagueMap: Map<number, any>) {
  const home = teamMap.get(Number(fixture.home_team_id));
  const away = teamMap.get(Number(fixture.away_team_id));
  const league = leagueMap.get(Number(fixture.league_id));
  if (!home || !away) return null;
  return {
    type: "matchCard",
    attrs: {
      matchId: Number(fixture.fixture_id),
      matchData: {
        id: Number(fixture.fixture_id),
        teams: {
          home: { id: Number(home.team_id), name: home.name, name_ko: home.name_ko, slug: home.slug, logo: home.logo_cached_url || home.logo_url || "" },
          away: { id: Number(away.team_id), name: away.name, name_ko: away.name_ko, slug: away.slug, logo: away.logo_cached_url || away.logo_url || "" }
        },
        goals: { home: fixture.home_goals, away: fixture.away_goals },
        league: { id: Number(fixture.league_id), name: league?.name_ko || league?.name || home.league_name_ko || home.league_name || "", logo: league?.logo || home.league_logo_url || "" },
        status: { code: fixture.status_short || "", name: fixture.status_long || undefined }
      }
    }
  };
}
async function enrichRssContent(supabase: any, content: any, postDate: string) {
  const [{ data: teams }, { data: players }] = await Promise.all([
    supabase.from("football_teams").select(TEAM_SELECT).eq("is_active", true),
    supabase.from("football_players").select(PLAYER_SELECT).eq("is_active", true)
  ]);
  const teamRows = teams || [];
  const playerRows = players || [];
  const teamAliases = buildTeamAliases(teamRows);
  const bodyText = plainText(content);
  const dryUsed = new Set<string>();
  const contextTeamIds = new Set<number>();
  for (const match of findMatches(bodyText, teamAliases, dryUsed)) contextTeamIds.add(Number(match.alias.id));
  const allAliases = [...buildPlayerAliases(playerRows, contextTeamIds), ...teamAliases];
  const used = new Set<string>();
  const linkedTeamIds = new Set<number>();
  const teamMap = new Map(teamRows.map((team: any) => [Number(team.team_id), team]));
  const nextContent: any[] = [];
  let fixtures: any[] = [];
  let leagueMap = new Map<number, any>();
  if (contextTeamIds.size > 0) {
    const ids = [...contextTeamIds];
    const chunks = [];
    for (let i = 0; i < ids.length; i += 20) chunks.push(ids.slice(i, i + 20));
    for (const chunk of chunks) {
      const list = chunk.join(",");
      const { data } = await supabase.from("fixtures").select(FIXTURE_SELECT).or(`home_team_id.in.(${list}),away_team_id.in.(${list})`);
      fixtures.push(...(data || []));
    }
    const leagueIds = [...new Set(fixtures.map((f) => Number(f.league_id)).filter(Boolean))];
    if (leagueIds.length > 0) {
      const { data } = await supabase.from("leagues").select(LEAGUE_SELECT).in("id", leagueIds);
      leagueMap = new Map((data || []).map((league: any) => [Number(league.id), league]));
    }
  }
  const usedFixtures = new Set<number>();
  let matchCardCount = 0;
  for (const node of content.content || []) {
    if (node?.type === "matchCard") continue;
    if (node?.type !== "paragraph" || !Array.isArray(node.content) || /^\s*출처\s*:/.test(plainText(node).trim())) {
      nextContent.push(node);
      continue;
    }
    const paragraphText = plainText(node).replace(/\s+/g, " ").trim();
    if (!paragraphText) continue;
    for (const sentence of splitSentences(paragraphText)) {
      const linked = linkSentence(sentence, allAliases, used);
      const sentenceTeamIds = linked.entityKeys.filter((key) => key.startsWith("team-")).map((key) => Number(key.slice(5)));
      for (const id of sentenceTeamIds) linkedTeamIds.add(id);
      nextContent.push({ type: "paragraph", content: linked.nodes });
      if (matchCardCount >= MAX_MATCH_CARDS) continue;
      for (const teamId of sentenceTeamIds) {
        if (matchCardCount >= MAX_MATCH_CARDS) break;
        const team = teamMap.get(teamId);
        if (!team || !BIG_MATCH_LEAGUE_IDS.has(Number(team.league_id))) continue;
        const fixture = chooseFixture(fixtures, teamId, postDate, usedFixtures);
        if (!fixture) continue;
        const card = buildMatchCard(fixture, teamMap, leagueMap);
        if (!card) continue;
        usedFixtures.add(Number(fixture.fixture_id));
        nextContent.push(card);
        matchCardCount++;
      }
    }
  }
  return { content: { ...content, content: nextContent }, linkedCount: used.size, matchCardCount, linkedTeamCount: linkedTeamIds.size };
}

async function submitIndexNowUrl(url: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const response = await fetch(INDEXNOW_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify({ host: SITE_HOST, key: INDEXNOW_KEY, keyLocation: INDEXNOW_KEY_LOCATION, urlList: [url] }) });
    if (!response.ok && response.status !== 202) return { ok: false, status: response.status, error: await response.text().catch(() => response.statusText) };
    return { ok: true, status: response.status };
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : String(error) }; }
}
function extractImagesFromHtml(html: string): string[] { const images: string[] = []; const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi; let match; while ((match = imgRegex.exec(html)) !== null) { const src = match[1].trim(); if (src && !src.startsWith("data:")) images.push(src); } return images; }
function extractMediaContentUrl(item: any): string | null { const mediaContent = item["media:content"]; if (!mediaContent) return null; const target = Array.isArray(mediaContent) ? mediaContent[0] : mediaContent; if (typeof target === "object") { const url = target["@url"] || target.url || target["@href"]; return typeof url === "string" ? url.trim() : null; } return typeof target === "string" && target.trim() ? target.trim() : null; }
function cleanContent(text: string): string { let clean = text.replace(/<[^>]*>/g, ""); for (const pattern of [/많이 본 뉴스[\s\S]*/, /인기 기사[\s\S]*/, /관련 기사[\s\S]*/, /저작권자[\s\S]*/, /ⓒ[\s\S]*/, /Ⓒ[\s\S]*/]) clean = clean.replace(pattern, ""); return clean.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&hellip;/g, "…").replace(/&hearts;/g, "♥").replace(/&ldquo;/g, "“").replace(/&rdquo;/g, "”").replace(/&lsquo;/g, "‘").replace(/&rsquo;/g, "’").trim(); }
function parsePubDate(dateStr: string): string | null { if (!dateStr) return null; const trimmed = dateStr.trim(); const match = trimmed.match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})/); if (match) return `${match[1]}T${match[2]}+09:00`; const d = new Date(trimmed); return isNaN(d.getTime()) ? null : d.toISOString(); }
function jsonResponse(data: unknown, status = 200) { return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } }); }

Deno.serve(async (req: Request) => {
  const authHeader = req.headers.get("authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const isAuthorized = (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) || 
                       (serviceRoleKey && authHeader === `Bearer ${serviceRoleKey}`);
  if (!isAuthorized) return jsonResponse({ error: "Unauthorized" }, 401);
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const results: any[] = [];
  for (const feed of RSS_FEEDS) {
    const feedResult = { feed: feed.category, added: 0, skipped: 0, enriched: 0, indexNowSubmitted: 0, indexNowErrors: [] as string[], errors: [] as string[] };
    try {
      const res = await fetch(feed.url);
      const xml = await res.text();
      const doc = parse(xml) as any;
      const channel = doc?.rss?.channel;
      if (!channel) { feedResult.errors.push("RSS channel 을 찾을 수 없습니다"); results.push(feedResult); continue; }
      let items = channel.item;
      if (!items) { feedResult.errors.push("기사가 없습니다"); results.push(feedResult); continue; }
      if (!Array.isArray(items)) items = [items];
      
      const allLinks = items.map((item: any) => String(item.link || "").trim()).filter((link: string) => link.length > 0);
      const existingUrls = new Set<string>();
      for (let i = 0; i < allLinks.length; i += 50) {
        const { data } = await supabase.from("posts").select("source_url").in("source_url", allLinks.slice(i, i + 50));
        (data || []).forEach((p: { source_url: string }) => existingUrls.add(p.source_url));
      }
      
      const newItems = items.filter((item: any) => {
        const link = String(item.link || "").trim();
        return !existingUrls.has(link);
      });
      
      feedResult.skipped = items.length - newItems.length;
      const itemsToProcess = newItems.slice(0, 4);
      
      for (const item of itemsToProcess) {
        const title = String(item.title || "").trim();
        const link = String(item.link || "").trim();
        const description = String(item.description || "").trim();
        const creator = String(item["dc:creator"] || "").trim();
        const contentEncoded = String(item["content:encoded"] || "").trim();
        const pubDate = String(item.pubDate || "").trim();
        if (!title || !link) continue;
        const imageUrls: string[] = [];
        const mediaUrl = extractMediaContentUrl(item);
        if (mediaUrl) imageUrls.push(mediaUrl);
        if (contentEncoded) for (const imgUrl of extractImagesFromHtml(contentEncoded)) if (!imageUrls.includes(imgUrl)) imageUrls.push(imgUrl);
        const legacyImage = String(item.image || "").trim();
        if (legacyImage && legacyImage !== "undefined" && legacyImage !== "null" && !imageUrls.includes(legacyImage)) imageUrls.push(legacyImage);
        const bodyClean = cleanContent(contentEncoded || description || "");
        const contentNodes: any[] = [];
        for (const imgUrl of imageUrls) contentNodes.push({ type: "image", attrs: { src: imgUrl, alt: title } });
        
        if (bodyClean) {
          const pressSignatureRegex = /\[[가-힣\w\s]+\s*=\s*[가-힣\w\s]+\s*기자\]|\[[가-힣\w\s]+\s*=\s*[가-힣\w\s]+\]/g;
          const bodyNoSignature = bodyClean.replace(pressSignatureRegex, "").trim();
          const sentences = splitSentences(bodyNoSignature);
          const slicedSentences = sentences.slice(0, 5);
          for (const sentence of slicedSentences) {
            contentNodes.push({ type: "paragraph", content: [{ type: "text", text: sentence.trim() }] });
          }
        }
        
        contentNodes.push({
          type: "paragraph",
          content: [
            { type: "text", text: "\n출처: 마이데일리 | 원문 기사를 읽으시려면 " },
            { type: "text", marks: [{ type: "link", attrs: { href: link, target: "_blank" } }], text: "여기" },
            { type: "text", text: "를 클릭해 주세요." }
          ]
        });
        const createdAt = parsePubDate(pubDate);
        const enriched = await enrichRssContent(supabase, { type: "doc", content: contentNodes }, createdAt || new Date().toISOString());
        if (enriched.linkedCount > 0 || enriched.matchCardCount > 0) feedResult.enriched++;
        const insertData: any = { title, user_id: NEWS_USER_ID, board_id: feed.board_id, source_url: link, category: feed.category, status: "published", thumbnail_url: imageUrls[0] || null, summary: bodyClean.slice(0, 150) || null };
        if (createdAt) insertData.created_at = createdAt;
        const { data: insertedPost, error: insertError } = await supabase.from("posts").insert(insertData).select("id, post_number").single();
        if (insertError) { feedResult.errors.push(`${title}: ${insertError.message}`); continue; }
        if (insertedPost?.id) {
          const { error: contentError } = await supabase.from("posts_content").insert({ post_id: insertedPost.id, content: enriched.content, content_text: bodyClean });
          if (contentError) feedResult.errors.push(`${title} (posts_content): ${contentError.message}`);
        }
        if (insertedPost?.post_number) {
          const publicUrl = `${SITE_ORIGIN}/boards/${feed.board_slug}/${insertedPost.post_number}`;
          const indexNowResult = await submitIndexNowUrl(publicUrl);
          if (indexNowResult.ok) feedResult.indexNowSubmitted++; else feedResult.indexNowErrors.push(`${publicUrl}: ${indexNowResult.status || "ERR"} ${indexNowResult.error || ""}`.trim());
        }
        feedResult.added++;
      }
    } catch (e) { feedResult.errors.push((e as Error).message); }
    results.push(feedResult);
  }
  return jsonResponse({ results });
});
