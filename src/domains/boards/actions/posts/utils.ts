// 기본 응답 인터페이스
export interface PostActionResponse {
  success: boolean;
  error?: string;
  postId?: string;
  postNumber?: number;
  boardSlug?: string;
}

export interface LikeActionResponse {
  success: boolean;
  likes?: number;
  dislikes?: number;
  userAction?: 'like' | 'dislike' | null;
  error?: string;
}
