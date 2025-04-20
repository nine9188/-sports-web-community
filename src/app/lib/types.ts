// 게시판 타입 정의
export interface Board {
  id: string;
  name: string;
  parent_id: string | null;
  display_order: number;
  slug: string;
  team_id?: number | null;
  league_id?: number | null;
  team_logo?: string | null;
  league_logo?: string | null;
}

// 계층형 게시판 타입
export interface HierarchicalBoard extends Board {
  children?: HierarchicalBoard[];
}

// 게시판 데이터 응답 타입
export interface BoardsResponse {
  rootBoards: HierarchicalBoard[];
  boardsMap?: Record<string, HierarchicalBoard>;
  allBoards?: Board[];
}

// 사용자 및 아이콘 관련 타입 정의

// 사용자 아이콘 정보 인터페이스
export type UserIconInfo = {
  level: number;
  exp: number;
  iconId: number | null;
  isUsingLevelIcon: boolean;
  levelIconUrl: string;
  purchasedIconUrl: string | null;
  iconName: string | null;
  currentIconUrl: string;
  currentIconName: string;
};

// 사용자 데이터 인터페이스 (헤더 컴포넌트용)
export type HeaderUserData = {
  id: string;
  email: string;
  nickname?: string;
  isAdmin?: boolean;
  iconInfo: {
    iconId: number | null;
    iconUrl: string;
    iconName: string;
  };
}; 