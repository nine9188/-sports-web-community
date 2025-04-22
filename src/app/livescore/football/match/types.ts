// 경기 상세 페이지의 탭 타입을 정의합니다
export type TabType = 'events' | 'lineups' | 'stats' | 'standings';

// 매치 이벤트 타입 정의
export interface MatchEvent {
  time: {
    elapsed: number;
    extra?: number | null;
  };
  team: {
    id: number;
    name: string;
    logo: string;
  };
  player: {
    id: number;
    name: string;
  };
  assist?: {
    id: number | null;
    name: string | null;
  };
  type: string;
  detail: string;
  comments?: string | null;
}

// 팀 정보 타입 정의
export interface Team {
  id: number;
  name: string;
  logo: string;
  formation?: string;
}

// 팀 라인업 타입
export interface TeamLineup {
  team: {
    id: number;
    name: string;
    logo: string;
    colors: {
      player: {
        primary: string;
        number: string;
        border: string;
      };
      goalkeeper: {
        primary: string;
        number: string;
        border: string;
      };
    };
  };
  formation: string;
  startXI: Array<{
    player: {
      id: number;
      name: string;
      number: number;
      pos: string;
      grid: string;
      captain?: boolean;
      photo?: string;
    };
  }>;
  substitutes: Array<{
    player: {
      id: number;
      name: string;
      number: number;
      pos: string;
      grid: string;
      captain?: boolean;
      photo?: string;
    };
  }>;
  coach: {
    id: number;
    name: string;
    photo: string;
  };
}

// 팀 통계 타입
export interface TeamStats {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  statistics: Array<{
    type: string;
    value: number | string | null;
  }>;
} 