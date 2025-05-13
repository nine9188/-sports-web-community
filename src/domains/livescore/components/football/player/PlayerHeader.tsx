'use client';

import React, { memo } from 'react';
import Image from 'next/image';
import { ErrorState, PlayerProfileLoadingState } from '@/domains/livescore/components/common/CommonComponents';
import { usePlayerData } from './context/PlayerDataContext';

// 필요한 타입 정의
interface TeamData {
  id: number;
  name: string;
  logo: string;
}

interface LeagueData {
  id: number;
  name: string;
  country: string;
}

interface GamesData {
  position?: string;
}

interface StatisticsData {
  team: TeamData;
  league: LeagueData;
  games: GamesData;
}

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
  
  // 생년월일 포맷팅
  const formatBirthDate = (dateString: string) => {
    if (!dateString) return '정보 없음';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch {
      return dateString;
    }
  };

  // 통계 데이터 가져오기
  const statistics = playerData.statistics || [];
  const playerStats = statistics.length > 0 ? statistics[0] as unknown as StatisticsData : null;
  
  // 포지션 정보 가져오기
  const position = playerStats?.games?.position || '';

  // 주팀 통계 가져오기
  const mainTeamStats = playerStats?.team ? { team: playerStats.team } : null;

  return (
    <div className="mb-4 bg-white rounded-lg border overflow-hidden mt-4 md:mt-0">
      <div className="flex flex-col md:flex-row items-stretch p-4 md:p-6">
        {/* 선수 사진 및 기본 정보 */}
        <div className="flex flex-row items-center gap-4 md:gap-6 md:w-1/3">
          <div className="relative w-20 h-20 md:w-28 md:h-28 flex-shrink-0">
            <div className="relative w-20 h-20 md:w-28 md:h-28">
              <div className="absolute inset-0 rounded-full border-4 border-white shadow-lg"></div>
              <Image
                src={playerData.info.photo || ''}
                alt={playerData.info.name}
                width={112}
                height={112}
                className="w-full h-full rounded-full object-cover"
                unoptimized
              />
            </div>
            
            {mainTeamStats?.team && (
              <div className="absolute -bottom-2 -right-2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
                <Image
                  src={mainTeamStats.team.logo}
                  alt={mainTeamStats.team.name || ''}
                  width={32}
                  height={32}
                  className="w-6 h-6 md:w-8 md:h-8 object-contain"
                  unoptimized
                />
              </div>
            )}
          </div>
          
          <div className="text-left flex-1">
            <h1 className="text-md md:text-base font-bold truncate max-w-[200px] md:max-w-full">{playerData.info.name}</h1>
            {mainTeamStats?.team && (
              <p className="text-sm text-gray-600 truncate max-w-[200px]">{mainTeamStats.team.name}</p>
            )}
            {position && (
              <span className="mt-1 inline-block px-2 py-0.5 md:px-3 md:py-1 bg-blue-100 text-blue-800 rounded-full text-xs md:text-sm">
                {position}
              </span>
            )}
          </div>
        </div>

        {/* 기본 정보 */}
        <div className="flex-1 mt-4 md:mt-0 md:ml-8 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-8 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base md:text-lg font-semibold">기본 정보</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2">
            <div className="overflow-hidden">
              <p className="text-xs md:text-sm text-gray-500">생년월일</p>
              <p className="font-medium text-xs md:text-sm whitespace-nowrap text-ellipsis overflow-hidden">
                {formatBirthDate(playerData.info.birth.date)}
              </p>
            </div>
            
            <div className="overflow-hidden">
              <p className="text-xs md:text-sm text-gray-500">나이</p>
              <p className="font-medium text-xs md:text-sm whitespace-nowrap text-ellipsis overflow-hidden">
                {playerData.info.age}세
              </p>
            </div>
            
            <div className="overflow-hidden">
              <p className="text-xs md:text-sm text-gray-500">출생지</p>
              <p className="font-medium text-xs md:text-sm whitespace-nowrap text-ellipsis overflow-hidden" title={`${playerData.info.birth.country || ''}${playerData.info.birth.place ? `, ${playerData.info.birth.place}` : ''}`}>
                {playerData.info.birth.country || ''}{playerData.info.birth.place ? `, ${playerData.info.birth.place}` : ''}
              </p>
            </div>
            
            <div className="overflow-hidden">
              <p className="text-xs md:text-sm text-gray-500">키</p>
              <p className="font-medium text-xs md:text-sm whitespace-nowrap text-ellipsis overflow-hidden">
                {playerData.info.height || '정보 없음'}
              </p>
            </div>
            
            <div className="overflow-hidden">
              <p className="text-xs md:text-sm text-gray-500">몸무게</p>
              <p className="font-medium text-xs md:text-sm whitespace-nowrap text-ellipsis overflow-hidden">
                {playerData.info.weight || '정보 없음'}
              </p>
            </div>
            
            <div className="overflow-hidden">
              <p className="text-xs md:text-sm text-gray-500">포지션</p>
              <p className="font-medium text-xs md:text-sm whitespace-nowrap text-ellipsis overflow-hidden">
                {position || '정보 없음'}
              </p>
            </div>
            
            {playerStats?.team && playerStats?.league && (
              <div className="md:col-span-2 lg:col-span-2 overflow-hidden">
                <p className="text-xs md:text-sm text-gray-500">소속팀</p>
                <div className="flex items-center gap-1 whitespace-nowrap text-ellipsis overflow-hidden">
                  <p className="font-medium text-xs md:text-sm">{playerStats.team.name}</p>
                  <span className="text-xs text-gray-500 truncate">({playerStats.league.name}, {playerStats.league.country})</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default PlayerHeader; 