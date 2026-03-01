'use server';

import { cache } from 'react';
import { getMajorLeagueIds } from '../constants/league-mappings';
import { getTeamLogoUrls, getLeagueLogoUrls } from './images';

// 매치 데이터 인터페이스
export interface MatchData {
  id: number;
  status: {
    code: string;
    name: string;
    elapsed: number | null;
  };
  time: {
    timestamp: number;
    date: string;
    timezone: string;
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    logoDark?: string;  // 다크모드 리그 로고
    flag: string;
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
    home: number;
    away: number;
  };
  displayDate?: string; // 표시용 날짜 (오늘/내일/어제)
}

// API 응답 관련 타입 정의
interface ApiMatch {
  fixture?: {
    id?: number;
    referee?: string;
    timezone?: string;
    date?: string;
    timestamp?: number;
    periods?: {
      first?: number;
      second?: number;
    };
    venue?: {
      id?: number;
      name?: string;
      city?: string;
    };
    status?: {
      long?: string;
      short?: string;
      elapsed?: number | null;
    };
  };
  league?: {
    id?: number;
    name?: string;
    country?: string;
    logo?: string;
    flag?: string;
  };
  teams?: {
    home?: {
      id?: number;
      name?: string;
      logo?: string;
      winner?: boolean | null;
    };
    away?: {
      id?: number;
      name?: string;
      logo?: string;
      winner?: boolean | null;
    };
  };
  goals?: {
    home?: number | null;
    away?: number | null;
  };
  [key: string]: unknown;
}

interface LineupPlayer {
  player: {
    id: number;
    captain?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface ApiLineup {
  team: {
    id: number;
    [key: string]: unknown;
  };
  startXI: LineupPlayer[];
  [key: string]: unknown;
}

interface ApiPlayer {
  team: {
    id: number;
    [key: string]: unknown;
  };
  players?: {
    player?: {
      id?: number;
      [key: string]: unknown;
    };
    statistics?: Array<{
      games?: {
        captain?: boolean;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  }[];
  [key: string]: unknown;
}

// API 설정
const API_BASE_URL = 'https://v3.football.api-sports.io';
const API_KEY = process.env.FOOTBALL_API_KEY || '';

// ── 유틸리티 ──

/** KST 기준 날짜 문자열 (yyyy-MM-dd) */
function toKstDateString(baseUtc: Date): string {
  const kst = new Date(baseUtc.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().split('T')[0];
}

// MultiDayMatches 결과 타입 정의
export interface MultiDayMatchesResult {
  success: boolean;
  dates?: {
    yesterday: string;
    today: string;
    tomorrow: string;
  };
  meta?: {
    totalMatches: number;
  };
  data?: {
    yesterday: { matches: MatchData[] };
    today: { matches: MatchData[] };
    tomorrow: { matches: MatchData[] };
  };
  error?: string;
}

// 오늘 경기만 포함하는 결과 타입 (모달 최적화용)
export interface TodayMatchesResult {
  success: boolean;
  date?: string;
  meta?: {
    totalMatches: number;
  };
  data?: {
    today: { matches: MatchData[] };
  };
  error?: string;
}

// ── API 호출 ──

export const fetchFromFootballApi = async (endpoint: string, params: Record<string, string | number> = {}) => {
  // URL 파라미터 구성
  const queryParams = new URLSearchParams();

  // timezone 파라미터는 일부 엔드포인트에서만 지원됨
  // 주의: fixtures/events, fixtures/lineups, fixtures/statistics 등은 timezone 미지원
  const timezoneSupportedEndpoints = ['fixtures', 'fixtures/headtohead', 'odds'];
  const shouldAddTimezone = timezoneSupportedEndpoints.some(ep => endpoint === ep);

  const finalParams = shouldAddTimezone
    ? { timezone: 'Asia/Seoul', ...params }
    : params;

  // ⭐ 파라미터 알파벳 순 정렬 (캐시 히트율 100% 보장)
  // 동일한 파라미터는 항상 동일한 URL을 생성
  // 예: ?date=2024-01-01&timezone=Asia/Seoul (항상 동일)
  Object.entries(finalParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

  const url = `${API_BASE_URL}/${endpoint}?${queryParams.toString()}`;

  // ⭐ endpoint별 최적 revalidate 시간 (데이터 특성에 맞춤)
  const getRevalidateTime = (ep: string): number => {
    // 실시간성이 중요한 데이터: 짧게
    if (ep.includes('fixtures')) return 60;           // 경기 정보: 1분
    if (ep.includes('events')) return 30;             // 경기 이벤트: 30초
    if (ep.includes('lineups')) return 300;           // 라인업: 5분 (경기 시작 전 확정)

    // 자주 변하지 않는 데이터: 길게
    if (ep.includes('standings')) return 1800;        // 순위표: 30분 (경기 종료 후 업데이트)
    if (ep.includes('players/')) return 3600;         // 선수 정보: 1시간
    if (ep.includes('teams/')) return 3600;           // 팀 정보: 1시간
    if (ep.includes('transfers')) return 86400;       // 이적 정보: 24시간
    if (ep.includes('trophies')) return 86400;        // 우승 기록: 24시간
    if (ep.includes('injuries')) return 3600;         // 부상 정보: 1시간

    // 기본값
    return 300; // 5분
  };

  try {
    const response = await fetch(url, {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': API_KEY,
      },
      // ⭐ endpoint별 최적 캐시 전략
      // - fixtures: 1분 (실시간)
      // - standings: 30분 (느린 업데이트)
      // - 인스턴스 간 캐시 공유 (Vercel Data Cache)
      next: { revalidate: getRevalidateTime(endpoint) }
    });

    if (!response.ok) {
      throw new Error(`API 응답 오류: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

// ── Raw 데이터 (이미지 해결 없음) ──

/** API 호출 + 리그 필터링만, 이미지 URL은 빈 문자열 */
async function fetchMatchesByDateRaw(date: string): Promise<MatchData[]> {
  try {
    const data = await fetchFromFootballApi('fixtures', { date });

    if (!data.response) return [];

    const majorLeagueIds = getMajorLeagueIds();
    const filteredApiMatches = data.response.filter(
      (match: ApiMatch) => majorLeagueIds.includes(match.league?.id ?? 0)
    );

    return filteredApiMatches.map((match: ApiMatch): MatchData => ({
      id: match.fixture?.id || 0,
      status: {
        code: match.fixture?.status?.short || '',
        name: match.fixture?.status?.long || '',
        elapsed: match.fixture?.status?.elapsed || null
      },
      time: {
        timestamp: match.fixture?.timestamp || 0,
        date: match.fixture?.date || '',
        timezone: match.fixture?.timezone || 'UTC'
      },
      league: {
        id: match.league?.id || 0,
        name: match.league?.name || '',
        country: match.league?.country || '',
        logo: '',
        logoDark: '',
        flag: match.league?.flag || ''
      },
      teams: {
        home: {
          id: match.teams?.home?.id || 0,
          name: match.teams?.home?.name || '',
          logo: '',
          winner: match.teams?.home?.winner !== undefined ? match.teams.home.winner : null
        },
        away: {
          id: match.teams?.away?.id || 0,
          name: match.teams?.away?.name || '',
          logo: '',
          winner: match.teams?.away?.winner !== undefined ? match.teams.away.winner : null
        }
      },
      goals: {
        home: match.goals?.home ?? 0,
        away: match.goals?.away ?? 0
      }
    }));
  } catch (error) {
    console.error(`[fetchMatchesByDateRaw] ${date} 조회 실패:`, error);
    return [];
  }
}

// ── 이미지 해결 ──

/** 단일 매치에 이미지 URL 적용 */
function applyImageUrls(
  match: MatchData,
  teamLogos: Record<number, string>,
  leagueLogos: Record<number, string>,
  leagueLogosDark: Record<number, string>
): MatchData {
  return {
    ...match,
    league: {
      ...match.league,
      logo: leagueLogos[match.league.id] || '',
      logoDark: leagueLogosDark[match.league.id] || '',
    },
    teams: {
      home: {
        ...match.teams.home,
        logo: teamLogos[match.teams.home.id] || '',
      },
      away: {
        ...match.teams.away,
        logo: teamLogos[match.teams.away.id] || '',
      },
    },
  };
}

/** 여러 날짜의 raw 매치 데이터에 배치로 이미지 URL 적용 (Supabase 쿼리 3회) */
async function resolveMatchImages(
  matchesByDay: { key: string; matches: MatchData[] }[]
): Promise<Map<string, MatchData[]>> {
  // 1. 모든 팀/리그 ID 수집
  const teamIds = new Set<number>();
  const leagueIds = new Set<number>();

  for (const { matches } of matchesByDay) {
    for (const match of matches) {
      if (match.teams.home.id) teamIds.add(match.teams.home.id);
      if (match.teams.away.id) teamIds.add(match.teams.away.id);
      if (match.league.id) leagueIds.add(match.league.id);
    }
  }

  // 2. 배치 Supabase 쿼리 (3회만)
  const [teamLogoUrls, leagueLogoUrls, leagueLogoDarkUrls] = await Promise.all([
    teamIds.size > 0 ? getTeamLogoUrls([...teamIds]) : Promise.resolve({}),
    leagueIds.size > 0 ? getLeagueLogoUrls([...leagueIds]) : Promise.resolve({}),
    leagueIds.size > 0 ? getLeagueLogoUrls([...leagueIds], true) : Promise.resolve({})
  ]);

  // 3. 각 매치에 이미지 URL 적용
  const result = new Map<string, MatchData[]>();
  for (const { key, matches } of matchesByDay) {
    result.set(key, matches.map(match =>
      applyImageUrls(match, teamLogoUrls, leagueLogoUrls, leagueLogoDarkUrls)
    ));
  }

  return result;
}

// ── 공개 함수 (하위 호환) ──

// 특정 날짜의 경기 정보 가져오기
export async function fetchMatchesByDate(date: string): Promise<MatchData[]> {
  try {
    const rawMatches = await fetchMatchesByDateRaw(date);
    if (rawMatches.length === 0) return [];

    const resolved = await resolveMatchImages([{ key: date, matches: rawMatches }]);
    return JSON.parse(JSON.stringify(resolved.get(date) || []));
  } catch (error) {
    console.error(`[fetchMatchesByDate] ${date} 조회 실패:`, error);
    return [];
  }
}

// 특정 날짜의 경기 정보 가져오기 (캐시 적용 버전) - 같은 렌더 사이클 내 중복 호출 방지
export const fetchMatchesByDateCached = cache(async (date: string): Promise<MatchData[]> => {
  return fetchMatchesByDate(date);
});

// ── 메인페이지 최적화 함수 ──

// 어제, 오늘, 내일 경기 데이터를 한 번에 가져오기 - cache 적용
// 참고: API-Football의 from/to 파라미터는 league/season 필수 → date 파라미터 3회 병렬 호출 사용
export const fetchMultiDayMatches = cache(async (): Promise<MultiDayMatchesResult> => {
  const nowUtc = new Date();
  const yesterdayFormatted = toKstDateString(new Date(nowUtc.getTime() - 24 * 60 * 60 * 1000));
  const todayFormatted = toKstDateString(nowUtc);
  const tomorrowFormatted = toKstDateString(new Date(nowUtc.getTime() + 24 * 60 * 60 * 1000));

  try {
    // 병렬로 3일치 raw 데이터 가져오기 (이미지 해결 없음)
    const [yesterdayRaw, todayRaw, tomorrowRaw] = await Promise.all([
      fetchMatchesByDateRaw(yesterdayFormatted),
      fetchMatchesByDateRaw(todayFormatted),
      fetchMatchesByDateRaw(tomorrowFormatted)
    ]);

    // 배치 이미지 해결 (3회 Supabase 쿼리 — 기존 9회에서 감소)
    const resolved = await resolveMatchImages([
      { key: 'yesterday', matches: yesterdayRaw },
      { key: 'today', matches: todayRaw },
      { key: 'tomorrow', matches: tomorrowRaw }
    ]);

    const yesterdayMatches = resolved.get('yesterday') || [];
    const todayMatches = resolved.get('today') || [];
    const tomorrowMatches = resolved.get('tomorrow') || [];

    const totalMatches = yesterdayMatches.length + todayMatches.length + tomorrowMatches.length;

    return {
      success: true,
      dates: {
        yesterday: yesterdayFormatted,
        today: todayFormatted,
        tomorrow: tomorrowFormatted
      },
      meta: { totalMatches },
      data: {
        yesterday: { matches: yesterdayMatches },
        today: { matches: todayMatches },
        tomorrow: { matches: tomorrowMatches }
      }
    };
  } catch {
    return {
      success: false,
      error: '데이터를 가져오는데 실패했습니다.'
    };
  }
});

// ── 기타 유지 함수 ──

// 특정 날짜의 경기 가져오기 (어제/내일 lazy load용)
export async function fetchMatchesByDateLabel(dateLabel: 'yesterday' | 'today' | 'tomorrow'): Promise<{
  success: boolean;
  date?: string;
  matches?: MatchData[];
  error?: string;
}> {
  const nowUtc = new Date();
  let targetDate: string;

  switch (dateLabel) {
    case 'yesterday':
      targetDate = toKstDateString(new Date(nowUtc.getTime() - 24 * 60 * 60 * 1000));
      break;
    case 'today':
      targetDate = toKstDateString(nowUtc);
      break;
    case 'tomorrow':
      targetDate = toKstDateString(new Date(nowUtc.getTime() + 24 * 60 * 60 * 1000));
      break;
  }

  try {
    // 캐시된 버전 사용 - 같은 날짜면 데이터 공유
    const matches = await fetchMatchesByDateCached(targetDate);
    return {
      success: true,
      date: targetDate,
      matches
    };
  } catch {
    return {
      success: false,
      error: '데이터를 가져오는데 실패했습니다.'
    };
  }
}

// 특정 경기 상세 정보 가져오기
export async function fetchMatchDetails(matchId: string) {
  try {
    const data = await fetchFromFootballApi('fixtures', { id: matchId });

    if (data.response?.[0]) {
      const matchData = data.response[0];

      // captain 정보 추가
      if (matchData.lineups) {
        matchData.lineups.forEach((lineup: ApiLineup) => {
          const teamCaptainId = matchData.players
            ?.find((p: ApiPlayer) => p.team.id === lineup.team.id)
            ?.players
            ?.find((p: { statistics?: Array<{ games?: { captain?: boolean } }> }) => p.statistics?.[0]?.games?.captain)
            ?.player?.id;

          lineup.startXI.forEach((item: LineupPlayer) => {
            item.player.captain = item.player.id === teamCaptainId;
          });
        });
      }

      // JSON 직렬화로 안전한 객체 보장
      return JSON.parse(JSON.stringify(matchData));
    }

    return null;
  } catch {
    throw new Error('경기 정보를 가져오는데 실패했습니다.');
  }
}

// ===== 리그 관련 함수들 =====

// 리그 상세 정보 타입
export interface LeagueDetails {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string;
  season: number;
  type: string;
}

// 리그 소속 팀 타입
export interface LeagueTeam {
  id: number;
  name: string;
  logo: string;
  founded: number;
  venue: {
    id: number;
    name: string;
    city: string;
    capacity: number;
  };
  position?: number; // 리그 순위 (옵셔널)
  isWinner?: boolean; // 컵대회 우승팀 여부 (옵셔널)
}

// standings API row 타입 (any 사용 금지)
type StandingRow = {
  team?: { id?: number };
  rank?: number;
};

// 리그 상세 정보 가져오기
export async function fetchLeagueDetails(leagueId: string): Promise<LeagueDetails | null> {
  try {
    const apiData = await fetchFromFootballApi('leagues', { id: leagueId, current: 'true' });

    if (!apiData?.response?.[0]) {
      return null;
    }

    const data = apiData.response[0];
    const league = data.league;
    const currentSeason = data.seasons?.find((season: { current?: boolean }) => season.current);

    if (!league?.id) {
      return null;
    }

    // 4590 표준: Storage URL 조회
    const leagueLogoUrls = await getLeagueLogoUrls([league.id]);

    const result = {
      id: league.id,
      name: league.name || '',
      country: league.country || '',
      logo: leagueLogoUrls[league.id] || '',  // 4590 표준: Storage URL
      flag: league.flag || '',
      season: currentSeason?.year || new Date().getFullYear(),
      type: league.type || ''
    };

    return result;
  } catch (error) {
    console.error('리그 상세 정보 가져오기 실패:', error);
    return null;
  }
}

// 시즌 완료 여부 확인 함수
async function isSeasonCompleted(leagueId: string, season: string = '2024'): Promise<boolean> {
  try {
    // 현재 날짜
    const now = new Date();
    const currentYear = now.getFullYear();
    const seasonYear = parseInt(season);

    // K리그의 경우 특별 처리
    const kLeagueIds = ['292', '293', '294']; // K리그 1, K리그 2, K리그 3
    if (kLeagueIds.includes(leagueId)) {
      // K리그 2025 시즌은 현재 진행 중
      if (seasonYear === 2025 && currentYear === 2025) {
        return false;
      }
      // K리그 2024 시즌은 완료됨
      if (seasonYear === 2024 && currentYear >= 2025) {
        return true;
      }
    }

    // 일반적인 경우: 시즌 연도가 현재 연도보다 이전이면 완료된 것으로 간주
    if (seasonYear < currentYear) {
      return true;
    }

    // 현재 연도 시즌은 진행 중으로 간주
    return false;
  } catch {
    // 오류 시 안전하게 진행 중으로 간주
    return false;
  }
}

// 리그 소속 팀 목록 가져오기 (우승팀 정보 포함)
export async function fetchLeagueTeams(leagueId: string): Promise<LeagueTeam[]> {
  try {
    // 모든 리그 2025 시즌으로 통일 (데이터 일관성 유지)
    const season = '2025';

    // 시즌 완료 여부 확인
    const seasonCompleted = await isSeasonCompleted(leagueId, season);

    // 팀 목록, 순위 정보, 우승팀 정보를 병렬로 가져오기
    const [teamsData, standingsData, winnerPromise] = await Promise.all([
      fetchFromFootballApi('teams', { league: leagueId, season }),
      fetchFromFootballApi('standings', { league: leagueId, season }).catch(() => null),
      fetchCupWinner(leagueId, season)
    ]);

    if (!teamsData?.response) {
      return [];
    }

    // 순위 정보 처리 (MLS와 같이 컨퍼런스별 다중 그룹 지원)
    const standingsMap = new Map<number, number>();
    if (standingsData) {
      try {
        if (standingsData.response && Array.isArray(standingsData.response)) {
          const leagueStandings = standingsData.response[0]?.league?.standings;
          // 구조가 [ [groupA...], [groupB...] ] 형태일 수 있음
          if (Array.isArray(leagueStandings)) {
            // leagueStandings가 2중 배열인지 확인 후 플랫하게 순회
            const groups = Array.isArray(leagueStandings[0]) ? leagueStandings : [leagueStandings];
            groups.forEach((group: StandingRow[]) => {
              const rows = Array.isArray(group) ? group : [];
              rows.forEach((standing: StandingRow) => {
                if (standing?.team?.id && standing?.rank) {
                  standingsMap.set(standing.team.id, standing.rank);
                }
              });
            });
          }
        }
      } catch (standingsError) {
        console.warn('순위 정보 처리 중 오류:', standingsError);
      }
    }

    // 우승팀 정보
    const winnerId = await winnerPromise;

    // 4590 표준: 팀 ID 수집 후 배치로 Storage URL 조회
    const teamIds = teamsData.response
      .map((item: { team?: { id?: number } }) => item.team?.id)
      .filter((id: number | undefined): id is number => id !== undefined);

    const teamLogoUrls = teamIds.length > 0 ? await getTeamLogoUrls(teamIds) : {};

    const teams: LeagueTeam[] = teamsData.response
      .map((item: { team?: { id?: number; name?: string; logo?: string; founded?: number }; venue?: { id?: number; name?: string; city?: string; capacity?: number } }) => {
        const team = item.team;
        const venue = item.venue;

        if (!team?.id) return null;

        const position = standingsMap.get(team.id);
        // 우승팀 표시 로직: 컵대회 우승팀 또는 (시즌이 완료된 경우에만) 리그 1위 팀
        const isWinner = winnerId === team.id || (seasonCompleted && position === 1);

        return {
          id: team.id,
          name: team.name || '',
          logo: teamLogoUrls[team.id] || '',  // 4590 표준: Storage URL
          founded: team.founded || 0,
          venue: {
            id: venue?.id || 0,
            name: venue?.name || '',
            city: venue?.city || '',
            capacity: venue?.capacity || 0
          },
          position: position || undefined,
          isWinner: isWinner
        };
      })
      .filter((team: LeagueTeam | null): team is LeagueTeam => team !== null);

    // 우승팀을 맨 앞으로, 그 다음 순위순으로 정렬
    teams.sort((a: LeagueTeam, b: LeagueTeam) => {
      // 우승팀이 있으면 맨 앞으로
      if (a.isWinner && !b.isWinner) return -1;
      if (!a.isWinner && b.isWinner) return 1;

      // 둘 다 우승팀이 아니면 기존 정렬 로직
      if (a.position && b.position) {
        return a.position - b.position;
      }
      if (a.position && !b.position) {
        return -1;
      }
      if (!a.position && b.position) {
        return 1;
      }
      return a.name.localeCompare(b.name);
    });

    return teams;
  } catch (error) {
    console.error('리그 팀 목록 가져오기 실패:', error);
    return [];
  }
}

// ===== 컵대회 우승팀 관련 함수들 =====

// 컵대회 우승팀 정보 타입
export interface TrophyInfo {
  league: string;
  country: string;
  season: string;
  place: string;
}

// 컵대회 우승팀 정보 가져오기
export async function fetchTeamTrophies(teamId: string): Promise<TrophyInfo[]> {
  try {
    const apiData = await fetchFromFootballApi('trophies', { team: teamId });

    if (!apiData?.response) {
      return [];
    }

    const trophies: TrophyInfo[] = apiData.response
      .map((item: { league?: string; country?: string; season?: string; place?: string }) => ({
        league: item.league || '',
        country: item.country || '',
        season: item.season || '',
        place: item.place || ''
      }))
      .filter((trophy: TrophyInfo) => trophy.league && trophy.place);

    return trophies;
  } catch (error) {
    console.error('팀 트로피 정보 가져오기 실패:', error);
    return [];
  }
}

// 특정 리그의 우승팀 확인
export async function fetchLeagueWinner(leagueId: string, season: string = '2024'): Promise<number | null> {
  try {
    const apiData = await fetchFromFootballApi('standings', { league: leagueId, season });

    if (apiData.response && Array.isArray(apiData.response)) {
      const standings = apiData.response[0]?.league?.standings?.[0];
      if (Array.isArray(standings) && standings.length > 0) {
        const winner = standings.find((standing: { rank?: number; team?: { id?: number } }) => standing.rank === 1);
        if (winner?.team?.id) {
          return winner.team.id;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('리그 우승팀 정보 가져오기 실패:', error);
    return null;
  }
}

// 컵대회 결승전 정보 가져오기
export async function fetchCupFinal(leagueId: string, season: string = '2024'): Promise<number | null> {
  try {
    const apiData = await fetchFromFootballApi('fixtures', { league: leagueId, season, round: 'Final' });

    if (apiData.response && Array.isArray(apiData.response) && apiData.response.length > 0) {
      const finalMatch = apiData.response[0];

      // 경기가 끝났고 승자가 있는 경우
      if (finalMatch.fixture?.status?.short === 'FT') {
        const homeTeam = finalMatch.teams?.home;
        const awayTeam = finalMatch.teams?.away;

        if (homeTeam?.winner === true) {
          return homeTeam.id;
        } else if (awayTeam?.winner === true) {
          return awayTeam.id;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('컵대회 결승전 정보 가져오기 실패:', error);
    return null;
  }
}

// 다양한 라운드명으로 결승전 찾기
export async function fetchCupWinner(leagueId: string, season: string = '2024'): Promise<number | null> {
  const possibleFinalRounds = [
    'Final',
    'Finals',
    'Championship Final',
    'Grand Final',
    'Cup Final'
  ];

  for (const round of possibleFinalRounds) {
    try {
      const apiData = await fetchFromFootballApi('fixtures', { league: leagueId, season, round });

      if (apiData) {

        if (apiData.response && Array.isArray(apiData.response) && apiData.response.length > 0) {
          const finalMatch = apiData.response[0];

          if (finalMatch.fixture?.status?.short === 'FT') {
            const homeTeam = finalMatch.teams?.home;
            const awayTeam = finalMatch.teams?.away;

            if (homeTeam?.winner === true) {
              return homeTeam.id;
            } else if (awayTeam?.winner === true) {
              return awayTeam.id;
            }
          }
        }
      }
    } catch (error) {
      console.warn(`${round} 검색 실패:`, error);
    }
  }

  return null;
}