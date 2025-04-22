'use client';

import { memo, useState, useEffect } from 'react';
import Image from 'next/image';
import { FaFutbol } from 'react-icons/fa';
import { BsCardText, BsCardHeading } from "react-icons/bs";
import { IoMdSwap } from 'react-icons/io';
import { MatchEvent } from '../../types';
import { fetchMatchEvents } from '@/app/actions/livescore/matches/events';
import { getTeamById, TeamMapping } from '@/app/constants/teams';
import { mapEventToKoreanText } from '@/app/constants/event-mappings';
// 프리미어리그 팀 선수 데이터 불러오기
import { liverpoolPlayers, NottinghamForestPlayers, Arsenalplayers, NewcastleUnitedplayers, Chelseaplayers, ManchesterCityplayers, AstonVillaplayers, Bournemouthplayers, Fulhamplayers, Brightonplayers } from '@/app/constants/teams/premier-league/premier-teams';

interface EventsProps {
  matchData: {
    events?: MatchEvent[];
    data?: Record<string, unknown>;
    lineups?: Record<string, unknown>;
    stats?: Record<string, unknown>;
    standings?: Record<string, unknown>;
    playersStats?: Record<string, unknown>;
  };
  matchId?: string; // 추가: 매치 ID를 props로 받음
}

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

// 메모이제이션을 적용하여 불필요한 리렌더링 방지
function Events({ matchData, matchId }: EventsProps) {
  const [events, setEvents] = useState<MatchEvent[]>(matchData?.events || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamCache, setTeamCache] = useState<Record<number, TeamMapping>>({});
  
  const iconClass = "text-xl";

  // 서버 액션을 사용해 이벤트 데이터 가져오기
  useEffect(() => {
    // 초기 이벤트 데이터가 없고 매치ID가 있는 경우에만 데이터 요청
    if (matchId && (!events.length || events.length === 0)) {
      const fetchEvents = async () => {
        setLoading(true);
        setError(null);
        
        try {
          const response = await fetchMatchEvents(matchId);
          
          if (response.status === 'success') {
            setEvents(response.events);
          } else {
            setError(response.message || '이벤트 데이터를 가져오는데 실패했습니다.');
          }
        } catch (err) {
          setError('이벤트 데이터를 가져오는데 실패했습니다.');
          console.error('이벤트 데이터 로딩 오류:', err);
        } finally {
          setLoading(false);
        }
      };
      
      fetchEvents();
    } else if (matchData?.events && matchData.events.length > 0) {
      // props로 전달받은 초기 이벤트 데이터가 있는 경우 사용
      setEvents(matchData.events);
    }
  }, [matchId, matchData?.events, events.length]);

  // 팀 정보 캐싱을 위한 hook
  useEffect(() => {
    // 이벤트에 등장하는 팀 ID를 수집
    const teamIds = new Set<number>();
    events.forEach(event => {
      if (event.team?.id) {
        teamIds.add(event.team.id);
      }
    });

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
  }, [events, teamCache]);

  // 이벤트 타입에 따른 아이콘 렌더링
  const renderEventIcon = (type: string, detail: string) => {
    switch (type) {
      case 'Goal':
        return <FaFutbol className={`${iconClass} text-green-600`} title="골" />;
      case 'Card':
        return detail === 'Red Card' || detail.includes('Red Card') 
          ? <BsCardHeading className={`${iconClass} text-red-600`} title="레드카드" />
          : <BsCardText className={`${iconClass} text-yellow-400`} title="옐로카드" />;
      case 'subst':
        return <IoMdSwap className={`${iconClass} text-blue-500`} title="선수교체" />;
      default:
        // 아이콘이 없는 경우 빈 div를 반환하여 공간 유지
        return <div className={`${iconClass} w-5 h-5`}></div>;
    }
  };

  // 팀 로고 컴포넌트 수정
  const TeamLogo = ({ logo, name, teamId }: { logo: string; name: string; teamId?: number }) => {
    // 캐시된 팀 정보 확인
    const cachedTeam = teamId ? teamCache[teamId] : undefined;
    const logoUrl = cachedTeam?.logo || logo || '/placeholder-team.png';
    const teamName = cachedTeam?.name_ko || name || '팀';

    return (
      <div className="w-5 h-5 md:w-6 md:h-6 relative flex-shrink-0 overflow-hidden">
        <Image
          src={logoUrl}
          alt={teamName}
          width={24}
          height={24}
          className="w-full h-full object-contain"
          unoptimized
        />
      </div>
    );
  };

  // 로딩 상태 표시
  if (loading) {
    return (
      <div className="mb-4 bg-white rounded-lg border p-4">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  // 에러 상태 표시
  if (error) {
    return (
      <div className="mb-4 bg-white rounded-lg border p-4">
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-12 w-12 mx-auto text-red-500 mb-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
            <p className="text-lg font-medium text-gray-600">오류 발생</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="mb-4 bg-white rounded-lg border p-4">
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-12 w-12 mx-auto text-gray-400 mb-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <p className="text-lg font-medium text-gray-600">이벤트 데이터가 없습니다</p>
            <p className="text-sm text-gray-500 mt-1">현재 이 경기에 대한 이벤트 정보를 제공할 수 없습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  // 이벤트를 시간 순으로 정렬
  const sortedEvents = [...events].sort((a, b) => {
    const timeA = (a.time?.elapsed || 0) + (a.time?.extra || 0);
    const timeB = (b.time?.elapsed || 0) + (b.time?.extra || 0);
    return timeA - timeB;
  });

  return (
    <div className="mb-4 bg-white rounded-lg border p-4">
      <div className="-ml-4 md:ml-0 space-y-1 md:space-y-2">
        {sortedEvents.map((event, index) => {
          // 이벤트를 한국어 문장으로 변환
          const koreanText = mapEventToKoreanText(event);
          
          // 원래 텍스트에서 선수 이름만 한국어 이름으로 교체
          let eventText = koreanText.split(' ').slice(1).join(' ');
          
          // 선수 ID가 있을 경우 한국어 이름으로 변경
          if (event.player?.id) {
            const koreanName = getPlayerKoreanName(event.player.id);
            if (koreanName) {
              // 원본 텍스트에서 영어 이름을 한국어 이름으로 교체
              eventText = eventText.replace(event.player.name, koreanName);
            }
          }
          
          // 어시스트 선수 ID가 있을 경우 한국어 이름으로 변경
          if (event.assist?.id) {
            const koreanName = getPlayerKoreanName(event.assist.id);
            if (koreanName && event.assist.name) {
              // 원본 텍스트에서 영어 이름을 한국어 이름으로 교체
              eventText = eventText.replace(event.assist.name, koreanName);
            }
          }
          
          return (
            <div 
              key={`${event.time?.elapsed || 0}-${index}`}
              className="flex items-start gap-1 md:gap-2 px-1 md:px-3 py-1 md:py-2 mb-1 md:mb-2 border-b last:border-b-0 last:mb-0"
              title={koreanText} // 마우스 오버 시 한국어 설명 표시
            >
              <div className="w-10 md:w-12 flex items-center justify-end text-sm text-gray-600 flex-shrink-0">
                <span>
                  {event.time?.elapsed || 0}
                  {event.time?.extra && event.time.extra > 0 && `+${event.time.extra}`}′
                </span>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-1 md:gap-2">
                  <div className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 flex items-center justify-center">
                    {renderEventIcon(event.type || '', event.detail || '')}
                  </div>
                  <TeamLogo 
                    logo={event.team?.logo || ''} 
                    name={event.team?.name || ''} 
                    teamId={event.team?.id}
                  />
                  <span className="text-sm text-gray-600">
                    {event.team?.id && teamCache[event.team.id]?.name_ko ? 
                      teamCache[event.team.id].name_ko : 
                      event.team?.name || 'Unknown Team'
                    }
                  </span>
                </div>
                <div className="mt-1.5 ml-5 md:ml-6">
                  <div className="text-sm">
                    {/* 한국어 텍스트 표시 (이름만 교체) */}
                    <span className="text-gray-700">
                      {eventText}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 메모이제이션된 컴포넌트 내보내기
export default memo(Events);