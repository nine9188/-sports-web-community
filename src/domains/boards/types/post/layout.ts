/**
 * 레이아웃/페이지에서 사용하는 게시글 타입
 *
 * API 응답을 UI 표시용으로 변환한 타입입니다.
 * BoardDetailLayout, PostList 등에서 사용됩니다.
 */
export interface LayoutPost {
  id: string;
  title: string;
  board_id: string;
  board_name: string;
  board_slug: string;
  post_number: number;
  created_at: string;
  formattedDate: string;
  views: number;
  likes: number;
  author_nickname: string;
  author_id?: string;
  author_public_id?: string | null;
  author_icon_id?: number | null;
  author_icon_url?: string | null;
  author_level?: number;
  comment_count: number;
  content?: string;
  team_id?: number | null;
  team_name?: string | null;
  team_logo?: string | null;
  league_id?: number | null;
  league_name?: string | null;
  league_logo?: string | null;
}

/**
 * API 응답에서 받는 게시글 타입
 *
 * Supabase 쿼리 결과를 그대로 받는 타입입니다.
 * team_id, league_id가 string | number 형태일 수 있습니다.
 */
export interface ApiPost {
  id: string;
  title: string;
  board_id: string;
  board_name: string;
  board_slug: string;
  post_number: number;
  created_at: string;
  formattedDate: string;
  views?: number;
  likes?: number;
  author_nickname?: string;
  author_id?: string;
  author_public_id?: string | null;
  author_icon_id?: number | null;
  author_icon_url?: string | null;
  author_level?: number;
  comment_count?: number;
  content?: string;
  team_id?: string | number | null;
  team_name?: string | null;
  team_logo?: string | null;
  league_id?: string | number | null;
  league_name?: string | null;
  league_logo?: string | null;
}

/**
 * 인기글 타입
 */
export interface PopularPost {
  id: string;
  title: string;
  board_slug: string;
  board_name: string;
  post_number: number;
  likes: number;
  views: number;
  comment_count: number;
  author_nickname: string;
  author_id?: string;
  author_public_id?: string | null;
  author_level?: number;
  author_icon_id?: number | null;
  author_icon_url?: string | null;
  created_at: string;
  formattedDate?: string;
  team_id?: string | number | null;
  league_id?: string | number | null;
}
