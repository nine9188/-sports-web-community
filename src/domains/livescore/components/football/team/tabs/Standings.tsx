'use client';

import { useState, memo, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Standing } from '@/domains/livescore/actions/teams/standings';
import { LoadingState, ErrorState, EmptyState } from '@/domains/livescore/components/common/CommonComponents';

// 구체적인 인터페이스 정의
interface Team {
  id: number;
  name: string;
  logo: string;
}

interface Goals {
  for: number;
  against: number;
}

interface AllStats {
  played: number;
  win: number;
  draw: number;
  lose: number;
  goals: Goals;
}

interface StandingItem {
  rank: number;
  team: Team;
  all: AllStats;
  goalsDiff: number;
  points: number;
  form: string;
  description?: string;
}

// 서버 액션에서 정의한 Standing 인터페이스와 일치시킴
type LeagueStanding = Standing;

interface StandingsProps {
  teamId: number;
  initialStandings?: LeagueStanding[];
  isLoading?: boolean;
  error?: string | null;
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

function Standings({ teamId, initialStandings, isLoading: externalLoading, error: externalError }: StandingsProps) {
  const router = useRouter();
  
  // 폼 결과에 따른 스타일 설정 함수
  const getFormStyle = useCallback((result: string) => {
    switch(result) {
      case 'W': return 'bg-green-100 text-green-800';
      case 'D': return 'bg-yellow-100 text-yellow-800';
      case 'L': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-200 text-gray-700';
    }
  }, []);

  // 순위 설명에 따른 색상 결정 함수
  const getStatusColor = useCallback((description?: string) => {
    if (!description) return 'bg-transparent';
    
    const desc = description.toLowerCase();
    
    if (desc.includes('champions league')) return 'bg-green-400';
    if (desc.includes('europa league')) return 'bg-blue-400';
    if (desc.includes('conference league')) return 'bg-blue-400';
    if (desc.includes('relegation')) return 'bg-red-400';
    
    return 'bg-transparent';
  }, []);

  // 다른 팀 페이지로 이동 핸들러
  const handleRowClick = useCallback((clickedTeamId: number) => {
    if (clickedTeamId !== teamId) {
      router.push(`/livescore/football/team/${clickedTeamId}`);
    }
  }, [router, teamId]);
  
  // 로딩 상태 처리
  if (externalLoading) {
    return <LoadingState message="순위 데이터를 불러오는 중..." />;
  }

  // 에러 상태 처리
  if (externalError) {
    return <ErrorState message={externalError || '순위 데이터를 불러올 수 없습니다'} />;
  }

  // 데이터가 없는 경우
  if (!initialStandings || initialStandings.length === 0) {
    return <EmptyState title="순위 데이터가 없습니다" message="현재 이 팀의 리그 순위 정보를 제공할 수 없습니다." />;
  }

  return (
    <div className="space-y-4">
      {/* 모든 리그 순위를 순차적으로 표시 */}
      {initialStandings.map((league, leagueIndex) => {
        const leagueInfo = league.league || {};
        const standingsData = league.league?.standings || [];
        
        if (!standingsData || standingsData.length === 0) return null;
        
        return (
          <div key={leagueInfo.id || leagueIndex} className={tableStyles.container}>
            {/* 리그 정보 헤더 */}
            <div className="px-3 py-2 border-b bg-gray-50">
              <div className="flex items-center gap-3">
                {leagueInfo.logo && (
                  <div className="w-6 h-6 relative flex-shrink-0">
                    <Image
                      src={leagueInfo.logo}
                      alt={leagueInfo.name || '리그'}
                      fill
                      sizes="24px"
                      className="object-contain"
                    />
                  </div>
                )}
                <h4 className="text-sm font-medium text-gray-800">{leagueInfo.name || '리그 순위'}</h4>
              </div>
            </div>

            {/* 순위표 */}
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
                    
                    <th className={tableStyles.header}>승</th>
                    <th className={tableStyles.header}>무</th>
                    <th className={tableStyles.header}>패</th>
                    
                    <th className="hidden md:table-cell px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">득점</th>
                    <th className="hidden md:table-cell px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">실점</th>
                    <th className="hidden md:table-cell px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">득실차</th>
                    
                    <th className={tableStyles.header}>승점</th>
                    
                    <th className="hidden md:table-cell px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">최근 5경기</th>
                  </tr>
                </thead>
                
                <tbody className="divide-y divide-gray-200">
                  {standingsData.flat().map((standing: StandingItem) => {
                    // 현재 팀 여부 확인
                    const isCurrentTeam = standing.team?.id === teamId;
                    
                    // 팀 행 스타일 설정
                    const rowClass = isCurrentTeam 
                      ? 'bg-blue-50 hover:bg-blue-100 cursor-pointer' 
                      : 'hover:bg-gray-100 cursor-pointer';
                    
                    return (
                      <tr 
                        key={`${leagueIndex}-${standing.team?.id || Math.random()}`}
                        className={rowClass}
                        onClick={() => handleRowClick(standing.team?.id)}
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
                              teamName={standing.team.name}
                              originalLogo={standing.team.logo}
                            />
                            <div className="flex items-center max-w-[calc(100%-30px)]">
                              <span className="block truncate text-ellipsis overflow-hidden max-w-full pr-1">
                                {standing.team.name || '알 수 없음'}
                              </span>
                              {isCurrentTeam && (
                                <span className="text-[10px] md:text-xs font-bold px-0.5 md:px-1.5 md:py-0.5 ml-0.5 md:ml-2 rounded inline-block flex-shrink-0 bg-blue-100 text-blue-800">
                                  현재
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
        );
      })}
      
      {/* 범례 */}
      <div className={tableStyles.container}>
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
              <span className="text-sm">현재 팀</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(Standings); 