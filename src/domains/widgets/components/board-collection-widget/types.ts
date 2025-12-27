// 게시판 모음 위젯 타입 정의

import { Json } from '@/shared/types/supabase';

// ==================== 기존 타입 (유지) ====================

export interface BoardPost {
  id: string;
  title: string;
  board_slug: string;
  board_name: string;
  post_number: number;
  created_at: string;
  content?: string;
  author_nickname: string;
  views: number;
  likes: number;
  comment_count: number;
  category?: string | null;
  team_logo?: string | null;
  league_logo?: string | null;
}

export interface BoardInfo {
  id: string;
  name: string;
  slug: string | null;
  description?: string | null;
}

export interface BoardCollectionData {
  board: BoardInfo;
  recentPosts: BoardPost[];
  popularPosts: BoardPost[]; // deprecated - 빈 배열
  featuredImages: string[]; // deprecated - 빈 배열
}

// ==================== 새 타입 (추가) ====================

/** 위젯 설정 테이블 타입 */
export interface BoardCollectionSetting {
  board_id: string;
  display_order: number;
}

/** DB에서 조회한 게시글 원본 타입 */
export interface PostWithContent {
  id: string;
  title: string;
  post_number: number;
  created_at: string;
  content: Json;
  views: number | null;
  likes: number | null;
  board_id: string | null;
  category: string | null;
}

/** 게시판 상세 정보 (로고 조회용) */
export interface BoardInfoDetail {
  slug: string;
  name: string;
  teamId: number | null;
  leagueId: number | null;
}

/** 게시글 메타데이터 (댓글 수, 로고 등) */
export interface PostMetadata {
  commentCounts: Record<string, number>;
  boardInfos: Map<string, BoardInfoDetail>;
  teamLogos: Map<number, string>;
  leagueLogos: Map<number, string>;
}

/** 게시판 + 게시글 조합 */
export interface BoardWithPosts {
  board: BoardInfo;
  posts: PostWithContent[];
}
