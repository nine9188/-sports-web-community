// 게시판 관련 타입 정의
export interface Board {
  id: string;
  name: string;
  slug?: string;
  parent_id?: string | null;
  team_id?: number | null;
  league_id?: number | null;
  parent?: Board;
  display_order?: number;
}

// HoverMenu 컴포넌트 관련 타입
export interface ChildBoard {
  id: string;
  name: string;
  display_order: number;
  slug?: string;
}

export interface TopBoard {
  id: string;
  name: string;
  display_order: number;
  slug?: string;
}

export interface TeamInfo {
  name: string;
  logo: string;
}

export interface LeagueInfo {
  name: string;
  logo: string;
}

export interface BoardData {
  team_id: number | null;
  league_id: number | null;
  slug: string;
}

// 브레드크럼 타입
export interface Breadcrumb {
  id: string;
  name: string;
  slug: string;
} 