// 게시판 모음 위젯 타입 정의

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
  recentPosts: BoardPost[]; // 최신 게시글 (왼쪽 열)
  popularPosts: BoardPost[]; // 인기 게시글 (오른쪽 열)
  featuredImages: string[]; // 대표 이미지 URL 배열 (최대 2개) - deprecated
}
