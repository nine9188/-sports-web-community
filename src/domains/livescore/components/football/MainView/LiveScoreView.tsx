'use client';

import { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import DateSelector from './DateSelector/index';
import CalendarButton from './CalendarButton/index';
import NavigationBar from './NavigationBar/index';
import LeagueMatchList from './LeagueMatchList/index';
import { Match } from '../../../types/match';
import { fetchMatchesByDate, MatchData } from '../../../actions/footballApi';
import { getTeamById } from '../../../constants/teams/index';
import { getLeagueById } from '../../../constants/league-mappings';

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
            name: match.status.name
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

  return (
    <div className="min-h-screen bg-white space-y-4">
      <div className="rounded-lg border border-gray-200 overflow-hidden mt-4 md:mt-0">
        <div className="flex w-full items-center h-[60px]">
          <div className="flex flex-1">
            <DateSelector selectedDate={selectedDate} onDateChange={handleDateChange} />
          </div>
          <div className="border-l border-gray-200">
            <CalendarButton onDateChange={handleDateChange} />
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
        />
      </div>
        
      <div>
        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <LeagueMatchList matches={filteredMatches} />
        )}
      </div>
    </div>
  );
} 