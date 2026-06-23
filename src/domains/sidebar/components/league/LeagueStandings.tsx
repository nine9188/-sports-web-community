'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container, ContainerHeader, ContainerTitle, TabList, type TabItem } from '@/shared/components/ui';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import { StandingsData, League } from '../../types';
import { useTeamLeague } from '@/shared/context/TeamLeagueContext';
import { getTeamHref as buildTeamHref } from '@/domains/livescore/utils/entityLinks';
import { SPORTS_PLACEHOLDERS } from '@/shared/images/urls';
import { motion } from 'framer-motion';

const LEAGUE_PLACEHOLDER = SPORTS_PLACEHOLDERS.leagues;
const TEAM_PLACEHOLDER = SPORTS_PLACEHOLDERS.teams;

const LEAGUES: League[] = [
  { id: 'premier', name: 'EPL', fullName: '프리미어리그', apiId: 39 },
  { id: 'laliga', name: '라리가', fullName: '라리가', apiId: 140 },
  { id: 'bundesliga', name: '분데스', fullName: '분데스리가', apiId: 78 },
  { id: 'serieA', name: '세리에A', fullName: '세리에 A', apiId: 135 },
  { id: 'ligue1', name: '리그1', fullName: '리그 1', apiId: 61 },
];

const WORLD_CUP_LEAGUE: League = { id: 'worldcup', name: '월드컵', fullName: '2026 FIFA 월드컵', apiId: 1 };

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
  initialLeague = 'worldcup',
  initialStandings = null,
  leagueLogoUrls = {},
  leagueLogoUrlsDark = {},
  teamLogoUrls = {},
}: LeagueStandingsProps) {
  const getKoreanTeamName = useKoreanTeamName();
  const [activeLeagueId, setActiveLeagueId] = useState(initialLeague);
  const [standingsByLeague, setStandingsByLeague] = useState<Record<string, StandingsData | null>>({
    [initialLeague]: initialStandings,
  });
  const [loadingLeagueId, setLoadingLeagueId] = useState<string | null>(null);
  const isWorldCupActive = activeLeagueId === WORLD_CUP_LEAGUE.id;
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({
    0: true, // Group A (index 0) is open by default
  });

  const toggleGroup = (index: number) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };
  const currentLeague = isWorldCupActive
    ? WORLD_CUP_LEAGUE
    : LEAGUES.find(league => league.id === activeLeagueId) ?? LEAGUES[0];
  const currentStandings = standingsByLeague[currentLeague.id] ?? null;
  const currentTeamLogoUrls = currentStandings?.teamLogoUrls || teamLogoUrls;
  const isCurrentLeagueLoading = loadingLeagueId === currentLeague.id;

  const getLeagueLogo = (id?: number) => (id ? leagueLogoUrls[id] : undefined) || LEAGUE_PLACEHOLDER;
  const getLeagueLogoDark = (id?: number) =>
    (id ? leagueLogoUrlsDark[id] || leagueLogoUrls[id] : undefined) || LEAGUE_PLACEHOLDER;
  const getTeamLogo = (id: number) => currentTeamLogoUrls[id] || TEAM_PLACEHOLDER;
  const getTeamHref = (team: { team_id: number; name: string }) => buildTeamHref(team);
  const leagueTabs: TabItem[] = LEAGUES.map((league) => ({
    id: league.id,
    label: league.name,
  }));
  const worldCupTabs: TabItem[] = [
    {
      id: WORLD_CUP_LEAGUE.id,
      label: WORLD_CUP_LEAGUE.name,
    },
  ];
  const renderStandingsTable = (
    teams: NonNullable<StandingsData['standings'][number]>,
    options: { compact?: boolean } = {}
  ) => (
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
      {!options.compact && (
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
      )}
      <tbody>
        {teams.map((team, index) => (
          <tr
            key={`${team.group || 'league'}-${team.team.team_id}`}
            className={`${index < teams.length - 1 ? 'border-b border-black/5 dark:border-white/10' : ''} hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0]`}
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
  );

  const loadLeagueStandings = async (leagueId: string) => {
    if (Object.prototype.hasOwnProperty.call(standingsByLeague, leagueId)) {
      return;
    }

    setLoadingLeagueId(leagueId);

    try {
      const response = await fetch(`/api/sidebar/standings/${encodeURIComponent(leagueId)}`);
      const payload = await response.json() as { data?: StandingsData | null };

      setStandingsByLeague((prev) => ({
        ...prev,
        [leagueId]: response.ok ? payload.data ?? null : null,
      }));
    } catch {
      setStandingsByLeague((prev) => ({
        ...prev,
        [leagueId]: null,
      }));
    } finally {
      setLoadingLeagueId((current) => (current === leagueId ? null : current));
    }
  };
  const handleLeagueChange = (leagueId: string) => {
    if (leagueId === activeLeagueId) return;

    if (!Object.prototype.hasOwnProperty.call(standingsByLeague, leagueId)) {
      setLoadingLeagueId(leagueId);
    }

    setActiveLeagueId(leagueId);
    void loadLeagueStandings(leagueId);
  };

  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <ContainerHeader>
        <ContainerTitle>축구 팀순위</ContainerTitle>
      </ContainerHeader>

      <TabList
        tabs={worldCupTabs}
        activeTab={isWorldCupActive ? WORLD_CUP_LEAGUE.id : ''}
        onTabChange={handleLeagueChange}
        variant="contained"
        className="mb-0"
      />

      <TabList
        tabs={leagueTabs}
        activeTab={isWorldCupActive ? '' : currentLeague.id}
        onTabChange={handleLeagueChange}
        variant="contained"
        className="mb-0"
      />

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
        {isCurrentLeagueLoading && !currentStandings ? (
          <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-xs">
            불러오는 중...
          </div>
        ) : currentStandings?.standings?.some(group => group.length) ? (
          isWorldCupActive ? (
            <div>
              {currentStandings.standings.map((group, index) => {
                if (!group.length) return null;
                const groupName = group[0]?.group || `${String.fromCharCode(65 + index)}조`;
                const cleanGroupName = groupName.replace(/^Group\s+/i, '');
                const displayName = cleanGroupName.endsWith('조') ? cleanGroupName : `${cleanGroupName}조`;
                const isExpanded = !!expandedGroups[index];

                return (
                  <div key={`${groupName}-${index}`} className={index > 0 ? 'border-t border-black/5 dark:border-white/10' : ''}>
                    <button
                      type="button"
                      onClick={() => toggleGroup(index)}
                      className="w-full text-left px-3 py-1.5 bg-[#FAFAFA] dark:bg-[#232323] text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-b border-black/5 dark:border-white/10"
                    >
                      <span>{displayName}</span>
                      <motion.svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.15 }}
                        className="text-gray-500 dark:text-gray-400"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </motion.svg>
                    </button>
                    <motion.div
                      initial={index === 0 ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                      animate={isExpanded ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      {renderStandingsTable(group, { compact: index > 0 })}
                    </motion.div>
                  </div>
                );
              })}
            </div>
          ) : (
            renderStandingsTable(currentStandings.standings[0])
          )
        ) : (
          <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-xs">
            {isWorldCupActive ? '월드컵 조별 순위는 대회 시작 후 표시됩니다.' : '데이터가 없습니다.'}
          </div>
        )}
      </div>
    </Container>
  );
}
