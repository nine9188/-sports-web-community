'use server';

import { cache } from 'react';
import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi';
import { getCurrentSeasonForLeague } from '@/domains/livescore/actions/teamLeagueData';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { resolveCurrentTeamMainLeague } from './currentLeague';

// 선수 통계 인터페이스
export interface PlayerStats {
  appearances: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

interface PlayerStatsResponse {
  success: boolean;
  data?: Record<number, PlayerStats>;
  message: string;
}

// API 응답 타입 정의
interface ApiPlayerData {
  player: {
    id: number;
    name: string;
  };
  statistics: Array<{
    games?: {
      appearances?: number;
      // API가 철자가 틀린 필드를 반환할 수도 있으므로 인덱스 시그니처 추가
      [key: string]: number | undefined;
    };
    goals?: {
      total?: number;
      assists?: number;
    };
    cards?: {
      yellow?: number;
      red?: number;
    };
  }>;
}

/**
 * 팀의 선수 통계 정보를 가져오는 서버 액션
 * @param teamId 팀 ID
 * @param league 리그 ID (없으면 팀의 주 리그를 자동으로 찾음)
 * @returns 선수별 통계 정보
 */
export async function fetchTeamPlayerStats(teamId: string, league?: string): Promise<PlayerStatsResponse> {
  try {
    if (!teamId) {
      throw new Error('팀 ID는 필수입니다');
    }

    let leagueId = league;
    let currentSeason: number | null = null;

    if (!leagueId) {
      const currentMainLeague = await resolveCurrentTeamMainLeague(teamId);
      if (currentMainLeague) {
        leagueId = String(currentMainLeague.leagueId);
        currentSeason = currentMainLeague.season;
      }
    }

    if (!leagueId) {
      try {
        const supabase = await getSupabaseServer();
        const { data: teamRow } = await supabase
          .from('football_teams')
          .select('league_id')
          .eq('team_id', Number(teamId))
          .single();
        if (teamRow?.league_id) {
          leagueId = String(teamRow.league_id);
        }
      } catch {
        // DB 조회 실패 시 API로 fallback
      }
    }

    // 리그에 맞는 시즌 계산 (K리그 등 캘린더 시즌 리그 대응)
    currentSeason = currentSeason ?? await getCurrentSeasonForLeague(leagueId ? Number(leagueId) : 39);

    // DB에서 리그를 못 찾았으면 API로 재조회 (현재 연도 + 유럽 시즌 둘 다 시도)
    if (!leagueId) {
      interface LeagueResponse {
        league: {
          id: number;
          name: string;
          type: string;
        };
      }

      const findMainLeague = (leagues: LeagueResponse[]) =>
        leagues.find(
          (league) => league.league.type === 'League' &&
            !league.league.name.includes('Champions') &&
            !league.league.name.includes('Europa') &&
            !league.league.name.includes('Conference')
        );

      const currentYear = new Date().getFullYear();
      const europeanSeason = new Date().getMonth() > 6 ? currentYear : currentYear - 1;
      const seasonsToTry = [...new Set([currentYear, europeanSeason])];

      for (const season of seasonsToTry) {
        try {
          const leaguesData = await fetchFromFootballApi('leagues', { team: teamId, season });
          const leagues = (leaguesData.response || []) as LeagueResponse[];
          const mainLeague = findMainLeague(leagues);

          if (mainLeague) {
            leagueId = String(mainLeague.league.id);
            currentSeason = await getCurrentSeasonForLeague(mainLeague.league.id);
            break;
          } else if (leagues.length > 0) {
            leagueId = String(leagues[0].league.id);
            currentSeason = await getCurrentSeasonForLeague(leagues[0].league.id);
            break;
          }
        } catch {
          // 다음 시즌 시도
        }
      }

      if (!leagueId) {
        leagueId = '39';
      }
    }

    const previousSeason = currentSeason - 1;

    // 두 시즌에 대한 데이터를 저장할 객체
    const playerStats: Record<number, PlayerStats> = {};
    
    // 현재 시즌 데이터 가져오기
    await fetchSeasonStats(teamId, String(currentSeason), leagueId, playerStats);

    // 현재 시즌 데이터가 부족하면 이전 시즌 데이터도 가져오기
    if (Object.keys(playerStats).length < 5) {
      await fetchSeasonStats(teamId, String(previousSeason), leagueId, playerStats);
    }
    
    if (Object.keys(playerStats).length === 0) {
      return { 
        success: false,
        message: '선수 통계 데이터를 찾을 수 없습니다'
      };
    }
    
    return { 
      success: true,
      data: playerStats,
      message: '선수 통계 데이터를 성공적으로 가져왔습니다'
    };

  } catch (error) {
    console.error('선수 통계 정보 가져오기 오류:', error);
    return { 
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// 특정 시즌의 선수 통계 데이터를 가져오는 함수
async function fetchSeasonStats(
  teamId: string,
  season: string,
  league: string,
  playerStats: Record<number, PlayerStats>
): Promise<void> {
  // 여러 페이지의 데이터를 저장할 배열
  const allPlayerData: ApiPlayerData[] = [];
  let page = 1;
  let hasMorePages = true;

  // API가 페이지네이션되어 있으므로 모든 페이지 데이터 가져오기
  while (hasMorePages && page <= 5) { // 최대 5페이지까지만 (무한루프 방지)
    try {
      const statsData = await fetchFromFootballApi('players', { team: teamId, season, league, page });

      // 응답 검증
      if (!statsData || !statsData.response) {
        break;
      }

      // 현재 페이지 데이터 추가
      if (statsData?.response?.length > 0) {
        allPlayerData.push(...statsData.response);

        // paging 정보 확인
        const totalPages = statsData.paging?.total || 1;
        if (page >= totalPages) {
          hasMorePages = false;
        } else {
          page++;
        }
      } else {
        hasMorePages = false;
      }
    } catch {
      break; // 에러가 나면 중단하고 지금까지 수집한 데이터만 사용
    }
  }
  
  // 선수별 통계 데이터 매핑
  allPlayerData.forEach((playerData: ApiPlayerData) => {
    if (playerData.player && playerData.statistics && playerData.statistics.length > 0) {
      const player = playerData.player;
      const stats = playerData.statistics[0]; // 첫 번째 리그 통계 사용
      
      // API 응답 형태가 다양할 수 있으므로 세부적으로 필드 접근
      // games 객체가 appearances 또는 appearences(오타) 필드를 가질 수 있음
      let appearances = 0;
      if (stats.games) {
        appearances = stats.games.appearances || stats.games['appearences'] || 0;
      }
      
      // 골과 어시스트 처리 - API 응답이 다양한 구조일 수 있음
      let goals = 0; 
      let assists = 0;
      if (stats.goals) {
        goals = typeof stats.goals.total === 'number' ? stats.goals.total : 0;
        assists = typeof stats.goals.assists === 'number' ? stats.goals.assists : 0;
      }
      
      // 카드 처리
      let yellowCards = 0;
      let redCards = 0;
      if (stats.cards) {
        yellowCards = typeof stats.cards.yellow === 'number' ? stats.cards.yellow : 0;
        redCards = typeof stats.cards.red === 'number' ? stats.cards.red : 0;
      }
      
      // 이미 있는 데이터라면 업데이트하지 않음 (최신 시즌 우선)
      if (!playerStats[player.id]) {
        playerStats[player.id] = {
          appearances,
          goals,
          assists,
          yellowCards,
          redCards
        };
      }
    }
  });
}

// 캐싱 적용 함수
export const fetchCachedTeamPlayerStats = cache(fetchTeamPlayerStats); 
