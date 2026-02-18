'use client';

import { EmptyState } from '@/domains/livescore/components/common/CommonComponents';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import { Container } from '@/shared/components/ui';
import { TeamResponse } from '@/domains/livescore/actions/teams/team';

// 4590 표준: placeholder 상수
const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';
const VENUE_PLACEHOLDER = '/images/placeholder-venue.svg';

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
  id?: number;
  name: string;
  address?: string;
  city?: string;
  capacity?: number;
  surface?: string;
  image?: string;
}

// 팀 헤더 컴포넌트 props
interface TeamHeaderProps {
  initialData?: TeamResponse;
  // 4590 표준: 이미지 Storage URL
  teamLogoUrl?: string;
  venueImageUrl?: string;
}

/**
 * 팀 헤더 컴포넌트
 *
 * 서버에서 미리 로드된 데이터를 props로 받아 렌더링합니다.
 * Context 의존성 제거로 더 단순하고 예측 가능한 동작.
 */
export default function TeamHeader({
  initialData,
  teamLogoUrl,
  venueImageUrl
}: TeamHeaderProps) {
  // 팀 데이터가 없는 경우 처리
  if (!initialData?.team) {
    return <EmptyState title="팀 정보가 없습니다" message="현재 이 팀에 대한 정보를 제공할 수 없습니다." />;
  }

  // 데이터 추출
  const teamInfo: TeamData = initialData.team.team as TeamData;
  const venue: VenueData | null = initialData.team.venue as VenueData | null;

  // 4590 표준: URL fallback
  const effectiveTeamLogoUrl = teamLogoUrl || TEAM_PLACEHOLDER;
  const effectiveVenueImageUrl = venueImageUrl || VENUE_PLACEHOLDER;



  return (
    <Container className="mb-4 bg-white dark:bg-[#1D1D1D]">
      <div className="flex flex-col md:flex-row items-stretch md:items-center">
        {/* 팀 로고 및 기본 정보 */}
        <div className="flex items-center p-3 md:p-4 md:w-80 flex-shrink-0">
          <div className="flex-shrink-0 mr-3">
            <UnifiedSportsImageClient
              src={effectiveTeamLogoUrl}
              alt={`${teamInfo.name} 로고`}
              width={48}
              height={48}
              loading="eager"
              className="object-contain"
            />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-[#F0F0F0]">{teamInfo.name || '팀명 없음'}</h1>
            {teamInfo.country && (
              <p className="text-gray-700 dark:text-gray-300 text-sm">{teamInfo.country}</p>
            )}
            <div className="flex items-center flex-wrap gap-2 mt-1">
              {teamInfo.founded && teamInfo.founded > 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-xs">창단: {teamInfo.founded}년</p>
              )}
              {teamInfo.code && (
                <div className="inline-block px-1 py-0.5 bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-300 text-xs font-medium rounded">
                  {teamInfo.code}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 홈구장 정보 */}
        {venue && (
          <div className="border-t md:border-t-0 md:border-l border-black/5 dark:border-white/10 p-2 md:p-4 flex-1">
            <div className="flex gap-3">
              <div className="relative w-24 h-16 md:w-36 md:h-24 rounded overflow-hidden flex-shrink-0">
                <UnifiedSportsImageClient
                  src={effectiveVenueImageUrl}
                  alt={`${venue.name} 경기장`}
                  width={144}
                  height={96}
                  loading="eager"
                  className="w-24 h-16 md:w-36 md:h-24 object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-base text-gray-900 dark:text-[#F0F0F0]">{venue.name}</h3>
                <div className="text-xs text-gray-700 dark:text-gray-300">
                  {venue.city && <span className="block">{venue.city}</span>}
                  {venue.address && <span className="block">{venue.address}</span>}
                </div>
                <div className="mt-1 flex flex-wrap gap-3 text-xs">
                  {venue.capacity && venue.capacity > 0 && (
                    <div className="whitespace-nowrap">
                      <span className="text-gray-500 dark:text-gray-400">수용 인원: </span>
                      <span className="font-medium">{venue.capacity.toLocaleString()}명</span>
                    </div>
                  )}
                  {venue.surface && (
                    <div className="whitespace-nowrap">
                      <span className="text-gray-500 dark:text-gray-400">표면: </span>
                      <span className="font-medium">{venue.surface}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
} 