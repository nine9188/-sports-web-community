'use client';

import ApiSportsImage from '@/shared/components/ApiSportsImage';
import { ImageType } from '@/shared/types/image';

import { TeamStatsData, LeagueData } from '@/domains/livescore/types/stats';

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
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-4">
        {/* 리그 정보 카드 */}
        <div className="col-span-2 md:col-span-1 border-b md:border-b-0 md:border-r border-gray-200">
          <h4 className="text-sm font-medium p-2 border-b border-gray-100">리그 정보</h4>
          <div className="flex items-center p-2">
            <div className="mr-3 flex-shrink-0">
              <div className="w-6 h-6 relative">
                <ApiSportsImage
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
              <p className="font-medium text-sm">{safeLeague.name || ''}</p>
              <p className="text-xs text-gray-600">시즌: {safeLeague.season || ''}</p>
              <p className="text-xs text-gray-600">국가: {safeLeague.country || ''}</p>
            </div>
          </div>
        </div>

        {/* 시즌 통계 카드 */}
        <div className="border-b border-r md:border-b-0 md:border-r border-gray-200">
          <h4 className="text-sm font-medium p-2 border-b border-gray-100">시즌 통계</h4>
          <div className="grid grid-cols-3 p-2 text-center">
            <div>
              <p className="text-base font-bold">{safeFixtures.wins.total}</p>
              <p className="text-xs text-gray-500">승</p>
            </div>
            <div>
              <p className="text-base font-bold">{safeFixtures.draws.total}</p>
              <p className="text-xs text-gray-500">무</p>
            </div>
            <div>
              <p className="text-base font-bold">{safeFixtures.loses.total}</p>
              <p className="text-xs text-gray-500">패</p>
            </div>
          </div>
        </div>

        {/* 득실 통계 카드 */}
        <div className="border-b md:border-b-0 md:border-r border-gray-200">
          <h4 className="text-sm font-medium p-2 border-b border-gray-100">득실 통계</h4>
          <div className="grid grid-cols-3 p-2 text-center">
            <div>
              <p className="text-base font-bold">{safeGoals.for.total.total}</p>
              <p className="text-xs text-gray-500">득점</p>
            </div>
            <div>
              <p className="text-base font-bold">{safeGoals.against.total.total}</p>
              <p className="text-xs text-gray-500">실점</p>
            </div>
            <div>
              <p className="text-base font-bold">{safeCleanSheet.total}</p>
              <p className="text-xs text-gray-500">클린시트</p>
            </div>
          </div>
        </div>

        {/* 최근 5경기 */}
        <div className="col-span-2 md:col-span-1 flex flex-col">
          <h4 className="text-sm font-medium p-2 border-b border-gray-100">최근 5경기</h4>
          <div className="flex-1 flex items-center justify-center py-3 px-2 my-1">
            {stats.form
              ?.split('')
              .reverse()
              .slice(0, 5)
              .map((result, index) => (
                <div 
                  key={index}
                  className={`w-6 h-6 flex items-center justify-center text-xs font-medium rounded mx-0.5 ${
                    result === 'W' ? 'bg-green-100 text-green-800' : 
                    result === 'D' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'
                  }`}
                >
                  {result}
                </div>
              )) || <p className="text-sm text-gray-500">데이터 없음</p>}
          </div>
        </div>
      </div>
    </div>
  );
} 