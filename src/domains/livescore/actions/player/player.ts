'use server';

import { cache } from 'react';
import { PlayerData } from '@/domains/livescore/types/player';

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

/**
 * 선수 기본 정보 가져오기
 * @param id 선수 ID
 * @returns 선수 기본 정보
 */
export async function fetchPlayerData(id: string): Promise<PlayerData> {
  try {
    if (!id) {
      throw new Error('선수 ID가 필요합니다.');
    }

    // 현재 시즌 계산
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const currentSeason = month >= 6 ? year : year - 1;

    // 여러 시즌에서 선수 데이터 시도
    const seasonsToTry = [currentSeason, currentSeason - 1, currentSeason + 1];
    
    for (const season of seasonsToTry) {
      try {
        // API 호출
        const response = await fetch(
          `https://v3.football.api-sports.io/players?id=${id}&season=${season}`,
          {
            headers: {
              'x-rapidapi-host': 'v3.football.api-sports.io',
              'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
            },
            cache: 'no-store'
          }
        );

        if (!response.ok) {
          console.warn(`API 응답 오류 (시즌 ${season}): ${response.status}`);
          continue;
        }

        const playerData = await response.json();

        // 데이터 존재 확인
        if (playerData?.response?.[0]) {
          console.log(`선수 데이터 발견: ID ${id}, 시즌 ${season}`);
          return formatPlayerData(playerData.response[0], season);
        }
      } catch (seasonError) {
        console.warn(`시즌 ${season}에서 선수 ${id} 데이터 가져오기 실패:`, seasonError);
        continue;
      }
    }

    // 모든 시즌에서 실패한 경우 - 기본 데이터 반환
    console.warn(`선수 ID ${id}의 데이터를 찾을 수 없어 기본 데이터 반환`);
    return {
      info: {
        id: parseInt(id),
        name: `선수 ${id}`,
        firstname: '알수없음',
        lastname: '',
        age: 0,
        birth: {
          date: '알수없음',
          place: '알수없음',
          country: '알수없음'
        },
        nationality: '알수없음',
        height: '알수없음',
        weight: '알수없음',
        injured: false,
        photo: ''
      },
      statistics: []
    };
  } catch (error) {
    console.error('선수 데이터 가져오기 오류:', error);
    // 에러 발생 시에도 기본 데이터 반환
    return {
      info: {
        id: parseInt(id),
        name: `선수 ${id}`,
        firstname: '알수없음',
        lastname: '',
        age: 0,
        birth: {
          date: '알수없음',
          place: '알수없음',
          country: '알수없음'
        },
        nationality: '알수없음',
        height: '알수없음',
        weight: '알수없음',
        injured: false,
        photo: ''
      },
      statistics: []
    };
  }
}

/**
 * API 응답을 내부 타입으로 변환
 */
function formatPlayerData(player: ApiPlayerResponse, season: number): PlayerData {
  return {
    info: {
      id: player.player?.id || 0,
      name: player.player?.name || '',
      firstname: player.player?.firstname || '',
      lastname: player.player?.lastname || '',
      age: player.player?.age || 0,
      birth: {
        date: player.player?.birth?.date || '',
        place: player.player?.birth?.place || '',
        country: player.player?.birth?.country || '',
      },
      nationality: player.player?.nationality || '',
      height: player.player?.height || '',
      weight: player.player?.weight || '',
      injured: player.player?.injured || false,
      photo: player.player?.photo || '',
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
        won: stat.penalty?.won || 0,
        commited: stat.penalty?.committed || 0,
        scored: stat.penalty?.scored || 0,
        missed: stat.penalty?.missed || 0,
        saved: stat.penalty?.saved || 0
      }
    })) || []
  };
}

// 캐싱 적용 함수
export const fetchCachedPlayerData = cache(fetchPlayerData); 