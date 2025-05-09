'use client';

import { PlayerStats } from '@/domains/livescore/actions/match/playerStats';
import { usePlayerStats } from './usePlayerStats';
import { getImageUrl } from './utils';
import PlayerStatsHeader from './PlayerStatsHeader';
import PlayerStatsTable from './PlayerStatsTable';
import PlayerStatsLoading from './PlayerStatsLoading';
import PlayerStatsError from './PlayerStatsError';
import PlayerStatsEmpty from './PlayerStatsEmpty';
import { useRef, useEffect } from 'react';

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
  const { isLoading, error, retry, playerStatsData } = usePlayerStats(
    isOpen,
    playerId,
    matchId,
    preloadedStats
  );
  
  // 모달 참조
  const modalRef = useRef<HTMLDivElement>(null);
  
  // 모달 표시 시 바디 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  // 모달이 닫혀있으면 아무것도 렌더링하지 않음
  if (!isOpen) return null;
  
  // 스크롤 처리를 위한 배경 클릭 핸들러
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  // 모달 오버레이 (모든 상태에서 공통)
  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-auto"
      onClick={handleBackgroundClick}
    >
      {/* 닫기 버튼 - 모바일에서는 숨김 */}
      <button 
        onClick={onClose} 
        className="fixed top-4 right-4 bg-white rounded-full p-2 shadow-md text-gray-700 hover:text-gray-900 z-[60] hidden md:block"
        aria-label="닫기"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      {isLoading && (
        <div className="bg-white rounded-lg w-full max-w-md shadow-2xl border border-gray-200">
          <PlayerStatsLoading onClose={onClose} playerId={playerId} />
        </div>
      )}
      
      {error && (
        <div className="bg-white rounded-lg w-full max-w-md shadow-2xl border border-gray-200">
          <PlayerStatsError 
            onClose={onClose} 
            playerId={playerId} 
            matchId={matchId} 
            error={error} 
            onRetry={retry} 
          />
        </div>
      )}
      
      {!isLoading && !error && !playerStatsData && (
        <div className="bg-white rounded-lg w-full max-w-md shadow-2xl border border-gray-200">
          <PlayerStatsEmpty 
            onClose={onClose} 
            playerId={playerId} 
            playerInfo={playerInfo} 
          />
        </div>
      )}
      
      {!isLoading && !error && playerStatsData && (
        <div 
          ref={modalRef}
          className="bg-white rounded-lg w-full max-w-md shadow-2xl relative flex flex-col border border-gray-200 overflow-hidden"
          style={{ maxHeight: 'calc(100vh - 5rem)' }}
        >
          {/* 헤더의 닫기 버튼은 모바일에서도 표시 */}
          <div className="w-full h-12 bg-gray-50 flex items-center justify-between px-4 z-10 border-b border-gray-200">
            <h3 className="font-bold text-gray-800">선수 통계</h3>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1"
              aria-label="닫기"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="overflow-y-auto flex-1">
            {/* 선수 기본 정보 */}
            <PlayerStatsHeader 
              playerInfo={playerInfo}
              stats={playerStatsData.stats}
              playerPhotoUrl={getImageUrl(
                playerStatsData.playerData.photo, 
                `https://media.api-sports.io/football/players/${playerId}.png`
              )}
            />

            {/* 통계 테이블 */}
            <PlayerStatsTable 
              playerId={playerId}
              playerPosition={playerInfo.pos}
              stats={playerStatsData.stats}
            />
          </div>
        </div>
      )}
    </div>
  );
} 