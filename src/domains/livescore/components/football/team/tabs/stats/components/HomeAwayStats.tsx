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
    <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 mb-4">
      {/* 홈 통계 */}
      <Container>
        <ContainerHeader>
          <ContainerTitle>홈 경기 통계</ContainerTitle>
        </ContainerHeader>
        <ContainerContent>
          <div className="flex flex-col md:flex-row gap-4 mb-3">
            {/* 승무패 통계 */}
            <div className="flex-1">
              <h5 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">승무패</h5>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-base font-bold text-gray-900 dark:text-[#F0F0F0]">{safeFixtures.wins.home}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">승</p>
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900 dark:text-[#F0F0F0]">{safeFixtures.draws.home}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">무</p>
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900 dark:text-[#F0F0F0]">{safeFixtures.loses.home}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">패</p>
                </div>
              </div>
            </div>
            
            {/* 득실점 통계 */}
            <div className="flex-1">
              <h5 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">득실점</h5>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">득점</span>
                  <span className="font-medium text-gray-900 dark:text-[#F0F0F0]">{safeGoals.for.total.home}골 {safeGoals.for.average && `(평균 ${safeGoals.for.average.home})`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">실점</span>
                  <span className="font-medium text-gray-900 dark:text-[#F0F0F0]">{safeGoals.against.total.home}골 {safeGoals.against.average && `(평균 ${safeGoals.against.average.home})`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">클린시트</span>
                  <span className="font-medium text-gray-900 dark:text-[#F0F0F0]">{safeCleanSheet.home}회</span>
                </div>
              </div>
            </div>
          </div>
        </ContainerContent>
      </Container>

      {/* 원정 통계 */}
      <Container>
        <ContainerHeader>
          <ContainerTitle>원정 경기 통계</ContainerTitle>
        </ContainerHeader>
        <ContainerContent>
          <div className="flex flex-col md:flex-row gap-4 mb-3">
            {/* 승무패 통계 */}
            <div className="flex-1">
              <h5 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">승무패</h5>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-base font-bold text-gray-900 dark:text-[#F0F0F0]">{safeFixtures.wins.away}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">승</p>
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900 dark:text-[#F0F0F0]">{safeFixtures.draws.away}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">무</p>
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900 dark:text-[#F0F0F0]">{safeFixtures.loses.away}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">패</p>
                </div>
              </div>
            </div>
            
            {/* 득실점 통계 */}
            <div className="flex-1">
              <h5 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">득실점</h5>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">득점</span>
                  <span className="font-medium text-gray-900 dark:text-[#F0F0F0]">{safeGoals.for.total.away}골 {safeGoals.for.average && `(평균 ${safeGoals.for.average.away})`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">실점</span>
                  <span className="font-medium text-gray-900 dark:text-[#F0F0F0]">{safeGoals.against.total.away}골 {safeGoals.against.average && `(평균 ${safeGoals.against.average.away})`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">클린시트</span>
                  <span className="font-medium text-gray-900 dark:text-[#F0F0F0]">{safeCleanSheet.away}회</span>
                </div>
              </div>
            </div>
          </div>
        </ContainerContent>
      </Container>
    </div>
  );
} 