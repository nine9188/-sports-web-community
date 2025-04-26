'use server';

import { cache } from 'react';

// 선수 데이터 인터페이스
interface Player {
  id: number;
  name: string;
  photo: string;
}

// 팀 데이터 인터페이스
interface Team {
  id: number;
  name: string;
  logo: string;
}

// 통계 데이터 인터페이스
interface Statistic {
  team: Team;
  games: {
    appearences?: number;
    minutes?: number;
  };
  goals: {
    total?: number;
    assists?: number;
  };
  cards: {
    yellow?: number;
    red?: number;
  };
}

// 선수 순위 데이터 인터페이스
interface PlayerRanking {
  player: Player;
  statistics: Statistic[];
}

// 모든 랭킹 데이터를 포함하는 인터페이스
interface RankingsData {
  topScorers?: PlayerRanking[];
  topAssists?: PlayerRanking[];
  mostGamesScored?: PlayerRanking[];
  leastPlayTime?: PlayerRanking[];
  topRedCards?: PlayerRanking[];
  topYellowCards?: PlayerRanking[];
}

// API 기본 설정
const API_BASE_URL = 'https://v3.football.api-sports.io';
const API_KEY = process.env.FOOTBALL_API_KEY || '';
const API_HOST = 'v3.football.api-sports.io';

// 캐시 관련 설정
const rankingsCache = new Map<string, {
  timestamp: number; 
  data: RankingsData;
}>();

// 캐시 유효 시간: 6시간 (단위: 밀리초)
const CACHE_TTL = 6 * 60 * 60 * 1000;

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
 * 선수 랭킹 정보를 가져오는 서버 액션
 * @param playerId 선수 ID
 * @param leagueId 리그 ID
 * @returns 랭킹 데이터
 */
export async function fetchPlayerRankings(playerId: number, leagueId: number): Promise<RankingsData> {
  try {
    if (!playerId || !leagueId) {
      return {} as RankingsData;
    }

    // 캐시 키 생성
    const cacheKey = `player_rankings_${leagueId}`;
    
    // 캐시 확인
    const cachedData = rankingsCache.get(cacheKey);
    const now = Date.now();
    
    // 캐시된 데이터가 있고, 유효 기간이 지나지 않았으면 캐시 데이터 반환
    if (cachedData && (now - cachedData.timestamp) < CACHE_TTL) {
      return cachedData.data;
    }

    // 현재 시즌 계산
    const season = getCurrentSeason();

    // 데이터 요청 함수
    async function fetchRankingData(endpoint: string) {
      try {
        // API 호출 전 지연
        await new Promise(resolve => setTimeout(resolve, API_DELAY));
        
        const response = await fetch(`${API_BASE_URL}/${endpoint}?league=${leagueId}&season=${season}`, {
          headers: {
            'x-rapidapi-host': API_HOST,
            'x-rapidapi-key': API_KEY,
          },
          next: { revalidate: 3600 } // 1시간 캐싱
        });
        
        if (!response.ok) {
          return { response: [] };
        }
        
        const data = await response.json();
        return data;
      } catch {
        return { response: [] };
      }
    }

    // 병렬로 API 요청 처리
    const [scorersData, assistsData, yellowCardsData, redCardsData] = await Promise.all([
      fetchRankingData('players/topscorers'),
      fetchRankingData('players/topassists'),
      fetchRankingData('players/topyellowcards'),
      fetchRankingData('players/topredcards')
    ]);

    const scorers = scorersData.response || [];
    const assists = assistsData.response || [];
    const yellowCards = yellowCardsData.response || [];
    const redCards = redCardsData.response || [];

    // 모든 API 응답을 합쳐서 정렬 및 필터링
    const result: RankingsData = {
      topScorers: scorers
        .sort((a: PlayerRanking, b: PlayerRanking) => 
          (b.statistics[0].goals.total || 0) - (a.statistics[0].goals.total || 0))
        .slice(0, 10),
      
      topAssists: assists
        .sort((a: PlayerRanking, b: PlayerRanking) => 
          (b.statistics[0].goals.assists || 0) - (a.statistics[0].goals.assists || 0))
        .slice(0, 10),
      
      mostGamesScored: scorers
        .sort((a: PlayerRanking, b: PlayerRanking) => 
          (b.statistics[0].games.appearences || 0) - (a.statistics[0].games.appearences || 0))
        .slice(0, 10),
      
      leastPlayTime: scorers
        .filter((p: PlayerRanking) => (p.statistics[0].games.minutes || 0) > 0)
        .sort((a: PlayerRanking, b: PlayerRanking) => 
          (a.statistics[0].games.minutes || 0) - (b.statistics[0].games.minutes || 0))
        .slice(0, 10),
      
      topYellowCards: yellowCards
        .sort((a: PlayerRanking, b: PlayerRanking) => 
          (b.statistics[0].cards.yellow || 0) - (a.statistics[0].cards.yellow || 0))
        .slice(0, 10),
      
      topRedCards: redCards
        .sort((a: PlayerRanking, b: PlayerRanking) => 
          (b.statistics[0].cards.red || 0) - (a.statistics[0].cards.red || 0))
        .slice(0, 10)
    };

    // 랭킹 데이터가 있는지 확인
    const hasData = Object.values(result).some(arr => arr && arr.length > 0);
    
    if (hasData) {
      // 캐시에 결과 저장
      rankingsCache.set(cacheKey, {
        timestamp: now,
        data: result
      });
      
      return result;
    } else {
      // 데이터가 없는 경우 이전 시즌 시도
      const prevSeason = season - 1;
      
      // 이전 시즌 데이터 요청
      const [prevScorersData, prevAssistsData, prevYellowCardsData, prevRedCardsData] = await Promise.all([
        fetchRankingData(`players/topscorers?league=${leagueId}&season=${prevSeason}`),
        fetchRankingData(`players/topassists?league=${leagueId}&season=${prevSeason}`),
        fetchRankingData(`players/topyellowcards?league=${leagueId}&season=${prevSeason}`),
        fetchRankingData(`players/topredcards?league=${leagueId}&season=${prevSeason}`)
      ]);
      
      const prevScorers = prevScorersData.response || [];
      const prevAssists = prevAssistsData.response || [];
      const prevYellowCards = prevYellowCardsData.response || [];
      const prevRedCards = prevRedCardsData.response || [];
      
      // 이전 시즌 데이터로 결과 구성
      const prevResult: RankingsData = {
        topScorers: prevScorers
          .sort((a: PlayerRanking, b: PlayerRanking) => 
            (b.statistics[0].goals.total || 0) - (a.statistics[0].goals.total || 0))
          .slice(0, 10),
        
        topAssists: prevAssists
          .sort((a: PlayerRanking, b: PlayerRanking) => 
            (b.statistics[0].goals.assists || 0) - (a.statistics[0].goals.assists || 0))
          .slice(0, 10),
        
        mostGamesScored: prevScorers
          .sort((a: PlayerRanking, b: PlayerRanking) => 
            (b.statistics[0].games.appearences || 0) - (a.statistics[0].games.appearences || 0))
          .slice(0, 10),
        
        leastPlayTime: prevScorers
          .filter((p: PlayerRanking) => (p.statistics[0].games.minutes || 0) > 0)
          .sort((a: PlayerRanking, b: PlayerRanking) => 
            (a.statistics[0].games.minutes || 0) - (b.statistics[0].games.minutes || 0))
          .slice(0, 10),
        
        topYellowCards: prevYellowCards
          .sort((a: PlayerRanking, b: PlayerRanking) => 
            (b.statistics[0].cards.yellow || 0) - (a.statistics[0].cards.yellow || 0))
          .slice(0, 10),
        
        topRedCards: prevRedCards
          .sort((a: PlayerRanking, b: PlayerRanking) => 
            (b.statistics[0].cards.red || 0) - (a.statistics[0].cards.red || 0))
          .slice(0, 10)
      };
      
      // 이전 시즌 데이터가 있는지 확인
      const hasPrevData = Object.values(prevResult).some(arr => arr && arr.length > 0);
      
      if (hasPrevData) {
        // 캐시에 결과 저장
        rankingsCache.set(cacheKey, {
          timestamp: now,
          data: prevResult
        });
        
        return prevResult;
      }
      
      return {} as RankingsData;
    }
  } catch {
    return {} as RankingsData;
  }
}

/**
 * 캐싱을 적용한 선수 랭킹 정보 가져오기
 */
export const fetchCachedPlayerRankings = cache(fetchPlayerRankings); 