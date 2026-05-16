'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, ContainerContent, ContainerHeader, ContainerTitle } from '@/shared/components/ui';
import { useVisibilityActivityRefresh } from '@/shared/hooks/useVisibilityActivityRefresh';
import { isLiveMatch } from '../../../constants/match-status';
import { Match } from '@/domains/livescore/types/match';
import LeagueMatchList from './LeagueMatchList';
import NavigationBar from './NavigationBar';

interface LiveScoreViewProps {
  initialDate: string;
  initialShowLiveOnly?: boolean;
  initialMatches: Match[];
  initialLiveMatchCount: number;
}

export default function LiveScoreView({
  initialDate,
  initialShowLiveOnly = false,
  initialMatches,
  initialLiveMatchCount,
}: LiveScoreViewProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(() => (
    initialDate ? new Date(initialDate) : new Date()
  ));
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showLiveOnly, setShowLiveOnly] = useState(initialShowLiveOnly);
  const [allExpanded, setAllExpanded] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setSelectedDate(initialDate ? new Date(initialDate) : new Date());
    setShowLiveOnly(initialShowLiveOnly);
    setIsNavigating(false);
  }, [initialDate, initialShowLiveOnly]);

  useEffect(() => {
    const scheduleNextKstMidnight = () => {
      const nowUtc = new Date();
      const kstNow = new Date(nowUtc.getTime() + 9 * 60 * 60 * 1000);
      const nextKstMidnight = new Date(kstNow);
      nextKstMidnight.setHours(24, 0, 0, 0);
      const msUntilNext = nextKstMidnight.getTime() - kstNow.getTime();

      const timeoutId = window.setTimeout(() => {
        const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
        const dateStr = kst.toISOString().split('T')[0];
        setIsNavigating(true);
        router.push(`/livescore/football?date=${dateStr}`, { scroll: false });
        scheduleNextKstMidnight();
      }, msUntilNext);

      return timeoutId;
    };

    const id = scheduleNextKstMidnight();
    return () => window.clearTimeout(id);
  }, [router]);

  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const today = kst.toISOString().split('T')[0];
  const shouldAutoRefresh = showLiveOnly || initialDate === today;

  useVisibilityActivityRefresh({
    enabled: shouldAutoRefresh,
    intervalMs: 60_000,
    onRefresh: () => router.refresh(),
  });

  const filteredMatches = useMemo(() => {
    return initialMatches.filter(match => {
      if (showLiveOnly && !isLiveMatch(match.status.code)) {
        return false;
      }

      if (searchKeyword) {
        const searchLower = searchKeyword.toLowerCase();
        return (
          match.league.name.toLowerCase().includes(searchLower) ||
          match.teams.home.name.toLowerCase().includes(searchLower) ||
          match.teams.away.name.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [initialMatches, searchKeyword, showLiveOnly]);

  const handleDateChange = (newDate: Date) => {
    if (showLiveOnly) {
      setShowLiveOnly(false);
    }

    const kst = new Date(newDate.getTime() + 9 * 60 * 60 * 1000);
    const dateStr = kst.toISOString().split('T')[0];
    setIsNavigating(true);
    router.push(`/livescore/football?date=${dateStr}`, { scroll: false });
  };

  const handleLiveClick = () => {
    const nextLive = !showLiveOnly;
    setShowLiveOnly(nextLive);

    if (nextLive) {
      setSelectedDate(new Date());
      setIsNavigating(true);
      router.push('/livescore/football?filter=live', { scroll: false });
      return;
    }

    const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const dateStr = kst.toISOString().split('T')[0];
    setIsNavigating(true);
    router.push(`/livescore/football?date=${dateStr}`, { scroll: false });
  };

  return (
    <div className="min-h-screen space-y-4">
      <NavigationBar
        searchKeyword={searchKeyword}
        showLiveOnly={showLiveOnly}
        liveMatchCount={initialLiveMatchCount}
        onSearchChange={setSearchKeyword}
        onLiveClick={handleLiveClick}
        onDateChange={handleDateChange}
        allExpanded={allExpanded}
        onToggleExpandAll={() => setAllExpanded(!allExpanded)}
        selectedDate={selectedDate}
        isNavigating={isNavigating}
      />

      {isNavigating ? (
        <Container className="bg-white dark:bg-[#1D1D1D]">
          <ContainerHeader>
            <ContainerTitle>경기 일정</ContainerTitle>
          </ContainerHeader>
          <ContainerContent className="min-h-[160px] flex items-center justify-center">
            <p className="text-[13px] text-gray-500 dark:text-gray-400">불러오는 중...</p>
          </ContainerContent>
        </Container>
      ) : (
        <LeagueMatchList matches={filteredMatches} allExpanded={allExpanded} />
      )}
    </div>
  );
}
