'use server';

import { getMajorLeagueIds } from '../constants/league-mappings';

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

export const fetchFromFootballApi = async (endpoint: string, params: Record<string, string | number> = {}) => {
  // URL 파라미터 구성
  const queryParams = new URLSearchParams();
  
  // timezone 파라미터는 일부 엔드포인트에서만 지원됨
  const timezoneSupportedEndpoints = ['fixtures', 'fixtures/headtohead', 'odds'];
  const shouldAddTimezone = timezoneSupportedEndpoints.some(ep => endpoint.includes(ep));
  
  const finalParams = shouldAddTimezone 
    ? { timezone: 'Asia/Seoul', ...params }
    : params;
  
  Object.entries(finalParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString());
    }
  });

  const url = `${API_BASE_URL}/${endpoint}?${queryParams.toString()}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': API_KEY,
      },
      // Next.js revalidate 옵션 제거 (가능한 직렬화 문제 해결)
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`API 응답 오류: ${response.status}`);
    }

    const rawData = await response.json();
    
    // JSON-safe 객체로 강제 변환하여 Stream 직렬화 문제 해결
    return JSON.parse(JSON.stringify(rawData));
  } catch (error) {
    throw error;
  }
};

// 특정 날짜의 경기 정보 가져오기
export async function fetchMatchesByDate(date: string): Promise<MatchData[]> {
  try {
    // 타임존은 fetchFromFootballApi에서 자동으로 추가되므로 여기서는 제거
    const data = await fetchFromFootballApi('fixtures', { date });
    
    if (data.response) {
      // 주요 리그로 필터링 - 매핑된 모든 리그 ID 사용
      const majorLeagueIds = getMajorLeagueIds();
      
      const filteredMatches = data.response
        .filter((match: ApiMatch) => majorLeagueIds.includes(match.league?.id ?? 0))
        .map((match: ApiMatch): MatchData => {
          // MatchData 형식으로 변환
          return {
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
              logo: match.league?.logo || '',
              flag: match.league?.flag || ''
            },
            teams: {
              home: {
                id: match.teams?.home?.id || 0,
                name: match.teams?.home?.name || '',
                logo: match.teams?.home?.logo || '',
                winner: match.teams?.home?.winner !== undefined ? match.teams.home.winner : null
              },
              away: {
                id: match.teams?.away?.id || 0,
                name: match.teams?.away?.name || '',
                logo: match.teams?.away?.logo || '',
                winner: match.teams?.away?.winner !== undefined ? match.teams.away.winner : null
              }
            },
            goals: {
              home: match.goals?.home ?? 0,
              away: match.goals?.away ?? 0
            }
          };
        });
      
      // JSON 직렬화로 안전한 객체 보장
      return JSON.parse(JSON.stringify(filteredMatches));
    }
    
    return [];
  } catch {
    return [];
  }
}

import { cache } from 'react';

// 어제, 오늘, 내일 경기 데이터를 한 번에 가져오기 - cache 적용
export const fetchMultiDayMatches = cache(async (): Promise<MultiDayMatchesResult> => {
  // KST 기준 날짜 문자열 생성 유틸 (yyyy-MM-dd)
  const toKstDateString = (baseUtc: Date) => {
    const kst = new Date(baseUtc.getTime() + 9 * 60 * 60 * 1000);
    return kst.toISOString().split('T')[0];
  };

  // 서버 시간(UTC) 기준으로 KST 날짜 문자열 산출
  const nowUtc = new Date();
  const yesterdayFormatted = toKstDateString(new Date(nowUtc.getTime() - 24 * 60 * 60 * 1000));
  const todayFormatted = toKstDateString(nowUtc);
  const tomorrowFormatted = toKstDateString(new Date(nowUtc.getTime() + 24 * 60 * 60 * 1000));

  try {
    // 병렬로 3일치 데이터 가져오기
    const [yesterdayMatches, todayMatches, tomorrowMatches] = await Promise.all([
      fetchMatchesByDate(yesterdayFormatted),
      fetchMatchesByDate(todayFormatted),
      fetchMatchesByDate(tomorrowFormatted)
    ]);

    const totalMatches = yesterdayMatches.length + todayMatches.length + tomorrowMatches.length;

    const result: MultiDayMatchesResult = {
      success: true,
      dates: {
        yesterday: yesterdayFormatted,
        today: todayFormatted,
        tomorrow: tomorrowFormatted
      },
      meta: {
        totalMatches: totalMatches
      },
      data: {
        yesterday: { matches: yesterdayMatches },
        today: { matches: todayMatches },
        tomorrow: { matches: tomorrowMatches }
      }
    };
    
    // JSON 직렬화로 안전한 객체 보장
    return JSON.parse(JSON.stringify(result));
  } catch {
    return {
      success: false,
      error: '데이터를 가져오는데 실패했습니다.'
    };
  }
});

// 위젯용 빅매치 필터링 함수
export const fetchBigMatches = cache(async (): Promise<MultiDayMatchesResult> => {
  const result = await fetchMultiDayMatches();

  if (!result.success || !result.data) {
    return result;
  }

  // 빅매치 리그 ID - 유럽 Top 5 리그 + 유럽 컵대회 + FA컵 + K리그1
  const bigMatchLeagues = [
    39,  // 프리미어 리그
    140, // 라리가
    78,  // 분데스리가
    135, // 세리에 A
    61,  // 리그앙
    2,   // 챔피언스 리그
    3,   // 유로파 리그
    848, // 컨퍼런스 리그
    531, // UEFA 슈퍼컵
    45,  // FA컵
    292, // K리그1
  ];

  const filterMatches = (matches: MatchData[]) => {
    return matches.filter(match =>
      bigMatchLeagues.includes(match.league?.id || 0)
    );
  };

  const filteredData = {
    yesterday: { matches: filterMatches(result.data.yesterday.matches) },
    today: { matches: filterMatches(result.data.today.matches) },
    tomorrow: { matches: filterMatches(result.data.tomorrow.matches) }
  };

  const totalMatches =
    filteredData.yesterday.matches.length +
    filteredData.today.matches.length +
    filteredData.tomorrow.matches.length;

  return {
    success: true,
    dates: result.dates,
    meta: {
      totalMatches
    },
    data: filteredData
  };
});

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

// 캐싱을 적용한 다중 경기 데이터 가져오기
export const fetchCachedMultiDayMatches = fetchMultiDayMatches;

// 캐싱을 적용한 경기 상세 정보 가져오기
export const fetchCachedMatchDetails = fetchMatchDetails;

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
    // timezone 제거하고 호출
    const url = `${API_BASE_URL}/leagues?id=${leagueId}&current=true`;
    const response = await fetch(url, {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': API_KEY,
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`API 응답 오류: ${response.status}`);
    }

    const apiData = await response.json();

    if (!apiData?.response?.[0]) {
      return null;
    }

    const data = apiData.response[0];
    const league = data.league;
    const currentSeason = data.seasons?.find((season: { current?: boolean }) => season.current);

    if (!league?.id) {
      return null;
    }

    const result = {
      id: league.id,
      name: league.name || '',
      country: league.country || '',
      logo: league.logo || '',
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
    const [teamsResponse, standingsResponse, winnerPromise] = await Promise.all([
      fetch(`${API_BASE_URL}/teams?league=${leagueId}&season=${season}`, {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': API_KEY,
        },
        cache: 'no-store'
      }),
      fetch(`${API_BASE_URL}/standings?league=${leagueId}&season=${season}`, {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': API_KEY,
        },
        cache: 'no-store'
      }),
      fetchCupWinner(leagueId, season)
    ]);

    if (!teamsResponse.ok) {
      throw new Error(`팀 목록 API 응답 오류: ${teamsResponse.status}`);
    }

    const teamsData = await teamsResponse.json();

    if (!teamsData?.response) {
      return [];
    }

    // 순위 정보 처리 (MLS와 같이 컨퍼런스별 다중 그룹 지원)
    const standingsMap = new Map<number, number>();
    if (standingsResponse.ok) {
      try {
        const standingsData = await standingsResponse.json();
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
          logo: team.logo || '',
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
    const url = `${API_BASE_URL}/trophies?team=${teamId}`;
    const response = await fetch(url, {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': API_KEY,
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`API 응답 오류: ${response.status}`);
    }

    const apiData = await response.json();

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
    // 해당 리그의 최종 순위에서 1위 팀 찾기
    const url = `${API_BASE_URL}/standings?league=${leagueId}&season=${season}`;
    const response = await fetch(url, {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': API_KEY,
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`API 응답 오류: ${response.status}`);
    }

    const apiData = await response.json();

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
    // 해당 리그의 결승전 경기 찾기 (round가 "Final"인 경기)
    const url = `${API_BASE_URL}/fixtures?league=${leagueId}&season=${season}&round=Final`;
    const response = await fetch(url, {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': API_KEY,
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`API 응답 오류: ${response.status}`);
    }

    const apiData = await response.json();

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
      const url = `${API_BASE_URL}/fixtures?league=${leagueId}&season=${season}&round=${round}`;
      const response = await fetch(url, {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': API_KEY,
        },
        cache: 'no-store'
      });

      if (response.ok) {
        const apiData = await response.json();

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