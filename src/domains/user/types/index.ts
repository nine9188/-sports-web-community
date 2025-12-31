/**
 * 유저 도메인 타입 정의
 */

/**
 * 공개 프로필 정보
 */
export interface PublicProfile {
  id: string;
  public_id: string;
  nickname: string;
  masked_id: string;
  icon_id: number | null;
  icon_url: string | null;
  level: number;
  exp: number;
  created_at: string;
  post_count: number;
  comment_count: number;
  visit_count: number;
}

/**
 * 유저 게시글 아이템
 */
export interface UserPostItem {
  id: string;
  title: string;
  content: string | null;
  created_at: string;
  views: number;
  likes: number;
  board_id: string;
  board_name: string;
  board_slug: string;
  post_number: number;
}

/**
 * 유저 댓글 아이템
 */
export interface UserCommentItem {
  id: string;
  content: string;
  created_at: string;
  post_id: string;
  post_title: string;
  post_number: number;
  board_slug: string;
  board_name: string;
}

/**
 * 페이지네이션 파라미터
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * API 응답 타입
 */
export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  totalCount?: number;
  error?: string;
  hasMore?: boolean;
}
