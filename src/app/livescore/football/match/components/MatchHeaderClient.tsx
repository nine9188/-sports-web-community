'use client';

import Image from 'next/image';

// 이벤트 인터페이스 정의
interface MatchEvent {
  time: {
    elapsed: number;
    extra?: number;
  };
  team: {
    id: number;
    name: string;
    logo?: string;
  };
  player: {
    id: number;
    name: string;
  };
  assist?: {
    id?: number;
    name?: string;
  };
  type: string;
  detail: string;
  comments?: string;
}

interface MatchHeaderClientProps {
  league: {
    id: number;
    name: string;
    logo: string;
  };
  status: {
    long: string;
    short: string;
    elapsed?: number;
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
    };
    away: {
      id: number;
      name: string;
      formation: string;
      logo: string;
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
  events: MatchEvent[];
}

export default function MatchHeaderClient({ 
  league,
  status,
  fixture,
  teams,
  score,
  goals,
  events
}: MatchHeaderClientProps) {
  const getMatchStatus = () => {
    const shortStatus = status?.short ?? '';
      
    if (['1H', '2H', 'LIVE', 'INPLAY'].includes(shortStatus)) {
      return `${status.elapsed}'`;
    } else if (shortStatus === 'HT') {
      return '하프타임';
    } else if (['FT', 'AET', 'PEN'].includes(shortStatus)) {
      return '경기 종료';
    } else if (shortStatus === 'NS') {
      return '경기 예정';
    } else {
      return status?.long ?? '';
    }
  };

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
                />
              )}
            </div>
            <span className="text-sm font-medium">{league?.name}</span>
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
              {fixture?.date ? 
                new Date(fixture.date).toLocaleString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })
                : 'Date Not Available'}
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
                <Image 
                  src={teams.home.logo}
                  alt={teams.home.name}
                  fill
                  className="object-contain"
                  unoptimized={true}
                />
              </div>
              <div className="font-bold text-sm md:text-base">{teams.home.name}</div>
              <div className="text-xs md:text-sm text-gray-600">{teams.home.formation}</div>
            </div>

            {/* 스코어 */}
            <div className="w-1/3 md:w-1/3 text-center self-center whitespace-nowrap">
              <div className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">
                {goals.home} - {goals.away}
              </div>
              <div className="space-y-0 md:space-y-1 text-xs md:text-sm text-gray-600">
                <div>HT: {score.halftime.home} - {score.halftime.away}</div>
                <div>FT: {score.fulltime.home} - {score.fulltime.away}</div>
              </div>
            </div>

            {/* 원정팀 */}
            <div className="w-1/3 md:w-1/3 text-center">
              <div className="relative w-12 h-12 md:w-16 md:h-16 mx-auto mb-1 md:mb-2">
                <Image 
                  src={teams.away.logo}
                  alt={teams.away.name}
                  fill
                  className="object-contain"
                  unoptimized={true}
                />
              </div>
              <div className="font-bold text-sm md:text-base">{teams.away.name}</div>
              <div className="text-xs md:text-sm text-gray-600">{teams.away.formation}</div>
            </div>
          </div>

          {/* 득점자 목록 */}
          {goalEvents.length > 0 && (
            <div className="flex flex-col md:flex-row mt-4 md:mt-6 border-t pt-4">
              {/* 홈팀 득점자 */}
              <div className="w-full md:w-5/12 relative pl-2 md:pl-0 md:pr-2 mb-4 md:mb-0">
                {/* 홈팀 헤더 - 모바일에서만 표시 */}
                <div className="md:hidden py-1 font-semibold mb-2 text-sm flex items-center">
                  <div className="relative w-4 h-4 mr-2">
                    <Image 
                      src={teams.home.logo}
                      alt={teams.home.name}
                      fill
                      className="object-contain"
                      unoptimized={true}
                    />
                  </div>
                  {teams.home.name}
                </div>
                
                <div className="space-y-1">
                  {goalEvents
                    .filter(event => event.team.name === teams.home.name)
                    .map((goal, index) => (
                      <div key={`${goal.time.elapsed}-${index}`} className="text-sm text-gray-600 flex items-start">
                        <div className="w-8 md:w-20 text-left md:text-right flex-shrink-0 md:pr-4 relative">
                          <span className="md:absolute md:right-0">⚽</span>
                        </div>
                        <div>
                          {goal.player.name} {goal.time.elapsed}&apos;
                          {goal.assist?.name && (
                            <span className="text-xs text-gray-500">
                              (A: {goal.assist.name})
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
              {goalEvents.filter(event => event.team.name === teams.home.name).length > 0 && 
               goalEvents.filter(event => event.team.name === teams.away.name).length > 0 && 
               <div className="md:hidden w-full border-t border-gray-200 my-3"></div>}

              {/* 원정팀 득점자 */}
              <div className="w-full md:w-5/12 relative pl-2">
                {/* 원정팀 헤더 - 모바일에서만 표시 */}
                <div className="md:hidden py-1 font-semibold mb-2 text-sm flex items-center">
                  <div className="relative w-4 h-4 mr-2">
                    <Image 
                      src={teams.away.logo}
                      alt={teams.away.name}
                      fill
                      className="object-contain"
                      unoptimized={true}
                    />
                  </div>
                  {teams.away.name}
                </div>
                
                <div className="space-y-1">
                  {goalEvents
                    .filter(event => event.team.name === teams.away.name)
                    .map((goal, index) => (
                      <div key={`${goal.time.elapsed}-${index}`} className="text-sm text-gray-600 flex items-start">
                        <div className="w-8 md:w-20 text-left md:text-right flex-shrink-0 md:pr-4 relative">
                          <span className="md:absolute md:right-0">⚽</span>
                        </div>
                        <div>
                          {goal.player.name} {goal.time.elapsed}&apos;
                          {goal.assist?.name && (
                            <span className="text-xs text-gray-500">
                              (A: {goal.assist.name})
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