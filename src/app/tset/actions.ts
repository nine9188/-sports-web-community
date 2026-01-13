'use server';

import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi';

// API-Football Predictions 응답 타입
export interface PredictionApiResponse {
  get: string;
  parameters: {
    fixture: string;
  };
  errors: unknown[];
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: PredictionData[];
}

export interface PredictionData {
  predictions: {
    winner: {
      id: number | null;
      name: string | null;
      comment: string | null;
    };
    win_or_draw: boolean;
    under_over: string | null;
    goals: {
      home: string;
      away: string;
    };
    advice: string | null;
    percent: {
      home: string;
      draw: string;
      away: string;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
  };
  teams: {
    home: TeamStats;
    away: TeamStats;
  };
  comparison: {
    form: ComparisonValue;
    att: ComparisonValue;
    def: ComparisonValue;
    poisson_distribution: ComparisonValue;
    h2h: ComparisonValue;
    goals: ComparisonValue;
    total: ComparisonValue;
  };
  h2h: H2HMatch[];
}

export interface TeamStats {
  id: number;
  name: string;
  logo: string;
  last_5: {
    form: string;
    att: string;
    def: string;
    goals: {
      for: { total: number; average: number };
      against: { total: number; average: number };
    };
  };
  league: {
    form: string;
    fixtures: {
      played: { home: number; away: number; total: number };
      wins: { home: number; away: number; total: number };
      draws: { home: number; away: number; total: number };
      loses: { home: number; away: number; total: number };
    };
    goals: {
      for: {
        total: { home: number; away: number; total: number };
        average: { home: string; away: string; total: string };
      };
      against: {
        total: { home: number; away: number; total: number };
        average: { home: string; away: string; total: string };
      };
    };
    biggest: {
      streak: { wins: number; draws: number; loses: number };
      wins: { home: string | null; away: string | null };
      loses: { home: string | null; away: string | null };
      goals: {
        for: { home: number; away: number };
        against: { home: number; away: number };
      };
    };
    clean_sheet: { home: number; away: number; total: number };
    failed_to_score: { home: number; away: number; total: number };
  };
}

export interface ComparisonValue {
  home: string;
  away: string;
}

export interface H2HMatch {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;
    timestamp: number;
    periods: { first: number; second: number };
    venue: { id: number | null; name: string; city: string | null };
    status: { long: string; short: string; elapsed: number; extra: unknown };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
    round: string;
  };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number; away: number };
  score: {
    halftime: { home: number; away: number };
    fulltime: { home: number; away: number };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
}

/**
 * Predictions API 테스트용 함수
 * fixture ID로 예측 데이터를 가져옴
 */
export async function fetchPredictions(fixtureId: string): Promise<{
  success: boolean;
  data: PredictionApiResponse | null;
  error: string | null;
  rawResponse?: unknown;
}> {
  try {
    if (!fixtureId || fixtureId.trim() === '') {
      return {
        success: false,
        data: null,
        error: 'Fixture ID가 필요합니다.'
      };
    }

    const response = await fetchFromFootballApi('predictions', {
      fixture: fixtureId
    });

    return {
      success: true,
      data: response as PredictionApiResponse,
      error: null,
      rawResponse: response
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    };
  }
}

/**
 * 경기 상세 정보 (fixture 기본 정보)
 */
export async function fetchFixtureDetail(fixtureId: string): Promise<{
  success: boolean;
  data: any;
  error: string | null;
}> {
  try {
    const response = await fetchFromFootballApi('fixtures', {
      id: fixtureId
    });
    return { success: true, data: response, error: null };
  } catch (error) {
    return { success: false, data: null, error: error instanceof Error ? error.message : '오류 발생' };
  }
}

/**
 * 경기 이벤트 (골, 카드, 교체 등)
 */
export async function fetchFixtureEvents(fixtureId: string): Promise<{
  success: boolean;
  data: any;
  error: string | null;
}> {
  try {
    const response = await fetchFromFootballApi('fixtures/events', {
      fixture: fixtureId
    });
    return { success: true, data: response, error: null };
  } catch (error) {
    return { success: false, data: null, error: error instanceof Error ? error.message : '오류 발생' };
  }
}

/**
 * 경기 라인업
 */
export async function fetchFixtureLineups(fixtureId: string): Promise<{
  success: boolean;
  data: any;
  error: string | null;
}> {
  try {
    const response = await fetchFromFootballApi('fixtures/lineups', {
      fixture: fixtureId
    });
    return { success: true, data: response, error: null };
  } catch (error) {
    return { success: false, data: null, error: error instanceof Error ? error.message : '오류 발생' };
  }
}

/**
 * 경기 통계
 */
export async function fetchFixtureStatistics(fixtureId: string): Promise<{
  success: boolean;
  data: any;
  error: string | null;
}> {
  try {
    const response = await fetchFromFootballApi('fixtures/statistics', {
      fixture: fixtureId
    });
    return { success: true, data: response, error: null };
  } catch (error) {
    return { success: false, data: null, error: error instanceof Error ? error.message : '오류 발생' };
  }
}

/**
 * 리그 순위
 */
export async function fetchStandings(leagueId: number, season: number): Promise<{
  success: boolean;
  data: any;
  error: string | null;
}> {
  try {
    const response = await fetchFromFootballApi('standings', {
      league: leagueId,
      season: season
    });
    return { success: true, data: response, error: null };
  } catch (error) {
    return { success: false, data: null, error: error instanceof Error ? error.message : '오류 발생' };
  }
}

/**
 * 경기 전체 데이터 한번에 가져오기
 */
export async function fetchAllFixtureData(fixtureId: string): Promise<{
  fixture: any;
  events: any;
  lineups: any;
  statistics: any;
  predictions: any;
}> {
  const [fixture, events, lineups, statistics, predictions] = await Promise.all([
    fetchFixtureDetail(fixtureId),
    fetchFixtureEvents(fixtureId),
    fetchFixtureLineups(fixtureId),
    fetchFixtureStatistics(fixtureId),
    fetchPredictions(fixtureId),
  ]);

  return {
    fixture: fixture.data,
    events: events.data,
    lineups: lineups.data,
    statistics: statistics.data,
    predictions: predictions.data,
  };
}

/**
 * 오늘 경기 목록에서 fixture ID 가져오기
 */
export async function fetchTodayFixtures(): Promise<{
  success: boolean;
  fixtures: Array<{
    id: number;
    home: string;
    away: string;
    league: string;
    date: string;
    status: string;
  }>;
  error: string | null;
}> {
  try {
    // KST 기준 오늘 날짜
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    const today = kstDate.toISOString().split('T')[0];

    const response = await fetchFromFootballApi('fixtures', {
      date: today
    });

    if (!response?.response) {
      return { success: false, fixtures: [], error: '데이터가 없습니다.' };
    }

    // 주요 리그만 필터링 (Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Champions League, etc.)
    const majorLeagues = [39, 140, 78, 135, 61, 2, 3, 292];

    const fixtures = response.response
      .filter((match: { league?: { id?: number } }) =>
        majorLeagues.includes(match.league?.id || 0)
      )
      .slice(0, 20) // 상위 20개만
      .map((match: {
        fixture?: { id?: number; date?: string; status?: { short?: string } };
        teams?: { home?: { name?: string }; away?: { name?: string } };
        league?: { name?: string };
      }) => ({
        id: match.fixture?.id || 0,
        home: match.teams?.home?.name || '',
        away: match.teams?.away?.name || '',
        league: match.league?.name || '',
        date: match.fixture?.date || '',
        status: match.fixture?.status?.short || ''
      }));

    return {
      success: true,
      fixtures,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      fixtures: [],
      error: error instanceof Error ? error.message : '오류 발생'
    };
  }
}
