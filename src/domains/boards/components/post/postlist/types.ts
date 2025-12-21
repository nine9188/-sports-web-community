/**
 * PostList 컴포넌트 타입 정의
 */

/**
 * 게시글 variant 타입
 */
export type PostVariant = 'text' | 'image-table';

/**
 * 게시글 데이터 인터페이스
 */
export interface Post {
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
  author_level?: number;
  author_icon_id?: number | null;
  author_icon_url?: string | null;
  comment_count: number;
  content?: string;
  team_id?: string | number | null;
  league_id?: string | number | null;
  team_logo?: string | null;
  league_logo?: string | null;
  formattedDate?: string;
  is_hidden?: boolean;
  is_deleted?: boolean;
}

/**
 * PostList 메인 컴포넌트 Props
 */
export interface PostListProps {
  posts: Post[];
  loading?: boolean;
  showBoard?: boolean;
  currentPostId?: string;
  emptyMessage?: string;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  className?: string;
  maxHeight?: string;
  currentBoardId: string;
  variant?: PostVariant;
}

/**
 * 개별 PostItem 컴포넌트 Props
 */
export interface PostItemProps {
  post: Post;
  isLast?: boolean;
  currentPostId?: string;
  currentBoardId: string;
  showBoard: boolean;
  variant: PostVariant;
}

/**
 * 콘텐츠 타입 체크 결과
 */
export interface ContentTypeCheck {
  hasImage: boolean;
  hasVideo: boolean;
  hasYoutube: boolean;
  hasLink: boolean;
}
