'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Medal } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Container, ContainerContent } from '@/shared/components/ui';
import { TabList } from '@/shared/components/ui/tabs';
import { RankingsData, PlayerRanking } from '@/domains/livescore/types/player';
import { useTeamLeague } from '@/shared/context/TeamLeagueContext';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import { fetchSingleRanking } from '@/domains/livescore/actions/player/rankings';
import { CACHE_STRATEGIES } from '@/shared/constants/cacheConfig';
import { getPlayerSlugFromName } from '@/domains/livescore/utils/slugs';
import { playerUrl } from '@/domains/livescore/utils/urls';
import PlayerTabEmptyState from './PlayerTabEmptyState';

const PLAYER_PLACEHOLDER = '/images/placeholder-player.svg';
const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';

// 서브탭 → API 타입 매핑
const SUB_TAB_TO_API: Record<string, 'topscorers' | 'topassists' | 'topyellowcards' | 'topredcards' | null> = {
  topScorers: 'topscorers',
  topAssists: 'topassists',
  mostGamesScored: 'topscorers',  // topscorers에서 파생
  leastPlayTime: 'topscorers',     // topscorers에서 파생
  topRedCards: 'topredcards',
  topYellowCards: 'topyellowcards',
};

interface PlayerRankingsProps {
  playerId?: number;
  leagueId?: number;
  rankingsData?: RankingsData;
  playerKoreanNames?: Record<number, string | null>;
  playerPhotoUrls?: Record<number, string>;
  teamLogoUrls?: Record<number, string>;
}

export default function PlayerRankings({
  playerId,
  leagueId,
  rankingsData,
  playerKoreanNames = {},
  playerPhotoUrls: initialPlayerPhotoUrls = {},
  teamLogoUrls: initialTeamLogoUrls = {},
}: PlayerRankingsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getTeamById } = useTeamLeague();
  const [rankingType, setRankingType] = useState('topScorers');

  const rankingTypes = [
    { id: 'topScorers', label: '최다 득점' },
    { id: 'topAssists', label: '최다 어시스트' },
    { id: 'mostGamesScored', label: '최다 득점 경기' },
    { id: 'leastPlayTime', label: '최소 출전 시간' },
    { id: 'topRedCards', label: '최다 레드카드' },
    { id: 'topYellowCards', label: '최다 옐로카드' },
  ];

  const rankingLabels: Record<string, string> = {
    topScorers: '최다 득점',
    topAssists: '최다 도움',
    mostGamesScored: '최다 득점 경기',
    leastPlayTime: '최다 출전 시간',
    topRedCards: '최다 퇴장',
    topYellowCards: '최다 경고',
  };
  const displayRankingTypes = rankingTypes.map((tab) => ({
    ...tab,
    label: rankingLabels[tab.id] || tab.label,
  }));

  const emptyRankingsState = (
    <PlayerTabEmptyState title="순위" message="순위 데이터가 없습니다." />
  );

  if (!leagueId) {
    return emptyRankingsState;
  }

  // 현재 서브탭에 필요한 API 타입
  const apiType = SUB_TAB_TO_API[rankingType];

  const prefetchRankingType = (tabId: string) => {
    const nextApiType = SUB_TAB_TO_API[tabId];
    if (!nextApiType || !leagueId) return;

    const queryKey = ['player-ranking', leagueId, nextApiType] as const;
    if (queryClient.getQueryData(queryKey)) return;

    void queryClient.prefetchQuery({
      queryKey,
      queryFn: () => fetchSingleRanking(leagueId, nextApiType),
      ...CACHE_STRATEGIES.STATIC_DATA,
    });
  };

  // 서브탭 클릭 시에만 해당 API 호출 (React Query lazy loading)
  const { data: fetchedData, isLoading, isFetching } = useQuery({
    queryKey: ['player-ranking', leagueId, apiType],
    queryFn: () => fetchSingleRanking(leagueId, apiType!),
    enabled: !!apiType && !!leagueId,
    ...CACHE_STRATEGIES.STATIC_DATA,
    placeholderData: previousData => previousData,
    // SSR에서 전달된 initialData가 있으면 사용
    initialData: rankingsData && apiType ? (() => {
      const keyMap: Record<string, 'topScorers' | 'topAssists' | 'topYellowCards' | 'topRedCards'> = {
        topscorers: 'topScorers',
        topassists: 'topAssists',
        topyellowcards: 'topYellowCards',
        topredcards: 'topRedCards',
      };
      const key = keyMap[apiType];
      const existing = key ? rankingsData[key] : undefined;
      if (existing && existing.length > 0) {
        return {
          rankings: existing,
          playerPhotoUrls: rankingsData.playerPhotoUrls || {},
          teamLogoUrls: rankingsData.teamLogoUrls || {},
          playerKoreanNames,
        };
      }
      return undefined;
    })() : undefined,
  });

  // 이미지 URL: fetchedData에서 가져오거나 initialData 사용
  const playerPhotoUrls = fetchedData?.playerPhotoUrls || initialPlayerPhotoUrls;
  const teamLogoUrls = fetchedData?.teamLogoUrls || initialTeamLogoUrls;
  const resolvedPlayerKoreanNames = {
    ...playerKoreanNames,
    ...(fetchedData?.playerKoreanNames || {}),
  };

  const getPlayerPhoto = (id: number) => playerPhotoUrls[id] || PLAYER_PLACEHOLDER;
  const getTeamLogo = (id: number) => teamLogoUrls[id] || TEAM_PLACEHOLDER;

  // 현재 서브탭의 데이터
  const currentRankings = useMemo((): PlayerRanking[] => {
    const rankings = fetchedData?.rankings || [];
    if (rankings.length === 0) return [];

    // 파생 탭: topscorers 데이터를 다르게 정렬
    if (rankingType === 'mostGamesScored') {
      return [...rankings]
        .filter(p => (p.statistics[0]?.goals?.total || 0) > 0)
        .sort((a, b) => (b.statistics[0]?.games?.appearences || 0) - (a.statistics[0]?.games?.appearences || 0))
        .slice(0, 20);
    }
    if (rankingType === 'leastPlayTime') {
      return [...rankings]
        .filter(p => (p.statistics[0]?.games?.minutes || 0) > 0)
        .sort((a, b) => (b.statistics[0]?.games?.minutes || 0) - (a.statistics[0]?.games?.minutes || 0))
        .slice(0, 20);
    }

    return rankings;
  }, [fetchedData, rankingType]);

  if (!isLoading && currentRankings.length === 0 && !fetchedData) {
    return <PlayerTabEmptyState title="순위" message="순위 데이터가 없습니다." />;
  }

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0: return 'text-yellow-400 dark:text-yellow-500';
      case 1: return 'text-gray-300 dark:text-gray-400';
      case 2: return 'text-amber-600 dark:text-amber-500';
      default: return 'text-gray-100 dark:text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="sr-only">시즌 랭킹</h2>
      <TabList
        tabs={displayRankingTypes}
        activeTab={rankingType}
        onTabChange={setRankingType}
        onTabIntent={prefetchRankingType}
        variant="default"
      />

      {isLoading && currentRankings.length === 0 ? (
        <Container>
          <ContainerContent>
            <p className="py-2 text-center text-sm text-gray-500 dark:text-gray-400">
              순위 데이터를 불러오는 중...
            </p>
          </ContainerContent>
        </Container>
      ) : (
      <div className={isFetching && !isLoading ? 'opacity-70 transition-opacity' : undefined}>
          {/* 상위 3위 메달 디스플레이 */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-4">
            {currentRankings.slice(0, 3).map((player: PlayerRanking, index: number) => {
              const cardContent = player ? (
                <>
                  <Medal
                    className={`absolute top-2 left-2 h-6 w-6 drop-shadow-md ${getMedalColor(index)}`}
                  />
                  <div className="w-16 h-16 relative mb-2">
                    <UnifiedSportsImageClient
                      src={getPlayerPhoto(player.player.id)}
                      alt={player.player.name}
                      width={64}
                      height={64}
                      variant="circle"
                      className="w-full h-full"
                    />
                  </div>
                  <div className="min-w-0 text-left sm:text-center">
                    <div className="font-bold text-[13px] text-gray-900 dark:text-[#F0F0F0]">
                      {resolvedPlayerKoreanNames[player.player.id] || player.player.name}
                    </div>
                    <div className="mt-1 flex items-center justify-start gap-1 sm:justify-center">
                      <UnifiedSportsImageClient
                        src={getTeamLogo(player.statistics[0].team.id)}
                        alt={player.statistics[0].team.name}
                        width={16}
                        height={16}
                        fit="contain"
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {getTeamById(player.statistics[0].team.id)?.name_ko || player.statistics[0].team.name}
                      </span>
                    </div>
                    <div className="mt-1 text-base font-semibold text-gray-900 dark:text-[#F0F0F0]">
                      {getRankingValue(player, rankingType)}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  데이터 없음
                </div>
              );

              return player?.player?.id ? (
                <Link
                  key={player.player.id}
                  href={playerUrl(player.player.id, getPlayerSlugFromName(player.player.name))}
                  className="relative flex min-h-[92px] items-center gap-3 rounded-lg border border-black/7 bg-white p-3 pl-10 transition-colors hover:bg-[#EAEAEA] dark:border-0 dark:bg-[#1D1D1D] dark:hover:bg-[#333333] sm:min-h-[180px] sm:flex-col sm:justify-center sm:pl-3"
                >
                  {cardContent}
                </Link>
              ) : (
                <div
                  key={`empty-${index}`}
                  className="relative flex min-h-[92px] items-center gap-3 rounded-lg border border-black/7 bg-white p-3 pl-10 dark:border-0 dark:bg-[#1D1D1D] sm:min-h-[180px] sm:flex-col sm:justify-center sm:pl-3"
                >
                  {cardContent}
                </div>
              );
            })}
          </div>

          {/* 4-20위 리스트 */}
          <Container className="mt-4 min-h-[300px] bg-white dark:bg-[#1D1D1D]">
            <ContainerContent className="!p-0 overflow-hidden">
              {currentRankings.slice(3).length > 0 ? (
                <div className="divide-y divide-black/5 dark:divide-white/10">
                  {currentRankings.slice(3).map((player: PlayerRanking, index: number) => {
                    const href = playerUrl(player.player.id, getPlayerSlugFromName(player.player.name));
                    const displayName = resolvedPlayerKoreanNames[player.player.id] || player.player.name;
                    const team = player.statistics[0].team;
                    const teamName = getTeamById(team.id)?.name_ko || team.name;
                    const isCurrentPlayer = player.player.id === playerId;

                    return (
                      <Link
                        key={player.player.id}
                        href={href}
                        className={`grid grid-cols-[1.5rem_minmax(0,1.35fr)_minmax(0,1fr)_auto] items-center gap-1.5 px-3 py-2 transition-colors hover:bg-[#EAEAEA] dark:hover:bg-[#333333] md:grid-cols-[2.25rem_minmax(0,1.2fr)_minmax(0,1fr)_auto] md:gap-3 md:px-4 md:py-3 ${
                          isCurrentPlayer ? 'bg-[#F5F5F5] dark:bg-[#262626]' : ''
                        }`}
                        onMouseEnter={() => router.prefetch(href)}
                        onFocus={() => router.prefetch(href)}
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
                            {displayName}
                          </span>
                        </div>

                        <div className="flex min-w-0 items-center gap-1.5">
                          <UnifiedSportsImageClient
                            src={getTeamLogo(team.id)}
                            alt={team.name}
                            width={20}
                            height={20}
                            fit="contain"
                            className="h-5 w-5 flex-shrink-0"
                          />
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
                <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  데이터가 없습니다
                </div>
              )}
            </ContainerContent>
          </Container>
      </div>
      )}
    </div>
  );
}

function getRankingValue(player: PlayerRanking, rankingType: string) {
  const stats = player.statistics[0];
  switch (rankingType) {
    case 'topScorers':
      return `${stats.goals.total || 0} 골`;
    case 'topAssists':
      return `${stats.goals.assists || 0} 도움`;
    case 'mostGamesScored':
      return `${stats.games.appearences || 0} 경기`;
    case 'leastPlayTime':
      return `${Math.floor((stats.games.minutes || 0) / 60)}시간`;
    case 'topRedCards':
      return `${stats.cards.red || 0} 장`;
    case 'topYellowCards':
      return `${stats.cards.yellow || 0} 장`;
    default:
      return '0';
  }
}
