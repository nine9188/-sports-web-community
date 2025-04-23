import { fetchMatchData } from '@/app/actions/livescore/matches/match';
import { fetchMatchLineups } from '@/app/actions/livescore/matches/lineups';
import { fetchMatchEvents } from '@/app/actions/livescore/matches/events';
import { fetchMultiplePlayerStats } from '@/app/actions/livescore/matches/playerStats';
import LineupsContent from '@/app/livescore/football/match/components/tabs/Lineups';
import { TeamLineup } from '@/app/livescore/football/match/types';
import { cache } from 'react';

// 캐싱 전략 설정
export const dynamic = 'force-dynamic';
export const fetchCache = 'default-cache';
export const revalidate = 60; // 60초마다 재검증

// 캐싱된 데이터 로딩 함수들
const getMatchData = cache(async (matchId: string) => {
  try {
    return await fetchMatchData(matchId);
  } catch (error) {
    console.error('경기 데이터 로딩 실패:', error);
    return { success: false, data: null, message: '로딩 실패' };
  }
});

const getLineupsData = cache(async (matchId: string) => {
  try {
    return await fetchMatchLineups(matchId);
  } catch (error) {
    console.error('라인업 데이터 로딩 실패:', error);
    return { response: null };
  }
});

const getEventsData = cache(async (matchId: string) => {
  try {
    return await fetchMatchEvents(matchId);
  } catch (error) {
    console.error('이벤트 데이터 로딩 실패:', error);
    return { events: [] };
  }
});

const getPlayerStatsData = cache(async (matchId: string, playerIds: number[]) => {
  if (playerIds.length === 0) return {};
  
  try {
    return await fetchMultiplePlayerStats(matchId, playerIds);
  } catch (error) {
    console.error('선수 통계 데이터 로딩 실패:', error);
    return {};
  }
});

// 서버 액션의 TeamLineup 타입을 컴포넌트의 TeamLineup 타입으로 변환하는 함수
function mapToComponentTeamLineup(apiLineup: Record<string, unknown> | null): TeamLineup | null {
  if (!apiLineup) return null;
  
  // 기본 색상 값
  const defaultColors = {
    player: {
      primary: '1a5f35',
      number: 'ffffff',
      border: '1a5f35'
    },
    goalkeeper: {
      primary: 'ffd700',
      number: '000000',
      border: 'ffd700'
    }
  };
  
  // 팀 정보 추출
  const teamObj = apiLineup.team as Record<string, unknown> || {};
  
  // colors 정보 처리
  let colorsObj = defaultColors;
  
  if (teamObj.colors && typeof teamObj.colors === 'object') {
    const colorsData = teamObj.colors as Record<string, unknown>;
    
    if (colorsData.player && typeof colorsData.player === 'object' && 
        colorsData.goalkeeper && typeof colorsData.goalkeeper === 'object') {
      
      const playerColors = colorsData.player as Record<string, unknown>;
      const gkColors = colorsData.goalkeeper as Record<string, unknown>;
      
      colorsObj = {
        player: {
          primary: (playerColors.primary as string) || defaultColors.player.primary,
          number: (playerColors.number as string) || defaultColors.player.number,
          border: (playerColors.border as string) || defaultColors.player.border,
        },
        goalkeeper: {
          primary: (gkColors.primary as string) || defaultColors.goalkeeper.primary,
          number: (gkColors.number as string) || defaultColors.goalkeeper.number,
          border: (gkColors.border as string) || defaultColors.goalkeeper.border,
        }
      };
    }
  }
  
  // 인터페이스 정의
  interface PlayerItem {
    player?: {
      id?: number;
      name?: string;
      number?: number;
      pos?: string;
      grid?: string;
      captain?: boolean;
      photo?: string;
    };
  }
  
  return {
    team: {
      id: Number(teamObj.id) || 0,
      name: (teamObj.name as string) || '',
      logo: (teamObj.logo as string) || '',
      colors: colorsObj
    },
    formation: (apiLineup.formation as string) || '',
    startXI: ((apiLineup.startXI as Array<PlayerItem>) || []).map((item: PlayerItem) => {
      return {
        player: {
          id: Number(item.player?.id) || 0,
          name: (item.player?.name as string) || '',
          number: Number(item.player?.number) || 0,
          pos: (item.player?.pos as string) || '',
          grid: (item.player?.grid as string) || '',
          captain: item.player?.captain === true,
          photo: (item.player?.photo as string) || ''
        }
      };
    }),
    substitutes: ((apiLineup.substitutes as Array<PlayerItem>) || []).map((item: PlayerItem) => {
      return {
        player: {
          id: Number(item.player?.id) || 0,
          name: (item.player?.name as string) || '',
          number: Number(item.player?.number) || 0,
          pos: (item.player?.pos as string) || '',
          grid: (item.player?.grid as string) || '',
          captain: item.player?.captain === true,
          photo: (item.player?.photo as string) || ''
        }
      };
    }),
    coach: {
      id: apiLineup.coach && typeof apiLineup.coach === 'object' 
          ? Number((apiLineup.coach as Record<string, unknown>).id) || 0 
          : 0,
      name: apiLineup.coach && typeof apiLineup.coach === 'object' 
            ? ((apiLineup.coach as Record<string, unknown>).name as string) || '' 
            : '',
      photo: apiLineup.coach && typeof apiLineup.coach === 'object' 
             ? ((apiLineup.coach as Record<string, unknown>).photo as string) || '' 
             : ''
    }
  };
}

export default async function LineupsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: matchId } = await params;
  
  // 모든 데이터를 병렬로 가져오기 (캐싱 적용)
  const [matchDataResponse, lineupsData, eventsData] = await Promise.all([
    getMatchData(matchId),
    getLineupsData(matchId),
    getEventsData(matchId)
  ]);
  
  if (!matchDataResponse.success || !matchDataResponse.data) {
    throw new Error(matchDataResponse.message || '경기 데이터를 찾을 수 없습니다');
  }
  const data = matchDataResponse.data;
  
  // 선수 ID 추출 (null-safe하게 처리)
  const playerIds = lineupsData.response ? [
    // 홈팀 선수 ID
    ...(lineupsData.response.home?.startXI?.map(item => item.player?.id) || []),
    ...(lineupsData.response.home?.substitutes?.map(item => item.player?.id) || []),
    // 원정팀 선수 ID
    ...(lineupsData.response.away?.startXI?.map(item => item.player?.id) || []),
    ...(lineupsData.response.away?.substitutes?.map(item => item.player?.id) || [])
  ].filter(Boolean).map(id => Number(id)) : [];
  
  // 선수 통계 데이터 가져오기 (필요한 경우에만)
  const playersStatsData = await getPlayerStatsData(matchId, playerIds);
  
  // API 응답의 라인업 데이터를 컴포넌트용 타입으로 변환
  const mappedLineups = lineupsData.response ? {
    home: mapToComponentTeamLineup(lineupsData.response.home as unknown as Record<string, unknown>),
    away: mapToComponentTeamLineup(lineupsData.response.away as unknown as Record<string, unknown>)
  } : null;
  
  // 유효한 라인업 검사
  const validLineups = mappedLineups && mappedLineups.home && mappedLineups.away ? {
    home: mappedLineups.home,
    away: mappedLineups.away
  } : null;
  
  return (
    <div className="bg-white rounded-lg mt-4">
      <LineupsContent 
        matchData={{
          homeTeam: {
            id: data.teams?.home?.id || 0,
            name: data.teams?.home?.name || '',
            logo: data.teams?.home?.logo || ''
          },
          awayTeam: {
            id: data.teams?.away?.id || 0,
            name: data.teams?.away?.name || '',
            logo: data.teams?.away?.logo || ''
          },
          lineups: { response: validLineups },
          events: eventsData.events || [],
          playersStats: playersStatsData
        }}
      />
    </div>
  );
} 