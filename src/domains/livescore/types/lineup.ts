/**
 * 라인업 관련 공통 타입 정의
 */

// 선수 기본 정보
export interface Player {
  id: number;
  name: string;
  number: number;
  pos: string;
  grid: string | null;
  captain?: boolean;
  photo?: string;
}

// 팀 색상 정보
export interface TeamColors {
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
}

// 팀 라인업 정보
export interface TeamLineup {
  team: {
    id: number;
    name: string;
    logo: string;
    colors?: TeamColors;
  };
  formation: string;
  startXI: { player: Player }[];
  substitutes: { player: Player }[];
  coach?: {
    id: number;
    name: string;
    photo?: string;
  };
}

// 포메이션용 팀 데이터
export interface FormationTeamData {
  team: {
    id: number;
    name: string;
    colors: TeamColors;
  };
  formation: string;
  startXI: Player[];
}

// 선수 통계 관련
export interface PlayerGames {
  minutes?: number;
  number?: number;
  position?: string;
  rating?: string;
  captain?: boolean;
  substitute?: boolean;
}

export interface PlayerShots {
  total?: number;
  on?: number;
}

export interface PlayerGoals {
  total?: number;
  conceded?: number;
  assists?: number;
  saves?: number;
}

export interface PlayerPasses {
  total?: number;
  key?: number;
  accuracy?: string;
}

export interface PlayerTackles {
  total?: number;
  blocks?: number;
  interceptions?: number;
}

export interface PlayerDuels {
  total?: number;
  won?: number;
}

export interface PlayerDribbles {
  attempts?: number;
  success?: number;
  past?: number;
}

export interface PlayerFouls {
  drawn?: number;
  committed?: number;
}

export interface PlayerCards {
  yellow?: number;
  red?: number;
}

export interface PlayerPenalty {
  won?: number;
  committed?: number;
  scored?: number;
  missed?: number;
  saved?: number;
}

// 개별 선수 통계
export interface PlayerStatistics {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  games: PlayerGames;
  offsides?: number;
  shots: PlayerShots;
  goals: PlayerGoals;
  passes: PlayerPasses;
  tackles: PlayerTackles;
  duels: PlayerDuels;
  dribbles: PlayerDribbles;
  fouls: PlayerFouls;
  cards: PlayerCards;
  penalty: PlayerPenalty;
}

// 선수 통계 데이터 (API 응답 형식)
export interface PlayerStatsData {
  player: {
    id: number;
    name: string;
    photo: string;
    number?: number;
    pos?: string;
  };
  statistics: PlayerStatistics[];
}

// 전체 선수 통계 응답
export interface AllPlayerStatsResponse {
  success: boolean;
  // 전체 선수 데이터 (팀별 배열)
  allPlayersData: PlayerStatsData[];
  // 평점 맵 (선수 ID → 평점)
  ratings: Record<number, number>;
  // 주장 선수 ID 목록
  captainIds: number[];
  message?: string;
}

// 평점 + 주장 정보 (기존 호환)
export interface PlayerRatingsAndCaptains {
  ratings: Record<number, number>;
  captainIds: number[];
}
