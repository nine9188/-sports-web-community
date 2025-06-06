'use client';

import { useState, useEffect, useRef } from 'react';
import { PlayerStats, fetchCachedMultiplePlayerStats } from '@/domains/livescore/actions/match/playerStats';
import { TeamLineup } from '@/domains/livescore/types/match';

/**
 * 라인업 데이터에서 선수 ID를 추출하는 함수
 */
function extractPlayerIds(homeLineup: TeamLineup | null, awayLineup: TeamLineup | null): number[] {
  const playerIds: number[] = [];
  
  // 홈팀 선수 ID 추출
  if (homeLineup) {
    // 출전 선수들
    if (homeLineup.startXI) {
      homeLineup.startXI.forEach(player => {
        if (player.player?.id) {
          playerIds.push(player.player.id);
        }
      });
    }
    
    // 교체 선수들
    if (homeLineup.substitutes) {
      homeLineup.substitutes.forEach(player => {
        if (player.player?.id) {
          playerIds.push(player.player.id);
        }
      });
    }
  }
  
  // 원정팀 선수 ID 추출
  if (awayLineup) {
    // 출전 선수들
    if (awayLineup.startXI) {
      awayLineup.startXI.forEach(player => {
        if (player.player?.id) {
          playerIds.push(player.player.id);
        }
      });
    }
    
    // 교체 선수들
    if (awayLineup.substitutes) {
      awayLineup.substitutes.forEach(player => {
        if (player.player?.id) {
          playerIds.push(player.player.id);
        }
      });
    }
  }
  
  return playerIds;
}

/**
 * 선수 통계 데이터를 로드하는 훅
 */
export default function usePlayerStats(
  matchId: string,
  lineups: { home: TeamLineup; away: TeamLineup } | null,
  initialStats?: Record<number, { response: PlayerStats[] }>
) {
  const [playersStatsData, setPlayersStatsData] = useState<Record<number, { response: PlayerStats[] }>>(
    initialStats || {}
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 로딩 상태를 추적하기 위한 ref
  const loadingRef = useRef(false);
  const loadedMatchRef = useRef<string>('');

  // 선수 통계 데이터 로드
  useEffect(() => {
    const loadPlayersStats = async () => {
      // 라인업이나 매치 ID가 없으면 스킵
      if (!lineups || !matchId) return;
      
      // 이미 로딩 중이거나 같은 매치 데이터를 로드했으면 스킵
      if (loadingRef.current || loadedMatchRef.current === matchId) return;
      
      // 선수 ID 추출
      const playerIds = extractPlayerIds(lineups.home, lineups.away);
      if (playerIds.length === 0) return;
      
      // 캐시 키 생성 (경기 ID 기반)
      const cacheKey = `match-${matchId}-players-stats`;
      
      // 세션 스토리지에서 캐시된 데이터 확인
      try {
        const cachedData = sessionStorage.getItem(cacheKey);
        
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          setPlayersStatsData(parsedData);
          loadedMatchRef.current = matchId;
          return;
        }
      } catch (error) {
        // 캐시 파싱 오류 무시하고 계속 진행
        console.error('캐시 데이터 파싱 오류:', error);
      }
      
      loadingRef.current = true;
      setIsLoading(true);
      setError(null);
      
      try {
        const stats = await fetchCachedMultiplePlayerStats(matchId, playerIds);
        
        setPlayersStatsData(stats);
        loadedMatchRef.current = matchId;
        
        // 세션 스토리지에 데이터 캐싱
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(stats));
        } catch (err) {
          // 스토리지 용량 초과 등의 오류 무시
          console.error('세션 스토리지 캐싱 오류:', err);
        }
      } catch (error) {
        // 오류 시 처리
        setError('선수 통계 로드 중 오류가 발생했습니다.');
        console.error('선수 통계 로드 오류:', error);
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
      }
    };
    
    loadPlayersStats();
  }, [matchId, lineups]); // playersStatsData 제거

  return {
    playersStatsData,
    isLoading,
    error
  };
} 