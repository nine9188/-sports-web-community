'use server';

import { cache } from 'react';
import { RankingsData, PlayerRanking } from '@/domains/livescore/types/player';

/**
 * API 응답의 랭킹 항목 타입
 */
interface ApiRankingItem {
  player?: {
    id?: number;
    name?: string;
    photo?: string;
  };
  statistics?: Array<{
    team?: {
      id?: number;
      name?: string;
      logo?: string;
    };
    goals?: {
      total?: number;
      assists?: number;
    };
    games?: {
      appearences?: number;
      minutes?: number;
    };
    cards?: {
      yellow?: number;
      red?: number;
    };
  }>;
}

/**
 * 특정 리그의 선수 순위 데이터 가져오기
 * @param playerId 선수 ID
 * @param leagueId 리그 ID (기본값: 프리미어 리그, 39)
 * @returns 선수 순위 데이터
 */
export async function fetchPlayerRankings(
  playerId: number, 
  leagueId: number = 39
): Promise<RankingsData> {
  try {
    if (!playerId || !leagueId) {
      return {};
    }

    // 현재 시즌 계산
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const currentSeason = month >= 6 ? year : year - 1;

    // 필요한 순위 종류 정의
    const rankingTypes = [
      { type: 'topscorers', key: 'topScorers' },
      { type: 'topassists', key: 'topAssists' },
      { type: 'yellowcards', key: 'topYellowCards' },
      { type: 'redcards', key: 'topRedCards' }
    ];

    // 모든 순위 데이터 병렬로 가져오기
    const rankingsPromises = rankingTypes.map(({ type }) => 
      fetch(
        `https://v3.football.api-sports.io/players/${type}?league=${leagueId}&season=${currentSeason}`,
        {
          headers: {
            'x-rapidapi-host': 'v3.football.api-sports.io',
            'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
          },
          cache: 'no-store'
        }
      ).then(response => {
        if (!response.ok) {
          throw new Error(`${type} 데이터 API 응답 오류: ${response.status}`);
        }
        return response.json();
      })
      .catch(() => {
        return { response: [] };
      })
    );

    // 모든 API 응답 대기
    const responses = await Promise.all(rankingsPromises);

    // 결과 데이터 구성
    const result: RankingsData = {};

    // 각 순위 타입에 대한 결과 처리
    rankingTypes.forEach((rankingType, index) => {
      const response = responses[index];
      const { key } = rankingType;
      
      if (response?.response && Array.isArray(response.response)) {
        // API 응답을 표준 형식으로 변환
        const rankings = response.response.map((item: ApiRankingItem) => {
          const ranking: PlayerRanking = {
            player: {
              id: item.player?.id || 0,
              name: item.player?.name || '',
              photo: item.player?.photo || '',
            },
            statistics: [{
              team: {
                id: item.statistics?.[0]?.team?.id || 0,
                name: item.statistics?.[0]?.team?.name || '',
                logo: item.statistics?.[0]?.team?.logo || '',
              },
              goals: {
                total: item.statistics?.[0]?.goals?.total,
                assists: item.statistics?.[0]?.goals?.assists,
              },
              games: {
                appearences: item.statistics?.[0]?.games?.appearences,
                minutes: item.statistics?.[0]?.games?.minutes,
              },
              cards: {
                yellow: item.statistics?.[0]?.cards?.yellow,
                red: item.statistics?.[0]?.cards?.red,
              }
            }]
          };
          return ranking;
        });

        // 키에 맞게 결과 저장
        result[key as keyof RankingsData] = rankings;
      }
    });

    return result;
  } catch {
    return {};
  }
}

// 캐싱 적용 함수
export const fetchCachedPlayerRankings = cache(fetchPlayerRankings); 