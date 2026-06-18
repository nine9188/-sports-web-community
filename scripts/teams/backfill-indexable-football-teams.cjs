/* eslint-disable no-console */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const API_BASE = 'https://v3.football.api-sports.io';
const PAGE_SIZE = 1000;
const REQUEST_DELAY_MS = 250;

function parseArgs() {
  const args = new Set(process.argv.slice(2));
  const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));

  return {
    dryRun: args.has('--dry-run'),
    limit: limitArg ? Number(limitArg.split('=')[1]) : null,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildSlug(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function fetchAll(supabase, table, select, configure = (query) => query) {
  const rows = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const to = from + PAGE_SIZE - 1;
    const query = configure(supabase.from(table).select(select).range(from, to));
    const { data, error } = await query;

    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) break;
  }

  return rows;
}

function pickCompetition(entries) {
  return [...entries].sort((a, b) => {
    const aTime = a.last_seen_at ? Date.parse(a.last_seen_at) : 0;
    const bTime = b.last_seen_at ? Date.parse(b.last_seen_at) : 0;
    if (bTime !== aTime) return bTime - aTime;
    return (b.season || 0) - (a.season || 0);
  })[0];
}

async function fetchTeamFromApi(teamId, apiKey) {
  const url = `${API_BASE}/teams?id=${encodeURIComponent(teamId)}`;
  const response = await fetch(url, {
    headers: {
      'x-rapidapi-host': 'v3.football.api-sports.io',
      'x-rapidapi-key': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`API-Football ${response.status} for team ${teamId}`);
  }

  const json = await response.json();
  return json.response?.[0] || null;
}

function buildFootballTeamRow(apiItem, competition, league) {
  const team = apiItem.team || {};
  const venue = apiItem.venue || null;
  const name = team.name || `Team ${competition.team_id}`;
  const country = team.country || null;
  const now = new Date().toISOString();

  return {
    team_id: team.id || competition.team_id,
    name,
    name_ko: name,
    display_name: name,
    short_name: team.code || null,
    code: team.code || null,
    logo_url: team.logo || `https://media.api-sports.io/football/teams/${competition.team_id}.png`,
    league_id: competition.league_id,
    league_name: league?.name || null,
    league_name_ko: league?.name_ko || league?.name || null,
    league_logo_url: league?.logo || null,
    country,
    country_ko: country,
    founded: team.founded || null,
    venue_id: venue?.id || null,
    venue_name: venue?.name || null,
    venue_city: venue?.city || null,
    venue_capacity: venue?.capacity || null,
    venue_address: venue?.address || null,
    venue_surface: venue?.surface || null,
    current_season: competition.season || null,
    is_active: true,
    search_keywords: [...new Set([name, team.code, country, league?.name, league?.name_ko].filter(Boolean))],
    slug: buildSlug(name),
    api_data: {
      team,
      venue,
      source: 'backfill-indexable-football-teams',
      indexableCompetition: {
        league_id: competition.league_id,
        season: competition.season,
        last_seen_at: competition.last_seen_at,
      },
      lastSync: now,
    },
    last_api_sync: now,
    updated_at: now,
  };
}

async function main() {
  const { dryRun, limit } = parseArgs();
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const apiKey = process.env.FOOTBALL_API_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  }

  if (!apiKey) {
    throw new Error('FOOTBALL_API_KEY is required.');
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const [indexableRows, existingTeams, leagues] = await Promise.all([
    fetchAll(
      supabase,
      'team_indexable_competitions',
      'team_id, league_id, season, last_seen_at',
    ),
    fetchAll(supabase, 'football_teams', 'team_id'),
    fetchAll(
      supabase,
      'leagues',
      'id, name, name_ko, logo',
      (query) => query.eq('is_major', true),
    ),
  ]);

  const existingTeamIds = new Set(existingTeams.map((row) => row.team_id).filter(Boolean));
  const leagueById = new Map(leagues.map((league) => [league.id, league]));
  const entriesByTeamId = new Map();

  for (const row of indexableRows) {
    if (existingTeamIds.has(row.team_id)) continue;
    const entries = entriesByTeamId.get(row.team_id) || [];
    entries.push(row);
    entriesByTeamId.set(row.team_id, entries);
  }

  let targets = [...entriesByTeamId.entries()]
    .map(([teamId, entries]) => ({ team_id: teamId, ...pickCompetition(entries) }))
    .sort((a, b) => a.team_id - b.team_id);

  if (limit && Number.isFinite(limit)) {
    targets = targets.slice(0, limit);
  }

  console.log(JSON.stringify({
    dryRun,
    indexableTeams: new Set(indexableRows.map((row) => row.team_id)).size,
    existingFootballTeams: existingTeamIds.size,
    missingTargets: targets.length,
  }, null, 2));

  let upserted = 0;
  let missingFromApi = 0;
  let failed = 0;

  for (const target of targets) {
    try {
      const apiItem = await fetchTeamFromApi(target.team_id, apiKey);
      if (!apiItem?.team?.id) {
        missingFromApi += 1;
        console.warn(`No API team response for ${target.team_id}`);
        continue;
      }

      const row = buildFootballTeamRow(apiItem, target, leagueById.get(target.league_id));

      if (dryRun) {
        console.log(`[dry-run] ${row.team_id} ${row.name} -> league ${row.league_id}`);
      } else {
        const { error } = await supabase
          .from('football_teams')
          .upsert(row, { onConflict: 'team_id' });

        if (error) throw error;
        upserted += 1;
        console.log(`upserted ${row.team_id} ${row.name}`);
      }
    } catch (error) {
      failed += 1;
      console.error(`failed ${target.team_id}:`, error.message || error);
    }

    await sleep(REQUEST_DELAY_MS);
  }

  console.log(JSON.stringify({ upserted, missingFromApi, failed }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
