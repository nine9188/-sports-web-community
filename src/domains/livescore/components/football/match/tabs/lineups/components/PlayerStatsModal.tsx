'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef, useMemo } from 'react';
import { fetchCachedPlayerStats, PlayerStats, PlayerStatsResponse } from '@/domains/livescore/actions/match/playerStats';

// 메모리 캐시 (전역 수준에서 선수 통계 캐싱)
const playerStatsCache = new Map<string, PlayerStatsResponse>();

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
  const [playerStats, setPlayerStats] = useState<PlayerStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 데이터 로드 여부를 추적하는 ref
  const dataLoadedRef = useRef<boolean>(false);

  // 컴포넌트가 마운트되거나 isOpen, playerId, matchId가 변경될 때마다 데이터 가져오기
  useEffect(() => {
    // 모달이 닫혀있거나 플레이어 ID나 매치 ID가 없으면 로드하지 않음
    if (!isOpen || !playerId || !matchId) return;
    
    // 이미 로드된 데이터가 있고 ID가 일치하면 재로드하지 않음
    if (dataLoadedRef.current && playerStats?.response?.player?.id === playerId) {
      return;
    }
    
    // 선수 통계 로드 함수
    async function loadPlayerStats() {
      // 미리 가져온 데이터가 있으면 바로 사용
      if (preloadedStats && preloadedStats.response && preloadedStats.response.length > 0) {
        setPlayerStats({
          success: true,
          response: preloadedStats.response[0],
          message: '선수 통계 데이터 로드 성공'
        });
        dataLoadedRef.current = true;
        return;
      }
      
      // 모달 처음 열 때만 로드 표시
      if (!dataLoadedRef.current) {
        setIsLoading(true);
      }
      setError(null);
      
      try {
        // 캐시용 키 생성 - 매치 ID와 선수 ID 조합
        const cacheKey = `player-stats-${matchId}-${playerId}`;
        
        // 메모리 캐시에서 데이터 확인
        if (playerStatsCache.has(cacheKey)) {
          const cachedData = playerStatsCache.get(cacheKey);
          setPlayerStats(cachedData || null);
          dataLoadedRef.current = true;
          setIsLoading(false);
          return;
        }
        
        // 서버에서 데이터 가져오기
        const data = await fetchCachedPlayerStats(matchId, playerId);
        
        setPlayerStats(data);
        if (data.success && data.response) {
          dataLoadedRef.current = true;
          
          // 데이터를 메모리 캐시에 저장
          playerStatsCache.set(cacheKey, data);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        setError(`선수 통계를 가져오는 중 오류가 발생했습니다: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    }
    
    // 실행 전에 오류 방지를 위한 try-catch 블록 추가
    try {
      loadPlayerStats();
    } catch (err) {
      console.error('선수 데이터 로드 중 예외 발생:', err);
      setIsLoading(false);
      setError('데이터 로드 중 오류가 발생했습니다');
    }
  }, [isOpen, playerId, matchId, preloadedStats, playerStats]);

  // 모달이 닫힐 때 데이터 로드 상태 초기화 방지 (데이터 유지)
  useEffect(() => {
    if (!isOpen) {
      setIsLoading(false);
      setError(null);
      // 데이터는 유지하여 재사용 (dataLoadedRef와 playerStats 상태 유지)
    }
  }, [isOpen]);

  // 통계 테이블 데이터 메모이제이션
  const playerStatsData = useMemo(() => {
    if (!playerStats?.response) return null;
    
    const stats = playerStats.response.statistics[0] || {};
    const playerData = playerStats.response.player || {};
    
    return { stats, playerData };
  }, [playerStats]);

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
            <p className="text-xs text-gray-500 mt-2">선수 ID: {playerId}</p>
          </div>
        </div>
      </div>
    );
  }

  // 오류 상태 표시
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
            <p className="text-xs text-gray-500 mt-2">선수 ID: {playerId}, 매치 ID: {matchId}</p>
            <button 
              onClick={() => {
                setError(null);
                setPlayerStats(null);
              }}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isOpen) return null;
  
  // 데이터 없음 확인 추가
  if (!playerStatsData) {
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
            <p className="text-gray-700">선수 통계 데이터를 찾을 수 없습니다</p>
            <p className="text-xs text-gray-500 mt-2">선수 ID: {playerId}, 선수 이름: {playerInfo.name}</p>
            <button 
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { stats, playerData } = playerStatsData;

  // 이미지 URL 처리 로직
  const getImageUrl = (url: string | undefined, defaultUrl: string) => {
    if (!url) return defaultUrl;
    return url.startsWith('http') ? url : defaultUrl;
  };

  const playerPhotoUrl = getImageUrl(
    playerData.photo, 
    `https://media.api-sports.io/football/players/${playerId}.png`
  );

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
              <Image
                src={playerPhotoUrl}
                alt={playerInfo.name}
                width={112}
                height={112}
                className="w-full h-full rounded-full object-cover"
                unoptimized
                onError={() => {
                  // console.error(`이미지 로드 실패: ${(e.currentTarget as HTMLImageElement).src}`);
                  // 에러 시에도 동일한 이미지 유지 (API에서 제공하는 기본 이미지가 있음)
                  // 필요한 경우 아래 주석을 해제하여 로컬 기본 이미지로 변경 가능
                  // (e.currentTarget as HTMLImageElement).src = '/images/default-player.png';
                }}
              />
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
                  onError={() => {
                    // 에러 시에도 동일하게 유지 (API에서 제공하는 기본 이미지 사용)
                    // 필요시 아래 주석을 해제하여 기본 이미지 설정 가능
                    // e.currentTarget.src = '/images/default-team.png';
                  }}
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