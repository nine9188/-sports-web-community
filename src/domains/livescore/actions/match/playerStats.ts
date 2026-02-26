'use server';

import { cache } from 'react';
import { getMatchCache, setMatchCache } from './matchCache';
import { getPlayerPhotoUrls, PLACEHOLDER_URLS } from '../images';
import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi';
import type {
  PlayerStatsData,
  AllPlayerStatsResponse,
  PlayerRatingsAndCaptains,
} from '../../types/lineup';

// 타입은 types/lineup.ts에서 직접 import하세요
// 'use server' 파일에서는 타입 re-export가 지원되지 않습니다

// 종료된 경기 상태 목록 (데이터 불변)
const FINISHED_STATUSES = ['FT', 'AET', 'PEN'];

/**
 * 전체 선수 통계 데이터 가져오기 (통합 함수)
 * - API 1회 호출로 모든 데이터 획득
 * - 종료된 경기는 DB 캐시 활용
 * - 평점, 주장 정보도 함께 추출
 */
async function fetchAllPlayerStatsInternal(
  matchId: string,
  matchStatus?: string
): Promise<AllPlayerStatsResponse> {
  try {
    if (!matchId) {
      return {
        success: false,
        allPlayersData: [],
        ratings: {},
        captainIds: [],
        message: '매치 ID가 필요합니다',
      };
    }

    const numericMatchId = parseInt(matchId, 10);
    const isFinished = matchStatus && FINISHED_STATUSES.includes(matchStatus);

    // ============================================
    // 종료된 경기: DB 캐시 확인
    // ============================================
    if (isFinished) {
      const cached = await getMatchCache(numericMatchId, 'matchPlayerStats');

      if (cached) {
        // 캐시 데이터 형식 확인 - AllPlayerStatsResponse 형식인지 또는 raw response 형식인지
        const cachedAny = cached as Record<string, unknown>;

        // 새 형식 (AllPlayerStatsResponse)
        if ('allPlayersData' in cachedAny && Array.isArray(cachedAny.allPlayersData)) {
          return cached as AllPlayerStatsResponse;
        }

        // 구 형식 (raw API response)
        const cachedData = cached as { response?: unknown[] };
        const responseArray = cachedData?.response;

        if (Array.isArray(responseArray) && responseArray.length > 0) {
          return await extractAllDataFromResponse(responseArray);
        }
      }
    }

    // ============================================
    // API 호출
    // ============================================
    const data = await fetchFromFootballApi('fixtures/players', { fixture: matchId });

    if (!data?.response?.length) {
      return {
        success: false,
        allPlayersData: [],
        ratings: {},
        captainIds: [],
        message: '경기 데이터를 찾을 수 없습니다',
      };
    }

    // ============================================
    // 종료된 경기: DB 캐시 저장
    // ============================================
    const result = await extractAllDataFromResponse(data.response);

    if (isFinished) {
      // 새 형식(AllPlayerStatsResponse)으로 저장
      setMatchCache(numericMatchId, 'matchPlayerStats', result).catch(() => {});
    }

    return result;
  } catch (error) {
    return {
      success: false,
      allPlayersData: [],
      ratings: {},
      captainIds: [],
      message: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

/**
 * API 응답에서 전체 데이터 추출 (선수 목록, 평점, 주장)
 * - 4590 표준: 선수 사진은 Storage URL 사용
 */
async function extractAllDataFromResponse(responseData: unknown[]): Promise<AllPlayerStatsResponse> {
  const rawPlayersData: Array<{
    playerId: number;
    name: string;
    stats: any;
    team: any;
    statistics: any[];
  }> = [];
  const ratings: Record<number, number> = {};
  const captainIds: number[] = [];

  // 1차: 데이터 수집 (동기)
  for (const teamStats of responseData) {
    const team = teamStats as { team?: { id: number; name: string; logo: string }; players?: unknown[] };
    if (!team?.players?.length) continue;

    for (const playerData of team.players) {
      const p = playerData as {
        player?: { id: number; name: string; photo?: string };
        statistics?: Array<{
          team?: { id: number; name: string; logo: string };
          games?: { rating?: string; captain?: boolean; number?: number; position?: string };
          [key: string]: unknown;
        }>;
      };

      if (!p?.player?.id) continue;

      const playerId = p.player.id;
      const stats = p.statistics?.[0];

      rawPlayersData.push({
        playerId,
        name: p.player.name,
        stats,
        team: team.team,
        statistics: p.statistics || [],
      });

      // 평점 추출
      const rating = stats?.games?.rating;
      if (rating) {
        const ratingValue = typeof rating === 'string' ? parseFloat(rating) : Number(rating);
        if (!isNaN(ratingValue) && ratingValue > 0) {
          ratings[playerId] = ratingValue;
        }
      }

      // 주장 여부
      if (stats?.games?.captain) {
        captainIds.push(playerId);
      }
    }
  }

  // 2차: 배치로 Storage URL 조회 (4590 표준)
  const playerIds = rawPlayersData.map(p => p.playerId);
  const playerPhotos = await getPlayerPhotoUrls(playerIds);

  // 3차: 최종 데이터 생성
  const allPlayersData: PlayerStatsData[] = rawPlayersData.map(({ playerId, name, stats, team, statistics }) => ({
    player: {
      id: playerId,
      name,
      photo: playerPhotos[playerId] || PLACEHOLDER_URLS.player_photo,
      number: stats?.games?.number,
      pos: stats?.games?.position,
    },
    statistics: statistics.map((stat: any) => ({
      team: stat?.team || team || { id: 0, name: '', logo: '' },
      games: stat?.games || {},
      offsides: (stat?.offsides as number) || 0,
      shots: (stat?.shots as { total?: number; on?: number }) || {},
      goals: (stat?.goals as { total?: number; conceded?: number; assists?: number; saves?: number }) || {},
      passes: (stat?.passes as { total?: number; key?: number; accuracy?: string }) || {},
      tackles: (stat?.tackles as { total?: number; blocks?: number; interceptions?: number }) || {},
      duels: (stat?.duels as { total?: number; won?: number }) || {},
      dribbles: (stat?.dribbles as { attempts?: number; success?: number; past?: number }) || {},
      fouls: (stat?.fouls as { drawn?: number; committed?: number }) || {},
      cards: (stat?.cards as { yellow?: number; red?: number }) || {},
      penalty: (stat?.penalty as { won?: number; committed?: number; scored?: number; missed?: number; saved?: number }) || {},
    })),
  }));

  return {
    success: true,
    allPlayersData,
    ratings,
    captainIds,
    message: '선수 통계 데이터를 성공적으로 가져왔습니다',
  };
}

/**
 * 전체 선수 데이터에서 특정 선수 찾기 (내부 헬퍼 함수)
 */
function getPlayerFromAllStats(
  allPlayersData: PlayerStatsData[],
  playerId: number
): PlayerStatsData | null {
  return allPlayersData.find((p) => p.player.id === playerId) || null;
}

// ============================================
// Export: 캐시 적용된 함수들
// ============================================

export const fetchAllPlayerStats = cache(fetchAllPlayerStatsInternal);

/**
 * 평점 + 주장 정보만 가져오기 (하위 호환)
 * 내부적으로 fetchAllPlayerStats 사용
 */
async function fetchPlayerRatingsAndCaptainsInternal(
  matchId: string,
  matchStatus?: string
): Promise<PlayerRatingsAndCaptains> {
  const result = await fetchAllPlayerStatsInternal(matchId, matchStatus);
  return {
    ratings: result.ratings,
    captainIds: result.captainIds,
  };
}

export const fetchPlayerRatingsAndCaptains = cache(fetchPlayerRatingsAndCaptainsInternal);

/**
 * 평점만 가져오기 (하위 호환)
 */
async function fetchPlayerRatingsInternal(
  matchId: string,
  matchStatus?: string
): Promise<Record<number, number>> {
  const result = await fetchAllPlayerStatsInternal(matchId, matchStatus);
  return result.ratings;
}

export const fetchPlayerRatings = cache(fetchPlayerRatingsInternal);

/**
 * 개별 선수 통계 가져오기 (하위 호환)
 * - 이미 전체 데이터가 있으면 필터링만 수행
 * - 없으면 fetchAllPlayerStats 호출
 */
export interface PlayerStatsResponse {
  success: boolean;
  response: PlayerStatsData | null;
  message: string;
}

async function fetchPlayerStatsInternal(
  matchId: string,
  playerId: number,
  matchStatus?: string
): Promise<PlayerStatsResponse> {
  const allData = await fetchAllPlayerStatsInternal(matchId, matchStatus);

  if (!allData.success) {
    return {
      success: false,
      response: null,
      message: allData.message || '데이터를 가져올 수 없습니다',
    };
  }

  const playerStats = getPlayerFromAllStats(allData.allPlayersData, playerId);

  if (!playerStats) {
    return {
      success: false,
      response: null,
      message: '해당 선수의 통계를 찾을 수 없습니다',
    };
  }

  return {
    success: true,
    response: playerStats,
    message: '선수 통계 데이터를 성공적으로 가져왔습니다',
  };
}

export const fetchCachedPlayerStats = cache(fetchPlayerStatsInternal);
