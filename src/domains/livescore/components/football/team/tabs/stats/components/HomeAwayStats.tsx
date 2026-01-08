'use client';

import { TeamStatsData } from '@/domains/livescore/types/stats';
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui/container';

interface HomeAwayStatsProps {
  stats: TeamStatsData;
}

export default function HomeAwayStats({ stats }: HomeAwayStatsProps) {
  // 안전한 데이터 접근을 위한 기본값
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      {/* 홈 통계 */}
      <Container>
        <ContainerHeader>
          <ContainerTitle>홈 경기 통계</ContainerTitle>
        </ContainerHeader>
        <ContainerContent className="!p-0">
          {/* 헤더 */}
          <div className="flex bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
            {['경기', '승', '무', '패', '득점', '실점', '클린시트'].map((label) => (
              <div key={label} className="flex-1 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">{label}</div>
            ))}
          </div>
          {/* 데이터 */}
          <div className="flex items-center py-3">
            <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
              {safeFixtures.played.home}
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
            </div>
            <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
              {safeFixtures.wins.home}
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
            </div>
            <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
              {safeFixtures.draws.home}
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
            </div>
            <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
              {safeFixtures.loses.home}
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
            </div>
            <div className="flex-1 text-center relative">
              <div className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">{safeGoals.for.total.home}</div>
              <div className="text-[9px] text-gray-400 dark:text-gray-500">({safeGoals.for.average?.home || '0'})</div>
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
            </div>
            <div className="flex-1 text-center relative">
              <div className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">{safeGoals.against.total.home}</div>
              <div className="text-[9px] text-gray-400 dark:text-gray-500">({safeGoals.against.average?.home || '0'})</div>
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
            </div>
            <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
              {safeCleanSheet.home}
            </div>
          </div>
        </ContainerContent>
      </Container>

      {/* 원정 통계 */}
      <Container>
        <ContainerHeader>
          <ContainerTitle>원정 경기 통계</ContainerTitle>
        </ContainerHeader>
        <ContainerContent className="!p-0">
          {/* 헤더 */}
          <div className="flex bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
            {['경기', '승', '무', '패', '득점', '실점', '클린시트'].map((label) => (
              <div key={label} className="flex-1 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">{label}</div>
            ))}
          </div>
          {/* 데이터 */}
          <div className="flex items-center py-3">
            <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
              {safeFixtures.played.away}
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
            </div>
            <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
              {safeFixtures.wins.away}
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
            </div>
            <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
              {safeFixtures.draws.away}
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
            </div>
            <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
              {safeFixtures.loses.away}
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
            </div>
            <div className="flex-1 text-center relative">
              <div className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">{safeGoals.for.total.away}</div>
              <div className="text-[9px] text-gray-400 dark:text-gray-500">({safeGoals.for.average?.away || '0'})</div>
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
            </div>
            <div className="flex-1 text-center relative">
              <div className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">{safeGoals.against.total.away}</div>
              <div className="text-[9px] text-gray-400 dark:text-gray-500">({safeGoals.against.average?.away || '0'})</div>
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
            </div>
            <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
              {safeCleanSheet.away}
            </div>
          </div>
        </ContainerContent>
      </Container>
    </div>
  );
} 