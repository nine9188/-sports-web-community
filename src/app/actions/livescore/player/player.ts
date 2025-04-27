'use server';

import { cache } from 'react';
import { PlayerData } from '@/app/livescore/football/player/types/player';

// API 응답을 위한 인터페이스 정의
interface ApiPlayerResponse {
  player: {
    id?: number;
    name?: string;
    firstname?: string;
    lastname?: string;
    age?: number;
    birth?: {
      date?: string;
      place?: string;
      country?: string;
    };
    nationality?: string;
    height?: string;
    weight?: string;
    injured?: boolean;
    photo?: string;
  };
  statistics?: Array<{
    team?: {
      id?: number;
      name?: string;
      logo?: string;
    };
    league?: {
      id?: number;
      name?: string;
      country?: string;
      logo?: string;
      season?: number;
    };
    games?: {
      appearences?: number;
      lineups?: number;
      minutes?: number;
      position?: string;
      rating?: string;
      captain?: boolean;
    };
    goals?: {
      total?: number;
      assists?: number;
      saves?: number;
      conceded?: number;
      cleansheets?: number;
    };
    passes?: {
      total?: number;
      key?: number;
      accuracy?: string;
    };
    tackles?: {
      total?: number;
      blocks?: number;
      interceptions?: number;
    };
    duels?: {
      total?: number;
      won?: number;
    };
    dribbles?: {
      attempts?: number;
      success?: number;
      past?: number;
    };
    fouls?: {
      drawn?: number;
      committed?: number;
    };
    cards?: {
      yellow?: number;
      yellowred?: number;
      red?: number;
    };
    penalty?: {
      won?: number;
      committed?: number;
      scored?: number;
      missed?: number;
      saved?: number;
    };
  }>;
}

// 메모리 캐시 (서버 재시작될 때까지 유지)
const playerDataCache = new Map<string, {
  timestamp: number; 
  data: PlayerData;
}>();

// 캐시 유효 시간: 3시간 (단위: 밀리초)
const CACHE_TTL = 3 * 60 * 60 * 1000;

// API 호출 지연 시간
const API_DELAY = 1000; // 1초 지연

/**
 * API 호출을 위한 재시도 함수
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  delay = API_DELAY
): Promise<Response> {
  try {
    // API 호출 간 지연 시간 적용
    await new Promise(resolve => setTimeout(resolve, delay));
    
    const response = await fetch(url, options);
    
    // 429 (Too Many Requests) 오류 처리
    if (response.status === 429 && retries > 0) {
      // 지수 백오프 적용 (재시도마다 대기 시간 증가)
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      return fetchWithRetry(url, options, retries - 1, delay);
    }
    throw error;
  }
}

/**
 * 특정 선수의 기본 정보를 가져오는 서버 액션
 * @param playerId 선수 ID
 * @returns 선수 기본 정보 데이터
 */
export async function fetchPlayerData(playerId: string): Promise<PlayerData> {
  try {
    if (!playerId) {
      throw new Error('선수 ID가 필요합니다');
    }

    // 캐시 키 생성
    const cacheKey = `player_data_${playerId}`;
    
    // 캐시 확인
    const cachedData = playerDataCache.get(cacheKey);
    const now = Date.now();
    
    // 캐시된 데이터가 있고, 유효 기간이 지나지 않았으면 캐시 데이터 반환
    if (cachedData && (now - cachedData.timestamp) < CACHE_TTL) {
      return cachedData.data;
    }
    
    // 현재 시즌 계산 (7월 1일 기준으로 새 시즌 시작)
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; 
    const season = currentMonth >= 7 ? currentYear : currentYear - 1;

    // API 요청
    const response = await fetchWithRetry(
      `https://v3.football.api-sports.io/players?id=${playerId}&season=${season}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        // 캐싱 적용
        cache: 'force-cache'
      }
    );

    if (!response.ok) {
      throw new Error(`API 응답 오류: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.response || data.response.length === 0) {
      // 현재 시즌에서 정보를 찾을 수 없는 경우 이전 시즌 조회
      const lastSeasonResponse = await fetchWithRetry(
        `https://v3.football.api-sports.io/players?id=${playerId}&season=${season-1}`,
        {
          headers: {
            'x-rapidapi-host': 'v3.football.api-sports.io',
            'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
          },
          cache: 'force-cache'
        }
      );

      if (!lastSeasonResponse.ok) {
        throw new Error(`이전 시즌 API 응답 오류: ${lastSeasonResponse.status}`);
      }

      const lastSeasonData = await lastSeasonResponse.json();
      if (!lastSeasonData.response || lastSeasonData.response.length === 0) {
        throw new Error('선수 정보를 찾을 수 없습니다');
      }
      
      const player = lastSeasonData.response[0] as ApiPlayerResponse;
      
      // API 응답 데이터를 라우트 핸들러와 일관된 형태로 구성
      const formattedData = formatPlayerData(player, season-1);
      
      // 캐시에 결과 저장
      playerDataCache.set(cacheKey, {
        timestamp: now,
        data: formattedData
      });
      
      return formattedData;
    }
    
    const player = data.response[0] as ApiPlayerResponse;
    
    // API 응답 데이터를 라우트 핸들러와 일관된 형태로 구성
    const formattedData = formatPlayerData(player, season);
    
    // 캐시에 결과 저장
    playerDataCache.set(cacheKey, {
      timestamp: now,
      data: formattedData
    });
    
    return formattedData;

  } catch (error) {
    throw error;
  }
}

/**
 * API 응답 데이터를 일관된 형식으로 포맷팅
 */
function formatPlayerData(player: ApiPlayerResponse, season: number): PlayerData {
  return {
    info: {
      id: player?.player?.id || 0,
      name: player?.player?.name || '',
      firstname: player?.player?.firstname || '',
      lastname: player?.player?.lastname || '',
      age: player?.player?.age || 0,
      birth: {
        date: player?.player?.birth?.date || '',
        place: player?.player?.birth?.place || '',
        country: player?.player?.birth?.country || '',
      },
      nationality: player?.player?.nationality || '',
      height: player?.player?.height || '',
      weight: player?.player?.weight || '',
      injured: player?.player?.injured || false,
      photo: player?.player?.photo || '',
    },
    statistics: player?.statistics?.map((stat) => ({
      team: {
        id: stat.team?.id || 0,
        name: stat.team?.name || '',
        logo: stat.team?.logo || '',
      },
      league: {
        id: stat.league?.id || 0,
        name: stat.league?.name || '',
        country: stat.league?.country || '',
        logo: stat.league?.logo || '',
        season: stat.league?.season || season,
      },
      games: {
        appearences: stat.games?.appearences || 0,
        lineups: stat.games?.lineups || 0,
        minutes: stat.games?.minutes || 0,
        position: stat.games?.position || '',
        rating: stat.games?.rating || '',
        captain: stat.games?.captain || false,
      },
      substitutes: {
        in: 0,
        out: 0,
        bench: 0
      },
      goals: {
        total: stat.goals?.total || 0,
        assists: stat.goals?.assists || 0,
        saves: stat.goals?.saves || 0,
        conceded: stat.goals?.conceded || 0,
        cleansheets: stat.goals?.cleansheets || 0
      },
      shots: {
        total: 0,
        on: 0
      },
      passes: {
        total: stat.passes?.total || 0,
        key: stat.passes?.key || 0,
        accuracy: typeof stat.passes?.accuracy === 'number' 
          ? `${stat.passes.accuracy}%`
          : stat.passes?.accuracy || '',
        cross: 0
      },
      dribbles: {
        attempts: stat.dribbles?.attempts || 0,
        success: stat.dribbles?.success || 0,
        past: stat.dribbles?.past || 0
      },
      duels: {
        total: stat.duels?.total || 0,
        won: stat.duels?.won || 0
      },
      tackles: {
        total: stat.tackles?.total || 0,
        blocks: stat.tackles?.blocks || 0,
        interceptions: stat.tackles?.interceptions || 0,
        clearances: 0
      },
      fouls: {
        drawn: stat.fouls?.drawn || 0,
        committed: stat.fouls?.committed || 0
      },
      cards: {
        yellow: stat.cards?.yellow || 0,
        yellowred: stat.cards?.yellowred || 0,
        red: stat.cards?.red || 0
      },
      penalty: {
        scored: stat.penalty?.scored || 0,
        missed: stat.penalty?.missed || 0,
        saved: stat.penalty?.saved || 0,
        won: stat.penalty?.won || 0,
        commited: stat.penalty?.committed || 0
      }
    })) || []
  };
}

/**
 * 캐싱을 적용한 선수 기본 정보 가져오기
 */
export const fetchCachedPlayerData = cache(fetchPlayerData); 