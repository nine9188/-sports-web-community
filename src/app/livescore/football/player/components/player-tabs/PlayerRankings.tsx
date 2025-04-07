'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaMedal } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

// 선수 데이터 인터페이스
interface Player {
  id: number;
  name: string;
  photo: string;
}

// 팀 데이터 인터페이스
interface Team {
  id: number;
  name: string;
  logo: string;
}

// 통계 데이터 인터페이스
interface Statistic {
  team: Team;
  games: {
    appearences?: number;
    minutes?: number;
  };
  goals: {
    total?: number;
    assists?: number;
  };
  cards: {
    yellow?: number;
    red?: number;
  };
}

// 선수 순위 데이터 인터페이스
interface PlayerRanking {
  player: Player;
  statistics: Statistic[];
}

// 모든 랭킹 데이터를 포함하는 인터페이스
interface RankingsData {
  topScorers?: PlayerRanking[];
  topAssists?: PlayerRanking[];
  mostGamesScored?: PlayerRanking[];
  leastPlayTime?: PlayerRanking[];
  topRedCards?: PlayerRanking[];
  topYellowCards?: PlayerRanking[];
}

interface PlayerRankingsProps {
  currentLeague: number;
  rankingsData?: RankingsData;
  playerId?: number;
}

export default function PlayerRankings({ currentLeague, rankingsData, playerId }: PlayerRankingsProps) {
  const router = useRouter();
  const [rankingType, setRankingType] = useState('topScorers');
  const [rankings, setRankings] = useState<RankingsData>(rankingsData || {});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 컴포넌트 마운트 시 rankingsData 설정
  useEffect(() => {
    if (rankingsData) {
      setRankings(rankingsData);
    }
  }, [rankingsData]);

  // rankingsData가 없고 playerId가 있는 경우에만 API 호출
  useEffect(() => {
    if (!rankingsData && playerId && currentLeague) {
      const fetchRankings = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/livescore/football/players/${playerId}/rankings?league=${currentLeague}`);
          if (!response.ok) throw new Error('랭킹 데이터를 불러오는데 실패했습니다.');
          const data = await response.json();
          setRankings(data);
        } catch (error) {
          console.error('랭킹 데이터 로딩 오류:', error);
          setRankings({});
        } finally {
          setIsLoading(false);
        }
      };

      fetchRankings();
    }
  }, [rankingsData, playerId, currentLeague]);

  const rankingTypes = [
    { id: 'topScorers', label: '최다 득점' },
    { id: 'topAssists', label: '최다 어시스트' },
    { id: 'mostGamesScored', label: '최다 득점 경기' },
    { id: 'leastPlayTime', label: '최소 출전 시간' },
    { id: 'topRedCards', label: '최다 레드카드' },
    { id: 'topYellowCards', label: '최다 옐로카드' },
  ];

  if (isLoading) return <div className="text-center py-8">로딩 중...</div>;

  // 선수 페이지로 이동하는 함수
  const navigateToPlayer = (playerId: number) => {
    if (playerId) {
      router.push(`/livescore/football/player/${playerId}`);
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
    if (!rankings) return [];
    
    switch (rankingType) {
      case 'topScorers':
        return rankings.topScorers || [];
      case 'topAssists':
        return rankings.topAssists || [];
      case 'mostGamesScored':
        return rankings.mostGamesScored || [];
      case 'leastPlayTime':
        return rankings.leastPlayTime || [];
      case 'topRedCards':
        return rankings.topRedCards || [];
      case 'topYellowCards':
        return rankings.topYellowCards || [];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* 랭킹 타입 선택 */}
      <div className="flex gap-2 overflow-x-auto pb-4 sticky top-0 bg-white z-10">
        {rankingTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setRankingType(type.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap min-w-[100px] ${
              rankingType === type.id
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* 상위 3위 메달 디스플레이 - 높이 고정 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {getRankingData().slice(0, 3).map((player: PlayerRanking, index: number) => (
          <div 
            key={player?.player?.id || `empty-${index}`}
            className={`relative bg-white rounded-lg shadow-md p-3 flex flex-col items-center min-h-[180px] ${
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
                    src={player.player.photo}
                    alt={player.player.name}
                    fill
                    className="rounded-full object-cover"
                  />
                </div>
                <div className="text-center">
                  <div className="font-bold text-sm">{player.player.name}</div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <div className="relative w-4 h-4">
                      <Image
                        src={player.statistics[0].team.logo}
                        alt={player.statistics[0].team.name}
                        fill
                        className="object-contain"
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
      <div className="overflow-x-auto min-h-[300px]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">순위</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">선수</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">팀</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">기록</th>
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
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    {index + 4}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 relative">
                        <Image
                          src={player.player.photo}
                          alt={player.player.name}
                          fill
                          className="rounded-full object-cover"
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {player.player.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="relative w-6 h-6">
                        <Image
                          src={player.statistics[0].team.logo}
                          alt={player.statistics[0].team.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="ml-2 text-sm text-gray-900">
                        {player.statistics[0].team.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right text-sm text-gray-500">
                    {getRankingValue(player, rankingType)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-gray-500">
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