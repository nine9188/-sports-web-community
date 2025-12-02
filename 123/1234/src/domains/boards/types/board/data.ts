// 게시판 데이터 관련 타입

export interface BoardData {
  team_id: number | null;
  league_id: number | null;
  slug: string | null;
}

export interface Breadcrumb {
  id: string;
  name: string;
  slug: string;
}

export interface TeamData {
  team: {
    id: number;
    name: string;
    country: string;
    founded: number;
    logo: string;
  };
  venue: {
    name: string;
    city: string;
    capacity: number;
  };
}

export interface LeagueData {
  id: number;
  name: string;
  country: string;
  logo: string;
  type: string;
} 