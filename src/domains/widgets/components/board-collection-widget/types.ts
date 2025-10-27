// 게시판 모음 위젯 타입 정의

export interface BoardPost {
  id: string;
  title: string;
  board_slug: string;
  post_number: number;
  created_at: string;
  content?: string;
  author_nickname: string;
  views: number;
  likes: number;
  comment_count: number;
}

export interface BoardInfo {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface BoardCollectionData {
  board: BoardInfo;
  posts: BoardPost[];
  featuredImages: string[]; // 대표 이미지 URL 배열 (최대 2개)
}
