'use server';

import { cache } from 'react';
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

// API 기본 설정
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
      next: { revalidate: 300 } // 5분 캐싱 (라이브 데이터는 자주 업데이트되어야 함)
    });

    if (!response.ok) {
      throw new Error(`API 응답 오류: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Football API 요청 오류 (${endpoint}):`, error);
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
      
      return filteredMatches;
    }
    
    return [];
  } catch (error) {
    console.error('날짜별 매치 데이터 가져오기 오류:', error);
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

    const result: MultiDayMatchesResult = {
      success: true,
      dates: {
        yesterday: yesterdayFormatted,
        today: todayFormatted,
        tomorrow: tomorrowFormatted
      },
      meta: {
        totalMatches: yesterdayMatches.length + todayMatches.length + tomorrowMatches.length
      },
      data: {
        yesterday: { matches: yesterdayMatches },
        today: { matches: todayMatches },
        tomorrow: { matches: tomorrowMatches }
      }
    };
    
    return result;
  } catch (error) {
    console.error('다중 경기 데이터 가져오기 오류:', error);
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
      
      return matchData;
    }
    
    return null;
  } catch (error) {
    console.error('경기 상세 정보 가져오기 오류:', error);
    throw new Error('경기 정보를 가져오는데 실패했습니다.');
  }
}

// 캐싱을 적용한 다중 경기 데이터 가져오기
export const fetchCachedMultiDayMatches = cache(fetchMultiDayMatches);

// 캐싱을 적용한 경기 상세 정보 가져오기
export const fetchCachedMatchDetails = cache(fetchMatchDetails); 