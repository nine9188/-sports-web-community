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

interface MatchHeaderProps {
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

export default function MatchHeader({ 
  league,
  status,
  fixture,
  teams,
  score,
  goals,
  events
}: MatchHeaderProps) {
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
    <div className="w-full bg-white border-b md:max-w-screen-xl md:mx-auto">
      {/* 리그 정보 */}
      <div className="flex items-center gap-2 px-2 py-4 border-b md:px-4">
        <div className="relative w-10 h-10">
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
        <span className="font-bold">{league?.name}</span>
      </div>

      {/* 경기 상태 및 시간 */}
      <div className="text-center py-4 border-b px-0 md:px-4">
        <div className={`font-bold text-lg ${
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
        <div className="text-gray-600 text-sm mt-1">
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

      {/* 팀 정보 및 스코어 */}
      <div className="flex items-start justify-between px-0 py-4 md:px-4">
        {/* 홈팀 */}
        <div className="text-center flex-1">
          <div className="mb-4">
            <div className="relative w-16 h-16 mx-auto mb-2">
              <Image 
                src={teams.home.logo}
                alt={teams.home.name}
                fill
                className="object-contain"
                unoptimized={true}
              />
            </div>
            <div className="font-bold">{teams.home.name}</div>
            <div className="text-sm text-gray-600">{teams.home.formation}</div>
          </div>
          {/* 홈팀 골 정보 */}
          <div className="space-y-1">
            {goalEvents
              .filter(event => event.team.name === teams.home.name)
              .map((goal, index) => (
                <div key={`${goal.time.elapsed}-${index}`} className="text-sm text-gray-600">
                  ⚽ {goal.player.name} {goal.time.elapsed}&apos;
                  {goal.assist?.name && (
                    <span className="text-xs text-gray-500">
                      (A: {goal.assist.name})
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* 스코어 */}
        <div className="text-center">
          <div className="text-3xl font-bold mb-2">
            {goals.home} - {goals.away}
          </div>
          <div className="space-y-1 text-sm text-gray-600">
            <div>HT: {score.halftime.home} - {score.halftime.away}</div>
            <div>FT: {score.fulltime.home} - {score.fulltime.away}</div>
          </div>
        </div>

        {/* 원정팀 */}
        <div className="text-center flex-1">
          <div className="mb-4">
            <div className="relative w-16 h-16 mx-auto mb-2">
              <Image 
                src={teams.away.logo}
                alt={teams.away.name}
                fill
                className="object-contain"
                unoptimized={true}
              />
            </div>
            <div className="font-bold">{teams.away.name}</div>
            <div className="text-sm text-gray-600">{teams.away.formation}</div>
          </div>
          {/* 원정팀 골 정보 */}
          <div className="space-y-1">
            {goalEvents
              .filter(event => event.team.name === teams.away.name)
              .map((goal, index) => (
                <div key={`${goal.time.elapsed}-${index}`} className="text-sm text-gray-600">
                  ⚽ {goal.player.name} {goal.time.elapsed}&apos;
                  {goal.assist?.name && (
                    <span className="text-xs text-gray-500">
                      (A: {goal.assist.name})
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
} 