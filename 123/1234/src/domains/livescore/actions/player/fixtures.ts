'use server';

import { cache } from 'react';
import { FixtureData } from '@/domains/livescore/types/player';

// 픽스처 객체 타입 정의
interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    timestamp: number;
    status: {
      short: string;
      [key: string]: string | number | boolean;
    };
  };
  league: {
    id: number;
    name: string;
    logo: string;
    country?: string;
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
    home: number | null;
    away: number | null;
  };
  score: {
    [key: string]: { home: number | null; away: number | null };
  };
}

// 내부적으로 사용할 확장된 FixtureData 타입
interface FixtureWithStats extends Omit<FixtureData, 'statistics'> {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      [key: string]: string | number | boolean;
    };
    timestamp: number;
  };
  statistics: {
    games: { 
      minutes: number; 
      rating: number | null;
      position: string | null;
      number: number | null;
    };
    shots: { 
      total: number; 
      on: number;
    };
    goals: { 
      total: number; 
      assists: number;
      conceded: number;
      saves: number | null;
    };
    passes: {
      total: number;
      key: number;
      accuracy: string;
    };
    cards: { 
      yellow: number; 
      red: number;
    };
  };
}

/**
 * 피클스처 응답 인터페이스
 */
export interface FixturesResponse {
  data: FixtureData[];
  status?: string;
  message?: string;
  cached?: boolean;
  seasonUsed?: number;
}

// 메모리 캐시 (서버 재시작될 때까지 유지)
const fixturesCache = new Map<string, {
  timestamp: number; 
  data: FixtureData[];
}>();

// 캐시 유효 시간: 6시간 (단위: 밀리초)
const CACHE_TTL = 6 * 60 * 60 * 1000;

/**
 * 특정 선수의 경기 기록을 가져오는 서버 액션 (라우트와 유사한 방식)
 * @param playerId 선수 ID
 * @param season 시즌
 * @param limit 최대 가져올 경기 수 (기본값: 0, 모든 경기)
 * @returns 경기 기록 데이터
 */
export async function fetchPlayerFixtures(
  playerId: number, 
  limit: number = 0
): Promise<FixturesResponse> {
  try {
    if (!playerId) {
      throw new Error('선수 ID가 필요합니다');
    }

    // 현재 시즌 계산
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const currentSeason = month >= 6 ? year : year - 1;
    
    // 캐시 키 생성
    const cacheKey = `player_fixtures_${playerId}_${currentSeason}`;
    
    // 캐시 확인
    const cachedData = fixturesCache.get(cacheKey);
    const cacheTimestamp = Date.now();
    
    // 캐시된 데이터가 있고, 유효 기간이 지나지 않았으면 캐시 데이터 반환
    if (cachedData && (cacheTimestamp - cachedData.timestamp) < CACHE_TTL) {
      // 한도가 있으면 제한된 경기만 반환
      const limitedData = limit > 0 ? cachedData.data.slice(0, limit) : cachedData.data;
      
      return { 
        data: limitedData,
        status: 'success',
        message: '캐시된 경기 기록을 불러왔습니다',
        cached: true,
        seasonUsed: currentSeason
      };
    }

    // API 요청 시작
    // 1. 팀 ID를 가져오기 위해 선수 정보를 조회
    const playerResponse = await fetch(
      `https://v3.football.api-sports.io/players?id=${playerId}&season=${currentSeason}`,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'
      }
    );

    if (!playerResponse.ok) {
      throw new Error(`선수 정보 API 응답 오류: ${playerResponse.status}`);
    }

    const playerData = await playerResponse.json();
    
    // 현재 시즌에 데이터가 없고 2023 이후 시즌이면 이전 시즌 시도
    if (!playerData.response?.[0]?.statistics?.[0]?.team?.id && currentSeason >= 2023) {
      const prevSeason = currentSeason - 1;
      
      // 이전 시즌 데이터 다시 요청
      const prevSeasonResponse = await fetch(
        `https://v3.football.api-sports.io/players?id=${playerId}&season=${prevSeason}`,
        {
          headers: {
            'x-rapidapi-host': 'v3.football.api-sports.io',
            'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
          },
          cache: 'no-store'
        }
      );
      
      if (!prevSeasonResponse.ok) {
        throw new Error(`선수 정보 API 응답 오류: ${prevSeasonResponse.status}`);
      }
      
      const prevSeasonData = await prevSeasonResponse.json();
      
      // 이전 시즌에도 데이터가 없으면 빈 데이터 반환
      if (!prevSeasonData.response?.[0]?.statistics?.[0]?.team?.id) {
        return { 
          data: [] as FixtureData[],
          status: 'error',
          message: '선수의 팀 정보를 찾을 수 없습니다',
          seasonUsed: currentSeason
        };
      }
      
      // 이전 시즌 데이터로 계속 진행
      playerData.response = prevSeasonData.response;
    }
    
    // 여전히 선수 데이터가 없다면 빈 배열 반환
    if (!playerData.response?.[0]?.statistics?.[0]?.team?.id) {
      return { 
        data: [] as FixtureData[],
        status: 'error',
        message: '선수의 팀 정보를 찾을 수 없습니다',
        seasonUsed: currentSeason
      };
    }

    const teamId = playerData.response[0].statistics[0].team.id;

    // 2. 팀 ID로 경기 목록 조회 (완료 상태 필터링 없이 모든 경기 가져오기)
    const fixturesUrl = `https://v3.football.api-sports.io/fixtures?` +
      `team=${teamId}` +
      `&season=${currentSeason}` +
      `&from=${currentSeason}-07-01` +  // 시즌 시작일
      `&to=${Number(currentSeason) + 1}-06-30`;  // 시즌 종료일

    const fixturesResponse = await fetch(fixturesUrl, {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
      },
      cache: 'no-store'
    });

    if (!fixturesResponse.ok) {
      throw new Error(`경기 기록 API 응답 오류: ${fixturesResponse.status}`);
    }

    const fixturesData = await fixturesResponse.json();
    if (!fixturesData.response || fixturesData.response.length === 0) {
      // 빈 결과를 캐시에 저장 (중복 요청 방지)
      fixturesCache.set(cacheKey, { 
        timestamp: cacheTimestamp, 
        data: [] 
      });
      
      return { 
        data: [] as FixtureData[],
        status: 'success',
        message: `${currentSeason} 시즌에 대한 경기 기록을 찾을 수 없습니다`,
        seasonUsed: currentSeason
      };
    }

    // 3. 각 경기의 선수 통계 가져오기 (최적화: 병렬 처리 및 청크 단위 처리)
    // 병렬 요청을 위한 청크 크기 설정
    const chunkSize = 10;
    const fixturesWithStats: Array<FixtureWithStats | null> = [];
    
    // 경기를 청크로 나누어 처리 (API 요청 제한 고려)
    for (let i = 0; i < fixturesData.response.length; i += chunkSize) {
      const fixtureChunk = fixturesData.response.slice(i, i + chunkSize);
      
      // 청크 내 경기들을 병렬로 처리
      const chunkResults = await Promise.all(
        fixtureChunk.map(async (fixture: ApiFixture) => {
          const fixtureId = fixture.fixture.id;
          const fixtureStatsUrl = `https://v3.football.api-sports.io/fixtures/players?fixture=${fixtureId}`;
          
          try {
            const statsResponse = await fetch(fixtureStatsUrl, {
              headers: {
                'x-rapidapi-host': 'v3.football.api-sports.io',
                'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
              },
              cache: 'no-store'
            });

            if (!statsResponse.ok) {
              return null;
            }

            const statsData = await statsResponse.json();
            
            // 해당 선수의 통계 찾기
            let playerStats = null;
            if (statsData.response && statsData.response.length > 0) {
              for (const teamStats of statsData.response) {
                const playerData = teamStats.players.find((p: { player: { id: number } }) => p.player.id === playerId);
                if (playerData) {
                  playerStats = playerData.statistics[0];
                  break;
                }
              }
            }

            // 선수가 이 경기에 참여하지 않았다면 건너뛰기
            if (!playerStats) {
              return null;
            }

            // 기본 통계 데이터 구조
            const defaultStats = {
              games: { 
                minutes: 0, 
                rating: null,
                position: null,
                number: null 
              },
              shots: { 
                total: 0, 
                on: 0 
              },
              goals: { 
                total: 0, 
                assists: 0,
                conceded: 0,
                saves: null
              },
              passes: {
                total: 0,
                key: 0,
                accuracy: "0"
              },
              cards: { 
                yellow: 0, 
                red: 0 
              }
            };

            // 실제 통계 데이터와 기본값 병합
            const mergedStats = {
              ...defaultStats,
              ...playerStats,
              games: {
                ...defaultStats.games,
                ...(playerStats?.games || {})
              },
              shots: {
                ...defaultStats.shots,
                ...(playerStats?.shots || {})
              },
              goals: {
                ...defaultStats.goals,
                ...(playerStats?.goals || {})
              },
              passes: {
                ...defaultStats.passes,
                ...(playerStats?.passes || {})
              },
              cards: {
                ...defaultStats.cards,
                ...(playerStats?.cards || {})
              }
            };

            return {
              fixture: {
                id: fixture.fixture.id,
                date: fixture.fixture.date,
                status: fixture.fixture.status,
                timestamp: fixture.fixture.timestamp
              },
              league: {
                id: fixture.league.id,
                name: fixture.league.name,
                logo: fixture.league.logo,
                country: fixture.league.country || ''
              },
              teams: {
                home: {
                  id: fixture.teams.home.id,
                  name: fixture.teams.home.name,
                  logo: fixture.teams.home.logo
                },
                away: {
                  id: fixture.teams.away.id,
                  name: fixture.teams.away.name,
                  logo: fixture.teams.away.logo
                },
                playerTeamId: teamId
              },
              goals: {
                home: fixture.goals.home?.toString() || '0',
                away: fixture.goals.away?.toString() || '0'
              },
              statistics: mergedStats
            };
          } catch {
            return null;
          }
        })
      );
      
      // 청크 결과를 전체 결과에 추가
      fixturesWithStats.push(...chunkResults);
    }

    // 유효한 경기 데이터만 필터링 (null 값 제거 및 FT(Full Time) 상태인 경기만 포함)
    const validFixtures = fixturesWithStats
      .filter((fixture): fixture is FixtureWithStats => {
        return fixture !== null && 
          fixture.fixture && 
          fixture.fixture.status && 
          fixture.fixture.status.short === "FT" &&
          fixture.statistics && 
          fixture.statistics.games && 
          fixture.statistics.games.minutes > 0;
      })
      .sort((a, b) => 
        new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime()
      );

    // 캐시에 결과 저장
    fixturesCache.set(cacheKey, { 
      timestamp: cacheTimestamp, 
      data: validFixtures as unknown as FixtureData[] 
    });
    
    // 한도가 있으면 제한된 경기만 반환
    const limitedFixtures = limit > 0 ? validFixtures.slice(0, limit) : validFixtures;
    
    return { 
      data: limitedFixtures as unknown as FixtureData[],
      status: 'success',
      message: limitedFixtures.length > 0 ? '경기 기록을 찾았습니다' : `${currentSeason} 시즌에 대한 경기 기록을 찾을 수 없습니다`,
      cached: false,
      seasonUsed: currentSeason // 실제 사용된 시즌 정보 반환
    };

  } catch (error) {
    return { 
      data: [] as FixtureData[],
      status: 'error',
      message: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

/**
 * 캐싱을 적용한 선수 경기 기록 가져오기
 */
export const fetchCachedPlayerFixtures = cache(fetchPlayerFixtures); 