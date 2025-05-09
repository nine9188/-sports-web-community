'use client';

import React, { useEffect } from 'react';
import { useMatchData } from '../../context/MatchDataContext';
import PlayerStatsModal from './components/PlayerStatsModal';
import LineupTable from './components/LineupTable';
import Formation from './Formation';
import { useLineupData } from './hooks/useLineupData';
import { usePlayerModal } from './hooks/usePlayerModal';
import { prepareFormationData } from './utils/formation';
import { TeamLineup } from '@/domains/livescore/actions/match/lineupData';
import { MatchEvent } from '@/domains/livescore/types/match';
import { PlayerStats } from '@/domains/livescore/actions/match/playerStats';

// 라인업 컴포넌트의 Props 타입
interface LineupsProps {
  matchId: string;
  matchData?: {
    lineups?: {
      response: {
        home: TeamLineup;
        away: TeamLineup;
      } | null;
    };
    events?: MatchEvent[];
    playersStats?: Record<number, { response: PlayerStats[] }>;
    homeTeam?: { id: number; name: string; logo: string };
    awayTeam?: { id: number; name: string; logo: string };
  };
}

// 탭 데이터 타입
interface MatchTabsData {
  lineups?: {
    playersStats?: Record<number, { response: PlayerStats[] }>;
  };
  [key: string]: unknown;
}

// Match 컨텍스트 타입
interface MatchDataContext {
  tabsData: MatchTabsData;
}

export default function Lineups({ matchId, matchData }: LineupsProps) {
  // 매치 컨텍스트에서 데이터 가져오기
  const { tabsData } = useMatchData() as MatchDataContext;
  
  // 커스텀 훅을 사용하여 상태 관리
  const { 
    loading, 
    lineups, 
    events, 
    error, 
    playersStatsData 
  } = useLineupData({ matchId, matchData, tabsData });
  
  // 선수 모달 관련 상태 관리
  const { 
    isModalOpen, 
    selectedPlayer, 
    handlePlayerClick, 
    handleCloseModal 
  } = usePlayerModal();
  
  // 포메이션 데이터 준비
  const prepareFormationDataCallback = React.useCallback(prepareFormationData, []);
  
  // 라인업 데이터가 있으면 모든 선수 데이터를 미리 저장 - Early return 전에 선언
  useEffect(() => {
    // 데이터가 있고 playersStatsData가 있을 때만 실행
    if (lineups && playersStatsData && Object.keys(playersStatsData).length > 0) {
      // 세션 스토리지에 선수 데이터 미리 저장
      import('./components/PlayerStatsModal/usePlayerStats').then(module => {
        module.preloadPlayerStatsToSessionStorage(matchId, playersStatsData);
      });
    }
  }, [lineups, matchId, playersStatsData]);
  
  // 로딩 중이면 로딩 표시
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">라인업 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }
  
  // 오류 표시
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm text-gray-600">라인업 정보를 불러오는 중 오류가 발생했습니다.</p>
        <p className="text-xs text-gray-500 mt-1">{error}</p>
      </div>
    );
  }
  
  // 라인업 데이터가 없는 경우 처리
  if (!lineups) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-600">라인업 정보가 없습니다.</p>
        <p className="text-xs text-gray-500 mt-1">경기가 시작되기 전이거나 데이터가 제공되지 않는 경기일 수 있습니다.</p>
      </div>
    );
  }
  
  const homeTeam = matchData?.homeTeam || { id: 0, name: '홈팀', logo: '/images/team-placeholder.png' };
  const awayTeam = matchData?.awayTeam || { id: 0, name: '원정팀', logo: '/images/team-placeholder.png' };
  const homeLineup = lineups.home;
  const awayLineup = lineups.away;
  
  // 포메이션 데이터 준비 및 타입 검사
  const homeFormationData = prepareFormationDataCallback(homeLineup);
  const awayFormationData = prepareFormationDataCallback(awayLineup);
  
  // 포메이션 데이터가 없으면 렌더링하지 않음
  const hasFormationData = homeFormationData !== null && awayFormationData !== null;
  
  return (
    <div className="pb-4">
      {/* 포메이션 시각화 - 데이터가 있는 경우에만 렌더링 */}
      {hasFormationData && (
        <div className="mb-6">
          <Formation 
            homeTeamData={homeFormationData!} 
            awayTeamData={awayFormationData!} 
          />
        </div>
      )}
      
      {/* 라인업 테이블 */}
      <LineupTable
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        homeLineup={homeLineup}
        awayLineup={awayLineup}
        events={events}
        onPlayerClick={handlePlayerClick}
      />
      
      {/* 선수 통계 모달 */}
      {selectedPlayer && (
        <PlayerStatsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          playerId={selectedPlayer.id}
          matchId={matchId}
          playerInfo={{
            name: selectedPlayer.name,
            number: selectedPlayer.number,
            pos: selectedPlayer.pos,
            team: {
              id: selectedPlayer.team.id,
              name: selectedPlayer.team.name
            }
          }}
          preloadedStats={playersStatsData[selectedPlayer.id]}
        />
      )}
    </div>
  );
} 