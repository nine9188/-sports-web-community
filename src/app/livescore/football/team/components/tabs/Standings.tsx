'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

// 구체적인 인터페이스 정의
interface League {
  id: number;
  name: string;
  logo: string;
}

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

interface LeagueStanding {
  league: League;
  standings: StandingItem[][];
}

interface StandingsProps {
  standings: LeagueStanding[];
  teamId: number;
}

export default function Standings({ standings, teamId }: StandingsProps) {
  const router = useRouter();

  // 테이블 스타일 정의
  const tableHeaderStyle = "px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
  const tableCellStyle = "px-3 py-2 whitespace-nowrap text-sm text-gray-900";

  // 데이터가 없는 경우 처리
  if (!standings || !Array.isArray(standings) || standings.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-center">
        <p className="text-gray-500">순위 정보가 없습니다.</p>
      </div>
    );
  }

  // 폼 표시 컴포넌트 - Overview와 동일한 스타일로 통일
  const FormDisplay = ({ form }: { form: string }) => {
    if (!form) return null;
    
    return (
      <div className="flex gap-1">
        {form.split('').map((result, index) => {
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
              className={`w-6 h-6 flex items-center justify-center ${bgColor} ${textColor} text-xs font-bold`}
              title={result === 'W' ? '승리' : result === 'D' ? '무승부' : '패배'}
            >
              {result}
            </div>
          );
        })}
      </div>
    );
  };

  // 순위 설명에 따른 색상 결정 함수 - 매치 스탠딩과 동일하게 수정
  const getStatusColor = (description: string) => {
    if (!description) return 'bg-transparent';
    
    const desc = description.toLowerCase();
    
    // 챔피언스리그 단계별 색상
    if (desc.includes('champions league')) {
      if (desc.includes('1/8-finals')) return 'bg-green-600';
      if (desc.includes('1/16-finals')) return 'bg-green-500';
      return 'bg-green-400';
    }
    
    // 유로파리그 단계별 색상
    if (desc.includes('europa league')) {
      if (desc.includes('1/8-finals')) return 'bg-blue-600';
      if (desc.includes('1/16-finals')) return 'bg-blue-500';
      return 'bg-blue-400';
    }
    
    // 컨퍼런스리그 단계별 색상
    if (desc.includes('conference league group')) return 'bg-cyan-600';
    if (desc.includes('conference league qualification')) return 'bg-cyan-500';
    if (desc.includes('conference league')) return 'bg-cyan-400';
    
    // 강등 관련 색상
    if (desc.includes('relegation group')) return 'bg-red-600';
    if (desc.includes('relegation qualification')) return 'bg-red-500';
    if (desc.includes('relegation')) return 'bg-red-400';
    
    return 'bg-transparent';
  };

  return (
    <div className="space-y-8">
      {/* 모든 리그 순위를 순차적으로 표시 */}
      {standings.map((league, leagueIndex) => {
        const leagueInfo = league.league || {};
        const standingsData = league.standings || [];
        
        if (!standingsData || standingsData.length === 0) return null;
        
        return (
          <div key={leagueInfo.id || leagueIndex}>
            {/* 리그 정보 헤더 - 배경색 추가 */}
            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
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
              <h4 className="text-lg font-semibold text-gray-800">{leagueInfo.name || '리그 순위'}</h4>
            </div>

            {/* 순위표 */}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className={tableHeaderStyle}>순위</th>
                    <th className={tableHeaderStyle}>팀</th>
                    <th className={`${tableHeaderStyle} text-center`}>경기</th>
                    <th className={`${tableHeaderStyle} text-center`}>승</th>
                    <th className={`${tableHeaderStyle} text-center`}>무</th>
                    <th className={`${tableHeaderStyle} text-center`}>패</th>
                    <th className={`${tableHeaderStyle} text-center`}>득점</th>
                    <th className={`${tableHeaderStyle} text-center`}>실점</th>
                    <th className={`${tableHeaderStyle} text-center`}>득실차</th>
                    <th className={`${tableHeaderStyle} text-center`}>승점</th>
                    <th className={`${tableHeaderStyle} text-center`}>최근 5경기</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {standingsData.flat().map((standing: StandingItem) => (
                    <tr 
                      key={`${leagueIndex}-${standing.team?.id || Math.random()}`}
                      className={`hover:bg-gray-50 cursor-pointer relative ${standing.team?.id === teamId ? 'bg-blue-50' : ''}`}
                      onClick={() => standing.team?.id && router.push(`/livescore/football/team/${standing.team.id}`)}
                    >
                      <td className={`${tableCellStyle} relative`}>
                        {/* 순위 설명에 따른 색상 표시 - 왼쪽 세로 바 */}
                        {standing.description && (
                          <div className={`absolute inset-y-0 left-0 w-1 ${getStatusColor(standing.description)}`} />
                        )}
                        <span className="pl-2">{standing.rank || '-'}</span>
                      </td>
                      <td className={tableCellStyle}>
                        <div className="flex items-center gap-2">
                          {standing.team?.logo && (
                            <div className="w-5 h-5 relative flex-shrink-0">
                              <Image
                                src={standing.team.logo}
                                alt={standing.team?.name || '팀'}
                                fill
                                sizes="20px"
                                className="object-contain"
                              />
                            </div>
                          )}
                          <span>{standing.team?.name || '알 수 없음'}</span>
                        </div>
                      </td>
                      <td className={`${tableCellStyle} text-center`}>{standing.all?.played || 0}</td>
                      <td className={`${tableCellStyle} text-center`}>{standing.all?.win || 0}</td>
                      <td className={`${tableCellStyle} text-center`}>{standing.all?.draw || 0}</td>
                      <td className={`${tableCellStyle} text-center`}>{standing.all?.lose || 0}</td>
                      <td className={`${tableCellStyle} text-center`}>{standing.all?.goals?.for || 0}</td>
                      <td className={`${tableCellStyle} text-center`}>{standing.all?.goals?.against || 0}</td>
                      <td className={`${tableCellStyle} text-center`}>{standing.goalsDiff || 0}</td>
                      <td className={`${tableCellStyle} text-center font-semibold`}>{standing.points || 0}</td>
                      <td className={`${tableCellStyle} text-center`}>
                        <div className="flex justify-center">
                          <FormDisplay form={standing.form || ''} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* 범례 표시 - 매치 스탠딩과 동일한 색상으로 수정 */}
            <div className="mt-4 pt-3 border-t border-gray-200">
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
                  <span className="text-sm">현재 경기 팀</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
} 