'use client';

import { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import DateSelector from './DateSelector/index';
import NavigationBar from './NavigationBar/index';
import LeagueMatchList from './LeagueMatchList/index';
import { Match } from '../../../types/match';
import { fetchMatchesByDate, MatchData } from '../../../actions/footballApi';
import { getTeamById } from '../../../constants/teams/index';
import { getLeagueById } from '../../../constants/league-mappings';
import { fetchMonthMatchDates } from './actions';

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
  const [allMatchDates, setAllMatchDates] = useState<Date[]>([]); // 모든 경기 날짜 저장

  // 전체 경기 데이터에서 현재 진행 중인 경기 수를 계산
  const calculateLiveMatchCount = (matches: Match[]) => {
    return matches.filter(match => 
      match.status.code === 'LIVE' || 
      match.status.code === 'IN_PLAY' || 
      match.status.code === '1H' || 
      match.status.code === '2H' || 
      match.status.code === 'HT'
    ).length;
  };

  // 컴포넌트 마운트 시 실시간 경기 수 계산
  useEffect(() => {
    setLiveMatchCount(calculateLiveMatchCount(initialMatches));
  }, [initialMatches]);

  // 현재 월 경기 날짜 로드
  useEffect(() => {
    const loadCurrentMonth = async () => {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();

      try {
        // 현재 달만 로드
        const currentMonthDates = await fetchMonthMatchDates(year, month);

        // Date 객체로 변환
        const matchDates = currentMonthDates.map(dateStr => {
          const date = new Date(dateStr);
          date.setHours(0, 0, 0, 0);
          return date;
        });

        setAllMatchDates(matchDates);
      } catch (error) {
        console.error('Failed to load month match dates:', error);
        setAllMatchDates([]);
      }
    };

    loadCurrentMonth();
  }, [selectedDate]);

  // 날짜 변경 시 Server Action 호출
  const fetchMatches = useCallback(async (date: Date) => {
    setLoading(true);
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
      setLiveMatchCount(calculateLiveMatchCount(processedMatches));
    } catch (error) {
      console.error('경기 데이터 불러오기 오류:', error);
      setMatches([]);
      setLiveMatchCount(0);
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
      clearTimeout(id as unknown as number);
    };
  }, []);

  // 날짜가 변경될 때 데이터 다시 불러오기 (개선된 버전)
  useEffect(() => {
    // 날짜가 변경되었을 때마다 항상 fetchMatches 호출
    fetchMatches(selectedDate);
    
  }, [selectedDate, fetchMatches, initialDate]);

  // 실시간 경기만 보기 토글 시 현재 날짜로 설정
  useEffect(() => {
    if (showLiveOnly) {
      fetchMatches(new Date());
    }
  }, [showLiveOnly, fetchMatches]);

  // 필터링된 매치 목록
  const filteredMatches = matches.filter(match => {
    // LIVE 필터
    if (showLiveOnly) {
      const isLive = match.status.code === 'LIVE' || 
                    match.status.code === 'IN_PLAY' || 
                    match.status.code === '1H' || 
                    match.status.code === '2H' || 
                    match.status.code === 'HT';
      if (!isLive) return false;
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

  // 경기가 있는 날짜 목록: allMatchDates 사용 (한 달 전체)
  const datesWithMatches = allMatchDates;

  // CalendarButton에서 월 변경 시 호출
  const handleMonthChange = useCallback((year: number, month: number) => {
    setSelectedDate(new Date(year, month, 1));
  }, []);

  return (
    <div className="min-h-screen bg-white space-y-4">
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex w-full items-stretch h-auto">
          <div className="flex flex-1">
            <DateSelector
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              datesWithMatches={datesWithMatches}
            />
          </div>
        </div>
      </div>

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
          datesWithMatches={datesWithMatches}
          onMonthChange={handleMonthChange}
        />
      </div>
        
      <div>
        {loading ? (
          <div className="space-y-4">
            {/* 스켈레톤 - 리그 섹션 */}
            {[1, 2, 3].map((section) => (
              <div key={section} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* 리그 헤더 스켈레톤 */}
                <div className="bg-gray-50 px-4 py-3 flex items-center gap-3 border-b border-gray-200">
                  <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>

                {/* 매치 카드 스켈레톤 */}
                {[1, 2, 3].map((match) => (
                  <div key={match} className="px-4 py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center gap-4">
                      {/* 시간 */}
                      <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>

                      {/* 홈팀 */}
                      <div className="flex-1 flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="h-4 flex-1 bg-gray-200 rounded animate-pulse"></div>
                      </div>

                      {/* 스코어 */}
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                      </div>

                      {/* 원정팀 */}
                      <div className="flex-1 flex items-center gap-2 justify-end">
                        <div className="h-4 flex-1 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <LeagueMatchList matches={filteredMatches} />
        )}
      </div>
    </div>
  );
} 