'use client';

import { useState } from 'react';
import { Medal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Container, ContainerContent, TabList } from '@/shared/components/ui';
import { EmptyState } from '@/domains/livescore/components/common';
import { RankingsData, PlayerRanking } from '@/domains/livescore/types/player';
import { getTeamById } from '@/domains/livescore/constants/teams';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';

// 4590 표준: placeholder URLs
const PLAYER_PLACEHOLDER = '/images/placeholder-player.svg';
const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';

interface PlayerRankingsProps {
  playerId?: number;
  rankingsData?: RankingsData;
  playerKoreanNames?: Record<number, string | null>;
  // 4590 표준: Storage URL 맵
  playerPhotoUrls?: Record<number, string>;
  teamLogoUrls?: Record<number, string>;
}

export default function PlayerRankings({
  playerId,
  rankingsData = {},
  playerKoreanNames = {},
  playerPhotoUrls = {},
  teamLogoUrls = {},
}: PlayerRankingsProps) {
  // 4590 표준: URL 조회 헬퍼
  const getPlayerPhoto = (id: number) => playerPhotoUrls[id] || PLAYER_PLACEHOLDER;
  const getTeamLogo = (id: number) => teamLogoUrls[id] || TEAM_PLACEHOLDER;
  const router = useRouter();
  const [rankingType, setRankingType] = useState('topScorers');

  const rankingTypes = [
    { id: 'topScorers', label: '최다 득점' },
    { id: 'topAssists', label: '최다 어시스트' },
    { id: 'mostGamesScored', label: '최다 득점 경기' },
    { id: 'leastPlayTime', label: '최소 출전 시간' },
    { id: 'topRedCards', label: '최다 레드카드' },
    { id: 'topYellowCards', label: '최다 옐로카드' },
  ];

  // 데이터가 없는 경우
  if (!rankingsData || Object.keys(rankingsData).length === 0) {
    return <EmptyState title="순위 데이터가 없습니다" message="이 선수의 순위 데이터 정보를 찾을 수 없습니다." />;
  }

  // 선수 페이지로 이동하는 함수
  const navigateToPlayer = (clickedPlayerId: number) => {
    if (clickedPlayerId) {
      router.push(`/livescore/football/player/${clickedPlayerId}`);
    }
  };

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0: return 'text-yellow-400 dark:text-yellow-500';
      case 1: return 'text-gray-300 dark:text-gray-400';
      case 2: return 'text-amber-600 dark:text-amber-500';
      default: return 'text-gray-100 dark:text-gray-600';
    }
  };

  const getRankingData = (): PlayerRanking[] => {
    if (!rankingsData) return [];
    
    switch (rankingType) {
      case 'topScorers':
        return rankingsData.topScorers || [];
      case 'topAssists':
        return rankingsData.topAssists || [];
      case 'mostGamesScored':
        return rankingsData.mostGamesScored || [];
      case 'leastPlayTime':
        return rankingsData.leastPlayTime || [];
      case 'topRedCards':
        return rankingsData.topRedCards || [];
      case 'topYellowCards':
        return rankingsData.topYellowCards || [];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-4">
      {/* 랭킹 타입 선택 */}
      <TabList
        tabs={rankingTypes}
        activeTab={rankingType}
        onTabChange={setRankingType}
        variant="default"
      />

      {/* 상위 3위 메달 디스플레이 - 높이 고정 */}
      <div className="grid grid-cols-3 gap-4">
        {getRankingData().slice(0, 3).map((player: PlayerRanking, index: number) => (
          <div 
            key={player?.player?.id || `empty-${index}`}
            className={`relative bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 p-3 flex flex-col items-center min-h-[180px] ${
              player?.player?.id ? 'cursor-pointer hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors' : ''
            }`}
            onClick={() => player?.player?.id ? navigateToPlayer(player.player.id) : null}
          >
            {player ? (
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
                  <div className="font-bold text-sm text-gray-900 dark:text-[#F0F0F0]">
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
            )}
          </div>
        ))}
      </div>

      {/* 4-10위 테이블 - 최소 높이 고정 */}
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
              {getRankingData().slice(3).length > 0 ? (
                getRankingData().slice(3).map((player: PlayerRanking, index: number) => (
                  <tr
                    key={player.player.id}
                    className={`hover:bg-[#EAEAEA] dark:hover:bg-[#333333] cursor-pointer transition-colors border-b border-black/5 dark:border-white/10 ${
                      player.player.id === playerId ? 'bg-[#F5F5F5] dark:bg-[#262626]' : ''
                    }`}
                    onClick={() => navigateToPlayer(player.player.id)}
                  >
                    <td className="pl-3 pr-1 py-2 text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">
                      {index + 4}
                    </td>
                    <td className="px-1 py-2">
                      <div className="flex items-center min-w-0 gap-1.5">
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
                        <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-[#F0F0F0] truncate">
                          {playerKoreanNames[player.player.id] || player.player.name}
                        </span>
                      </div>
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
                        <span className="text-xs sm:text-sm text-gray-900 dark:text-[#F0F0F0] truncate">
                          {getTeamById(player.statistics[0].team.id)?.name_ko || player.statistics[0].team.name}
                        </span>
                      </div>
                    </td>
                    <td className="pl-1 pr-3 py-2 text-right text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
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