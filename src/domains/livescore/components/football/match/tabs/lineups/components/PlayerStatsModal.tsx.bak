'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { fetchCachedPlayerStats, PlayerStats, PlayerStatsResponse } from '@/domains/livescore/actions/match/playerStats';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
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
  const [lastRetryTs, setLastRetryTs] = useState<number>(0);

  // 데이터 로드 함수 - 성능 최적화
  const loadPlayerStats = useCallback(async () => {
    // 현재 선택된 선수의 데이터가 이미 있으면 스킵
    if (playerStats?.success && playerStats.response?.player?.id === playerId) return;
    
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

    // 2. 데이터가 없으면 서버에서 가져오기 (isLoading 여부와 무관하게 실행)
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
  }, [matchId, playerId, preloadedStats, playerStats]);

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
        <div className="bg-white dark:bg-[#1D1D1D] rounded-xl w-full max-w-md p-6 text-center">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-[#F0F0F0] mx-auto"></div>
            <p className="mt-4 text-gray-700 dark:text-gray-300">선수 통계를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 오류 상태
  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#1D1D1D] rounded-xl w-full max-w-md p-6 text-center">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="py-8">
            <div className="text-red-500 dark:text-red-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-900 dark:text-[#F0F0F0]">{error}</p>
            <button
              onClick={() => {
                const now = Date.now();
                if (now - lastRetryTs < 5000) return; // 5초 쓰로틀
                setLastRetryTs(now);
                loadPlayerStats();
              }}
              className="mt-4 px-4 py-2 bg-slate-800 dark:bg-[#3F3F3F] text-white rounded hover:bg-slate-700 dark:hover:bg-[#4A4A4A] transition-colors outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0"
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
        <div className="bg-white dark:bg-[#1D1D1D] rounded-xl w-full max-w-md p-6 text-center">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="py-8">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-900 dark:text-[#F0F0F0] mb-2">경기 데이터가 없습니다</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">선수: {playerInfo.name} (#{playerInfo.number})</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] rounded hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0"
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
      <div className="bg-white dark:bg-[#1D1D1D] rounded-xl w-full max-w-md max-h-[80vh] overflow-y-auto shadow-xl border border-black/7 dark:border-0">
        {/* 닫기 버튼 */}
        <div className="sticky top-0 flex items-center justify-end h-12 px-3 bg-[#F5F5F5] dark:bg-[#262626] z-10 border-b border-black/5 dark:border-white/10">
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] p-2 rounded transition-colors outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0"
            aria-label="닫기"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 선수 기본 정보 */}
        <div className="px-6 pt-3 pb-6 text-center">
          <div className="relative w-28 h-28 mx-auto mb-4">
            <div className="relative w-28 h-28">
              <div className="absolute inset-0 rounded-full border-4 border-white dark:border-[#1D1D1D] shadow-lg"></div>
              <UnifiedSportsImage
                imageId={playerId}
                imageType={ImageType.Players}
                alt={playerInfo.name}
                size="xxl"
                variant="circle"
                className="w-full h-full"
              />
            </div>
            {stats.team?.id && (
              <div 
                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full shadow-lg flex items-center justify-center"
                style={{ backgroundColor: '#ffffff' }}
              >
                <UnifiedSportsImage
                  imageId={stats.team.id}
                  imageType={ImageType.Teams}
                  alt={stats.team?.name || '팀 로고'}
                  size="md"
                  variant="square"
                  fit="contain"
                  className="w-8 h-8"
                />
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold mb-1 text-gray-900 dark:text-[#F0F0F0]">{playerInfo.name}</h2>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-700 dark:text-gray-300">
            <span>#{playerInfo.number}</span>
            <span>{playerInfo.pos}</span>
            {stats.games?.captain && (
              <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-xs">
                주장
              </span>
            )}
          </div>
        </div>

        {/* 통계 테이블 */}
        <div className="px-4 pb-8">
          {/* 기본 정보 */}
          <table className="w-full border-collapse mb-4">
            <thead>
              <tr className="bg-[#F5F5F5] dark:bg-[#262626]">
                <th colSpan={2} className="px-4 py-2 text-left font-bold text-gray-900 dark:text-[#F0F0F0] border-b border-black/5 dark:border-white/10">
                  기본 정보
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black/5 dark:border-white/10">
                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">평점</td>
                <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.games?.rating || '-'}</td>
              </tr>
              <tr className="border-b border-black/5 dark:border-white/10">
                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">출전시간</td>
                <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.games?.minutes || 0}&apos;</td>
              </tr>
            </tbody>
          </table>

          {/* 필드 플레이어 전용 스탯 */}
          {playerInfo.pos !== 'G' && (
            <>
              {/* 공격 스탯 */}
              <table className="w-full border-collapse mb-4">
                <thead>
                  <tr className="bg-[#F5F5F5] dark:bg-[#262626]">
                    <th colSpan={2} className="px-4 py-2 text-left font-bold text-gray-900 dark:text-[#F0F0F0] border-b border-black/5 dark:border-white/10">
                      공격 스탯
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-black/5 dark:border-white/10">
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">득점</td>
                    <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.goals?.total || 0}</td>
                  </tr>
                  <tr className="border-b border-black/5 dark:border-white/10">
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">도움</td>
                    <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.goals?.assists || 0}</td>
                  </tr>
                  <tr className="border-b border-black/5 dark:border-white/10">
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">슈팅</td>
                    <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.shots?.total || 0}</td>
                  </tr>
                  <tr className="border-b border-black/5 dark:border-white/10">
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">유효슈팅</td>
                    <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.shots?.on || 0}</td>
                  </tr>
                </tbody>
              </table>

              {/* 드리블 & 듀얼 */}
              <table className="w-full border-collapse mb-4">
                <thead>
                  <tr className="bg-[#F5F5F5] dark:bg-[#262626]">
                    <th colSpan={2} className="px-4 py-2 text-left font-bold text-gray-900 dark:text-[#F0F0F0] border-b border-black/5 dark:border-white/10">
                      드리블 & 듀얼
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-black/5 dark:border-white/10">
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">드리블 시도</td>
                    <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.dribbles?.attempts || 0}</td>
                  </tr>
                  <tr className="border-b border-black/5 dark:border-white/10">
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">드리블 성공</td>
                    <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.dribbles?.success || 0}</td>
                  </tr>
                  <tr className="border-b border-black/5 dark:border-white/10">
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">듀얼 시도</td>
                    <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.duels?.total || 0}</td>
                  </tr>
                  <tr className="border-b border-black/5 dark:border-white/10">
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">듀얼 성공</td>
                    <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.duels?.won || 0}</td>
                  </tr>
                </tbody>
              </table>
            </>
          )}

          {/* 패스 */}
          <table className="w-full border-collapse mb-4">
            <thead>
              <tr className="bg-[#F5F5F5] dark:bg-[#262626]">
                <th colSpan={2} className="px-4 py-2 text-left font-bold text-gray-900 dark:text-[#F0F0F0] border-b border-black/5 dark:border-white/10">
                  패스
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black/5 dark:border-white/10">
                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">총 패스</td>
                <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.passes?.total || 0}</td>
              </tr>
              <tr className="border-b border-black/5 dark:border-white/10">
                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">키패스</td>
                <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.passes?.key || 0}</td>
              </tr>
              <tr className="border-b border-black/5 dark:border-white/10">
                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">패스 성공률</td>
                <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.passes?.accuracy || 0}%</td>
              </tr>
            </tbody>
          </table>

          {/* 파울 & 카드 */}
          <table className="w-full border-collapse mb-4">
            <thead>
              <tr className="bg-[#F5F5F5] dark:bg-[#262626]">
                <th colSpan={2} className="px-4 py-2 text-left font-bold text-gray-900 dark:text-[#F0F0F0] border-b border-black/5 dark:border-white/10">
                  파울 & 카드
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black/5 dark:border-white/10">
                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">파울 얻음</td>
                <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.fouls?.drawn || 0}</td>
              </tr>
              <tr className="border-b border-black/5 dark:border-white/10">
                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">파울 범함</td>
                <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.fouls?.committed || 0}</td>
              </tr>
              <tr className="border-b border-black/5 dark:border-white/10">
                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">옐로카드</td>
                <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.cards?.yellow || 0}</td>
              </tr>
              <tr className="border-b border-black/5 dark:border-white/10">
                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">레드카드</td>
                <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.cards?.red || 0}</td>
              </tr>
            </tbody>
          </table>

          {/* 골키퍼 전용 스탯 */}
          {playerInfo.pos === 'G' && (
            <table className="w-full border-collapse mb-4">
              <thead>
                <tr className="bg-[#F5F5F5] dark:bg-[#262626]">
                  <th colSpan={2} className="px-4 py-2 text-left font-bold text-gray-900 dark:text-[#F0F0F0] border-b border-black/5 dark:border-white/10">
                    골키퍼 스탯
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-black/5 dark:border-white/10">
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-300">실점</td>
                  <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.goals?.conceded || 0}</td>
                </tr>
                <tr className="border-b border-black/5 dark:border-white/10">
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-300">선방</td>
                  <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.goals?.saves || 0}</td>
                </tr>
                <tr className="border-b border-black/5 dark:border-white/10">
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-300">막아낸 PK</td>
                  <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.penalty?.saved || 0}</td>
                </tr>
              </tbody>
            </table>
          )}

          {/* 선수 상세 정보 페이지로 이동하는 버튼 */}
          <div className="mt-6 mb-4 text-center px-2">
            <Link
              href={`/livescore/football/player/${playerId}`}
              className="inline-block w-full py-3 px-3 bg-slate-800 dark:bg-[#3F3F3F] text-white font-medium rounded-lg shadow hover:bg-slate-700 dark:hover:bg-[#4A4A4A] transition-colors text-lg outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0"
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