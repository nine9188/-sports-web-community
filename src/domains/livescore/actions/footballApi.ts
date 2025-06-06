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
interface MultiDayMatchesResult {
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
  
  // 항상 타임존 파라미터 추가 (명시적으로 지정된 경우 제외)
  const paramsWithTimezone = {
    timezone: 'Asia/Seoul',
    ...params
  };
  
  Object.entries(paramsWithTimezone).forEach(([key, value]) => {
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

// 어제, 오늘, 내일 경기 데이터를 한 번에 가져오기
export async function fetchMultiDayMatches(): Promise<MultiDayMatchesResult> {
  // 날짜 포맷팅 함수
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // 오늘 날짜 계산
  const today = new Date();
  
  // 어제 날짜 계산
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // 내일 날짜 계산
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const yesterdayFormatted = formatDate(yesterday);
  const todayFormatted = formatDate(today);
  const tomorrowFormatted = formatDate(tomorrow);

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
}

// 리그 상세 정보 가져오기
export async function fetchLeagueDetails(leagueId: string): Promise<LeagueDetails | null> {
  try {
    console.log('API 호출 시작 - 리그 상세:', leagueId);
    
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
    console.log('API 응답 - 리그 상세:', apiData);

    if (!apiData?.response?.[0]) {
      console.log('리그 데이터 없음');
      return null;
    }

    const data = apiData.response[0];
    const league = data.league;
    const currentSeason = data.seasons?.find((season: { current?: boolean }) => season.current);

    if (!league?.id) {
      console.log('리그 ID 없음');
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

    console.log('리그 상세 결과:', result);
    return result;
  } catch (error) {
    console.error('리그 상세 정보 가져오기 실패:', error);
    return null;
  }
}

// 리그 소속 팀 목록 가져오기
export async function fetchLeagueTeams(leagueId: string): Promise<LeagueTeam[]> {
  try {
    console.log('API 호출 시작 - 리그 팀:', leagueId);
    
    // 2024 시즌으로 고정하고 timezone 제거
    const url = `${API_BASE_URL}/teams?league=${leagueId}&season=2024`;
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
    console.log('API 응답 - 리그 팀:', apiData);

    if (!apiData?.response) {
      console.log('팀 데이터 없음');
      return [];
    }

    const teams: LeagueTeam[] = apiData.response
      .map((item: { team?: { id?: number; name?: string; logo?: string; founded?: number }; venue?: { id?: number; name?: string; city?: string; capacity?: number } }) => {
        const team = item.team;
        const venue = item.venue;

        if (!team?.id) return null;

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
          }
        };
      })
      .filter((team: LeagueTeam | null): team is LeagueTeam => team !== null)
      .sort((a: LeagueTeam, b: LeagueTeam) => a.name.localeCompare(b.name));

    console.log('팀 목록 결과:', teams.length, '개');
    return teams;
  } catch (error) {
    console.error('리그 팀 목록 가져오기 실패:', error);
    return [];
  }
} 