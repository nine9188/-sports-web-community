'use client';

import { memo, useState, useEffect } from 'react';
import Link from 'next/link';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import { MatchEvent } from '@/domains/livescore/types/match';

const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';
import { getTeamById, TeamMapping } from '@/domains/livescore/constants/teams';
import { mapEventToKoreanText } from '@/domains/livescore/constants/event-mappings';
import { LoadingState, ErrorState, EmptyState } from '@/domains/livescore/components/common/CommonComponents';
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui';
import { PlayerKoreanNames } from '../MatchPageClient';

// 이벤트 타입에 따른 아이콘 반환
const getEventIcon = (type: string, detail: string) => {
  const lowerType = type?.toLowerCase() || '';
  const lowerDetail = detail?.toLowerCase() || '';

  // 골
  if (lowerType === 'goal') {
    if (lowerDetail.includes('own goal')) {
      return <span className="text-base" title="자책골">⚽</span>;
    }
    if (lowerDetail.includes('penalty')) {
      return <span className="text-base" title="페널티 골">⚽</span>;
    }
    if (lowerDetail.includes('missed penalty')) {
      return <span className="text-base text-gray-400" title="페널티 실축">❌</span>;
    }
    return <span className="text-base" title="골">⚽</span>;
  }

  // 카드
  if (lowerType === 'card') {
    if (lowerDetail.includes('yellow')) {
      return <span className="text-base" title="옐로카드">🟨</span>;
    }
    if (lowerDetail.includes('red')) {
      return <span className="text-base" title="레드카드">🟥</span>;
    }
    return <span className="text-base" title="카드">🟨</span>;
  }

  // 교체
  if (lowerType === 'subst') {
    return <span className="text-base" title="교체">🔄</span>;
  }

  // VAR
  if (lowerType === 'var') {
    return <span className="text-base" title="VAR">📺</span>;
  }

  // 기타
  return <span className="text-base text-gray-400" title={type}>📋</span>;
};

interface EventsProps {
  matchId?: string;
  events?: MatchEvent[];
  playerKoreanNames?: PlayerKoreanNames;
  teamLogoUrls?: Record<number, string>;
}

// 메모이제이션을 적용하여 불필요한 리렌더링 방지
function Events({ events: propsEvents, playerKoreanNames = {}, teamLogoUrls = {} }: EventsProps) {
  const [events, setEvents] = useState<MatchEvent[]>(propsEvents || []);
  const [loading, setLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const [teamCache, setTeamCache] = useState<Record<number, TeamMapping>>({});

  // 이벤트 텍스트 내 선수 이름에 링크를 적용하는 헬퍼 함수
  const renderEventTextWithPlayerLinks = (event: MatchEvent) => {
    const originalText = mapEventToKoreanText(event); // "Lionel Messi 골 (Sergio Busquets 어시스트)"와 같은 형식

    let currentElements: (string | JSX.Element)[] = [originalText];

    // 선수 (player) 이름에 링크 적용
    if (event.player?.id && event.player.name) {
      const koreanPlayerName = playerKoreanNames[event.player.id] || event.player.name;
      const englishPlayerName = event.player.name;
      
      const newElements: (string | JSX.Element)[] = [];
      currentElements.forEach((element, i) => {
        if (typeof element === 'string') {
          // 문자열인 경우에만 분리 및 링크 적용
          // 정규 표현식으로 영어 선수 이름을 찾고, 괄호로 감싸서 구분자도 결과 배열에 포함
          const parts = element.split(new RegExp(`(\\b${englishPlayerName}\\b)`, 'g'));
          parts.forEach((part, idx) => {
            if (part === englishPlayerName) {
              newElements.push(
                <Link
                  key={`player-link-${event.player.id}-${i}-${idx}`} // 고유한 key 추가
                  href={`/livescore/football/player/${event.player.id}`}
                  className="hover:underline transition-all"
                >
                  {koreanPlayerName}
                </Link>
              );
            } else {
              newElements.push(part);
            }
          });
        } else {
          newElements.push(element); // 이미 JSX 엘리먼트인 경우 그대로 유지
        }
      });
      currentElements = newElements;
    }

    // 어시스트 (assist) 이름에 링크 적용
    if (event.assist?.id && event.assist.name) {
      const assistId = event.assist.id;
      const koreanAssistName = playerKoreanNames[assistId] || event.assist.name;
      const englishAssistName = event.assist.name;

      const newElements: (string | JSX.Element)[] = [];
      currentElements.forEach((element, i) => {
        if (typeof element === 'string') {
          const parts = element.split(new RegExp(`(\\b${englishAssistName}\\b)`, 'g'));
          parts.forEach((part, idx) => {
            if (part === englishAssistName) {
              newElements.push(
                <Link
                  key={`assist-link-${assistId}-${i}-${idx}`}
                  href={`/livescore/football/player/${assistId}`}
                  className="hover:underline transition-all"
                >
                  {koreanAssistName}
                </Link>
              );
            } else {
              newElements.push(part);
            }
          });
        } else {
          newElements.push(element); // 이미 JSX 엘리먼트인 경우 그대로 유지
        }
      });
      currentElements = newElements;
    }

    return currentElements;
  };

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


  // 4590 표준: 팀 로고 URL 헬퍼
  const getTeamLogo = (id: number) => teamLogoUrls[id] || TEAM_PLACEHOLDER;

  // 팀 로고 컴포넌트 — UnifiedSportsImageClient 직접 사용 (이중 래핑 제거)
  const TeamLogo = ({ name, teamId }: { name: string; teamId?: number }) => {
    const cachedTeam = teamId ? teamCache[teamId] : undefined;
    const teamName = cachedTeam?.name_ko || name || '팀';

    if (!teamId) {
      return (
        <div className="w-5 h-5 rounded bg-[#EAEAEA] dark:bg-[#333333] flex items-center justify-center flex-shrink-0">
          <span className="text-gray-400 dark:text-gray-500 text-[9px]">N/A</span>
        </div>
      );
    }

    return (
      <UnifiedSportsImageClient
        src={getTeamLogo(teamId)}
        alt={teamName}
        width={20}
        height={20}
      />
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
            // 이벤트를 한국어 문장으로 변환 (renderEventTextWithPlayerLinks 함수 내에서 다시 사용됨)
            const koreanText = mapEventToKoreanText(event);

            // 기존 선수 이름 교체 로직은 더 이상 필요 없음
            // let eventText = koreanText.split(' ').slice(1).join(' ');
            // if (event.player?.id) { ... }
            // if (event.assist?.id) { ... }

            return (
              <div
                key={`${event.time?.elapsed || 0}-${index}`}
                className="py-2 border-b border-black/5 dark:border-white/10 last:border-b-0"
                title={koreanText}
              >
                {/* 1줄: 분 + 이벤트아이콘 + 팀로고 + 팀명 */}
                <div className="flex items-center gap-1.5">
                  <span className="w-8 text-right text-[13px] text-gray-500 dark:text-gray-400 flex-shrink-0 tabular-nums">
                    {event.time?.elapsed || 0}
                    {event.time?.extra && event.time.extra > 0 && `+${event.time.extra}`}
                  </span>
                  <div className="flex-shrink-0">
                    {getEventIcon(event.type, event.detail)}
                  </div>
                  <Link href={`/livescore/football/team/${event.team?.id}`} className="flex items-center gap-1.5 group min-w-0">
                    <TeamLogo
                      name={event.team?.name || ''}
                      teamId={event.team?.id}
                    />
                    <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300 group-hover:underline truncate">
                      {event.team?.id && teamCache[event.team.id]?.name_ko ?
                        teamCache[event.team.id].name_ko :
                        event.team?.name || 'Unknown Team'
                      }
                    </span>
                  </Link>
                </div>

                {/* 2줄: 이벤트 텍스트 — 최소 들여쓰기로 풀 너비 활용 */}
                <div className="mt-1 pl-2">
                  <span className="text-[13px] text-gray-900 dark:text-[#F0F0F0]">
                    {renderEventTextWithPlayerLinks(event)}
                  </span>
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