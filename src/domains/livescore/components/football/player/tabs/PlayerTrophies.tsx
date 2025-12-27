'use client';

import { EmptyState } from '@/domains/livescore/components/common';
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';
import { TrophyData } from '@/domains/livescore/types/player';
import { getLeagueKoreanName } from '@/domains/livescore/constants/league-mappings';

interface PlayerTrophiesProps {
  playerId: number;
  trophiesData?: TrophyData[];
}

export default function PlayerTrophies({ 
  trophiesData = [] 
}: PlayerTrophiesProps) {
  // 트로피 종류별 분류 및 집계
  const trophySummary = trophiesData.reduce((acc, trophy) => {
    if (trophy.place === '우승') {
      acc.champion++;
    } else if (trophy.place === '준우승') {
      acc.runnerUp++;
    } else {
      acc.other++;
    }
    return acc;
  }, { total: trophiesData.length, champion: 0, runnerUp: 0, other: 0 });
  
  // 트로피 아이콘 렌더링 함수
  const renderTrophyIcon = (place: string) => {
    const baseClasses = "w-10 h-10 rounded-full flex items-center justify-center";
    
    if (place === '우승') {
      return (
        <div className={`${baseClasses} bg-yellow-400 dark:bg-yellow-500`}>
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C13.1 2 14 2.9 14 4V5H10V4C10 2.9 10.9 2 12 2M16 6V11C16 13.21 14.21 15 12 15S8 13.21 8 11V6H16M18 4H16V5H18C19.1 5 20 5.9 20 7C20 8.1 19.1 9 18 9V7H20V4M6 4H8V5H6C4.9 5 4 5.9 4 7C4 8.1 4.9 9 6 9V7H4V4M11 18V16H13V18L16 21V22H8V21L11 18Z"/>
          </svg>
        </div>
      );
    } else if (place === '준우승') {
      return (
        <div className={`${baseClasses} bg-gray-400 dark:bg-gray-500`}>
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C13.1 2 14 2.9 14 4V5H10V4C10 2.9 10.9 2 12 2M16 6V11C16 13.21 14.21 15 12 15S8 13.21 8 11V6H16M18 4H16V5H18C19.1 5 20 5.9 20 7C20 8.1 19.1 9 18 9V7H20V4M6 4H8V5H6C4.9 5 4 5.9 4 7C4 8.1 4.9 9 6 9V7H4V4M11 18V16H13V18L16 21V22H8V21L11 18Z"/>
          </svg>
        </div>
      );
    } else {
      return (
        <div className={`${baseClasses} bg-amber-600 dark:bg-amber-700`}>
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C13.1 2 14 2.9 14 4V5H10V4C10 2.9 10.9 2 12 2M16 6V11C16 13.21 14.21 15 12 15S8 13.21 8 11V6H16M11 18V16H13V18L16 21V22H8V21L11 18Z"/>
          </svg>
        </div>
      );
    }
  };
  
  if (trophiesData.length === 0) {
    return <EmptyState title="트로피 기록이 없습니다" message="이 선수의 트로피 기록 정보를 찾을 수 없습니다." />;
  }

  return (
    <Container>
      <ContainerHeader>
        <ContainerTitle>트로피 ({trophySummary.total})</ContainerTitle>
      </ContainerHeader>
      
      <ContainerContent className="!p-0">
        {/* 트로피 통계 */}
        <div className="grid grid-cols-4 gap-0 border-b border-black/5 dark:border-white/10">
          <div className="py-3 px-2 text-center border-r border-black/5 dark:border-white/10">
            <span className="text-sm md:text-base font-bold text-gray-900 dark:text-[#F0F0F0] mr-1">{trophySummary.total}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">총</span>
          </div>
          <div className="py-3 px-2 text-center border-r border-black/5 dark:border-white/10">
            <span className="text-sm md:text-base font-bold text-yellow-500 dark:text-yellow-400 mr-1">{trophySummary.champion}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">우승</span>
          </div>
          <div className="py-3 px-2 text-center border-r border-black/5 dark:border-white/10">
            <span className="text-sm md:text-base font-bold text-gray-500 dark:text-gray-400 mr-1">{trophySummary.runnerUp}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">준우승</span>
          </div>
          <div className="py-3 px-2 text-center">
            <span className="text-sm md:text-base font-bold text-amber-600 dark:text-amber-500 mr-1">{trophySummary.other}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">기타</span>
          </div>
        </div>
        
        {/* 트로피 목록 */}
        <div className="p-3">
          <div className="space-y-2">
            {trophiesData.map((trophy, index) => (
              <div 
                key={index} 
                className="flex items-center gap-3 p-2.5 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg border border-black/5 dark:border-white/10 transition-colors hover:bg-[#EAEAEA] dark:hover:bg-[#333333]"
              >
                <div className="flex-shrink-0">
                  {renderTrophyIcon(trophy.place)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 md:mb-0">
                    {trophy.leagueLogo && (
                      <UnifiedSportsImage
                        imageId={parseInt(trophy.leagueLogo.split('/').pop()?.split('.')[0] || '0')}
                        imageType={ImageType.Leagues}
                        alt={trophy.league}
                        width={20}
                        height={20}
                        className="w-5 h-5 object-contain flex-shrink-0"
                      />
                    )}
                    <p className="text-sm font-semibold text-gray-900 dark:text-[#F0F0F0] truncate">
                      {getLeagueKoreanName(trophy.league) || trophy.league}
                    </p>
                    
                    {/* PC에서만 한 줄로 표시 */}
                    <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 ml-2">
                      <span>{trophy.season}</span>
                      <span>•</span>
                      <span className="font-medium">{trophy.place}</span>
                      {trophy.country && (
                        <>
                          <span>•</span>
                          <span>{trophy.country}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* 모바일에서만 두 번째 줄로 표시 */}
                  <div className="flex md:hidden items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{trophy.season}</span>
                    <span>•</span>
                    <span className="font-medium">{trophy.place}</span>
                    {trophy.country && (
                      <>
                        <span>•</span>
                        <span>{trophy.country}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ContainerContent>
    </Container>
  );
} 