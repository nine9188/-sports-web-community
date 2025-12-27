// 게시판 관련 타입 정의
import { BoardData, Breadcrumb, TeamData, LeagueData } from './data';

export interface Board {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  team_id: number | null;
  league_id: number | null;
  display_order: number | null;
  description: string | null;
  access_level: string | null;
  logo: string | null;
  views: number | null;
  view_type?: 'list' | 'image-table';
}

export interface BoardMap {
  [key: string]: Board;
}

export interface ChildBoardsMap {
  [key: string]: Board[];
}

export interface BoardNameMap {
  [key: string]: string;
}

// 타입 재내보내기
export type { BoardData, Breadcrumb, TeamData, LeagueData } 