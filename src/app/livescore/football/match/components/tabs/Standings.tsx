'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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
  standings?: StandingsData;
}

// 팀 로고 컴포넌트
const TeamLogo = ({ teamName, originalLogo }: { teamName: string; originalLogo: string }) => {
  const [imgError, setImgError] = useState(false);
  const leagueName = teamName || 'Team';

  return (
    <div className="w-6 h-6 flex-shrink-0 relative">
      <Image
        src={imgError ? '/placeholder-team.png' : originalLogo}
        alt={leagueName}
        fill
        sizes="24px"
        className="object-contain"
        onError={() => {
          if (!imgError) {
            setImgError(true);
          }
        }}
      />
    </div>
  );
};

// 테이블 스타일 정의 추가
const tableHeaderStyle = "px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
const tableCellStyle = "px-3 py-2 whitespace-nowrap text-sm text-gray-900";

export default function Standings({ standings }: StandingsProps) {
  const router = useRouter();
  const [homeTeamId, setHomeTeamId] = useState<number | null>(null);
  const [awayTeamId, setAwayTeamId] = useState<number | null>(null);
  
  useEffect(() => {
    if (standings) {
      // 직접 home/away 속성이 있는 경우
      if (standings.home?.id && standings.away?.id) {
        setHomeTeamId(standings.home.id);
        setAwayTeamId(standings.away.id);
      }
    }
  }, [standings]);

  const getFormStyle = (result: string) => {
    switch(result) {
      case 'W': return 'bg-green-100 text-green-800';
      case 'D': return 'bg-yellow-100 text-yellow-800';
      case 'L': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  const getStatusColor = (description: string) => {
    if (!description) return 'bg-transparent';
    
    const desc = description.toLowerCase();
    
    if (desc.includes('champions league')) return 'bg-green-400';
    if (desc.includes('europa league')) return 'bg-blue-400';
    if (desc.includes('conference league')) return 'bg-blue-400';
    if (desc.includes('relegation')) return 'bg-red-400';
    
    return 'bg-transparent';
  };

  const handleRowClick = (teamId: number) => {
    router.push(`/livescore/football/team/${teamId}`);
  };

  // 데이터가 없거나 로딩 중인 경우
  if (!standings || !standings.standings?.league?.standings || !standings.standings.league.standings.length) {
    return (
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
  }

  // 정상적인 데이터 구조인 경우
  const leagueData = standings.standings.league;
  
  return (
    <div>
      {/* 리그 정보 헤더 */}
      <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="w-8 h-8 relative flex-shrink-0">
          <Image
            src={leagueData.logo || '/placeholder-league.png'}
            alt={leagueData.name}
            fill
            sizes="32px"
            className="object-contain"
          />
        </div>
        <div>
          <h2 className="text-lg font-bold">{leagueData.name}</h2>
          <p className="text-sm text-gray-600"></p>
        </div>
      </div>

      {/* 그룹별 순위표 */}
      {leagueData.standings.map((standingsGroup: Standing[], groupIndex: number) => (
        <div key={groupIndex} className="mb-8">
          {leagueData.standings.length > 1 && (
            <h3 className="text-lg font-semibold mb-3">
              {standingsGroup[0]?.group ? `Group ${standingsGroup[0].group}` : `Group ${groupIndex + 1}`}
            </h3>
          )}
          
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
                {standingsGroup.map((standing: Standing) => {
                  // 각 행마다 팀 ID 확인 - 문자열 변환하여 비교
                  const isHomeTeam = String(standing.team.id) === String(homeTeamId);
                  const isAwayTeam = String(standing.team.id) === String(awayTeamId);
                  
                  // 팀 행 스타일 설정
                  let rowClass = 'cursor-pointer transition-colors duration-200';
                  
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
                      <td className={`${tableCellStyle} relative`}>
                        <div className={`absolute inset-y-0 left-0 w-1 ${getStatusColor(standing.description)}`} />
                        <span className="pl-2">{standing.rank}</span>
                      </td>
                      <td className={tableCellStyle}>
                        <div className="flex items-center gap-2">
                          <TeamLogo 
                            teamName={standing.team.name}
                            originalLogo={standing.team.logo}
                          />
                          <span className="flex items-center">
                            {standing.team.name}
                            {isHomeTeam && (
                              <span className="ml-2 text-xs font-bold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">홈</span>
                            )}
                            {isAwayTeam && (
                              <span className="ml-2 text-xs font-bold px-1.5 py-0.5 bg-red-100 text-red-800 rounded">원정</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className={`${tableCellStyle} text-center`}>{standing.all.played}</td>
                      <td className={`${tableCellStyle} text-center`}>{standing.all.win}</td>
                      <td className={`${tableCellStyle} text-center`}>{standing.all.draw}</td>
                      <td className={`${tableCellStyle} text-center`}>{standing.all.lose}</td>
                      <td className={`${tableCellStyle} text-center`}>{standing.all.goals.for}</td>
                      <td className={`${tableCellStyle} text-center`}>{standing.all.goals.against}</td>
                      <td className={`${tableCellStyle} text-center`}>{standing.goalsDiff}</td>
                      <td className={`${tableCellStyle} text-center font-semibold`}>{standing.points}</td>
                      <td className={`${tableCellStyle} text-center`}>
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
            <span className="text-sm">홈 팀</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-50 border border-red-200"></div>
            <span className="text-sm">원정 팀</span>
          </div>
        </div>
      </div>
    </div>
  );
}
