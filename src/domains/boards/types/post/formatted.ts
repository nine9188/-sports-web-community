// 포맷팅된 게시글 타입 정의

export interface FormattedPost {
  id: string;
  title: string;
  author: string;
  author_id?: string;
  author_level?: number;
  author_icon_id?: number | null;
  author_icon_url?: string | null;
  created_at: string;
  formattedDate: string; // 서버에서 포맷된 날짜
  views: number;
  likes: number;
  commentCount: number;
  boardId: string;
  boardName: string;
  boardSlug: string;
  postNumber: number;
  team?: {
    id: number;
    name: string;
    logo: string;
  } | null;
  league?: {
    id: number;
    name: string;
    logo: string;
  } | null;
} 