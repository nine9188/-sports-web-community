'use server';

import { cache } from 'react';

// 선수 정보 및 통계 타입 정의
export interface Player {
  id: number;
  name: string;
  photo: string;
  number?: number;
  pos?: string;
}

export interface Team {
  id: number;
  name: string;
  logo: string;
  update?: string;
}

export interface PlayerGames {
  minutes?: number;
  number?: number;
  position?: string;
  rating?: string;
  captain?: boolean;
  substitute?: boolean;
}

export interface PlayerShots {
  total?: number;
  on?: number;
}

export interface PlayerGoals {
  total?: number;
  conceded?: number;
  assists?: number;
  saves?: number;
}

export interface PlayerPasses {
  total?: number;
  key?: number;
  accuracy?: string;
}

export interface PlayerTackles {
  total?: number;
  blocks?: number;
  interceptions?: number;
}

export interface PlayerDuels {
  total?: number;
  won?: number;
}

export interface PlayerDribbles {
  attempts?: number;
  success?: number;
  past?: number;
}

export interface PlayerFouls {
  drawn?: number;
  committed?: number;
}

export interface PlayerCards {
  yellow?: number;
  red?: number;
}

export interface PlayerPenalty {
  won?: number;
  committed?: number;
  scored?: number;
  missed?: number;
  saved?: number;
}

export interface PlayerStatistics {
  team: Team;
  games: PlayerGames;
  offsides?: number;
  shots: PlayerShots;
  goals: PlayerGoals;
  passes: PlayerPasses;
  tackles: PlayerTackles;
  duels: PlayerDuels;
  dribbles: PlayerDribbles;
  fouls: PlayerFouls;
  cards: PlayerCards;
  penalty: PlayerPenalty;
}

export interface PlayerStats {
  player: Player;
  statistics: PlayerStatistics[];
}

export interface PlayerStatsResponse {
  success: boolean;
  response: PlayerStats | null;
  message: string;
}

export interface MultiplePlayerStatsResponse {
  [key: number]: {
    response: PlayerStats[];
  };
}

/**
 * 특정 경기의 특정 선수 통계 정보를 가져오는 서버 액션
 * @param matchId 경기 ID
 * @param playerId 선수 ID
 * @returns 선수 통계 정보
 */
export async function fetchPlayerStats(matchId: string, playerId: number): Promise<PlayerStatsResponse> {
  try {
    if (!matchId || !playerId) {
      throw new Error('매치 ID와 선수 ID가 필요합니다');
    }

    // API 키 확인
    if (!process.env.FOOTBALL_API_KEY) {
      console.error('API 키가 설정되지 않았습니다');
      return { 
        success: false,
        response: null,
        message: 'API 키가 설정되지 않았습니다'
      };
    }

    // API 요청 URL 구성
    const requestUrl = `https://v3.football.api-sports.io/fixtures/players?fixture=${matchId}&player=${playerId}`;
    // console.log(`선수 통계 요청: ${requestUrl}, 선수 ID: ${playerId}`);

    // API 요청 - API-Sports 직접 호출
    try {
      const response = await fetch(
        requestUrl,
        {
          headers: {
            'x-rapidapi-host': 'v3.football.api-sports.io',
            'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
          },
          cache: 'no-store'
        }
      );

      // console.log(`API 응답 상태 코드: ${response.status}, 선수 ID: ${playerId}`);

      if (!response.ok) {
        const errorText = await response.text();
        // console.error(`API 오류 응답 (선수 ID: ${playerId}): ${errorText}`);
        throw new Error(`API 응답 오류: ${response.status}, ${errorText}`);
      }

      const data = await response.json();
      
      // console.log(`API 응답 데이터: 선수 ID: ${playerId}, 데이터 존재: ${!!data}, 응답 배열 길이: ${data?.response?.length || 0}, errors: ${JSON.stringify(data?.errors || {})}`);
      
      if (!data?.response || data.response.length === 0) {
        // console.log(`선수 ID ${playerId}에 대한 통계 데이터가 없습니다.`);
        return { 
          success: false,
          response: null,
          message: '선수 통계 데이터를 찾을 수 없습니다'
        };
      }
    
      // 결과 변환
      const teamData = data.response[0];
      if (!teamData || !teamData.players) {
        // console.error('팀 데이터 없음 또는 선수 목록 없음', teamData);
        return { 
          success: false,
          response: null,
          message: '팀 데이터를 찾을 수 없습니다'
        };
      }
      
      const playerData = teamData.players.find((p: { player: { id: number } }) => p.player?.id === playerId);
      
      if (!playerData) {
        // console.error(`해당 선수(ID: ${playerId})의 데이터를 찾을 수 없음`);
        return { 
          success: false,
          response: null,
          message: '해당 선수의 통계를 찾을 수 없습니다'
        };
      }
      
      // console.log(`선수 데이터 파싱 중: ${playerData.player?.name || '이름 없음'}`);
      
      // 이미지 URL 확인 및 처리 - 유틸리티 함수 사용
      if (playerData.player && playerData.player.id) {
        // 캐시된 URL을 가져오는 것보다 컴포넌트에서 처리하도록 변경
        playerData.player.photo = `https://media.api-sports.io/football/players/${playerData.player.id}.png`;
      }
      
      // 팀 로고 URL 확인 및 처리 - 유틸리티 함수 사용  
      if (teamData.team && teamData.team.id) {
        // 캐시된 URL을 가져오는 것보다 컴포넌트에서 처리하도록 변경
        teamData.team.logo = `https://media.api-sports.io/football/teams/${teamData.team.id}.png`;
      }
      
      // 선수 통계 유효성 확인
      if (!playerData.statistics || !playerData.statistics[0]) {
        console.error('선수 통계 데이터 없음', playerData);
        return {
          success: false,
          response: null,
          message: '선수 통계 데이터 형식이 올바르지 않습니다'
        };
      }
      
      // 응답 데이터 구성
      const formattedPlayerStats: PlayerStats = {
        player: {
          id: playerData.player.id,
          name: playerData.player.name,
          photo: playerData.player.photo,
          number: playerData.statistics[0].games?.number,
          pos: playerData.statistics[0].games?.position
        },
        statistics: [{
          team: {
            id: teamData.team.id,
            name: teamData.team.name,
            logo: teamData.team.logo,
            update: teamData.team.update
          },
          games: {
            minutes: playerData.statistics[0].games?.minutes || 0,
            number: playerData.statistics[0].games?.number,
            position: playerData.statistics[0].games?.position,
            rating: playerData.statistics[0].games?.rating || '-',
            captain: playerData.statistics[0].games?.captain || false,
            substitute: playerData.statistics[0].games?.substitute || false
          },
          offsides: playerData.statistics[0].offsides,
          shots: {
            total: playerData.statistics[0].shots?.total || 0,
            on: playerData.statistics[0].shots?.on || 0
          },
          goals: {
            total: playerData.statistics[0].goals?.total || 0,
            conceded: playerData.statistics[0].goals?.conceded,
            assists: playerData.statistics[0].goals?.assists || 0,
            saves: playerData.statistics[0].goals?.saves
          },
          passes: {
            total: playerData.statistics[0].passes?.total || 0,
            key: playerData.statistics[0].passes?.key || 0,
            accuracy: playerData.statistics[0].passes?.accuracy || '0'
          },
          tackles: {
            total: playerData.statistics[0].tackles?.total || 0,
            blocks: playerData.statistics[0].tackles?.blocks || 0,
            interceptions: playerData.statistics[0].tackles?.interceptions || 0
          },
          duels: {
            total: playerData.statistics[0].duels?.total || 0,
            won: playerData.statistics[0].duels?.won || 0
          },
          dribbles: {
            attempts: playerData.statistics[0].dribbles?.attempts || 0,
            success: playerData.statistics[0].dribbles?.success || 0,
            past: playerData.statistics[0].dribbles?.past
          },
          fouls: {
            drawn: playerData.statistics[0].fouls?.drawn || 0,
            committed: playerData.statistics[0].fouls?.committed || 0
          },
          cards: {
            yellow: playerData.statistics[0].cards?.yellow || 0,
            red: playerData.statistics[0].cards?.red || 0
          },
          penalty: {
            won: playerData.statistics[0].penalty?.won || 0,
            committed: playerData.statistics[0].penalty?.committed || 0,
            scored: playerData.statistics[0].penalty?.scored || 0,
            missed: playerData.statistics[0].penalty?.missed || 0,
            saved: playerData.statistics[0].penalty?.saved || 0
          }
        }]
      };
      
      // console.log('선수 통계 데이터 파싱 완료');
      return { 
        success: true,
        response: formattedPlayerStats,
        message: '선수 통계 데이터를 성공적으로 가져왔습니다'
      };

    } catch (error) {
      // console.error(`선수 통계 요청 중 오류 (선수 ID: ${playerId}):`, error);
      return { 
        success: false,
        response: null,
        message: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }

  } catch (error) {
    // console.error('선수 통계 가져오기 오류:', error);
    return { 
      success: false,
      response: null,
      message: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

/**
 * 여러 선수의 통계를 한 번에 가져오는 서버 액션
 * @param matchId 경기 ID
 * @param playerIds 선수 ID 배열
 * @returns 여러 선수의 통계 정보
 */
export async function fetchMultiplePlayerStats(matchId: string, playerIds: number[]): Promise<MultiplePlayerStatsResponse> {
  try {
    if (!matchId || !playerIds.length) {
      throw new Error('매치 ID와 최소 하나 이상의 선수 ID가 필요합니다');
    }

    // API 키 확인
    if (!process.env.FOOTBALL_API_KEY) {
      // console.error('API 키가 설정되지 않았습니다');
      return {};
    }

    // API 요청 URL 구성
    const requestUrl = `https://v3.football.api-sports.io/fixtures/players?fixture=${matchId}`;
    // console.log(`다중 선수 통계 요청: ${requestUrl}, 요청 선수 ID: ${playerIds.join(', ')}`);

    // API 요청
    const response = await fetch(
      requestUrl,
      {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY || '',
        },
        cache: 'no-store'
      }
    );

    // console.log(`API 응답 상태 코드: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      // console.error(`API 오류 응답: ${errorText}`);
      throw new Error(`API 응답 오류: ${response.status}, ${errorText}`);
    }

    const data = await response.json();
    // console.log(`API 응답 데이터 있음: ${!!data}, 응답 배열 길이: ${data?.response?.length || 0}`);
    
    if (!data?.response || data.response.length === 0) {
      return {};
    }
    
    // 결과를 저장할 객체
    const playersStatsMap: MultiplePlayerStatsResponse = {};
    
    // 모든 팀의 선수 데이터를 순회하며 요청된 선수 통계 찾기
    for (const teamStats of data.response) {
      if (!teamStats?.players || !Array.isArray(teamStats.players)) {
        // console.warn('팀에 선수 데이터가 없음', teamStats?.team?.name || '알 수 없는 팀');
        continue;
      }
      
      for (const player of teamStats.players) {
        // 유효한 선수 데이터인지 확인
        if (!player?.player?.id) {
          // console.warn('유효하지 않은 선수 데이터 건너뜀');
          continue;
        }
        
        // 요청된 선수 ID 목록에 있는 선수만 처리
        if (playerIds.includes(player.player.id)) {
          // console.log(`선수 통계 처리 중: ${player.player.name || '이름 없음'} (ID: ${player.player.id})`);
          
          // 이미지 URL 확인 및 처리 - 컴포넌트에서 캐싱 처리
          if (player.player && player.player.id) {
            player.player.photo = `https://media.api-sports.io/football/players/${player.player.id}.png`;
          }
          
          // 팀 로고 URL 확인 및 처리 - 컴포넌트에서 캐싱 처리
          if (teamStats.team && teamStats.team.id) {
            teamStats.team.logo = `https://media.api-sports.io/football/teams/${teamStats.team.id}.png`;
          }
          
          // 통계 데이터 유효성 검사
          if (!player.statistics || !player.statistics[0]) {
            // console.warn(`선수 통계 데이터 없음: ${player.player.name || '이름 없음'}`);
            continue;
          }
          
          const playerStats: PlayerStats = {
            player: {
              id: player.player.id,
              name: player.player.name,
              photo: player.player.photo,
              number: player.statistics[0].games.number,
              pos: player.statistics[0].games.position
            },
            statistics: [{
              team: {
                id: teamStats.team.id,
                name: teamStats.team.name,
                logo: teamStats.team.logo,
                update: teamStats.team.update
              },
              games: {
                minutes: player.statistics[0].games.minutes || 0,
                number: player.statistics[0].games.number,
                position: player.statistics[0].games.position,
                rating: player.statistics[0].games.rating || '-',
                captain: player.statistics[0].games.captain || false,
                substitute: player.statistics[0].games.substitute || false
              },
              offsides: player.statistics[0].offsides,
              shots: {
                total: player.statistics[0].shots?.total || 0,
                on: player.statistics[0].shots?.on || 0
              },
              goals: {
                total: player.statistics[0].goals?.total || 0,
                conceded: player.statistics[0].goals?.conceded,
                assists: player.statistics[0].goals?.assists || 0,
                saves: player.statistics[0].goals?.saves
              },
              passes: {
                total: player.statistics[0].passes?.total || 0,
                key: player.statistics[0].passes?.key || 0,
                accuracy: player.statistics[0].passes?.accuracy || '0'
              },
              tackles: {
                total: player.statistics[0].tackles?.total || 0,
                blocks: player.statistics[0].tackles?.blocks || 0,
                interceptions: player.statistics[0].tackles?.interceptions || 0
              },
              duels: {
                total: player.statistics[0].duels?.total || 0,
                won: player.statistics[0].duels?.won || 0
              },
              dribbles: {
                attempts: player.statistics[0].dribbles?.attempts || 0,
                success: player.statistics[0].dribbles?.success || 0,
                past: player.statistics[0].dribbles?.past
              },
              fouls: {
                drawn: player.statistics[0].fouls?.drawn || 0,
                committed: player.statistics[0].fouls?.committed || 0
              },
              cards: {
                yellow: player.statistics[0].cards?.yellow || 0,
                red: player.statistics[0].cards?.red || 0
              },
              penalty: {
                won: player.statistics[0].penalty?.won || 0,
                committed: player.statistics[0].penalty?.committed || 0,
                scored: player.statistics[0].penalty?.scored || 0,
                missed: player.statistics[0].penalty?.missed || 0,
                saved: player.statistics[0].penalty?.saved || 0
              }
            }]
          };
          
          // 선수 ID를 키로 사용하여 결과 객체에 저장
          playersStatsMap[player.player.id] = {
            response: [playerStats]
          };
        }
      }
    }
    
    return playersStatsMap;

  } catch {
    return {};
  }
}

// 캐싱 적용 함수들
// 커스텀 TTL 캐시 (빈 결과는 짧게, 유효 데이터는 길게)
const singleStatsCache = new Map<string, { ts: number; data: PlayerStatsResponse }>();
const multiStatsCache = new Map<string, { ts: number; data: MultiplePlayerStatsResponse }>();

const TTL_VALID_MS = 2 * 60 * 1000; // 유효 데이터 2분
const TTL_EMPTY_MS = 20 * 1000; // 빈 데이터 20초 (짧게)

function isExpired(ts: number, hasData: boolean): boolean {
  const ttl = hasData ? TTL_VALID_MS : TTL_EMPTY_MS;
  return Date.now() - ts > ttl;
}

export async function fetchCachedPlayerStats(matchId: string, playerId: number): Promise<PlayerStatsResponse> {
  const key = `${matchId}:${playerId}`;
  const cached = singleStatsCache.get(key);
  if (cached && !isExpired(cached.ts, !!cached.data?.response)) {
    return cached.data;
  }
  const fresh = await fetchPlayerStats(matchId, playerId);
  singleStatsCache.set(key, { ts: Date.now(), data: fresh });
  return fresh;
}

export async function fetchCachedMultiplePlayerStats(matchId: string, playerIds: number[]): Promise<MultiplePlayerStatsResponse> {
  const sortedIds = [...playerIds].sort((a, b) => a - b);
  const key = `${matchId}:${sortedIds.join(',')}`;
  const cached = multiStatsCache.get(key);
  const hasData = cached ? Object.keys(cached.data || {}).length > 0 : false;
  if (cached && !isExpired(cached.ts, hasData)) {
    return cached.data;
  }
  const fresh = await fetchMultiplePlayerStats(matchId, sortedIds);
  const hasFresh = Object.keys(fresh || {}).length > 0;
  multiStatsCache.set(key, { ts: Date.now(), data: fresh });
  return fresh;
}