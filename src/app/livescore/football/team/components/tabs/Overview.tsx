'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { LoadingState, ErrorState, EmptyState } from '@/domains/livescore/components/common/CommonComponents';
import { Match } from '@/app/actions/livescore/teams/matches';
import React from 'react';

// Goal 관련 인터페이스 추가
interface GoalStats {
  total?: {
    home: number;
    away: number;
    total: number;
  };
  average?: {
    home: string;
    away: string;
    total: string;
  };
  minute?: Record<string, { total: number; percentage: string }>;
}

interface LeagueInfo {
  name: string;
  country: string;
  logo: string;
  season: number;
}

interface FixturesInfo {
  wins: { total: number };
  draws: { total: number };
  loses: { total: number };
}

interface CleanSheetInfo {
  total: number;
}

// standings를 위한 인터페이스
interface StandingDisplay {
  league: {
    id: number;
    name: string;
    logo: string;
  };
  standings: Array<{
    rank: number;
    team: {
      id: number;
      name: string;
      logo: string;
    };
    all: {
      played: number;
      win: number;
      draw: number;
      lose: number;
      goals: {
        for: number;
        against: number;
      };
    };
    goalsDiff: number;
    points: number;
    form: string;
  }>;
}

interface OverviewProps {
  team?: {
    team: {
      id: number;
      name: string;
      logo: string;
    };
    venue?: {
      name: string;
      address: string;
      city: string;
      capacity: number;
      image: string;
    };
  };
  stats?: {
    league?: LeagueInfo;
    fixtures?: FixturesInfo;
    goals?: {
      for: GoalStats;
      against: GoalStats;
    };
    clean_sheet?: CleanSheetInfo;
    form?: string;
  };
  matches?: Match[];
  standings?: StandingDisplay[];
  onTabChange?: (tab: string) => void;
  teamId: number;
  isLoading?: boolean;
  error?: string | null;
}

export default function Overview({ 
  team, 
  stats, 
  matches, 
  standings, 
  onTabChange, 
  teamId, 
  isLoading, 
  error 
}: OverviewProps) {
  const router = useRouter();
  
  // 안전한 상태 객체 정의 (undefined 방지)
  const safeStats = stats || {};
  const safeLeague: LeagueInfo = safeStats.league || {
    name: '',
    country: '',
    logo: '',
    season: 0
  };
  const safeFixtures: FixturesInfo = safeStats.fixtures || {
    wins: { total: 0 },
    draws: { total: 0 },
    loses: { total: 0 }
  };
  const safeGoals = safeStats.goals || {
    for: {
      total: { home: 0, away: 0, total: 0 },
      average: { home: '0', away: '0', total: '0' },
      minute: {}
    },
    against: {
      total: { home: 0, away: 0, total: 0 },
      average: { home: '0', away: '0', total: '0' },
      minute: {}
    }
  };
  const safeCleanSheet: CleanSheetInfo = safeStats.clean_sheet || { total: 0 };

  // 탭 변경 핸들러 (메모이제이션으로 불필요한 렌더링 방지)
  const handleTabChange = React.useCallback((tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    }
  }, [onTabChange]);
  
  // 로딩 상태 처리
  if (isLoading) {
    return <LoadingState message="팀 개요 데이터를 불러오는 중..." />;
  }

  // 에러 상태 처리
  if (error) {
    return <ErrorState message={error || ''} />;
  }

  // 데이터가 없는 경우 처리
  if (!team || !team.team) {
    return <EmptyState title="팀 정보가 없습니다" message="현재 이 팀에 대한 정보를 제공할 수 없습니다." />;
  }

  // 경기 필터링 로직
  const recentMatches = matches
    ? matches
        .filter(match => 
          // 경기가 이미 종료된 경우 (FT=Full Time, AET=After Extra Time, PEN=Penalty Shootout, 
          // 그 외에도 FT_PEN 등 다양한 종료 상태가 있을 수 있음)
          match.fixture.status.short === 'FT' || 
          match.fixture.status.short === 'AET' ||
          match.fixture.status.short === 'PEN' ||
          match.fixture.status.short === 'FT_PEN' ||
          // 추가적인 종료 상태 처리
          match.fixture.status.short === 'AWD' || // Awarded (결정된 경기)
          match.fixture.status.short === 'WO' || // Walkover (몰수승)
          match.fixture.status.short === 'CANC' // Cancelled but with result
        )
        .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime())
        .slice(0, 5)
    : [];

  // 예정된 경기 필터링
  const upcomingMatches = matches
    ? matches
        .filter(match => 
          // 예정된 경기 또는 향후 일정
          match.fixture.status.short === 'NS' || // Not Started
          match.fixture.status.short === 'TBD' || // To Be Defined
          match.fixture.status.short === 'SUSP' || // Suspended
          match.fixture.status.short === 'PST' || // Postponed
          match.fixture.status.short === 'CANC' || // Cancelled
          // 현재 진행 중인 경기도 예정된 경기에 포함
          match.fixture.status.short === '1H' || // 전반전
          match.fixture.status.short === '2H' || // 후반전
          match.fixture.status.short === 'HT' || // 하프타임
          match.fixture.status.short === 'ET' || // 연장전
          match.fixture.status.short === 'BT' || // 승부차기 전
          match.fixture.status.short === 'P' || // 승부차기
          match.fixture.status.short === 'INT' || // 경기 중단
          match.fixture.status.short === 'LIVE' // 라이브
        )
        .sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime())
        .slice(0, 5)
    : [];

  // 현재 팀의 순위 정보 찾기 - 새로운 데이터 구조에 맞게 수정
  const findTeamStanding = () => {
    if (!standings || !Array.isArray(standings) || standings.length === 0) return null;
    
    // 모든 리그의 순위 정보를 검색
    for (const league of standings) {
      if (!league || !league.standings || !Array.isArray(league.standings)) continue;
      
      // 팀 ID로 순위 정보 찾기
      const teamStanding = league.standings.find(standing => 
        standing && standing.team && standing.team.id === teamId
      );
      
      if (teamStanding) return teamStanding;
    }
    
    return null;
  };
  
  const currentTeamStanding = findTeamStanding();

  // 표시할 순위 범위 계산 (현재 팀 기준 위아래 2팀씩)
  const getDisplayStandings = () => {
    if (!standings || !Array.isArray(standings) || standings.length === 0) return [];
    
    // 팀이 포함된 리그 찾기
    let targetLeague = null;
    for (const league of standings) {
      if (!league || !league.standings || !Array.isArray(league.standings)) continue;
      
      const hasTeam = league.standings.some(standing => 
        standing && standing.team && standing.team.id === teamId
      );
      
      if (hasTeam) {
        targetLeague = league;
        break;
      }
    }
    
    // 팀이 속한 리그가 없으면 첫 번째 리그 사용
    const mainLeague = targetLeague || standings[0];
    if (!mainLeague || !mainLeague.standings || !Array.isArray(mainLeague.standings)) return [];
    
    const allStandings = mainLeague.standings;
    
    if (!currentTeamStanding) return allStandings.slice(0, 5); // 현재 팀 순위 없으면 상위 5개 표시
    
    const currentRank = currentTeamStanding.rank;
    let startRank = Math.max(1, currentRank - 2);
    let endRank = Math.min(allStandings.length, currentRank + 2);
    
    // 범위가 5개 미만이면 조정
    if (endRank - startRank < 4) {
      if (startRank === 1) {
        endRank = Math.min(allStandings.length, 5);
      } else {
        startRank = Math.max(1, endRank - 4);
      }
    }
    
    return allStandings.filter(s => s && s.rank >= startRank && s.rank <= endRank);
  };

  const displayStandings = getDisplayStandings();

  // 팀 페이지로 이동하는 함수 추가
  const handleTeamClick = (teamId: number) => {
    router.push(`/livescore/football/team/${teamId}`);
  };

  // 공통 스타일
  const tableHeaderStyle = "px-3 py-2 text-left text-xs font-medium text-gray-500";
  const tableCellStyle = "px-3 py-2 text-sm";

  // 폼 결과를 시각적으로 표시하는 컴포넌트
  const FormDisplay = ({ form }: { form: string }) => {
    return (
      <div className="flex gap-1">
        {form.split('').reverse().map((result: string, index: number) => {
          let bgColor = '';
          let textColor = '';
          
          switch (result) {
            case 'W':
              bgColor = 'bg-green-100';
              textColor = 'text-green-800';
              break;
            case 'D':
              bgColor = 'bg-yellow-100';
              textColor = 'text-yellow-800';
              break;
            case 'L':
              bgColor = 'bg-red-100';
              textColor = 'text-red-800';
              break;
            default:
              bgColor = 'bg-gray-200';
              textColor = 'text-gray-700';
          }
          return (
            <div
              key={index}
              className={`${bgColor} ${textColor} w-6 h-6 flex items-center justify-center text-xs font-medium rounded`}
              title={result === 'W' ? '승리' : result === 'D' ? '무승부' : '패배'}
            >
              {result}
            </div>
          );
        })}
      </div>
    );
  };

  // 매치 페이지로 이동하는 함수 추가
  const handleMatchClick = (fixtureId: number) => {
    router.push(`/livescore/football/match/${fixtureId}`);
  };

  // 리그 정보 가져오기
  const getLeagueInfo = () => {
    if (!standings || !Array.isArray(standings) || standings.length === 0) return null;
    return standings[0]?.league || null;
  };

  const leagueInfo = getLeagueInfo();

  // 득점 및 실점 데이터 안전하게 접근하는 함수 추가
  const getSafeGoalValue = (goalObj: GoalStats, type: string): number => {
    if (!goalObj || !goalObj.total) return 0;
    
    // goalObj.total이 객체인지 확인
    if (typeof goalObj.total === 'object' && goalObj.total !== null) {
      // type이 total 객체에 존재하는지 확인
      if (type === 'home' && 'home' in goalObj.total) {
        return goalObj.total.home || 0;
      }
      if (type === 'away' && 'away' in goalObj.total) {
        return goalObj.total.away || 0;
      }
      if (type === 'total' && 'total' in goalObj.total) {
        return goalObj.total.total || 0;
      }
    }
    
    // 기본값
    return 0;
  };

  return (
    <div className="space-y-4">
      {/* 1. 리그 정보 + 기본 통계 */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {/* 리그 정보 카드 */}
          <div className="col-span-2 md:col-span-1 border-b md:border-b-0 md:border-r border-gray-200">
            <h4 className="text-sm font-medium p-2 border-b border-gray-100">리그 정보</h4>
            <div className="flex items-center p-2">
              <div className="w-6 h-6 relative flex-shrink-0 mr-3">
                {safeLeague.logo && (
                  <Image
                    src={safeLeague.logo}
                    alt={safeLeague.name || '리그'}
                    fill
                    sizes="24px"
                    className="object-contain"
                  />
                )}
              </div>
              <div>
                <p className="font-medium text-sm">{safeLeague.name || '정보 없음'}</p>
                <p className="text-xs text-gray-600">시즌: {safeLeague.season || '정보 없음'}</p>
                <p className="text-xs text-gray-600">국가: {safeLeague.country || '정보 없음'}</p>
              </div>
            </div>
          </div>

          {/* 시즌 통계 카드 */}
          <div className="border-b border-r md:border-b-0 md:border-r border-gray-200">
            <h4 className="text-sm font-medium p-2 border-b border-gray-100">시즌 통계</h4>
            <div className="grid grid-cols-3 p-2 text-center">
              <div>
                <p className="text-base font-bold">{safeFixtures.wins.total || 0}</p>
                <p className="text-xs text-gray-500">승</p>
              </div>
              <div>
                <p className="text-base font-bold">{safeFixtures.draws.total || 0}</p>
                <p className="text-xs text-gray-500">무</p>
              </div>
              <div>
                <p className="text-base font-bold">{safeFixtures.loses.total || 0}</p>
                <p className="text-xs text-gray-500">패</p>
              </div>
            </div>
          </div>

          {/* 득실 통계 카드 */}
          <div className="border-b md:border-b-0 md:border-r border-gray-200">
            <h4 className="text-sm font-medium p-2 border-b border-gray-100">득실 통계</h4>
            <div className="grid grid-cols-3 p-2 text-center">
              <div>
                <p className="text-base font-bold">
                  {getSafeGoalValue(safeGoals.for, 'total')}
                </p>
                <p className="text-xs text-gray-500">득점</p>
              </div>
              <div>
                <p className="text-base font-bold">
                  {getSafeGoalValue(safeGoals.against, 'total')}
                </p>
                <p className="text-xs text-gray-500">실점</p>
              </div>
              <div>
                <p className="text-base font-bold">{safeCleanSheet.total || 0}</p>
                <p className="text-xs text-gray-500">클린시트</p>
              </div>
            </div>
          </div>

          {/* 최근 5경기 카드 */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="text-sm font-medium p-2 border-b border-gray-100">최근 5경기</h4>
            <div className="p-2 flex items-center justify-center">
              {safeStats.form ? (
                (() => {
                  // 폼 문자열에서 마지막 5개 문자 가져오기 (최근 5경기)
                  const form = safeStats.form;
                  const latestForm = form.length > 5 ? form.slice(-5) : form;
                  
                  return (
                    <div className="flex gap-1">
                      {latestForm.split('').reverse().map((result, index) => {
                        let bgColor = '';
                        let textColor = '';
                        
                        switch (result) {
                          case 'W':
                            bgColor = 'bg-green-100';
                            textColor = 'text-green-800';
                            break;
                          case 'D':
                            bgColor = 'bg-yellow-100';
                            textColor = 'text-yellow-800';
                            break;
                          case 'L':
                            bgColor = 'bg-red-100';
                            textColor = 'text-red-800';
                            break;
                          default:
                            bgColor = 'bg-gray-200';
                            textColor = 'text-gray-700';
                        }
                        return (
                          <div
                            key={index}
                            className={`${bgColor} ${textColor} w-6 h-6 flex items-center justify-center text-xs font-medium rounded`}
                            title={result === 'W' ? '승리' : result === 'D' ? '무승부' : '패배'}
                          >
                            {result}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              ) : (
                <p className="text-sm text-gray-500">데이터 없음</p>
              )}
            </div>
          </div>
        </div>

        {/* 자세한 통계 보기 버튼 */}
        <button 
          onClick={() => handleTabChange('stats')}
          className="w-full p-2 text-blue-600 hover:text-blue-800 transition-colors border-t border-gray-200"
        >
          <div className="flex items-center justify-center gap-1">
            <span className="text-sm font-medium">자세한 통계 보기</span>
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 9l-7 7-7-7" 
              />
            </svg>
          </div>
        </button>
      </div>

      {/* 2. 리그 순위 */}
      {displayStandings.length > 0 && leagueInfo && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="flex items-center p-2 border-b border-gray-200">
            <div className="w-6 h-6 relative flex-shrink-0 mr-2">
              {(leagueInfo.logo || safeLeague.logo) && (
                <Image
                  src={leagueInfo.logo || safeLeague.logo}
                  alt={leagueInfo.name || safeLeague.name || '리그'}
                  fill
                  sizes="24px"
                  className="object-contain"
                />
              )}
            </div>
            <h4 className="text-sm font-medium">{leagueInfo.name || safeLeague.name || '리그 순위'}</h4>
          </div>
          <div className="overflow-hidden">
            <table className="w-full">
              <colgroup><col className="w-10"/><col className="w-[140px] md:w-[180px]"/><col className="hidden md:table-column w-10"/><col className="w-8"/><col className="w-8"/><col className="w-8"/><col className="hidden md:table-column w-10"/><col className="hidden md:table-column w-10"/><col className="hidden md:table-column w-10"/><col className="w-10"/><col className="hidden md:table-column w-32"/></colgroup>
              <thead className="bg-gray-50">
                <tr>
                  <th className={`${tableHeaderStyle} whitespace-nowrap`}>#</th>
                  <th className={`${tableHeaderStyle} whitespace-nowrap`}>팀</th>
                  <th className={`hidden md:table-cell ${tableHeaderStyle} whitespace-nowrap`}>경기</th>
                  <th className={`${tableHeaderStyle} whitespace-nowrap`}>승</th>
                  <th className={`${tableHeaderStyle} whitespace-nowrap`}>무</th>
                  <th className={`${tableHeaderStyle} whitespace-nowrap`}>패</th>
                  <th className={`hidden md:table-cell ${tableHeaderStyle} whitespace-nowrap`}>득점</th>
                  <th className={`hidden md:table-cell ${tableHeaderStyle} whitespace-nowrap`}>실점</th>
                  <th className={`hidden md:table-cell ${tableHeaderStyle} whitespace-nowrap`}>득실차</th>
                  <th className={`${tableHeaderStyle} whitespace-nowrap`}>승점</th>
                  <th className={`hidden md:table-cell ${tableHeaderStyle} whitespace-nowrap`}>최근 5경기</th>
                </tr>
              </thead>
              <tbody>
                {displayStandings.map((standing) => {
                  const isCurrentTeam = standing.team.id === teamId;
                  return (
                    <tr 
                      key={standing.team.id}
                      className={`border-b ${isCurrentTeam ? 'bg-blue-50' : ''} hover:bg-gray-50 cursor-pointer`}
                      onClick={() => standing.team.id !== teamId && handleTeamClick(standing.team.id)}
                    >
                      <td className={tableCellStyle}>{standing.rank}</td>
                      <td className={tableCellStyle}>
                        <div className="flex items-center gap-2">
                          {standing.team.logo && (
                            <div className="w-5 h-5 relative">
                              <Image
                                src={standing.team.logo}
                                alt={standing.team.name}
                                fill
                                sizes="20px"
                                className="object-contain"
                              />
                            </div>
                          )}
                          <span className={`truncate ${isCurrentTeam ? 'font-semibold' : ''}`}>
                            {standing.team.name}
                          </span>
                        </div>
                      </td>
                      <td className={`hidden md:table-cell ${tableCellStyle}`}>{standing.all.played}</td>
                      <td className={`${tableCellStyle} text-center text-xs md:text-sm`}>{standing.all.win}</td>
                      <td className={`${tableCellStyle} text-center text-xs md:text-sm`}>{standing.all.draw}</td>
                      <td className={`${tableCellStyle} text-center text-xs md:text-sm`}>{standing.all.lose}</td>
                      <td className={`hidden md:table-cell ${tableCellStyle}`}>{standing.all.goals.for}</td>
                      <td className={`hidden md:table-cell ${tableCellStyle}`}>{standing.all.goals.against}</td>
                      <td className={`hidden md:table-cell ${tableCellStyle}`}>{standing.goalsDiff}</td>
                      <td className={`${tableCellStyle} text-center font-semibold`}>{standing.points}</td>
                      <td className={`hidden md:table-cell ${tableCellStyle}`}>
                        {standing.form && <FormDisplay form={standing.form} />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* 전체 순위 보기 버튼 */}
          <button 
            onClick={() => handleTabChange('standings')}
            className="w-full p-2 text-blue-600 hover:text-blue-800 transition-colors border-t border-gray-200"
          >
            <div className="flex items-center justify-center gap-1">
              <span className="text-sm font-medium">전체 순위 보기</span>
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 9l-7 7-7-7" 
                />
              </svg>
            </div>
          </button>
        </div>
      )}

      {/* 3. 최근 경기와 예정된 경기 */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
          {/* 최근 경기 결과 */}
          <div>
            <h4 className="text-sm font-medium p-2 border-b border-gray-200">최근 경기</h4>
            <div className="overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="h-10">
                    <th className="p-0 md:p-2 text-left text-xs font-medium text-gray-500 w-10 md:w-16">날짜</th>
                    <th className="p-0 md:p-2 text-center text-xs font-medium text-gray-500 w-6 md:w-10">리그</th>
                    <th className="p-0 md:p-2 text-center text-xs font-medium text-gray-500">경기</th>
                    <th className="p-0 md:p-2 text-center text-xs font-medium text-gray-500 w-10 md:w-16">결과</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentMatches.length > 0 ? recentMatches.map(match => (
                    <tr 
                      key={match.fixture.id} 
                      className="h-12 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleMatchClick(match.fixture.id)}
                    >
                      <td className="p-0 md:px-2 text-xs whitespace-nowrap w-10 md:w-16">
                        {format(new Date(match.fixture.date), 'MM.dd', { locale: ko })}
                      </td>
                      <td className="p-0 md:px-2 w-6 md:w-10">
                        <div className="flex justify-center items-center">
                          <Image
                            src={match.league.logo}
                            alt={match.league.name}
                            width={16}
                            height={16}
                            className="object-contain w-4 h-4 md:w-5 md:h-5"
                          />
                        </div>
                      </td>
                      <td className="p-0 md:px-2">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 flex items-center justify-end gap-0 min-w-0">
                            <span className={`truncate max-w-[100px] md:max-w-[180px] text-right mr-1 ${match.teams.home.id === team.team.id ? '' : 'text-xs md:text-sm'}`}>
                              {match.teams.home.name}
                            </span>
                            <Image
                              src={match.teams.home.logo}
                              alt={match.teams.home.name}
                              width={20}
                              height={20}
                              className="object-contain w-5 h-5 flex-shrink-0"
                            />
                          </div>

                          <div className="w-10 text-center font-medium mx-1 flex-shrink-0">
                            {match.goals.home}-{match.goals.away}
                          </div>

                          <div className="flex-1 flex items-center justify-start gap-0 min-w-0">
                            <Image
                              src={match.teams.away.logo}
                              alt={match.teams.away.name}
                              width={20}
                              height={20}
                              className="object-contain w-5 h-5 flex-shrink-0"
                            />
                            <span className={`truncate max-w-[100px] md:max-w-[180px] text-left ml-1 ${match.teams.away.id === team.team.id ? '' : 'text-xs md:text-sm'}`}>
                              {match.teams.away.name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-1 py-1 md:px-2 md:py-2 text-center w-10 md:w-16">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-medium
                          ${match.teams.home.id === team.team.id ? 
                            (match.teams.home.winner ? 'bg-green-100 text-green-800' : 
                              match.teams.away.winner ? 'bg-red-100 text-red-800' : 
                              'bg-yellow-100 text-yellow-800') :
                            (match.teams.away.winner ? 'bg-green-100 text-green-800' : 
                              match.teams.home.winner ? 'bg-red-100 text-red-800' : 
                              'bg-yellow-100 text-yellow-800')
                          }`}
                        >
                          {match.teams.home.id === team.team.id ?
                            (match.teams.home.winner ? 'W' : 
                              match.teams.away.winner ? 'L' : 'D') :
                            (match.teams.away.winner ? 'W' : 
                              match.teams.home.winner ? 'L' : 'D')
                          }
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-gray-500">최근 경기 정보가 없습니다</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 예정된 경기 */}
          <div>
            <h4 className="text-sm font-medium p-2 border-b border-gray-200">예정된 경기</h4>
            <div className="overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="h-10">
                    <th className="p-0 md:p-2 text-left text-xs font-medium text-gray-500 w-16 md:w-20">날짜</th>
                    <th className="p-0 md:p-2 text-center text-xs font-medium text-gray-500 w-6 md:w-10">리그</th>
                    <th className="p-0 md:p-2 text-center text-xs font-medium text-gray-500">경기</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {upcomingMatches.length > 0 ? upcomingMatches.map(match => (
                    <tr 
                      key={match.fixture.id} 
                      className="h-12 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleMatchClick(match.fixture.id)}
                    >
                      <td className="p-0 md:px-2 text-xs whitespace-nowrap w-16 md:w-20">
                        {format(new Date(match.fixture.date), 'MM.dd HH:mm', { locale: ko })}
                      </td>
                      <td className="p-0 md:px-2 w-6 md:w-10">
                        <div className="flex justify-center items-center">
                          <Image
                            src={match.league.logo}
                            alt={match.league.name}
                            width={16}
                            height={16}
                            className="object-contain w-4 h-4 md:w-5 md:h-5"
                          />
                        </div>
                      </td>
                      <td className="p-0 md:px-2">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 flex items-center justify-end gap-0 min-w-0">
                            <span className={`truncate max-w-[100px] md:max-w-[180px] text-right mr-1 ${match.teams.home.id === team.team.id ? '' : 'text-xs md:text-sm'}`}>
                              {match.teams.home.name}
                            </span>
                            <Image
                              src={match.teams.home.logo}
                              alt={match.teams.home.name}
                              width={20}
                              height={20}
                              className="object-contain w-5 h-5 flex-shrink-0"
                            />
                          </div>

                          <div className="w-10 text-center font-medium mx-1 flex-shrink-0">
                            VS
                          </div>

                          <div className="flex-1 flex items-center justify-start gap-0 min-w-0">
                            <Image
                              src={match.teams.away.logo}
                              alt={match.teams.away.name}
                              width={20}
                              height={20}
                              className="object-contain w-5 h-5 flex-shrink-0"
                            />
                            <span className={`truncate max-w-[100px] md:max-w-[180px] text-left ml-1 ${match.teams.away.id === team.team.id ? '' : 'text-xs md:text-sm'}`}>
                              {match.teams.away.name}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-gray-500">예정된 경기 정보가 없습니다</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 