'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { fetchCachedPlayerStats, PlayerStats, PlayerStatsResponse } from '@/domains/livescore/actions/match/playerStats';
import ApiSportsImage from '@/shared/components/ApiSportsImage';
import { ImageType } from '@/shared/types/image';


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
  preloadedStats?: { response: PlayerStats[] };
}

export default function PlayerStatsModal({ 
  isOpen, 
  onClose, 
  playerId, 
  matchId, 
  playerInfo,
  preloadedStats
}: PlayerStatsModalProps) {
  // 미리 로드된 데이터가 있으면 초기 상태에서 바로 설정
  const [playerStats, setPlayerStats] = useState<PlayerStatsResponse | null>(() => {
    if (preloadedStats && preloadedStats.response && preloadedStats.response.length > 0) {
      return {
        success: true,
        response: preloadedStats.response[0],
        message: '선수 통계 데이터 로드 성공'
      };
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(() => {
    // 미리 로드된 데이터가 있으면 로딩하지 않음
    return !(preloadedStats && preloadedStats.response && preloadedStats.response.length > 0);
  });
  const [error, setError] = useState<string | null>(null);

  // 데이터 로드 함수 - 성능 최적화
  const loadPlayerStats = useCallback(async () => {
    // 이미 데이터가 있으면 스킵
    if (playerStats && playerStats.success) return;
    
    // 1. 미리 로드된 데이터가 있으면 바로 사용
    if (preloadedStats && preloadedStats.response && preloadedStats.response.length > 0) {
      setPlayerStats({
        success: true,
        response: preloadedStats.response[0],
        message: '선수 통계 데이터 로드 성공'
      });
      setIsLoading(false);
      setError(null);
      return;
    }

    // 2. 데이터가 없으면 서버에서 가져오기
    if (!isLoading) {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await fetchCachedPlayerStats(matchId, playerId);
        setPlayerStats(data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        setError(`선수 통계를 가져오는 중 오류가 발생했습니다: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    }
  }, [matchId, playerId, preloadedStats, playerStats, isLoading]);

  // 모달이 열릴 때 데이터 확인
  useEffect(() => {
    if (isOpen && playerId && matchId) {
      loadPlayerStats();
    }
  }, [isOpen, playerId, matchId, loadPlayerStats]);

  // preloadedStats가 변경될 때 즉시 반영
  useEffect(() => {
    if (preloadedStats && preloadedStats.response && preloadedStats.response.length > 0) {
      const newPlayerData = preloadedStats.response[0];
      // 다른 선수의 데이터이거나 데이터가 없는 경우에만 업데이트
      if (!playerStats || playerStats.response?.player?.id !== newPlayerData.player?.id) {
        setPlayerStats({
          success: true,
          response: newPlayerData,
          message: '선수 통계 데이터 로드 성공'
        });
        setIsLoading(false);
        setError(null);
      }
    }
  }, [preloadedStats, playerStats]);

  // 모달이 닫히면 로딩/에러 상태만 초기화 (데이터는 유지)
  useEffect(() => {
    if (!isOpen) {
      setIsLoading(false);
      setError(null);
      // playerStats는 유지하여 재사용
    }
  }, [isOpen]);

  // 모달이 닫혀있으면 렌더링하지 않음
  if (!isOpen) return null;

  // 로딩 상태
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

  // 오류 상태
  if (error) {
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
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-700">{error}</p>
            <button 
              onClick={loadPlayerStats}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (!playerStats || !playerStats.success || !playerStats.response) {
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
            <div className="text-gray-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-700 mb-2">경기 데이터가 없습니다</p>
            <p className="text-xs text-gray-500 mb-4">선수: {playerInfo.name} (#{playerInfo.number})</p>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 데이터 표시
  const stats = playerStats.response.statistics?.[0] || {};



  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] overflow-y-auto shadow-xl">
        {/* 닫기 버튼 */}
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
              <ApiSportsImage
                imageId={playerId}
                imageType={ImageType.Players}
                alt={playerInfo.name}
                width={112}
                height={112}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            {stats.team?.id && (
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
                <ApiSportsImage
                  imageId={stats.team.id}
                  imageType={ImageType.Teams}
                  alt={stats.team?.name || '팀 로고'}
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain"
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
          
          {/* 선수 상세 정보 페이지로 이동하는 버튼 */}
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

// 성능 디버깅을 위한 displayName 추가
PlayerStatsModal.displayName = 'PlayerStatsModal'; 