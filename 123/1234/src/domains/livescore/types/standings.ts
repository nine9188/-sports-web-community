// 순위 표시에 필요한 타입 정의
export interface StandingDisplay {
  league: {
    id: number;
    name: string;
    logo: string;
  };
  standings: Array<StandingItem>;
}

export interface StandingItem {
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