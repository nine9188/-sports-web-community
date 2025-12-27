'use client';

import React, { memo } from 'react';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui';
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
      <ContainerHeader>
        <ContainerTitle>선수 프로필</ContainerTitle>
      </ContainerHeader>
      
      <ContainerContent className="!px-4 !py-4 md:!px-6 md:!py-6">
        <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-8">
          {/* 선수 사진 및 기본 정보 */}
          <div className="flex flex-row items-center gap-4 md:gap-6 md:w-1/3">
            <div className="relative w-20 h-20 md:w-28 md:h-28 flex-shrink-0">
              <div className="relative w-20 h-20 md:w-28 md:h-28">
                <div className="absolute inset-0 rounded-full border-4 border-white dark:border-[#1D1D1D] shadow-lg"></div>
                <UnifiedSportsImage
                  imageId={playerData.info.id}
                  imageType={ImageType.Players}
                  alt={playerData.info.name}
                  width={112}
                  height={112}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              
              {mainTeamStats?.team && (
                <div
                  className="absolute -bottom-2 -right-2 w-8 h-8 md:w-10 md:h-10 rounded-full shadow-lg flex items-center justify-center"
                  style={{ backgroundColor: '#ffffff' }}
                >
                  <UnifiedSportsImage
                    imageId={mainTeamStats.team.id}
                    imageType={ImageType.Teams}
                    alt={mainTeamStats.team.name || ''}
                    width={32}
                    height={32}
                    className="w-6 h-6 md:w-8 md:h-8 object-contain"
                  />
                </div>
              )}
            </div>
            
            <div className="text-left flex-1">
              <h1 className="text-md md:text-base font-bold truncate max-w-[200px] md:max-w-full text-gray-900 dark:text-[#F0F0F0]">
                {getPlayerKoreanName(playerData.info.id) || playerData.info.name}
              </h1>
              {mainTeamStats?.team && (
                <p className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                  {(() => {
                    const koreanName = getTeamDisplayName(mainTeamStats.team.id, { language: 'ko' });
                    return koreanName.startsWith('팀 ') ? mainTeamStats.team.name : koreanName;
                  })()}
                </p>
              )}
              {position && (
                <span className="mt-1 inline-block px-2 py-0.5 md:px-3 md:py-1 bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] rounded-full text-xs md:text-sm">
                  {getPositionKorean(position)}
                </span>
              )}
            </div>
          </div>

          {/* 기본 정보 */}
          <div className="flex-1 border-t md:border-t-0 md:border-l border-black/5 dark:border-white/10 pt-4 md:pt-0 md:pl-8 flex flex-col justify-center">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3">
              <div className="overflow-hidden">
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-0.5">생년월일</p>
                <p className="font-medium text-xs md:text-sm whitespace-nowrap text-ellipsis overflow-hidden text-gray-900 dark:text-[#F0F0F0]">
                  {formatBirthDate(playerData.info.birth.date)}
                </p>
              </div>
              
              <div className="overflow-hidden">
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-0.5">나이</p>
                <p className="font-medium text-xs md:text-sm whitespace-nowrap text-ellipsis overflow-hidden text-gray-900 dark:text-[#F0F0F0]">
                  {playerData.info.age}세
                </p>
              </div>
              
              <div className="overflow-hidden">
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-0.5">출생지</p>
                <p className="font-medium text-xs md:text-sm whitespace-nowrap text-ellipsis overflow-hidden text-gray-900 dark:text-[#F0F0F0]" title={`${playerData.info.birth.country || ''}${playerData.info.birth.place ? `, ${playerData.info.birth.place}` : ''}`}>
                  {playerData.info.birth.country || ''}{playerData.info.birth.place ? `, ${playerData.info.birth.place}` : ''}
                </p>
              </div>
              
              <div className="overflow-hidden">
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-0.5">키</p>
                <p className="font-medium text-xs md:text-sm whitespace-nowrap text-ellipsis overflow-hidden text-gray-900 dark:text-[#F0F0F0]">
                  {playerData.info.height || '정보 없음'}
                </p>
              </div>
              
              <div className="overflow-hidden">
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-0.5">몸무게</p>
                <p className="font-medium text-xs md:text-sm whitespace-nowrap text-ellipsis overflow-hidden text-gray-900 dark:text-[#F0F0F0]">
                  {playerData.info.weight || '정보 없음'}
                </p>
              </div>
              
              <div className="overflow-hidden">
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-0.5">포지션</p>
                <p className="font-medium text-xs md:text-sm whitespace-nowrap text-ellipsis overflow-hidden text-gray-900 dark:text-[#F0F0F0]">
                  {position ? getPositionKorean(position) : '정보 없음'}
                </p>
              </div>

              {playerStats?.team && playerStats?.league && (
                <div className="md:col-span-2 lg:col-span-2 overflow-hidden">
                  <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-0.5">소속팀</p>
                  <div className="flex items-center gap-1 whitespace-nowrap text-ellipsis overflow-hidden">
                    <p className="font-medium text-xs md:text-sm text-gray-900 dark:text-[#F0F0F0]">
                      {(() => {
                        const koreanName = getTeamDisplayName(playerStats.team.id, { language: 'ko' });
                        return koreanName.startsWith('팀 ') ? playerStats.team.name : koreanName;
                      })()}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      ({getLeagueKoreanName(playerStats.league.name)}, {playerStats.league.country})
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </ContainerContent>
    </Container>
  );
});

export default PlayerHeader; 