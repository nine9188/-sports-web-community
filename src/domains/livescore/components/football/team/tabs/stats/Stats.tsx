'use client';

import BasicStatsCards from './components/BasicStatsCards';
import HomeAwayStats from './components/HomeAwayStats';
import GoalsChart from './components/GoalsChart';
import FormationStats from './components/FormationStats';
import CardsChart from './components/CardsChart';
import AdditionalStats from './components/AdditionalStats';
import { TeamStatsData } from '../../../../../types/stats';
import TeamTabEmptyState from '../TeamTabEmptyState';

interface StatsProps {
  teamStats: TeamStatsData | undefined;
  leagueLogoUrls?: Record<number, string>;
  leagueLogoDarkUrls?: Record<number, string>;
}

export default function Stats({ teamStats, leagueLogoUrls = {}, leagueLogoDarkUrls = {} }: StatsProps) {
  const hasStats = teamStats && Object.keys(teamStats).length > 0;

  if (!hasStats) {
    return <TeamTabEmptyState title="통계" message="팀 통계 데이터가 없습니다." />;
  }

  const resolvedStats = teamStats as TeamStatsData;

  return (
    <div className="space-y-4">
      <BasicStatsCards
        stats={resolvedStats}
        leagueLogoUrl={resolvedStats.league?.id ? leagueLogoUrls[resolvedStats.league.id] : undefined}
        leagueLogoDarkUrl={resolvedStats.league?.id ? leagueLogoDarkUrls[resolvedStats.league.id] : undefined}
      />
      <HomeAwayStats stats={resolvedStats} />
      <AdditionalStats stats={resolvedStats} />
      <FormationStats stats={resolvedStats} />
      <GoalsChart stats={resolvedStats} />
      <CardsChart stats={resolvedStats} />
    </div>
  );
}
