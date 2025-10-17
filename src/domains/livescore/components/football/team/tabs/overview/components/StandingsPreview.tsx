'use client';

import { useRouter } from 'next/navigation';
import ApiSportsImage from '@/shared/components/ApiSportsImage';
import { ImageType } from '@/shared/types/image';
import { StandingDisplay } from '@/domains/livescore/types/standings';
import { findTeamStanding, getDisplayStandings, getLeagueInfo, getLeagueForStandings } from '../utils/standingUtils';
import FormDisplay from './FormDisplay';
import { getLeagueKoreanName } from '@/domains/livescore/constants/league-mappings';

interface StandingsPreviewProps {
  standings: StandingDisplay[] | undefined;
  teamId: number;
  safeLeague: {
    name: string;
    logo: string;
  };
  onTabChange: (tab: string) => void;
}

export default function StandingsPreview({ standings, teamId, safeLeague, onTabChange }: StandingsPreviewProps) {
  const router = useRouter();
  
  // 현재 팀의 순위 정보 찾기
  const currentTeamStanding = findTeamStanding(standings, teamId);
  
  // 표시할 순위 범위 계산
  const displayStandings = getDisplayStandings(standings, teamId, currentTeamStanding);
  
  // 리그 정보 가져오기
  const leagueInfo = getLeagueInfo(standings);
  
  // 표시 중인 스탠딩의 리그 정보 가져오기
  const displayLeagueInfo = getLeagueForStandings(standings, displayStandings);
  
  // 팀 페이지로 이동하는 함수
  const handleTeamClick = (teamId: number) => {
    router.push(`/livescore/football/team/${teamId}`);
  };
  
  // 공통 스타일
  const tableHeaderStyle = "px-3 py-2 text-left text-xs font-medium text-gray-500";
  const tableCellStyle = "px-3 py-2 text-sm";
  
  // 순위 데이터가 없으면 렌더링하지 않음
  if (displayStandings.length === 0 || !leagueInfo) {
    return null;
  }
  
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="flex items-center p-2 border-b border-gray-200">
        <div className="w-6 h-6 relative flex-shrink-0 mr-2">
          <ApiSportsImage
            imageId={displayLeagueInfo?.id || leagueInfo.id}
            imageType={ImageType.Leagues}
            alt={displayLeagueInfo?.name || leagueInfo.name || safeLeague.name || '리그'}
            width={24}
            height={24}
            className="object-contain w-6 h-6"
          />
        </div>
        <h4 className="text-sm font-medium">
          {getLeagueKoreanName(displayLeagueInfo?.name || leagueInfo.name || safeLeague.name) || '리그 순위'}
        </h4>
      </div>
      <div className="overflow-hidden">
        <table className="w-full">
          <colgroup>
            <col className="w-10"/>
            <col className="w-[140px] md:w-[180px]"/>
            <col className="hidden md:table-column w-10"/>
            <col className="w-8"/>
            <col className="w-8"/>
            <col className="w-8"/>
            <col className="hidden md:table-column w-10"/>
            <col className="hidden md:table-column w-10"/>
            <col className="hidden md:table-column w-10"/>
            <col className="w-10"/>
            <col className="hidden md:table-column w-32"/>
          </colgroup>
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
            {displayStandings.map((standing, index) => {
              const isCurrentTeam = standing.team.id === teamId;
              return (
                <tr 
                  key={`standings-preview-${standing.team.id}-${standing.rank}-${index}`}
                  className={`border-b ${isCurrentTeam ? 'bg-blue-50' : ''} hover:bg-gray-50 cursor-pointer`}
                  onClick={() => standing.team.id !== teamId && handleTeamClick(standing.team.id)}
                >
                  <td className={tableCellStyle}>{standing.rank}</td>
                  <td className={tableCellStyle}>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 relative flex-shrink-0">
                        <ApiSportsImage
                          imageId={standing.team.id}
                          imageType={ImageType.Teams}
                          alt={standing.team.name}
                          width={20}
                          height={20}
                          className="object-contain w-5 h-5"
                        />
                      </div>
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
                    {standing.form && <FormDisplay form={standing.form} maxLength={5} />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* 전체 순위 보기 버튼 */}
      <button 
        onClick={() => onTabChange('standings')}
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
  );
} 