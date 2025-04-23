import { fetchMatchData } from '@/app/actions/livescore/matches/match';
import { fetchMatchLineups } from '@/app/actions/livescore/matches/lineups';
import { fetchMatchEvents } from '@/app/actions/livescore/matches/events';
import { fetchMultiplePlayerStats } from '@/app/actions/livescore/matches/playerStats';
import LineupsContent from '@/app/livescore/football/match/components/tabs/Lineups';
import { TeamLineup } from '@/app/livescore/football/match/types';

export const dynamic = 'force-dynamic';
export const fetchCache = 'default-no-store';
export const revalidate = 0;

// 서버 액션의 TeamLineup 타입을 컴포넌트의 TeamLineup 타입으로 변환하는 함수
function mapToComponentTeamLineup(apiLineup: Record<string, unknown> | null): TeamLineup | null {
  if (!apiLineup) return null;
  
  // 색상 타입 정의
  interface TeamColors {
    player: {
      primary: string;
      number: string;
      border: string;
    };
    goalkeeper: {
      primary: string;
      number: string;
      border: string;
    };
  }
  
  // 선수 아이템 타입 정의
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
  
  // 기본 색상 값
  const defaultColors: TeamColors = {
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
  
  return {
    team: {
      id: Number(teamObj.id) || 0,
      name: (teamObj.name as string) || '',
      logo: (teamObj.logo as string) || '',
      colors: colorsObj
    },
    formation: (apiLineup.formation as string) || '',
    startXI: ((apiLineup.startXI as Array<PlayerItem>) || []).map((item: PlayerItem) => {
      // captain 정보가 undefined나 null이 아닌
      const isCaptain = item.player?.captain === true;
      
      return {
        player: {
          id: Number(item.player?.id) || 0,
          name: (item.player?.name as string) || '',
          number: Number(item.player?.number) || 0,
          pos: (item.player?.pos as string) || '',
          grid: (item.player?.grid as string) || '',
          captain: isCaptain,
          photo: (item.player?.photo as string) || ''
        }
      };
    }),
    substitutes: ((apiLineup.substitutes as Array<PlayerItem>) || []).map((item: PlayerItem) => {
      // captain 정보가 확실하게 처리
      const isCaptain = item.player?.captain === true;
      
      return {
        player: {
          id: Number(item.player?.id) || 0,
          name: (item.player?.name as string) || '',
          number: Number(item.player?.number) || 0,
          pos: (item.player?.pos as string) || '',
          grid: (item.player?.grid as string) || '',
          captain: isCaptain,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchPlayersStats(id: string, lineupsData: { response: Record<string, any> | null }) {
  try {
    // 라인업 데이터가 없으면 빈 객체 반환
    if (!lineupsData?.response?.home?.startXI || !lineupsData?.response?.away?.startXI) {
      return {};
    }
    
    // 모든 선수 ID 추출 (선발 + 교체)
    const playerIds = [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...lineupsData.response.home.startXI.map((item: Record<string, any>) => item.player?.id),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...lineupsData.response.home.substitutes.map((item: Record<string, any>) => item.player?.id),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...lineupsData.response.away.startXI.map((item: Record<string, any>) => item.player?.id),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...lineupsData.response.away.substitutes.map((item: Record<string, any>) => item.player?.id)
    ].filter(Boolean) // null/undefined 제거
     .map(id => parseInt(id, 10)); // 문자열인 경우를 대비해 숫자로 변환
    
    // 서버 액션을 사용하여 선수 통계 데이터 가져오기
    const playerStats = await fetchMultiplePlayerStats(id, playerIds);
    
    return playerStats;
  } catch (error) {
    console.error('[fetchPlayersStats] 선수 통계 가져오기 오류:', error);
    return {};
  }
}

export default async function LineupsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: matchId } = await params;
  
  // 팀 정보 가져오기
  const matchDataResponse = await fetchMatchData(matchId);
  if (!matchDataResponse.success || !matchDataResponse.data) {
    throw new Error(matchDataResponse.message || '경기 데이터를 찾을 수 없습니다');
  }
  const data = matchDataResponse.data;
  
  // 라인업 데이터 가져오기
  const lineupsData = await fetchMatchLineups(matchId);
  
  // 이벤트 데이터 가져오기
  const eventsData = await fetchMatchEvents(matchId);
  
  // 선수 통계 데이터 가져오기
  const playersStatsData = await fetchPlayersStats(matchId, lineupsData);
  
  // API 응답의 라인업 데이터를 컴포넌트용 타입으로 변환
  const mappedLineups = lineupsData.response ? {
    home: mapToComponentTeamLineup(lineupsData.response.home as unknown as Record<string, unknown>),
    away: mapToComponentTeamLineup(lineupsData.response.away as unknown as Record<string, unknown>)
  } : null;
  
  // 모든 라인업이 없는 경우 or 하나라도 null인 경우 처리
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