'use client';

import React from 'react';
import Link from 'next/link';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';
import type { MatchCardData, MatchCardProps } from '@/shared/types/matchCard';
import { getStatusInfo } from '@/shared/utils/matchCard';

const MatchCard: React.FC<MatchCardProps> = ({ matchId, matchData, isEditable = false }) => {
  if (!matchData || !matchData.teams) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 text-red-500 rounded">
        경기 데이터를 불러올 수 없습니다.
      </div>
    );
  }

  const actualMatchId = matchData.id?.toString() || String(matchId);

  const { teams, goals, league, status } = matchData;
  const homeTeam = teams.home;
  const awayTeam = teams.away;
  const homeScore = typeof goals?.home === 'number' ? goals.home : '-';
  const awayScore = typeof goals?.away === 'number' ? goals.away : '-';

  // 통합 유틸리티 사용
  const statusInfo = getStatusInfo(status);
  const statusText = statusInfo.text;
  const statusClass = statusInfo.isLive ? 'text-green-600 font-medium' : '';

  const CardContent = () => (
    <>
      <div className="py-3 px-3 bg-gray-50 dark:bg-[#262626] border-b border-black/5 dark:border-white/10 flex items-center h-10">
        <div className="flex items-center">
          {league.id && (
            <UnifiedSportsImage
              imageId={league.id}
              imageType={ImageType.Leagues}
              alt={league.name}
              width={24}
              height={24}
              className="w-6 h-6 object-contain mr-2"
            />
          )}
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate">{league.name}</span>
        </div>
      </div>

      <div className="py-3 px-3 flex items-center justify-between">
        <div className="flex flex-col items-center w-[40%]">
          {homeTeam.id && (
            <UnifiedSportsImage
              imageId={homeTeam.id}
              imageType={ImageType.Teams}
              alt={homeTeam.name}
              width={48}
              height={48}
              className="w-12 h-12 object-contain mb-2"
            />
          )}
          <span className={`text-sm font-medium text-center line-clamp-2 text-gray-900 dark:text-[#F0F0F0] ${homeTeam.winner ? 'text-blue-600 dark:text-blue-400' : ''}`}>
            {homeTeam.name}
          </span>
        </div>

        <div className="text-center flex-shrink-0 w-[20%]">
          <div className="flex items-center justify-center mb-2">
            <span className="text-2xl font-bold min-w-[1.5rem] text-center text-gray-900 dark:text-[#F0F0F0]">{homeScore}</span>
            <span className="text-gray-400 dark:text-gray-500 mx-1">-</span>
            <span className="text-2xl font-bold min-w-[1.5rem] text-center text-gray-900 dark:text-[#F0F0F0]">{awayScore}</span>
          </div>
          <div className={`text-xs ${statusClass || 'text-gray-600 dark:text-gray-400'}`}>{statusText}</div>
        </div>

        <div className="flex flex-col items-center w-[40%]">
          {awayTeam.id && (
            <UnifiedSportsImage
              imageId={awayTeam.id}
              imageType={ImageType.Teams}
              alt={awayTeam.name}
              width={48}
              height={48}
              className="w-12 h-12 object-contain mb-2"
            />
          )}
          <span className={`text-sm font-medium text-center line-clamp-2 text-gray-900 dark:text-[#F0F0F0] ${awayTeam.winner ? 'text-blue-600 dark:text-blue-400' : ''}`}>
            {awayTeam.name}
          </span>
        </div>
      </div>

      <div className="py-2 px-3 bg-gray-50 dark:bg-[#262626] border-t border-black/5 dark:border-white/10 text-center flex items-center justify-center">
        <span className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
          매치 상세 정보
        </span>
      </div>
    </>
  );

  return (
    <div className="match-card bg-white dark:bg-[#1D1D1D] border border-black/5 dark:border-white/10 rounded-lg overflow-hidden shadow-sm my-3 w-full">
      {isEditable ? (
        <div className="cursor-default">
          <CardContent />
        </div>
      ) : (
        <Link href={`/livescore/football/match/${actualMatchId}`} className="block">
          <CardContent />
        </Link>
      )}
    </div>
  );
};

export default MatchCard;