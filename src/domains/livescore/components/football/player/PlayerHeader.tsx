'use client';

import React, { memo } from 'react';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import { Container, ContainerContent } from '@/shared/components/ui';
import { ErrorState, PlayerProfileLoadingState } from '@/domains/livescore/components/common/CommonComponents';
import { usePlayerInfo } from '@/domains/livescore/hooks';
import { useTeamLeague } from '@/shared/context/TeamLeagueContext';
import type { PlayerStatistic, PlayerData } from '@/domains/livescore/types/player';

type ProfileItem = {
  label: string;
  value: string;
};

const PLAYER_PLACEHOLDER = '/images/placeholder-player.svg';
const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';

const POSITION_MAP: Record<string, string> = {
  Goalkeeper: '골키퍼',
  Defender: '수비수',
  Midfielder: '미드필더',
  Attacker: '공격수',
};

const getPositionKorean = (position: string): string => {
  return POSITION_MAP[position] || position;
};

const hasProfileValue = (value?: string | number | null) => {
  if (value === null || value === undefined) return false;
  const normalized = String(value).trim();
  return Boolean(normalized && normalized !== '-' && normalized !== '정보 없음');
};

interface PlayerHeaderProps {
  playerId: string;
  initialData?: PlayerData;
  playerKoreanName?: string | null;
  playerPhotoUrl?: string;
  teamLogoUrl?: string;
}

const PlayerHeader = memo(function PlayerHeader({
  playerId,
  initialData,
  playerKoreanName,
  playerPhotoUrl = PLAYER_PLACEHOLDER,
  teamLogoUrl = TEAM_PLACEHOLDER
}: PlayerHeaderProps) {
  const { getTeamDisplayName, getLeagueKoreanName } = useTeamLeague();
  const { data: playerData, isLoading, error } = usePlayerInfo(playerId, {
    enabled: !initialData,
  });

  const displayData = playerData || initialData;

  if (!displayData && isLoading) {
    return <PlayerProfileLoadingState />;
  }

  if (error) {
    return <ErrorState message={error.message} />;
  }

  if (!displayData || !displayData.info) {
    return <ErrorState message="선수 정보를 불러올 수 없습니다." />;
  }

  const formatBirthDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return dateString;
      const year = String(date.getFullYear()).slice(-2);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    } catch {
      return dateString;
    }
  };

  const statistics = displayData.statistics || [];
  const playerStats: PlayerStatistic | null = statistics.length > 0 ? statistics[0] : null;
  const position = playerStats?.games?.position || '';
  const mainTeamStats = playerStats?.team ? { team: playerStats.team } : null;

  const profileItems: ProfileItem[] = [
    hasProfileValue(displayData.info.height) ? { label: '키', value: displayData.info.height } : null,
    hasProfileValue(displayData.info.weight) ? { label: '몸무게', value: displayData.info.weight } : null,
    hasProfileValue(displayData.info.birth.date) ? { label: '생년월일', value: formatBirthDate(displayData.info.birth.date) } : null,
    displayData.info.age > 0 ? { label: '나이', value: `${displayData.info.age}세` } : null,
    hasProfileValue(displayData.info.birth.country) ? { label: '출생지', value: displayData.info.birth.country } : null,
  ].filter((item): item is ProfileItem => Boolean(item));

  const shouldShowProfileItems = profileItems.length >= 2;

  return (
    <Container className="mb-4 bg-white dark:bg-[#1D1D1D]">
      <ContainerContent className="!p-4">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0">
            <UnifiedSportsImageClient
              src={playerPhotoUrl}
              alt={displayData.info.name}
              size="xxl"
              variant="circle"
              loading="eager"
              className="w-full h-full"
            />
            {mainTeamStats?.team && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 md:w-8 md:h-8 rounded-full shadow-lg flex items-center justify-center bg-white">
                <UnifiedSportsImageClient
                  src={teamLogoUrl}
                  alt={mainTeamStats.team.name || '팀 로고'}
                  size="sm"
                  variant="square"
                  fit="contain"
                  loading="eager"
                  className="w-4 h-4 md:w-5 md:h-5"
                />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-base md:text-lg font-bold truncate text-gray-900 dark:text-[#F0F0F0]">
              {playerKoreanName || displayData.info.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {mainTeamStats?.team && (
                <p className="text-[13px] text-gray-600 dark:text-gray-400 truncate">
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
            {playerStats?.league?.id && playerStats.league.name && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 truncate">
                {getLeagueKoreanName(playerStats.league.name)}
                {playerStats.league.country ? ` · ${playerStats.league.country}` : ''}
              </p>
            )}
          </div>
        </div>
      </ContainerContent>

      {shouldShowProfileItems && (
        <div className="grid border-t border-black/5 dark:border-white/10" style={{ gridTemplateColumns: `repeat(${profileItems.length}, minmax(0, 1fr))` }}>
          {profileItems.map((item, index) => (
            <div key={item.label} className="py-2.5 text-center relative">
              <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                {item.label}
              </div>
              <div className="mt-1 text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0] truncate px-1">
                {item.value}
              </div>
              {index < profileItems.length - 1 && (
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-8 bg-[#EAEAEA] dark:bg-[#333333]" />
              )}
            </div>
          ))}
        </div>
      )}
    </Container>
  );
});

export default PlayerHeader;
