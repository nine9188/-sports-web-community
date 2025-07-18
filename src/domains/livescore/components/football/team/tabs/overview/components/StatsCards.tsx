'use client';

import Image from 'next/image';
import ApiSportsImage from '@/shared/components/ApiSportsImage';
import { ImageType } from '@/shared/types/image';
import FormDisplay from './FormDisplay';

// 타입 정의
interface LeagueInfo {
  name: string;
  country: string;
  logo: string;
  season: number;
}

interface FixturesInfo {
  wins: { total: number };
  draws: { total: number };
  loses: { total: number };
}

interface GoalStats {
  total?: {
    home: number;
    away: number;
    total: number;
  };
  average?: {
    home: string;
    away: string;
    total: string;
  };
  minute?: Record<string, { total: number; percentage: string }>;
}

interface CleanSheetInfo {
  total: number;
}

interface StatsCardsProps {
  stats: {
    league?: LeagueInfo;
    fixtures?: FixturesInfo;
    goals?: {
      for: GoalStats;
      against: GoalStats;
    };
    clean_sheet?: CleanSheetInfo;
    form?: string;
  };
  onTabChange: (tab: string) => void;
}

export default function StatsCards({ stats, onTabChange }: StatsCardsProps) {
  // 안전한 상태 객체 정의 (undefined 방지)
  const safeStats = stats || {};
  const safeLeague: LeagueInfo = safeStats.league || {
    name: '',
    country: '',
    logo: '',
    season: 0
  };
  const safeFixtures: FixturesInfo = safeStats.fixtures || {
    wins: { total: 0 },
    draws: { total: 0 },
    loses: { total: 0 }
  };
  const safeGoals = safeStats.goals || {
    for: {
      total: { home: 0, away: 0, total: 0 },
      average: { home: '0', away: '0', total: '0' },
      minute: {}
    },
    against: {
      total: { home: 0, away: 0, total: 0 },
      average: { home: '0', away: '0', total: '0' },
      minute: {}
    }
  };
  const safeCleanSheet: CleanSheetInfo = safeStats.clean_sheet || { total: 0 };

  // 득점 및 실점 데이터 안전하게 접근하는 함수
  const getSafeGoalValue = (goalObj: GoalStats, type: string): number => {
    if (!goalObj || !goalObj.total) return 0;
    
    // goalObj.total이 객체인지 확인
    if (typeof goalObj.total === 'object' && goalObj.total !== null) {
      // type이 total 객체에 존재하는지 확인
      if (type === 'home' && 'home' in goalObj.total) {
        return goalObj.total.home || 0;
      }
      if (type === 'away' && 'away' in goalObj.total) {
        return goalObj.total.away || 0;
      }
      if (type === 'total' && 'total' in goalObj.total) {
        return goalObj.total.total || 0;
      }
    }
    
    // 기본값
    return 0;
  };

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-4">
        {/* 리그 정보 카드 */}
        <div className="col-span-2 md:col-span-1 border-b md:border-b-0 md:border-r border-gray-200">
          <h4 className="text-sm font-medium p-2 border-b border-gray-100">리그 정보</h4>
          <div className="flex items-center p-2">
            <div className="w-6 h-6 relative flex-shrink-0 mr-3">
              {safeLeague.logo && (
                <ApiSportsImage
                  src={safeLeague.logo}
                  imageId={safeLeague.id}
                  imageType={ImageType.Leagues}
                  alt={safeLeague.name || '리그'}
                  width={24}
                  height={24}
                  className="object-contain w-6 h-6"
                />
              )}
            </div>
            <div>
              <p className="font-medium text-sm">{safeLeague.name || '정보 없음'}</p>
              <p className="text-xs text-gray-600">시즌: {safeLeague.season || '정보 없음'}</p>
              <p className="text-xs text-gray-600">국가: {safeLeague.country || '정보 없음'}</p>
            </div>
          </div>
        </div>

        {/* 시즌 통계 카드 */}
        <div className="border-b border-r md:border-b-0 md:border-r border-gray-200">
          <h4 className="text-sm font-medium p-2 border-b border-gray-100">시즌 통계</h4>
          <div className="grid grid-cols-3 p-2 text-center">
            <div>
              <p className="text-base font-bold">{safeFixtures.wins.total || 0}</p>
              <p className="text-xs text-gray-500">승</p>
            </div>
            <div>
              <p className="text-base font-bold">{safeFixtures.draws.total || 0}</p>
              <p className="text-xs text-gray-500">무</p>
            </div>
            <div>
              <p className="text-base font-bold">{safeFixtures.loses.total || 0}</p>
              <p className="text-xs text-gray-500">패</p>
            </div>
          </div>
        </div>

        {/* 득실 통계 카드 */}
        <div className="border-b md:border-b-0 md:border-r border-gray-200">
          <h4 className="text-sm font-medium p-2 border-b border-gray-100">득실 통계</h4>
          <div className="grid grid-cols-3 p-2 text-center">
            <div>
              <p className="text-base font-bold">
                {getSafeGoalValue(safeGoals.for, 'total')}
              </p>
              <p className="text-xs text-gray-500">득점</p>
            </div>
            <div>
              <p className="text-base font-bold">
                {getSafeGoalValue(safeGoals.against, 'total')}
              </p>
              <p className="text-xs text-gray-500">실점</p>
            </div>
            <div>
              <p className="text-base font-bold">{safeCleanSheet.total || 0}</p>
              <p className="text-xs text-gray-500">클린시트</p>
            </div>
          </div>
        </div>

        {/* 최근 5경기 카드 */}
        <div className="col-span-2 md:col-span-1 flex flex-col">
          <h4 className="text-sm font-medium p-2 border-b border-gray-100">최근 5경기</h4>
          <div className="flex-1 flex items-center justify-center py-3 px-2 my-1">
            {safeStats.form ? (
              <FormDisplay form={safeStats.form} maxLength={5} reverse={true} />
            ) : (
              <p className="text-sm text-gray-500">데이터 없음</p>
            )}
          </div>
        </div>
      </div>

      {/* 자세한 통계 보기 버튼 */}
      <button 
        onClick={() => onTabChange('stats')}
        className="w-full p-2 text-blue-600 hover:text-blue-800 transition-colors border-t border-gray-200"
      >
        <div className="flex items-center justify-center gap-1">
          <span className="text-sm font-medium">자세한 통계 보기</span>
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 9l-7 7-7-7" 
            />
          </svg>
        </div>
      </button>
    </div>
  );
} 