'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { fetchMatchEvents } from '@/app/actions/livescore/matches/events';
import { fetchMatchData } from '@/app/actions/livescore/matches/match';
import { MatchEvent } from '../types';
// 프리미어리그 팀 선수 데이터 불러오기
import { liverpoolPlayers, NottinghamForestPlayers, Arsenalplayers, NewcastleUnitedplayers, Chelseaplayers, ManchesterCityplayers, AstonVillaplayers, Bournemouthplayers, Fulhamplayers, Brightonplayers } from '@/app/constants/teams/premier-league/premier-teams';

// 선수 데이터 타입 정의
type PremierLeaguePlayer = 
  | { id: number; name: string; koreanName: string; } 
  | { id?: number; name: string; role?: string; korean_name: string; } 
  | { id: number; english_name: string; korean_name: string; }
  | { id: number; englishName: string; koreanName: string; };

// 선수 이름 매핑 함수
const getPlayerKoreanName = (playerId: number): string | null => {
  if (!playerId) return null;

  // ID 기반으로 선수 찾기 및 한국어 이름 반환 로직
  const findPlayerById = (players: PremierLeaguePlayer[]) => {
    return players.find(player => 'id' in player && player.id === playerId);
  };

  // 각 팀별로 찾기 (ID가 확실한 선수들만)
  const player = 
    findPlayerById(liverpoolPlayers as PremierLeaguePlayer[]) || 
    findPlayerById(Arsenalplayers as PremierLeaguePlayer[]) || 
    findPlayerById(NewcastleUnitedplayers as PremierLeaguePlayer[]) || 
    findPlayerById(Chelseaplayers as PremierLeaguePlayer[]) || 
    findPlayerById(ManchesterCityplayers as PremierLeaguePlayer[]) || 
    findPlayerById(AstonVillaplayers as PremierLeaguePlayer[]) || 
    findPlayerById(Bournemouthplayers as PremierLeaguePlayer[]) || 
    findPlayerById(Fulhamplayers as PremierLeaguePlayer[]) || 
    findPlayerById(Brightonplayers as PremierLeaguePlayer[]) ||
    findPlayerById(NottinghamForestPlayers as PremierLeaguePlayer[]);

  if (!player) return null;

  // 다양한 형태의 한국어 이름 속성 반환
  if ('koreanName' in player && player.koreanName) return player.koreanName;
  if ('korean_name' in player && player.korean_name) return player.korean_name;
  
  // 추가 속성 체크 (영어 이름과 함께 있는 경우)
  if ('english_name' in player && 'korean_name' in player) return player.korean_name;
  if ('englishName' in player && 'koreanName' in player) return player.koreanName;
  
  return null;
};

// 이벤트 인터페이스 정의
// interface MatchEvent {
//   time: {
//     elapsed: number;
//     extra?: number;
//   };
//   team: {
//     id: number;
//     name: string;
//     logo?: string;
//   };
//   player: {
//     id: number;
//     name: string;
//   };
//   assist?: {
//     id?: number;
//     name?: string;
//   };
//   type: string;
//   detail: string;
//   comments?: string;
// }

interface MatchHeaderClientProps {
  league: {
    id: number;
    name: string;
    logo: string;
    name_ko?: string;  // 추가: 한국어 리그명
  };
  status: {
    long: string;
    short: string;
    elapsed?: number | null;
  };
  fixture: {
    date: string;
    time: string;
    timestamp: number;
  };
  teams: {
    home: {
      id: number;
      name: string;
      formation: string;
      logo: string;
      name_ko?: string;  // 추가: 한국어 팀명
      name_en?: string;  // 추가: 영어 팀명
    };
    away: {
      id: number;
      name: string;
      formation: string;
      logo: string;
      name_ko?: string;  // 추가: 한국어 팀명
      name_en?: string;  // 추가: 영어 팀명
    };
  };
  score: {
    halftime: { home: string; away: string };
    fulltime: { home: string; away: string };
  };
  goals: {
    home: string;
    away: string;
  };
  events: MatchEvent[]; // API에서 가져온 초기 이벤트 데이터
  matchId?: string; // 매치 ID 추가
}

export default function MatchHeaderClient({ 
  league: initialLeague,
  status: initialStatus,
  fixture: initialFixture,
  teams: initialTeams,
  score: initialScore,
  goals: initialGoals,
  events: initialEvents,
  matchId
}: MatchHeaderClientProps) {
  // 이벤트 데이터 상태 관리
  const [events, setEvents] = useState<MatchEvent[]>(initialEvents || []);
  const [loading, setLoading] = useState(false);
  
  // 매치 데이터 상태 관리 (초기값은 props에서 받은 값으로 설정)
  const [matchData, setMatchData] = useState({
    league: initialLeague,
    status: initialStatus,
    fixture: initialFixture,
    teams: initialTeams,
    score: initialScore,
    goals: initialGoals
  });
  
  // 서버 액션을 사용해 매치 데이터와 이벤트 데이터 가져오기
  useEffect(() => {
    // 초기 데이터가 충분히 있는지 확인
    const hasInitialData = initialLeague?.name && 
                          initialStatus?.long && 
                          initialTeams?.home?.name && 
                          initialTeams?.away?.name;
    
    // 매치 ID가 있고, 초기 데이터가 불충분하거나 이벤트 데이터가 없는 경우에만 서버 액션 호출
    if (matchId && (!hasInitialData || initialEvents.length === 0)) {
      const fetchData = async () => {
        setLoading(true);
        
        try {
          // 매치 데이터 가져오기 (초기 데이터가 부족한 경우에만)
          if (!hasInitialData) {
            const matchResponse = await fetchMatchData(matchId);
            
            if (matchResponse.success && matchResponse.data) {
              const data = matchResponse.data;
              
              // 날짜 포맷팅
              const matchDate = new Date(data.fixture.date);
              const formattedDate = matchDate.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });
              const formattedTime = matchDate.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              });
              
              // 상태 업데이트 - 한국어 팀명과 리그명 포함하여 저장
              setMatchData({
                league: {
                  id: data.league?.id || 0,
                  name: data.league?.name || '',
                  logo: data.league?.logo || '',
                  name_ko: data.league?.name_ko || data.league?.name || ''
                },
                status: {
                  long: data.fixture?.status?.long || '',
                  short: data.fixture?.status?.short || '',
                  elapsed: data.fixture?.status?.elapsed,
                },
                fixture: {
                  date: formattedDate,
                  time: formattedTime,
                  timestamp: data.fixture?.timestamp || 0,
                },
                teams: {
                  home: {
                    id: data.teams?.home?.id || 0,
                    name: data.teams?.home?.name || '',
                    logo: data.teams?.home?.logo || '',
                    formation: data.lineups?.[0]?.formation || '',
                    name_ko: data.teams?.home?.name_ko || data.teams?.home?.name || '',
                    name_en: data.teams?.home?.name_en || data.teams?.home?.name || ''
                  },
                  away: {
                    id: data.teams?.away?.id || 0,
                    name: data.teams?.away?.name || '',
                    logo: data.teams?.away?.logo || '',
                    formation: data.lineups?.[1]?.formation || '',
                    name_ko: data.teams?.away?.name_ko || data.teams?.away?.name || '',
                    name_en: data.teams?.away?.name_en || data.teams?.away?.name || ''
                  },
                },
                score: {
                  halftime: {
                    home: String(data.score?.halftime?.home || 0),
                    away: String(data.score?.halftime?.away || 0),
                  },
                  fulltime: {
                    home: String(data.score?.fulltime?.home || 0),
                    away: String(data.score?.fulltime?.away || 0),
                  },
                },
                goals: {
                  home: String(data.goals?.home || 0),
                  away: String(data.goals?.away || 0),
                }
              });
            }
          }
          
          // 이벤트 데이터 가져오기 (초기 이벤트가 없는 경우에만)
          if (initialEvents.length === 0) {
            const eventsResponse = await fetchMatchEvents(matchId);
            
            if (eventsResponse.status === 'success') {
              setEvents(eventsResponse.events);
            }
          }
        } catch (error) {
          console.error('데이터 로딩 오류:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    }
  }, [matchId, initialLeague, initialStatus, initialTeams, initialEvents.length]);
  
  // 상태값을 사용하기 위해 구조 분해 할당
  const { league, status, fixture, teams, score, goals } = matchData;
  
  const getMatchStatus = () => {
    const shortStatus = status?.short ?? '';
      
    if (['1H', '2H', 'LIVE', 'INPLAY'].includes(shortStatus)) {
      return `${status.elapsed}'`;
    } else if (shortStatus === 'HT') {
      return '전반 종료';
    } else if (shortStatus === 'FT') {
      return '경기 종료';
    } else if (shortStatus === 'AET') {
      return '연장 종료';
    } else if (shortStatus === 'PEN') {
      return '승부차기 종료';
    } else if (shortStatus === 'NS') {
      return '경기 예정';
    } else {
      return status?.long ?? '';
    }
  };

  // goalEvents 계산 - 이벤트 데이터에서 골만 필터링
  const goalEvents = events?.filter(event => {
    // Goal cancelled나 VAR로 취소된 골은 제외
    if (event.detail?.toLowerCase().includes('cancelled') || 
        event.type?.toLowerCase() === 'var') {
      return false;
    }
    
    // 실제 골만 포함
    return event.type?.toLowerCase() === 'goal' && 
           event.detail?.toLowerCase().includes('goal');
  }) || [];

  // 로딩 화면 표시 - 다른 탭과 동일한 스타일로 변경
  if (loading && !initialEvents.length && !league?.name) {
    return (
      <div className="w-full md:max-w-screen-xl md:mx-auto">
        <div className="mt-4 md:mt-0 mb-4 bg-white rounded-lg border p-4">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full md:max-w-screen-xl md:mx-auto">
      {/* 통합된 매치 헤더 카드 */}
      <div className="mt-4 md:mt-0 mb-4 bg-white rounded-lg border overflow-hidden">
        {/* 리그 정보 및 경기 상태 */}
        <div className="flex flex-col md:flex-row md:items-center border-b">
          {/* 리그 정보 - 왼쪽 1/3 차지 */}
          <div className="flex items-center gap-2 px-2 py-2 md:px-4 border-b md:border-b-0 md:border-r md:w-1/3">
            <div className="relative w-6 h-6">
              {league?.logo && (
                <Image
                  src={league.logo}
                  alt={league.name || ''}
                  fill
                  className="object-contain"
                  unoptimized={true}
                  priority={true}
                />
              )}
            </div>
            <span className="text-sm font-medium">
              {/* 한국어 리그명 우선 표시, 없으면 일반 이름 */}
              {league?.name_ko || league?.name}
            </span>
          </div>

          {/* 경기 상태 및 시간 - 중앙 1/3 차지 */}
          <div className="text-center py-2 px-0 md:w-1/3 flex flex-col items-center justify-center">
            <div className={`font-bold text-base ${
              status?.short && ['1H', '2H', 'LIVE', 'INPLAY'].includes(status.short) 
                ? 'text-green-600' 
                : status?.short === 'HT' 
                  ? 'text-orange-500'
                  : status?.short && ['FT', 'AET', 'PEN'].includes(status.short)
                    ? 'text-gray-600'
                    : 'text-blue-600'
            }`}>
              {getMatchStatus()}
            </div>
            <div className="text-gray-600 text-xs mt-0.5">
              {fixture?.date || ''}
            </div>
          </div>
          
          {/* 오른쪽 1/3 공백 - 균형을 위한 빈 공간 */}
          <div className="hidden md:block md:w-1/3"></div>
        </div>

        {/* 팀 정보 및 스코어 */}
        <div className="px-2 py-3 md:px-4 md:py-4">
          {/* 팀 정보 영역 */}
          <div className="flex items-center justify-between">
            {/* 홈팀 */}
            <div className="w-1/3 md:w-1/3 text-center">
              <div className="relative w-12 h-12 md:w-16 md:h-16 mx-auto mb-1 md:mb-2">
                {teams.home.logo && (
                  <Image 
                    src={teams.home.logo}
                    alt={teams.home.name}
                    fill
                    className="object-contain"
                    unoptimized={true}
                    priority={true}
                  />
                )}
              </div>
              {/* 한국어 팀명 우선 표시, 없으면 일반 이름 */}
              <div className="font-bold text-sm md:text-base">{teams.home.name_ko || teams.home.name}</div>
              <div className="text-xs md:text-sm text-gray-600">{teams.home.formation}</div>
            </div>

            {/* 스코어 */}
            <div className="w-1/3 md:w-1/3 text-center self-center whitespace-nowrap">
              <div className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">
                {goals.home} - {goals.away}
              </div>
              <div className="space-y-0 md:space-y-1 text-xs md:text-sm text-gray-600">
                <div>전반 종료: {score.halftime.home} - {score.halftime.away}</div>
                <div>경기 종료: {score.fulltime.home} - {score.fulltime.away}</div>
              </div>
            </div>

            {/* 원정팀 */}
            <div className="w-1/3 md:w-1/3 text-center">
              <div className="relative w-12 h-12 md:w-16 md:h-16 mx-auto mb-1 md:mb-2">
                {teams.away.logo && (
                  <Image 
                    src={teams.away.logo}
                    alt={teams.away.name}
                    fill
                    className="object-contain"
                    unoptimized={true}
                    priority={true}
                  />
                )}
              </div>
              {/* 한국어 팀명 우선 표시, 없으면 일반 이름 */}
              <div className="font-bold text-sm md:text-base">{teams.away.name_ko || teams.away.name}</div>
              <div className="text-xs md:text-sm text-gray-600">{teams.away.formation}</div>
            </div>
          </div>

          {/* 득점자 목록 - 로딩 인디케이터 제거 */}
          {goalEvents.length > 0 && (
            <div className="flex flex-col md:flex-row mt-4 md:mt-6 border-t pt-4">
              {/* 홈팀 득점자 */}
              <div className="w-full md:w-5/12 relative pl-2 md:pl-0 md:pr-2 mb-4 md:mb-0">
                {/* 홈팀 헤더 - 모바일에서만 표시 */}
                <div className="md:hidden py-1 font-semibold mb-2 text-sm flex items-center">
                  <div className="relative w-4 h-4 mr-2">
                    {teams.home.logo && (
                      <Image 
                        src={teams.home.logo}
                        alt={teams.home.name}
                        fill
                        className="object-contain"
                        unoptimized={true}
                      />
                    )}
                  </div>
                  {/* 한국어 팀명 우선 표시 */}
                  {teams.home.name_ko || teams.home.name}
                </div>
                
                <div className="space-y-1">
                  {goalEvents
                    .filter(event => {
                      const teamId = event.team?.id;
                      return teamId === teams.home.id;
                    })
                    .map((goal, index) => (
                      <div key={`${goal.time.elapsed}-${index}`} className="text-sm text-gray-600 flex items-start">
                        <div className="w-8 md:w-20 text-left md:text-right flex-shrink-0 md:pr-4 relative">
                          <span className="md:absolute md:right-0">⚽</span>
                        </div>
                        <div>
                          {getPlayerKoreanName(goal.player.id) || goal.player.name} {goal.time.elapsed}′
                          {goal.assist?.name && (
                            <span className="text-xs text-gray-500">
                              (A: {goal.assist.id ? (getPlayerKoreanName(goal.assist.id) || goal.assist.name) : goal.assist.name})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* 중앙 공간 - 모바일에서는 숨김 */}
              <div className="hidden md:block md:w-2/12"></div>

              {/* 홈/원정팀 구분선 - 모바일에서만 표시 */}
              {goalEvents.filter(event => event.team.id === teams.home.id).length > 0 && 
               goalEvents.filter(event => event.team.id === teams.away.id).length > 0 && 
               <div className="md:hidden w-full border-t border-gray-200 my-3"></div>}

              {/* 원정팀 득점자 */}
              <div className="w-full md:w-5/12 relative pl-2">
                {/* 원정팀 헤더 - 모바일에서만 표시 */}
                <div className="md:hidden py-1 font-semibold mb-2 text-sm flex items-center">
                  <div className="relative w-4 h-4 mr-2">
                    {teams.away.logo && (
                      <Image 
                        src={teams.away.logo}
                        alt={teams.away.name}
                        fill
                        className="object-contain"
                        unoptimized={true}
                      />
                    )}
                  </div>
                  {/* 한국어 팀명 우선 표시 */}
                  {teams.away.name_ko || teams.away.name}
                </div>
                
                <div className="space-y-1">
                  {goalEvents
                    .filter(event => {
                      const teamId = event.team?.id;
                      return teamId === teams.away.id;
                    })
                    .map((goal, index) => (
                      <div key={`${goal.time.elapsed}-${index}`} className="text-sm text-gray-600 flex items-start">
                        <div className="w-8 md:w-20 text-left md:text-right flex-shrink-0 md:pr-4 relative">
                          <span className="md:absolute md:right-0">⚽</span>
                        </div>
                        <div>
                          {getPlayerKoreanName(goal.player.id) || goal.player.name} {goal.time.elapsed}′
                          {goal.assist?.name && (
                            <span className="text-xs text-gray-500">
                              (A: {goal.assist.id ? (getPlayerKoreanName(goal.assist.id) || goal.assist.name) : goal.assist.name})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 