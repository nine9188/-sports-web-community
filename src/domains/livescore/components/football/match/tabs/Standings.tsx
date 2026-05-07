'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import { Standing, StandingsData, Team } from '@/domains/livescore/types/match';
import { useTeamLeague } from '@/shared/context/TeamLeagueContext';
import { Container, ContainerContent, ContainerHeader, ContainerTitle } from '@/shared/components/ui';
import { LEAGUE_IDS } from './constants/standings';
import CupRoundsView from '@/domains/livescore/components/football/leagues/CupRoundsView';
import type { CupRound } from '@/domains/livescore/actions/match/cupFixtures';
import MatchTabState from './MatchTabState';
import { getTeamSlugFromName } from '@/domains/livescore/utils/slugs';
import { teamUrl } from '@/domains/livescore/utils/urls';

const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';
const LEAGUE_PLACEHOLDER = '/images/placeholder-league.svg';

interface StandingsProps {
  matchId: string;
  matchData: {
    standings: StandingsData | null;
    homeTeam?: Team;
    awayTeam?: Team;
  };
  teamLogoUrls?: Record<number, string>;
  leagueLogoUrls?: Record<number, string>;
  leagueLogoDarkUrls?: Record<number, string>;
  cupRoundsData?: CupRound[];
  isLoading?: boolean;
}

const headerCell = 'px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap';
const bodyCell = 'px-2 py-2 text-center text-[13px] text-gray-900 dark:text-gray-100 whitespace-nowrap';

const TeamLogo = memo(({ teamName, logoUrl }: { teamName: string; logoUrl: string }) => (
  <div className="w-6 h-6 flex-shrink-0 relative">
    <UnifiedSportsImageClient
      src={logoUrl}
      alt={teamName || '팀'}
      width={24}
      height={24}
      className="object-contain w-6 h-6"
    />
  </div>
));
TeamLogo.displayName = 'TeamLogo';

function getFormStyle(result: string) {
  switch (result) {
    case 'W':
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
    case 'D':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
    case 'L':
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
    default:
      return 'bg-[#EAEAEA] dark:bg-[#333333] text-gray-700 dark:text-gray-300';
  }
}

function getStatusColor(leagueId: number, rank: number, description?: string) {
  switch (leagueId) {
    case LEAGUE_IDS.PREMIER_LEAGUE:
      if (rank >= 1 && rank <= 4) return 'bg-green-600';
      if (rank === 5) return 'bg-blue-500';
      if (rank >= 6 && rank <= 7) return 'bg-cyan-500';
      if (rank >= 18) return 'bg-red-500';
      break;
    case LEAGUE_IDS.LA_LIGA:
    case LEAGUE_IDS.SERIE_A:
      if (rank >= 1 && rank <= 4) return 'bg-green-600';
      if (rank === 5) return 'bg-blue-500';
      if (rank === 6) return 'bg-cyan-500';
      if (rank >= 18) return 'bg-red-500';
      break;
    case LEAGUE_IDS.BUNDESLIGA:
      if (rank >= 1 && rank <= 4) return 'bg-green-600';
      if (rank === 5) return 'bg-blue-500';
      if (rank === 6) return 'bg-cyan-500';
      if (rank >= 16) return 'bg-red-500';
      break;
    case LEAGUE_IDS.LIGUE_1:
      if (rank >= 1 && rank <= 3) return 'bg-green-600';
      if (rank === 4) return 'bg-blue-500';
      if (rank === 5) return 'bg-cyan-500';
      if (rank >= 16) return 'bg-red-500';
      break;
    default:
      break;
  }

  const desc = description?.toLowerCase() || '';
  if (desc.includes('champions')) return 'bg-green-600';
  if (desc.includes('europa')) return 'bg-blue-500';
  if (desc.includes('conference')) return 'bg-cyan-500';
  if (desc.includes('relegation')) return 'bg-red-500';
  if (desc.includes('play-off') || desc.includes('playoff')) return 'bg-yellow-500';
  return 'bg-transparent';
}

function getLegend(leagueId: number) {
  switch (leagueId) {
    case LEAGUE_IDS.PREMIER_LEAGUE:
      return [
        ['bg-green-600', '챔피언스리그 (1~4위)'],
        ['bg-blue-500', '유로파리그 (5위)'],
        ['bg-cyan-500', '컨퍼런스리그 (6~7위)'],
        ['bg-red-500', '강등권 (18~20위)'],
      ];
    case LEAGUE_IDS.LIGUE_1:
      return [
        ['bg-green-600', '챔피언스리그 (1~3위)'],
        ['bg-blue-500', '유로파리그 (4위)'],
        ['bg-cyan-500', '컨퍼런스리그 (5위)'],
        ['bg-red-500', '강등권 (16~18위)'],
      ];
    default:
      return [
        ['bg-green-600', '상위권'],
        ['bg-blue-500', '대륙 대회'],
        ['bg-red-500', '강등권'],
      ];
  }
}

const Standings = memo(({ matchId, matchData, teamLogoUrls = {}, leagueLogoUrls = {}, leagueLogoDarkUrls = {}, cupRoundsData, isLoading = false }: StandingsProps) => {
  const router = useRouter();
  const { getTeamDisplayName, getLeagueName } = useTeamLeague();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const getTeamHref = useCallback((team: Standing['team']) => {
    return teamUrl(team.id, getTeamSlugFromName(team.name));
  }, []);

  const handleRowClick = useCallback((team: Standing['team']) => {
    router.push(getTeamHref(team));
  }, [getTeamHref, router]);

  const hasCupRounds = Boolean(cupRoundsData && cupRoundsData.length > 0);
  const standings = matchData.standings?.standings?.league;
  const isWorldCup = standings?.id === LEAGUE_IDS.WORLD_CUP;

  if (hasCupRounds && !isWorldCup) {
    const numericMatchId = Number.parseInt(matchId, 10);
    return (
      <CupRoundsView
        rounds={cupRoundsData!}
        currentMatchId={Number.isFinite(numericMatchId) ? numericMatchId : undefined}
      />
    );
  }

  if (!standings?.standings?.length) {
    if (hasCupRounds) {
      const numericMatchId = Number.parseInt(matchId, 10);
      return (
        <CupRoundsView
          rounds={cupRoundsData!}
          currentMatchId={Number.isFinite(numericMatchId) ? numericMatchId : undefined}
        />
      );
    }

    return <MatchTabState title="순위" message={isLoading ? '불러오는 중...' : '순위 데이터가 없습니다.'} />;
  }

  const leagueId = standings.id;
  const leagueName = getLeagueName(leagueId) || standings.name;
  const leagueLogo = (isDark && leagueLogoDarkUrls[leagueId])
    ? leagueLogoDarkUrls[leagueId]
    : leagueLogoUrls[leagueId] || standings.logo || LEAGUE_PLACEHOLDER;
  const homeTeamId = matchData.homeTeam?.id;
  const awayTeamId = matchData.awayTeam?.id;

  return (
    <div className="w-full space-y-4">
      {standings.standings.map((group, groupIndex) => (
        <Container key={groupIndex} className="bg-white dark:bg-[#1D1D1D] overflow-hidden">
          <ContainerHeader>
            <div className="flex items-center gap-3">
              <UnifiedSportsImageClient
                src={leagueLogo}
                alt={leagueName}
                width={24}
                height={24}
                className="object-contain w-6 h-6"
              />
              <ContainerTitle>{leagueName}</ContainerTitle>
            </div>
          </ContainerHeader>
          <ContainerContent className="p-0">
            <div className="w-full">
            <table className="w-full table-fixed border-collapse">
              <colgroup>
                <col className="w-8 md:w-12" />
                <col className="w-[42%] md:w-auto" />
                <col className="hidden md:table-column w-12" />
                <col className="w-10" />
                <col className="w-10" />
                <col className="w-10" />
                <col className="hidden md:table-column w-12" />
                <col className="hidden md:table-column w-12" />
                <col className="hidden md:table-column w-14" />
                <col className="w-12" />
                <col className="hidden md:table-column w-32" />
              </colgroup>
              <thead className="bg-[#F5F5F5] dark:bg-[#262626]">
                <tr>
                  <th className={headerCell}>순위</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">팀</th>
                  <th className={`hidden md:table-cell ${headerCell}`}>경기</th>
                  <th className={headerCell}>승</th>
                  <th className={headerCell}>무</th>
                  <th className={headerCell}>패</th>
                  <th className={`hidden md:table-cell ${headerCell}`}>득점</th>
                  <th className={`hidden md:table-cell ${headerCell}`}>실점</th>
                  <th className={`hidden md:table-cell ${headerCell}`}>득실차</th>
                  <th className={headerCell}>승점</th>
                  <th className={`hidden md:table-cell ${headerCell}`}>최근 5경기</th>
                </tr>
              </thead>
              <tbody>
                {group.map((standing: Standing) => {
                  const isHomeTeam = standing.team.id === homeTeamId;
                  const isAwayTeam = standing.team.id === awayTeamId;
                  const statusColor = getStatusColor(leagueId, standing.rank, standing.description);
                  const teamName = getTeamDisplayName(standing.team.id, { language: 'ko' }) || standing.team.name;
                  const logoUrl = teamLogoUrls[standing.team.id] || standing.team.logo || TEAM_PLACEHOLDER;

                  return (
                    <tr
                      key={standing.team.id}
                      className={`cursor-pointer border-b border-black/5 dark:border-white/10 transition-colors hover:bg-[#EAEAEA] dark:hover:bg-[#333333] ${
                        isHomeTeam ? 'bg-blue-50 dark:bg-blue-900/30' : isAwayTeam ? 'bg-red-50 dark:bg-red-900/30' : ''
                      }`}
                      onClick={() => handleRowClick(standing.team)}
                    >
                      <td className={`${bodyCell} relative`}>
                        <span className={`absolute inset-y-0 left-0 w-1 ${statusColor}`} />
                        {standing.rank}
                      </td>
                      <td className="px-2 py-2 text-[13px] text-gray-900 dark:text-gray-100">
                        <Link href={getTeamHref(standing.team)} className="flex min-w-0 items-center gap-2" onClick={(event) => event.stopPropagation()}>
                          <TeamLogo teamName={teamName} logoUrl={logoUrl} />
                          <span className="truncate">{teamName}</span>
                          {(isHomeTeam || isAwayTeam) && (
                            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${isHomeTeam ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                              {isHomeTeam ? '홈' : '원정'}
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className={`hidden md:table-cell ${bodyCell}`}>{standing.all.played}</td>
                      <td className={bodyCell}>{standing.all.win}</td>
                      <td className={bodyCell}>{standing.all.draw}</td>
                      <td className={bodyCell}>{standing.all.lose}</td>
                      <td className={`hidden md:table-cell ${bodyCell}`}>{standing.all.goals.for}</td>
                      <td className={`hidden md:table-cell ${bodyCell}`}>{standing.all.goals.against}</td>
                      <td className={`hidden md:table-cell ${bodyCell}`}>{standing.goalsDiff > 0 ? `+${standing.goalsDiff}` : standing.goalsDiff}</td>
                      <td className={`${bodyCell} font-bold`}>{standing.points}</td>
                      <td className={`hidden md:table-cell ${bodyCell}`}>
                        <div className="flex justify-center gap-1">
                          {standing.form?.split('').slice(-5).map((result, index) => (
                            <span key={`${standing.team.id}-${index}`} className={`flex h-6 w-6 items-center justify-center rounded text-xs font-medium ${getFormStyle(result)}`}>
                              {result}
                            </span>
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

      <Container className="bg-white dark:bg-[#1D1D1D]">
        <ContainerHeader>
          <ContainerTitle>범례</ContainerTitle>
        </ContainerHeader>
        <ContainerContent>
          <div className="space-y-2 text-sm text-gray-900 dark:text-gray-100">
            {getLegend(leagueId).map(([color, label]) => (
              <div key={label} className="flex items-center gap-2">
                <span className={`h-4 w-4 rounded-sm ${color}`} />
                <span>{label}</span>
              </div>
            ))}
            <div className="border-t border-black/5 pt-2 dark:border-white/10">
              <div className="flex items-center gap-2"><span className="h-4 w-4 rounded-sm border border-blue-200 bg-blue-50" />홈 팀</div>
              <div className="mt-2 flex items-center gap-2"><span className="h-4 w-4 rounded-sm border border-red-200 bg-red-50" />원정 팀</div>
            </div>
          </div>
        </ContainerContent>
      </Container>

      {hasCupRounds && (
        <CupRoundsView
          rounds={cupRoundsData!}
          currentMatchId={Number.isFinite(Number.parseInt(matchId, 10)) ? Number.parseInt(matchId, 10) : undefined}
        />
      )}
    </div>
  );
});

Standings.displayName = 'Standings';

export default Standings;
