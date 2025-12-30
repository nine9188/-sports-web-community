'use client';

import { memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';
import { getTeamDisplayName } from '@/domains/livescore/constants/teams';
import { STANDINGS_LEGENDS, LEAGUE_IDS } from '@/domains/livescore/components/football/match/tabs/constants/standings';

interface StandingTeam {
  rank?: number;
  team?: {
    id?: number;
    name?: string;
    logo?: string;
  };
  points?: number;
  goalsDiff?: number;
  form?: string;
  description?: string;
  all?: {
    played?: number;
    win?: number;
    draw?: number;
    lose?: number;
    goals?: {
      for?: number;
      against?: number;
    };
  };
}

interface LeagueStandingsTableProps {
  standings: {
    league?: {
      id?: number;
      name?: string;
      standings?: StandingTeam[][];
    };
  } | null;
  leagueId: number;
}

// 테이블 스타일 정의
const tableStyles = {
  header: "px-1 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider",
  cell: "px-1 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-center",
};

// 팀 로고 컴포넌트
const TeamLogo = memo(({ teamName, teamId }: { teamName: string; teamId?: number }) => {
  return (
    <div className="w-6 h-6 flex-shrink-0 relative transform-gpu">
      {teamId ? (
        <UnifiedSportsImage
          imageId={teamId}
          imageType={ImageType.Teams}
          alt={teamName || '팀'}
          width={24}
          height={24}
          className="object-contain w-6 h-6"
        />
      ) : (
        <div className="w-6 h-6 bg-gray-200 flex items-center justify-center text-gray-400 text-xs rounded">
          ?
        </div>
      )}
    </div>
  );
});
TeamLogo.displayName = 'TeamLogo';

const getStatusColor = (description: string) => {
  if (!description) return 'bg-transparent';
  const desc = description.toLowerCase();

  if (desc.includes('champions league') || desc.includes('afc champions')) {
    if (desc.includes('play-off')) return 'bg-yellow-500';
    return 'bg-green-600';
  }
  if (desc.includes('europa league')) {
    if (desc.includes('play-off')) return 'bg-yellow-500';
    return 'bg-blue-500';
  }
  if (desc.includes('conference league')) {
    if (desc.includes('play-off')) return 'bg-yellow-500';
    return 'bg-cyan-500';
  }
  if (desc.includes('promotion')) {
    if (desc.includes('play-off')) return 'bg-green-400';
    return 'bg-green-600';
  }
  if (desc.includes('relegation')) {
    if (desc.includes('play-off')) return 'bg-orange-500';
    return 'bg-red-500';
  }
  if (desc.includes('playoff')) return 'bg-green-500';

  return 'bg-transparent';
};

const getFormStyle = (result: string) => {
  switch (result) {
    case 'W': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
    case 'D': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
    case 'L': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
    default: return 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  }
};

// 리그 ID에 따라 적절한 범례 가져오기
const getLegendForLeague = (leagueId: number) => {
  switch (leagueId) {
    case LEAGUE_IDS.PREMIER_LEAGUE: return STANDINGS_LEGENDS.premierLeague;
    case LEAGUE_IDS.LA_LIGA: return STANDINGS_LEGENDS.laLiga;
    case LEAGUE_IDS.BUNDESLIGA: return STANDINGS_LEGENDS.bundesliga;
    case LEAGUE_IDS.SERIE_A: return STANDINGS_LEGENDS.serieA;
    case LEAGUE_IDS.LIGUE_1: return STANDINGS_LEGENDS.ligue1;
    case LEAGUE_IDS.SCOTTISH_PREMIERSHIP: return STANDINGS_LEGENDS.scottishPremiership;
    case LEAGUE_IDS.EREDIVISIE: return STANDINGS_LEGENDS.eredivisie;
    case LEAGUE_IDS.PRIMEIRA_LIGA: return STANDINGS_LEGENDS.primeiraLiga;
    case LEAGUE_IDS.K_LEAGUE_1: return STANDINGS_LEGENDS.kLeague1;
    case LEAGUE_IDS.J_LEAGUE_1: return STANDINGS_LEGENDS.jLeague1;
    case LEAGUE_IDS.CHINESE_SUPER_LEAGUE: return STANDINGS_LEGENDS.chineseSuperLeague;
    case LEAGUE_IDS.SAUDI_PRO_LEAGUE: return STANDINGS_LEGENDS.saudiProLeague;
    case LEAGUE_IDS.MLS: return STANDINGS_LEGENDS.mls;
    case LEAGUE_IDS.BRASILEIRAO: return STANDINGS_LEGENDS.brasileirao;
    case LEAGUE_IDS.LIGA_MX: return STANDINGS_LEGENDS.ligaMX;
    case LEAGUE_IDS.CHAMPIONSHIP: return STANDINGS_LEGENDS.championship;
    case LEAGUE_IDS.CHAMPIONS_LEAGUE: return STANDINGS_LEGENDS.championsLeague;
    case LEAGUE_IDS.EUROPA_LEAGUE: return STANDINGS_LEGENDS.europaLeague;
    case LEAGUE_IDS.CONFERENCE_LEAGUE: return STANDINGS_LEGENDS.conferenceLeague;
    default: return STANDINGS_LEGENDS.default;
  }
};

const LeagueStandingsTable = memo(({ standings, leagueId }: LeagueStandingsTableProps) => {
  const router = useRouter();

  const handleRowClick = useCallback((teamId: number) => {
    router.push(`/livescore/football/team/${teamId}`);
  }, [router]);

  if (!standings?.league?.standings || standings.league.standings.length === 0) {
    return (
      <Container className="bg-white dark:bg-[#1D1D1D]">
        <ContainerHeader>
          <ContainerTitle>순위표</ContainerTitle>
        </ContainerHeader>
        <ContainerContent>
          <div className="text-center py-8">
            <p className="text-sm text-gray-700 dark:text-gray-300">현재 리그 순위 데이터가 없습니다.</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">시즌이 시작되지 않았거나 종료되었을 수 있습니다.</p>
          </div>
        </ContainerContent>
      </Container>
    );
  }

  const leagueData = standings.league;

  return (
    <div className="w-full space-y-4">
      {leagueData.standings!.map((standingsGroup, groupIndex) => (
        <Container key={groupIndex} className="bg-white dark:bg-[#1D1D1D]">
          <ContainerHeader>
            <ContainerTitle>
              {leagueData.standings!.length > 1 ? `Group ${groupIndex + 1}` : '순위표'}
            </ContainerTitle>
          </ContainerHeader>

          <ContainerContent className="p-0">
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

                <thead className="bg-[#F5F5F5] dark:bg-[#262626]">
                  <tr>
                    <th className="md:hidden px-1 py-1 text-center text-xs font-medium text-gray-500 dark:text-gray-400">#</th>
                    <th className="hidden md:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">순위</th>
                    <th className="px-2 py-2 md:px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">팀</th>
                    <th className="hidden md:table-cell px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">경기</th>
                    <th className={tableStyles.header}>승</th>
                    <th className={tableStyles.header}>무</th>
                    <th className={tableStyles.header}>패</th>
                    <th className="hidden md:table-cell px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">득점</th>
                    <th className="hidden md:table-cell px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">실점</th>
                    <th className="hidden md:table-cell px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">득실차</th>
                    <th className={tableStyles.header}>승점</th>
                    <th className="hidden md:table-cell px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">최근 5경기</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-black/5 dark:divide-white/10">
                  {standingsGroup.map((standing) => {
                    const statusColor = getStatusColor(standing.description || '');

                    return (
                      <tr
                        key={standing.team?.id || standing.rank}
                        className="cursor-pointer transition-colors hover:bg-[#EAEAEA] dark:hover:bg-[#333333]"
                        onClick={() => standing.team?.id && handleRowClick(standing.team.id)}
                      >
                        {/* 모바일용 순위 */}
                        <td className="md:hidden px-1 py-1 text-center text-xs relative w-8">
                          <div className={`absolute inset-y-0 left-0 w-1 ${statusColor}`} />
                          <span className="pl-1 text-gray-900 dark:text-gray-100">{standing.rank}</span>
                        </td>

                        {/* 데스크톱용 순위 */}
                        <td className="hidden md:table-cell px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 relative">
                          <div className={`absolute inset-y-0 left-0 w-1 ${statusColor}`} />
                          <span className="pl-2">{standing.rank}</span>
                        </td>

                        {/* 팀 정보 */}
                        <td className="px-2 py-2 md:px-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          <div className="flex items-center gap-1 md:gap-2">
                            <TeamLogo
                              teamName={standing.team?.name || ''}
                              teamId={standing.team?.id}
                            />
                            <div className="flex items-center max-w-[calc(100%-30px)]">
                              <span className="block truncate text-ellipsis overflow-hidden max-w-full pr-1">
                                {(() => {
                                  if (!standing.team?.id) return standing.team?.name || '알 수 없음';
                                  const koreanName = getTeamDisplayName(standing.team.id, { language: 'ko' });
                                  return koreanName.startsWith('팀 ') ? (standing.team.name || '팀 이름 없음') : koreanName;
                                })()}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 경기 수 - 모바일 숨김 */}
                        <td className="hidden md:table-cell px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-center">
                          {standing.all?.played || 0}
                        </td>

                        {/* 승/무/패 */}
                        <td className={`${tableStyles.cell} text-xs md:text-sm px-0 md:px-1`}>{standing.all?.win || 0}</td>
                        <td className={`${tableStyles.cell} text-xs md:text-sm px-0 md:px-1`}>{standing.all?.draw || 0}</td>
                        <td className={`${tableStyles.cell} text-xs md:text-sm px-0 md:px-1`}>{standing.all?.lose || 0}</td>

                        {/* 득점, 실점, 득실차 - 모바일 숨김 */}
                        <td className="hidden md:table-cell px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-center">
                          {standing.all?.goals?.for || 0}
                        </td>
                        <td className="hidden md:table-cell px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-center">
                          {standing.all?.goals?.against || 0}
                        </td>
                        <td className="hidden md:table-cell px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-center">
                          {(standing.goalsDiff || 0) > 0 ? `+${standing.goalsDiff}` : standing.goalsDiff || 0}
                        </td>

                        {/* 승점 */}
                        <td className={`${tableStyles.cell} text-xs md:text-sm font-semibold`}>{standing.points || 0}</td>

                        {/* 최근 5경기 - 모바일 숨김 */}
                        <td className="hidden md:table-cell px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-center">
                          <div className="flex justify-center gap-1">
                            {standing.form?.split('').map((result, idx) => (
                              <div
                                key={idx}
                                className={`w-6 h-6 flex items-center justify-center ${getFormStyle(result)} text-xs font-medium rounded`}
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
          </ContainerContent>
        </Container>
      ))}

      {/* 범례 */}
      <Container className="bg-white dark:bg-[#1D1D1D]">
        <ContainerHeader>
          <ContainerTitle>범례</ContainerTitle>
        </ContainerHeader>
        <ContainerContent>
          <div className="flex flex-col space-y-2">
            {(() => {
              const legend = getLegendForLeague(leagueData.id || leagueId);
              return legend.items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className={`w-4 h-4 ${item.color} rounded-sm`}></div>
                  <span className="text-sm text-gray-900 dark:text-gray-100">{item.label}</span>
                </div>
              ));
            })()}
          </div>
        </ContainerContent>
      </Container>
    </div>
  );
});

LeagueStandingsTable.displayName = 'LeagueStandingsTable';

export default LeagueStandingsTable;
