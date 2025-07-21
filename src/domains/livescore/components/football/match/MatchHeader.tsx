'use client';

import React, { memo, useMemo } from 'react';
import ApiSportsImage from '@/shared/components/ApiSportsImage';
import { ImageType } from '@/shared/types/image';

import { useMatchData } from '@/domains/livescore/components/football/match/context/MatchDataContext';
import { formatDateToKorean } from '@/domains/livescore/utils/dateUtils';
import { ErrorState, LoadingState } from '@/domains/livescore/components/common/CommonComponents';
import { MatchEvent } from '@/domains/livescore/types/match';

// MatchData 타입 정의
interface MatchDataType {
  fixture?: {
    date?: string;
    status?: {
      short?: string;
      long?: string;
      elapsed?: number | null;
    };
    venue?: {
      id?: number;
      name?: string;
      city?: string;
    };
  };
  league?: {
    id?: number;
    name?: string;
    name_ko?: string;
    logo?: string;
  };
  teams?: {
    home?: {
      id?: number;
      name?: string;
      name_ko?: string;
      logo?: string;
      formation?: string;
    };
    away?: {
      id?: number;
      name?: string;
      name_ko?: string;
      logo?: string;
      formation?: string;
    };
  };
  goals?: {
    home?: number | null;
    away?: number | null;
  };
  score?: {
    penalty?: {
      home?: number | null;
      away?: number | null;
    };
    extratime?: {
      home?: number | null;
      away?: number | null;
    };
  };
}

// 프리미어리그 팀 선수 데이터 불러오기
import { 
  liverpoolPlayers, 
  NottinghamForestPlayers, 
  Arsenalplayers, 
  NewcastleUnitedplayers, 
  Chelseaplayers, 
  ManchesterCityplayers, 
  AstonVillaplayers, 
  Bournemouthplayers, 
  Fulhamplayers, 
  Brightonplayers 
} from '@/domains/livescore/constants/teams/premier-league/premier-teams';

// 모든 프리미어리그 선수 데이터를 통합
const allPremierLeaguePlayers = [
  ...liverpoolPlayers,
  ...NottinghamForestPlayers,
  ...Arsenalplayers,
  ...NewcastleUnitedplayers,
  ...Chelseaplayers,
  ...ManchesterCityplayers,
  ...AstonVillaplayers,
  ...Bournemouthplayers,
  ...Fulhamplayers,
  ...Brightonplayers
];

// 선수 ID로 한국어 이름을 찾는 함수
function getKoreanPlayerName(playerId: number): string | null {
  const player = allPremierLeaguePlayers.find(p => {
    // 다양한 ID 속성 형태 처리
    return p.id === playerId;
  });

  if (!player) return null;

  // 다양한 한국어 이름 속성 형태 처리
  if ('koreanName' in player) return player.koreanName;
  if ('korean_name' in player) return player.korean_name;
  
  return null;
}

const MatchHeader = memo(() => {
  const { 
    matchData, 
    eventsData, 
    isLoading: contextLoading, 
    error: contextError 
  } = useMatchData();

  // 타입 캐스팅을 가장 먼저 처리
  const typedMatchData = matchData as MatchDataType;

  // 경기 기본 정보 메모이제이션 - 탭 변경과 무관하게 안정적으로 유지
  const matchInfo = useMemo(() => {
    if (!typedMatchData) {
      return null;
    }

    const fixture = typedMatchData?.fixture || {};
    const league = typedMatchData?.league || {};
    const homeTeam = typedMatchData?.teams?.home;
    const awayTeam = typedMatchData?.teams?.away;
    const homeGoals = typedMatchData?.goals?.home;
    const awayGoals = typedMatchData?.goals?.away;
    const score = typedMatchData?.score || {};

    return {
      fixture,
      league,
      homeTeam,
      awayTeam,
      homeGoals,
      awayGoals,
      score
    };
  }, [typedMatchData]);

  // 점수 및 상태 정보 메모이제이션
  const displayInfo = useMemo(() => {
    if (!matchInfo) {
      return { scoreDisplay: '0 - 0', statusText: '경기 정보 없음' };
    }

    const { homeGoals, awayGoals, score, fixture } = matchInfo;
    const currentScore = `${homeGoals ?? 0} - ${awayGoals ?? 0}`;
    
    let scoreDisplay = currentScore;
    // 승부차기 정보가 있는 경우
    if (score?.penalty && score.penalty.home !== null && score.penalty.away !== null) {
      scoreDisplay = `${currentScore} (승부차기 ${score.penalty.home}-${score.penalty.away})`;
    }
    // 연장전 정보가 있는 경우
    else if (score?.extratime && score.extratime.home !== null && score.extratime.away !== null) {
      scoreDisplay = `${currentScore} (연장 ${score.extratime.home}-${score.extratime.away})`;
    }

    // 경기 상태 텍스트
    const status = fixture?.status?.short;
    const elapsed = fixture?.status?.elapsed;
    
    let statusText = '경기 정보 없음';
    switch (status) {
      case 'TBD': statusText = '경기 일정 미정'; break;
      case 'NS': statusText = '경기 시작 전'; break;
      case '1H': statusText = `전반 ${elapsed || 0}분`; break;
      case 'HT': statusText = '하프타임'; break;
      case '2H': statusText = `후반 ${elapsed || 45}분`; break;
      case 'ET': statusText = `연장전 ${elapsed || 90}분`; break;
      case 'P': statusText = '승부차기'; break;
      case 'FT': statusText = '경기 종료'; break;
      case 'AET': statusText = '연장전 종료'; break;
      case 'PEN': statusText = '승부차기 종료'; break;
      case 'SUSP': statusText = '경기 중단'; break;
      case 'INT': statusText = '경기 중단'; break;
      case 'CANC': statusText = '경기 취소'; break;
      case 'ABD': statusText = '경기 중단'; break;
      case 'PST': statusText = '경기 연기'; break;
      case 'AWD': statusText = '몰수 승'; break;
      case 'WO': statusText = '부전승'; break;
      case 'LIVE': statusText = `진행 중 ${elapsed || 0}분`; break;
      default: statusText = status || '알 수 없음'; break;
    }

    return {
      scoreDisplay,
      statusText
    };
  }, [matchInfo]);

  // 헤더는 기본 경기 정보만 필요하므로 탭 로딩과 분리
  // 기본 매치 데이터가 있으면 헤더를 표시하고, 탭별 로딩은 무시
  const hasBasicMatchData = matchInfo && 
    matchInfo.fixture && 
    matchInfo.homeTeam && 
    matchInfo.awayTeam;

  // 로딩 상태 - 기본 경기 정보가 없을 때만 로딩 표시
  if (contextLoading && !hasBasicMatchData) {
    return <LoadingState message="경기 정보를 불러오는 중..." />;
  }

  // 에러 상태 - 기본 경기 정보가 없고 에러가 있을 때만 표시
  if (contextError && !hasBasicMatchData) {
    return <ErrorState message={contextError} />;
  }

  // 매치 데이터가 없는 경우 - 기본 경기 정보가 없을 때만 에러 표시
  if (!hasBasicMatchData) {
    return <ErrorState message="경기 데이터를 찾을 수 없습니다." />;
  }

    const { fixture, league, homeTeam, awayTeam } = matchInfo;

  // 득점자 목록 작성 - 일반 골만 필터링
  const goalEvents = eventsData?.filter((event: MatchEvent) => {
    // Goal cancelled나 VAR로 취소된 골은 제외
    if (event.detail?.toLowerCase().includes('cancelled') || 
        event.type?.toLowerCase() === 'var') {
      return false;
    }
    
    // 실제 골만 포함
    return event.type?.toLowerCase() === 'goal' && 
           event.detail?.toLowerCase().includes('goal');
  }) || [];

  // 리그 및 팀 로고 스토리지 URL 생성


  return (
    <div className="w-full md:max-w-screen-xl md:mx-auto">
      {/* 통합된 매치 헤더 카드 */}
      <div className="mt-4 md:mt-0 mb-4 bg-white rounded-lg border overflow-hidden">
        {/* 리그 정보 및 경기 상태 */}
        <div className="flex flex-col md:flex-row md:items-center border-b">
          {/* 리그 정보 - 왼쪽 1/3 차지 */}
          <div className="flex items-center gap-2 px-2 py-2 md:px-4 border-b md:border-b-0 md:border-r md:w-1/3">
            <div className="relative w-6 h-6 flex items-center justify-center">
              {league?.id && (
                <ApiSportsImage
                  imageId={league.id}
                  imageType={ImageType.Leagues}
                  alt={league?.name || ''}
                  width={24}
                  height={24}
                  className="object-contain w-full h-full"
                />
              )}
            </div>
            <span className="text-sm font-medium">
              {/* 한국어 리그명 우선 표시, 없으면 일반 이름 */}
              {league?.name_ko || league?.name}
            </span>
          </div>

          {/* 경기 상태 및 시간 - 중앙 1/3 차지 */}
          <div className="flex flex-col items-center justify-center px-2 py-2 md:px-4 md:w-1/3 border-b md:border-b-0 md:border-r">
            <div className="text-xs text-gray-500 mb-1">
              {fixture?.date ? formatDateToKorean(new Date(fixture.date)) : '날짜 정보 없음'}
            </div>
            <div className="text-sm font-medium text-center">
              {displayInfo.statusText}
            </div>
          </div>

          {/* 경기장 정보 - 오른쪽 1/3 차지 */}
          <div className="px-2 py-2 md:px-4 md:w-1/3 text-center">
            {fixture?.venue?.name && (
              <div className="text-xs text-gray-600">{fixture.venue.name}</div>
            )}
            {fixture?.venue?.city && (
              <div className="text-xs text-gray-500">{fixture.venue.city}</div>
            )}
          </div>
        </div>

        <div className="px-2 py-3 md:px-4 md:py-4">
          {/* 팀 정보 영역 */}
          <div className="flex items-center justify-between">
            {/* 홈팀 */}
            <div className="w-1/3 md:w-1/3 text-center">
              <div className="relative w-12 h-12 md:w-16 md:h-16 mx-auto mb-1 md:mb-2 flex items-center justify-center">
                {homeTeam?.id && (
                  <ApiSportsImage
                    imageId={homeTeam.id}
                    imageType={ImageType.Teams}
                    alt={homeTeam.name || ''}
                    width={48}
                    height={48}
                    className="object-contain w-full h-full"
                  />
                )}
              </div>
              {/* 한국어 팀명 우선 표시, 없으면 일반 이름 */}
              <div className="font-bold text-sm md:text-base">{homeTeam?.name_ko || homeTeam?.name}</div>
              {homeTeam?.formation && (
                <div className="text-xs md:text-sm text-gray-600">{homeTeam.formation}</div>
              )}
            </div>

            {/* 스코어 */}
            <div className="w-1/3 text-center">
              <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                {displayInfo.scoreDisplay}
              </div>
              <div className="text-xs md:text-sm text-gray-500">
                {fixture?.status?.long}
              </div>
            </div>

            {/* 원정팀 */}
            <div className="w-1/3 md:w-1/3 text-center">
              <div className="relative w-12 h-12 md:w-16 md:h-16 mx-auto mb-1 md:mb-2 flex items-center justify-center">
                {awayTeam?.id && (
                  <ApiSportsImage
                    imageId={awayTeam.id}
                    imageType={ImageType.Teams}
                    alt={awayTeam.name || ''}
                    width={48}
                    height={48}
                    className="object-contain w-full h-full"
                  />
                )}
              </div>
              {/* 한국어 팀명 우선 표시, 없으면 일반 이름 */}
              <div className="font-bold text-sm md:text-base">{awayTeam?.name_ko || awayTeam?.name}</div>
              {awayTeam?.formation && (
                <div className="text-xs md:text-sm text-gray-600">{awayTeam.formation}</div>
              )}
            </div>
          </div>

          {/* 득점자 목록 */}
          {goalEvents.length > 0 && (
            <div className="flex flex-col md:flex-row mt-4 md:mt-6 border-t pt-4">
              {/* 홈팀 득점자 */}
              <div className="w-full md:w-1/3 relative pl-2 md:px-2 mb-4 md:mb-0 md:text-center">
                {/* 홈팀 헤더 - 모바일에서만 표시 */}
                <div className="md:hidden py-1 font-semibold mb-2 text-sm flex items-center">
                  <div className="relative w-4 h-4 mr-2 flex items-center justify-center">
                    {homeTeam?.id && (
                      <ApiSportsImage
                        imageId={homeTeam.id}
                        imageType={ImageType.Teams}
                        alt={homeTeam.name || ''}
                        width={16}
                        height={16}
                        className="object-contain w-full h-full"
                      />
                    )}
                  </div>
                  {/* 한국어 팀명 우선 표시 */}
                  {homeTeam?.name_ko || homeTeam?.name}
                </div>
                
                <div className="space-y-1">
                  {goalEvents
                    .filter((event: MatchEvent) => event.team?.id === homeTeam?.id)
                    .map((event: MatchEvent, index: number) => {
                      const koreanName = getKoreanPlayerName(event.player?.id || 0);
                      const displayName = koreanName || event.player?.name || '알 수 없음';
                      
                      return (
                        <div key={index} className="text-sm text-gray-700">
                          <span className="font-medium">{displayName}</span>
                          <span className="text-gray-500 ml-1">{event.time?.elapsed}&apos;</span>
                          {event.assist?.name && (
                            <div className="text-xs text-gray-500 ml-4">
                              어시스트: {event.assist.name}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* 중앙 vs 구분선 */}
              <div className="hidden md:flex md:w-1/3 items-center justify-center">
                <div className="text-gray-400 font-medium">득점자</div>
              </div>

              {/* 원정팀 득점자 */}
              <div className="w-full md:w-1/3 relative pl-2 md:px-2 md:text-center">
                {/* 원정팀 헤더 - 모바일에서만 표시 */}
                <div className="md:hidden py-1 font-semibold mb-2 text-sm flex items-center">
                  <div className="relative w-4 h-4 mr-2 flex items-center justify-center">
                    {awayTeam?.id && (
                      <ApiSportsImage
                        imageId={awayTeam.id}
                        imageType={ImageType.Teams}
                        alt={awayTeam.name || ''}
                        width={16}
                        height={16}
                        className="object-contain w-full h-full"
                      />
                    )}
                  </div>
                  {/* 한국어 팀명 우선 표시 */}
                  {awayTeam?.name_ko || awayTeam?.name}
                </div>
                
                <div className="space-y-1">
                  {goalEvents
                    .filter((event: MatchEvent) => event.team?.id === awayTeam?.id)
                    .map((event: MatchEvent, index: number) => {
                      const koreanName = getKoreanPlayerName(event.player?.id || 0);
                      const displayName = koreanName || event.player?.name || '알 수 없음';
                      
                      return (
                        <div key={index} className="text-sm text-gray-700">
                          <span className="font-medium">{displayName}</span>
                          <span className="text-gray-500 ml-1">{event.time?.elapsed}&apos;</span>
                          {event.assist?.name && (
                            <div className="text-xs text-gray-500 ml-4">
                              어시스트: {event.assist.name}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

MatchHeader.displayName = 'MatchHeader';

export default MatchHeader; 