'use client';

import { useState, useEffect, useMemo } from 'react';
import NavigationBar from './NavigationBar/index';
import LeagueMatchList from './LeagueMatchList/index';
import LiveScoreSkeleton from './LiveScoreSkeleton';
import { useLiveScore } from '../../../hooks/useLiveScoreQueries';
import { isLiveMatch } from '../../../constants/match-status';

interface LiveScoreViewProps {
  initialDate: string;
}

/**
 * LiveScoreView - React Query 기반 라이브스코어 뷰
 *
 * 개선사항:
 * - useState + setInterval 수동 폴링 → React Query refetchInterval 자동 폴링
 * - 수동 캐싱 → React Query 자동 캐싱
 * - 서버 프리로드 → 클라이언트 자동 프리페치 제거 (봇 안전)
 *
 * 폴링 정책:
 * - LIVE 모드: 30초마다 갱신
 * - 오늘 날짜: 60초마다 갱신
 * - 과거/미래 날짜: 폴링 없음 (캐시 사용)
 */
export default function LiveScoreView({
  initialDate,
}: LiveScoreViewProps) {
  // UI 상태 관리
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    return initialDate ? new Date(initialDate) : new Date();
  });
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showLiveOnly, setShowLiveOnly] = useState(false);
  const [allExpanded, setAllExpanded] = useState(true);

  // React Query로 경기 데이터 및 라이브 카운트 관리
  // - 자동 폴링 (LIVE 모드: 30초, 오늘: 60초)
  // - 자동 캐싱 (5분)
  // - 서버 프리로드 (봇 안전)
  const { matches, isLoading, liveMatchCount } = useLiveScore(selectedDate, { showLiveOnly });

  // KST 자정 롤오버: 자정(KST) 도달 시 자동으로 오늘로 갱신
  useEffect(() => {
    const scheduleNextKstMidnight = () => {
      const nowUtc = new Date();
      const kstNow = new Date(nowUtc.getTime() + 9 * 60 * 60 * 1000);
      const nextKstMidnight = new Date(kstNow);
      nextKstMidnight.setHours(24, 0, 0, 0);
      const msUntilNext = nextKstMidnight.getTime() - kstNow.getTime();

      const timeoutId = setTimeout(() => {
        setSelectedDate(new Date());
        scheduleNextKstMidnight();
      }, msUntilNext);

      return timeoutId;
    };

    const id = scheduleNextKstMidnight();
    return () => {
      clearTimeout(id);
    };
  }, []);

  // 필터링된 매치 목록 (검색어 + LIVE 필터)
  const filteredMatches = useMemo(() => {
    return matches.filter(match => {
      // LIVE 필터
      if (showLiveOnly && !isLiveMatch(match.status.code)) {
        return false;
      }

      // 검색어 필터
      if (searchKeyword) {
        const searchLower = searchKeyword.toLowerCase();
        return match.league.name.toLowerCase().includes(searchLower) ||
               match.teams.home.name.toLowerCase().includes(searchLower) ||
               match.teams.away.name.toLowerCase().includes(searchLower);
      }
      return true;
    });
  }, [matches, showLiveOnly, searchKeyword]);

  // 날짜 변경 핸들러
  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
    if (showLiveOnly) {
      setShowLiveOnly(false);
    }
  };

  return (
    <div className="min-h-screen space-y-4">
      <div>
        <NavigationBar
          searchKeyword={searchKeyword}
          showLiveOnly={showLiveOnly}
          liveMatchCount={liveMatchCount}
          onSearchChange={setSearchKeyword}
          onLiveClick={() => {
            setShowLiveOnly(!showLiveOnly);
            if (!showLiveOnly) {
              setSelectedDate(new Date());
            }
          }}
          onDateChange={handleDateChange}
          allExpanded={allExpanded}
          onToggleExpandAll={() => setAllExpanded(!allExpanded)}
          selectedDate={selectedDate}
        />
      </div>

      <div>
        {isLoading ? (
          <LiveScoreSkeleton />
        ) : (
          <LeagueMatchList matches={filteredMatches} allExpanded={allExpanded} />
        )}
      </div>
    </div>
  );
}
