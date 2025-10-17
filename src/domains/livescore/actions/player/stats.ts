'use server';

import { cache } from 'react';
import { PlayerStatistic } from '@/domains/livescore/types/player';

/**
 * API 응답 통계 데이터 타입 정의
 */
interface ApiStatisticResponse {
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
    accuracy?: string;
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
}

/**
 * 선수의 시즌 데이터 가져오기
 * @param playerId 선수 ID
 * @returns 선수가 참여한 시즌 목록
 */
export async function fetchPlayerSeasons(playerId: number): Promise<number[]> {
  try {
    if (!playerId) {
      return [];
    }

    // API 호출
    const response = await fetch(
      `https://v3.football.api-sports.io/players/seasons?player=${playerId}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'force-cache'
      }
    );

    if (!response.ok) {
      throw new Error(`API 응답 오류: ${response.status}`);
    }

    const data = await response.json();

    // 데이터 존재 확인
    if (!data?.response || !Array.isArray(data.response)) {
      return [];
    }

    // 시즌 데이터 내림차순 정렬 (최신 시즌이 앞에 오도록)
    return data.response.sort((a: number, b: number) => b - a);
  } catch {
    return [];
  }
}

/**
 * 리그 우선순위 정의 (숫자가 작을수록 우선순위가 높음)
 */
function getLeaguePriority(leagueId: number): number {
  // 메이저 리그 (Top 5)
  const majorLeagues = [39, 140, 78, 135, 61]; // 프리미어, 라리가, 분데스, 세리에A, 리그1
  if (majorLeagues.includes(leagueId)) return 1;

  // 2군 유럽 리그
  const secondTierLeagues = [40, 179, 88, 94, 119]; // 챔피언십, 스코틀랜드, 에레디비지에, 프리메이라, 슈퍼리가
  if (secondTierLeagues.includes(leagueId)) return 2;

  // 주요 아시아/아메리카 리그
  const otherMajorLeagues = [292, 98, 253, 307, 71, 262, 169]; // K리그, J리그, MLS, 사우디, 브라질, 리가MX, 중국
  if (otherMajorLeagues.includes(leagueId)) return 3;

  // 유럽 컵 대회
  const europeanCups = [2, 3, 848]; // 챔스, 유로파, 컨퍼런스
  if (europeanCups.includes(leagueId)) return 4;

  // 기타 컵 대회 (최하위 우선순위)
  return 5;
}

/**
 * 선수 통계 데이터 가져오기
 * @param playerId 선수 ID
 * @param season 시즌
 * @returns 선수 통계 데이터
 */
export async function fetchPlayerStats(playerId: number, season: number): Promise<PlayerStatistic[]> {
  try {
    if (!playerId || !season) {
      throw new Error('선수 ID와 시즌이 필요합니다.');
    }

    // API 호출
    const response = await fetch(
      `https://v3.football.api-sports.io/players?id=${playerId}&season=${season}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error(`API 응답 오류: ${response.status}`);
    }

    const data = await response.json();

    // 데이터 존재 확인
    if (!data?.response?.[0]?.statistics) {
      return [];
    }

    // API 응답 포맷에 맞게 데이터 변환
    const stats = data.response[0].statistics.map((stat: ApiStatisticResponse) => ({
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
        season: stat.league?.season || season,
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
        total: stat.shots?.total,
        on: stat.shots?.on,
      },
      goals: {
        total: stat.goals?.total,
        conceded: stat.goals?.conceded,
        assists: stat.goals?.assists,
        saves: stat.goals?.saves,
        cleansheets: stat.goals?.cleansheets
      },
      passes: {
        total: stat.passes?.total,
        key: stat.passes?.key,
        accuracy: stat.passes?.accuracy,
        cross: 0
      },
      tackles: {
        total: stat.tackles?.total,
        blocks: stat.tackles?.blocks,
        interceptions: stat.tackles?.interceptions,
        clearances: 0
      },
      duels: {
        total: stat.duels?.total,
        won: stat.duels?.won,
      },
      dribbles: {
        attempts: stat.dribbles?.attempts,
        success: stat.dribbles?.success,
        past: stat.dribbles?.past,
      },
      fouls: {
        drawn: stat.fouls?.drawn,
        committed: stat.fouls?.committed,
      },
      cards: {
        yellow: stat.cards?.yellow || 0,
        yellowred: stat.cards?.yellowred || 0,
        red: stat.cards?.red || 0,
      },
      penalty: {
        won: stat.penalty?.won,
        commited: stat.penalty?.commited,
        scored: stat.penalty?.scored,
        missed: stat.penalty?.missed,
        saved: stat.penalty?.saved,
      },
    }));

    // 리그 우선순위로 정렬
    return stats.sort((a, b) => {
      const priorityA = getLeaguePriority(a.league.id);
      const priorityB = getLeaguePriority(b.league.id);

      // 우선순위가 다르면 우선순위로 정렬
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // 같은 우선순위면 출전 경기 수로 정렬 (많은 것이 우선)
      return (b.games.appearences || 0) - (a.games.appearences || 0);
    });
  } catch {
    return [];
  }
}

// 캐싱 적용 함수
export const fetchCachedPlayerStats = cache(fetchPlayerStats);
export const fetchCachedPlayerSeasons = cache(fetchPlayerSeasons); 