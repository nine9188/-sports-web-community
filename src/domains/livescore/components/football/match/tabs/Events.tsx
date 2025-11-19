'use client';

import { memo, useState, useEffect } from 'react';
import { FaFutbol } from 'react-icons/fa';
import ApiSportsImage from '@/shared/components/ApiSportsImage';
import { ImageType } from '@/shared/types/image';
import { BsCardText, BsCardHeading } from "react-icons/bs";
import { IoMdSwap } from 'react-icons/io';
import { MatchEvent } from '@/domains/livescore/types/match';
import { getTeamById, TeamMapping } from '@/domains/livescore/constants/teams';
import { mapEventToKoreanText } from '@/domains/livescore/constants/event-mappings';
import { LoadingState, ErrorState, EmptyState } from '@/domains/livescore/components/common/CommonComponents';
import { getPlayerKoreanName } from '@/domains/livescore/constants/players';
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui';


interface EventsProps {
  matchId?: string;
  events?: MatchEvent[];
}

// 메모이제이션을 적용하여 불필요한 리렌더링 방지
function Events({ events: propsEvents }: EventsProps) {
  const [events, setEvents] = useState<MatchEvent[]>(propsEvents || []);
  const [loading, setLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const [teamCache, setTeamCache] = useState<Record<number, TeamMapping>>({});
  
  const iconClass = "text-xl";

  // matchData prop이 변경될 때 이벤트 데이터 업데이트
  useEffect(() => {
    if (propsEvents) {
      setEvents(propsEvents);
      setLoading(false);
    }
  }, [propsEvents]);

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
  const TeamLogo = ({ name, teamId }: { name: string; teamId?: number }) => {
    // 캐시된 팀 정보 확인
    const cachedTeam = teamId ? teamCache[teamId] : undefined;
    const teamName = cachedTeam?.name_ko || name || '팀';

    return (
      <div className="w-5 h-5 md:w-6 md:h-6 relative flex-shrink-0 overflow-hidden">
        {teamId ? (
          <ApiSportsImage
            imageId={teamId}
            imageType={ImageType.Teams}
            alt={teamName}
            width={24}
            height={24}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
            로고 없음
          </div>
        )}
      </div>
    );
  };

  // 로딩 상태 표시
  if (loading) {
    return <LoadingState message="이벤트 데이터를 불러오는 중..." />;
  }
  
  // 에러 상태 표시
  if (error) {
    return <ErrorState message={error} />;
  }

  if (!events.length) {
    return <EmptyState title="이벤트 데이터가 없습니다" message="현재 이 경기에 대한 이벤트 정보를 제공할 수 없습니다." />;
  }

  // 이벤트를 시간 순으로 정렬
  const sortedEvents = [...events].sort((a, b) => {
    const timeA = (a.time?.elapsed || 0) + (a.time?.extra || 0);
    const timeB = (b.time?.elapsed || 0) + (b.time?.extra || 0);
    return timeA - timeB;
  });

  return (
    <Container className="bg-white dark:bg-[#1D1D1D] mb-4">
      <ContainerHeader>
        <ContainerTitle>경기 이벤트</ContainerTitle>
      </ContainerHeader>
      <ContainerContent>
        <div className="space-y-2">
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
                className="flex items-start gap-2 py-2 border-b border-black/5 dark:border-white/10 last:border-b-0"
                title={koreanText}
              >
                <div className="w-12 flex items-center justify-end text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                  <span>
                    {event.time?.elapsed || 0}
                    {event.time?.extra && event.time.extra > 0 && `+${event.time.extra}`}′
                  </span>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                      {renderEventIcon(event.type || '', event.detail || '')}
                    </div>
                    <TeamLogo
                      name={event.team?.name || ''}
                      teamId={event.team?.id}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {event.team?.id && teamCache[event.team.id]?.name_ko ?
                        teamCache[event.team.id].name_ko :
                        event.team?.name || 'Unknown Team'
                      }
                    </span>
                  </div>
                  <div className="mt-1.5 ml-8">
                    <span className="text-sm text-gray-900 dark:text-[#F0F0F0]">
                      {eventText}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ContainerContent>
    </Container>
  );
}

// 메모이제이션된 컴포넌트 내보내기
export default memo(Events); 