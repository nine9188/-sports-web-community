// 댓글 관련 타입 정의
export interface CommentType {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  post_id: string;
  likes?: number;
  dislikes?: number;
  userAction?: 'like' | 'dislike' | null;
  profiles: {
    nickname: string | null;
    id?: string;
    icon_id?: number | null;
    icon_url?: string | null;
  };
  depth?: number;
  parent_id?: string | null;
  children?: CommentType[];
} 