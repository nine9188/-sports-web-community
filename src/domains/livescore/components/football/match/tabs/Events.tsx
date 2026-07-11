'use client';

import { memo, useState, useEffect } from 'react';
import Link from 'next/link';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import { MatchEvent } from '@/domains/livescore/types/match';

const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';
import { useTeamLeague, type TeamData } from '@/shared/context/TeamLeagueContext';
import { mapEventToKoreanText } from '@/domains/livescore/constants/event-mappings';
import { ErrorState } from '@/domains/livescore/components/common/CommonComponents';
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui';
import { PlayerKoreanNames } from '../MatchPageClient';
import { getPlayerHref, getTeamHref } from '@/domains/livescore/utils/entityLinks';
import MatchTabState from './MatchTabState';

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
function Events({ matchId, events: propsEvents, playerKoreanNames = {}, teamLogoUrls = {} }: EventsProps) {
  const { getTeamById } = useTeamLeague();
  const events = propsEvents || [];
  const [teamCache, setTeamCache] = useState<Record<number, TeamData>>({});

  // 이벤트 텍스트 내 선수 이름에 링크를 적용하는 헬퍼 함수
  const renderEventTextWithPlayerLinks = (event: MatchEvent) => {
    // 처음부터 한글 이름으로 문장 생성
    const text = mapEventToKoreanText(event, playerKoreanNames);

    // player 링크만 감싸기 (정규식 없이 간단하게)
    const playerName = (event.player?.id && playerKoreanNames[event.player.id]) || event.player?.name || '';
    const assistName = (event.assist?.id && playerKoreanNames[event.assist?.id]) || event.assist?.name || '';

    if (!playerName) return text;

    const parts = text.split(playerName);
    const elements: React.ReactNode[] = [];

    parts.forEach((part, i) => {
      if (i > 0) {
        elements.push(
          <Link key={`player-${i}`} href={getPlayerHref(event.player)} className="hover:underline transition-all" prefetch={false}>
            {playerName}
          </Link>
        );
      }
      if (!assistName || !part.includes(assistName)) {
        elements.push(part);
      } else {
        const assistParts = part.split(assistName);
        assistParts.forEach((ap, j) => {
          if (j > 0) {
            elements.push(
              <Link key={`assist-${i}-${j}`} href={getPlayerHref({ id: event.assist!.id!, name: event.assist!.name! })} className="hover:underline transition-all" prefetch={false}>
                {assistName}
              </Link>
            );
          }
          elements.push(ap);
        });
      }
    });

    return elements;
  };

  // matchData prop이 변경될 때 이벤트 데이터 업데이트
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
  if (false) {
    return <MatchTabState title="경기 이벤트" message="불러오는 중..." />;
  }
  
  // 에러 상태 표시
  if (false) {
    return <ErrorState message="이벤트 데이터를 불러올 수 없습니다." />;
  }

  if (!events.length) {
    return <MatchTabState title="경기 이벤트" message="이벤트 데이터가 없습니다." />;
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
            // 한글 이름 포함한 이벤트 문장 생성
            const koreanText = mapEventToKoreanText(event, playerKoreanNames);

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
                  <Link
                    href={getTeamHref(event.team || { id: 0 })}
                    className="flex items-center gap-1.5 group min-w-0"
                  prefetch={false}
                  >
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
