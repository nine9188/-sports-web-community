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
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex flex-col md:flex-row items-start gap-6">
        {/* 팀 로고 및 기본 정보 */}
        <div className="flex items-start gap-6">
          <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0">
            {teamInfo.logo ? (
              <Image
                src={teamInfo.logo}
                alt={`${teamInfo.name} 로고`}
                width={128}
                height={128}
                className="object-contain w-full h-full"
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                로고 없음
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{teamInfo.name || '팀명 없음'}</h1>
            {teamInfo.country && (
              <p className="text-gray-600 mt-1">{teamInfo.country}</p>
            )}
            {teamInfo.founded && teamInfo.founded > 0 && (
              <p className="text-gray-500 text-sm mt-2">창단: {teamInfo.founded}년</p>
            )}
            {teamInfo.code && (
              <div className="mt-2 inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                {teamInfo.code}
              </div>
            )}
          </div>
        </div>

        {/* 홈구장 정보 */}
        {venue && (
          <div className="flex-1 mt-4 md:mt-0 md:ml-8 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-8">
            <h2 className="text-lg font-semibold mb-2">홈 구장</h2>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative w-full md:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
                {venue.image ? (
                  <Image
                    src={venue.image}
                    alt={`${venue.name} 경기장`}
                    width={192}
                    height={128}
                    className="object-cover w-full h-full"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                    이미지 없음
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-medium">{venue.name}</h3>
                {venue.city && (
                  <p className="text-sm text-gray-600 mt-1">{venue.city}</p>
                )}
                {venue.address && (
                  <p className="text-sm text-gray-600">{venue.address}</p>
                )}
                <div className="mt-2 flex flex-col md:flex-row gap-2 md:gap-4">
                  {venue.capacity > 0 && (
                    <div>
                      <p className="text-sm text-gray-500">수용 인원</p>
                      <p className="font-medium">{venue.capacity.toLocaleString()}명</p>
                    </div>
                  )}
                  {venue.surface && (
                    <div>
                      <p className="text-sm text-gray-500">경기장 표면</p>
                      <p className="font-medium">{venue.surface}</p>
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