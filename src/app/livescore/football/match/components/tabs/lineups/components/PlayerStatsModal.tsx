'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';

interface PlayerStatsData {
  response: Array<{
    player: {
      id: number;
      name: string;
      photo?: string;
    };
    statistics: Array<{
      team?: {
        logo: string;
        name: string;
      };
      games?: {
        rating: string;
        minutes: number;
        captain: boolean;
      };
      goals?: {
        total: number;
        assists: number;
        conceded?: number;
        saves?: number;
      };
      shots?: {
        total: number;
        on: number;
      };
      passes?: {
        total: number;
        key: number;
        accuracy: string;
      };
      tackles?: {
        total: number;
        blocks: number;
        interceptions: number;
      };
      duels?: {
        total: number;
        won: number;
      };
      dribbles?: {
        attempts: number;
        success: number;
      };
      fouls?: {
        drawn: number;
        committed: number;
      };
      cards?: {
        yellow: number;
        red: number;
      };
      penalty?: {
        won: number;
        scored: number;
        missed: number;
        saved: number;
      };
    }>;
  }>;
}

interface PlayerStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: number;
  matchId: string;
  playerInfo: {
    name: string;
    number: string;
    pos: string;
    team: {
      id: number;
      name: string;
    };
  };
  preloadedStats?: PlayerStatsData;
}

export default function PlayerStatsModal({ 
  isOpen, 
  onClose, 
  playerId, 
  matchId, 
  playerInfo,
  preloadedStats
}: PlayerStatsModalProps) {
  // 미리 가져온 데이터가 있으면 사용하고, 없으면 API 호출
  const { data: playerStats, isLoading } = useQuery({
    queryKey: ['playerStats', matchId, playerId],
    queryFn: async () => {
      // 미리 가져온 데이터가 있으면 바로 반환
      if (preloadedStats) {
        return preloadedStats;
      }
      
      // 없으면 API 호출
      const response = await fetch(`/api/livescore/football/matches/${matchId}/player-stats?playerId=${playerId}`);
      if (!response.ok) throw new Error('Failed to fetch player stats');
      return response.json() as Promise<PlayerStatsData>;
    },
    initialData: preloadedStats, // 초기 데이터로 미리 가져온 데이터 설정
    enabled: isOpen
  });

  // 로딩 상태 표시
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-md p-6 text-center">
          <div className="flex justify-end">
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">선수 통계를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isOpen) return null;
  if (!playerStats?.response?.[0]) return null;

  const stats = playerStats.response[0].statistics[0] || {};
  const playerData = playerStats.response[0].player || {};

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] overflow-y-auto shadow-xl">
        {/* 닫기 버튼 - 크기와 패딩 증가 */}
        <div className="sticky top-0 flex justify-end p-3 bg-white z-10 border-b">
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 p-2"
            aria-label="닫기"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 선수 기본 정보 */}
        <div className="px-6 pt-3 pb-6 text-center">
          <div className="relative w-28 h-28 mx-auto mb-4">
            <div className="relative w-28 h-28">
              <div className="absolute inset-0 rounded-full border-4 border-white shadow-lg"></div>
              {playerData.photo && (
                <Image
                  src={playerData.photo}
                  alt={playerInfo.name}
                  width={112}
                  height={112}
                  className="w-full h-full rounded-full object-cover"
                  unoptimized
                />
              )}
            </div>
            {stats.team?.logo && (
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
                <Image
                  src={stats.team.logo}
                  alt={stats.team?.name || '팀 로고'}
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain"
                  unoptimized
                />
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold mb-1">{playerInfo.name}</h2>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <span>#{playerInfo.number}</span>
            <span>{playerInfo.pos}</span>
            {stats.games?.captain && (
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs">
                주장
              </span>
            )}
          </div>
        </div>

        {/* 통계 테이블 */}
        <div className="px-4 pb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th colSpan={2} className="px-4 py-2 text-left font-bold text-gray-700 border-b">
                  기본 정보
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="px-4 py-2 text-gray-600">평점</td>
                <td className="px-4 py-2 font-medium">{stats.games?.rating || '-'}</td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-2 text-gray-600">출전시간</td>
                <td className="px-4 py-2 font-medium">{stats.games?.minutes || 0}&apos;</td>
              </tr>
            </tbody>

            {/* 필드 플레이어 전용 스탯 */}
            {playerInfo.pos !== 'G' && (
              <>
                <thead>
                  <tr className="bg-gray-50">
                    <th colSpan={2} className="px-4 py-2 text-left font-bold text-gray-700 border-b">
                      공격 스탯
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="px-4 py-2 text-gray-600">득점</td>
                    <td className="px-4 py-2 font-medium">{stats.goals?.total || 0}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 text-gray-600">도움</td>
                    <td className="px-4 py-2 font-medium">{stats.goals?.assists || 0}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 text-gray-600">슈팅</td>
                    <td className="px-4 py-2 font-medium">{stats.shots?.total || 0}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 text-gray-600">유효슈팅</td>
                    <td className="px-4 py-2 font-medium">{stats.shots?.on || 0}</td>
                  </tr>
                </tbody>

                <thead>
                  <tr className="bg-gray-50">
                    <th colSpan={2} className="px-4 py-2 text-left font-bold text-gray-700 border-b">
                      드리블 & 듀얼
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="px-4 py-2 text-gray-600">드리블 시도</td>
                    <td className="px-4 py-2 font-medium">{stats.dribbles?.attempts || 0}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 text-gray-600">드리블 성공</td>
                    <td className="px-4 py-2 font-medium">{stats.dribbles?.success || 0}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 text-gray-600">듀얼 시도</td>
                    <td className="px-4 py-2 font-medium">{stats.duels?.total || 0}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 text-gray-600">듀얼 성공</td>
                    <td className="px-4 py-2 font-medium">{stats.duels?.won || 0}</td>
                  </tr>
                </tbody>
              </>
            )}

            {/* 공통 스탯 */}
            <thead>
              <tr className="bg-gray-50">
                <th colSpan={2} className="px-4 py-2 text-left font-bold text-gray-700 border-b">
                  패스
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="px-4 py-2 text-gray-600">총 패스</td>
                <td className="px-4 py-2 font-medium">{stats.passes?.total || 0}</td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-2 text-gray-600">키패스</td>
                <td className="px-4 py-2 font-medium">{stats.passes?.key || 0}</td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-2 text-gray-600">패스 성공률</td>
                <td className="px-4 py-2 font-medium">{stats.passes?.accuracy || 0}%</td>
              </tr>
            </tbody>

            <thead>
              <tr className="bg-gray-50">
                <th colSpan={2} className="px-4 py-2 text-left font-bold text-gray-700 border-b">
                  파울 & 카드
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="px-4 py-2 text-gray-600">파울 얻음</td>
                <td className="px-4 py-2 font-medium">{stats.fouls?.drawn || 0}</td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-2 text-gray-600">파울 범함</td>
                <td className="px-4 py-2 font-medium">{stats.fouls?.committed || 0}</td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-2 text-gray-600">옐로카드</td>
                <td className="px-4 py-2 font-medium">{stats.cards?.yellow || 0}</td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-2 text-gray-600">레드카드</td>
                <td className="px-4 py-2 font-medium">{stats.cards?.red || 0}</td>
              </tr>
            </tbody>

            {/* 골키퍼 전용 스탯 */}
            {playerInfo.pos === 'G' && (
              <>
                <thead>
                  <tr className="bg-gray-50">
                    <th colSpan={2} className="px-4 py-2 text-left font-bold text-gray-700 border-b">
                      골키퍼 스탯
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="px-4 py-2 text-gray-600">실점</td>
                    <td className="px-4 py-2 font-medium">{stats.goals?.conceded || 0}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 text-gray-600">선방</td>
                    <td className="px-4 py-2 font-medium">{stats.goals?.saves || 0}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 text-gray-600">막아낸 PK</td>
                    <td className="px-4 py-2 font-medium">{stats.penalty?.saved || 0}</td>
                  </tr>
                </tbody>
              </>
            )}
          </table>
          
          {/* 선수 상세 정보 페이지로 이동하는 버튼 - 버튼 크기와 여백 증가 */}
          <div className="mt-6 mb-4 text-center px-2">
            <Link 
              href={`/livescore/football/player/${playerId}`}
              className="inline-block w-full py-3 px-3 bg-gray-800 text-white font-medium rounded-lg shadow hover:bg-gray-700 transition-colors text-lg"
            >
              선수 정보 더보기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 