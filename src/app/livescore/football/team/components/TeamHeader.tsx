'use client';

import Image from 'next/image';

// TeamStats 정의
interface TeamStats {
  league?: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
  };
  team?: {
    id: number;
    name: string;
    logo: string;
  };
  form?: string;
  fixtures?: {
    played: { home: number; away: number; total: number };
    wins: { home: number; away: number; total: number };
    draws: { home: number; away: number; total: number };
    loses: { home: number; away: number; total: number };
  };
}

// 팀 정보를 위한 기본 인터페이스
interface TeamData {
  id: number;
  name: string;
  code?: string;
  country?: string;
  founded?: number;
  national?: boolean;
  logo?: string;
}

// 경기장 정보를 위한 인터페이스
interface VenueData {
  id: number;
  name: string;
  address: string;
  city: string;
  capacity: number;
  surface: string;
  image: string;
}

// 팀 헤더 컴포넌트 props
interface TeamHeaderProps {
  team: { team: TeamData; venue: VenueData } | TeamData | Record<string, unknown>;
  stats?: TeamStats;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function TeamHeader({ team, stats }: TeamHeaderProps) {
  // API 응답이 중첩되어 있는지 확인 후 적절한 구조 추출
  let teamInfo: TeamData;
  let venue: VenueData | null;
  
  // API 응답 구조에 따라 데이터 추출 방식 분기
  if ('team' in team && 'venue' in team && team.team && team.venue) {
    teamInfo = team.team as TeamData;
    venue = team.venue as VenueData;
  } else if ('id' in team && 'name' in team) {
    teamInfo = team as TeamData;
    venue = null;
  } else {
    // 어떤 구조에도 맞지 않는 경우 기본값 제공
    teamInfo = {
      id: 0,
      name: '팀명 없음',
      code: '',
      country: '',
      founded: 0,
      national: false,
      logo: ''
    };
    venue = null;
  }

  return (
    <div className="mb-4 bg-white rounded-lg border overflow-hidden mt-4 md:mt-0">
      <div className="flex flex-col md:flex-row items-start">
        {/* 팀 로고 및 기본 정보 */}
        <div className="flex items-center p-2 md:p-4 md:w-96 flex-shrink-0">
          <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0 mr-3 md:mr-4">
            {teamInfo.logo ? (
              <Image
                src={teamInfo.logo}
                alt={`${teamInfo.name} 로고`}
                width={80}
                height={80}
                className="object-contain w-full h-full"
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                로고 없음
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-lg md:text-xl font-bold">{teamInfo.name || '팀명 없음'}</h1>
            {teamInfo.country && (
              <p className="text-gray-600 text-sm">{teamInfo.country}</p>
            )}
            <div className="flex items-center flex-wrap gap-2 mt-1">
              {teamInfo.founded && teamInfo.founded > 0 && (
                <p className="text-gray-500 text-xs">창단: {teamInfo.founded}년</p>
              )}
              {teamInfo.code && (
                <div className="inline-block px-1 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                  {teamInfo.code}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 홈구장 정보 */}
        {venue && (
          <div className="border-t md:border-t-0 md:border-l border-gray-200 p-2 md:p-4 flex-1">
            <div className="flex gap-3">
              <div className="relative w-24 h-16 md:w-36 md:h-24 rounded overflow-hidden flex-shrink-0">
                {venue.image ? (
                  <Image
                    src={venue.image}
                    alt={`${venue.name} 경기장`}
                    width={144}
                    height={96}
                    className="object-cover w-full h-full"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                    이미지 없음
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-base">{venue.name}</h3>
                <div className="text-xs text-gray-600">
                  {venue.city && <span className="block">{venue.city}</span>}
                  {venue.address && <span className="block">{venue.address}</span>}
                </div>
                <div className="mt-1 flex flex-wrap gap-3 text-xs">
                  {venue.capacity > 0 && (
                    <div className="whitespace-nowrap">
                      <span className="text-gray-500">수용 인원: </span>
                      <span className="font-medium">{venue.capacity.toLocaleString()}명</span>
                    </div>
                  )}
                  {venue.surface && (
                    <div className="whitespace-nowrap">
                      <span className="text-gray-500">표면: </span>
                      <span className="font-medium">{venue.surface}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 