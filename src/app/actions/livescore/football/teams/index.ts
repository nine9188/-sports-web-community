'use server';

// 다른 파일에서 기능 가져오기
import { 
  fetchCachedTeamData,
  fetchTeamData,
  type TeamData,
  type TeamStats,
  type TeamResponse 
} from '@/app/actions/livescore/teams/team';

import {
  fetchCachedTeamMatches,
  fetchTeamMatches,
  type Match,
} from '@/app/actions/livescore/teams/matches';

import {
  fetchCachedTeamSquad,
  fetchTeamSquad,
  type Player,
  type Coach,
} from '@/app/actions/livescore/teams/squad';

import {
  fetchCachedTeamStandings,
  fetchTeamStandings,
  type Standing,
} from '@/app/actions/livescore/teams/standings';

// Response 타입 정의
export interface MatchesResponse {
  success: boolean;
  data?: Match[];
  message: string;
}

export interface SquadResponse {
  success: boolean;
  data?: (Player | Coach)[];
  message: string;
}

export interface StandingsResponse {
  success: boolean;
  data?: Standing[];
  message: string;
}

// 모든 함수와 타입 재내보내기
export {
  fetchCachedTeamData,
  fetchTeamData,
  fetchCachedTeamMatches,
  fetchTeamMatches,
  fetchCachedTeamSquad,
  fetchTeamSquad,
  fetchCachedTeamStandings,
  fetchTeamStandings,
  
  // 타입 내보내기
  type TeamData,
  type TeamStats,
  type TeamResponse,
  type Match,
  type Player,
  type Coach,
  type Standing,
}; 