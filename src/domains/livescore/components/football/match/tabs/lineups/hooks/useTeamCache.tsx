'use client';

import { useState, useEffect } from 'react';
import { getTeamById } from '@/domains/livescore/constants/teams';

// TeamMapping 타입 정의
interface TeamMapping {
  id: number;
  name_ko?: string;
  name_en?: string;
  name?: string;
  logo?: string;
}

/**
 * 팀 정보를 캐시하고 관리하는 훅
 */
export default function useTeamCache(
  homeTeam?: { id: number; name: string; logo: string },
  awayTeam?: { id: number; name: string; logo: string }
) {
  const [teamCache, setTeamCache] = useState<Record<number, TeamMapping>>({});
  
  // 팀 정보 캐싱을 위한 hook
  useEffect(() => {    
    // 홈팀과 원정팀 ID를 확인
    const teamIds = new Set<number>();
    if (homeTeam?.id) teamIds.add(homeTeam.id);
    if (awayTeam?.id) teamIds.add(awayTeam.id);

    // 아직 캐시에 없는 팀 정보 추가
    const newTeamCache = { ...teamCache };
    let cacheUpdated = false;

    teamIds.forEach(teamId => {
      if (!newTeamCache[teamId]) {
        const teamInfo = getTeamById(teamId);
        if (teamInfo) {
          newTeamCache[teamId] = teamInfo;
          cacheUpdated = true;
        }
      }
    });

    // 캐시가 업데이트되었을 때만 상태 업데이트
    if (cacheUpdated) {
      setTeamCache(newTeamCache);
    }
  }, [homeTeam?.id, awayTeam?.id, teamCache]);
  
  /**
   * 팀 이름 표시를 위한 함수
   */
  const getTeamDisplayName = (id: number, fallbackName: string): string => {
    const cachedTeam = teamCache[id];
    return cachedTeam?.name_ko || fallbackName;
  };

  /**
   * 팀 로고 URL을 가져오는 함수
   */
  const getTeamLogoUrl = (id: number, fallbackLogo: string): string => {
    const cachedTeam = teamCache[id];
    return cachedTeam?.logo || fallbackLogo;
  };

  return {
    teamCache,
    getTeamDisplayName,
    getTeamLogoUrl
  };
} 