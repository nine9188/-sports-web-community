'use server';

/**
 * 팀/리그 한글명·메타데이터 통합 조회 서버 액션 (4590 최적화)
 *
 * 단일 소스(SoT):
 * - 팀 데이터: football_teams (team_id 기준)
 * - 리그 데이터: leagues (id 기준)
 *
 * 최적화 전략:
 * 1. L1 전역 메모리 캐시 (globalTeams, globalLeagues):
 *    - 전체 팀(11,706개) 및 리그(1,012개) 목록을 서버 메모리에 전역 캐싱합니다.
 *    - 각 서버 컨테이너는 부팅 후 최초 1회만 DB를 조회하고, 이후의 모든 팀/리그 조회는 DB 호출 없이 O(1) 메모리 조회로 처리됩니다.
 *    - 이로 인해 Supabase 호출 횟수와 Egress 요금이 99% 이상 감소합니다.
 * 
 * 2. 캐시 만료 정책:
 *    - 팀/리그 한글명과 메타데이터는 변경 빈도가 극히 낮으므로, 24시간(1일) 동안 메모리에서 유지합니다.
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
  slug?: string | null;
  is_active?: boolean | null;
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
// L1 전역 메모리 캐시
// ============================================================
let globalTeams: TeamData[] | null = null;
let globalLeagues: LeagueData[] | null = null;

const CACHE_TTL = 1000 * 60 * 60 * 24; // 24시간 (1일)
let lastTeamsFetch = 0;
let lastLeaguesFetch = 0;

// ============================================================
// DB 조회 및 L2 캐시 (unstable_cache)
// ============================================================

const _getAllTeamsImpl = unstable_cache(
  async (): Promise<TeamData[]> => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('football_teams')
      .select('team_id, name, name_ko, country, country_ko, code, league_id, conference, slug, is_active')
      .not('name_ko', 'is', null);

    if (error) {
      console.error('[teamLeagueData] getAllTeams error:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.team_id,
      name_ko: row.name_ko ?? row.name ?? '',
      name_en: row.name ?? '',
      country_ko: row.country_ko,
      country_en: row.country,
      code: row.code,
      league_id: row.league_id,
      conference: row.conference,
      slug: row.slug,
      is_active: row.is_active,
    }));
  },
  ['football-teams-all-v2-slugs'],
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

    return (data || []).map((row: any) => ({
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
  const now = Date.now();
  if (globalTeams && (now - lastTeamsFetch < CACHE_TTL)) {
    return globalTeams;
  }

  try {
    const teams = await _getAllTeamsImpl();
    if (teams && teams.length > 0) {
      globalTeams = teams;
      lastTeamsFetch = now;
    }
    return teams || globalTeams || [];
  } catch (err) {
    console.error('[getAllTeams] 캐시 래퍼 에러:', err);
    return globalTeams || [];
  }
}

/** 모든 리그 */
export async function getAllLeagues(): Promise<LeagueData[]> {
  const now = Date.now();
  if (globalLeagues && (now - lastLeaguesFetch < CACHE_TTL)) {
    return globalLeagues;
  }

  try {
    const leagues = await _getAllLeaguesImpl();
    if (leagues && leagues.length > 0) {
      globalLeagues = leagues;
      lastLeaguesFetch = now;
    }
    return leagues || globalLeagues || [];
  } catch (err) {
    console.error('[getAllLeagues] 캐시 래퍼 에러:', err);
    return globalLeagues || [];
  }
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

/** 리그 ID로 해당 리그 팀들 조회 */
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

/** 팀 표시 이름 */
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

/** 리그 ID → 한글 이름 */
export async function getLeagueName(leagueId: number): Promise<string> {
  if (!leagueId) return '알 수 없는 리그';
  const league = await getLeagueById(leagueId);
  return league?.name_ko ?? '알 수 없는 리그';
}

/** 영문 리그 이름 → 한글 이름 */
export async function getLeagueKoreanName(englishName: string | undefined): Promise<string> {
  if (!englishName) return '';
  const all = await getAllLeagues();
  const found = all.find((l) => l.name === englishName);
  return found?.name_ko ?? englishName;
}

/** 팀 이름/코드/국가로 팀 검색 */
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

/** SEO 색인 허용 리그 ID 목록 (leagues.is_major = true) */
export async function getIndexableLeagueIds(): Promise<number[]> {
  return getMajorLeagueIds();
}

/** 리그에 맞는 현재 시즌 계산 */
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
