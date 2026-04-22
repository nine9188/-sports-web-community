'use server';

/**
 * 팀/리그 한글명·메타데이터 통합 조회 서버 액션
 *
 * 단일 소스(SoT):
 * - 팀 데이터: football_teams (team_id 기준)
 * - 리그 데이터: leagues (id 기준)
 *
 * 이 모듈은 기존 src/domains/livescore/constants/teams/* 및
 * src/domains/livescore/constants/league-mappings.ts 의 데이터 헬퍼들을 대체합니다.
 *
 * 캐싱: unstable_cache + revalidateTag('teams' | 'leagues', 'default')
 */

import { unstable_cache } from 'next/cache';
import { getSupabaseAdmin } from '@/shared/lib/supabase/server';

// ============================================================
// 타입
// ============================================================

export interface TeamData {
  id: number; // API-Football team_id
  name_ko: string;
  name_en: string;
  country_ko: string | null;
  country_en: string | null;
  code: string | null;
  league_id: number | null;
  conference: string | null; // MLS East/West 등
}

export interface LeagueData {
  id: number;
  name: string; // English
  name_ko: string;
  country: string | null;
  country_ko: string | null;
  logo: string | null;
  flag: string | null;
  is_calendar_season: boolean;
  is_cup: boolean;
  is_major: boolean;
}

// ============================================================
// 전체 캐시 (7일)
// ============================================================

const _getAllTeamsImpl = unstable_cache(
  async (): Promise<TeamData[]> => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('football_teams')
      .select('team_id, name, name_ko, country, country_ko, code, league_id, conference')
      .not('name_ko', 'is', null);

    if (error) {
      console.error('[teamLeagueData] getAllTeams error:', error);
      return [];
    }

    return (data || []).map((row: { team_id: number; name: string | null; name_ko: string | null; country: string | null; country_ko: string | null; code: string | null; league_id: number | null; conference: string | null }) => ({
      id: row.team_id,
      name_ko: row.name_ko ?? row.name ?? '',
      name_en: row.name ?? '',
      country_ko: row.country_ko,
      country_en: row.country,
      code: row.code,
      league_id: row.league_id,
      conference: row.conference,
    }));
  },
  ['football-teams-all'],
  { revalidate: 604800, tags: ['football-teams'] }
);

const _getAllLeaguesImpl = unstable_cache(
  async (): Promise<LeagueData[]> => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('leagues')
      .select('id, name, name_ko, country, country_ko, logo, flag, is_calendar_season, is_cup, is_major');

    if (error) {
      console.error('[teamLeagueData] getAllLeagues error:', error);
      return [];
    }

    return (data || []).map((row: { id: number; name: string | null; name_ko: string | null; country: string | null; country_ko: string | null; logo: string | null; flag: string | null; is_calendar_season: boolean | null; is_cup: boolean | null; is_major: boolean | null }) => ({
      id: row.id,
      name: row.name ?? '',
      name_ko: row.name_ko ?? row.name ?? '',
      country: row.country,
      country_ko: row.country_ko,
      logo: row.logo,
      flag: row.flag,
      is_calendar_season: !!row.is_calendar_season,
      is_cup: !!row.is_cup,
      is_major: !!row.is_major,
    }));
  },
  ['leagues-all'],
  { revalidate: 604800, tags: ['leagues'] }
);

// ============================================================
// 공개 API
// ============================================================

/** 모든 팀 (한글명 있는 것만) */
export async function getAllTeams(): Promise<TeamData[]> {
  return _getAllTeamsImpl();
}

/** 모든 리그 */
export async function getAllLeagues(): Promise<LeagueData[]> {
  return _getAllLeaguesImpl();
}

/** 팀 ID로 단건 조회 */
export async function getTeamById(id: number): Promise<TeamData | null> {
  if (!id) return null;
  const all = await getAllTeams();
  return all.find((t) => t.id === id) ?? null;
}

/** 여러 팀 ID로 일괄 조회 */
export async function getTeamsByIds(ids: number[]): Promise<Record<number, TeamData>> {
  if (!ids.length) return {};
  const all = await getAllTeams();
  const idSet = new Set(ids);
  const result: Record<number, TeamData> = {};
  for (const t of all) {
    if (idSet.has(t.id)) result[t.id] = t;
  }
  return result;
}

/** 리그 ID로 해당 리그 팀들 조회 (constants의 getTeamsByLeagueId 대체) */
export async function getTeamsByLeagueId(leagueId: number): Promise<TeamData[]> {
  if (!leagueId) return [];
  const all = await getAllTeams();
  return all.filter((t) => t.league_id === leagueId);
}

/** 팀 ID로 소속 리그 ID 조회 */
export async function getLeagueIdByTeamId(teamId: number): Promise<number | null> {
  if (!teamId) return null;
  const team = await getTeamById(teamId);
  return team?.league_id ?? null;
}

/** 팀 표시 이름 (constants의 getTeamDisplayName 대체) */
export async function getTeamDisplayName(
  id: number,
  options: { language?: 'ko' | 'en'; includeCountry?: boolean } = {}
): Promise<string> {
  const { language = 'ko', includeCountry = false } = options;
  const team = await getTeamById(id);
  if (!team) return `팀 ${id}`;

  const name = language === 'ko' ? team.name_ko : team.name_en;
  if (!includeCountry) return name;

  const country = language === 'ko' ? team.country_ko : team.country_en;
  return country ? `${name} (${country})` : name;
}

/** 리그 ID로 단건 조회 */
export async function getLeagueById(id: number): Promise<LeagueData | null> {
  if (!id) return null;
  const all = await getAllLeagues();
  return all.find((l) => l.id === id) ?? null;
}

/** 여러 리그 ID로 일괄 조회 */
export async function getLeaguesByIds(ids: number[]): Promise<Record<number, LeagueData>> {
  if (!ids.length) return {};
  const all = await getAllLeagues();
  const idSet = new Set(ids);
  const result: Record<number, LeagueData> = {};
  for (const l of all) {
    if (idSet.has(l.id)) result[l.id] = l;
  }
  return result;
}

/** 리그 ID → 한글 이름 (constants의 getLeagueName 대체) */
export async function getLeagueName(leagueId: number): Promise<string> {
  if (!leagueId) return '알 수 없는 리그';
  const league = await getLeagueById(leagueId);
  return league?.name_ko ?? '알 수 없는 리그';
}

/** 영문 리그 이름 → 한글 이름 (DB의 leagues.name 정확 매칭) */
export async function getLeagueKoreanName(englishName: string | undefined): Promise<string> {
  if (!englishName) return '';
  const all = await getAllLeagues();
  const found = all.find((l) => l.name === englishName);
  return found?.name_ko ?? englishName;
}

/** 팀 이름/코드/국가로 팀 검색 (DB 전체 풀텍스트 검색이 필요하면 search 액션을 써야 함) */
export async function searchTeamsByName(query: string): Promise<TeamData[]> {
  const q = query?.trim().toLowerCase();
  if (!q) return [];
  const all = await getAllTeams();
  return all.filter((t) =>
    t.name_ko.toLowerCase().includes(q) ||
    t.name_en.toLowerCase().includes(q) ||
    t.country_ko?.toLowerCase().includes(q) ||
    t.country_en?.toLowerCase().includes(q) ||
    t.code?.toLowerCase().includes(q)
  );
}

/** 캘린더 시즌 리그(1~12월) 여부 */
export async function isCalendarSeasonLeague(leagueId: number | string): Promise<boolean> {
  const id = typeof leagueId === 'string' ? parseInt(leagueId, 10) : leagueId;
  const league = await getLeagueById(id);
  return !!league?.is_calendar_season;
}

/** 컵 대회 여부 */
export async function isCupLeague(leagueId: number | string | null | undefined): Promise<boolean> {
  if (leagueId === null || leagueId === undefined) return false;
  const id = typeof leagueId === 'string' ? parseInt(leagueId, 10) : leagueId;
  const league = await getLeagueById(id);
  return !!league?.is_cup;
}

/** 메이저 리그 ID 목록 */
export async function getMajorLeagueIds(): Promise<number[]> {
  const all = await getAllLeagues();
  return all.filter((l) => l.is_major).map((l) => l.id);
}

/** 리그에 맞는 현재 시즌 계산 (캘린더 시즌 vs 유럽식 7월 기준) */
export async function getCurrentSeasonForLeague(leagueId: number | string): Promise<number> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  if (await isCalendarSeasonLeague(leagueId)) return currentYear;
  return currentMonth < 7 ? currentYear - 1 : currentYear;
}

/** 시즌을 사람이 읽기 쉬운 형태로 포맷 */
export async function formatSeasonLabel(season: number, leagueId: number | string): Promise<string> {
  if (await isCalendarSeasonLeague(leagueId)) return `${season} 시즌`;
  const endYear = String(season + 1).slice(2);
  return `${season}-${endYear} 시즌`;
}
