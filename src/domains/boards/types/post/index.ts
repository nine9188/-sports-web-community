// 게시글 관련 타입 정의
import { Json } from '@/shared/types/supabase';
import { CommentType } from './comment';
import { FormattedPost } from './formatted';

// 공지사항 타입
export type NoticeType = 'global' | 'board';

export interface Post {
  id: string;
  title: string;
  content: Json;
  user_id: string;
  created_at: string | null;
  board_id: string | null;
  post_number: number;
  views?: number | null;
  likes?: number | null;
  dislikes?: number;
  category?: string;
  is_published?: boolean | null;
  is_hidden?: boolean;
  is_deleted?: boolean;
  meta?: Json | null;
  source_url?: string | null;
  status?: string | null;
  tags?: string[] | null;
  updated_at?: string | null;
  // 공지사항 관련 필드
  is_notice?: boolean;
  is_must_read?: boolean; // 필독 공지 여부
  notice_type?: NoticeType | null;
  notice_boards?: string[] | null; // 공지를 표시할 게시판 ID 배열 (다중 선택)
  notice_order?: number | null;
  notice_created_at?: string | null;
  profiles?: {
    id?: string;
    nickname: string | null;
    icon_id: number | null;
    level?: number;
  } | null;
  board?: {
    name: string;
    slug?: string;
  } | null;
  files?: Array<{
    url: string;
    filename: string;
  }>;
  // 추가 필드 (조인된 데이터)
  board_slug?: string;
  board_name?: string;
  formattedDate?: string;
  author_nickname?: string;
  author_icon_url?: string | null;
  author_level?: number;
  comment_count?: number;
  team_id?: string | number | null;
  league_id?: string | number | null;
}

export interface AdjacentPost {
  id: string;
  title: string;
  post_number: number;
}

export interface AdjacentPosts {
  prevPost: AdjacentPost | null;
  nextPost: AdjacentPost | null;
}

// 타입 재내보내기
export type { CommentType, FormattedPost }
export type { LayoutPost, ApiPost, PopularPost } from './layout' 