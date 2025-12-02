'use client';

import { useEffect } from 'react';
import Events from './tabs/Events';
import Lineups from './tabs/lineups/Lineups';
import Stats from './tabs/Stats';
import Standings from './tabs/Standings';
import Power from './tabs/Power';
import MatchPredictionClient from './sidebar/MatchPredictionClient';
import SupportCommentsSection from './sidebar/SupportCommentsSection';
import { LoadingState, EmptyState } from '@/domains/livescore/components/common/CommonComponents';
import { useMatchData, TabType, isPowerTabData } from './context/MatchDataContext';

export default function TabContent() {
  const {
    matchId,
    matchData,
    currentTab,
    eventsData,
    lineupsData,
    statsData,
    standingsData,
    homeTeam,
    awayTeam,
    isLoading,
    loadMatchData,
    tabsData
  } = useMatchData();

  // 탭 변경 시 데이터 로드 (Context에서 중복 로드 방지)
  useEffect(() => {
    if (!matchId || currentTab === 'support' || isLoading) return;

    // loadMatchData 내부에서 loadedTabs로 중복 방지하므로 안전하게 호출
    loadMatchData(matchId, currentTab as TabType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, currentTab]);

  if (!matchId) {
    return <EmptyState title="경기 정보 없음" message="경기 정보가 없습니다." />;
  }

  // 로딩 상태
  if (isLoading) {
    return <LoadingState message={`${getTabLabel(currentTab)} 데이터를 불러오는 중...`} />;
  }

  // 탭별 렌더링
  switch (currentTab) {
    case 'events':
      return eventsData && eventsData.length > 0
        ? <Events events={eventsData} />
        : <EmptyState title="이벤트 없음" message="이 경기의 이벤트 데이터를 찾을 수 없습니다." />;

    case 'lineups':
      if (!lineupsData?.response) {
        return <EmptyState title="라인업 없음" message="이 경기의 라인업 정보를 찾을 수 없습니다." />;
      }
      const fixture = matchData && typeof matchData === 'object' && 'fixture' in matchData
        ? (matchData as { fixture?: { status?: { short?: string } } }).fixture
        : undefined;

      // lineupData의 타입을 변환 (grid: string | null -> string)
      const convertedLineups = {
        ...lineupsData,
        response: lineupsData.response ? {
          home: {
            ...lineupsData.response.home,
            startXI: lineupsData.response.home.startXI.map(item => ({
              player: { ...item.player, grid: item.player.grid || '' }
            })),
            substitutes: lineupsData.response.home.substitutes.map(item => ({
              player: { ...item.player, grid: item.player.grid || '' }
            }))
          },
          away: {
            ...lineupsData.response.away,
            startXI: lineupsData.response.away.startXI.map(item => ({
              player: { ...item.player, grid: item.player.grid || '' }
            })),
            substitutes: lineupsData.response.away.substitutes.map(item => ({
              player: { ...item.player, grid: item.player.grid || '' }
            }))
          }
        } : null
      };

      return (
        <Lineups
          matchData={{
            lineups: convertedLineups,
            homeTeam: homeTeam || undefined,
            awayTeam: awayTeam || undefined,
            events: eventsData || undefined,
            fixture
          }}
          matchId={matchId}
        />
      );

    case 'stats':
      return statsData && statsData.length > 0
        ? <Stats matchData={{ stats: statsData, homeTeam: homeTeam || undefined, awayTeam: awayTeam || undefined }} matchId={matchId} />
        : <EmptyState title="통계 없음" message="이 경기의 통계 데이터를 찾을 수 없습니다." />;

    case 'standings':
      return standingsData
        ? <Standings matchData={{ standings: standingsData, homeTeam: homeTeam || undefined, awayTeam: awayTeam || undefined }} matchId={matchId} />
        : <EmptyState title="순위 없음" message="이 리그의 순위 정보를 찾을 수 없습니다." />;

    case 'power':
      const powerData = tabsData.power;
      return powerData && isPowerTabData(powerData) && homeTeam && awayTeam
        ? <Power matchId={matchId} homeTeam={homeTeam} awayTeam={awayTeam} data={{ ...powerData, standings: standingsData }} />
        : <EmptyState title="전력 분석 없음" message="이 경기의 전력 데이터를 찾을 수 없습니다." />;

    case 'support':
      return (
        <div className="space-y-4">
          <MatchPredictionClient matchData={matchData || {}} />
          <SupportCommentsSection matchData={matchData || {}} />
        </div>
      );

    default:
      return <EmptyState title="알 수 없는 탭" message="존재하지 않는 탭입니다." />;
  }
}

function getTabLabel(tab: string): string {
  const labels: Record<string, string> = {
    events: '이벤트',
    lineups: '라인업',
    stats: '통계',
    standings: '순위',
    power: '전력',
    support: '응원'
  };
  return labels[tab] || '데이터';
} 