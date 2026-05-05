'use server';

import { cache } from 'react';
import { PlayerData } from '@/domains/livescore/types/player';
import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi';
import { getSupabaseAdmin, getSupabaseServer } from '@/shared/lib/supabase/server';
import type { Database } from '@/shared/lib/supabase/types';

type PlayerDbRow = Database['public']['Tables']['football_players']['Row'];
type PlayerDataWithSync = PlayerData & {
  lastApiSync?: string | null;
};
type TeamDbRow = Pick<
  Database['public']['Tables']['football_teams']['Row'],
  | 'team_id'
  | 'name'
  | 'name_ko'
  | 'logo_url'
  | 'logo_cached_url'
  | 'league_id'
  | 'league_name'
  | 'league_name_ko'
  | 'league_logo_url'
  | 'country'
  | 'current_season'
>;

type RawPlayerData = {
  id?: number;
  name?: string;
  firstname?: string;
  lastname?: string;
  age?: number;
  birth?: {
    date?: string;
    place?: string;
    country?: string;
  };
  nationality?: string;
  height?: string | number;
  weight?: string | number;
  injured?: boolean;
  photo?: string;
  position?: string;
  number?: number;
};

const PLAYER_PROFILE_REFRESH_MS = 1000 * 60 * 60 * 24 * 7;

// API 응답을 위한 인터페이스 정의
interface ApiPlayerResponse {
  player: {
    id?: number;
    name?: string;
    firstname?: string;
    lastname?: string;
    age?: number;
    birth?: {
      date?: string;
      place?: string;
      country?: string;
    };
    nationality?: string;
    height?: string;
    weight?: string;
    injured?: boolean;
    photo?: string;
    number?: number;
    position?: string;
  };
  statistics?: Array<{
    team?: {
      id?: number;
      name?: string;
      logo?: string;
    };
    league?: {
      id?: number;
      name?: string;
      country?: string;
      logo?: string;
      season?: number;
    };
    games?: {
      appearences?: number;
      lineups?: number;
      minutes?: number;
      position?: string;
      rating?: string;
      captain?: boolean;
    };
    goals?: {
      total?: number;
      assists?: number;
      saves?: number;
      conceded?: number;
      cleansheets?: number;
    };
    passes?: {
      total?: number;
      key?: number;
      accuracy?: string;
    };
    tackles?: {
      total?: number;
      blocks?: number;
      interceptions?: number;
    };
    duels?: {
      total?: number;
      won?: number;
    };
    dribbles?: {
      attempts?: number;
      success?: number;
      past?: number;
    };
    fouls?: {
      drawn?: number;
      committed?: number;
    };
    cards?: {
      yellow?: number;
      yellowred?: number;
      red?: number;
    };
    penalty?: {
      won?: number;
      committed?: number;
      scored?: number;
      missed?: number;
      saved?: number;
    };
  }>;
}

/**
 * 선수 기본 정보 가져오기
 * @param id 선수 ID
 * @returns 선수 기본 정보
 */
export async function fetchPlayerData(id: string): Promise<PlayerData> {
  try {
    if (!id) {
      throw new Error('선수 ID가 필요합니다.');
    }

    const currentSeason = getCurrentSeason();
    const dbPlayerData = await fetchPlayerDataFromDb(id);
    if (dbPlayerData && hasPlayerBio(dbPlayerData) && !isPlayerProfileStale(dbPlayerData)) {
      return dbPlayerData;
    }

    // 여러 시즌에서 선수 데이터 시도
    const seasonsToTry = [currentSeason, currentSeason - 1, currentSeason + 1];
    
    for (const season of seasonsToTry) {
      try {
        // API 호출
        const playerData = await fetchFromFootballApi('players', { id, season });

        // 데이터 존재 확인
        if (playerData?.response?.[0]) {
          const apiPlayerData = formatPlayerData(playerData.response[0], season);
          if (dbPlayerData) {
            await persistPlayerProfileFromApi(dbPlayerData.info.id, playerData.response[0]);
            return mergePlayerProfileFromApi(dbPlayerData, apiPlayerData);
          }

          return apiPlayerData;
        }
      } catch {
        continue;
      }
    }

    // 모든 시즌에서 실패한 경우 - 기본 데이터 반환
    if (dbPlayerData) {
      return dbPlayerData;
    }

    return {
      info: {
        id: parseInt(id),
        name: `선수 ${id}`,
        firstname: '알수없음',
        lastname: '',
        age: 0,
        birth: {
          date: '알수없음',
          place: '알수없음',
          country: '알수없음'
        },
        nationality: '알수없음',
        height: '알수없음',
        weight: '알수없음',
        injured: false,
        photo: ''
      },
      statistics: []
    };
  } catch (error) {
    console.error('선수 데이터 가져오기 오류:', error);
    // 에러 발생 시에도 기본 데이터 반환
    return {
      info: {
        id: parseInt(id),
        name: `선수 ${id}`,
        firstname: '알수없음',
        lastname: '',
        age: 0,
        birth: {
          date: '알수없음',
          place: '알수없음',
          country: '알수없음'
        },
        nationality: '알수없음',
        height: '알수없음',
        weight: '알수없음',
        injured: false,
        photo: ''
      },
      statistics: []
    };
  }
}

/**
 * 리그 우선순위 정의 (숫자가 작을수록 우선순위가 높음)
 */
function getCurrentSeason(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return month >= 6 ? year : year - 1;
}

function getApiRawPlayer(row: PlayerDbRow): RawPlayerData {
  const apiData = row.api_data;
  if (!apiData || typeof apiData !== 'object' || Array.isArray(apiData)) return {};

  const raw = 'raw' in apiData ? apiData.raw : apiData;
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && 'player' in raw) {
    const player = raw.player;
    return player && typeof player === 'object' && !Array.isArray(player)
      ? (player as RawPlayerData)
      : {};
  }

  return raw && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as RawPlayerData)
    : {};
}

function formatMetric(value: number | string | null | undefined, suffix: string): string {
  if (typeof value === 'number' && value > 0) return `${value}${suffix}`;
  if (typeof value === 'string' && value.trim()) return value;
  return '';
}

function splitName(name: string): { firstname: string; lastname: string } {
  const [firstname = '', ...rest] = name.trim().split(/\s+/);
  return { firstname, lastname: rest.join(' ') };
}

function hasPlayerBio(playerData: PlayerData): boolean {
  const info = playerData.info;
  return Boolean(
    info.height ||
    info.weight ||
    info.birth?.date ||
    info.birth?.place ||
    info.birth?.country ||
    info.nationality
  );
}

function getPlayerLastApiSync(playerData: PlayerData): string | null {
  const raw = playerData as PlayerDataWithSync;
  return raw.lastApiSync ?? null;
}

function isPlayerProfileStale(playerData: PlayerData): boolean {
  const lastApiSync = getPlayerLastApiSync(playerData);
  if (!lastApiSync) return true;

  const syncedAt = new Date(lastApiSync).getTime();
  if (Number.isNaN(syncedAt)) return true;

  return Date.now() - syncedAt > PLAYER_PROFILE_REFRESH_MS;
}

function mergePlayerProfileFromApi(dbPlayerData: PlayerData, apiPlayerData: PlayerData): PlayerData {
  const apiStat = apiPlayerData.statistics[0];
  const dbStat = dbPlayerData.statistics[0];

  return {
    ...dbPlayerData,
    info: {
      ...dbPlayerData.info,
      firstname: dbPlayerData.info.firstname || apiPlayerData.info.firstname,
      lastname: dbPlayerData.info.lastname || apiPlayerData.info.lastname,
      age: dbPlayerData.info.age || apiPlayerData.info.age,
      birth: {
        date: dbPlayerData.info.birth.date || apiPlayerData.info.birth.date,
        place: dbPlayerData.info.birth.place || apiPlayerData.info.birth.place,
        country: dbPlayerData.info.birth.country || apiPlayerData.info.birth.country,
      },
      nationality: dbPlayerData.info.nationality || apiPlayerData.info.nationality,
      height: dbPlayerData.info.height || apiPlayerData.info.height,
      weight: dbPlayerData.info.weight || apiPlayerData.info.weight,
      injured: dbPlayerData.info.injured || apiPlayerData.info.injured,
      photo: dbPlayerData.info.photo || apiPlayerData.info.photo,
    },
    statistics: dbStat ? [{
      ...dbStat,
      team: apiStat?.team?.id ? apiStat.team : dbStat.team,
      league: apiStat?.league?.id ? apiStat.league : dbStat.league,
      games: {
        ...dbStat.games,
        number: apiStat?.games?.number || dbStat.games.number,
        position: apiStat?.games?.position || dbStat.games.position,
      },
    }] : apiPlayerData.statistics,
  };
}

function parseMetricNumber(value: string | number | undefined): number | null {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : null;
  if (!value) return null;

  const match = value.match(/\d+/);
  if (!match) return null;

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function hasApiPlayerProfile(apiPlayer?: ApiPlayerResponse['player']): boolean {
  return Boolean(apiPlayer?.id && (
    apiPlayer?.number ||
    apiPlayer?.position ||
    apiPlayer?.age ||
    apiPlayer?.photo ||
    apiPlayer?.height ||
    apiPlayer?.weight ||
    apiPlayer?.birth?.date ||
    apiPlayer?.birth?.place ||
    apiPlayer?.birth?.country ||
    apiPlayer?.nationality
  ));
}

async function persistPlayerProfileFromApi(
  playerId: number,
  apiResponse?: ApiPlayerResponse
): Promise<void> {
  const apiPlayer = apiResponse?.player;
  if (!hasApiPlayerProfile(apiPlayer)) return;

  try {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    await supabase
      .from('football_players')
      .update({
        age: apiPlayer?.age || null,
        height: parseMetricNumber(apiPlayer?.height),
        weight: parseMetricNumber(apiPlayer?.weight),
        number: apiPlayer?.number || null,
        position: apiPlayer?.position || null,
        nationality: apiPlayer?.nationality || null,
        photo_url: apiPlayer?.photo || null,
        api_data: {
          raw: apiResponse,
          lastSync: now,
          source: 'players',
        },
        last_api_sync: now,
        updated_at: now,
      })
      .eq('player_id', playerId);
  } catch (error) {
    console.error('[persistPlayerBioFromApi] failed:', error);
  }
}

async function fetchPlayerDataFromDb(id: string): Promise<PlayerDataWithSync | null> {
  const playerId = Number(id);
  if (!Number.isFinite(playerId)) return null;

  try {
    const supabase = await getSupabaseServer();
    const { data: playerRow, error } = await supabase
      .from('football_players')
      .select('player_id,name,korean_name,display_name,team_id,team_name,position,number,nationality,nationality_ko,age,height,weight,photo_url,photo_cached_url,api_data,is_active,last_api_sync')
      .eq('player_id', playerId)
      .maybeSingle();

    if (error || !playerRow || playerRow.is_active === false) {
      return null;
    }

    let teamRow: TeamDbRow | null = null;
    if (playerRow.team_id) {
      const { data: teamData } = await supabase
        .from('football_teams')
        .select('team_id,name,name_ko,logo_url,logo_cached_url,league_id,league_name,league_name_ko,league_logo_url,country,current_season')
        .eq('team_id', playerRow.team_id)
        .maybeSingle();

      teamRow = teamData ?? null;
    }

    return buildPlayerDataFromDb(playerRow as PlayerDbRow, teamRow);
  } catch {
    return null;
  }
}

function buildPlayerDataFromDb(row: PlayerDbRow, teamRow: TeamDbRow | null): PlayerDataWithSync {
  const raw = getApiRawPlayer(row);
  const englishName = row.display_name || row.name || raw.name || `Player ${row.player_id}`;
  const displayName = row.korean_name || row.display_name || row.name || raw.name || `Player ${row.player_id}`;
  const split = splitName(englishName);
  const teamName = teamRow?.name_ko || row.team_name || teamRow?.name || '';
  const leagueName = teamRow?.league_name_ko || teamRow?.league_name || '';
  const position = row.position || raw.position || '';

  return {
    lastApiSync: row.last_api_sync || null,
    info: {
      id: row.player_id,
      name: displayName,
      firstname: raw.firstname || split.firstname,
      lastname: raw.lastname || split.lastname,
      age: row.age || raw.age || 0,
      birth: {
        date: raw.birth?.date || '',
        place: raw.birth?.place || '',
        country: raw.birth?.country || '',
      },
      nationality: row.nationality_ko || row.nationality || raw.nationality || '',
      height: formatMetric(row.height ?? raw.height, 'cm'),
      weight: formatMetric(row.weight ?? raw.weight, 'kg'),
      injured: raw.injured || false,
      photo: row.photo_cached_url || row.photo_url || raw.photo || '',
    },
    statistics: row.team_id ? [{
      team: {
        id: row.team_id,
        name: teamName,
        logo: teamRow?.logo_cached_url || teamRow?.logo_url || '',
      },
      league: {
        id: teamRow?.league_id || 0,
        name: leagueName,
        country: teamRow?.country || '',
        logo: teamRow?.league_logo_url || '',
        season: teamRow?.current_season || getCurrentSeason(),
      },
      games: {
        appearences: 0,
        lineups: 0,
        minutes: 0,
        number: row.number || raw.number,
        position,
        rating: '',
        captain: false,
      },
      substitutes: { in: 0, out: 0, bench: 0 },
      goals: { total: 0, assists: 0, saves: 0, conceded: 0, cleansheets: 0 },
      shots: { total: 0, on: 0 },
      passes: { total: 0, key: 0, accuracy: '', cross: 0 },
      tackles: { total: 0, blocks: 0, interceptions: 0, clearances: 0 },
      duels: { total: 0, won: 0 },
      dribbles: { attempts: 0, success: 0, past: 0 },
      fouls: { drawn: 0, committed: 0 },
      cards: { yellow: 0, yellowred: 0, red: 0 },
      penalty: { won: 0, commited: 0, scored: 0, missed: 0, saved: 0 },
    }] : [],
  };
}

function getLeaguePriority(leagueId: number): number {
  // 메이저 리그 (Top 5)
  const majorLeagues = [39, 140, 78, 135, 61]; // 프리미어, 라리가, 분데스, 세리에A, 리그1
  if (majorLeagues.includes(leagueId)) return 1;

  // 2군 유럽 리그
  const secondTierLeagues = [40, 179, 88, 94, 119]; // 챔피언십, 스코틀랜드, 에레디비지에, 프리메이라, 슈퍼리가
  if (secondTierLeagues.includes(leagueId)) return 2;

  // 주요 아시아/아메리카 리그
  const otherMajorLeagues = [292, 98, 253, 307, 71, 262, 169]; // K리그, J리그, MLS, 사우디, 브라질, 리가MX, 중국
  if (otherMajorLeagues.includes(leagueId)) return 3;

  // 유럽 컵 대회
  const europeanCups = [2, 3, 848]; // 챔스, 유로파, 컨퍼런스
  if (europeanCups.includes(leagueId)) return 4;

  // 기타 컵 대회 (최하위 우선순위)
  return 5;
}

/**
 * API 응답을 내부 타입으로 변환
 */
function formatPlayerData(player: ApiPlayerResponse, season: number): PlayerData {
  // 통계 데이터를 리그 우선순위로 정렬
  const sortedStatistics = player?.statistics?.sort((a, b) => {
    const priorityA = getLeaguePriority(a.league?.id || 0);
    const priorityB = getLeaguePriority(b.league?.id || 0);

    // 우선순위가 다르면 우선순위로 정렬
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // 같은 우선순위면 출전 경기 수로 정렬 (많은 것이 우선)
    const appearencesA = a.games?.appearences || 0;
    const appearencesB = b.games?.appearences || 0;
    return appearencesB - appearencesA;
  }) || [];

  return {
    info: {
      id: player.player?.id || 0,
      name: player.player?.name || '',
      firstname: player.player?.firstname || '',
      lastname: player.player?.lastname || '',
      age: player.player?.age || 0,
      birth: {
        date: player.player?.birth?.date || '',
        place: player.player?.birth?.place || '',
        country: player.player?.birth?.country || '',
      },
      nationality: player.player?.nationality || '',
      height: player.player?.height || '',
      weight: player.player?.weight || '',
      injured: player.player?.injured || false,
      photo: player.player?.photo || '',
    },
    statistics: sortedStatistics.map((stat) => ({
      team: {
        id: stat.team?.id || 0,
        name: stat.team?.name || '',
        logo: stat.team?.logo || '',
      },
      league: {
        id: stat.league?.id || 0,
        name: stat.league?.name || '',
        country: stat.league?.country || '',
        logo: stat.league?.logo || '',
        season: stat.league?.season || season,
      },
      games: {
        appearences: stat.games?.appearences || 0,
        lineups: stat.games?.lineups || 0,
        minutes: stat.games?.minutes || 0,
        position: stat.games?.position || '',
        rating: stat.games?.rating || '',
        captain: stat.games?.captain || false,
      },
      substitutes: {
        in: 0,
        out: 0,
        bench: 0
      },
      goals: {
        total: stat.goals?.total || 0,
        assists: stat.goals?.assists || 0,
        saves: stat.goals?.saves || 0,
        conceded: stat.goals?.conceded || 0,
        cleansheets: stat.goals?.cleansheets || 0
      },
      shots: {
        total: 0,
        on: 0
      },
      passes: {
        total: stat.passes?.total || 0,
        key: stat.passes?.key || 0,
        accuracy: typeof stat.passes?.accuracy === 'number' 
          ? `${stat.passes.accuracy}%`
          : stat.passes?.accuracy || '',
        cross: 0
      },
      dribbles: {
        attempts: stat.dribbles?.attempts || 0,
        success: stat.dribbles?.success || 0,
        past: stat.dribbles?.past || 0
      },
      duels: {
        total: stat.duels?.total || 0,
        won: stat.duels?.won || 0
      },
      tackles: {
        total: stat.tackles?.total || 0,
        blocks: stat.tackles?.blocks || 0,
        interceptions: stat.tackles?.interceptions || 0,
        clearances: 0
      },
      fouls: {
        drawn: stat.fouls?.drawn || 0,
        committed: stat.fouls?.committed || 0
      },
      cards: {
        yellow: stat.cards?.yellow || 0,
        yellowred: stat.cards?.yellowred || 0,
        red: stat.cards?.red || 0
      },
      penalty: {
        won: stat.penalty?.won || 0,
        commited: stat.penalty?.committed || 0,
        scored: stat.penalty?.scored || 0,
        missed: stat.penalty?.missed || 0,
        saved: stat.penalty?.saved || 0
      }
    })) || []
  };
}

// 캐싱 적용 함수
export const fetchCachedPlayerData = cache(fetchPlayerData);
