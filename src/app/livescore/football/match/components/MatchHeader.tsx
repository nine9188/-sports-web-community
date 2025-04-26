'use client';

import { memo, useEffect, useState } from 'react';
import Image from 'next/image';
import { fetchMatchData } from '@/app/actions/livescore/matches/match';
import { fetchMatchEvents } from '@/app/actions/livescore/matches/events';
import { getTeamById } from '@/app/constants';
import { MatchEvent } from '../types';
// 프리미어리그 팀 선수 데이터 불러오기
import { liverpoolPlayers, NottinghamForestPlayers, Arsenalplayers, NewcastleUnitedplayers, Chelseaplayers, ManchesterCityplayers, AstonVillaplayers, Bournemouthplayers, Fulhamplayers, Brightonplayers } from '@/app/constants/teams/premier-league/premier-teams';

// 선수 데이터 타입 정의
type PremierLeaguePlayer = 
  | { id: number; name: string; koreanName: string; } 
  | { id?: number; name: string; role?: string; korean_name: string; } 
  | { id: number; english_name: string; korean_name: string; }
  | { id: number; englishName: string; koreanName: string; };

// 경기 상태 한국어 매핑
const matchStatusMap: Record<string, string> = {
  'TBD': '미정',
  'NS': '경기 예정',
  '1H': '전반전',
  'HT': '전반 종료',
  '2H': '후반전',
  'ET': '연장전',
  'BT': '휴식시간',
  'P': '승부차기',
  'SUSP': '경기중단',
  'INT': '경기중단',
  'FT': '경기 종료',
  'AET': '연장 종료',
  'PEN': '승부차기 종료',
  'PST': '연기',
  'CANC': '취소',
  'ABD': '몰수',
  'AWD': '기권승',
  'WO': '불참패',
  'LIVE': '라이브'
};

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

interface MatchHeaderProps {
  matchId: string;
}

interface MatchData {
  fixture?: {
    date?: string;
    status?: {
      short?: string;
      long?: string;
      elapsed?: number | null;  // null 값도 허용
    };
    timestamp?: number;
  };
  league?: {
    name?: string;
    name_ko?: string;
    logo?: string;
    id?: number;
  };
  teams?: {
    home?: {
      id?: number;
      name?: string;
      name_ko?: string;
      name_en?: string;
      logo?: string;
      formation?: string;
    };
    away?: {
      id?: number;
      name?: string;
      name_ko?: string;
      name_en?: string;
      logo?: string;
      formation?: string;
    };
  };
  goals?: {
    home?: number | null;  // null 값도 허용
    away?: number | null;  // null 값도 허용
  };
  score?: {
    halftime?: {
      home?: number | null;
      away?: number | null;
    };
    fulltime?: {
      home?: number | null;
      away?: number | null;
    };
  };
}

function MatchHeader({ matchId }: MatchHeaderProps) {
  const [match, setMatch] = useState<MatchData | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    // 경기 데이터 불러오기
    const loadMatchData = async () => {
      try {
        setLoading(true);
        // 경기 데이터 불러오기
        const { data, success } = await fetchMatchData(matchId);
        
        if (success && data) {
          setMatch(data as MatchData);  // 타입 캐스팅으로 오류 방지
          setError(false);
          
          // 이벤트 데이터 불러오기 (골 스코어러 표시용)
          const eventsResponse = await fetchMatchEvents(matchId);
          if (eventsResponse.status === 'success') {
            setEvents(eventsResponse.events);
          }
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("경기 데이터 로딩 오류:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    
    loadMatchData();
  }, [matchId]);
  
  const getMatchStatus = () => {
    const shortStatus = match?.fixture?.status?.short ?? '';
      
    if (['1H', '2H', 'LIVE', 'INPLAY'].includes(shortStatus)) {
      return `${match?.fixture?.status?.elapsed}'`;
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
      return matchStatusMap[shortStatus] || match?.fixture?.status?.long || '';
    }
  };
  
  // 날짜 포맷팅
  const getFormattedDate = () => {
    if (!match?.fixture?.date) return '';
    
    const matchDate = new Date(match.fixture.date);
    const formattedDate = matchDate.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return formattedDate;
  };
  
  // goalEvents 계산 - 이벤트 데이터에서 골만 필터링
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
  
  // 로딩 화면 표시
  if (loading) {
    return (
      <div className="w-full md:max-w-screen-xl md:mx-auto">
        <div className="mt-4 md:mt-0 mb-4 bg-white rounded-lg border p-4">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // 에러 상태 표시
  if (error || !match) {
    return (
      <div className="w-full md:max-w-screen-xl md:mx-auto">
        <div className="mt-4 md:mt-0 mb-4 bg-white rounded-lg border p-4">
          <div className="text-center py-8">
            <p className="text-gray-600">경기 정보를 불러올 수 없습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  // 팀 정보 가져오기 (한국어 이름이 있으면 사용)
  const homeTeamInfo = match.teams?.home?.id ? getTeamById(match.teams.home.id) : null;
  const awayTeamInfo = match.teams?.away?.id ? getTeamById(match.teams.away.id) : null;
  
  // 홈팀과 원정팀 이름 한국어 처리
  const homeTeamName = match.teams?.home?.name_ko || homeTeamInfo?.name_ko || match.teams?.home?.name || '홈팀';
  const awayTeamName = match.teams?.away?.name_ko || awayTeamInfo?.name_ko || match.teams?.away?.name || '원정팀';
  
  // 스코어 정보
  const homeScore = match.goals?.home !== null && match.goals?.home !== undefined ? String(match.goals.home) : '0';
  const awayScore = match.goals?.away !== null && match.goals?.away !== undefined ? String(match.goals.away) : '0';
  const homeHalftimeScore = match.score?.halftime?.home !== null && match.score?.halftime?.home !== undefined ? String(match.score.halftime.home) : '0';
  const awayHalftimeScore = match.score?.halftime?.away !== null && match.score?.halftime?.away !== undefined ? String(match.score.halftime.away) : '0';
  const homeFulltimeScore = match.score?.fulltime?.home !== null && match.score?.fulltime?.home !== undefined ? String(match.score.fulltime.home) : '0';
  const awayFulltimeScore = match.score?.fulltime?.away !== null && match.score?.fulltime?.away !== undefined ? String(match.score.fulltime.away) : '0';
  
  return (
    <div className="w-full md:max-w-screen-xl md:mx-auto">
      {/* 통합된 매치 헤더 카드 */}
      <div className="mt-4 md:mt-0 mb-4 bg-white rounded-lg border overflow-hidden">
        {/* 리그 정보 및 경기 상태 */}
        <div className="flex flex-col md:flex-row md:items-center border-b">
          {/* 리그 정보 - 왼쪽 1/3 차지 */}
          <div className="flex items-center gap-2 px-2 py-2 md:px-4 border-b md:border-b-0 md:border-r md:w-1/3">
            <div className="relative w-6 h-6">
              {match.league?.logo && (
                <Image
                  src={match.league.logo}
                  alt={match.league.name || ''}
                  fill
                  className="object-contain"
                  unoptimized={true}
                  priority={true}
                />
              )}
            </div>
            <span className="text-sm font-medium">
              {/* 한국어 리그명 우선 표시, 없으면 일반 이름 */}
              {match.league?.name_ko || match.league?.name}
            </span>
          </div>

          {/* 경기 상태 및 시간 - 중앙 1/3 차지 */}
          <div className="text-center py-2 px-0 md:w-1/3 flex flex-col items-center justify-center">
            <div className={`font-bold text-base ${
              match.fixture?.status?.short && ['1H', '2H', 'LIVE', 'INPLAY'].includes(match.fixture.status.short) 
                ? 'text-green-600' 
                : match.fixture?.status?.short === 'HT' 
                  ? 'text-orange-500'
                  : match.fixture?.status?.short && ['FT', 'AET', 'PEN'].includes(match.fixture.status.short)
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
                {match.teams?.home?.logo && (
                  <Image 
                    src={match.teams.home.logo}
                    alt={homeTeamName}
                    fill
                    className="object-contain"
                    unoptimized={true}
                    priority={true}
                  />
                )}
              </div>
              {/* 한국어 팀명 우선 표시 */}
              <div className="font-bold text-sm md:text-base">{homeTeamName}</div>
              <div className="text-xs md:text-sm text-gray-600">{match.teams?.home?.formation}</div>
            </div>

            {/* 스코어 */}
            <div className="w-1/3 md:w-1/3 text-center self-center whitespace-nowrap">
              <div className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">
                {homeScore} - {awayScore}
              </div>
              <div className="space-y-0 md:space-y-1 text-xs md:text-sm text-gray-600">
                <div>전반 종료: {homeHalftimeScore} - {awayHalftimeScore}</div>
                <div>경기 종료: {homeFulltimeScore} - {awayFulltimeScore}</div>
              </div>
            </div>

            {/* 원정팀 */}
            <div className="w-1/3 md:w-1/3 text-center">
              <div className="relative w-12 h-12 md:w-16 md:h-16 mx-auto mb-1 md:mb-2">
                {match.teams?.away?.logo && (
                  <Image 
                    src={match.teams.away.logo}
                    alt={awayTeamName}
                    fill
                    className="object-contain"
                    unoptimized={true}
                    priority={true}
                  />
                )}
              </div>
              {/* 한국어 팀명 우선 표시 */}
              <div className="font-bold text-sm md:text-base">{awayTeamName}</div>
              <div className="text-xs md:text-sm text-gray-600">{match.teams?.away?.formation}</div>
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
                    {match.teams?.home?.logo && (
                      <Image 
                        src={match.teams.home.logo}
                        alt={homeTeamName}
                        fill
                        className="object-contain"
                        unoptimized={true}
                      />
                    )}
                  </div>
                  {/* 한국어 팀명 우선 표시 */}
                  {homeTeamName}
                </div>
                
                <div className="space-y-1">
                  {goalEvents
                    .filter(event => {
                      const teamId = event.team?.id;
                      return teamId === match.teams?.home?.id;
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
              {goalEvents.filter(event => event.team.id === match.teams?.home?.id).length > 0 && 
               goalEvents.filter(event => event.team.id === match.teams?.away?.id).length > 0 && 
               <div className="md:hidden w-full border-t border-gray-200 my-3"></div>}

              {/* 원정팀 득점자 */}
              <div className="w-full md:w-5/12 relative pl-2">
                {/* 원정팀 헤더 - 모바일에서만 표시 */}
                <div className="md:hidden py-1 font-semibold mb-2 text-sm flex items-center">
                  <div className="relative w-4 h-4 mr-2">
                    {match.teams?.away?.logo && (
                      <Image 
                        src={match.teams.away.logo}
                        alt={awayTeamName}
                        fill
                        className="object-contain"
                        unoptimized={true}
                      />
                    )}
                  </div>
                  {/* 한국어 팀명 우선 표시 */}
                  {awayTeamName}
                </div>
                
                <div className="space-y-1">
                  {goalEvents
                    .filter(event => {
                      const teamId = event.team?.id;
                      return teamId === match.teams?.away?.id;
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
}

export default memo(MatchHeader); 