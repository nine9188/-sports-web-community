// 내 게시글 관련 타입 정의

/**
 * 내 게시글 아이템 타입
 */
export interface MyPostItem {
  id: number;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string | null;
  views: number;
  likes: number;
  dislikes: number;
  category: string;
  tags: string[] | null;
  board_id: string;
  board_name?: string;
  status: string | null;
  post_number: number;
}

/**
 * 데이터베이스 결과에 대한 타입 정의
 */
export interface DbPostResult {
  id: number;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string | null;
  views: number;
  likes: number;
  dislikes: number;
  category: string;
  tags: string[] | null;
  board_id: string;
  status: string | null;
  post_number: number;
  user_id: string;
  [key: string]: unknown;
} 