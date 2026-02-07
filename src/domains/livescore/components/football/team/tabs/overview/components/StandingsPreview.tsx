'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import { StandingDisplay } from '@/domains/livescore/types/standings';
import { findTeamStanding, getDisplayStandings, getLeagueInfo, getLeagueForStandings } from '../utils/standingUtils';
import FormDisplay from './FormDisplay';
import { getLeagueKoreanName } from '@/domains/livescore/constants/league-mappings';
import { Container, ContainerHeader, ContainerTitle, Button } from '@/shared/components/ui';

// 4590 표준: placeholder URL
const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';
const LEAGUE_PLACEHOLDER = '/images/placeholder-league.svg';

interface StandingsPreviewProps {
  standings: StandingDisplay[] | undefined;
  teamId: number;
  safeLeague: {
    name: string;
    logo: string;
  };
  onTabChange: (tab: string) => void;
  // 4590 표준: 이미지 Storage URL
  teamLogoUrls?: Record<number, string>;
  leagueLogoUrls?: Record<number, string>;
  leagueLogoDarkUrls?: Record<number, string>;  // 다크모드 리그 로고
}

export default function StandingsPreview({
  standings,
  teamId,
  safeLeague,
  onTabChange,
  teamLogoUrls = {},
  leagueLogoUrls = {},
  leagueLogoDarkUrls = {}
}: StandingsPreviewProps) {
  const router = useRouter();

  // 다크모드 감지
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // 4590 표준: 헬퍼 함수
  const getTeamLogo = (id: number) => teamLogoUrls[id] || TEAM_PLACEHOLDER;
  const getLeagueLogo = (id: number) => {
    if (isDark && leagueLogoDarkUrls[id]) return leagueLogoDarkUrls[id];
    return leagueLogoUrls[id] || LEAGUE_PLACEHOLDER;
  };
  
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
  const tableHeaderStyle = "px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400";
  const tableCellStyle = "px-3 py-2 text-sm text-gray-900 dark:text-[#F0F0F0]";
  
  // 순위 데이터가 없으면 렌더링하지 않음
  if (displayStandings.length === 0 || !leagueInfo) {
    return null;
  }
  
  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <ContainerHeader>
        <div className="w-6 h-6 relative flex-shrink-0 mr-2">
          <UnifiedSportsImageClient
            src={getLeagueLogo(displayLeagueInfo?.id || leagueInfo.id)}
            alt={displayLeagueInfo?.name || leagueInfo.name || safeLeague.name || '리그'}
            width={24}
            height={24}
            className="object-contain w-6 h-6"
          />
        </div>
        <ContainerTitle>
          {getLeagueKoreanName(displayLeagueInfo?.name || leagueInfo.name || safeLeague.name) || '리그 순위'}
        </ContainerTitle>
      </ContainerHeader>
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
          <thead className="bg-[#F5F5F5] dark:bg-[#262626]">
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
                  className={`border-b border-black/5 dark:border-white/10 ${isCurrentTeam ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''} hover:bg-[#EAEAEA] dark:hover:bg-[#333333] cursor-pointer transition-colors`}
                  onClick={() => standing.team.id !== teamId && handleTeamClick(standing.team.id)}
                >
                  <td className={tableCellStyle}>{standing.rank}</td>
                  <td className={tableCellStyle}>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 relative flex-shrink-0">
                        <UnifiedSportsImageClient
                          src={getTeamLogo(standing.team.id)}
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
      <Button
        variant="secondary"
        onClick={() => onTabChange('standings')}
        className="w-full rounded-none rounded-b-lg border-t border-black/5 dark:border-white/10"
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </Button>
    </Container>
  );
} 