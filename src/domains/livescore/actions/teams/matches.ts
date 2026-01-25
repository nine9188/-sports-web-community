'use server';

import { cache } from 'react';
import { getTeamById } from '@/domains/livescore/constants/teams';
import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi';

// 경기 정보 인터페이스 (기본)
export interface Match {
  fixture: {
    id: number;
    date: string;
    status: { short: string; long?: string; elapsed?: number | null };
    referee?: string | null;
    timezone?: string;
    timestamp?: number;
    periods?: { first: number | null; second: number | null };
    venue?: { id: number | null; name: string | null; city: string | null };
  };
  league: {
    id: number;
    name: string;
    logo: string;
    country?: string;
    flag?: string;
    season?: number;
    round?: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score?: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
}

interface MatchesResponse {
  success: boolean;
  data?: Match[];
  message?: string;
  error?: string;
}

// 팀 경기 조회 옵션
export interface FetchTeamMatchesOptions {
  /** 조회 모드: 'season' = 시즌 전체, 'recent' = 최근/예정 경기만 */
  mode?: 'season' | 'recent';
  /** recent 모드에서 가져올 경기 수 (기본값: 10) */
  limit?: number;
  /** 한국어 팀명 매핑 적용 여부 (기본값: true) */
  applyKoreanNames?: boolean;
  /** 시즌 (기본값: 현재 시즌 자동 계산) */
  season?: number;
}

// 한국어 팀명 매핑 적용 헬퍼
function applyKoreanTeamNames(matches: Match[]): Match[] {
  return matches.map(match => {
    const result = { ...match };

    // 홈팀 매핑 적용
    if (result.teams?.home?.id) {
      const homeTeamMapping = getTeamById(result.teams.home.id);
      if (homeTeamMapping) {
        result.teams = {
          ...result.teams,
          home: {
            ...result.teams.home,
            name: homeTeamMapping.name_ko || result.teams.home.name
          }
        };
      }
    }

    // 원정팀 매핑 적용
    if (result.teams?.away?.id) {
      const awayTeamMapping = getTeamById(result.teams.away.id);
      if (awayTeamMapping) {
        result.teams = {
          ...result.teams,
          away: {
            ...result.teams.away,
            name: awayTeamMapping.name_ko || result.teams.away.name
          }
        };
      }
    }

    return result;
  });
}

// 날짜순 정렬 헬퍼 (최신 경기가 먼저)
function sortByDateDesc(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => {
    const dateA = new Date(a.fixture.date).getTime();
    const dateB = new Date(b.fixture.date).getTime();
    return dateB - dateA;
  });
}

/**
 * 통합 팀 경기 조회 함수
 *
 * @param teamId 팀 ID (string 또는 number)
 * @param options 조회 옵션
 * @returns 경기 목록
 *
 * @example
 * // 시즌 전체 경기 (팀 상세 페이지용)
 * fetchTeamMatchesUnified('33', { mode: 'season' })
 *
 * // 최근 5경기 (검색 결과용)
 * fetchTeamMatchesUnified(33, { mode: 'recent', limit: 5 })
 */
export async function fetchTeamMatchesUnified(
  teamId: string | number,
  options: FetchTeamMatchesOptions = {}
): Promise<MatchesResponse> {
  const {
    mode = 'season',
    limit = 10,
    applyKoreanNames = true,
    season: customSeason
  } = options;

  try {
    if (!teamId) {
      throw new Error('팀 ID는 필수입니다');
    }

    const teamIdNum = typeof teamId === 'string' ? parseInt(teamId, 10) : teamId;

    // 시즌 계산 (7월 기준)
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const season = customSeason ?? (currentMonth < 7 ? currentYear - 1 : currentYear);

    let matches: Match[] = [];

    if (mode === 'season') {
      // 시즌 전체 경기 가져오기
      const data = await fetchFromFootballApi('fixtures', {
        team: teamIdNum,
        season: season
      });
      matches = data.response || [];
    } else {
      // recent 모드: 최근 경기와 예정 경기를 각각 가져오기
      const halfLimit = Math.floor(limit / 2);
      const [lastMatches, nextMatches] = await Promise.all([
        fetchFromFootballApi('fixtures', {
          team: teamIdNum,
          season: season,
          last: halfLimit
        }).catch(() => ({ response: [] })),
        fetchFromFootballApi('fixtures', {
          team: teamIdNum,
          season: season,
          next: Math.ceil(limit / 2)
        }).catch(() => ({ response: [] }))
      ]);

      matches = [
        ...(lastMatches.response || []),
        ...(nextMatches.response || [])
      ];
    }

    // 한국어 팀명 매핑 적용
    if (applyKoreanNames) {
      matches = applyKoreanTeamNames(matches);
    }

    // 날짜순 정렬 (최신 경기가 먼저)
    matches = sortByDateDesc(matches);

    // recent 모드에서는 limit 적용
    if (mode === 'recent' && matches.length > limit) {
      matches = matches.slice(0, limit);
    }

    return {
      success: true,
      data: matches,
      message: '경기 데이터를 성공적으로 가져왔습니다'
    };

  } catch (error) {
    console.error('팀 경기 목록 가져오기 오류:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    };
  }
}

/**
 * 특정 팀의 시즌 전체 경기 목록을 가져오는 서버 액션 (레거시 호환용)
 * @deprecated fetchTeamMatchesUnified 사용 권장
 * @param teamId 팀 ID
 * @returns 경기 목록 (시즌 전체)
 */
export async function fetchTeamMatches(teamId: string): Promise<MatchesResponse> {
  return fetchTeamMatchesUnified(teamId, { mode: 'season' });
}

/**
 * 팀의 최근/예정 경기 가져오기 (검색 결과용)
 * @deprecated fetchTeamMatchesUnified 사용 권장
 * @param teamId 팀 ID
 * @param limit 가져올 경기 수
 * @returns 경기 목록
 */
export async function getTeamMatchesRecent(
  teamId: number,
  limit: number = 10
): Promise<MatchesResponse> {
  return fetchTeamMatchesUnified(teamId, { mode: 'recent', limit });
}

// 캐싱 적용 함수들
export const fetchCachedTeamMatches = cache(fetchTeamMatches);
export const fetchCachedTeamMatchesUnified = cache(fetchTeamMatchesUnified);
export const getCachedTeamMatchesRecent = cache(getTeamMatchesRecent); 