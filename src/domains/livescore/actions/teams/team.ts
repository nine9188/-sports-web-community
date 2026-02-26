'use server';

import { cache } from 'react';
import { getTeamById } from '@/domains/livescore/constants/teams';
import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi';

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
import { fetchCachedTeamMatches as getTeamMatches, Match } from './matches';
import { fetchCachedTeamSquad as getTeamSquad, Player, Coach } from './squad';
import { fetchCachedTeamPlayerStats as getTeamPlayerStats, PlayerStats } from './player-stats';
import { fetchCachedTeamStandings as getTeamStandings, Standing } from './standings';
import { fetchCachedTeamTransfers as getTeamTransfers, TeamTransfersData } from './transfers';
import { getPlayerPhotoUrls, getTeamLogoUrls, getCoachPhotoUrls, getLeagueLogoUrls, getVenueImageUrl } from '@/domains/livescore/actions/images';

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
  // 4590 표준: 이미지 Storage URL
  playerPhotoUrls?: Record<number, string>;
  teamLogoUrls?: Record<number, string>;
  coachPhotoUrls?: Record<number, string>;
  leagueLogoUrls?: Record<number, string>;
  leagueLogoDarkUrls?: Record<number, string>;  // 다크모드 리그 로고
  venueImageUrl?: string;  // 경기장 이미지 URL
  [key: string]: unknown; // 인덱스 시그니처
}

/**
 * 특정 팀의 기본 정보를 가져오는 내부 함수
 */
async function fetchTeamData(teamId: string): Promise<TeamResponse> {
  try {
    if (!teamId) {
      throw new Error('팀 ID는 필수입니다');
    }

    // 팀 정보 API 요청
    const teamData = await fetchFromFootballApi('teams', { id: teamId });
    
    if (!teamData?.response?.[0]) {
      return { 
        success: false,
        message: '팀 데이터를 찾을 수 없습니다'
      };
    }
    
    // 팀 정보와 스탯 데이터 병합
    const teamInfo = teamData.response[0] as TeamInfo;
    
    // API에서 팀 스탯 가져오기 (현재 시즌)
    const currentYear = new Date().getFullYear();
    const currentSeason = new Date().getMonth() > 6 ? currentYear : currentYear - 1;
    
    // 먼저 팀이 속한 리그 정보를 찾습니다
    let leagueId = 39; // 기본값으로 프리미어리그 설정

    try {
      const leaguesData = await fetchFromFootballApi('leagues', { team: teamId, season: currentSeason });

      // 우선순위: 국내 리그 > 컵 대회 > 국제 대회
      const leagues = leaguesData.response || [];

      interface LeagueResponse {
        league: {
          id: number;
          name: string;
          type: string;
        };
      }

      const mainLeague = leagues.find(
        (league: LeagueResponse) => league.league.type === 'League' &&
          !league.league.name.includes('Champions') &&
          !league.league.name.includes('Europa') &&
          !league.league.name.includes('Conference')
      );

      if (mainLeague) {
        leagueId = mainLeague.league.id;
      } else if (leagues.length > 0) {
        // 첫 번째 리그 사용
        leagueId = leagues[0].league.id;
      }
    } catch {
      // keep default leagueId = 39
    }
    
    let statsData = null;
    try {
      const statsResult = await fetchFromFootballApi('teams/statistics', { team: teamId, season: currentSeason, league: leagueId });
      if (statsResult?.response) {
        statsData = statsResult.response as TeamStats;
      }
    } catch {
      // stats 실패해도 팀 기본 정보는 반환
    }
    
    // 팀 매핑 정보 적용
    const teamMapping = getTeamById(Number(teamId));
    if (teamMapping && teamInfo.team) {
      teamInfo.team.name = teamMapping.name_ko || teamInfo.team.name;
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

/**
 * 팀의 모든 관련 데이터를 한 번에 가져오는 통합 서버 액션
 * @param teamId 팀 ID
 * @param options 가져올 데이터 타입을 지정하는 옵션
 */
export const fetchTeamFullData = cache(
  async (
    teamId: string, 
    options = {
      fetchMatches: true,
      fetchSquad: true,
      fetchPlayerStats: true,
      fetchStandings: true,
      fetchTransfers: true
    }
  ): Promise<TeamFullDataResponse> => {
    try {
      const numericTeamId = parseInt(teamId, 10);

      // 기본 팀 데이터 (info + stats 통합)
      const teamData = await fetchTeamData(teamId);

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

      if (options.fetchMatches) {
        promises.push(getTeamMatches(teamId));
        dataTypes.push('matches');
      }

      if (options.fetchSquad) {
        promises.push(getTeamSquad(teamId));
        dataTypes.push('squad');
      }

      if (options.fetchPlayerStats) {
        promises.push(getTeamPlayerStats(teamId));
        dataTypes.push('playerStats');
      }

      if (options.fetchStandings) {
        promises.push(getTeamStandings(teamId));
        dataTypes.push('standings');
      }

      if (options.fetchTransfers) {
        promises.push(getTeamTransfers(teamId));
        dataTypes.push('transfers');
      }

      // 모든 데이터 병렬로 요청
      const results = await Promise.all(promises);

      // 결과 조합
      const response: TeamFullDataResponse = {
        success: true,
        message: '팀 데이터를 성공적으로 가져왔습니다',
        teamData
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

      // stats에서 리그 ID 수집
      if (teamData.stats?.league?.id) {
        allLeagueIds.add(teamData.stats.league.id);
      }

      // 이미지 URL 배치 조회 (다크모드 리그 로고 포함)
      const [playerPhotoUrls, teamLogoUrls, coachPhotoUrls, leagueLogoUrls, leagueLogoDarkUrls] = await Promise.all([
        allPlayerIds.size > 0 ? getPlayerPhotoUrls([...allPlayerIds]) : {},
        allTeamIds.size > 0 ? getTeamLogoUrls([...allTeamIds]) : {},
        allCoachIds.size > 0 ? getCoachPhotoUrls([...allCoachIds]) : {},
        allLeagueIds.size > 0 ? getLeagueLogoUrls([...allLeagueIds]) : {},
        allLeagueIds.size > 0 ? getLeagueLogoUrls([...allLeagueIds], true) : {}  // 다크모드
      ]);

      response.playerPhotoUrls = playerPhotoUrls;
      response.teamLogoUrls = teamLogoUrls;
      response.coachPhotoUrls = coachPhotoUrls;
      response.leagueLogoUrls = leagueLogoUrls;
      response.leagueLogoDarkUrls = leagueLogoDarkUrls;

      // 4590 표준: 경기장 이미지 URL 조회
      const venueId = teamData.team?.venue?.id;
      if (venueId) {
        response.venueImageUrl = await getVenueImageUrl(venueId);
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