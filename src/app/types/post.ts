// 게시글 관련 타입 정의
export interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  views: number;
  likes: number;
  dislikes: number;
  user_id: string;
  files?: FileData[];
  board?: {
    name: string;
    id: string;
    team_id?: number | null;
    league_id?: number | null;
    slug?: string;
    parent_id?: string | null;
  };
  board_id?: string;
  post_number?: number;
  profiles?: Author;
  comment_count?: number;
}

export interface Author {
  id?: string;
  nickname: string | null;
  icon_id?: number | null;
  icon_url?: string | null;
}

export interface FileData {
  url: string;
  filename: string;
}

export interface IconData {
  id: number;
  image_url: string;
}

export interface FormattedPost {
  id: string;
  title: string;
  board_id: string;
  board_name: string;
  board_slug: string;
  post_number: number;
  created_at: string;
  views: number;
  likes: number;
  author_nickname: string;
  author_id?: string;
  comment_count: number;
  content?: string;
  team_id?: number | string | null;
  league_id?: number | string | null;
  team_logo?: string | null;
  league_logo?: string | null;
} 