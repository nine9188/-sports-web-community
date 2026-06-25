'use server';

import { cache } from 'react';
import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi';
import { getCurrentSeasonForLeague } from '@/domains/livescore/actions/teamLeagueData';
import { getTeamsByIds, type TeamData } from '@/domains/livescore/actions/teamLeagueData';
import { getTeamLogoUrls, getLeagueLogoUrl } from '@/domains/livescore/actions/images';

// --- 타입 ---

export interface CupFixture {
  id: number;
  date: string;               // ISO datetime
  status: { short: string; long: string; elapsed: number | null };
  round: string;              // API 원문 ("Final", "Semi-finals", ...)
  home: {
    id: number;
    name: string;             // 원문 (영문)
    name_ko?: string;         // 한글 매핑 있으면
    code?: string | null;     // 국가 코드 (FIFA 3글자)
    logo: string;             // Storage URL
    score: number | null;
    winner: boolean | null;
  };
  away: {
    id: number;
    name: string;
    name_ko?: string;
    code?: string | null;     // 국가 코드 (FIFA 3글자)
    logo: string;
    score: number | null;
    winner: boolean | null;
  };
  venue?: string;
}

export interface CupRound {
  round: string;              // 원문 ("Final")
  label: string;              // 사람이 읽는 라벨 ("결승")
  fixtures: CupFixture[];
  earliestDate: string;
}

export interface CupFixturesResponse {
  success: boolean;
  rounds: CupRound[];
  error?: string;
}

// --- 라운드 정렬 가중치 ---
// 숫자 작을수록 "나중(중요)" 라운드. Final이 제일 앞에 오도록 0 부여.
// 매핑 없는 라운드는 날짜로 보조 정렬.
const ROUND_ORDER: Record<string, number> = {
  'Final': 0,
  'Semi-finals': 1,
  'Quarter-finals': 2,
  'Round of 16': 3,
  'Round of 32': 4,
  '3rd Place Final': 5,
  'Group Stage - 3': 6,
  'Group Stage - 2': 7,
  'Group Stage - 1': 8,
  '5th Round': 9,
  '4th Round': 10,
  '3rd Round': 11,
  '2nd Round': 12,
  '1st Round': 13,
  'Preliminary Round': 14,
  // 챔스/유로파 리그 단계
  'League Phase - 8': 20,
  'League Phase - 7': 21,
  'League Phase - 6': 22,
  'League Phase - 5': 23,
  'League Phase - 4': 24,
  'League Phase - 3': 25,
  'League Phase - 2': 26,
  'League Phase - 1': 27,
};

// 라운드 한글 라벨
const ROUND_LABEL: Record<string, string> = {
  'Final': '결승',
  'Semi-finals': '준결승',
  'Quarter-finals': '8강',
  'Round of 16': '16강',
  'Round of 32': '32강',
  '3rd Place Final': '3/4위전',
  'Group Stage - 3': '조별리그 3차전',
  'Group Stage - 2': '조별리그 2차전',
  'Group Stage - 1': '조별리그 1차전',
  '5th Round': '5라운드',
  '4th Round': '4라운드',
  '3rd Round': '3라운드',
  '2nd Round': '2라운드',
  '1st Round': '1라운드',
  'Preliminary Round': '예선',
};

function formatRoundLabel(round: string): string {
  if (ROUND_LABEL[round]) return ROUND_LABEL[round];
  // "League Phase - N" → "리그 페이즈 N라운드"
  const lp = round.match(/^League Phase - (\d+)$/);
  if (lp) return `리그 페이즈 ${lp[1]}R`;
  // Qualifying rounds
  const q = round.match(/^(\d+)(?:st|nd|rd|th) Qualifying Round$/);
  if (q) return `예선 ${q[1]}R`;
  return round; // 알 수 없으면 원문 유지
}

/**
 * 컵 대회의 라운드별 경기 목록 조회
 *
 * API-Football `fixtures?league=X&season=Y` 호출 → round로 그룹핑 → 정렬.
 * 순위표가 없는 컵 대회(EFL컵, FA컵, 코파 델 레이 등)에서 사용.
 */
export const fetchCupFixturesByRound = cache(async (
  leagueId: number,
  season?: number,
): Promise<CupFixturesResponse> => {
  try {
    const targetSeason = season || await getCurrentSeasonForLeague(leagueId);

    const data = await fetchFromFootballApi('fixtures', {
      league: leagueId,
      season: targetSeason,
    });

    const list = Array.isArray(data?.response) ? data.response : [];
    if (list.length === 0) {
      return { success: true, rounds: [] };
    }

    // 팀 로고 배치 조회 (4590 표준)
    const teamIds = new Set<number>();
    list.forEach((f: any) => {
      if (f?.teams?.home?.id) teamIds.add(f.teams.home.id);
      if (f?.teams?.away?.id) teamIds.add(f.teams.away.id);
    });
    const [teamLogos, teamMap] = await Promise.all([
      teamIds.size > 0 ? getTeamLogoUrls([...teamIds]) : Promise.resolve({} as Record<number, string>),
      teamIds.size > 0 ? getTeamsByIds([...teamIds]) : Promise.resolve({} as Record<number, TeamData>),
    ]);

    // 라운드별 그룹핑
    const groups = new Map<string, CupFixture[]>();
    for (const f of list) {
      const round: string = f?.league?.round ?? 'Unknown';
      const fixture: CupFixture = {
        id: f?.fixture?.id,
        date: f?.fixture?.date,
        status: {
          short: f?.fixture?.status?.short ?? '',
          long: f?.fixture?.status?.long ?? '',
          elapsed: f?.fixture?.status?.elapsed ?? null,
        },
        round,
        home: {
          id: f?.teams?.home?.id,
          name: f?.teams?.home?.name ?? '',
          name_ko: teamMap[f?.teams?.home?.id]?.name_ko,
          code: teamMap[f?.teams?.home?.id]?.code,
          logo: teamLogos[f?.teams?.home?.id] || '',
          score: f?.goals?.home ?? null,
          winner: f?.teams?.home?.winner ?? null,
        },
        away: {
          id: f?.teams?.away?.id,
          name: f?.teams?.away?.name ?? '',
          name_ko: teamMap[f?.teams?.away?.id]?.name_ko,
          code: teamMap[f?.teams?.away?.id]?.code,
          logo: teamLogos[f?.teams?.away?.id] || '',
          score: f?.goals?.away ?? null,
          winner: f?.teams?.away?.winner ?? null,
        },
        venue: f?.fixture?.venue?.name,
      };

      if (!groups.has(round)) groups.set(round, []);
      groups.get(round)!.push(fixture);
    }

    // 각 그룹 내부: 날짜 오름차순
    // 그룹 간: ROUND_ORDER 우선, 없으면 earliestDate 내림차순(늦은 순)
    const rounds: CupRound[] = [...groups.entries()].map(([round, fixtures]) => {
      fixtures.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      return {
        round,
        label: formatRoundLabel(round),
        fixtures,
        earliestDate: fixtures[0]?.date ?? '',
      };
    });

    rounds.sort((a, b) => {
      const oa = ROUND_ORDER[a.round];
      const ob = ROUND_ORDER[b.round];
      if (oa !== undefined && ob !== undefined) return oa - ob;
      if (oa !== undefined) return -1;
      if (ob !== undefined) return 1;
      // 둘 다 미지의 라운드: 날짜 늦은 순
      return (b.earliestDate || '').localeCompare(a.earliestDate || '');
    });

    return { success: true, rounds };
  } catch (error) {
    console.error('fetchCupFixturesByRound error:', error);
    return {
      success: false,
      rounds: [],
      error: error instanceof Error ? error.message : '컵 대회 경기 조회 실패',
    };
  }
});

/**
 * 컵 대회 리그 로고 (라이트/다크) 배치 조회 헬퍼
 */
export async function getCupLeagueLogos(leagueId: number) {
  const [light, dark] = await Promise.all([
    getLeagueLogoUrl(leagueId),
    getLeagueLogoUrl(leagueId, true),
  ]);
  return { light, dark };
}
