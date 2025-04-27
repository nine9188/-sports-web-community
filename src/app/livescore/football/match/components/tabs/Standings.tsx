'use client';

import { useState, useEffect, memo, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Team } from '../../types';
import { getTeamById, TeamMapping } from '@/app/constants';
import { StandingsData } from '@/app/actions/livescore/matches/standings';
import { LoadingState, ErrorState, EmptyState } from '@/app/livescore/football/components/CommonComponents';

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

interface StandingsProps {
  matchId: string;
  matchData?: {
    standings?: StandingsData | null;
    homeTeam?: Team;
    awayTeam?: Team;
  };
}

// 팀 로고 컴포넌트 - 메모이제이션
const TeamLogo = memo(({ teamName, originalLogo, teamId }: { teamName: string; originalLogo: string; teamId?: number }) => {
  const [imgError, setImgError] = useState(false);
  const [teamInfo, setTeamInfo] = useState<TeamMapping | undefined>(undefined);

  // 팀 ID가 있는 경우 팀 정보를 가져옴
  useEffect(() => {
    if (teamId) {
      const team = getTeamById(teamId);
      if (team) {
        setTeamInfo(team);
      }
    }
  }, [teamId]);

  const logoUrl = teamInfo?.logo || (imgError ? '/placeholder-team.png' : originalLogo || '/placeholder-team.png');
  const displayName = teamInfo?.name_ko || teamName;

  return (
    <div className="w-6 h-6 flex-shrink-0 relative transform-gpu">
      <Image
        src={logoUrl}
        alt={displayName}
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
  container: "mb-4 bg-white rounded-lg border overflow-hidden",
  header: "px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider",
  cell: "px-1 py-2 whitespace-nowrap text-sm text-gray-900 text-center",
  smallCol: "w-8", // 너비 감소
  mediumCol: "w-10", // 너비 감소
  formBadgeWin: "bg-green-100 text-green-800",
  formBadgeDraw: "bg-yellow-100 text-yellow-800",
  formBadgeLoss: "bg-red-100 text-red-800"
};

function Standings({ matchData }: StandingsProps) {
  const router = useRouter();
  const [standings, setStandings] = useState<StandingsData | null>(matchData?.standings || null);
  const [homeTeamId, setHomeTeamId] = useState<number | null>(matchData?.homeTeam?.id || null);
  const [awayTeamId, setAwayTeamId] = useState<number | null>(matchData?.awayTeam?.id || null);
  const [teamCache, setTeamCache] = useState<Record<number, TeamMapping>>({});
  const [loading, setLoading] = useState(!matchData?.standings);
  const [error] = useState<string | null>(null);
  
  // matchData prop이 변경될 때 상태 업데이트
  useEffect(() => {
    if (matchData) {
      // 순위 데이터 설정
      if (matchData.standings) {
        setStandings(matchData.standings);
        setLoading(false);
      }
      
      // 팀 정보 설정
      if (matchData.homeTeam) {
        setHomeTeamId(matchData.homeTeam.id);
      }
      
      if (matchData.awayTeam) {
        setAwayTeamId(matchData.awayTeam.id);
      }
    }
  }, [matchData]);
  
  // 팀 정보 캐싱
  useEffect(() => {
    // 모든 팀 ID를 수집
    const teamIds = new Set<number>();
    
    // 홈, 어웨이 팀 추가
    if (homeTeamId) teamIds.add(homeTeamId);
    if (awayTeamId) teamIds.add(awayTeamId);
    
    // standings에서 팀 ID 추출
    if (standings?.standings?.league?.standings) {
      standings.standings.league.standings.forEach(group => {
        group.forEach(standing => {
          if (standing.team?.id) {
            teamIds.add(standing.team.id);
          }
        });
      });
    }
    
    // 아직 캐시에 없는 팀 정보 추가
    const newTeamCache = { ...teamCache };
    let cacheUpdated = false;
    
    teamIds.forEach(teamId => {
      if (!newTeamCache[teamId]) {
        const teamInfo = getTeamById(teamId);
        if (teamInfo) {
          newTeamCache[teamId] = teamInfo;
          cacheUpdated = true;
        }
      }
    });
    
    // 캐시가 업데이트되었을 때만 상태 업데이트
    if (cacheUpdated) {
      setTeamCache(newTeamCache);
    }
  }, [homeTeamId, awayTeamId, standings, teamCache]);

  // 팀 이름 표시 함수
  const getTeamDisplayName = useCallback((teamId: number, fallbackName: string): string => {
    const teamInfo = teamCache[teamId];
    return teamInfo?.name_ko || fallbackName;
  }, [teamCache]);

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
  
  // getFormStyle 함수를 useCallback으로 감싸기
  const getFormStyle = useCallback((result: string) => {
    switch(result) {
      case 'W': return tableStyles.formBadgeWin;
      case 'D': return tableStyles.formBadgeDraw;
      case 'L': return tableStyles.formBadgeLoss;
      default: return 'bg-gray-200 text-gray-700';
    }
  }, []);
  
  // 행 클릭 핸들러를 useCallback으로 감싸기
  const handleRowClick = useCallback((teamId: number) => {
    router.push(`/livescore/football/team/${teamId}`);
  }, [router]);
  
  // 비어있는 상태 컴포넌트를 memoize
  const renderEmptyState = useCallback(() => (
    <EmptyState
      title="순위 정보가 없습니다"
      message="이 경기에 대한 리그 순위 정보를 제공할 수 없습니다."
    />
  ), []);
  
  // 카테고리별 헤더 렌더링
  const standingsTable = useMemo(() => {
    // standings가 없거나 필요한 데이터가 없는 경우
    if (!standings || !standings?.standings?.league?.standings || !standings.standings.league.standings.length) {
      return renderEmptyState();
    }

    const leagueData = standings.standings.league;
    
    return (
      <div className="p-0 overflow-x-hidden">
        {/* 그룹별 순위표 */}
        {leagueData.standings.map((standingsGroup, groupIndex) => (
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
                    // 홈팀 또는 원정팀인지 확인하여 하이라이트 처리
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
                    
                    // 강등권, 유로파, 챔스 등 구분
                    const statusColor = getStatusColor(standing.description || '');
                    
                    return (
                      <tr 
                        key={standing.team.id}
                        className={rowClass}
                        onClick={() => handleRowClick(standing.team.id)}
                      >
                        {/* 모바일용 축약된 순위 */}
                        <td className="md:hidden px-1 py-1 text-center text-xs relative w-8">
                          <div className={`absolute inset-y-0 left-0 w-1 ${statusColor}`} />
                          <span className="pl-1">{standing.rank}</span>
                        </td>
                        
                        {/* 데스크톱용 순위 */}
                        <td className="hidden md:table-cell px-3 py-2 whitespace-nowrap text-sm text-gray-900 relative">
                          <div className={`absolute inset-y-0 left-0 w-1 ${statusColor}`} />
                          <span className="pl-2">{standing.rank}</span>
                        </td>
                        
                        {/* 팀 정보 - 고정 너비 사용 */}
                        <td className="px-2 py-2 md:px-3 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-1 md:gap-2">
                            <TeamLogo
                              teamName={standing.team.name || ''}
                              originalLogo={standing.team.logo || ''}
                              teamId={standing.team.id}
                            />
                            <div className="flex items-center max-w-[calc(100%-30px)]">
                              <span className="block truncate text-ellipsis overflow-hidden max-w-full pr-1">
                                {getTeamDisplayName(standing.team.id, standing.team.name) || '팀 이름 없음'}
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
                          {standing.goalsDiff > 0 ? `+${standing.goalsDiff}` : standing.goalsDiff || 0}
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
                <span className="text-sm">{getTeamDisplayName(homeTeamId || 0, '홈 팀')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-50 border border-red-200"></div>
                <span className="text-sm">{getTeamDisplayName(awayTeamId || 0, '원정 팀')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }, [standings, homeTeamId, awayTeamId, getFormStyle, getStatusColor, handleRowClick, getTeamDisplayName, renderEmptyState]);

  // 로딩, 에러, 표준 상태를 통합하여 조건부 렌더링 해결
  return (
    <div className="w-full">
      {loading ? (
        <LoadingState message="순위 데이터를 불러오는 중..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        standingsTable
      )}
    </div>
  );
}

export default memo(Standings);

