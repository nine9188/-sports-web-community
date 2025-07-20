'use client';

import { useState, useEffect } from 'react';
import { LoadingState, ErrorState, EmptyState } from '@/domains/livescore/components/common/CommonComponents';
import ApiSportsImage from '@/shared/components/ApiSportsImage';
import { ImageType } from '@/shared/types/image';
import { useTeamData } from './context/TeamDataContext';

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
  team?: { 
    team?: TeamData; 
    venue?: VenueData | null;
  } | TeamData | Record<string, unknown>;
  teamId?: string;  // 직접 데이터를 불러와야 할 경우 사용
  isLoading?: boolean;
  error?: string | null;
}

export default function TeamHeader({ team, teamId, isLoading: externalLoading, error: externalError }: TeamHeaderProps) {
  const { teamData } = useTeamData();
  const [internalTeam, setInternalTeam] = useState<TeamHeaderProps['team']>(team || teamData?.team);
  const [internalLoading, setInternalLoading] = useState(!team && !teamData?.team && !!teamId);
  const [internalError, setInternalError] = useState<string | null>(null);
  
  // 외부에서 제공된 데이터가 없고 teamId가 제공된 경우, 직접 데이터 로드
  useEffect(() => {
    if (team) {
      setInternalTeam(team);
      setInternalLoading(false);
      return;
    }

    // 컨텍스트에서 teamData가 있으면 사용
    if (teamData?.team) {
      setInternalTeam(teamData.team);
      setInternalLoading(false);
      return;
    }

    if (!teamId) {
      setInternalError("팀 ID나 팀 데이터가 필요합니다.");
      setInternalLoading(false);
      return;
    }

    // teamId가 있는 경우 데이터를 불러오는 로직을 추가할 수 있음
    // 예: loadTeamData(teamId)
    // 여기서는 직접 데이터를 불러오지 않고 외부에서 주입받도록 변경
    setInternalLoading(false);
  }, [team, teamId, teamData]);

  // team prop이 변경되면 내부 상태 업데이트
  useEffect(() => {
    if (team) {
      setInternalTeam(team);
      setInternalLoading(false);
    } else if (teamData?.team) {
      setInternalTeam(teamData.team);
      setInternalLoading(false);
    }
  }, [team, teamData]);
  
  // 로딩 상태 처리 - 외부 로딩 상태를 우선적으로 사용
  const isLoadingState = externalLoading !== undefined ? externalLoading : internalLoading;
  
  // 에러 상태 처리 - 외부 에러를 우선적으로 사용
  const errorState = externalError || internalError;
  
  // 로딩 상태 표시
  if (isLoadingState) {
    return <LoadingState message="팀 정보를 불러오는 중..." />;
  }

  // 에러 상태 처리
  if (errorState) {
    return <ErrorState message={errorState} />;
  }

  // 팀 데이터가 없는 경우 처리
  if (!internalTeam || (typeof internalTeam === 'object' && Object.keys(internalTeam).length === 0)) {
    return <EmptyState title="팀 정보가 없습니다" message="현재 이 팀에 대한 정보를 제공할 수 없습니다." />;
  }
  
  // API 응답이 중첩되어 있는지 확인 후 적절한 구조 추출
  let teamInfo: TeamData;
  let venue: VenueData | null;
  
  // API 응답 구조에 따라 데이터 추출 방식 분기
  if ('team' in internalTeam && internalTeam.team) {
    teamInfo = internalTeam.team as TeamData;
    venue = 'venue' in internalTeam && internalTeam.venue ? internalTeam.venue as VenueData : null;
  } else if ('id' in internalTeam && 'name' in internalTeam) {
    teamInfo = internalTeam as TeamData;
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
    <div className="mb-4 bg-white rounded-lg border overflow-hidden  mt-4 md:mt-0">
      <div className="flex flex-col md:flex-row items-start">
        {/* 팀 로고 및 기본 정보 */}
        <div className="flex items-center p-2 md:p-4 md:w-96 flex-shrink-0">
          <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0 mr-3 md:mr-4">
            <ApiSportsImage
              imageId={teamInfo.id}
              imageType={ImageType.Teams}
              alt={`${teamInfo.name} 로고`}
              width={80}
              height={80}
              className="object-contain w-16 h-16 md:w-20 md:h-20"
            />
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
                {venue.image && (
                  (() => {
                    // venue.image URL에서 venue ID 추출 시도
                    let venueId = venue.id;
                    if (!venueId && venue.image.includes('api-sports.io')) {
                      const match = venue.image.match(/venues\/(\d+)/);
                      if (match) {
                        venueId = parseInt(match[1]);
                      }
                    }
                    

                    
                    return (
                      <ApiSportsImage
                        imageId={venueId || teamInfo.id}
                        imageType={ImageType.Venues}
                        alt={`${venue.name} 경기장`}
                        width={144}
                        height={96}
                        className="object-cover w-24 h-16 md:w-36 md:h-24"
                      />
                    );
                  })()
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-base">{venue.name}</h3>
                <div className="text-xs text-gray-600">
                  {venue.city && <span className="block">{venue.city}</span>}
                  {venue.address && <span className="block">{venue.address}</span>}
                </div>
                <div className="mt-1 flex flex-wrap gap-3 text-xs">
                  {venue.capacity && venue.capacity > 0 && (
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