'use client';

import { memo } from 'react';
import Image from 'next/image';
import { FaFutbol } from 'react-icons/fa';
import { BsCardText, BsCardHeading } from "react-icons/bs";
import { IoMdSwap } from 'react-icons/io';
import { MatchEvent } from '../../types';

interface EventsProps {
  matchData: {
    events?: MatchEvent[];
    data?: Record<string, unknown>;
    lineups?: Record<string, unknown>;
    stats?: Record<string, unknown>;
    standings?: Record<string, unknown>;
    playersStats?: Record<string, unknown>;
  };
}

// 메모이제이션을 적용하여 불필요한 리렌더링 방지
function Events({ matchData }: EventsProps) {
  const iconClass = "text-xl";
  const events = matchData.events || [];

  // 이벤트 타입에 따른 아이콘 렌더링
  const renderEventIcon = (type: string, detail: string) => {
    switch (type) {
      case 'Goal':
        return <FaFutbol className={`${iconClass} text-green-600`} title="골" />;
      case 'Card':
        return detail === 'Red Card' 
          ? <BsCardHeading className={`${iconClass} text-red-600`} title="레드카드" />
          : <BsCardText className={`${iconClass} text-yellow-400`} title="옐로카드" />;
      case 'subst':
        return <IoMdSwap className={`${iconClass} text-blue-500`} title="선수교체" />;
      default:
        // 아이콘이 없는 경우 빈 div를 반환하여 공간 유지
        return <div className={`${iconClass} w-5 h-5`}></div>;
    }
  };

  // 팀 로고 컴포넌트
  const TeamLogo = ({ logo, name }: { logo: string; name: string }) => {
    return (
      <div className="w-5 h-5 md:w-6 md:h-6 relative flex-shrink-0 overflow-hidden">
        <Image
          src={logo || '/placeholder-team.png'}
          alt={name || '팀'}
          width={24}
          height={24}
          className="w-full h-full object-contain"
          unoptimized
        />
      </div>
    );
  };

  if (!events.length) {
    return (
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
    );
  }

  return (
    <div className="-ml-4 md:ml-0 space-y-1 md:space-y-2">
      {events.map((event, index) => (
        <div 
          key={`${event.time?.elapsed || 0}-${index}`}
          className="flex items-start gap-1 md:gap-2 px-1 md:px-3 py-1 md:py-2 mb-1 md:mb-2 border-b last:border-b-0 last:mb-0"
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
              <TeamLogo logo={event.team?.logo || ''} name={event.team?.name || ''} />
              <span className="text-sm text-gray-600">{event.team?.name || 'Unknown Team'}</span>
            </div>
            <div className="mt-1.5 ml-5 md:ml-6">
              <span className="font-medium text-sm">
                {event.player?.name || 'Unknown Player'}
              </span>
              <span className="text-xs text-gray-600 ml-1 md:ml-2">
                {event.detail || ''}
                {event.comments && ` - ${event.comments}`}
              </span>
              {event.assist?.name && (
                <span className="text-xs text-gray-500 ml-1 md:ml-2">
                  (A: {event.assist.name})
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// 메모이제이션된 컴포넌트 내보내기
export default memo(Events);