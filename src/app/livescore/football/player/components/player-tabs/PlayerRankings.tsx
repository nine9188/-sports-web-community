'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FaMedal } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/app/livescore/football/components/CommonComponents';
import { RankingsData, PlayerRanking } from '@/app/livescore/football/player/types/player';

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
      case 0: return 'text-yellow-400';
      case 1: return 'text-gray-300';
      case 2: return 'text-amber-600';
      default: return 'text-gray-100';
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
    <div className="mb-4 bg-white rounded-lg">
      {/* 랭킹 타입 선택 */}
      <div className="mb-4 bg-white rounded-lg border overflow-hidden">
        <div className="flex overflow-x-auto sticky top-0 bg-white z-10" 
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}>
          {rankingTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setRankingType(type.id)}
              className={`px-3 py-3 text-sm font-medium flex-1 text-center whitespace-nowrap ${
                rankingType === type.id
                  ? 'text-blue-600 border-b-3 border-blue-600 font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* 상위 3위 메달 디스플레이 - 높이 고정 */}
      <div className="grid grid-cols-3 gap-4 my-4">
        {getRankingData().slice(0, 3).map((player: PlayerRanking, index: number) => (
          <div 
            key={player?.player?.id || `empty-${index}`}
            className={`relative bg-white rounded-lg border p-3 flex flex-col items-center min-h-[180px] ${
              player?.player?.id ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''
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
                    className="rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-player.png';
                    }}
                    unoptimized
                  />
                </div>
                <div className="text-center">
                  <div className="font-bold text-sm">{player.player.name}</div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <div className="relative w-4 h-4">
                      <Image
                        src={player.statistics[0].team.logo || '/placeholder-team.png'}
                        alt={player.statistics[0].team.name}
                        fill
                        className="object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-team.png';
                        }}
                        unoptimized
                      />
                    </div>
                    <span className="text-xs text-gray-600">{player.statistics[0].team.name}</span>
                  </div>
                  <div className="mt-1 text-base font-semibold text-gray-900">
                    {getRankingValue(player, rankingType)}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-300">
                데이터 없음
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 4-10위 테이블 - 최소 높이 고정 */}
      <div className="overflow-x-auto min-h-[300px] border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%] sm:w-[10%] whitespace-nowrap">순위</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[45%] sm:w-[40%] whitespace-nowrap">선수</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[30%] sm:w-[35%] whitespace-nowrap">
                <span className="hidden sm:inline">팀</span>
                <span className="sm:hidden">소속</span>
              </th>
              <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%] whitespace-nowrap">기록</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {getRankingData().slice(3).length > 0 ? (
              getRankingData().slice(3).map((player: PlayerRanking, index: number) => (
                <tr 
                  key={player.player.id} 
                  className={`hover:bg-gray-50 cursor-pointer ${player.player.id === playerId ? 'bg-blue-50' : ''}`}
                  onClick={() => navigateToPlayer(player.player.id)}
                >
                  <td className="px-2 py-2 text-sm font-medium text-gray-900">
                    {index + 4}
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 relative">
                        <Image
                          src={player.player.photo || '/placeholder-player.png'}
                          alt={player.player.name}
                          fill
                          className="rounded-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-player.png';
                          }}
                          unoptimized
                        />
                      </div>
                      <div className="ml-2 sm:ml-3 overflow-hidden">
                        <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-full">
                          {player.player.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center">
                      <div className="relative w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0">
                        <Image
                          src={player.statistics[0].team.logo || '/placeholder-team.png'}
                          alt={player.statistics[0].team.name}
                          fill
                          className="object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-team.png';
                          }}
                          unoptimized
                        />
                      </div>
                      <div className="ml-1 sm:ml-2 overflow-hidden">
                        <div className="text-xs sm:text-sm text-gray-900 truncate">
                          {player.statistics[0].team.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-right text-xs sm:text-sm text-gray-500">
                    {getRankingValue(player, rankingType)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-2 py-4 text-center text-gray-500">
                  데이터가 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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