'use server';

/**
 * 팀/리그 한글명·메타데이터 통합 조회 서버 액션 (4590 최적화)
 *
 * 최적화 전략 (Antigravity):
 * 1. L1 전역 메모리 캐시 (globalTeamsMap, globalLeaguesMap):
 *    - 개별 조회된 팀 및 리그 데이터를 메모리에 누적 캐싱합니다.
 *    - 동일한 컨테이너(서버 인스턴스) 내의 후속 요청은 DB 호출 없이 O(1) 메모리 조회가 수행됩니다.
 * 2. 온디맨드 배치 조회 (in 쿼리):
 *    - 전체 목록(11,700여 개 팀)을 한 번에 긁어오지 않고, 요청받은 ID 목록 중 캐시 미스된 대상만 DB에서 콕 집어 가져옵니다.
 *    - Next.js 개발 모드(next dev) 및 서버리스 콜드 스타트 시에도 Egress 트래픽과 DB 부하가 99.9% 감소합니다.
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
const globalTeamsMap = new Map<number, TeamData>();
const globalLeaguesMap = new Map<number, LeagueData>();

let allTeamsLoaded = false;
let allLeaguesLoaded = false;
let majorLeagueIdsCached: number[] | null = null;

// ============================================================
// DB 조회 및 L2 캐시 (unstable_cache) - 전체 조회가 명시적으로 필요할 때만 사용
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

/** 모든 팀 (한글명 있는 것만) - 전체 로드 필요 시 온디맨드 수행 */
export async function getAllTeams(): Promise<TeamData[]> {
  if (allTeamsLoaded && globalTeamsMap.size > 0) {
    return Array.from(globalTeamsMap.values());
  }

  try {
    const teams = await _getAllTeamsImpl();
    if (teams && teams.length > 0) {
      teams.forEach((t) => globalTeamsMap.set(t.id, t));
      allTeamsLoaded = true;
    }
    return Array.from(globalTeamsMap.values());
  } catch (err) {
    console.error('[getAllTeams] 캐시 래퍼 에러:', err);
    return Array.from(globalTeamsMap.values());
  }
}

/** 모든 리그 - 전체 로드 필요 시 온디맨드 수행 */
export async function getAllLeagues(): Promise<LeagueData[]> {
  if (allLeaguesLoaded && globalLeaguesMap.size > 0) {
    return Array.from(globalLeaguesMap.values());
  }

  try {
    const leagues = await _getAllLeaguesImpl();
    if (leagues && leagues.length > 0) {
      leagues.forEach((l) => globalLeaguesMap.set(l.id, l));
      allLeaguesLoaded = true;
    }
    return Array.from(globalLeaguesMap.values());
  } catch (err) {
    console.error('[getAllLeagues] 캐시 래퍼 에러:', err);
    return Array.from(globalLeaguesMap.values());
  }
}

/** 팀 ID로 단건 조회 - 메모리 우선 조회 후 온디맨드 배치 조회 활용 */
export async function getTeamById(id: number): Promise<TeamData | null> {
  if (!id) return null;
  const cached = globalTeamsMap.get(id);
  if (cached) return cached;

  const map = await getTeamsByIds([id]);
  return map[id] ?? null;
}

/** 여러 팀 ID로 일괄 조회 - 캐시 확인 후 미스된 ID만 DB in 쿼리 수행 */
export async function getTeamsByIds(ids: number[]): Promise<Record<number, TeamData>> {
  if (!ids.length) return {};

  const result: Record<number, TeamData> = {};
  const missingIds: number[] = [];

  for (const id of ids) {
    if (!id || id <= 0) continue;
    const cached = globalTeamsMap.get(id);
    if (cached) {
      result[id] = cached;
    } else {
      missingIds.push(id);
    }
  }

  if (missingIds.length > 0) {
    try {
      const supabase = getSupabaseAdmin();
      const uniqueMissing = [...new Set(missingIds)];
      
      // PostgREST IN 쿼리를 통한 최소 갯수 조회
      const { data, error } = await supabase
        .from('football_teams')
        .select('team_id, name, name_ko, country, country_ko, code, league_id, conference, slug, is_active')
        .in('team_id', uniqueMissing);

      if (error) {
        console.error('[getTeamsByIds] DB 조회 실패:', error);
      } else if (data) {
        data.forEach((row: any) => {
          const teamData: TeamData = {
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
          };
          globalTeamsMap.set(row.team_id, teamData);
          result[row.team_id] = teamData;
        });
      }
    } catch (err) {
      console.error('[getTeamsByIds] 에러:', err);
    }
  }

  return result;
}

/** 리그 ID로 해당 리그 팀들 조회 - 해당 리그의 팀들만 필터 쿼리 */
export async function getTeamsByLeagueId(leagueId: number): Promise<TeamData[]> {
  if (!leagueId) return [];

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('football_teams')
      .select('team_id, name, name_ko, country, country_ko, code, league_id, conference, slug, is_active')
      .eq('league_id', leagueId);

    if (error) {
      console.error('[getTeamsByLeagueId] DB 조회 실패:', error);
      return [];
    }

    return (data || []).map((row: any) => {
      const teamData: TeamData = {
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
      };
      globalTeamsMap.set(row.team_id, teamData);
      return teamData;
    });
  } catch (err) {
    console.error('[getTeamsByLeagueId] 에러:', err);
    return [];
  }
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
  const cached = globalLeaguesMap.get(id);
  if (cached) return cached;

  const map = await getLeaguesByIds([id]);
  return map[id] ?? null;
}

/** 여러 리그 ID로 일괄 조회 */
export async function getLeaguesByIds(ids: number[]): Promise<Record<number, LeagueData>> {
  if (!ids.length) return {};

  const result: Record<number, LeagueData> = {};
  const missingIds: number[] = [];

  for (const id of ids) {
    if (!id || id <= 0) continue;
    const cached = globalLeaguesMap.get(id);
    if (cached) {
      result[id] = cached;
    } else {
      missingIds.push(id);
    }
  }

  if (missingIds.length > 0) {
    try {
      const supabase = getSupabaseAdmin();
      const uniqueMissing = [...new Set(missingIds)];
      
      const { data, error } = await supabase
        .from('leagues')
        .select('id, name, name_ko, country, country_ko, logo, flag, is_calendar_season, is_cup, is_major')
        .in('id', uniqueMissing);

      if (error) {
        console.error('[getLeaguesByIds] DB 조회 실패:', error);
      } else if (data) {
        data.forEach((row: any) => {
          const leagueData: LeagueData = {
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
          };
          globalLeaguesMap.set(row.id, leagueData);
          result[row.id] = leagueData;
        });
      }
    } catch (err) {
      console.error('[getLeaguesByIds] 에러:', err);
    }
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
  
  // 메모리에 캐싱된 전체 리그에서 우선 조회
  if (allLeaguesLoaded) {
    const found = Array.from(globalLeaguesMap.values()).find((l) => l.name === englishName);
    if (found) return found.name_ko;
  }
  
  // 전체 로드 후 찾음
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

/** 메이저 리그 ID 목록 - 전체 리그 1,000개를 로드하지 않고 DB에서 직접 메이저 리그만 식별 */
export async function getMajorLeagueIds(): Promise<number[]> {
  if (majorLeagueIdsCached) return majorLeagueIdsCached;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('leagues')
      .select('id')
      .eq('is_major', true);

    if (error) {
      console.error('[getMajorLeagueIds] DB 조회 실패:', error);
      return [];
    }

    majorLeagueIdsCached = (data || []).map((row: any) => row.id);
    return majorLeagueIdsCached;
  } catch (err) {
    console.error('[getMajorLeagueIds] 에러:', err);
    return [];
  }
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
