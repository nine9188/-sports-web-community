'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

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

interface OverviewProps {
  team: {
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
  stats: {
    league?: LeagueInfo;
    fixtures?: FixturesInfo;
    goals?: {
      for: GoalStats;
      against: GoalStats;
    };
    clean_sheet?: CleanSheetInfo;
    form?: string;
  };
  matches: Array<{
    fixture: {
      id: number;
      date: string;
      status: { short: string };
    };
    league: {
      name: string;
      logo: string;
    };
    teams: {
      home: {
        id: number;
        name: string;
        logo: string;
        winner: boolean | null;
      };
      away: {
        id: number;
        name: string;
        logo: string;
        winner: boolean | null;
      };
    };
    goals: {
      home: number | null;
      away: number | null;
    };
  }>;
  standings: Array<{
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
  }>;
  onTabChange?: (tab: string) => void;
  teamId?: number;
}

export default function Overview({ team, stats, matches, standings, onTabChange, teamId }: OverviewProps) {
  const router = useRouter();

  // 데이터가 없는 경우 처리
  if (!team || !team.team) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-center">
        <p className="text-gray-500">팀 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  // 경기 필터링 로직
  const recentMatches = matches
    ? matches
        .filter(match => 
          match.fixture.status.short === 'FT' || 
          match.fixture.status.short === 'AET' ||
          match.fixture.status.short === 'PEN'
        )
        .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime())
        .slice(0, 5)
    : [];

  const upcomingMatches = matches
    ? matches
        .filter(match => 
          match.fixture.status.short === 'NS' || 
          match.fixture.status.short === 'TBD'
        )
        .sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime())
        .slice(0, 5)
    : [];

  // 현재 팀의 순위 정보 찾기 - 새로운 데이터 구조에 맞게 수정
  const findTeamStanding = () => {
    if (!standings || !Array.isArray(standings) || standings.length === 0) return null;
    
    // 첫 번째 리그의 순위 정보 사용 (일반적으로 메인 리그)
    const mainLeague = standings[0];
    if (!mainLeague || !mainLeague.standings || !Array.isArray(mainLeague.standings)) return null;
    
    // 팀 ID로 순위 정보 찾기 - teamId prop 사용
    return mainLeague.standings.find(standing => 
      standing && standing.team && standing.team.id === teamId
    );
  };
  
  const currentTeamStanding = findTeamStanding();

  // 표시할 순위 범위 계산 (현재 팀 기준 위아래 2팀씩)
  const getDisplayStandings = () => {
    if (!standings || !Array.isArray(standings) || standings.length === 0) return [];
    
    // 첫 번째 리그의 순위 정보 사용
    const mainLeague = standings[0];
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
        {form.split('').map((result, index) => {
          let bgColor = '';
          let textColor = 'text-white';
          
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
              className={`${bgColor} ${textColor} w-6 h-6 flex items-center justify-center text-xs font-bold`}
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

  // 안전하게 stats 객체 접근
  const safeStats = stats || {};
  const safeLeague = safeStats.league || { name: '', country: '', logo: '', season: 0 };
  const safeFixtures = safeStats.fixtures || { wins: { total: 0 }, draws: { total: 0 }, loses: { total: 0 } };
  const safeGoals = safeStats.goals || { 
    for: { total: { home: 0, away: 0, total: 0 } }, 
    against: { total: { home: 0, away: 0, total: 0 } } 
  };
  const safeCleanSheet = safeStats.clean_sheet || { total: 0 };

  // 득점 및 실점 데이터 안전하게 접근하는 함수 추가
  const getSafeGoalValue = (goalObj: GoalStats, type: string): number => {
    if (!goalObj) return 0;
    
    // API 응답 구조가 다양할 수 있으므로 여러 경로 시도
    if (goalObj.total && type in goalObj.total) {
      return goalObj.total[type as keyof typeof goalObj.total] || 0;
    }
    
    return 0;
  };

  return (
    <div className="space-y-6">
      {/* 1. 리그 정보 + 기본 통계 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 리그 정보 카드 */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h4 className="text-base font-semibold mb-3">리그 정보</h4>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 relative flex-shrink-0">
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
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h4 className="text-base font-semibold mb-3">시즌 통계</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xl font-bold">{safeFixtures.wins.total || 0}</p>
                <p className="text-xs text-gray-600">승</p>
              </div>
              <div>
                <p className="text-xl font-bold">{safeFixtures.draws.total || 0}</p>
                <p className="text-xs text-gray-600">무</p>
              </div>
              <div>
                <p className="text-xl font-bold">{safeFixtures.loses.total || 0}</p>
                <p className="text-xs text-gray-600">패</p>
              </div>
            </div>
          </div>

          {/* 득실 통계 카드 */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h4 className="text-base font-semibold mb-3">득실 통계</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xl font-bold">
                  {getSafeGoalValue(safeGoals.for, 'home')}
                </p>
                <p className="text-xs text-gray-600">득점</p>
              </div>
              <div>
                <p className="text-xl font-bold">
                  {getSafeGoalValue(safeGoals.against, 'home')}
                </p>
                <p className="text-xs text-gray-600">실점</p>
              </div>
              <div>
                <p className="text-xl font-bold">{safeCleanSheet.total || 0}</p>
                <p className="text-xs text-gray-600">클린시트</p>
              </div>
            </div>
          </div>

          {/* 최근 5경기 카드 */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="space-y-2">
              <h5 className="text-base font-semibold">최근 5경기</h5>
              <div className="grid grid-cols-5 gap-1">
                {safeStats.form ? (
                  safeStats.form.split('').reverse().slice(0, 5).map((result, index) => (
                    <div 
                      key={index}
                      className={`aspect-square flex items-center justify-center text-sm font-medium rounded ${
                        result === 'W' ? 'bg-green-100 text-green-800' : 
                        result === 'D' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}
                    >
                      {result}
                    </div>
                  ))
                ) : (
                  <p className="col-span-5 text-sm text-gray-500">데이터 없음</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 자세한 통계 보기 버튼 */}
        <button 
          onClick={() => onTabChange?.('stats')}
          className="w-full mt-4 text-blue-600 hover:text-blue-800 transition-colors"
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
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-6 relative flex-shrink-0">
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
            <h4 className="text-lg font-semibold">{leagueInfo.name || safeLeague.name || '리그 순위'}</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className={tableHeaderStyle}>순위</th>
                  <th className={tableHeaderStyle}>팀</th>
                  <th className={tableHeaderStyle}>경기</th>
                  <th className={tableHeaderStyle}>승</th>
                  <th className={tableHeaderStyle}>무</th>
                  <th className={tableHeaderStyle}>패</th>
                  <th className={tableHeaderStyle}>득점</th>
                  <th className={tableHeaderStyle}>실점</th>
                  <th className={tableHeaderStyle}>득실차</th>
                  <th className={tableHeaderStyle}>승점</th>
                  <th className={tableHeaderStyle}>최근 5경기</th>
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
                          <span className={isCurrentTeam ? 'font-semibold' : ''}>
                            {standing.team.name}
                          </span>
                        </div>
                      </td>
                      <td className={tableCellStyle}>{standing.all.played}</td>
                      <td className={tableCellStyle}>{standing.all.win}</td>
                      <td className={tableCellStyle}>{standing.all.draw}</td>
                      <td className={tableCellStyle}>{standing.all.lose}</td>
                      <td className={tableCellStyle}>{standing.all.goals.for}</td>
                      <td className={tableCellStyle}>{standing.all.goals.against}</td>
                      <td className={tableCellStyle}>{standing.goalsDiff}</td>
                      <td className={`${tableCellStyle} font-semibold`}>{standing.points}</td>
                      <td className={tableCellStyle}>
                        {standing.form && <FormDisplay form={standing.form} />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* 전체 순위 보기 버튼 - 자세한 통계 보기 버튼과 동일한 스타일 */}
          <button 
            onClick={() => onTabChange?.('standings')}
            className="w-full mt-4 text-blue-600 hover:text-blue-800 transition-colors"
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
      {(recentMatches.length > 0 || upcomingMatches.length > 0) && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 최근 경기 결과 */}
            <div>
              <h4 className="text-lg font-semibold mb-4">최근 경기</h4>
              <div className="overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="h-10">
                      <th className={`${tableHeaderStyle} w-[80px]`}>날짜</th>
                      <th className={`${tableHeaderStyle} w-[50px] text-center whitespace-nowrap`}>리그</th>
                      <th className={`${tableHeaderStyle} text-center`}>경기</th>
                      <th className={`${tableHeaderStyle} w-[50px] text-center`}>결과</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentMatches.length > 0 ? recentMatches.map(match => (
                      <tr 
                        key={match.fixture.id} 
                        className="h-12 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleMatchClick(match.fixture.id)}
                      >
                        <td className={`${tableCellStyle} px-2`}>
                          {format(new Date(match.fixture.date), 'MM.dd', { locale: ko })}
                        </td>
                        <td className={`${tableCellStyle} w-[50px]`}>
                          <div className="flex justify-center items-center w-full h-full">
                            <Image
                              src={match.league.logo}
                              alt={match.league.name}
                              width={20}
                              height={20}
                              className="object-contain"
                            />
                          </div>
                        </td>
                        <td className={tableCellStyle}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1 flex items-center justify-end gap-1 min-w-0">
                              <span className={`truncate max-w-[100px] text-right ${match.teams.home.id === team.team.id ? 'font-semibold' : ''}`}>
                                {match.teams.home.name}
                              </span>
                              <Image
                                src={match.teams.home.logo}
                                alt={match.teams.home.name}
                                width={16}
                                height={16}
                                className="object-contain w-4 h-4 flex-shrink-0"
                              />
                            </div>

                            <div className="w-[60px] text-center font-medium mx-2 flex-shrink-0">
                              {match.goals.home}-{match.goals.away}
                            </div>

                            <div className="flex-1 flex items-center justify-start gap-1 min-w-0">
                              <Image
                                src={match.teams.away.logo}
                                alt={match.teams.away.name}
                                width={16}
                                height={16}
                                className="object-contain w-4 h-4 flex-shrink-0"
                              />
                              <span className={`truncate max-w-[100px] text-left ${match.teams.away.id === team.team.id ? 'font-semibold' : ''}`}>
                                {match.teams.away.name}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className={`${tableCellStyle} text-center`}>
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
              <h4 className="text-lg font-semibold mb-4">예정된 경기</h4>
              <div className="overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="h-10">
                      <th className={`${tableHeaderStyle} w-[80px]`}>날짜</th>
                      <th className={`${tableHeaderStyle} w-[50px] text-center whitespace-nowrap`}>리그</th>
                      <th className={`${tableHeaderStyle} text-center`}>경기</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {upcomingMatches.length > 0 ? upcomingMatches.map(match => (
                      <tr 
                        key={match.fixture.id} 
                        className="h-12 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleMatchClick(match.fixture.id)}
                      >
                        <td className={`${tableCellStyle} whitespace-nowrap px-2`}>
                          {format(new Date(match.fixture.date), 'MM.dd HH:mm', { locale: ko })}
                        </td>
                        <td className={`${tableCellStyle} w-[50px]`}>
                          <div className="flex justify-center items-center w-full h-full">
                            <Image
                              src={match.league.logo}
                              alt={match.league.name}
                              width={20}
                              height={20}
                              className="object-contain"
                            />
                          </div>
                        </td>
                        <td className={tableCellStyle}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1 flex items-center justify-end gap-1 min-w-0">
                              <span className={`truncate max-w-[100px] text-right ${match.teams.home.id === team.team.id ? 'font-semibold' : ''}`}>
                                {match.teams.home.name}
                              </span>
                              <Image
                                src={match.teams.home.logo}
                                alt={match.teams.home.name}
                                width={16}
                                height={16}
                                className="object-contain w-4 h-4 flex-shrink-0"
                              />
                            </div>

                            <div className="w-[60px] text-center font-medium mx-2 flex-shrink-0">
                              VS
                            </div>

                            <div className="flex-1 flex items-center justify-start gap-1 min-w-0">
                              <Image
                                src={match.teams.away.logo}
                                alt={match.teams.away.name}
                                width={16}
                                height={16}
                                className="object-contain w-4 h-4 flex-shrink-0"
                              />
                              <span className={`truncate max-w-[100px] text-left ${match.teams.away.id === team.team.id ? 'font-semibold' : ''}`}>
                                {match.teams.away.name}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-gray-500">예정된 경기가 없습니다</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 