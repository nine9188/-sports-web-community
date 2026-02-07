'use client';

import { LoadingState, ErrorState, EmptyState } from '../../../../common/CommonComponents';
import BasicStatsCards from './components/BasicStatsCards';
import HomeAwayStats from './components/HomeAwayStats';
import GoalsChart from './components/GoalsChart';
import FormationStats from './components/FormationStats';
import CardsChart from './components/CardsChart';
import AdditionalStats from './components/AdditionalStats';
import { TeamStatsData } from '../../../../../types/stats';

interface StatsProps {
  teamStats: TeamStatsData | undefined;
  isLoading: boolean;
  error: string | null;
  // 4590 표준: 이미지 Storage URL
  leagueLogoUrls?: Record<number, string>;
  leagueLogoDarkUrls?: Record<number, string>;  // 다크모드 리그 로고
}

export default function Stats({ teamStats, isLoading, error, leagueLogoUrls = {}, leagueLogoDarkUrls = {} }: StatsProps) {
  // 데이터 존재 여부
  const hasStats = teamStats && Object.keys(teamStats).length > 0;

  if (isLoading) {
    return <LoadingState message="팀 통계를 불러오는 중..." />;
  }

  if (error) {
    return <ErrorState message="팀 통계를 불러오는 중 오류가 발생했습니다." />;
  }

  if (!hasStats) {
    return <EmptyState message="팀 통계 데이터가 없습니다." />;
  }

  return (
    <div className="space-y-4">
      {/* 기본 통계 카드 섹션 */}
      <BasicStatsCards
        stats={teamStats}
        leagueLogoUrl={teamStats.league?.id ? leagueLogoUrls[teamStats.league.id] : undefined}
        leagueLogoDarkUrl={teamStats.league?.id ? leagueLogoDarkUrls[teamStats.league.id] : undefined}
      />
      
      {/* 홈/원정 상세 통계 섹션 */}
      <HomeAwayStats stats={teamStats} />

      {/* 추가 통계 섹션 */}
      <AdditionalStats stats={teamStats} />

      {/* 포메이션 통계 차트 */}
      <FormationStats stats={teamStats} />
            
      {/* 득점/실점 시간대 차트 */}
      <GoalsChart stats={teamStats} />
      
      {/* 카드 시간대 차트 */}
      <CardsChart stats={teamStats} />
      

    </div>
  );
}