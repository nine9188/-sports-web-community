'use client';

import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';

import { TeamStatsData, LeagueData } from '@/domains/livescore/types/stats';
import { getLeagueKoreanName } from '@/domains/livescore/constants/league-mappings';
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui/container';

// 컴포넌트 Props 타입
interface BasicStatsCardsProps {
  stats: TeamStatsData;
}

export default function BasicStatsCards({ stats }: BasicStatsCardsProps) {
  // 안전한 데이터 접근을 위한 기본값
  const safeLeague: LeagueData = stats.league || {
    id: 0,
    name: '',
    country: '',
    logo: '',
    flag: '',
    season: 0
  };
  
  const safeFixtures = stats.fixtures || {
    wins: { total: 0, home: 0, away: 0 },
    draws: { total: 0, home: 0, away: 0 },
    loses: { total: 0, home: 0, away: 0 },
    played: { total: 0, home: 0, away: 0 }
  };
  
  const safeGoals = stats.goals || {
    for: { 
      total: { total: 0, home: 0, away: 0 },
      average: { total: '0', home: '0', away: '0' }
    },
    against: { 
      total: { total: 0, home: 0, away: 0 },
      average: { total: '0', home: '0', away: '0' }
    }
  };
  
  const safeCleanSheet = stats.clean_sheet || { total: 0, home: 0, away: 0 };

  return (
    <Container>
      <ContainerHeader>
        <ContainerTitle>기본 통계</ContainerTitle>
      </ContainerHeader>
      <ContainerContent className="p-0">
        <div className="grid grid-cols-2 md:grid-cols-4">
        {/* 리그 정보 카드 */}
        <div className="col-span-2 md:col-span-1 border-b md:border-b-0 md:border-r border-black/5 dark:border-white/10">
          <h4 className="text-xs font-bold p-3 border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0]">리그 정보</h4>
          <div className="flex items-center p-3">
            <div className="mr-3 flex-shrink-0">
              <div className="w-6 h-6 relative">
                <UnifiedSportsImage
                  imageId={safeLeague.id}
                  imageType={ImageType.Leagues}
                  alt={safeLeague.name || ''}
                  width={24}
                  height={24}
                  className="object-contain w-full h-full"
                />
              </div>
            </div>
            <div>
              <p className="font-medium text-sm text-gray-900 dark:text-[#F0F0F0]">{getLeagueKoreanName(safeLeague.name) || ''}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">시즌: {safeLeague.season || ''}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">국가: {safeLeague.country || ''}</p>
            </div>
          </div>
        </div>

        {/* 시즌 통계 카드 */}
        <div className="border-b border-r md:border-b-0 md:border-r border-black/5 dark:border-white/10">
          <h4 className="text-xs font-bold p-3 border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0]">시즌 통계</h4>
          <div className="grid grid-cols-3 p-3 gap-2 text-center">
            <div>
              <p className="text-base font-bold text-gray-900 dark:text-[#F0F0F0]">{safeFixtures.wins.total}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">승</p>
            </div>
            <div>
              <p className="text-base font-bold text-gray-900 dark:text-[#F0F0F0]">{safeFixtures.draws.total}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">무</p>
            </div>
            <div>
              <p className="text-base font-bold text-gray-900 dark:text-[#F0F0F0]">{safeFixtures.loses.total}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">패</p>
            </div>
          </div>
        </div>

        {/* 득실 통계 카드 */}
        <div className="border-b md:border-b-0 md:border-r border-black/5 dark:border-white/10">
          <h4 className="text-xs font-bold p-3 border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0]">득실 통계</h4>
          <div className="grid grid-cols-3 p-3 gap-2 text-center">
            <div>
              <p className="text-base font-bold text-gray-900 dark:text-[#F0F0F0]">{safeGoals.for.total.total}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">득점</p>
            </div>
            <div>
              <p className="text-base font-bold text-gray-900 dark:text-[#F0F0F0]">{safeGoals.against.total.total}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">실점</p>
            </div>
            <div>
              <p className="text-base font-bold text-gray-900 dark:text-[#F0F0F0]">{safeCleanSheet.total}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">클린시트</p>
            </div>
          </div>
        </div>

        {/* 최근 5경기 */}
        <div className="col-span-2 md:col-span-1 flex flex-col">
          <h4 className="text-xs font-bold p-3 border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0]">최근 5경기</h4>
          <div className="flex-1 flex items-center justify-center p-3">
            {stats.form
              ?.split('')
              .reverse()
              .slice(0, 5)
              .map((result, index) => (
                <div 
                  key={index}
                  className={`w-6 h-6 flex items-center justify-center text-xs font-medium rounded mx-0.5 ${
                    result === 'W' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 
                    result === 'D' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' : 
                    'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                  }`}
                >
                  {result}
                </div>
              )) || <p className="text-sm text-gray-500 dark:text-gray-400">데이터 없음</p>}
          </div>
        </div>
        </div>
      </ContainerContent>
    </Container>
  );
} 