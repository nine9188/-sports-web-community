'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Medal } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Container, ContainerContent, TabList } from '@/shared/components/ui';
import { EmptyState } from '@/domains/livescore/components/common';
import { RankingsData, PlayerRanking } from '@/domains/livescore/types/player';
import { useTeamLeague } from '@/shared/context/TeamLeagueContext';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import { fetchSingleRanking } from '@/domains/livescore/actions/player/rankings';
import Spinner from '@/shared/components/Spinner';
import { CACHE_STRATEGIES } from '@/shared/constants/cacheConfig';

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
  leagueId = 39,
  rankingsData,
  playerKoreanNames = {},
  playerPhotoUrls: initialPlayerPhotoUrls = {},
  teamLogoUrls: initialTeamLogoUrls = {},
}: PlayerRankingsProps) {
  const router = useRouter();
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

  // 현재 서브탭에 필요한 API 타입
  const apiType = SUB_TAB_TO_API[rankingType];

  // 서브탭 클릭 시에만 해당 API 호출 (React Query lazy loading)
  const { data: fetchedData, isLoading } = useQuery({
    queryKey: ['player-ranking', leagueId, apiType],
    queryFn: () => fetchSingleRanking(leagueId, apiType!),
    enabled: !!apiType && !!leagueId,
    ...CACHE_STRATEGIES.STATIC_DATA,
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
        };
      }
      return undefined;
    })() : undefined,
  });

  // 이미지 URL: fetchedData에서 가져오거나 initialData 사용
  const playerPhotoUrls = fetchedData?.playerPhotoUrls || initialPlayerPhotoUrls;
  const teamLogoUrls = fetchedData?.teamLogoUrls || initialTeamLogoUrls;

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
    return <EmptyState title="순위 데이터가 없습니다" message="이 선수의 순위 데이터 정보를 찾을 수 없습니다." />;
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
        tabs={rankingTypes}
        activeTab={rankingType}
        onTabChange={setRankingType}
        variant="default"
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="md" />
        </div>
      ) : (
        <>
          {/* 상위 3위 메달 디스플레이 */}
          <div className="grid grid-cols-3 gap-4">
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
                  <div className="text-center">
                    <div className="font-bold text-[13px] text-gray-900 dark:text-[#F0F0F0]">
                      {playerKoreanNames[player.player.id] || player.player.name}
                    </div>
                    <div className="flex items-center justify-center gap-1 mt-1">
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
                  href={`/livescore/football/player/${player.player.id}`}
                  className="relative bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 p-3 flex flex-col items-center min-h-[180px] cursor-pointer hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors"
                >
                  {cardContent}
                </Link>
              ) : (
                <div
                  key={`empty-${index}`}
                  className="relative bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 p-3 flex flex-col items-center min-h-[180px]"
                >
                  {cardContent}
                </div>
              );
            })}
          </div>

          {/* 4-20위 테이블 */}
          <Container className="min-h-[300px] bg-white dark:bg-[#1D1D1D]">
            <ContainerContent className="!p-0 overflow-hidden">
              <table className="w-full table-fixed">
                <thead className="bg-[#F5F5F5] dark:bg-[#262626]">
                  <tr>
                    <th className="pl-3 pr-1 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 w-8 border-b border-black/5 dark:border-white/10">#</th>
                    <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-black/5 dark:border-white/10">선수</th>
                    <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-black/5 dark:border-white/10">소속</th>
                    <th className="pl-1 pr-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 w-12 border-b border-black/5 dark:border-white/10">기록</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#1D1D1D]">
                  {currentRankings.slice(3).length > 0 ? (
                    currentRankings.slice(3).map((player: PlayerRanking, index: number) => (
                      <tr
                        key={player.player.id}
                        className={`hover:bg-[#EAEAEA] dark:hover:bg-[#333333] cursor-pointer transition-colors border-b border-black/5 dark:border-white/10 ${
                          player.player.id === playerId ? 'bg-[#F5F5F5] dark:bg-[#262626]' : ''
                        }`}
                        onClick={() => router.push(`/livescore/football/player/${player.player.id}`)}
                      >
                        <td className="pl-3 pr-1 py-2 text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
                          {index + 4}
                        </td>
                        <td className="px-1 py-2">
                          <Link href={`/livescore/football/player/${player.player.id}`} className="flex items-center min-w-0 gap-1.5">
                            <div className="flex-shrink-0 w-6 h-6">
                              <UnifiedSportsImageClient
                                src={getPlayerPhoto(player.player.id)}
                                alt={player.player.name}
                                width={24}
                                height={24}
                                variant="circle"
                                className="w-full h-full"
                              />
                            </div>
                            <span className="text-xs sm:text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0] truncate">
                              {playerKoreanNames[player.player.id] || player.player.name}
                            </span>
                          </Link>
                        </td>
                        <td className="px-1 py-2">
                          <div className="flex items-center min-w-0 gap-1">
                            <div className="flex-shrink-0 w-5 h-5">
                              <UnifiedSportsImageClient
                                src={getTeamLogo(player.statistics[0].team.id)}
                                alt={player.statistics[0].team.name}
                                width={20}
                                height={20}
                                fit="contain"
                                className="w-full h-full"
                              />
                            </div>
                            <span className="text-xs sm:text-[13px] text-gray-900 dark:text-[#F0F0F0] truncate">
                              {getTeamById(player.statistics[0].team.id)?.name_ko || player.statistics[0].team.name}
                            </span>
                          </div>
                        </td>
                        <td className="pl-1 pr-3 py-2 text-right text-xs sm:text-[13px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {getRankingValue(player, rankingType)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                        데이터가 없습니다
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </ContainerContent>
          </Container>
        </>
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
