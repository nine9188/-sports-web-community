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

// 팀 검색 결과 (searchTeams.ts에서 가져옴)
export interface TeamSearchResult {
  id: string
  team_id: number
  name: string
  display_name: string
  short_name: string | null
  code: string | null
  logo_url: string | null
  league_id: number
  league_name: string
  league_name_ko: string
  country: string
  country_ko?: string
  venue_name: string | null
  venue_city: string | null
  current_position: number | null
  is_winner: boolean
  popularity_score: number
  // 한국어 매핑 관련 필드
  name_ko?: string
  name_en?: string
  is_korean_mapped?: boolean
}

// 검색 파라미터
export interface SearchParams {
  query: string
  type?: 'all' | 'posts' | 'comments' | 'teams'
  sortBy?: 'latest' | 'views' | 'likes'
  limit?: number
  offset?: number
}

// 페이지네이션 정보
export interface PaginationInfo {
  total: number
  hasMore: boolean
}

// 검색 응답
export interface SearchResponse {
  posts: PostSearchResult[]
  comments: CommentSearchResult[]
  teams: TeamSearchResult[]
  totalCount: number
  pagination: {
    posts: PaginationInfo
    comments: PaginationInfo
    teams: PaginationInfo
  }
} 