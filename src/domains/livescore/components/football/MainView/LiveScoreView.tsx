'use client';

import { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import NavigationBar from './NavigationBar/index';
import LeagueMatchList from './LeagueMatchList/index';
import { Match } from '../../../types/match';
import { fetchMatchesByDate, MatchData } from '../../../actions/footballApi';
import { getTeamById } from '../../../constants/teams/index';
import { getLeagueById } from '../../../constants/league-mappings';
import { isLiveMatch, countLiveMatches } from '../../../constants/match-status';

// 기본 이미지 URL - 로고가 없을 때 사용
const DEFAULT_TEAM_LOGO = 'https://cdn.sportmonks.com/images/soccer/team_placeholder.png';

interface LiveScoreViewProps {
  initialMatches: Match[];
  initialDate: string;
}

export default function LiveScoreView({
  initialMatches,
  initialDate
}: LiveScoreViewProps) {
  // 날짜 상태 초기화
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    return initialDate ? new Date(initialDate) : new Date();
  });
  
  // 초기 매치 데이터로 상태 초기화
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showLiveOnly, setShowLiveOnly] = useState(false);
  const [liveMatchCount, setLiveMatchCount] = useState(0);
  const [allExpanded, setAllExpanded] = useState(true);

  // 컴포넌트 마운트 시 실시간 경기 수 계산
  useEffect(() => {
    setLiveMatchCount(countLiveMatches(initialMatches));
  }, [initialMatches]);

  // 오늘이 아닌 날짜를 볼 때만 라이브 경기 수 폴링 (60초 간격)
  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const selected = format(selectedDate, 'yyyy-MM-dd');

    // 오늘 날짜를 보고 있으면 fetchMatches에서 업데이트하므로 폴링 불필요
    if (today === selected) {
      return;
    }

    const fetchTodayLiveCount = async () => {
      try {
        const todayMatches = await fetchMatchesByDate(today);
        setLiveMatchCount(countLiveMatches(todayMatches));
      } catch (error) {
        console.error('라이브 경기 수 업데이트 실패:', error);
      }
    };

    // 즉시 실행
    fetchTodayLiveCount();

    // 60초마다 라이브 경기 수 업데이트
    const intervalId = setInterval(fetchTodayLiveCount, 60000);

    return () => clearInterval(intervalId);
  }, [selectedDate]);

  // 날짜 변경 시 Server Action 호출
  const fetchMatches = useCallback(async (date: Date, keepPreviousData = false) => {
    // 이전 데이터 유지 옵션이 false일 때만 로딩 표시
    if (!keepPreviousData) {
      setLoading(true);
    }

    try {
      const formattedDate = format(date, 'yyyy-MM-dd');

      // Server Action 직접 호출
      const matchesData = await fetchMatchesByDate(formattedDate);
      
      // MatchData를 클라이언트 Match 타입으로 변환 (+ 팀/리그 정보 매핑)
      const processedMatches: Match[] = matchesData.map((match: MatchData) => {
        // 한국어 팀명과 리그명 매핑
        const leagueInfo = match.league?.id ? getLeagueById(match.league.id) : null;
        const homeTeamInfo = match.teams?.home?.id ? getTeamById(match.teams.home.id) : null;
        const awayTeamInfo = match.teams?.away?.id ? getTeamById(match.teams.away.id) : null;
        
        // 매핑된 정보 사용 (있는 경우)
        const homeTeamName = homeTeamInfo?.name_ko || match.teams.home.name;
        const awayTeamName = awayTeamInfo?.name_ko || match.teams.away.name;
        const leagueName = leagueInfo?.nameKo || match.league.name;
        
        return {
          id: match.id,
          status: {
            code: match.status.code,
            name: match.status.name,
            elapsed: match.status.elapsed
          },
          time: {
            date: match.time.date,
            time: match.time.timestamp
          },
          league: {
            id: match.league.id,
            name: leagueName, // 매핑된 리그 이름 사용
            country: match.league.country,
            logo: match.league.logo || '',
            flag: match.league.flag || ''
          },
          teams: {
            home: {
              id: match.teams.home.id,
              name: homeTeamName, // 매핑된 팀 이름 사용
              img: match.teams.home.logo || DEFAULT_TEAM_LOGO,
              score: match.goals.home,
              form: '',
              formation: ''
            },
            away: {
              id: match.teams.away.id,
              name: awayTeamName, // 매핑된 팀 이름 사용
              img: match.teams.away.logo || DEFAULT_TEAM_LOGO,
              score: match.goals.away,
              form: '',
              formation: ''
            }
          }
        };
      });
      
      setMatches(processedMatches);

      // 오늘 날짜를 조회한 경우 라이브 카운트도 업데이트
      const today = format(new Date(), 'yyyy-MM-dd');
      if (formattedDate === today) {
        setLiveMatchCount(countLiveMatches(processedMatches));
      }
    } catch (error) {
      console.error('경기 데이터 불러오기 오류:', error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // KST 자정 롤오버: 자정(KST) 도달 시 자동으로 오늘로 갱신
  useEffect(() => {
    const scheduleNextKstMidnight = () => {
      const nowUtc = new Date();
      const kstNow = new Date(nowUtc.getTime() + 9 * 60 * 60 * 1000);
      const nextKstMidnight = new Date(kstNow);
      nextKstMidnight.setHours(24, 0, 0, 0); // KST 기준 다음 자정
      const msUntilNext = nextKstMidnight.getTime() - kstNow.getTime();

      const timeoutId = setTimeout(() => {
        // 자정 도달 시 오늘 날짜로 변경 (로컬 now 사용, 포맷은 하위에서 처리)
        setSelectedDate(new Date());
        // 다음 날 자정 다시 예약
        scheduleNextKstMidnight();
      }, msUntilNext);

      return timeoutId;
    };

    const id = scheduleNextKstMidnight();
    return () => {
      clearTimeout(id);
    };
  }, []);

  // 날짜가 변경될 때 데이터 다시 불러오기 (개선된 버전)
  useEffect(() => {
    // 날짜가 변경되었을 때마다 항상 fetchMatches 호출 (이전 데이터 유지하면서 백그라운드 업데이트)
    fetchMatches(selectedDate, true);

  }, [selectedDate, fetchMatches, initialDate]);

  // 인접 날짜 데이터 프리페칭 (백그라운드에서 미리 로드)
  useEffect(() => {
    const prefetchAdjacentDates = async () => {
      const yesterday = new Date(selectedDate);
      yesterday.setDate(yesterday.getDate() - 1);

      const tomorrow = new Date(selectedDate);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // 백그라운드에서 어제/내일 데이터 캐시에 미리 로드
      Promise.all([
        fetchMatchesByDate(format(yesterday, 'yyyy-MM-dd')),
        fetchMatchesByDate(format(tomorrow, 'yyyy-MM-dd'))
      ]).catch(() => {
        // 프리페칭 실패는 무시 (사용자 경험에 영향 없음)
      });
    };

    // 현재 날짜 데이터 로드 완료 후 인접 날짜 프리페칭
    const timer = setTimeout(prefetchAdjacentDates, 500);
    return () => clearTimeout(timer);
  }, [selectedDate]);

  // 필터링된 매치 목록
  const filteredMatches = matches.filter(match => {
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
        {loading ? (
          <div className="space-y-4">
            {/* 스켈레톤 - 여러 리그와 매치 */}
            {[1, 2, 3].map((section) => (
              <div key={section} className="bg-white dark:bg-[#1D1D1D] rounded-lg overflow-hidden border border-black/7 dark:border-0">
                {/* 리그 헤더 스켈레톤 */}
                <div className="h-12 px-4 flex items-center gap-3 bg-[#F5F5F5] dark:bg-[#262626]">
                  <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>

                {/* 매치 카드 스켈레톤 */}
                {[1, 2, 3].map((match, idx) => (
                  <div key={match} className={`h-12 px-4 flex items-center ${idx !== 2 ? 'border-b border-black/5 dark:border-white/10' : ''}`}>
                    {/* 시간 */}
                    <div className="w-14 flex-shrink-0 flex items-center">
                      <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>

                    {/* 홈팀 */}
                    <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
                      <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse flex-shrink-0"></div>
                    </div>

                    {/* 스코어 */}
                    <div className="px-2 flex-shrink-0">
                      <div className="w-12 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>

                    {/* 원정팀 */}
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse flex-shrink-0"></div>
                      <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
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