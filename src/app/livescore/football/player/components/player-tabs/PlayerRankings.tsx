'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { FaMedal } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { fetchPlayerRankings } from '@/app/actions/livescore/player/rankings';
import { fetchPlayerStats } from '@/app/actions/livescore/player/stats';

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
  playerId: number;
  currentLeague?: number;
  rankingsData?: RankingsData;
}

// 현재 시즌 결정 함수
const getCurrentSeason = (): number => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  // 7월 이후면 다음 시즌으로 간주 (예: 2024년 7월 이후면 2024 시즌)
  return month >= 6 ? year : year - 1;
};

export default function PlayerRankings({ 
  playerId, 
  currentLeague = 0, 
  rankingsData: initialRankingsData
}: PlayerRankingsProps) {
  const router = useRouter();
  const [rankingType, setRankingType] = useState('topScorers');
  const [rankings, setRankings] = useState<RankingsData>(initialRankingsData || {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leagueId, setLeagueId] = useState<number | null>(currentLeague || null);

  // 선수의 주 리그를 찾는 함수
  const fetchPlayerLeague = useCallback(async () => {
    if (leagueId && leagueId !== 0) return; // 이미 리그 ID가 있으면 스킵
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`선수 ${playerId}의 리그 정보 요청 시작`);
      const startTime = Date.now();
      
      // 현재 시즌 계산
      const season = getCurrentSeason();
      
      // 선수 통계에서 주 리그 찾기
      const stats = await fetchPlayerStats(playerId, season);
      
      if (stats && stats.length > 0) {
        // 출전 경기가 가장 많은 리그 선택
        const mainLeague = stats.reduce((prev, current) => {
          const prevAppearances = prev.games?.appearences || 0;
          const currentAppearances = current.games?.appearences || 0;
          return currentAppearances > prevAppearances ? current : prev;
        });
        
        if (mainLeague.league?.id) {
          setLeagueId(mainLeague.league.id);
          console.log(`선수 ${playerId}의 주 리그 ID 찾음: ${mainLeague.league.id}`);
        } else {
          setError('선수의 리그 정보를 찾을 수 없습니다');
          console.error('선수의 리그 ID를 찾을 수 없음');
        }
      } else {
        // 이전 시즌으로 재시도
        const prevSeasonStats = await fetchPlayerStats(playerId, season - 1);
        
        if (prevSeasonStats && prevSeasonStats.length > 0) {
          // 출전 경기가 가장 많은 리그 선택
          const mainLeague = prevSeasonStats.reduce((prev, current) => {
            const prevAppearances = prev.games?.appearences || 0;
            const currentAppearances = current.games?.appearences || 0;
            return currentAppearances > prevAppearances ? current : prev;
          });
          
          if (mainLeague.league?.id) {
            setLeagueId(mainLeague.league.id);
            console.log(`선수 ${playerId}의 주 리그 ID 찾음(이전 시즌): ${mainLeague.league.id}`);
          } else {
            setError('선수의 리그 정보를 찾을 수 없습니다');
            console.error('선수의 리그 ID를 찾을 수 없음');
          }
        } else {
          setError('선수의 통계 정보를 찾을 수 없습니다');
          console.error('선수의 통계 정보를 찾을 수 없음');
        }
      }
      
      const endTime = Date.now();
      const loadTime = (endTime - startTime) / 1000;
      console.log(`선수 ${playerId}의 리그 정보 요청 완료, 소요시간: ${loadTime}초`);
    } catch (err) {
      setError('선수의 리그 정보를 로드하는데 실패했습니다');
      console.error('리그 정보 로드 오류:', err);
    } finally {
      setLoading(false);
    }
  }, [playerId, leagueId]);
  
  // 랭킹 데이터 가져오기 함수
  const fetchRankings = useCallback(async () => {
    // 리그 ID가 없으면 아직 로드 중이므로 반환
    if (!leagueId || leagueId === 0) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`선수 ${playerId}의 랭킹 데이터 요청 시작 (리그 ID: ${leagueId})`);
      const startTime = Date.now();
      
      // 서버 액션 직접 호출
      const data = await fetchPlayerRankings(playerId, leagueId);
      
      const endTime = Date.now();
      const loadTime = (endTime - startTime) / 1000;
      
      if (data && Object.keys(data).length > 0) {
        console.log(`선수 ${playerId}의 랭킹 데이터 요청 완료, 소요시간: ${loadTime}초`);
        setRankings(data);
      } else {
        console.error(`랭킹 데이터를 찾을 수 없음`);
        setError('랭킹 데이터를 찾을 수 없습니다');
      }
    } catch (err) {
      console.error('랭킹 데이터 로드 오류:', err);
      setError('랭킹 데이터를 로드하는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  }, [playerId, leagueId]);

  // 선수의 주 리그를 찾음
  useEffect(() => {
    fetchPlayerLeague();
  }, [fetchPlayerLeague]);

  // 컴포넌트 마운트 시 랭킹 데이터 가져오기
  useEffect(() => {
    // 이미 데이터가 있으면 가져오지 않음
    if (initialRankingsData && Object.keys(initialRankingsData).length > 0) {
      console.log(`선수 ${playerId}의 랭킹 데이터: 초기 데이터 사용`);
      setRankings(initialRankingsData);
      return;
    }
    
    fetchRankings();
  }, [initialRankingsData, playerId, fetchRankings]);

  const rankingTypes = [
    { id: 'topScorers', label: '최다 득점' },
    { id: 'topAssists', label: '최다 어시스트' },
    { id: 'mostGamesScored', label: '최다 득점 경기' },
    { id: 'leastPlayTime', label: '최소 출전 시간' },
    { id: 'topRedCards', label: '최다 레드카드' },
    { id: 'topYellowCards', label: '최다 옐로카드' },
  ];
  
  // 로딩 중 표시
  if (loading) {
    return null;
  }

  // 에러 표시
  if (error) {
    return null;
  }

  // 데이터가 없는 경우
  if (!rankings || Object.keys(rankings).length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500">순위 데이터가 없습니다.</p>
      </div>
    );
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