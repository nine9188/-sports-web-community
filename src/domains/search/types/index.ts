// 검색 관련 타입 정의 (단순화)
import { Json } from '@/shared/types/supabase'

// 게시글 검색 결과 (서버 액션용)
export interface PostSearchResult {
  id: string
  title: string
  content: Json
  created_at: string | null
  views: number | null
  likes: number | null
  post_number: number
  board_id: string | null
  profiles: {
    nickname: string | null
    icon_id: number | null
  } | null
  boards: {
    name: string
    slug: string | null
  } | null
  // 추가 필드 (서버에서 계산)
  author_name?: string
  board_name?: string
  snippet?: string
}

// 댓글 검색 결과 (서버 액션용)
export interface CommentSearchResult {
  id: string
  content: Json
  created_at: string | null
  likes: number | null
  post_id: string
  profiles: {
    nickname: string | null
    icon_id: number | null
  } | null
  posts: {
    title: string
    post_number: number
    board_id: string | null
    boards: {
      name: string
      slug: string | null
    } | null
  } | null
  // 추가 필드 (서버에서 계산)
  author_name?: string
  post_title?: string
  board_name?: string
  snippet?: string
}

// 검색 파라미터
export interface SearchParams {
  query: string
  type?: 'all' | 'posts' | 'comments'
  sortBy?: 'latest' | 'views' | 'likes'
  limit?: number
  offset?: number
}

// 검색 응답
export interface SearchResponse {
  posts: PostSearchResult[]
  comments: CommentSearchResult[]
  totalCount: number
} 