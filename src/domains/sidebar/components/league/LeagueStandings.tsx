'use client';

import Link from 'next/link';
import { Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import { StandingsData, League } from '../../types';
import { useTeamLeague } from '@/shared/context/TeamLeagueContext';
import { getTeamHref as buildTeamHref } from '@/domains/livescore/utils/entityLinks';

const LEAGUE_PLACEHOLDER = '/images/placeholder-league.svg';
const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';

const LEAGUES: League[] = [
  { id: 'premier', name: 'EPL', fullName: '프리미어리그', apiId: 39 },
  { id: 'laliga', name: '라리가', fullName: '라리가', apiId: 140 },
  { id: 'bundesliga', name: '분데스', fullName: '분데스리가', apiId: 78 },
  { id: 'serieA', name: '세리에A', fullName: '세리에 A', apiId: 135 },
  { id: 'ligue1', name: '리그1', fullName: '리그 1', apiId: 61 },
];

const shortenTeamName = (name: string) => {
  if (name.length <= 8) return name;
  return name.substring(0, 8);
};

const useKoreanTeamName = () => {
  const { getTeamById } = useTeamLeague();
  return (teamId: number, name: string) => {
    const teamInfo = getTeamById(teamId);
    return teamInfo?.name_ko || shortenTeamName(name);
  };
};

interface LeagueStandingsProps {
  initialLeague?: string;
  initialStandings?: StandingsData | null;
  leagueLogoUrls?: Record<number, string>;
  leagueLogoUrlsDark?: Record<number, string>;
  teamLogoUrls?: Record<number, string>;
}

export default function LeagueStandings({
  initialLeague = 'premier',
  initialStandings = null,
  leagueLogoUrls = {},
  leagueLogoUrlsDark = {},
  teamLogoUrls = {},
}: LeagueStandingsProps) {
  const getKoreanTeamName = useKoreanTeamName();
  const currentLeague = LEAGUES.find(league => league.id === initialLeague) ?? LEAGUES[0];

  const getLeagueLogo = (id?: number) => (id ? leagueLogoUrls[id] : undefined) || LEAGUE_PLACEHOLDER;
  const getLeagueLogoDark = (id?: number) =>
    (id ? leagueLogoUrlsDark[id] || leagueLogoUrls[id] : undefined) || LEAGUE_PLACEHOLDER;
  const getTeamLogo = (id: number) => teamLogoUrls[id] || TEAM_PLACEHOLDER;
  const getTeamHref = (team: { team_id: number; name: string }) => buildTeamHref(team);

  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <ContainerHeader>
        <ContainerTitle>축구 팀순위</ContainerTitle>
      </ContainerHeader>

      <div className="flex border-b border-black/5 dark:border-white/10 bg-[#FAFAFA] dark:bg-[#232323]">
        {LEAGUES.map(league => {
          const isActive = league.id === currentLeague.id;
          return (
            <Link
              key={league.id}
              href={`/livescore/football/leagues/${league.apiId}`}
              prefetch={false}
              className={`flex-1 px-1.5 py-2 text-center text-[11px] transition-colors ${
                isActive
                  ? 'bg-white text-gray-900 font-semibold dark:bg-[#1D1D1D] dark:text-[#F0F0F0]'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-[#F0F0F0]'
              }`}
            >
              {league.name}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-2 px-3 py-2 bg-[#FAFAFA] dark:bg-[#232323]">
        <UnifiedSportsImageClient
          src={getLeagueLogo(currentLeague.apiId)}
          srcDark={getLeagueLogoDark(currentLeague.apiId)}
          alt={currentLeague.fullName}
          width={20}
          height={20}
          className="object-contain"
        />
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {currentLeague.fullName}
        </span>
      </div>

      <div className="bg-white dark:bg-[#1D1D1D]">
        {initialStandings?.standings?.[0]?.length ? (
          <table className="w-full text-xs border-collapse table-fixed">
            <colgroup>
              <col className="w-[30px]" />
              <col />
              <col className="w-[28px]" />
              <col className="w-[20px]" />
              <col className="w-[20px]" />
              <col className="w-[20px]" />
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
              {initialStandings.standings[0].map((team, index) => (
                <tr
                  key={team.team.team_id}
                  className={`${index < initialStandings.standings[0].length - 1 ? 'border-b border-black/5 dark:border-white/10' : ''} hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0]`}
                >
                  <td className="text-center py-1.5 px-0">{team.rank}</td>
                  <td className="text-left py-1.5 px-1">
                    <Link href={getTeamHref(team.team)} prefetch={false} className="flex items-center gap-1">
                      <div className="w-5 h-5 relative flex-shrink-0">
                        <UnifiedSportsImageClient
                          src={getTeamLogo(team.team.team_id)}
                          alt={team.team.name}
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                      </div>
                      <span className="truncate max-w-[100px] text-[13px]">
                        {getKoreanTeamName(team.team.team_id, team.team.name)}
                      </span>
                    </Link>
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
        ) : (
          <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-xs">
            데이터가 없습니다.
          </div>
        )}
      </div>
    </Container>
  );
}
