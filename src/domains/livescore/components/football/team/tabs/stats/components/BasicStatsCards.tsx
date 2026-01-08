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
    <div className="space-y-4 mb-4">
      {/* 리그 정보 + 최근 5경기 */}
      <Container>
        <ContainerHeader>
          <ContainerTitle>기본 정보</ContainerTitle>
        </ContainerHeader>
        <ContainerContent className="!p-0">
          {/* 소제목 */}
          <div className="flex bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
            <div className="flex-1 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">리그 정보</div>
            <div className="flex-1 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">최근 5경기</div>
          </div>
          {/* 데이터 */}
          <div className="flex items-center py-3">
            {/* 리그 정보 */}
            <div className="flex-1 flex items-center justify-center gap-2 relative">
              <div className="w-6 h-6 flex-shrink-0">
                <UnifiedSportsImage
                  imageId={safeLeague.id}
                  imageType={ImageType.Leagues}
                  alt={safeLeague.name || ''}
                  width={24}
                  height={24}
                  className="object-contain w-full h-full"
                />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-xs text-gray-900 dark:text-[#F0F0F0] truncate">
                  {getLeagueKoreanName(safeLeague.name) || safeLeague.name || '-'}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                  <span>{safeLeague.season || '-'}</span>
                  <span>•</span>
                  <span>{safeLeague.country || '-'}</span>
                </div>
              </div>
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-8 bg-gray-200 dark:bg-gray-600" />
            </div>

            {/* 최근 5경기 */}
            <div className="flex-1 flex items-center justify-center">
              {stats.form
                ?.split('')
                .reverse()
                .slice(0, 5)
                .map((result, index) => (
                  <div
                    key={index}
                    className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded mx-0.5 ${
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
        </ContainerContent>
      </Container>

      {/* 시즌 통계 + 득실 통계 */}
      <Container>
        <ContainerHeader>
          <ContainerTitle>시즌 통계</ContainerTitle>
        </ContainerHeader>
        <ContainerContent className="!p-0">
          {/* 소제목 */}
          <div className="flex bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
            {['경기', '승', '무', '패', '득점', '실점', '클린시트'].map((label) => (
              <div key={label} className="flex-1 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">{label}</div>
            ))}
          </div>
          {/* 데이터 */}
          <div className="flex items-center py-3">
            <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
              {safeFixtures.played.total}
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
            </div>
            <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
              {safeFixtures.wins.total}
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
            </div>
            <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
              {safeFixtures.draws.total}
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
            </div>
            <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
              {safeFixtures.loses.total}
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
            </div>
            <div className="flex-1 text-center relative">
              <div className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">{safeGoals.for.total.total}</div>
              <div className="text-[9px] text-gray-400 dark:text-gray-500">({safeGoals.for.average?.total || '0'})</div>
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
            </div>
            <div className="flex-1 text-center relative">
              <div className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">{safeGoals.against.total.total}</div>
              <div className="text-[9px] text-gray-400 dark:text-gray-500">({safeGoals.against.average?.total || '0'})</div>
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
            </div>
            <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
              {safeCleanSheet.total}
            </div>
          </div>
        </ContainerContent>
      </Container>
    </div>
  );
}
