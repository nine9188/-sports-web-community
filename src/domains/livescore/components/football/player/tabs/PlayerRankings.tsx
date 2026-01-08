'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FaMedal } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { Container, ContainerContent } from '@/shared/components/ui';
import Tabs from '@/shared/ui/tabs';
import { EmptyState } from '@/domains/livescore/components/common';
import { RankingsData, PlayerRanking } from '@/domains/livescore/types/player';
import { getTeamById } from '@/domains/livescore/constants/teams';
import { getPlayerKoreanName } from '@/domains/livescore/constants/players';

interface PlayerRankingsProps {
  playerId?: number;
  rankingsData?: RankingsData;
}

export default function PlayerRankings({ 
  playerId, 
  rankingsData = {}
}: PlayerRankingsProps) {
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
      <Tabs
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
                <FaMedal 
                  className={`absolute top-2 left-2 text-2xl drop-shadow-md ${getMedalColor(index)}`} 
                />
                <div className="w-16 h-16 relative mb-2">
                  <Image
                    src={player.player.photo || '/placeholder-player.png'}
                    alt={player.player.name}
                    fill
                    sizes="64px"
                    className="rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-player.png';
                    }}
                    unoptimized
                  />
                </div>
                <div className="text-center">
                  <div className="font-bold text-sm text-gray-900 dark:text-[#F0F0F0]">
                    {getPlayerKoreanName(player.player.id) || player.player.name}
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <div className="relative w-4 h-4">
                      <Image
                        src={player.statistics[0].team.logo || '/placeholder-team.png'}
                        alt={player.statistics[0].team.name}
                        fill
                        sizes="16px"
                        className="object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-team.png';
                        }}
                        unoptimized
                      />
                    </div>
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
                        <div className="flex-shrink-0 h-7 w-7 relative">
                          <Image
                            src={player.player.photo || '/placeholder-player.png'}
                            alt={player.player.name}
                            fill
                            sizes="28px"
                            className="rounded-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder-player.png';
                            }}
                            unoptimized
                          />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-[#F0F0F0] truncate">
                          {getPlayerKoreanName(player.player.id) || player.player.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-1 py-2">
                      <div className="flex items-center min-w-0 gap-1">
                        <div className="relative w-5 h-5 flex-shrink-0">
                          <Image
                            src={player.statistics[0].team.logo || '/placeholder-team.png'}
                            alt={player.statistics[0].team.name}
                            fill
                            sizes="20px"
                            className="object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder-team.png';
                            }}
                            unoptimized
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