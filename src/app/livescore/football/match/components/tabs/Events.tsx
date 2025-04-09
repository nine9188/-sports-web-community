'use client';

import Image from 'next/image';
import { FaFutbol } from 'react-icons/fa';
import { BsCardText, BsCardHeading } from "react-icons/bs";
import { IoMdSwap } from 'react-icons/io';

interface Event {
  time: {
    elapsed: number;
    extra?: number | null;
  };
  team: {
    id: number;
    name: string;
    logo: string;
  };
  player: {
    id: number;
    name: string;
  };
  assist?: {
    id: number | null;
    name: string | null;
  };
  type: string;
  detail: string;
  comments?: string | null;
}

interface EventsProps {
  matchData: {
    events: Event[];
    data?: Record<string, unknown>;
    lineups?: Record<string, unknown>;
    stats?: Record<string, unknown>;
    standings?: Record<string, unknown>;
    playersStats?: Record<string, unknown>;
  };
}

export default function Events({ matchData }: EventsProps) {
  const iconClass = "text-xl";

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
      <div className="w-6 h-6 relative flex-shrink-0 overflow-hidden">
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

  if (!matchData.events.length) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 mx-auto text-gray-400 mb-4" 
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
          <p className="text-sm text-gray-500 mt-2">현재 이 경기에 대한 이벤트 정보를 제공할 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matchData.events.map((event, index) => (
        <div 
          key={`${event.time.elapsed}-${index}`}
          className="flex gap-4 p-3 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
        >
          <div className="w-16 text-right text-sm text-gray-600 flex-shrink-0">
            <span>
              {event.time.elapsed}
              {event.time.extra && event.time.extra > 0 && `+${event.time.extra}`}′
            </span>
          </div>
          
          <div className="flex-1">
            <div className="flex gap-3">
              <div className="mt-1 flex-shrink-0 w-5 h-5 flex items-center justify-center">
                {renderEventIcon(event.type, event.detail)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <TeamLogo logo={event.team.logo} name={event.team.name} />
                  <span className="text-sm text-gray-600">{event.team.name}</span>
                </div>
                <p className="font-medium">
                  {event.player.name}
                  {event.assist && event.assist.name && (
                    <span className="text-sm text-gray-500 ml-1">
                      (어시스트: {event.assist.name})
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-600">
                  {event.detail}
                  {event.comments && ` - ${event.comments}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}