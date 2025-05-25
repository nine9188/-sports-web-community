// 댓글 관련 타입

export interface CommentType {
  id: string;
  user_id: string | null;
  post_id: string | null;
  content: string;
  created_at: string | null;
  updated_at?: string | null;
  parent_id?: string | null;
  likes?: number;
  dislikes?: number;
  userAction?: 'like' | 'dislike' | null;
  profiles?: {
    nickname: string | null;
    icon_id: number | null;
  } | null;
  children?: CommentType[];
} 