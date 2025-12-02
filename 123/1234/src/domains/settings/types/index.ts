/**
 * 설정 도메인에서 사용하는 타입 정의
 */

// 경험치 내역 아이템 타입
export interface ExpHistoryItem {
  id: string;
  created_at: string | null;
  amount: number;
  reason: string;
}

// 경험치 및 레벨 정보 타입
export interface ExpLevelInfo {
  exp: number;
  level: number;
}

// 아이콘 아이템 타입
export interface IconItem {
  id: number;
  name: string;
  image_url: string;
}

// 사용자 아이템 타입
export interface UserItem {
  item_id: number;
  shop_items: IconItem;
}

/**
 * 프로필 업데이트 데이터 타입
 */
export interface ProfileUpdateData {
  nickname: string;
  full_name?: string;
  username?: string;
  icon_id?: number | null;
}

/**
 * API 응답 기본 타입 
 */
export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  totalCount?: number;
  error?: string;
  hasMore?: boolean;
}

/**
 * 설정 페이지 관련 타입 정의
 */

/**
 * 내 댓글 아이템 타입
 */
export interface MyCommentItem {
  id: string;
  content: string;
  board_id: string;
  post_id: string;
  post_title: string;
  board_name: string;
  created_at: string;
}

/**
 * 페이지네이션 파라미터 타입
 */
export interface PaginationParams {
  page: number;
  limit: number;
} 