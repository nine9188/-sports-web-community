'use client';

/**
 * TeamLeagueContext
 *
 * 팀/리그 한글명·메타데이터를 서버에서 프리로드하여 클라이언트 트리에 주입.
 * 단일 소스(DB: football_teams, leagues)에서 페이지 진입 시 1회 로드 후
 * 트리 내부 모든 클라이언트 컴포넌트가 동기적으로 lookup.
 *
 * 사용:
 *
 *   // 페이지 (서버)
 *   import { TeamLeagueProvider } from '@/shared/context/TeamLeagueContext';
 *   import { getAllTeams, getAllLeagues } from '@/domains/livescore/actions/teamLeagueData';
 *
 *   const [teams, leagues] = await Promise.all([getAllTeams(), getAllLeagues()]);
 *   return (
 *     <TeamLeagueProvider teams={teams} leagues={leagues}>
 *       <YourClientTree />
 *     </TeamLeagueProvider>
 *   );
 *
 *   // 클라이언트 컴포넌트
 *   'use client';
 *   import { useTeamLeague } from '@/shared/context/TeamLeagueContext';
 *
 *   const { getTeamById, getLeagueName } = useTeamLeague();
 *   const team = getTeamById(40);
 */

import { createContext, useContext, useMemo, ReactNode } from 'react';
import type { TeamData, LeagueData } from '@/domains/livescore/actions/teamLeagueData';

export type { TeamData, LeagueData };

interface TeamLeagueContextValue {
  teams: Map<number, TeamData>;
  leagues: Map<number, LeagueData>;
  getTeamById: (id: number | null | undefined) => TeamData | undefined;
  getTeamsByIds: (ids: number[]) => TeamData[];
  getTeamsByLeagueId: (leagueId: number) => TeamData[];
  getLeagueIdByTeamId: (teamId: number) => number | undefined;
  getTeamDisplayName: (
    id: number,
    options?: { language?: 'ko' | 'en'; includeCountry?: boolean }
  ) => string;
  getLeagueById: (id: number | null | undefined) => LeagueData | undefined;
  getLeagueName: (leagueId: number) => string;
  /** 영문 리그 이름 → 한글 (DB 기반, 정규화가 필요하면 league-mappings의 ENGLISH_TO_KOREAN 사용) */
  getLeagueKoreanName: (englishName: string | undefined) => string;
  /** 팀 이름/코드/국가로 팀 검색 */
  searchTeamsByName: (query: string) => TeamData[];
  /** 캘린더 시즌 리그(1~12월) 여부 */
  isCalendarSeasonLeague: (leagueId: number | string) => boolean;
  /** 컵 대회 여부 */
  isCupLeague: (leagueId: number | string | null | undefined) => boolean;
  /** 메이저 리그 ID 목록 */
  getMajorLeagueIds: () => number[];
  /** 리그에 맞는 현재 시즌 계산 */
  getCurrentSeasonForLeague: (leagueId: number | string) => number;
  /** 시즌 표시 포맷 (예: "2025-26 시즌" / "2026 시즌") */
  formatSeasonLabel: (season: number, leagueId: number | string) => string;
  /** MLS 컨퍼런스(East/West)별 팀 ID 목록 */
  getTeamsByConference: (conference: string) => TeamData[];
}

const EMPTY_CTX: TeamLeagueContextValue = {
  teams: new Map(),
  leagues: new Map(),
  getTeamById: () => undefined,
  getTeamsByIds: () => [],
  getTeamsByLeagueId: () => [],
  getLeagueIdByTeamId: () => undefined,
  getTeamDisplayName: (id) => `팀 ${id}`,
  getLeagueById: () => undefined,
  getLeagueName: () => '알 수 없는 리그',
  getLeagueKoreanName: (n) => n ?? '',
  searchTeamsByName: () => [],
  isCalendarSeasonLeague: () => false,
  isCupLeague: () => false,
  getMajorLeagueIds: () => [],
  getCurrentSeasonForLeague: () => new Date().getFullYear(),
  formatSeasonLabel: (season) => `${season} 시즌`,
  getTeamsByConference: () => [],
};

const TeamLeagueContext = createContext<TeamLeagueContextValue>(EMPTY_CTX);

export function useTeamLeague(): TeamLeagueContextValue {
  return useContext(TeamLeagueContext);
}

/** 단건 lookup 편의 훅 */
export function useTeam(id: number | null | undefined): TeamData | undefined {
  return useTeamLeague().getTeamById(id);
}

/** 단건 lookup 편의 훅 */
export function useLeague(id: number | null | undefined): LeagueData | undefined {
  return useTeamLeague().getLeagueById(id);
}

interface ProviderProps {
  teams: TeamData[];
  leagues: LeagueData[];
  children: ReactNode;
}

export function TeamLeagueProvider({ teams, leagues, children }: ProviderProps) {
  const value = useMemo<TeamLeagueContextValue>(() => {
    const teamMap = new Map<number, TeamData>(teams.map((t) => [t.id, t]));
    const leagueMap = new Map<number, LeagueData>(leagues.map((l) => [l.id, l]));
    // 영문 리그명 → 한글 lookup용 역맵
    const leagueNameEnMap = new Map<string, LeagueData>();
    for (const l of leagues) {
      if (l.name) leagueNameEnMap.set(l.name, l);
    }

    const getTeamById = (id: number | null | undefined) =>
      id == null ? undefined : teamMap.get(id);

    const getTeamsByIds = (ids: number[]) => {
      const out: TeamData[] = [];
      for (const id of ids) {
        const t = teamMap.get(id);
        if (t) out.push(t);
      }
      return out;
    };

    const getTeamsByLeagueId = (leagueId: number) => {
      const out: TeamData[] = [];
      for (const t of teamMap.values()) {
        if (t.league_id === leagueId) out.push(t);
      }
      return out;
    };

    const getLeagueIdByTeamId = (teamId: number) => teamMap.get(teamId)?.league_id ?? undefined;

    const getTeamDisplayName = (
      id: number,
      options: { language?: 'ko' | 'en'; includeCountry?: boolean } = {}
    ) => {
      const { language = 'ko', includeCountry = false } = options;
      const team = teamMap.get(id);
      if (!team) return `팀 ${id}`;
      const name = language === 'ko' ? team.name_ko : team.name_en;
      if (!includeCountry) return name;
      const country = language === 'ko' ? team.country_ko : team.country_en;
      return country ? `${name} (${country})` : name;
    };

    const getLeagueById = (id: number | null | undefined) =>
      id == null ? undefined : leagueMap.get(id);

    const getLeagueName = (leagueId: number) =>
      leagueMap.get(leagueId)?.name_ko ?? '알 수 없는 리그';

    const getLeagueKoreanName = (englishName: string | undefined) => {
      if (!englishName) return '';
      return leagueNameEnMap.get(englishName)?.name_ko ?? englishName;
    };

    const searchTeamsByName = (query: string): TeamData[] => {
      const q = query?.trim().toLowerCase();
      if (!q) return [];
      const out: TeamData[] = [];
      for (const t of teamMap.values()) {
        if (
          t.name_ko.toLowerCase().includes(q) ||
          t.name_en.toLowerCase().includes(q) ||
          t.country_ko?.toLowerCase().includes(q) ||
          t.country_en?.toLowerCase().includes(q) ||
          t.code?.toLowerCase().includes(q)
        ) {
          out.push(t);
        }
      }
      return out;
    };

    const isCalendarSeasonLeague = (leagueId: number | string): boolean => {
      const id = typeof leagueId === 'string' ? parseInt(leagueId, 10) : leagueId;
      return !!leagueMap.get(id)?.is_calendar_season;
    };

    const isCupLeague = (leagueId: number | string | null | undefined): boolean => {
      if (leagueId === null || leagueId === undefined) return false;
      const id = typeof leagueId === 'string' ? parseInt(leagueId, 10) : leagueId;
      return !!leagueMap.get(id)?.is_cup;
    };

    const getMajorLeagueIds = (): number[] => {
      const out: number[] = [];
      for (const l of leagueMap.values()) if (l.is_major) out.push(l.id);
      return out;
    };

    const getCurrentSeasonForLeague = (leagueId: number | string): number => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      if (isCalendarSeasonLeague(leagueId)) return year;
      return month < 7 ? year - 1 : year;
    };

    const formatSeasonLabel = (season: number, leagueId: number | string): string => {
      if (isCalendarSeasonLeague(leagueId)) return `${season} 시즌`;
      const endYear = String(season + 1).slice(2);
      return `${season}-${endYear} 시즌`;
    };

    const getTeamsByConference = (conference: string): TeamData[] => {
      const out: TeamData[] = [];
      for (const t of teamMap.values()) if (t.conference === conference) out.push(t);
      return out;
    };

    return {
      teams: teamMap,
      leagues: leagueMap,
      getTeamById,
      getTeamsByIds,
      getTeamsByLeagueId,
      getLeagueIdByTeamId,
      getTeamDisplayName,
      getLeagueById,
      getLeagueName,
      getLeagueKoreanName,
      searchTeamsByName,
      isCalendarSeasonLeague,
      isCupLeague,
      getMajorLeagueIds,
      getCurrentSeasonForLeague,
      formatSeasonLabel,
      getTeamsByConference,
    };
  }, [teams, leagues]);

  return <TeamLeagueContext.Provider value={value}>{children}</TeamLeagueContext.Provider>;
}
