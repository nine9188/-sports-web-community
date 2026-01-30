'use client';

import { useState, useEffect, useMemo } from 'react';
import NavigationBar from './NavigationBar/index';
import LeagueMatchList from './LeagueMatchList/index';
import { Match } from '../../../types/match';
import { useLiveScore } from '../../../hooks/useLiveScoreQueries';
import { isLiveMatch } from '../../../constants/match-status';

interface LiveScoreViewProps {
  initialYesterday: Match[];
  initialToday: Match[];
  initialTomorrow: Match[];
  initialDate: string;
  yesterdayDate: string;
  tomorrowDate: string;
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
  initialYesterday,
  initialToday,
  initialTomorrow,
  initialDate,
  yesterdayDate,
  tomorrowDate
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
  const { matches, isLoading, liveMatchCount } = useLiveScore(selectedDate, {
    initialYesterday,
    initialToday,
    initialTomorrow,
    yesterdayDate,
    initialDate,
    tomorrowDate,
    showLiveOnly,
  });

  // 개발 환경: 프리로드 통계 출력
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 [LiveScore] 서버 프리로드 통계:', {
        어제: initialYesterday.length,
        오늘: initialToday.length,
        내일: initialTomorrow.length,
        총: initialYesterday.length + initialToday.length + initialTomorrow.length,
      });
    }
  }, []);

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
          <div className="space-y-4">
            {/* 스켈레톤 - 여러 리그와 매치 */}
            {[1, 2, 3].map((section) => (
              <div key={section} className="bg-white dark:bg-[#1D1D1D] rounded-lg overflow-hidden border border-black/7 dark:border-0">
                {/* 리그 헤더 스켈레톤 */}
                <div className="h-12 px-4 flex items-center gap-3 bg-[#F5F5F5] dark:bg-[#262626]">
                  <div className="w-5 h-5 bg-[#F5F5F5] dark:bg-[#262626] rounded animate-pulse"></div>
                  <div className="h-4 w-32 bg-[#F5F5F5] dark:bg-[#262626] rounded animate-pulse"></div>
                </div>

                {/* 매치 카드 스켈레톤 */}
                {[1, 2, 3].map((match, idx) => (
                  <div key={match} className={`h-12 px-4 flex items-center ${idx !== 2 ? 'border-b border-black/5 dark:border-white/10' : ''}`}>
                    {/* 시간 */}
                    <div className="w-14 flex-shrink-0 flex items-center">
                      <div className="w-10 h-5 bg-[#F5F5F5] dark:bg-[#262626] rounded animate-pulse"></div>
                    </div>

                    {/* 홈팀 */}
                    <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
                      <div className="h-3 w-20 bg-[#F5F5F5] dark:bg-[#262626] rounded animate-pulse"></div>
                      <div className="w-6 h-6 bg-[#F5F5F5] dark:bg-[#262626] rounded-full animate-pulse flex-shrink-0"></div>
                    </div>

                    {/* 스코어 */}
                    <div className="px-2 flex-shrink-0">
                      <div className="w-12 h-4 bg-[#F5F5F5] dark:bg-[#262626] rounded animate-pulse"></div>
                    </div>

                    {/* 원정팀 */}
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 bg-[#F5F5F5] dark:bg-[#262626] rounded-full animate-pulse flex-shrink-0"></div>
                      <div className="h-3 w-20 bg-[#F5F5F5] dark:bg-[#262626] rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <LeagueMatchList matches={filteredMatches} allExpanded={allExpanded} />
        )}
      </div>
    </div>
  );
}
