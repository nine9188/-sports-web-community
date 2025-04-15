'use client';

import { useState, useEffect, memo, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Team } from '../../types';

interface Standing {
  rank: number;
  team: {
    id: number;
    name: string;
    logo: string;
  };
  points: number;
  goalsDiff: number;
  group: string;
  form: string;
  status: string;
  description: string;
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
}

interface League {
  name: string;
  logo: string;
  standings: Standing[][];
}

interface StandingsData {
  standings: {
    league: League;
  };
  home?: {
    id: number;
    name?: string;
  };
  away?: {
    id: number;
    name?: string;
  };
}

interface StandingsProps {
  matchData: {
    matchId: string;
    homeTeam: Team;
    awayTeam: Team;
    standings: StandingsData | null;
    [key: string]: unknown;
  };
}

// 팀 로고 컴포넌트 - 메모이제이션
const TeamLogo = memo(({ teamName, originalLogo }: { teamName: string; originalLogo: string }) => {
  const [imgError, setImgError] = useState(false);
  const leagueName = teamName || 'Team';

  return (
    <div className="w-6 h-6 flex-shrink-0 relative transform-gpu">
      <Image
        src={imgError ? '/placeholder-team.png' : originalLogo || '/placeholder-team.png'}
        alt={leagueName}
        fill
        sizes="24px"
        className="object-contain"
        onError={() => {
          if (!imgError) {
            setImgError(true);
          }
        }}
        loading="eager"
        priority={false}
      />
    </div>
  );
});

TeamLogo.displayName = 'TeamLogo';

// 테이블 스타일 정의 개선
const tableStyles = {
  header: "px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider",
  cell: "px-1 py-2 whitespace-nowrap text-sm text-gray-900 text-center",
  smallCol: "w-8", // 너비 감소
  mediumCol: "w-10", // 너비 감소
  container: "mb-4 bg-white rounded-lg border overflow-hidden" // will-change 제거
};

function Standings({ matchData }: StandingsProps) {
  const router = useRouter();
  const [homeTeamId, setHomeTeamId] = useState<number | null>(null);
  const [awayTeamId, setAwayTeamId] = useState<number | null>(null);
  
  // 캐싱을 위해 standings 데이터 메모이제이션
  const standings = useMemo(() => matchData.standings, [matchData.standings]);
  const homeTeam = matchData.homeTeam || { id: 0, name: '', logo: '' };
  const awayTeam = matchData.awayTeam || { id: 0, name: '', logo: '' };
  
  useEffect(() => {
    if (homeTeam?.id && awayTeam?.id) {
      setHomeTeamId(homeTeam.id);
      setAwayTeamId(awayTeam.id);
    }
  }, [homeTeam?.id, awayTeam?.id]);

  // getStatusColor 함수를 useCallback으로 감싸기
  const getStatusColor = useCallback((description: string) => {
    if (!description) return 'bg-transparent';
    
    const desc = description.toLowerCase();
    
    if (desc.includes('champions league')) return 'bg-green-400';
    if (desc.includes('europa league')) return 'bg-blue-400';
    if (desc.includes('conference league')) return 'bg-blue-400';
    if (desc.includes('relegation')) return 'bg-red-400';
    
    return 'bg-transparent';
  }, []);

  // getFormStyle 함수도 useCallback으로 감싸기
  const getFormStyle = useCallback((result: string) => {
    switch(result) {
      case 'W': return 'bg-green-100 text-green-800';
      case 'D': return 'bg-yellow-100 text-yellow-800';
      case 'L': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-200 text-gray-700';
    }
  }, []);

  // handleRowClick 함수를 useCallback으로 감싸기
  const handleRowClick = useCallback((teamId: number) => {
    router.push(`/livescore/football/team/${teamId}`);
  }, [router]);

  // 빈 상태 렌더링 함수
  const renderEmptyState = () => (
    <div className="flex justify-center items-center py-16">
      <div className="text-center">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-16 w-16 mx-auto text-gray-400 mb-4" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
        <p className="text-lg font-medium text-gray-600">순위 정보가 없습니다</p>
        <p className="text-sm text-gray-500 mt-2">현재 이 리그에 대한 순위 정보를 제공할 수 없습니다.</p>
      </div>
    </div>
  );

  // 테이블 렌더링 메모이제이션
  const standingsTable = useMemo(() => {
    if (!standings || !standings.standings?.league?.standings || !standings.standings.league.standings.length) {
      return renderEmptyState();
    }

    const leagueData = standings.standings.league;
    
    return (
      <div className="p-0 overflow-x-hidden">
        {/* 그룹별 순위표 */}
        {leagueData.standings.map((standingsGroup: Standing[], groupIndex: number) => (
          <div key={groupIndex} className={`${tableStyles.container}`}>
            <div className="px-3 py-2 border-b bg-gray-50">
              {groupIndex === 0 ? (
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 relative flex-shrink-0">
                    <Image
                      src={leagueData.logo || '/placeholder-league.png'}
                      alt={leagueData.name || '리그'}
                      fill
                      sizes="24px"
                      className="object-contain"
                    />
                  </div>
                  <h2 className="text-sm font-medium text-gray-800">{leagueData.name || '리그 정보'}</h2>
                </div>
              ) : (
                leagueData.standings.length > 1 && (
                  <h3 className="text-sm font-medium text-gray-800">
                    {standingsGroup[0]?.group ? `Group ${standingsGroup[0].group}` : `Group ${groupIndex + 1}`}
                  </h3>
                )
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col className="md:hidden w-8" />
                  <col className="hidden md:table-column w-12" />
                  <col className="w-[140px] md:w-[180px]" />
                  <col className="hidden md:table-column w-12" />
                  <col className="w-8" />
                  <col className="w-8" />
                  <col className="w-8" />
                  <col className="hidden md:table-column w-12" />
                  <col className="hidden md:table-column w-12" />
                  <col className="hidden md:table-column w-14" />
                  <col className="w-10" />
                  <col className="hidden md:table-column w-32" />
                </colgroup>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="md:hidden px-1 py-1 text-center text-xs font-medium text-gray-500">#</th>
                    <th className="hidden md:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">순위</th>
                    
                    <th className="px-2 py-2 md:px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">팀</th>
                    
                    <th className="hidden md:table-cell px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">경기</th>
                    
                    <th className={`${tableStyles.header}`}>승</th>
                    <th className={`${tableStyles.header}`}>무</th>
                    <th className={`${tableStyles.header}`}>패</th>
                    
                    <th className="hidden md:table-cell px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">득점</th>
                    <th className="hidden md:table-cell px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">실점</th>
                    <th className="hidden md:table-cell px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">득실차</th>
                    
                    <th className={`${tableStyles.header}`}>승점</th>
                    
                    <th className="hidden md:table-cell px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">최근 5경기</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {standingsGroup.map((standing: Standing) => {
                    // 각 행마다 팀 ID 확인 - 문자열 변환하여 비교
                    const isHomeTeam = String(standing.team.id) === String(homeTeamId);
                    const isAwayTeam = String(standing.team.id) === String(awayTeamId);
                    
                    // 팀 행 스타일 설정
                    let rowClass = 'cursor-pointer';
                    
                    if (isHomeTeam) {
                      rowClass += ' bg-blue-50 hover:bg-blue-200';
                    } else if (isAwayTeam) {
                      rowClass += ' bg-red-50 hover:bg-red-200';
                    } else {
                      rowClass += ' hover:bg-gray-100';
                    }
                    
                    return (
                      <tr 
                        key={standing.team.id} 
                        className={rowClass}
                        onClick={() => handleRowClick(standing.team.id)}
                      >
                        {/* 모바일용 축약된 순위 */}
                        <td className="md:hidden px-1 py-1 text-center text-xs relative w-8">
                          <div className={`absolute inset-y-0 left-0 w-1 ${getStatusColor(standing.description)}`} />
                          <span className="pl-1">{standing.rank}</span>
                        </td>
                        
                        {/* 데스크톱용 순위 */}
                        <td className="hidden md:table-cell px-3 py-2 whitespace-nowrap text-sm text-gray-900 relative">
                          <div className={`absolute inset-y-0 left-0 w-1 ${getStatusColor(standing.description)}`} />
                          <span className="pl-2">{standing.rank}</span>
                        </td>
                        
                        {/* 팀 정보 - 고정 너비 사용 */}
                        <td className="px-2 py-2 md:px-3 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-1 md:gap-2">
                            <TeamLogo 
                              teamName={standing.team.name || ''}
                              originalLogo={standing.team.logo || ''}
                            />
                            <div className="flex items-center max-w-[calc(100%-30px)]">
                              <span className="block truncate text-ellipsis overflow-hidden max-w-full pr-1">
                                {standing.team.name || '팀 이름 없음'}
                              </span>
                              {(isHomeTeam || isAwayTeam) && (
                                <span className={`text-[10px] md:text-xs font-bold px-0.5 md:px-1.5 md:py-0.5 ml-0.5 md:ml-2 rounded inline-block flex-shrink-0 ${
                                  isHomeTeam ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {isHomeTeam ? '홈' : '원정'}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        {/* 경기 수 - 모바일에서는 숨김 */}
                        <td className="hidden md:table-cell px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                          {standing.all?.played || 0}
                        </td>
                        
                        {/* 승/무/패 - 고정 너비 사용 */}
                        <td className={`${tableStyles.cell} text-xs md:text-sm px-0 md:px-1`}>{standing.all?.win || 0}</td>
                        <td className={`${tableStyles.cell} text-xs md:text-sm px-0 md:px-1`}>{standing.all?.draw || 0}</td>
                        <td className={`${tableStyles.cell} text-xs md:text-sm px-0 md:px-1`}>{standing.all?.lose || 0}</td>
                        
                        {/* 득점, 실점, 득실차 - 모바일에서는 숨김 */}
                        <td className="hidden md:table-cell px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                          {standing.all?.goals?.for || 0}
                        </td>
                        <td className="hidden md:table-cell px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                          {standing.all?.goals?.against || 0}
                        </td>
                        <td className="hidden md:table-cell px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                          {standing.goalsDiff || 0}
                        </td>
                        
                        {/* 승점 - 모바일에서도 표시 */}
                        <td className={`${tableStyles.cell} text-xs md:text-sm font-semibold`}>{standing.points || 0}</td>
                        
                        {/* 최근 5경기 - 모바일에서는 숨김 */}
                        <td className="hidden md:table-cell px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                          <div className="flex justify-center gap-1">
                            {standing.form?.split('').map((result, idx) => (
                              <div 
                                key={idx} 
                                className={`w-6 h-6 flex items-center justify-center ${getFormStyle(result)} text-xs font-bold`}
                                title={result === 'W' ? '승리' : result === 'D' ? '무승부' : '패배'}
                              >
                                {result}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* 범례 */}
        <div className={`${tableStyles.container}`}>
          <div className="px-3 py-2 border-b bg-gray-50">
            <h3 className="text-sm font-medium text-gray-800">범례</h3>
          </div>
          <div className="p-3">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-400"></div>
                <span className="text-sm">챔피언스리그 진출</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-400"></div>
                <span className="text-sm">유로파리그 진출</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-400"></div>
                <span className="text-sm">강등권</span>
              </div>
              
              {/* 구분선 */}
              <div className="border-t border-gray-200 my-1"></div>
              
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-50 border border-blue-200"></div>
                <span className="text-sm">홈 팀</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-50 border border-red-200"></div>
                <span className="text-sm">원정 팀</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }, [standings, homeTeamId, awayTeamId, getFormStyle, getStatusColor, handleRowClick]);

  // 간단한 래퍼 반환
  return (
    <div className="w-full">
      {standingsTable}
    </div>
  );
}

export default memo(Standings);