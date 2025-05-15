'use client';

import { TeamStatsData } from '@/domains/livescore/types/stats';

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
      <div className="bg-white rounded-lg border overflow-hidden">
        <h4 className="text-sm font-medium p-2 border-b border-gray-200">홈 경기 통계</h4>
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-4 mb-3">
            {/* 승무패 통계 */}
            <div className="flex-1">
              <h5 className="text-xs font-medium text-gray-500 mb-2">승무패</h5>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-base font-bold">{safeFixtures.wins.home}</p>
                  <p className="text-xs text-gray-600">승</p>
                </div>
                <div>
                  <p className="text-base font-bold">{safeFixtures.draws.home}</p>
                  <p className="text-xs text-gray-600">무</p>
                </div>
                <div>
                  <p className="text-base font-bold">{safeFixtures.loses.home}</p>
                  <p className="text-xs text-gray-600">패</p>
                </div>
              </div>
            </div>
            
            {/* 득실점 통계 */}
            <div className="flex-1">
              <h5 className="text-xs font-medium text-gray-500 mb-2">득실점</h5>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>득점</span>
                  <span className="font-medium">{safeGoals.for.total.home}골 {safeGoals.for.average && `(평균 ${safeGoals.for.average.home})`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>실점</span>
                  <span className="font-medium">{safeGoals.against.total.home}골 {safeGoals.against.average && `(평균 ${safeGoals.against.average.home})`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>클린시트</span>
                  <span className="font-medium">{safeCleanSheet.home}회</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 원정 통계 */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <h4 className="text-sm font-medium p-2 border-b border-gray-200">원정 경기 통계</h4>
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-4 mb-3">
            {/* 승무패 통계 */}
            <div className="flex-1">
              <h5 className="text-xs font-medium text-gray-500 mb-2">승무패</h5>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-base font-bold">{safeFixtures.wins.away}</p>
                  <p className="text-xs text-gray-600">승</p>
                </div>
                <div>
                  <p className="text-base font-bold">{safeFixtures.draws.away}</p>
                  <p className="text-xs text-gray-600">무</p>
                </div>
                <div>
                  <p className="text-base font-bold">{safeFixtures.loses.away}</p>
                  <p className="text-xs text-gray-600">패</p>
                </div>
              </div>
            </div>
            
            {/* 득실점 통계 */}
            <div className="flex-1">
              <h5 className="text-xs font-medium text-gray-500 mb-2">득실점</h5>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>득점</span>
                  <span className="font-medium">{safeGoals.for.total.away}골 {safeGoals.for.average && `(평균 ${safeGoals.for.average.away})`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>실점</span>
                  <span className="font-medium">{safeGoals.against.total.away}골 {safeGoals.against.average && `(평균 ${safeGoals.against.average.away})`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>클린시트</span>
                  <span className="font-medium">{safeCleanSheet.away}회</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 