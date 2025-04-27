import { TeamStats } from '@/app/actions/livescore/teams/team';
import { Standing } from '@/app/actions/livescore/teams/standings';

// Overview 컴포넌트에 필요한 데이터 타입
export interface OverviewStatsType {
  league?: {
    name: string;
    country: string;
    logo: string;
    season: number;
  };
  fixtures?: {
    wins: { total: number };
    draws: { total: number };
    loses: { total: number };
  };
  goals?: {
    for: {
      total: { home: number; away: number; total: number };
      average: { home: string; away: string; total: string };
      minute: Record<string, { total: number; percentage: string }>;
    };
    against: {
      total: { home: number; away: number; total: number };
      average: { home: string; away: string; total: string };
      minute: Record<string, { total: number; percentage: string }>;
    };
  };
  clean_sheet?: { total: number };
  form?: string;
}

// Stats 컴포넌트에 필요한 데이터 타입
export interface StatsComponentType {
  league?: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
  };
  fixtures?: {
    played: { home: number; away: number; total: number };
    wins: { home: number; away: number; total: number };
    draws: { home: number; away: number; total: number };
    loses: { home: number; away: number; total: number };
  };
  goals?: {
    for: { 
      total: { total: number; home: number; away: number };
      average: { total: string; home: string; away: string };
      minute: Record<string, { total: number | null; percentage: string | null }>;
    };
    against: { 
      total: { total: number; home: number; away: number };
      average: { total: string; home: string; away: string };
      minute: Record<string, { total: number | null; percentage: string | null }>;
    };
  };
  clean_sheet?: { total: number; home: number; away: number };
  form?: string;
  lineups?: Array<{ formation: string; played: number }>;
  cards?: {
    yellow: Record<string, { total: number; percentage: string }>;
    red: Record<string, { total: number; percentage: string }>;
  };
  penalty?: {
    total: number;
    scored: { total: number; percentage: string };
    missed: { total: number; percentage: string };
  };
  failed_to_score?: {
    home: number;
    away: number;
    total: number;
  };
  biggest?: {
    streak: { wins: number; draws: number; loses: number };
    wins: { home: string; away: string };
    loses: { home: string; away: string };
  };
}

// StandingDisplay 인터페이스 - Overview 컴포넌트와 호환
export interface StandingDisplay {
  league: {
    id: number;
    name: string;
    logo: string;
    country?: string;
    flag?: string;
  };
  standings: Array<{
    rank: number;
    team: {
      id: number;
      name: string;
      logo: string;
    };
    all: {
      played: number;
      win: number;
      draw: number;
      lose: number;
      goals: {
        for: number;
        against: number;
      };
    };
    goalsDiff: number;
    points: number;
    form: string;
    description?: string;
  }>;
}

// Standing 항목 타입
interface StandingItem {
  rank: number;
  team: {
    id: number;
    name: string;
    logo: string;
  };
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  goalsDiff: number;
  points: number;
  form: string;
  description?: string;
}

// TeamStats를 Overview 컴포넌트 형식으로 변환
export function convertTeamStatsForOverview(stats?: TeamStats): OverviewStatsType {
  if (!stats) return {};
  
  return {
    league: stats.league,
    fixtures: {
      wins: { total: stats.fixtures?.wins?.total || 0 },
      draws: { total: stats.fixtures?.draws?.total || 0 },
      loses: { total: stats.fixtures?.loses?.total || 0 }
    },
    goals: {
      for: {
        total: stats.goals?.for?.total || { home: 0, away: 0, total: 0 },
        average: stats.goals?.for?.average || { home: '0', away: '0', total: '0' },
        minute: stats.goals?.for?.minute ? 
          // null 값을 number로 변환
          Object.fromEntries(
            Object.entries(stats.goals.for.minute).map(([key, value]) => [
              key, 
              { 
                total: value.total ?? 0, 
                percentage: value.percentage ?? '0%' 
              }
            ])
          ) : {}
      },
      against: {
        total: stats.goals?.against?.total || { home: 0, away: 0, total: 0 },
        average: stats.goals?.against?.average || { home: '0', away: '0', total: '0' },
        minute: stats.goals?.against?.minute ? 
          Object.fromEntries(
            Object.entries(stats.goals.against.minute).map(([key, value]) => [
              key, 
              { 
                total: value.total ?? 0, 
                percentage: value.percentage ?? '0%' 
              }
            ])
          ) : {}
      }
    },
    clean_sheet: { 
      total: stats.clean_sheet?.total || 0 
    },
    form: stats.form
  };
}

// TeamStats를 Stats 컴포넌트 형식으로 변환
export function convertTeamStatsForStatsComponent(stats?: TeamStats): StatsComponentType {
  if (!stats) return {};
  
  return {
    league: stats.league,
    fixtures: stats.fixtures,
    goals: {
      for: {
        total: stats.goals?.for?.total || { total: 0, home: 0, away: 0 },
        average: stats.goals?.for?.average || { total: '0', home: '0', away: '0' },
        minute: stats.goals?.for?.minute || {}
      },
      against: {
        total: stats.goals?.against?.total || { total: 0, home: 0, away: 0 },
        average: stats.goals?.against?.average || { total: '0', home: '0', away: '0' },
        minute: stats.goals?.against?.minute || {}
      }
    },
    clean_sheet: stats.clean_sheet,
    form: stats.form,
    lineups: stats.lineups,
    cards: stats.cards,
    penalty: stats.penalty,
    failed_to_score: stats.failed_to_score,
    biggest: stats.biggest
  };
}

// Standing 데이터를 Standings 컴포넌트가 필요한 형식으로 변환
export function convertStandingsData(standings?: Standing[]): StandingDisplay[] {
  if (!standings || !Array.isArray(standings)) return [];
  
  return standings.map(standing => {
    if (!standing.league) return null;

    try {
      // standings 데이터 추출 및 변환
      let flattenedStandings: Array<StandingItem> = [];
      
      // 중첩 배열을 처리 (standings가 그룹으로 나뉨)
      if (Array.isArray(standing.league.standings)) {
        // standings가 이미 2차원 배열인 경우
        if (Array.isArray(standing.league.standings[0])) {
          // 모든 그룹을 하나의 배열로 평탄화
          const groups: unknown[][] = standing.league.standings as unknown as unknown[][];
          const flatItems: unknown[] = [];
          
          // 중첩된 배열을 직접 평탄화
          for (const group of groups) {
            if (Array.isArray(group)) {
              for (const item of group) {
                flatItems.push(item);
              }
            }
          }
          
          // 각 항목을 StandingItem 형태로 변환
          flattenedStandings = flatItems.map(item => {
            const standingItem = item as {
              rank: number;
              team: { id: number; name: string; logo: string };
              all: { 
                played: number; 
                win: number; 
                draw: number; 
                lose: number; 
                goals: { for: number; against: number } 
              };
              goalsDiff: number;
              points: number;
              form: string;
              description?: string;
            };
            
            return standingItem;
          });
        } else {
          // 단일 배열인 경우 (그룹이 하나)
          flattenedStandings = standing.league.standings as unknown as StandingItem[];
        }
      }
      
      return {
        league: {
          id: standing.league.id,
          name: standing.league.name,
          logo: standing.league.logo,
          country: standing.league.country,
          flag: standing.league.flag
        },
        standings: flattenedStandings
      };
    } catch (error) {
      console.error("Standing 데이터 변환 에러:", error);
      // 에러 발생시 빈 standings 반환
      return {
        league: {
          id: standing.league.id,
          name: standing.league.name,
          logo: standing.league.logo,
          country: standing.league.country,
          flag: standing.league.flag
        },
        standings: []
      };
    }
  }).filter(Boolean) as StandingDisplay[];
} 