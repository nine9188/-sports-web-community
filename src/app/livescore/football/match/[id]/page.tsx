import TabContent from '@/app/livescore/football/match/components/TabContent';
import MatchHeader from '@/app/livescore/football/match/components/MatchHeader';
import styles from '@/app/livescore/football/match/styles/mobile.module.css';
import { fetchMatchData } from '@/app/actions/livescore/matches/match';
import { fetchMatchLineups } from '@/app/actions/livescore/matches/lineups';
import { fetchMatchEvents } from '@/app/actions/livescore/matches/events';
import { fetchMatchStats } from '@/app/actions/livescore/matches/stats';
import { fetchMatchStandings } from '@/app/actions/livescore/matches/standings';
import { fetchMultiplePlayerStats, MultiplePlayerStatsResponse } from '@/app/actions/livescore/matches/playerStats';
import { TeamLineup } from '../types';  // TabContent에서 사용하는 TeamLineup 타입을 임포트

// 동적 렌더링 강제 설정 추가 - 실시간 데이터이므로 필요
export const dynamic = 'force-dynamic';
export const fetchCache = 'default-no-store'; // 캐싱 방지
export const revalidate = 0; // 항상 새로운 데이터 요청

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
      // captain 정보가 undefined나 null이 아닌 명확한 boolean 값으로 설정
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
      // captain 정보가 undefined나 null이 아닌 명확한 boolean 값으로 설정
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

// 선수 통계 데이터를 한 번에 가져오는 함수 - 타입 안전성 향상
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchPlayersStats(id: string, lineupsData: { response: Record<string, any> | null }): Promise<MultiplePlayerStatsResponse> {
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
    
    // playersStatsData에서 주장 정보 추출
    const captainIds = new Set<number>();
    Object.entries(playerStats).forEach(([playerId, data]) => {
      if (data.response?.[0]?.statistics?.[0]?.games?.captain === true) {
        captainIds.add(parseInt(playerId, 10));
      }
    });
    
    // 주장 정보를 라인업 데이터에 추출
    if (lineupsData.response) {
      // 인터페이스 정의
      interface PlayerItem {
        player: {
          id: number;
          name: string;
          captain?: boolean;
          [key: string]: unknown;
        };
      }
      
      // 홈팀 선발 선수 주장 정보 업데이트
      if (lineupsData.response.home?.startXI) {
        lineupsData.response.home.startXI = lineupsData.response.home.startXI.map((item: PlayerItem) => {
          if (captainIds.has(item.player.id)) {
            return {
              ...item,
              player: {
                ...item.player,
                captain: true
              }
            };
          }
          return item;
        });
      }
      
      // 홈팀 교체 선수 주장 정보 업데이트
      if (lineupsData.response.home?.substitutes) {
        lineupsData.response.home.substitutes = lineupsData.response.home.substitutes.map((item: PlayerItem) => {
          if (captainIds.has(item.player.id)) {
            return {
              ...item,
              player: {
                ...item.player,
                captain: true
              }
            };
          }
          return item;
        });
      }
      
      // 원정팀 선발 선수 주장 정보 업데이트
      if (lineupsData.response.away?.startXI) {
        lineupsData.response.away.startXI = lineupsData.response.away.startXI.map((item: PlayerItem) => {
          if (captainIds.has(item.player.id)) {
            return {
              ...item,
              player: {
                ...item.player,
                captain: true
              }
            };
          }
          return item;
        });
      }
      
      // 원정팀 교체 선수 주장 정보 업데이트
      if (lineupsData.response.away?.substitutes) {
        lineupsData.response.away.substitutes = lineupsData.response.away.substitutes.map((item: PlayerItem) => {
          if (captainIds.has(item.player.id)) {
            return {
              ...item,
              player: {
                ...item.player,
                captain: true
              }
            };
          }
          return item;
        });
      }
    }
    
    return playerStats;
  } catch (error) {
    console.error('[fetchPlayersStats] 선수 통계 가져오기 오류:', error);
    return {};
  }
}

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: matchId } = await params;
    
    // 먼저 기본 경기 데이터 가져오기 (서버 액션 사용) - 팀 정보만 필요
    const matchDataResponse = await fetchMatchData(matchId);
    
    if (!matchDataResponse.success || !matchDataResponse.data) {
      throw new Error(matchDataResponse.message || '경기 데이터를 찾을 수 없습니다');
    }
    
    const data = matchDataResponse.data;
    
    // 라인업 데이터 서버 액션으로 가져오기
    const lineupsData = await fetchMatchLineups(matchId);
    
    // 이벤트 데이터도 서버 액션으로 가져오기
    const eventsData = await fetchMatchEvents(matchId);
    
    // 나머지 데이터 병렬로 가져오기 (비차단적으로 처리)
    const [statsData, standingsData, playersStatsData] = await Promise.all([
      fetchMatchStats(matchId),
      fetchMatchStandings(matchId),
      fetchPlayersStats(matchId, lineupsData)
    ]);
    
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
      <div className={styles.mobileContainer}>
        {/* MatchHeader에 미리 가져온 데이터를 함께 전달하여 추가 요청 최소화 */}
        <MatchHeader 
          matchId={matchId}
          league={data.league}
          status={data.fixture?.status}
          fixture={{
            date: new Date(data.fixture.date).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            time: new Date(data.fixture.date).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }),
            timestamp: data.fixture.timestamp
          }}
          teams={{
            home: {
              id: data.teams?.home?.id || 0,
              name: data.teams?.home?.name || '',
              logo: data.teams?.home?.logo || '',
              formation: lineupsData?.response?.home?.formation || '',
              name_ko: data.teams?.home?.name_ko || data.teams?.home?.name || '',
              name_en: data.teams?.home?.name_en || data.teams?.home?.name || ''
            },
            away: {
              id: data.teams?.away?.id || 0,
              name: data.teams?.away?.name || '',
              logo: data.teams?.away?.logo || '',
              formation: lineupsData?.response?.away?.formation || '',
              name_ko: data.teams?.away?.name_ko || data.teams?.away?.name || '',
              name_en: data.teams?.away?.name_en || data.teams?.away?.name || ''
            }
          }}
          score={{
            halftime: {
              home: String(data.score?.halftime?.home || 0),
              away: String(data.score?.halftime?.away || 0)
            },
            fulltime: {
              home: String(data.score?.fulltime?.home || 0),
              away: String(data.score?.fulltime?.away || 0)
            }
          }}
          goals={{
            home: String(data.goals?.home || 0),
            away: String(data.goals?.away || 0)
          }}
          events={eventsData.events || []}
        />
        
        {/* TabContent에는 팀 정보와 다른 데이터도 함께 전달 - 좀 더 복잡한 UI 컴포넌트이므로 필요한 데이터 미리 전달 */}
        <TabContent 
          matchId={matchId}
          homeTeam={{
            id: data.teams?.home?.id || 0,
            name: data.teams?.home?.name || '',
            logo: data.teams?.home?.logo || '',
            formation: lineupsData?.response?.home?.formation || ''
          }}
          awayTeam={{
            id: data.teams?.away?.id || 0,
            name: data.teams?.away?.name || '',
            logo: data.teams?.away?.logo || '',
            formation: lineupsData?.response?.away?.formation || ''
          }}
          matchData={{
            events: eventsData.events || [], // 이벤트 데이터도 서버 액션으로 가져와서 전달
            lineups: { response: validLineups }, // 변환된 라인업 데이터 제공
            stats: statsData.response || [],
            standings: standingsData, // 변환된 순위표 데이터를 직접 전달
            playersStats: playersStatsData
          }}
        />
      </div>
    );
  } catch (error) {
    console.error('Match page error:', error);
    return (
      <div>
        <div className="bg-white rounded-lg shadow-sm text-center">
          <h2 className="text-xl font-semibold text-red-600">오류 발생</h2>
          <p className="text-gray-700">경기 정보를 불러오는데 실패했습니다.</p>
          <p className="text-gray-600">API 서버에 연결할 수 없거나 요청한 데이터가 존재하지 않습니다.</p>
          <div className="flex justify-center gap-2 mt-4">
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              다시 시도
            </button>
            <a 
              href="/livescore/football"
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
            >
              라이브스코어 홈으로
            </a>
          </div>
        </div>
      </div>
    );
  }
}