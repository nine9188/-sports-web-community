'use client';

import { useMemo, useState } from 'react';
import { Medal } from 'lucide-react';
import Link from 'next/link';
import { Container, ContainerContent } from '@/shared/components/ui';
import { TabList } from '@/shared/components/ui/tabs';
import { RankingsData, PlayerRanking } from '@/domains/livescore/types/player';
import { useTeamLeague } from '@/shared/context/TeamLeagueContext';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import { getPlayerHref } from '@/domains/livescore/utils/entityLinks';
import PlayerTabEmptyState from './PlayerTabEmptyState';

const PLAYER_PLACEHOLDER = '/images/placeholder-player.svg';
const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';

const rankingTypes = [
  { id: 'topScorers', label: '최다 득점' },
  { id: 'topAssists', label: '최다 도움' },
  { id: 'mostGamesScored', label: '최다 득점 경기' },
  { id: 'leastPlayTime', label: '최소 출전 시간' },
  { id: 'topRedCards', label: '최다 퇴장' },
  { id: 'topYellowCards', label: '최다 경고' },
];

interface PlayerRankingsProps {
  playerId?: number;
  leagueId?: number;
  rankingsData?: RankingsData;
  playerKoreanNames?: Record<number, string | null>;
  playerPhotoUrls?: Record<number, string>;
  teamLogoUrls?: Record<number, string>;
}

function getRankingValue(player: PlayerRanking, rankingType: string) {
  const stat = player.statistics[0];
  switch (rankingType) {
    case 'topScorers':
    case 'mostGamesScored':
      return stat?.goals?.total ?? 0;
    case 'topAssists':
      return stat?.goals?.assists ?? 0;
    case 'leastPlayTime':
      return `${stat?.games?.minutes ?? 0}'`;
    case 'topRedCards':
      return stat?.cards?.red ?? 0;
    case 'topYellowCards':
      return stat?.cards?.yellow ?? 0;
    default:
      return '-';
  }
}

function getMedalColor(index: number) {
  if (index === 0) return 'text-yellow-400 dark:text-yellow-500';
  if (index === 1) return 'text-gray-300 dark:text-gray-400';
  if (index === 2) return 'text-amber-600 dark:text-amber-500';
  return 'text-gray-100 dark:text-gray-600';
}

export default function PlayerRankings({
  playerId,
  leagueId,
  rankingsData,
  playerKoreanNames = {},
  playerPhotoUrls: initialPlayerPhotoUrls = {},
  teamLogoUrls: initialTeamLogoUrls = {},
}: PlayerRankingsProps) {
  const { getTeamById } = useTeamLeague();
  const [rankingType, setRankingType] = useState('topScorers');

  const playerPhotoUrls = rankingsData?.playerPhotoUrls || initialPlayerPhotoUrls;
  const teamLogoUrls = rankingsData?.teamLogoUrls || initialTeamLogoUrls;

  const currentRankings = useMemo((): PlayerRanking[] => {
    if (!rankingsData) return [];
    const raw = rankingsData[rankingType as keyof RankingsData];
    const rankingList = Array.isArray(raw) ? raw : [];

    if (rankingType === 'mostGamesScored') {
      return [...rankingList]
        .filter((player) => (player.statistics[0]?.goals?.total || 0) > 0)
        .sort((a, b) => (b.statistics[0]?.games?.appearences || 0) - (a.statistics[0]?.games?.appearences || 0))
        .slice(0, 20);
    }

    if (rankingType === 'leastPlayTime') {
      return [...rankingList]
        .filter((player) => (player.statistics[0]?.games?.minutes || 0) > 0)
        .sort((a, b) => (b.statistics[0]?.games?.minutes || 0) - (a.statistics[0]?.games?.minutes || 0))
        .slice(0, 20);
    }

    return rankingList;
  }, [rankingsData, rankingType]);

  if (!leagueId || currentRankings.length === 0) {
    return <PlayerTabEmptyState title="순위" message="순위 데이터가 없습니다." />;
  }

  const getPlayerPhoto = (id: number) => playerPhotoUrls[id] || PLAYER_PLACEHOLDER;
  const getTeamLogo = (id: number) => teamLogoUrls[id] || TEAM_PLACEHOLDER;

  return (
    <div className="space-y-4">
      <h2 className="sr-only">시즌 랭킹</h2>
      <TabList
        tabs={rankingTypes}
        activeTab={rankingType}
        onTabChange={setRankingType}
        variant="default"
      />

      <div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-4">
          {currentRankings.slice(0, 3).map((player, index) => {
            const team = player.statistics[0]?.team;
            const teamName = team ? getTeamById(team.id)?.name_ko || team.name : '';

            return (
              <Link
                key={player.player.id}
                href={getPlayerHref(player.player)}
                className="relative flex min-h-[92px] items-center gap-3 rounded-lg border border-black/7 bg-white p-3 pl-10 transition-colors hover:bg-[#EAEAEA] dark:border-0 dark:bg-[#1D1D1D] dark:hover:bg-[#333333] sm:min-h-[180px] sm:flex-col sm:justify-center sm:pl-3"
                prefetch={false}
              >
                <Medal className={`absolute left-2 top-2 h-6 w-6 drop-shadow-md ${getMedalColor(index)}`} />
                <div className="relative mb-2 h-16 w-16">
                  <UnifiedSportsImageClient
                    src={getPlayerPhoto(player.player.id)}
                    alt={player.player.name}
                    width={64}
                    height={64}
                    variant="circle"
                    className="h-full w-full"
                  />
                </div>
                <div className="min-w-0 text-left sm:text-center">
                  <div className="text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0]">
                    {playerKoreanNames[player.player.id] || player.player.name}
                  </div>
                  {team && (
                    <div className="mt-1 flex items-center justify-start gap-1 sm:justify-center">
                      <UnifiedSportsImageClient
                        src={getTeamLogo(team.id)}
                        alt={team.name}
                        width={16}
                        height={16}
                        fit="contain"
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400">{teamName}</span>
                    </div>
                  )}
                  <div className="mt-1 text-base font-semibold text-gray-900 dark:text-[#F0F0F0]">
                    {getRankingValue(player, rankingType)}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <Container className="mt-4 min-h-[300px] bg-white dark:bg-[#1D1D1D]">
          <ContainerContent className="!p-0 overflow-hidden">
            {currentRankings.slice(3).length > 0 ? (
              <div className="divide-y divide-black/5 dark:divide-white/10">
                {currentRankings.slice(3).map((player, index) => {
                  const team = player.statistics[0]?.team;
                  const teamName = team ? getTeamById(team.id)?.name_ko || team.name : '';
                  const isCurrentPlayer = player.player.id === playerId;

                  return (
                    <Link
                      key={player.player.id}
                      href={getPlayerHref(player.player)}
                      className={`grid grid-cols-[1.5rem_minmax(0,1.35fr)_minmax(0,1fr)_auto] items-center gap-1.5 px-3 py-2 transition-colors hover:bg-[#EAEAEA] dark:hover:bg-[#333333] md:grid-cols-[2.25rem_minmax(0,1.2fr)_minmax(0,1fr)_auto] md:gap-3 md:px-4 md:py-3 ${
                        isCurrentPlayer ? 'bg-[#F5F5F5] dark:bg-[#262626]' : ''
                      }`}
                      prefetch={false}
                    >
                      <span className="text-center text-[13px] font-semibold text-gray-900 dark:text-[#F0F0F0]">
                        {index + 4}
                      </span>
                      <div className="flex min-w-0 items-center gap-1.5 md:gap-2">
                        <UnifiedSportsImageClient
                          src={getPlayerPhoto(player.player.id)}
                          alt={player.player.name}
                          width={32}
                          height={32}
                          variant="circle"
                          className="h-8 w-8 flex-shrink-0"
                        />
                        <span className="truncate text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
                          {playerKoreanNames[player.player.id] || player.player.name}
                        </span>
                      </div>
                      <div className="flex min-w-0 items-center gap-1.5">
                        {team && (
                          <UnifiedSportsImageClient
                            src={getTeamLogo(team.id)}
                            alt={team.name}
                            width={20}
                            height={20}
                            fit="contain"
                            className="h-5 w-5 flex-shrink-0"
                          />
                        )}
                        <span className="truncate text-xs text-gray-500 dark:text-gray-400 md:text-[13px]">
                          {teamName}
                        </span>
                      </div>
                      <span className="whitespace-nowrap text-right text-xs font-bold text-gray-900 dark:text-[#F0F0F0] md:text-[13px]">
                        {getRankingValue(player, rankingType)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="px-3 py-4 text-center text-[13px] text-gray-500 dark:text-gray-400">
                추가 순위 데이터가 없습니다.
              </div>
            )}
          </ContainerContent>
        </Container>
      </div>
    </div>
  );
}
