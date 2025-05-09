'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  fetchCachedPlayerStats, 
  PlayerStatsResponse, 
  PlayerStats, 
  PlayerStatistics, 
  Player
} from '@/domains/livescore/actions/match/playerStats';

// 세션 스토리지 사용을 위한 헬퍼 함수
const getFromSessionStorage = (key: string) => {
  if (typeof window === 'undefined') return null;
  try {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('세션 스토리지에서 데이터 가져오기 실패:', error);
    return null;
  }
};

const saveToSessionStorage = (key: string, data: PlayerStatsResponse) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('세션 스토리지에 데이터 저장 실패:', error);
  }
};

// 메모리 캐시 (전역 수준에서 선수 통계 캐싱)
const playerStatsCache = new Map<string, PlayerStatsResponse>();

// preloadedStats를 세션 스토리지에 미리 저장하는 함수
export function preloadPlayerStatsToSessionStorage(
  matchId: string, 
  playersStatsData?: Record<number, { response: PlayerStats[] }>
) {
  if (typeof window === 'undefined' || !playersStatsData) return;
  
  // 미리 가져온 선수 데이터를 세션 스토리지에 저장
  Object.entries(playersStatsData).forEach(([playerId, data]) => {
    if (data.response && data.response.length > 0) {
      const cacheKey = `player-stats-${matchId}-${playerId}`;
      const statsData = {
        success: true,
        response: data.response[0],
        message: '선수 통계 데이터 로드 성공'
      } as PlayerStatsResponse;
      
      // 세션 스토리지에 저장
      saveToSessionStorage(cacheKey, statsData);
      
      // 메모리 캐시에도 저장
      playerStatsCache.set(cacheKey, statsData);
    }
  });
}

export interface UsePlayerStatsResult {
  playerStats: PlayerStatsResponse | null;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
  playerStatsData: {
    stats: PlayerStatistics;
    playerData: Player;
  } | null;
}

export function usePlayerStats(
  isOpen: boolean,
  playerId: number,
  matchId: string,
  preloadedStats?: { response: PlayerStats[] }
): UsePlayerStatsResult {
  const [playerStats, setPlayerStats] = useState<PlayerStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 플레이어 스탯 데이터 메모이제이션 로직
  const playerStatsData = playerStats?.response
    ? {
        stats: playerStats.response.statistics[0] || {} as PlayerStatistics,
        playerData: playerStats.response.player || {} as Player,
      }
    : null;

  // 데이터 로드 함수 - useCallback으로 감싸서 의존성 배열에 포함시킬 수 있게 함
  const loadPlayerStats = useCallback(async () => {
    // 캐시용 키 생성 - 매치 ID와 선수 ID 조합
    const cacheKey = `player-stats-${matchId}-${playerId}`;
    
    // 메모리 캐시에서 데이터 확인
    if (playerStatsCache.has(cacheKey)) {
      const cachedData = playerStatsCache.get(cacheKey);
      setPlayerStats(cachedData || null);
      return;
    }
    
    // 세션 스토리지에서 데이터 확인
    const sessionData = getFromSessionStorage(cacheKey);
    if (sessionData) {
      setPlayerStats(sessionData);
      // 메모리 캐시에도 저장
      playerStatsCache.set(cacheKey, sessionData);
      return;
    }
    
    // 미리 가져온 데이터가 있으면 바로 사용
    if (preloadedStats?.response && preloadedStats.response.length > 0) {
      const statsData = {
        success: true,
        response: preloadedStats.response[0],
        message: '선수 통계 데이터 로드 성공'
      } as PlayerStatsResponse;
      
      setPlayerStats(statsData);
      // 캐시에 저장
      playerStatsCache.set(cacheKey, statsData);
      saveToSessionStorage(cacheKey, statsData);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 서버에서 데이터 가져오기
      const data = await fetchCachedPlayerStats(matchId, playerId);
      
      // 성공 여부와 관계없이 데이터 설정 (실패 시에도 모달 표시를 위해)
      setPlayerStats(data);
      
      // 데이터를 캐시에 저장 (실패한 응답도 저장)
      playerStatsCache.set(cacheKey, data);
      
      // 세션 스토리지에도 저장
      if (data.success && data.response) {
        saveToSessionStorage(cacheKey, data);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      setError(`통계 로드 중 오류: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [matchId, playerId, preloadedStats]);

  // 재시도 함수
  const retry = useCallback(() => {
    setError(null);
    // 캐시 삭제
    const cacheKey = `player-stats-${matchId}-${playerId}`;
    playerStatsCache.delete(cacheKey);
    // 세션 스토리지에서도 삭제
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(cacheKey);
    }
    loadPlayerStats();
  }, [matchId, playerId, loadPlayerStats]);

  // 컴포넌트가 마운트되거나 isOpen, playerId, matchId, preloadedStats가 변경될 때만 데이터 가져오기
  useEffect(() => {
    // 모달이 닫혀있거나 플레이어 ID나 매치 ID가 없으면 로드하지 않음
    if (!isOpen || !playerId || !matchId) return;
    
    // 데이터 로드
    loadPlayerStats();
  }, [isOpen, playerId, matchId, preloadedStats, loadPlayerStats]); // loadPlayerStats 의존성 추가

  // 모달이 닫힐 때 처리
  useEffect(() => {
    if (!isOpen) {
      setIsLoading(false);
      setError(null);
    }
  }, [isOpen]);

  return {
    playerStats,
    isLoading,
    error,
    retry,
    playerStatsData
  };
} 