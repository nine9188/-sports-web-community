// 사이드바 관련 타입 정의
import { ReactNode } from 'react';

// 계층형 게시판 구조 타입
export interface HierarchicalBoard {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  display_order: number;
  team_id: number | null;
  league_id: number | null;
  children: HierarchicalBoard[];
}

// 프로필 데이터 타입
export interface ProfileData {
  id?: string;
  username?: string;
  email?: string;
  nickname?: string;
  full_name?: string;
  avatar_url?: string;
  level?: number;
  exp?: number;
  points?: number;
  created_at?: string;
  updated_at?: string;
  postCount?: number;
  commentCount?: number;
  icon_id?: number | null;
  icon_url?: string | null;
}

// 게시판 내비게이션 초기 데이터 타입
export interface BoardNavigationData {
  rootBoards: HierarchicalBoard[];
}

// 리그 데이터 타입
export interface League {
  id: string;
  name: string;
  fullName: string;
  apiId?: number;
}

// 축구 팀 데이터 타입
export interface Team {
  team_id: number;
  name: string;
  logo: string;
}

// 리그 순위 데이터 타입
export interface StandingsData {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
  };
  standings: Array<{
    rank: number;
    team: Team;
    points: number;
    goalsDiff: number;
    all: {
      played: number;
      win: number;
      draw: number;
      lose: number;
    };
  }[]>;
}

// 사이드바 컴포넌트 공통 props
export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
  leagueStandingsComponent?: ReactNode;
  authSection?: ReactNode;
}

// 인기글 게시물 타입 정의
export interface TopicPost {
  id: string;
  title: string;
  created_at: string;
  board_id: string;
  board_name: string;
  board_slug: string;
  post_number: number;
  comment_count: number;
  views: number;
  likes: number;
  team_id: number | null;
  league_id: number | null;
  team_logo: string | null;
  league_logo: string | null;
  content?: string;
}

// 인기글 데이터 타입 (탭별 분류)
export interface TopicPostsData {
  views: TopicPost[];
  likes: TopicPost[];
  comments: TopicPost[];
}

// 탭 타입 정의
export type TabType = 'views' | 'likes' | 'comments'; 