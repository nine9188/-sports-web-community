'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fetchMatchesByDate, MatchData } from '../actions/footballApi';
import { getTeamById } from '../constants/teams/index';
import { getLeagueById } from '../constants/league-mappings';
import { countLiveMatches } from '../constants/match-status';
import { Match } from '../types/match';

// 기본 이미지 URL
const DEFAULT_TEAM_LOGO = 'https://cdn.sportmonks.com/images/soccer/team_placeholder.png';

// Query Keys
export const liveScoreKeys = {
  all: ['liveScore'] as const,
  matches: (date: string) => [...liveScoreKeys.all, 'matches', date] as const,
  liveCount: () => [...liveScoreKeys.all, 'liveCount'] as const,
};

// MatchData를 클라이언트 Match 타입으로 변환
function processMatches(matchesData: MatchData[]): Match[] {
  return matchesData.map((match: MatchData) => {
    const leagueInfo = match.league?.id ? getLeagueById(match.league.id) : null;
    const homeTeamInfo = match.teams?.home?.id ? getTeamById(match.teams.home.id) : null;
    const awayTeamInfo = match.teams?.away?.id ? getTeamById(match.teams.away.id) : null;

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
        name: leagueName,
        country: match.league.country,
        logo: match.league.logo || '',
        flag: match.league.flag || ''
      },
      teams: {
        home: {
          id: match.teams.home.id,
          name: homeTeamName,
          img: match.teams.home.logo || DEFAULT_TEAM_LOGO,
          score: match.goals.home,
          form: '',
          formation: ''
        },
        away: {
          id: match.teams.away.id,
          name: awayTeamName,
          img: match.teams.away.logo || DEFAULT_TEAM_LOGO,
          score: match.goals.away,
          form: '',
          formation: ''
        }
      }
    };
  });
}

// KST 기준 오늘 날짜 문자열
function getTodayKst(): string {
  const nowUtc = new Date();
  const kstNow = new Date(nowUtc.getTime() + 9 * 60 * 60 * 1000);
  return kstNow.toISOString().split('T')[0];
}

interface UseMatchesOptions {
  initialData?: Match[];
  showLiveOnly?: boolean;
}

/**
 * 특정 날짜의 경기 목록을 가져오는 훅
 *
 * - 자동 캐싱 (5분)
 * - 오늘 날짜 + LIVE 모드일 때 30초마다 자동 refetch
 * - 오늘 날짜일 때 60초마다 자동 refetch
 */
export function useMatches(date: Date, options: UseMatchesOptions = {}) {
  const { initialData, showLiveOnly = false } = options;
  const formattedDate = format(date, 'yyyy-MM-dd');
  const todayStr = getTodayKst();
  const isToday = formattedDate === todayStr;

  // 폴링 간격: LIVE 모드면 30초, 오늘이면 60초, 과거/미래면 폴링 없음
  const refetchInterval = showLiveOnly ? 30000 : isToday ? 60000 : false;

  const query = useQuery({
    queryKey: liveScoreKeys.matches(formattedDate),
    queryFn: async () => {
      const data = await fetchMatchesByDate(formattedDate);
      return processMatches(data);
    },
    initialData: initialData && formattedDate === (initialData.length > 0 ? format(new Date(initialData[0]?.time?.date || date), 'yyyy-MM-dd') : formattedDate)
      ? initialData
      : undefined,
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 30, // 30분

    // ⭐ 봇 안전: refetch 정책 최적화
    refetchOnMount: false,        // initialData 있으면 마운트 시 refetch 안 함
    refetchOnWindowFocus: false,  // 포커스 시 refetch 안 함 (폴링으로 충분)
    refetchOnReconnect: false,    // 재연결 시 refetch 안 함

    // 폴링만 활성화 (LIVE/오늘만)
    refetchInterval,
    refetchIntervalInBackground: false, // 탭이 비활성화되면 폴링 중지
  });

  // 라이브 경기 수 계산
  const liveMatchCount = query.data ? countLiveMatches(query.data) : 0;

  return {
    matches: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    liveMatchCount,
    refetch: query.refetch,
  };
}

/**
 * 오늘의 라이브 경기 수를 가져오는 훅 (다른 날짜 조회 시 사용)
 *
 * - 60초마다 자동 refetch
 */
export function useTodayLiveCount(enabled: boolean = true) {
  const todayStr = getTodayKst();

  const query = useQuery({
    queryKey: liveScoreKeys.matches(todayStr),
    queryFn: async () => {
      const data = await fetchMatchesByDate(todayStr);
      return processMatches(data);
    },
    enabled,
    staleTime: 1000 * 60, // 1분
    gcTime: 1000 * 60 * 10, // 10분
    refetchInterval: 60000, // 60초마다 갱신
    refetchIntervalInBackground: false,
  });

  return {
    liveCount: query.data ? countLiveMatches(query.data) : 0,
    isLoading: query.isLoading,
  };
}

/**
 * 인접 날짜 데이터 프리페칭 훅
 *
 * ⚠️ DEPRECATED: 서버 프리로드로 대체됨 (봇 크롤링 방지)
 * 이제 page.tsx에서 서버 컴포넌트가 3일치 데이터를 미리 로드합니다.
 */
export function usePrefetchAdjacentDates(_currentDate: Date) {
  // 서버 프리로드를 사용하므로 클라이언트 자동 프리페치 비활성화
  // 봇이 페이지 방문 시 500ms 후 자동 API 호출되는 것을 방지
}

/**
 * LiveScoreView에서 사용하는 통합 훅
 *
 * ⭐ Option 3 패턴 적용:
 * - 서버에서 3일치 데이터 프리로드
 * - 클라이언트 자동 프리페치 제거 (봇 안전)
 * - initialData 직접 전달 (useEffect 없이 동기적 처리)
 */
export function useLiveScore(
  selectedDate: Date,
  options: {
    initialYesterday?: Match[];
    initialToday?: Match[];
    initialTomorrow?: Match[];
    yesterdayDate?: string;
    initialDate?: string;
    tomorrowDate?: string;
    showLiveOnly?: boolean;
  } = {}
) {
  const {
    initialYesterday,
    initialToday,
    initialTomorrow,
    yesterdayDate,
    initialDate,
    tomorrowDate,
    showLiveOnly = false
  } = options;

  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  const todayStr = getTodayKst();
  const isToday = formattedDate === todayStr;

  // ⭐ A안 적용: 날짜별 initialData를 직접 매핑 (useEffect 불필요)
  // 첫 렌더부터 즉시 데이터 사용, 로딩 스침 없음
  const getInitialDataForDate = (dateStr: string): Match[] | undefined => {
    if (dateStr === yesterdayDate && initialYesterday) return initialYesterday;
    if (dateStr === initialDate && initialToday) return initialToday;
    if (dateStr === tomorrowDate && initialTomorrow) return initialTomorrow;
    return undefined;
  };

  // 선택된 날짜의 경기 데이터
  const {
    matches,
    isLoading,
    isFetching,
    liveMatchCount: currentDateLiveCount,
  } = useMatches(selectedDate, {
    initialData: getInitialDataForDate(formattedDate),
    showLiveOnly
  });

  // 오늘이 아닌 날짜를 볼 때만 오늘의 라이브 카운트 별도 조회
  const { liveCount: todayLiveCount } = useTodayLiveCount(!isToday);

  // 라이브 카운트: 오늘이면 현재 데이터에서, 아니면 별도 쿼리에서
  const liveMatchCount = isToday ? currentDateLiveCount : todayLiveCount;

  // ⚠️ 서버 프리로드를 사용하므로 클라이언트 자동 프리페치 제거
  // usePrefetchAdjacentDates(selectedDate); // 제거됨

  return {
    matches,
    isLoading,
    isFetching,
    liveMatchCount,
  };
}
