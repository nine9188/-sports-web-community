/* eslint-disable no-console */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const API_BASE = 'https://v3.football.api-sports.io';
const BACKFILL_STARTED_AT = '2026-06-18T14:15:00.000Z';
const PAGE_SIZE = 1000;
const REQUEST_DELAY_MS = 250;
const SEASONS = [2025, 2026, 2024];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseMetricNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : null;
  if (!value) return null;
  const match = String(value).match(/\d+/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
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

async function fetchPlayer(playerId, season, apiKey) {
  const url = `${API_BASE}/players?id=${encodeURIComponent(playerId)}&season=${season}`;
  const response = await fetch(url, {
    headers: {
      'x-rapidapi-host': 'v3.football.api-sports.io',
      'x-rapidapi-key': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`API-Football ${response.status} for player ${playerId}`);
  }

  const json = await response.json();
  return json.response?.[0] || null;
}

function chooseStatistic(raw) {
  const stats = Array.isArray(raw?.statistics) ? raw.statistics : [];
  return stats.find((stat) => stat?.team?.id) || null;
}

function buildRepairPatch(raw, stat) {
  const player = raw.player || {};
  const team = stat.team || {};
  const now = new Date().toISOString();

  return {
    name: player.name || null,
    display_name: player.name || null,
    team_id: team.id,
    team_name: team.name || null,
    position: stat.games?.position || null,
    number: stat.games?.number || null,
    nationality: player.nationality || null,
    age: player.age || null,
    height: parseMetricNumber(player.height),
    weight: parseMetricNumber(player.weight),
    photo_url: player.photo || null,
    api_data: {
      raw,
      source: 'players-repair-after-squads-backfill',
      lastSync: now,
    },
    last_api_sync: now,
    updated_at: now,
  };
}

async function main() {
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

  const targets = await fetchAll(
    supabase,
    'football_players',
    'player_id,name,team_id,team_name,created_at',
    (query) => query
      .eq('api_data->>source', 'players-squads-backfill')
      .lt('created_at', BACKFILL_STARTED_AT)
      .order('player_id', { ascending: true })
  );

  console.log(JSON.stringify({ targets: targets.length }, null, 2));

  let repaired = 0;
  let noApiData = 0;
  let failed = 0;

  for (const target of targets) {
    try {
      let raw = null;
      let stat = null;

      for (const season of SEASONS) {
        raw = await fetchPlayer(target.player_id, season, apiKey);
        stat = chooseStatistic(raw);
        if (raw && stat) break;
      }

      if (!raw || !stat) {
        noApiData += 1;
        console.warn(`no player api data ${target.player_id} ${target.name}`);
        await sleep(REQUEST_DELAY_MS);
        continue;
      }

      const patch = buildRepairPatch(raw, stat);
      const { error } = await supabase
        .from('football_players')
        .update(patch)
        .eq('player_id', target.player_id);

      if (error) throw error;

      repaired += 1;
      console.log(`repaired ${target.player_id} ${target.name}: ${target.team_id} -> ${patch.team_id}`);
    } catch (error) {
      failed += 1;
      console.error(`failed ${target.player_id} ${target.name}:`, error.message || error);
    }

    await sleep(REQUEST_DELAY_MS);
  }

  console.log(JSON.stringify({ repaired, noApiData, failed }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
