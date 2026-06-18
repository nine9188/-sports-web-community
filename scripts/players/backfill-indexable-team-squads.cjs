/* eslint-disable no-console */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const API_BASE = 'https://v3.football.api-sports.io';
const PAGE_SIZE = 1000;
const REQUEST_DELAY_MS = 300;

function parseArgs() {
  const args = new Set(process.argv.slice(2));
  const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));

  return {
    dryRun: args.has('--dry-run'),
    refreshExistingTeams: args.has('--refresh-existing-teams'),
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

async function fetchSquad(teamId, apiKey) {
  const url = `${API_BASE}/players/squads?team=${encodeURIComponent(teamId)}`;
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

function buildPlayerRow(player, teamRow, rawTeam) {
  const name = player.name || `Player ${player.id}`;
  const now = new Date().toISOString();
  const teamName = teamRow.name_ko || teamRow.name || rawTeam?.name || null;

  return {
    player_id: player.id,
    name,
    korean_name: name,
    display_name: name,
    team_id: teamRow.team_id,
    team_name: teamName,
    position: player.position || null,
    number: player.number || null,
    age: player.age || null,
    photo_url: player.photo || null,
    search_keywords: [...new Set([name, teamName, teamRow.name, teamRow.name_ko, player.position].filter(Boolean))],
    is_active: true,
    slug: buildSlug(name),
    api_data: {
      raw: {
        player,
        team: rawTeam || {
          id: teamRow.team_id,
          name: teamRow.name,
          logo: teamRow.logo_url,
        },
      },
      source: 'players-squads-backfill',
      lastSync: now,
    },
    last_api_sync: now,
    updated_at: now,
  };
}

async function main() {
  const { dryRun, refreshExistingTeams, limit } = parseArgs();
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

  const [indexableRows, footballTeams, playerTeams] = await Promise.all([
    fetchAll(supabase, 'team_indexable_competitions', 'team_id'),
    fetchAll(supabase, 'football_teams', 'team_id,name,name_ko,logo_url'),
    fetchAll(supabase, 'football_players', 'team_id'),
  ]);

  const indexableTeamIds = new Set(indexableRows.map((row) => row.team_id).filter(Boolean));
  const teamById = new Map(
    footballTeams
      .filter((team) => indexableTeamIds.has(team.team_id))
      .map((team) => [team.team_id, team])
  );
  const teamsWithPlayers = new Set(playerTeams.map((row) => row.team_id).filter(Boolean));

  let targets = [...teamById.values()]
    .filter((team) => refreshExistingTeams || !teamsWithPlayers.has(team.team_id))
    .sort((a, b) => a.team_id - b.team_id);

  if (limit && Number.isFinite(limit)) {
    targets = targets.slice(0, limit);
  }

  console.log(JSON.stringify({
    dryRun,
    refreshExistingTeams,
    indexableTeams: indexableTeamIds.size,
    teamsWithPlayers: [...indexableTeamIds].filter((teamId) => teamsWithPlayers.has(teamId)).length,
    targetTeams: targets.length,
  }, null, 2));

  let teamsWithSquad = 0;
  let teamsWithoutSquad = 0;
  let upsertedPlayers = 0;
  let failedTeams = 0;

  for (const team of targets) {
    try {
      const squad = await fetchSquad(team.team_id, apiKey);
      const players = Array.isArray(squad?.players) ? squad.players.filter((player) => player?.id && player?.name) : [];

      if (players.length === 0) {
        teamsWithoutSquad += 1;
        console.warn(`no squad ${team.team_id} ${team.name}`);
        await sleep(REQUEST_DELAY_MS);
        continue;
      }

      const rows = [
        ...new Map(
          players.map((player) => [player.id, buildPlayerRow(player, team, squad.team)])
        ).values(),
      ];
      teamsWithSquad += 1;

      if (dryRun) {
        console.log(`[dry-run] ${team.team_id} ${team.name}: ${rows.length} players`);
      } else {
        const { error } = await supabase
          .from('football_players')
          .upsert(rows, { onConflict: 'player_id', ignoreDuplicates: true });

        if (error) throw error;
        upsertedPlayers += rows.length;
        console.log(`upserted squad ${team.team_id} ${team.name}: ${rows.length}`);
      }
    } catch (error) {
      failedTeams += 1;
      console.error(`failed ${team.team_id} ${team.name}:`, error.message || error);
    }

    await sleep(REQUEST_DELAY_MS);
  }

  console.log(JSON.stringify({
    teamsWithSquad,
    teamsWithoutSquad,
    upsertedPlayers,
    failedTeams,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
