'use server';

import { cache } from 'react';
import { PlayerStatistic } from '@/app/livescore/football/player/types/player';

// API 기본 설정
const API_BASE_URL = 'https://v3.football.api-sports.io';
const API_KEY = process.env.FOOTBALL_API_KEY || '';
const API_HOST = 'v3.football.api-sports.io';

// API 키 유효성 검사
if (!API_KEY) {
  console.error('Football API 키가 설정되지 않았습니다! 환경 변수 FOOTBALL_API_KEY를 확인하세요.');
}

// 캐시 객체
const seasonsCache = new Map<number, { data: number[]; timestamp: number }>();
const statsCache = new Map<string, { data: PlayerStatistic[]; timestamp: number }>();
const CACHE_DURATION = 3600000; // 1시간 캐시 (ms)

// API 호출 지연 시간
const API_DELAY = 1000; // 1초 지연

// 현재 시즌 결정 함수
const getCurrentSeason = (): number => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  // 7월 이후면 다음 시즌으로 간주 (예: 2024년 7월 이후면 2024 시즌)
  return month >= 6 ? year : year - 1;
};

/**
 * 선수가 활동한 시즌 목록 가져오기
 */
export const fetchPlayerSeasons = cache(async (playerId: number): Promise<number[]> => {
  // 캐시 확인
  const now = Date.now();
  const cached = seasonsCache.get(playerId);
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    // API 요청 전 대기
    await new Promise(resolve => setTimeout(resolve, API_DELAY));
    
    const response = await fetch(`${API_BASE_URL}/players/seasons?player=${playerId}`, {
      headers: {
        'x-rapidapi-host': API_HOST,
        'x-rapidapi-key': API_KEY,
      },
      next: { revalidate: 3600 } // 1시간 캐싱
    });
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    
    if (!data.response || !Array.isArray(data.response)) {
      return [];
    }
    
    // 현재 시즌 구하기
    const currentSeason = getCurrentSeason();
    
    // 시즌 데이터 필터링 (미래 시즌 제외) 및 최신 시즌부터 정렬
    const seasons = [...data.response]
      .filter(season => season <= currentSeason + 1) // 다음 시즌까지만 허용 (예시: 현재 2024년이면 2025년까지)
      .sort((a, b) => b - a); // 내림차순 정렬 (가장 최신 시즌이 맨 앞에)
    
    // 캐시에 저장
    seasonsCache.set(playerId, { data: seasons, timestamp: now });
    
    return seasons;
  } catch {
    return [];
  }
});

/**
 * 특정 시즌의 선수 통계 가져오기
 */
export const fetchPlayerStats = cache(async (
  playerId: number, 
  season: number
): Promise<PlayerStatistic[]> => {
  // 캐시 키 생성
  const cacheKey = `${playerId}-${season}`;
  
  // 캐시 확인
  const now = Date.now();
  const cached = statsCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  // 현재 시즌 확인
  const currentSeason = getCurrentSeason();
  
  // 요청한 시즌이 미래 시즌인 경우 현재 시즌 데이터로 대체
  const adjustedSeason = season > currentSeason ? currentSeason : season;
  
  // 시도할 시즌 목록 (최신부터 과거 순)
  const seasonsToTry = [
    adjustedSeason,       // 현재 시즌
    adjustedSeason - 1,   // 작년 시즌
    adjustedSeason - 2    // 2년 전 시즌
  ];
  
  for (const seasonToTry of seasonsToTry) {
    try {
      // API 호출 전 대기
      await new Promise(resolve => setTimeout(resolve, API_DELAY));
      
      // API 호출
      const response = await fetch(`${API_BASE_URL}/players?id=${playerId}&season=${seasonToTry}`, {
        headers: {
          'x-rapidapi-host': API_HOST,
          'x-rapidapi-key': API_KEY,
        },
        next: { revalidate: 3600 } // 1시간 캐싱
      });
      
      if (!response.ok) {
        continue; // 다음 시즌 시도
      }
      
      const data = await response.json();
      
      // 응답 구조 확인
      if (!data.response || data.response.length === 0) {
        continue; // 다음 시즌 시도
      }
      
      // 통계 정보 추출
      const playerStats = data.response[0].statistics;
      
      if (!playerStats || playerStats.length === 0) {
        continue; // 다음 시즌 시도
      }
      
      // 통계 데이터 포맷팅 및 반환
      const formattedStats = formatStatistics(playerStats);
      
      // 캐시에 저장 (원래 요청된 시즌의 캐시 키 사용)
      statsCache.set(cacheKey, { data: formattedStats, timestamp: now });
      
      return formattedStats;
    } catch {
      // 오류가 있어도 다음 시즌 시도
    }
  }
  
  // 모든 시즌에서 데이터를 찾지 못한 경우
  return [];
});

// API 응답을 PlayerStatistic[] 형식으로 변환하는 유틸리티 함수
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatStatistics(rawStats: Record<string, any>[]): PlayerStatistic[] {
  return rawStats.map((stat: {
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
      flag?: string;
      season?: number;
    };
    games?: {
      appearences?: number;
      lineups?: number;
      minutes?: number;
      number?: number;
      position?: string;
      rating?: string;
      captain?: boolean;
    };
    substitutes?: {
      in?: number;
      out?: number;
      bench?: number;
    };
    shots?: {
      total?: number;
      on?: number;
    };
    goals?: {
      total?: number;
      conceded?: number;
      assists?: number;
      saves?: number;
      cleansheets?: number;
    };
    passes?: {
      total?: number;
      key?: number;
      accuracy?: number | string;
      cross?: number;
    };
    tackles?: {
      total?: number;
      blocks?: number;
      interceptions?: number;
      clearances?: number;
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
      commited?: number;
      scored?: number;
      missed?: number;
      saved?: number;
    };
  }) => ({
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
      flag: stat.league?.flag || '',
      season: stat.league?.season || 0,
    },
    games: {
      appearences: stat.games?.appearences || 0,
      lineups: stat.games?.lineups || 0,
      minutes: stat.games?.minutes || 0,
      number: stat.games?.number,
      position: stat.games?.position || '',
      rating: stat.games?.rating || '',
      captain: stat.games?.captain || false,
    },
    substitutes: {
      in: stat.substitutes?.in || 0,
      out: stat.substitutes?.out || 0,
      bench: stat.substitutes?.bench || 0,
    },
    shots: {
      total: stat.shots?.total || 0,
      on: stat.shots?.on || 0,
    },
    goals: {
      total: stat.goals?.total || 0,
      conceded: stat.goals?.conceded || 0,
      assists: stat.goals?.assists || 0,
      saves: stat.goals?.saves || 0,
      cleansheets: stat.goals?.cleansheets || 0,
    },
    passes: {
      total: stat.passes?.total || 0,
      key: stat.passes?.key || 0,
      accuracy: typeof stat.passes?.accuracy === 'number' 
        ? `${stat.passes.accuracy}%` 
        : stat.passes?.accuracy || '',
      cross: stat.passes?.cross || 0,
    },
    tackles: {
      total: stat.tackles?.total || 0,
      blocks: stat.tackles?.blocks || 0,
      interceptions: stat.tackles?.interceptions || 0,
      clearances: stat.tackles?.clearances || 0,
    },
    duels: {
      total: stat.duels?.total || 0,
      won: stat.duels?.won || 0,
    },
    dribbles: {
      attempts: stat.dribbles?.attempts || 0,
      success: stat.dribbles?.success || 0,
      past: stat.dribbles?.past || 0,
    },
    fouls: {
      drawn: stat.fouls?.drawn || 0,
      committed: stat.fouls?.committed || 0,
    },
    cards: {
      yellow: stat.cards?.yellow || 0,
      yellowred: stat.cards?.yellowred || 0,
      red: stat.cards?.red || 0,
    },
    penalty: {
      won: stat.penalty?.won || 0,
      commited: stat.penalty?.commited || 0,
      scored: stat.penalty?.scored || 0,
      missed: stat.penalty?.missed || 0,
      saved: stat.penalty?.saved || 0,
    },
  }));
} 