import 'server-only';

import { cache } from 'react';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import type { TeamCardData } from '@/shared/types/teamCard';
import type { PlayerCardData } from '@/shared/types/playerCard';
import {
  extractInternalEntityLinksFromContent,
  type InternalEntityLink,
} from '@/domains/boards/utils/post/extractInternalEntityLinksFromContent';

export type RelatedEntityCard =
  | {
      key: string;
      type: 'team';
      data: TeamCardData;
    }
  | {
      key: string;
      type: 'player';
      data: PlayerCardData;
    };

function uniqueIds(links: InternalEntityLink[], type: 'team' | 'player') {
  return [...new Set(
    links
      .filter((link) => link.type === type)
      .map((link) => link.id)
      .filter((id) => Number.isFinite(id) && id > 0)
  )];
}

function uniqueLinks(links: InternalEntityLink[]) {
  const seen = new Set<string>();
  const unique: InternalEntityLink[] = [];

  for (const link of links) {
    if (seen.has(link.key)) continue;
    seen.add(link.key);
    unique.push(link);
  }

  return unique;
}

const CUP_LEAGUE_IDS = new Set([
  1,   // FIFA World Cup
  2,   // UEFA Champions League
  3,   // UEFA Europa League
  17,  // AFC Champions League
  45,  // FA Cup
  48,  // EFL Cup
  531, // UEFA Super Cup
  848, // UEFA Conference League
]);

function getTeamCardLeague(team: {
  league_id: number | null;
  league_name: string | null;
  league_name_ko: string | null;
  league_logo_url: string | null;
  country: string | null;
  country_ko: string | null;
}): TeamCardData['league'] {
  if (team.league_id && !CUP_LEAGUE_IDS.has(team.league_id)) {
    return {
      id: team.league_id,
      name: team.league_name || '',
      koreanName: team.league_name_ko || undefined,
      logo: team.league_logo_url || undefined,
    };
  }

  return {
    id: 0,
    name: '',
    koreanName: undefined,
    logo: undefined,
  };
}

function getTeamLogo(team: { team_id: number; logo_url: string | null; logo_cached_url: string | null }) {
  return team.logo_cached_url || team.logo_url || `https://media.api-sports.io/football/teams/${team.team_id}.png`;
}

export const getRelatedEntityCardsFromContent = cache(async (content: unknown): Promise<RelatedEntityCard[]> => {
  const links = uniqueLinks(extractInternalEntityLinksFromContent(content));
  if (links.length === 0) return [];

  const teamIds = uniqueIds(links, 'team');
  const playerIds = uniqueIds(links, 'player');
  if (teamIds.length === 0 && playerIds.length === 0) return [];

  const supabase = await getSupabaseServer();

  const [teamsResult, playersResult] = await Promise.all([
    teamIds.length > 0
      ? supabase
          .from('football_teams')
          .select('team_id,name,name_ko,display_name,slug,logo_url,logo_cached_url,league_id,league_name,league_name_ko,league_logo_url,country,country_ko,current_position')
          .in('team_id', teamIds)
      : Promise.resolve({ data: [], error: null }),
    playerIds.length > 0
      ? supabase
          .from('football_players')
          .select('player_id,name,korean_name,display_name,slug,photo_url,photo_cached_url,team_id,team_name,position,number,age')
          .in('player_id', playerIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (teamsResult.error || playersResult.error) {
    console.error('Related entity cards query failed:', teamsResult.error || playersResult.error);
  }

  const playerTeamIds = [
    ...new Set((playersResult.data ?? []).map((player) => player.team_id).filter(Boolean)),
  ];

  const missingPlayerTeamIds = playerTeamIds.filter((teamId) => !teamIds.includes(teamId));
  const playerTeamsResult = missingPlayerTeamIds.length > 0
    ? await supabase
        .from('football_teams')
        .select('team_id,name,name_ko,display_name,slug,logo_url,logo_cached_url,league_id,league_name,league_name_ko,league_logo_url,country,country_ko,current_position')
        .in('team_id', missingPlayerTeamIds)
    : { data: [], error: null };

  if (playerTeamsResult.error) {
    console.error('Related player team cards query failed:', playerTeamsResult.error);
  }

  const teamRows = [...(teamsResult.data ?? []), ...(playerTeamsResult.data ?? [])];
  const teamMap = new Map(teamRows.map((team) => [team.team_id, team]));
  const playerMap = new Map((playersResult.data ?? []).map((player) => [player.player_id, player]));

  return links.flatMap((link): RelatedEntityCard[] => {
    if (link.type === 'team') {
      const team = teamMap.get(link.id);
      if (!team) return [];

      return [{
        key: link.key,
        type: 'team',
        data: {
          id: team.team_id,
          name: team.name,
          name_ko: team.name_ko,
          slug: team.slug,
          koreanName: team.name_ko || team.display_name || undefined,
          logo: getTeamLogo(team),
          league: getTeamCardLeague(team),
          country: team.country_ko || team.country || undefined,
          currentPosition: team.current_position,
        },
      }];
    }

    if (link.type === 'player') {
      const player = playerMap.get(link.id);
      if (!player) return [];

      const team = teamMap.get(player.team_id);

      return [{
        key: link.key,
        type: 'player',
        data: {
          id: player.player_id,
          name: player.name,
          slug: player.slug,
          koreanName: player.korean_name || player.display_name || undefined,
          photo: player.photo_cached_url || player.photo_url || '',
          team: {
            id: player.team_id,
            name: team?.name || player.team_name || '',
            name_ko: team?.name_ko || null,
            slug: team?.slug || null,
            koreanName: team?.name_ko || team?.display_name || player.team_name || undefined,
            logo: team?.logo_cached_url || team?.logo_url || '',
          },
          position: player.position,
          number: player.number,
          age: player.age,
        },
      }];
    }

    return [];
  });
});
