'use client';

import React, { memo } from 'react';
import Image from 'next/image';
import { useMatchData } from '../../match/context/MatchDataContext';
import { formatDateToKorean } from '@/app/utils/dateUtils';
import { ErrorState, LoadingState } from '@/app/livescore/football/components/CommonComponents';

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
} from '@/app/constants/teams/premier-league/premier-teams';

// 선수 데이터 타입 정의
type PremierLeaguePlayer = 
  | { id: number; name: string; koreanName: string; } 
  | { id?: number; name: string; role?: string; korean_name: string; } 
  | { id: number; english_name: string; korean_name: string; }
  | { id: number; englishName: string; koreanName: string; };

// 매치 데이터 타입 정의
interface FixtureType {
  date?: string;
  status?: {
    short?: string;
    long?: string;
    elapsed?: number | null;
  };
  timestamp?: number;
}

interface LeagueType {
  name?: string;
  name_ko?: string;
  logo?: string;
  id?: number;
}

interface TeamType {
  id?: number;
  name?: string;
  name_ko?: string;
  logo?: string;
  formation?: string;
}

interface ScoreType {
  halftime?: {
    home?: number | null;
    away?: number | null;
  };
  fulltime?: {
    home?: number | null;
    away?: number | null;
  };
}

interface GoalsType {
  home?: number | null;
  away?: number | null;
}

interface MatchDataType {
  fixture?: FixtureType;
  league?: LeagueType;
  teams?: {
    home?: TeamType;
    away?: TeamType;
  };
  goals?: GoalsType;
  score?: ScoreType;
}

// 선수 이름 매핑 함수
const getPlayerKoreanName = (playerId: number): string | null => {
  if (!playerId) return null;

  // ID 기반으로 선수 찾기 및 한국어 이름 반환 로직
  const findPlayerById = (players: PremierLeaguePlayer[]) => {
    return players.find(player => 'id' in player && player.id === playerId);
  };

  // 각 팀별로 찾기 (ID가 확실한 선수들만)
  const player = 
    findPlayerById(liverpoolPlayers as PremierLeaguePlayer[]) || 
    findPlayerById(Arsenalplayers as PremierLeaguePlayer[]) || 
    findPlayerById(NewcastleUnitedplayers as PremierLeaguePlayer[]) || 
    findPlayerById(Chelseaplayers as PremierLeaguePlayer[]) || 
    findPlayerById(ManchesterCityplayers as PremierLeaguePlayer[]) || 
    findPlayerById(AstonVillaplayers as PremierLeaguePlayer[]) || 
    findPlayerById(Bournemouthplayers as PremierLeaguePlayer[]) || 
    findPlayerById(Fulhamplayers as PremierLeaguePlayer[]) || 
    findPlayerById(Brightonplayers as PremierLeaguePlayer[]) ||
    findPlayerById(NottinghamForestPlayers as PremierLeaguePlayer[]);

  if (!player) return null;

  // 다양한 형태의 한국어 이름 속성 반환
  if ('koreanName' in player && player.koreanName) return player.koreanName;
  if ('korean_name' in player && player.korean_name) return player.korean_name;
  
  // 추가 속성 체크 (영어 이름과 함께 있는 경우)
  if ('english_name' in player && 'korean_name' in player) return player.korean_name;
  if ('englishName' in player && 'koreanName' in player) return player.koreanName;
  
  return null;
};

// 경기 헤더 컴포넌트 - 메모이제이션 적용
const MatchHeader = memo(function MatchHeader() {
  // 컨텍스트에서 데이터 가져오기
  const { 
    matchData, 
    eventsData, 
    isLoading, 
    error 
  } = useMatchData();

  // 데이터가 없고 로딩 중일 때만 로딩 UI 표시
  if (!matchData && isLoading) {
    return <LoadingState message="경기 정보를 불러오는 중..." />;
  }
  
  if (error) {
    return <ErrorState message={error} />;
  }
  
  if (!matchData) {
    return <ErrorState message="경기 정보를 불러올 수 없습니다." />;
  }

  const typedMatchData = matchData as MatchDataType;
  const fixture = typedMatchData.fixture as FixtureType | undefined;
  const homeTeam = typedMatchData.teams?.home;
  const awayTeam = typedMatchData.teams?.away;
  const league = typedMatchData.league;
  const status = fixture?.status;
  const score = {
    home: typedMatchData.goals?.home,
    away: typedMatchData.goals?.away,
    halftime: typedMatchData.score?.halftime,
    fulltime: typedMatchData.score?.fulltime
  };

  // 경기 상태 텍스트 계산
  const getMatchStatus = () => {
    const shortStatus = status?.short ?? '';
      
    if (['1H', '2H', 'LIVE', 'INPLAY'].includes(shortStatus)) {
      return `${status?.elapsed}'`;
    } else if (shortStatus === 'HT') {
      return '전반 종료';
    } else if (shortStatus === 'FT') {
      return '경기 종료';
    } else if (shortStatus === 'AET') {
      return '연장 종료';
    } else if (shortStatus === 'PEN') {
      return '승부차기 종료';
    } else if (shortStatus === 'NS') {
      return '경기 예정';
    } else {
      return status?.long ?? '';
    }
  };

  // 날짜 포맷팅
  const getFormattedDate = () => {
    if (!fixture?.date) return '-';
    
    try {
      return formatDateToKorean(new Date(fixture.date));
    } catch {
      return '-';
    }
  };

  // 득점자 목록 작성 - 일반 골만 필터링
  const goalEvents = eventsData?.filter(event => {
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
                  alt={league?.name || ''}
                  fill
                  className="object-contain"
                  unoptimized={true}
                  priority={true}
                />
              )}
            </div>
            <span className="text-sm font-medium">
              {/* 한국어 리그명 우선 표시, 없으면 일반 이름 */}
              {league?.name_ko || league?.name}
            </span>
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
              {getFormattedDate()}
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
                {homeTeam?.logo && (
                  <Image 
                    src={homeTeam.logo}
                    alt={homeTeam.name || ''}
                    fill
                    className="object-contain"
                    unoptimized={true}
                    priority={true}
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
            <div className="w-1/3 md:w-1/3 text-center self-center whitespace-nowrap">
              <div className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">
                {score.home !== null && score.home !== undefined ? score.home : '-'} - {score.away !== null && score.away !== undefined ? score.away : '-'}
              </div>
              <div className="space-y-0 md:space-y-1 text-xs md:text-sm text-gray-500">
                {score.halftime?.home !== null && score.halftime?.home !== undefined && 
                 score.halftime?.away !== null && score.halftime?.away !== undefined ? (
                  <div>전반 종료: {score.halftime.home} - {score.halftime.away}</div>
                ) : null}
                {score.fulltime?.home !== null && score.fulltime?.home !== undefined && 
                 score.fulltime?.away !== null && score.fulltime?.away !== undefined ? (
                  <div>경기 종료: {score.fulltime.home} - {score.fulltime.away}</div>
                ) : status?.short === 'NS' ? (
                  <div>경기 예정</div>
                ) : null}
              </div>
            </div>

            {/* 원정팀 */}
            <div className="w-1/3 md:w-1/3 text-center">
              <div className="relative w-12 h-12 md:w-16 md:h-16 mx-auto mb-1 md:mb-2">
                {awayTeam?.logo && (
                  <Image 
                    src={awayTeam.logo}
                    alt={awayTeam.name || ''}
                    fill
                    className="object-contain"
                    unoptimized={true}
                    priority={true}
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
              <div className="w-full md:w-5/12 relative pl-2 md:pl-0 md:pr-2 mb-4 md:mb-0">
                {/* 홈팀 헤더 - 모바일에서만 표시 */}
                <div className="md:hidden py-1 font-semibold mb-2 text-sm flex items-center">
                  <div className="relative w-4 h-4 mr-2">
                    {homeTeam?.logo && (
                      <Image 
                        src={homeTeam.logo}
                        alt={homeTeam.name || ''}
                        fill
                        className="object-contain"
                        unoptimized={true}
                      />
                    )}
                  </div>
                  {/* 한국어 팀명 우선 표시 */}
                  {homeTeam?.name_ko || homeTeam?.name}
                </div>
                
                <div className="space-y-1">
                  {goalEvents
                    .filter(event => {
                      const teamId = event.team?.id;
                      return teamId === homeTeam?.id;
                    })
                    .map((goal, index) => (
                      <div key={`${goal.time.elapsed}-${index}`} className="text-sm text-gray-600 flex items-start">
                        <div className="w-8 md:w-20 text-left md:text-right flex-shrink-0 md:pr-4 relative">
                          <span className="md:absolute md:right-0">⚽</span>
                        </div>
                        <div>
                          {getPlayerKoreanName(goal.player.id) || goal.player.name} {goal.time.elapsed}′
                          {goal.assist?.name && (
                            <span className="text-xs text-gray-500">
                              (A: {goal.assist.id ? (getPlayerKoreanName(goal.assist.id) || goal.assist.name) : goal.assist.name})
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
              {goalEvents.filter(event => event.team.id === homeTeam?.id).length > 0 && 
               goalEvents.filter(event => event.team.id === awayTeam?.id).length > 0 && 
               <div className="md:hidden w-full border-t border-gray-200 my-3"></div>}

              {/* 원정팀 득점자 */}
              <div className="w-full md:w-5/12 relative pl-2">
                {/* 원정팀 헤더 - 모바일에서만 표시 */}
                <div className="md:hidden py-1 font-semibold mb-2 text-sm flex items-center">
                  <div className="relative w-4 h-4 mr-2">
                    {awayTeam?.logo && (
                      <Image 
                        src={awayTeam.logo}
                        alt={awayTeam.name || ''}
                        fill
                        className="object-contain"
                        unoptimized={true}
                      />
                    )}
                  </div>
                  {/* 한국어 팀명 우선 표시 */}
                  {awayTeam?.name_ko || awayTeam?.name}
                </div>
                
                <div className="space-y-1">
                  {goalEvents
                    .filter(event => {
                      const teamId = event.team?.id;
                      return teamId === awayTeam?.id;
                    })
                    .map((goal, index) => (
                      <div key={`${goal.time.elapsed}-${index}`} className="text-sm text-gray-600 flex items-start">
                        <div className="w-8 md:w-20 text-left md:text-right flex-shrink-0 md:pr-4 relative">
                          <span className="md:absolute md:right-0">⚽</span>
                        </div>
                        <div>
                          {getPlayerKoreanName(goal.player.id) || goal.player.name} {goal.time.elapsed}′
                          {goal.assist?.name && (
                            <span className="text-xs text-gray-500">
                              (A: {goal.assist.id ? (getPlayerKoreanName(goal.assist.id) || goal.assist.name) : goal.assist.name})
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
});

export default MatchHeader; 