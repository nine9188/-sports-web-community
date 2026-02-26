'use client';

/**
 * 4590 표준 적용:
 * - 리그/팀 이미지: UnifiedSportsImageClient 사용
 * - URL은 props로 전달받거나 placeholder 사용
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, ContainerHeader, ContainerTitle, TabList, type TabItem } from '@/shared/components/ui';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import { StandingsData, League } from '../../types';
import { useLeagueStandings } from '../../hooks/useLeagueQueries';
import { MAJOR_LEAGUE_IDS } from '@/domains/livescore/constants/league-mappings';
import { getTeamById } from '@/domains/livescore/constants/teams';

// 4590 표준: placeholder 상수
const LEAGUE_PLACEHOLDER = '/images/placeholder-league.svg';
const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';

// API ID와 화면 표시용 리그 정보 매핑
const LEAGUES: League[] = [
  { id: 'premier', name: 'EPL', fullName: '프리미어 리그', apiId: MAJOR_LEAGUE_IDS.PREMIER_LEAGUE },
  { id: 'laliga', name: '라리가', fullName: '라리가', apiId: MAJOR_LEAGUE_IDS.LA_LIGA },
  { id: 'bundesliga', name: '분데스', fullName: '분데스리가', apiId: MAJOR_LEAGUE_IDS.BUNDESLIGA },
  { id: 'serieA', name: '세리에A', fullName: '세리에 A', apiId: MAJOR_LEAGUE_IDS.SERIE_A },
  { id: 'ligue1', name: '리그앙', fullName: '리그 1', apiId: MAJOR_LEAGUE_IDS.LIGUE_1 },
];

// 팀 이름 짧게 표시 (최대 8자)
const shortenTeamName = (name: string) => {
  if (name.length <= 8) return name;
  return name.substring(0, 8);
};

// 팀 ID로 한글 이름 가져오기
const getKoreanTeamName = (teamId: number, name: string) => {
  const teamInfo = getTeamById(teamId);
  return teamInfo?.name_ko || shortenTeamName(name);
};

interface LeagueStandingsProps {
  initialLeague?: string;
  initialStandings?: StandingsData | null;
  // 4590 표준: 이미지 Storage URL
  leagueLogoUrls?: Record<number, string>;
  leagueLogoUrlsDark?: Record<number, string>;  // 다크모드용 리그 로고
  teamLogoUrls?: Record<number, string>;
}

/**
 * LeagueStandings - React Query 기반 리그 순위 컴포넌트
 *
 * 서버에서 초기 데이터를 받아 즉시 표시 (스켈레톤 없음)
 * 탭 변경 시 이전 데이터 유지하면서 새 데이터 fetch
 */
export default function LeagueStandings({
  initialLeague = 'premier',
  initialStandings = null,
  leagueLogoUrls = {},
  leagueLogoUrlsDark = {},
  teamLogoUrls: initialTeamLogoUrls = {},
}: LeagueStandingsProps) {
  // UI 상태 관리
  const [activeLeague, setActiveLeague] = useState(initialLeague);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  // React Query로 리그 순위 데이터 관리 (teamLogoUrls 포함)
  const { standings, teamLogoUrls: queryTeamLogoUrls, isFetching, error } = useLeagueStandings(activeLeague, {
    initialData: activeLeague === initialLeague ? initialStandings : undefined,
    enabled: !isMobile, // 모바일에서는 비활성화
  });

  // 4590 표준: URL 헬퍼 함수
  // 쿼리 결과 우선, 없으면 초기 props 사용
  const effectiveTeamLogoUrls = Object.keys(queryTeamLogoUrls).length > 0 ? queryTeamLogoUrls : initialTeamLogoUrls;
  const getLeagueLogo = (id: number) => leagueLogoUrls[id] || LEAGUE_PLACEHOLDER;
  const getLeagueLogoDark = (id: number) => leagueLogoUrlsDark[id] || leagueLogoUrls[id] || LEAGUE_PLACEHOLDER;
  const getTeamLogo = (id: number) => effectiveTeamLogoUrls[id] || TEAM_PLACEHOLDER;

  // 모바일 환경 체크
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 728);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const handleTeamClick = (teamId: number) => {
    router.push(`/livescore/football/team/${teamId}?tab=overview`);
  };

  // 현재 선택된 리그 정보
  const currentLeague = LEAGUES.find(l => l.id === activeLeague);

  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <ContainerHeader>
        <ContainerTitle>축구 팀순위</ContainerTitle>
      </ContainerHeader>

      {/* 리그 선택 탭 */}
      <TabList
        tabs={LEAGUES.map(league => ({ id: league.id, label: league.name })) as TabItem[]}
        activeTab={activeLeague}
        onTabChange={setActiveLeague}
        variant="contained"
        className="mb-0"
      />

      {/* 선택된 리그 정보 - 항상 표시 */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#FAFAFA] dark:bg-[#232323]">
        <UnifiedSportsImageClient
          src={getLeagueLogo(currentLeague?.apiId || 39)}
          srcDark={getLeagueLogoDark(currentLeague?.apiId || 39)}
          alt={currentLeague?.fullName || ''}
          width={20}
          height={20}
          className="object-contain"
        />
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {currentLeague?.fullName}
        </span>
        {/* 데이터 로딩 중 미세한 표시 */}
        {isFetching && (
          <span className="ml-auto text-[10px] text-gray-400 dark:text-gray-500">
            갱신중...
          </span>
        )}
      </div>

      {/* 순위표 */}
      <div className={`min-h-[200px] bg-white dark:bg-[#1D1D1D] ${isFetching ? 'opacity-70' : ''} transition-opacity`}>
        {error ? (
          <div className="p-4 text-center text-red-500 dark:text-red-400 text-sm">
            {error}
          </div>
        ) : standings && standings.standings && standings.standings.length > 0 ? (
          <div>
            <table className="w-full text-xs border-collapse table-fixed">
              <colgroup>
                {/* 순위 */}
                <col className="w-[30px]" />
                {/* 팀 (남은 공간 모두 차지) */}
                <col />
                {/* 경기 */}
                <col className="w-[28px]" />
                {/* 승 */}
                <col className="w-[20px]" />
                {/* 무 */}
                <col className="w-[20px]" />
                {/* 패 */}
                <col className="w-[20px]" />
                {/* 승점 */}
                <col className="w-[30px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-black/5 dark:border-white/10 text-gray-500 dark:text-gray-400">
                  <th className="text-center py-1 px-0 text-xs font-medium">순위</th>
                  <th className="text-left py-1 px-1 text-xs font-medium">팀</th>
                  <th className="text-center py-1 px-0 text-xs font-medium">경기</th>
                  <th className="text-center py-1 px-0 text-xs font-medium">승</th>
                  <th className="text-center py-1 px-0 text-xs font-medium">무</th>
                  <th className="text-center py-1 px-0 text-xs font-medium">패</th>
                  <th className="text-center py-1 px-0 text-xs font-medium">승점</th>
                </tr>
              </thead>
              <tbody>
                {standings.standings[0].map((team, index) => (
                  <tr
                    key={team.team.team_id}
                    className={`${index < standings.standings[0].length - 1 ? 'border-b border-black/5 dark:border-white/10' : ''} hover:bg-[#EAEAEA] dark:hover:bg-[#333333] cursor-pointer transition-colors text-gray-900 dark:text-[#F0F0F0]`}
                    onClick={() => handleTeamClick(team.team.team_id)}
                  >
                    <td className="text-center py-1.5 px-0">{team.rank}</td>
                    <td className="text-left py-1.5 px-1">
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 relative flex-shrink-0">
                          <UnifiedSportsImageClient
                            src={getTeamLogo(team.team.team_id)}
                            alt={team.team.name}
                            width={20}
                            height={20}
                            className="object-contain"
                          />
                        </div>
                        <span className="truncate max-w-[100px] text-sm">
                          {getKoreanTeamName(team.team.team_id, team.team.name)}
                        </span>
                      </div>
                    </td>
                    <td className="text-center py-1 px-0">{team.all.played}</td>
                    <td className="text-center py-1 px-0">{team.all.win}</td>
                    <td className="text-center py-1 px-0">{team.all.draw}</td>
                    <td className="text-center py-1 px-0">{team.all.lose}</td>
                    <td className="text-center py-1 px-0 font-medium">{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">데이터가 없습니다.</p>
          </div>
        )}
      </div>
    </Container>
  );
}
