// 게시글 관련 타입 정의
import { Json } from '@/shared/types/supabase'; 
import { CommentType } from './comment';
import { FormattedPost } from './formatted';

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
  meta?: Json | null;
  source_url?: string | null;
  status?: string | null;
  tags?: string[] | null;
  updated_at?: string | null;
  profiles?: {
    id?: string;
    nickname: string | null;
    icon_id: number | null;
    level?: number;
  } | null;
  board?: {
    name: string;
  } | null;
  files?: Array<{
    url: string;
    filename: string;
  }>;
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