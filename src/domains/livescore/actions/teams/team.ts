'use server';

import { cache } from 'react';
import { getTeamById } from '@/domains/livescore/actions/teamLeagueData';
import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi';
import { getCurrentSeasonForLeague } from '@/domains/livescore/actions/teamLeagueData';
import { getSupabaseServer } from '@/shared/lib/supabase/server';

// 팀 정보 인터페이스
export interface TeamData {
  id: number;
  name: string;
  code?: string;
  country?: string;
  founded?: number;
  logo: string;
  venue?: {
    name: string;
    address: string;
    city: string;
    capacity: number;
    image: string;
  };
}

export interface TeamInfo {
  team: TeamData;
  venue?: {
    id?: number;
    name: string;
    address: string;
    city: string;
    capacity: number;
    surface?: string;
    image: string;
  };
}

// 골 데이터 정의
interface GoalData {
  total: { 
    home: number; 
    away: number; 
    total: number;
  };
  average?: {
    home: string;
    away: string;
    total: string;
  };
  minute?: Record<string, { 
    total: number | null; 
    percentage: string | null; 
  }>;
}

// 팀 스탯 인터페이스
export interface TeamStats {
  league?: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
  };
  fixtures?: {
    played: { home: number; away: number; total: number };
    wins: { home: number; away: number; total: number };
    draws: { home: number; away: number; total: number };
    loses: { home: number; away: number; total: number };
  };
  goals?: {
    for: GoalData;
    against: GoalData;
  };
  clean_sheet?: { 
    total: number;
    home: number;
    away: number;
  };
  form?: string;
  lineups?: Array<{
    formation: string;
    played: number;
  }>;
  cards?: {
    yellow: Record<string, { total: number; percentage: string }>;
    red: Record<string, { total: number; percentage: string }>;
  };
  penalty?: {
    total: number;
    scored: { total: number; percentage: string };
    missed: { total: number; percentage: string };
  };
  failed_to_score?: {
    home: number;
    away: number;
    total: number;
  };
  biggest?: {
    streak: { wins: number; draws: number; loses: number };
    wins: { home: string; away: string };
    loses: { home: string; away: string };
  };
}

export interface TeamResponse {
  success: boolean;
  team?: TeamInfo;
  stats?: TeamStats;
  message: string;
}

// 데이터 모듈 import
export interface TeamSeoDataResponse {
  success: boolean;
  message: string;
  team?: {
    id: number;
    name: string;
    country?: string | null;
    founded?: number;
    logo?: string;
  };
}

import { fetchCachedTeamMatches as getTeamMatches, fetchCachedTeamMatchesUnified as getTeamMatchesUnified, Match } from './matches';
import { fetchCachedTeamSquad as getTeamSquad, Player, Coach } from './squad';
import { fetchCachedTeamPlayerStats as getTeamPlayerStats, PlayerStats } from './player-stats';
import { fetchCachedTeamStandings as getTeamStandings, Standing } from './standings';
import { fetchCachedTeamTransfers as getTeamTransfers, TeamTransfersData } from './transfers';
import { getPlayerPhotoUrls, getTeamLogoUrls, getCoachPhotoUrls, getLeagueLogoUrls, getVenueImageUrl } from '@/domains/livescore/actions/images';
import { getPlayersKoreanNames } from '@/domains/livescore/actions/player/getKoreanName';

type TeamPerfStep = {
  label: string;
  ms: number;
};

type TeamPerfTrace = {
  enabled: boolean;
  mark: <T>(label: string, task: () => Promise<T>) => Promise<T>;
  snapshot: () => TeamPerfStep[];
  log: (label: string) => void;
};

export type TeamFullDataOptions = {
  fetchMatches: boolean;
  fetchSquad: boolean;
  fetchPlayerStats: boolean;
  fetchStandings: boolean;
  fetchTransfers: boolean;
  fetchMatchesMode?: 'season' | 'recent';
  matchLimit?: number;
};

type TeamDbRow = {
  team_id: number;
  name: string | null;
  name_ko: string | null;
  country: string | null;
  country_ko: string | null;
  code: string | null;
  logo_url: string | null;
  logo_cached_url: string | null;
  league_id: number | null;
  founded: number | null;
  venue_id: number | null;
  venue_name: string | null;
  venue_address: string | null;
  venue_city: string | null;
  venue_capacity: number | null;
  venue_surface: string | null;
  current_season: number | null;
  league_name: string | null;
  league_name_ko: string | null;
  league_logo_url: string | null;
  api_data: {
    team?: {
      logo?: string;
    };
    venue?: {
      image?: string;
    };
    standing?: {
      all?: { played?: number; win?: number; draw?: number; lose?: number; goals?: { for?: number; against?: number } };
      home?: { played?: number; win?: number; draw?: number; lose?: number; goals?: { for?: number; against?: number } };
      away?: { played?: number; win?: number; draw?: number; lose?: number; goals?: { for?: number; against?: number } };
      form?: string;
    };
  } | null;
};

function buildTeamInfoFromDb(row: TeamDbRow): TeamInfo {
  return {
    team: {
      id: row.team_id,
      name: row.name_ko || row.name || `Team ${row.team_id}`,
      code: row.code || undefined,
      country: row.country_ko || row.country || undefined,
      founded: row.founded || undefined,
      logo: row.logo_cached_url || row.logo_url || row.api_data?.team?.logo || '',
    },
    venue: row.venue_id || row.venue_name ? {
      id: row.venue_id || undefined,
      name: row.venue_name || '',
      address: row.venue_address || '',
      city: row.venue_city || '',
      capacity: row.venue_capacity || 0,
      surface: row.venue_surface || undefined,
      image: row.api_data?.venue?.image || '',
    } : undefined,
  };
}

function createTeamPerfTrace(_teamId?: string, _scope?: string): TeamPerfTrace {
  void _teamId;
  void _scope;

  return {
    enabled: false,
    mark: async <T,>(_label: string, task: () => Promise<T>): Promise<T> => task(),
    snapshot: () => [],
    log: () => undefined,
  };
}

// 통합 응답 타입 정의
export interface TeamFullDataResponse {
  success: boolean;
  message: string;
  teamData?: TeamResponse;
  matches?: { success: boolean; data?: Match[]; message: string };
  squad?: { success: boolean; data?: (Player | Coach)[]; message: string };
  playerStats?: { success: boolean; data?: Record<number, PlayerStats>; message: string };
  standings?: { success: boolean; data?: Standing[]; message: string };
  transfers?: { success: boolean; data?: TeamTransfersData; message: string };
  matchesMode?: 'season' | 'recent';
  // 4590 표준: 이미지 Storage URL
  playerPhotoUrls?: Record<number, string>;
  teamLogoUrls?: Record<number, string>;
  coachPhotoUrls?: Record<number, string>;
  leagueLogoUrls?: Record<number, string>;
  leagueLogoDarkUrls?: Record<number, string>;  // 다크모드 리그 로고
  venueImageUrl?: string;  // 경기장 이미지 URL
  perf?: {
    steps: TeamPerfStep[];
  };
  [key: string]: unknown; // 인덱스 시그니처
}

async function fetchTeamData(
  teamId: string,
  perf = createTeamPerfTrace(teamId, 'team-data'),
): Promise<TeamResponse> {
  try {
    if (!teamId) {
      throw new Error('팀 ID는 필수입니다');
    }

    // 팀 정보 API 요청
    let teamInfo: TeamInfo | null = null;
    let leagueId = 39;
    let dbLeagueFound = false;
    let currentSeason: number | null = null;
    let statsData: TeamStats | null = null;
    let teamInfoFromDb = false;

    try {
      const { data: teamRow } = await perf.mark('db:team-row', async () => {
        const supabase = await getSupabaseServer();
        return supabase
          .from('football_teams')
          .select('team_id, name, name_ko, country, country_ko, code, logo_url, logo_cached_url, league_id, league_name, league_name_ko, league_logo_url, founded, venue_id, venue_name, venue_address, venue_city, venue_capacity, venue_surface, current_season, api_data')
          .eq('team_id', Number(teamId))
          .maybeSingle();
      });

      const row = teamRow as TeamDbRow | null;
      if (row) {
        teamInfo = buildTeamInfoFromDb(row);
        teamInfoFromDb = true;
      }

      if (typeof row?.league_id === 'number') {
        leagueId = row.league_id;
        dbLeagueFound = true;
      }

      if (typeof row?.current_season === 'number') {
        currentSeason = row.current_season;
      }
    } catch {
      // keep API fallback
    }

    const teamData = teamInfo ? null : await perf.mark('api:teams:fallback', () => fetchFromFootballApi('teams', { id: teamId }));
    
    if (!teamInfo && !teamData?.response?.[0]) {
      return { 
        success: false,
        message: '팀 데이터를 찾을 수 없습니다'
      };
    }
    
    // 팀 정보와 스탯 데이터 병합
    if (!teamInfo) {
      teamInfo = teamData!.response[0] as TeamInfo;
    }
    
    // API에서 팀 스탯 가져오기 (현재 시즌)
    // DB에서 팀의 리그 ID를 먼저 조회하여 정확한 시즌 결정
    if (!dbLeagueFound) {
      try {
        const { data: teamRow } = await perf.mark('db:team-league-id', async () => {
          const supabase = await getSupabaseServer();
          return supabase
            .from('football_teams')
            .select('league_id')
            .eq('team_id', Number(teamId))
            .single();
        });
        if (teamRow?.league_id) {
          leagueId = teamRow.league_id;
          dbLeagueFound = true;
        }
      } catch {
        // DB 조회 실패 시 API로 fallback
      }
    }

    // 리그에 맞는 시즌 계산 (K리그 등 캘린더 시즌 리그 대응)
    currentSeason = currentSeason ?? await perf.mark('db:current-season', () => getCurrentSeasonForLeague(leagueId));

    // DB에서 리그를 못 찾았으면 API로 재조회 (현재 연도 + 유럽 시즌 둘 다 시도)
    if (!dbLeagueFound) {
      interface LeagueResponse {
        league: {
          id: number;
          name: string;
          type: string;
        };
      }

      const findMainLeague = (leagues: LeagueResponse[]) =>
        leagues.find(
          (league) => league.league.type === 'League' &&
            !league.league.name.includes('Champions') &&
            !league.league.name.includes('Europa') &&
            !league.league.name.includes('Conference')
        );

      const currentYear = new Date().getFullYear();
      const europeanSeason = new Date().getMonth() > 6 ? currentYear : currentYear - 1;
      const seasonsToTry = [...new Set([currentYear, europeanSeason])];

      for (const season of seasonsToTry) {
        try {
          const leaguesData = await perf.mark(`api:leagues:fallback:${season}`, () => fetchFromFootballApi('leagues', { team: teamId, season }));
          const leagues = (leaguesData.response || []) as LeagueResponse[];
          const mainLeague = findMainLeague(leagues);

          if (mainLeague) {
            leagueId = mainLeague.league.id;
            currentSeason = await perf.mark('db:current-season:fallback', () => getCurrentSeasonForLeague(leagueId));
            break;
          } else if (leagues.length > 0) {
            leagueId = leagues[0].league.id;
            currentSeason = await perf.mark('db:current-season:fallback', () => getCurrentSeasonForLeague(leagueId));
            break;
          }
        } catch {
          // 다음 시즌 시도
        }
      }
    }

    try {
      const statsResult = await perf.mark('api:teams-statistics', () => fetchFromFootballApi('teams/statistics', { team: teamId, season: currentSeason, league: leagueId }));
      if (statsResult?.response) {
        statsData = statsResult.response as TeamStats;
      }
    } catch {
      // stats 실패해도 팀 기본 정보는 반환
    }
    
    // 팀 매핑 정보 적용
    if (!teamInfoFromDb) {
      const teamMapping = await perf.mark('db:team-name-mapping', () => getTeamById(Number(teamId)));
      if (teamMapping && teamInfo.team) {
        teamInfo.team.name = teamMapping.name_ko || teamInfo.team.name;
      }
    }
    
    return { 
      success: true,
      team: teamInfo,
      stats: statsData || {},
      message: '팀 데이터를 성공적으로 가져왔습니다'
    };

  } catch (error) {
    return { 
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 특정 팀의 기본 정보를 가져오는 캐시된 함수 
 * @param teamId 팀 ID
 */
export const fetchCachedTeamData = cache(
  async (teamId: string): Promise<TeamResponse> => {
    return fetchTeamData(teamId);
  }
);

export const fetchTeamStatsTabData = cache(
  async (teamId: string): Promise<TeamResponse> => {
    return fetchTeamData(teamId, createTeamPerfTrace(teamId, 'team-stats-tab'));
  }
);

export const fetchTeamSeoData = cache(
  async (teamId: string): Promise<TeamSeoDataResponse> => {
    const numericTeamId = parseInt(teamId, 10);

    if (!teamId || Number.isNaN(numericTeamId)) {
      return {
        success: false,
        message: '팀 ID는 필수입니다',
      };
    }

    const teamMapping = await getTeamById(numericTeamId);
    if (teamMapping) {
      return {
        success: true,
        message: '팀 SEO 데이터를 성공적으로 가져왔습니다',
        team: {
          id: numericTeamId,
          name: teamMapping.name_ko || teamMapping.name_en,
          country: teamMapping.country_ko || teamMapping.country_en,
        },
      };
    }

    try {
      const teamData = await fetchFromFootballApi('teams', { id: teamId });
      const team = teamData?.response?.[0]?.team;

      if (!team) {
        return {
          success: false,
          message: '팀 데이터를 찾을 수 없습니다',
        };
      }

      return {
        success: true,
        message: '팀 SEO 데이터를 성공적으로 가져왔습니다',
        team: {
          id: team.id || numericTeamId,
          name: team.name,
          country: team.country,
          founded: team.founded,
          logo: team.logo,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
      };
    }
  }
);

/**
 * 팀의 모든 관련 데이터를 한 번에 가져오는 통합 서버 액션
 * @param teamId 팀 ID
 * @param options 가져올 데이터 타입을 지정하는 옵션
 */
export const fetchTeamOverviewStandingsData = cache(
  async (teamId: string) => {
    const standings = await getTeamStandings(teamId);
    const teamIds = new Set<number>();
    const leagueIds = new Set<number>();

    for (const standing of standings.data || []) {
      if (standing.league?.id) leagueIds.add(standing.league.id);

      for (const group of standing.league?.standings || []) {
        for (const item of group || []) {
          if (item.team?.id) teamIds.add(item.team.id);
        }
      }
    }

    const [teamLogoUrls, leagueLogoUrls, leagueLogoDarkUrls] = await Promise.all([
      teamIds.size > 0 ? getTeamLogoUrls([...teamIds]) : {},
      leagueIds.size > 0 ? getLeagueLogoUrls([...leagueIds]) : {},
      leagueIds.size > 0 ? getLeagueLogoUrls([...leagueIds], true) : {},
    ]);

    return {
      success: standings.success,
      message: standings.message,
      standings: standings.data,
      teamLogoUrls,
      leagueLogoUrls,
      leagueLogoDarkUrls,
    };
  }
);

export const fetchTeamOverviewTransfersData = cache(
  async (teamId: string) => {
    const transfers = await getTeamTransfers(teamId);
    const previewTransfers = [
      ...(transfers.data?.in || []).slice(0, 3),
      ...(transfers.data?.out || []).slice(0, 3),
    ];
    const playerIds = new Set<number>();
    const teamIds = new Set<number>();

    for (const transfer of previewTransfers) {
      playerIds.add(transfer.player.id);
      if ('fromTeam' in transfer && transfer.fromTeam?.id) {
        teamIds.add(transfer.fromTeam.id);
      }
      if ('toTeam' in transfer && transfer.toTeam?.id) {
        teamIds.add(transfer.toTeam.id);
      }
    }

    const [playerKoreanNames, playerPhotoUrls, teamLogoUrls] = await Promise.all([
      playerIds.size > 0 ? getPlayersKoreanNames([...playerIds]) : {},
      playerIds.size > 0 ? getPlayerPhotoUrls([...playerIds]) : {},
      teamIds.size > 0 ? getTeamLogoUrls([...teamIds]) : {},
    ]);

    return {
      success: transfers.success,
      message: transfers.message,
      transfers: transfers.data,
      playerKoreanNames,
      playerPhotoUrls,
      teamLogoUrls,
    };
  }
);

async function withTransferEnhancementTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return Promise.race([
    promise.catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), 1500)),
  ]);
}

export const fetchTeamTransfersTabData = cache(
  async (teamId: string) => {
    const transfers = await getTeamTransfers(teamId);
    const playerIds = new Set<number>();
    const teamIds = new Set<number>();

    for (const transfer of [...(transfers.data?.in || []), ...(transfers.data?.out || [])]) {
      playerIds.add(transfer.player.id);
      if ('fromTeam' in transfer && transfer.fromTeam?.id) {
        teamIds.add(transfer.fromTeam.id);
      }
      if ('toTeam' in transfer && transfer.toTeam?.id) {
        teamIds.add(transfer.toTeam.id);
      }
    }

    const [playerKoreanNames, playerPhotoUrls, teamLogoUrls] = await Promise.all([
      playerIds.size > 0 ? getPlayersKoreanNames([...playerIds]) : {},
      playerIds.size > 0 ? withTransferEnhancementTimeout(getPlayerPhotoUrls([...playerIds]), {}) : {},
      teamIds.size > 0 ? withTransferEnhancementTimeout(getTeamLogoUrls([...teamIds]), {}) : {},
    ]);

    return {
      success: transfers.success,
      message: transfers.message,
      transfers: transfers.data,
      playerKoreanNames,
      playerPhotoUrls,
      teamLogoUrls,
    };
  }
);

export const fetchTeamSquadTabData = cache(
  async (teamId: string) => {
    const [squad, playerStats] = await Promise.all([
      getTeamSquad(teamId),
      getTeamPlayerStats(teamId),
    ]);

    const playerIds = new Set<number>();
    const coachIds = new Set<number>();

    for (const member of squad.data || []) {
      if (member.position === 'Coach') {
        coachIds.add(member.id);
      } else {
        playerIds.add(member.id);
      }
    }

    for (const id of Object.keys(playerStats.data || {})) {
      playerIds.add(Number(id));
    }

    const [playerKoreanNames, playerPhotoUrls, coachPhotoUrls] = await Promise.all([
      playerIds.size > 0 ? getPlayersKoreanNames([...playerIds]) : {},
      playerIds.size > 0 ? getPlayerPhotoUrls([...playerIds]) : {},
      coachIds.size > 0 ? getCoachPhotoUrls([...coachIds]) : {},
    ]);

    return {
      success: squad.success && playerStats.success,
      message: squad.message || playerStats.message,
      squad: squad.data,
      playerStats: playerStats.data,
      playerKoreanNames,
      playerPhotoUrls,
      coachPhotoUrls,
    };
  }
);

export const fetchTeamOverviewMatchesData = cache(
  async (teamId: string, limit = 10) => {
    const matches = await getTeamMatchesUnified(teamId, { mode: 'recent', limit });
    const teamIds = new Set<number>();
    const leagueIds = new Set<number>();

    for (const match of matches.data || []) {
      if (match.teams?.home?.id) teamIds.add(match.teams.home.id);
      if (match.teams?.away?.id) teamIds.add(match.teams.away.id);
      if (match.league?.id) leagueIds.add(match.league.id);
    }

    const [teamLogoUrls, leagueLogoUrls, leagueLogoDarkUrls] = await Promise.all([
      teamIds.size > 0 ? getTeamLogoUrls([...teamIds]) : {},
      leagueIds.size > 0 ? getLeagueLogoUrls([...leagueIds]) : {},
      leagueIds.size > 0 ? getLeagueLogoUrls([...leagueIds], true) : {},
    ]);

    return {
      success: matches.success,
      message: matches.message,
      matches: matches.data,
      teamLogoUrls,
      leagueLogoUrls,
      leagueLogoDarkUrls,
    };
  }
);

async function buildTeamOverviewMatchesData(
  teamId: string,
  mode: 'last' | 'next',
  limit = 5
) {
  const matches = await getTeamMatchesUnified(teamId, { mode, limit });
  const teamIds = new Set<number>();
  const leagueIds = new Set<number>();

  for (const match of matches.data || []) {
    if (match.teams?.home?.id) teamIds.add(match.teams.home.id);
    if (match.teams?.away?.id) teamIds.add(match.teams.away.id);
    if (match.league?.id) leagueIds.add(match.league.id);
  }

  const [teamLogoUrls, leagueLogoUrls, leagueLogoDarkUrls] = await Promise.all([
    teamIds.size > 0 ? getTeamLogoUrls([...teamIds]) : {},
    leagueIds.size > 0 ? getLeagueLogoUrls([...leagueIds]) : {},
    leagueIds.size > 0 ? getLeagueLogoUrls([...leagueIds], true) : {},
  ]);

  return {
    success: matches.success,
    message: matches.message,
    matches: matches.data,
    teamLogoUrls,
    leagueLogoUrls,
    leagueLogoDarkUrls,
  };
}

export const fetchTeamOverviewRecentMatchesData = cache(
  async (teamId: string, limit = 5) => buildTeamOverviewMatchesData(teamId, 'last', limit)
);

export const fetchTeamOverviewUpcomingMatchesData = cache(
  async (teamId: string, limit = 5) => buildTeamOverviewMatchesData(teamId, 'next', limit)
);

export const fetchTeamFixturesTabData = cache(
  async (teamId: string) => {
    const matches = await getTeamMatchesUnified(teamId, { mode: 'season' });
    const teamIds = new Set<number>();
    const leagueIds = new Set<number>();

    for (const match of matches.data || []) {
      if (match.teams?.home?.id) teamIds.add(match.teams.home.id);
      if (match.teams?.away?.id) teamIds.add(match.teams.away.id);
      if (match.league?.id) leagueIds.add(match.league.id);
    }

    const [teamLogoUrls, leagueLogoUrls, leagueLogoDarkUrls] = await Promise.all([
      teamIds.size > 0 ? getTeamLogoUrls([...teamIds]) : {},
      leagueIds.size > 0 ? getLeagueLogoUrls([...leagueIds]) : {},
      leagueIds.size > 0 ? getLeagueLogoUrls([...leagueIds], true) : {},
    ]);

    return {
      success: matches.success,
      message: matches.message,
      matches: matches.data,
      teamLogoUrls,
      leagueLogoUrls,
      leagueLogoDarkUrls,
    };
  }
);

export const fetchTeamFullData = cache(
  async (
    teamId: string, 
    options: TeamFullDataOptions = {
      fetchMatches: true,
      fetchSquad: true,
      fetchPlayerStats: true,
      fetchStandings: true,
      fetchTransfers: true,
      fetchMatchesMode: 'season',
      matchLimit: 10,
    }
  ): Promise<TeamFullDataResponse> => {
    const perf = createTeamPerfTrace(teamId, 'full-data');

    try {
      const numericTeamId = parseInt(teamId, 10);

      // 기본 팀 데이터 (info + stats 통합)
      const teamData = await fetchTeamData(teamId, perf);

      if (!teamData.success) {
        return {
          success: false,
          message: teamData.message,
          teamData
        };
      }

      // 필요한 데이터를 병렬로 요청하여 성능 최적화
      const promises: Promise<unknown>[] = [];
      const dataTypes: string[] = [];
      let resolvedMatchesMode: 'season' | 'recent' | undefined;

      if (options.fetchMatches) {
        const matchMode = options.fetchMatchesMode ?? 'season';
        const matchLimit = options.matchLimit ?? 10;
        resolvedMatchesMode = matchMode;
        promises.push(perf.mark(`data:matches:${matchMode}`, () => {
          if (matchMode === 'recent') {
            return getTeamMatchesUnified(teamId, { mode: 'recent', limit: matchLimit });
          }

          return getTeamMatches(teamId);
        }));
        dataTypes.push('matches');
      }

      if (options.fetchSquad) {
        promises.push(perf.mark('data:squad', () => getTeamSquad(teamId)));
        dataTypes.push('squad');
      }

      if (options.fetchPlayerStats) {
        promises.push(perf.mark('data:player-stats', () => getTeamPlayerStats(teamId)));
        dataTypes.push('playerStats');
      }

      if (options.fetchStandings) {
        promises.push(perf.mark('data:standings', () => getTeamStandings(teamId)));
        dataTypes.push('standings');
      }

      if (options.fetchTransfers) {
        promises.push(perf.mark('data:transfers', () => getTeamTransfers(teamId)));
        dataTypes.push('transfers');
      }

      // 모든 데이터 병렬로 요청
      const results = await perf.mark('data:parallel-total', () => Promise.all(promises));

      // 결과 조합
      const response: TeamFullDataResponse = {
        success: true,
        message: '팀 데이터를 성공적으로 가져왔습니다',
        teamData,
        matchesMode: resolvedMatchesMode
      };

      // 결과 매핑
      dataTypes.forEach((type, index) => {
        response[type] = results[index];
      });

      // 4590 표준: 모든 선수/팀/감독 ID 수집하여 이미지 URL 배치 조회
      const allPlayerIds = new Set<number>();
      const allTeamIds = new Set<number>([numericTeamId]); // 현재 팀 포함
      const allCoachIds = new Set<number>();

      // squad에서 선수/감독 ID 수집
      const squadData = response.squad as { success: boolean; data?: (Player | Coach)[] } | undefined;
      if (squadData?.data) {
        for (const member of squadData.data) {
          if (member.position === 'Coach') {
            allCoachIds.add(member.id);
          } else {
            allPlayerIds.add(member.id);
          }
        }
      }

      // playerStats에서 선수 ID 수집
      const playerStatsData = response.playerStats as { success: boolean; data?: Record<number, PlayerStats> } | undefined;
      if (playerStatsData?.data) {
        for (const id of Object.keys(playerStatsData.data)) {
          allPlayerIds.add(Number(id));
        }
      }

      // transfers에서 선수 ID, 팀 ID 수집
      const transfersData = response.transfers as { success: boolean; data?: TeamTransfersData } | undefined;
      if (transfersData?.data) {
        for (const transfer of transfersData.data.in || []) {
          allPlayerIds.add(transfer.player.id);
          if (transfer.fromTeam?.id) allTeamIds.add(transfer.fromTeam.id);
        }
        for (const transfer of transfersData.data.out || []) {
          allPlayerIds.add(transfer.player.id);
          if (transfer.toTeam?.id) allTeamIds.add(transfer.toTeam.id);
        }
      }

      // matches에서 팀 ID, 리그 ID 수집
      const allLeagueIds = new Set<number>();
      const matchesData = response.matches as { success: boolean; data?: Match[] } | undefined;
      if (matchesData?.data) {
        for (const match of matchesData.data) {
          allTeamIds.add(match.teams.home.id);
          allTeamIds.add(match.teams.away.id);
          if ((match.league as { id?: number }).id) {
            allLeagueIds.add((match.league as { id: number }).id);
          }
        }
      }

      // standings에서 팀 ID 수집
      const standingsData = response.standings as { success: boolean; data?: Array<{ league?: { standings?: Array<Array<{ team?: { id?: number } }>> } }> } | undefined;
      if (standingsData?.data) {
        for (const standing of standingsData.data) {
          const groups = standing.league?.standings || [];
          for (const group of groups) {
            if (Array.isArray(group)) {
              for (const item of group) {
                if (item.team?.id) allTeamIds.add(item.team.id);
              }
            }
          }
        }
      }

      // stats에서 리그 ID 수집
      if (teamData.stats?.league?.id) {
        allLeagueIds.add(teamData.stats.league.id);
      }

      // 이미지 URL 배치 조회 (다크모드 리그 로고 포함)
      const [playerPhotoUrls, teamLogoUrls, coachPhotoUrls, leagueLogoUrls, leagueLogoDarkUrls] = await perf.mark('images:batch-total', () => Promise.all([
        allPlayerIds.size > 0 ? getPlayerPhotoUrls([...allPlayerIds]) : {},
        allTeamIds.size > 0 ? getTeamLogoUrls([...allTeamIds]) : {},
        allCoachIds.size > 0 ? getCoachPhotoUrls([...allCoachIds]) : {},
        allLeagueIds.size > 0 ? getLeagueLogoUrls([...allLeagueIds]) : {},
        allLeagueIds.size > 0 ? getLeagueLogoUrls([...allLeagueIds], true) : {}  // 다크모드
      ]));

      response.playerPhotoUrls = playerPhotoUrls;
      response.teamLogoUrls = teamLogoUrls;
      response.coachPhotoUrls = coachPhotoUrls;
      response.leagueLogoUrls = leagueLogoUrls;
      response.leagueLogoDarkUrls = leagueLogoDarkUrls;

      // 4590 표준: 경기장 이미지 URL 조회
      const venueId = teamData.team?.venue?.id;
      if (venueId) {
        response.venueImageUrl = await perf.mark('images:venue', () => getVenueImageUrl(venueId));
      }

      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
      };
    }
  }
);
