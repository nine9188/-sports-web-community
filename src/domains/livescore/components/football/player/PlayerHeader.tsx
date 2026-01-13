'use client';

import React, { memo } from 'react';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';
import { Container, ContainerContent } from '@/shared/components/ui';
import { ErrorState, PlayerProfileLoadingState } from '@/domains/livescore/components/common/CommonComponents';
import { usePlayerData } from './context/PlayerDataContext';
import { getPlayerKoreanName } from '@/domains/livescore/constants/players';
import { getTeamDisplayName } from '@/domains/livescore/constants/teams';
import { getLeagueKoreanName } from '@/domains/livescore/constants/league-mappings';
import type { PlayerStatistic } from '@/domains/livescore/types/player';

// 포지션 한글 매핑
const POSITION_MAP: Record<string, string> = {
  'Goalkeeper': '골키퍼',
  'Defender': '수비수',
  'Midfielder': '미드필더',
  'Attacker': '공격수',
};

const getPositionKorean = (position: string): string => {
  return POSITION_MAP[position] || position;
};

// 메모이제이션으로 불필요한 리렌더링 방지
const PlayerHeader = memo(function PlayerHeader() {
  // 컨텍스트에서 선수 데이터 가져오기
  const { playerData, isLoading, error } = usePlayerData();

  // 데이터가 없고 로딩 중일 때만 로딩 UI 표시
  if (!playerData && isLoading) {
    return <PlayerProfileLoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!playerData || !playerData.info) {
    return <ErrorState message="선수 정보를 불러올 수 없습니다." />;
  }

  // 생년월일 포맷팅 (YY/MM/DD 형식)
  const formatBirthDate = (dateString: string) => {
    if (!dateString) return '정보 없음';
    try {
      const date = new Date(dateString);
      const year = String(date.getFullYear()).slice(-2); // 마지막 2자리
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    } catch {
      return dateString;
    }
  };

  // 통계 데이터 가져오기
  const statistics = playerData.statistics || [];
  const playerStats: PlayerStatistic | null = statistics.length > 0 ? statistics[0] : null;
  
  // 포지션 정보 가져오기
  const position = playerStats?.games?.position || '';

  // 주팀 통계 가져오기
  const mainTeamStats = playerStats?.team ? { team: playerStats.team } : null;

  return (
    <Container className="mb-4 bg-white dark:bg-[#1D1D1D]">
      {/* 상단: 선수 사진 + 이름 + 팀 + 포지션 */}
      <ContainerContent className="!p-4">
        <div className="flex items-center gap-4">
          {/* 이미지 컨테이너 */}
          <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0">
            <UnifiedSportsImage
              imageId={playerData.info.id}
              imageType={ImageType.Players}
              alt={playerData.info.name}
              size="xxl"
              variant="circle"
              className="w-full h-full"
            />
            {mainTeamStats?.team && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 md:w-8 md:h-8 rounded-full shadow-lg flex items-center justify-center" style={{ backgroundColor: '#ffffff' }}>
                <UnifiedSportsImage
                  imageId={mainTeamStats.team.id}
                  imageType={ImageType.Teams}
                  alt={mainTeamStats.team.name || '팀 로고'}
                  size="sm"
                  variant="square"
                  fit="contain"
                  className="w-4 h-4 md:w-5 md:h-5"
                />
              </div>
            )}
          </div>

          {/* 이름, 팀, 포지션 */}
          <div className="flex-1 min-w-0">
            <h1 className="text-base md:text-lg font-bold truncate text-gray-900 dark:text-[#F0F0F0]">
              {getPlayerKoreanName(playerData.info.id) || playerData.info.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {mainTeamStats?.team && (
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {(() => {
                    const koreanName = getTeamDisplayName(mainTeamStats.team.id, { language: 'ko' });
                    return koreanName.startsWith('팀 ') ? mainTeamStats.team.name : koreanName;
                  })()}
                </p>
              )}
              {position && (
                <span className="px-2 py-0.5 bg-[#F5F5F5] dark:bg-[#333333] text-gray-700 dark:text-gray-300 rounded text-xs flex-shrink-0">
                  {getPositionKorean(position)}
                </span>
              )}
            </div>
            {playerStats?.league && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 truncate">
                {getLeagueKoreanName(playerStats.league.name)} · {playerStats.league.country}
              </p>
            )}
          </div>
        </div>
      </ContainerContent>

      {/* 하단: 정보 테이블 */}
      <div className="flex bg-[#F5F5F5] dark:bg-[#262626] border-t border-black/5 dark:border-white/10">
        {['키', '몸무게', '생년월일', '나이', '출생지'].map((label) => (
          <div key={label} className="flex-1 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">{label}</div>
        ))}
      </div>
      <div className="flex items-center py-3">
        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
          {playerData.info.height || '-'}
          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
        </div>
        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
          {playerData.info.weight || '-'}
          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
        </div>
        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
          {formatBirthDate(playerData.info.birth.date)}
          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
        </div>
        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
          {playerData.info.age}세
          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
        </div>
        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] truncate px-1">
          {playerData.info.birth.country || '-'}
        </div>
      </div>
    </Container>
  );
});

export default PlayerHeader; 