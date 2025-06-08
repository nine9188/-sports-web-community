// 검색 관련 타입 정의
import { Json } from '@/shared/types/supabase'

export interface SearchResult {
  id: string
  title: string
  content?: string
  url: string
  score?: number
  type: 'post' | 'comment' | 'news' | 'team' | 'match'
  metadata: {
    author?: string
    authorId?: string
    authorIconId?: number | null
    boardName?: string
    boardSlug?: string
    createdAt?: string
    views?: number
    likes?: number
    postNumber?: number
    [key: string]: string | number | boolean | null | undefined
  }
}

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
}

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
}

export interface SearchFilters {
  type?: 'all' | 'posts' | 'comments' | 'news' | 'teams'
  boardId?: string
  dateRange?: {
    from: string
    to: string
  }
  sortBy?: 'relevance' | 'date' | 'views' | 'likes'
}

export interface SearchResponse {
  query: string
  totalResults: number
  results: SearchResult[]
  suggestions?: string[]
  hasMore: boolean
}

export interface SearchParams {
  q?: string
  type?: string
  board?: string
  sort?: string
  page?: string
} 